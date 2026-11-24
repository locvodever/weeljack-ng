/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  provideWeeljack,
  type WjMenuItem,
  type WjMenuItemCommandEvent,
  type WjTranslation,
} from 'weeljack-ng';
import { WjBreadcrumb, type WjBreadcrumbPt } from 'weeljack-ng/breadcrumb';
import { WjBreadcrumbHarness } from 'weeljack-ng/breadcrumb/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** The trail every spec starts from: three links, the last one the current page. */
const trail = (): WjMenuItem[] => [
  { label: 'Docs', url: '#docs' },
  { label: 'Menu', url: '#menu' },
  { label: 'Breadcrumb' },
];

/** A consumer's template: a button before the trail, so Tab has somewhere to start. */
@Component({
  selector: 'wj-breadcrumb-host',
  imports: [WjBreadcrumb],
  template: `
    <button id="before" type="button">Before</button>
    <p id="neutral">Neutral</p>
    <wj-breadcrumb
      [model]="model()"
      [home]="home()"
      [homeAriaLabel]="homeAriaLabel()"
      [ariaLabel]="ariaLabel()"
      [pt]="pt()"
    />
  `,
})
class Host {
  readonly model = signal<WjMenuItem[]>(trail());
  readonly home = signal<WjMenuItem | undefined>({ url: '#home' });
  readonly homeAriaLabel = signal<string | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly pt = signal<WjBreadcrumbPt>(undefined);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-breadcrumb-aria-on-host-host',
  imports: [WjBreadcrumb],
  template: `<wj-breadcrumb aria-label="Trail" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = trail();
}

/** A breadcrumb rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-breadcrumb-unprovided-host',
  imports: [WjBreadcrumb],
  template: `<wj-breadcrumb [model]="model" />`,
})
class UnprovidedHost {
  readonly model = trail();
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const links = (): HTMLAnchorElement[] => [
  ...document.querySelectorAll<HTMLAnchorElement>('a[data-pc-section="itemlink"]'),
];
const separators = (): number =>
  document.querySelectorAll('li[data-pc-section="separator"]').length;
const nav = (): HTMLElement => find(document, 'nav', HTMLElement);
const homeLink = (): HTMLAnchorElement =>
  find(document, '[data-pc-section="homeitem"] a', HTMLAnchorElement);
const glyph = (): SVGElement => find(homeLink(), '[data-pc-section="itemicon"]', SVGElement);
const colourOf = (element: Element): string => getComputedStyle(element).color;

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation?: WjTranslation,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideWeeljack({ darkMode: 'class', ...(translation && { translation }) }),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjBreadcrumbHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjBreadcrumbHarness);

/** A command that keeps a click from navigating the test page, and records its event. */
const stay =
  (record: (event: WjMenuItemCommandEvent) => void = () => undefined) =>
  (event: WjMenuItemCommandEvent): void => {
    event.originalEvent.preventDefault();
    record(event);
  };

describe('WjBreadcrumb', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  describe('inputs', () => {
    it('model renders the trail after the home glyph, the last item the current page', async () => {
      const { fixture } = await render();
      const breadcrumb = await harnessOf(fixture);

      expect(await breadcrumb.hasHome()).toBe(true);
      expect(await breadcrumb.getItemLabels()).toEqual(['Docs', 'Menu', 'Breadcrumb']);
      expect(await breadcrumb.getCurrentLabel()).toBe('Breadcrumb');
      expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
      expect(separators()).toBe(3);
    });

    it('follows a new array and a new home', async () => {
      const { fixture, component } = await render();
      const breadcrumb = await harnessOf(fixture);

      component.model.set([{ label: 'A', url: '#a' }, { label: 'B' }]);
      component.home.set(undefined);
      await fixture.whenStable();

      expect(await breadcrumb.hasHome()).toBe(false);
      expect(await breadcrumb.getItemLabels()).toEqual(['A', 'B']);
      expect(separators()).toBe(1);
    });

    it('leaves out an item with visible false and moves the current page to the last visible one', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Docs', url: '#docs' },
          { label: 'Menu', url: '#menu' },
          { label: 'Hidden', visible: false },
        ]);
      });
      const breadcrumb = await harnessOf(fixture);

      expect(await breadcrumb.getItemLabels()).toEqual(['Docs', 'Menu']);
      expect(await breadcrumb.getCurrentLabel()).toBe('Menu');
      // Optimus puts a separator after every item but the last of the array: a hidden last item
      // would leave one dangling after "Menu". The home's, one after "Docs": 2, not 3.
      expect(separators()).toBe(2);
    });

    it('draws nothing with no home and no visible items: no nav, no tab stop', async () => {
      const { fixture, element } = await render((host) => {
        host.home.set(undefined);
        host.model.set([{ label: 'Hidden', visible: false }]);
      });
      const breadcrumb = await harnessOf(fixture);

      expect(element.querySelector('p-breadcrumb')).toBeNull();
      expect(document.querySelector('nav')).toBeNull();
      expect(await breadcrumb.hasHome()).toBe(false);
      expect(await breadcrumb.getName()).toBe('');
      expect(await breadcrumb.getItems()).toEqual([]);
      expect(getComputedStyle(find(element, 'wj-breadcrumb', HTMLElement)).display).toBe('block');
    });

    it('with a home and no items draws the home link and no dangling separator', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([]);
      });
      const breadcrumb = await harnessOf(fixture);

      expect(await breadcrumb.hasHome()).toBe(true);
      expect(await breadcrumb.getItems()).toEqual([]);
      expect(separators()).toBe(0);

      // Items that are all hidden are no items either.
      component.model.set([{ label: 'Hidden', visible: false }]);
      await fixture.whenStable();
      expect(separators()).toBe(0);
    });

    it('with items and no home draws no leading separator', async () => {
      const { fixture } = await render((host) => {
        host.home.set(undefined);
      });

      expect(await (await harnessOf(fixture)).hasHome()).toBe(false);
      expect(separators()).toBe(2);
    });

    it('a home item with visible false is no home and leaves no separator before the trail', async () => {
      const { fixture } = await render((host) => {
        host.home.set({ url: '#home', visible: false });
      });

      expect(await (await harnessOf(fixture)).hasHome()).toBe(false);
      expect(separators()).toBe(2);
    });

    it('names a glyph-only home link "Home", from the translation', async () => {
      const { fixture } = await render();
      const breadcrumb = await harnessOf(fixture);

      expect(homeLink().getAttribute('aria-label')).toBe('Home');
      expect(await breadcrumb.getHomeName()).toBe('Home');
      expect(homeLink().textContent.trim()).toBe('');
    });

    it('names a home link with a label by that label, and sets no aria-label', async () => {
      const { fixture } = await render((host) => {
        host.home.set({ label: 'Start', url: '#home' });
      });

      expect(homeLink().hasAttribute('aria-label')).toBe(false);
      expect(await (await harnessOf(fixture)).getHomeName()).toBe('Start');
    });

    it('homeAriaLabel names the home link, and follows a change', async () => {
      const { fixture, component } = await render((host) => {
        host.homeAriaLabel.set('Back to start');
      });
      const breadcrumb = await harnessOf(fixture);

      expect(await breadcrumb.getHomeName()).toBe('Back to start');

      component.homeAriaLabel.set(undefined);
      await fixture.whenStable();
      expect(await breadcrumb.getHomeName()).toBe('Home');
    });

    it('reads the strings the app’s translation sets, and falls back to English for the rest', async () => {
      const { fixture } = await render(() => undefined, 'light', {
        wj: { breadcrumb: 'Đường dẫn', home: 'Trang chủ' },
      });
      const breadcrumb = await harnessOf(fixture);

      expect(await breadcrumb.getName()).toBe('Đường dẫn');
      expect(await breadcrumb.getHomeName()).toBe('Trang chủ');
    });

    it('names the nav "Breadcrumb" by default, and ariaLabel overrides it', async () => {
      const { fixture, component } = await render();
      const breadcrumb = await harnessOf(fixture);

      expect(nav().getAttribute('aria-label')).toBe('Breadcrumb');
      expect(await breadcrumb.getName()).toBe('Breadcrumb');
      expect(await harnessOf(fixture)).toBeInstanceOf(WjBreadcrumbHarness);
      await expect(
        TestbedHarnessEnvironment.loader(fixture).getHarness(
          WjBreadcrumbHarness.with({ name: 'Breadcrumb' }),
        ),
      ).resolves.toBeDefined();

      component.ariaLabel.set('You are here');
      await fixture.whenStable();
      expect(nav().getAttribute('aria-label')).toBe('You are here');
      await expect(
        TestbedHarnessEnvironment.loader(fixture).getHarness(
          WjBreadcrumbHarness.with({ name: /here$/ }),
        ),
      ).resolves.toBeDefined();
    });

    it('the nav is the only landmark, and the host carries no role', async () => {
      const { element } = await render();

      expect(document.querySelectorAll('nav')).toHaveLength(1);
      expect(find(element, 'wj-breadcrumb', HTMLElement).getAttributeNames()).not.toContain('role');
    });
  });

  describe('items', () => {
    it('a link item exposes its href, and the current page has none', async () => {
      const { fixture } = await render();
      const [docs, menu, current] = await (await harnessOf(fixture)).getItems();

      expect(await docs?.getHref()).toBe('#docs');
      expect(await menu?.isCurrent()).toBe(false);
      expect(await current?.isCurrent()).toBe(true);
      expect(await current?.getHref()).toBeNull();
    });

    it('routes a routerLink item through the app’s router', async () => {
      const { fixture } = await render((host) => {
        host.home.set({ routerLink: '/' });
        host.model.set([
          { label: 'Docs', routerLink: ['/components', 'menu'] },
          { label: 'Breadcrumb' },
        ]);
      });
      const [docs] = await (await harnessOf(fixture)).getItems();

      expect(homeLink().getAttribute('href')).toBe('/');
      expect(await docs?.getHref()).toBe('/components/menu');
    });

    it('a command receives { originalEvent, item } with the app’s own item, and no index', async () => {
      const received: WjMenuItemCommandEvent[] = [];
      const docs: WjMenuItem = {
        label: 'Docs',
        url: '#docs',
        command: stay((e) => received.push(e)),
      };
      const { fixture } = await render((host) => {
        host.model.set([docs, { label: 'Menu' }]);
      });

      await (await harnessOf(fixture)).clickItem('Docs');

      expect(received).toHaveLength(1);
      expect(Object.keys(received[0] ?? {}).sort()).toEqual(['item', 'originalEvent']);
      expect(received[0]?.item).toBe(docs);
      expect(received[0]?.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('the home item goes through the mapper: its command gets the narrowed event and the app’s own item', async () => {
      const received: WjMenuItemCommandEvent[] = [];
      const home: WjMenuItem = { url: '#home', command: stay((e) => received.push(e)) };
      const { fixture } = await render((host) => {
        host.home.set(home);
      });

      await (await harnessOf(fixture)).clickHome();

      expect(received).toHaveLength(1);
      expect(Object.keys(received[0] ?? {}).sort()).toEqual(['item', 'originalEvent']);
      expect(received[0]?.item).toBe(home);
    });

    it('a disabled item does nothing: no command, no navigation, and it reports it', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Docs', url: '#docs', disabled: true, command: run },
          { label: 'Current' },
        ]);
      });
      const [docs, current] = await (await harnessOf(fixture)).getItems();

      await docs?.click();

      expect(run).not.toHaveBeenCalled();
      expect(location.hash).toBe('');
      expect(await docs?.isDisabled()).toBe(true);
      expect(await current?.isDisabled()).toBe(false);
    });

    it('a command-only item is not a link: no href, and clicking it does not navigate', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'Docs', command: run }, { label: 'Current' }]);
      });
      const breadcrumb = await harnessOf(fixture);
      const [docs] = await breadcrumb.getItems();

      await breadcrumb.clickItem('Docs');

      expect(await docs?.getHref()).toBeNull();
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe('pt', () => {
    it('reaches the parts', async () => {
      await render((host) => {
        host.pt.set({
          list: { 'data-from-pt': 'list' },
          itemLink: { 'data-from-pt': 'link' },
          separatorIcon: { 'data-from-pt': 'icon' },
        });
      });

      expect(find(document, 'ol', HTMLElement).getAttribute('data-from-pt')).toBe('list');
      expect(links().every((link) => link.getAttribute('data-from-pt') === 'link')).toBe(true);
      expect(
        find(document, '[data-pc-section="separator"] svg', SVGElement).getAttribute(
          'data-from-pt',
        ),
      ).toBe('icon');
    });

    it('keeps the consumer’s other root keys beside the routed name, and a routed name wins a clash', async () => {
      const { component, fixture } = await render((host) => {
        host.pt.set({ root: { 'data-kept': 'yes', 'aria-label': 'From pt' } });
      });

      expect(nav().getAttribute('data-kept')).toBe('yes');
      expect(nav().getAttribute('aria-label')).toBe('Breadcrumb');

      component.ariaLabel.set('Routed');
      await fixture.whenStable();
      expect(nav().getAttribute('aria-label')).toBe('Routed');
      expect(nav().getAttribute('data-kept')).toBe('yes');
    });

    it('accepts the function form of pt', async () => {
      await render((host) => {
        host.pt.set(() => ({ root: { 'data-kept': 'fn' } }));
      });

      expect(nav().getAttribute('data-kept')).toBe('fn');
      expect(nav().getAttribute('aria-label')).toBe('Breadcrumb');
    });
  });

  describe('the app’s objects', () => {
    it('never changes the model, the home or their items', async () => {
      const items: WjMenuItem[] = [
        { label: 'Docs', url: '#docs', command: stay() },
        { label: 'Current' },
      ];
      const home: WjMenuItem = { url: '#home', command: stay() };
      const before = JSON.stringify([items, home]);
      const { fixture } = await render((host) => {
        host.model.set(items);
        host.home.set(home);
      });
      const breadcrumb = await harnessOf(fixture);

      await breadcrumb.clickItem('Docs');
      await breadcrumb.clickHome();

      expect(JSON.stringify([items, home])).toBe(before);
      expect(items).toHaveLength(2);
      for (const item of [...items, home]) {
        expect(item).not.toHaveProperty('escape');
        expect(item).not.toHaveProperty('id');
        expect(item).not.toHaveProperty('expanded');
      }
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0003 once for aria-* on the host, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain('WJ0003: wj-breadcrumb:');
      expect(String(warn.mock.calls[0]?.[0])).toContain('ariaLabel input');
      expect(
        find(fixture.nativeElement as HTMLElement, 'nav', HTMLElement).getAttribute('aria-label'),
      ).toBe('Breadcrumb');
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(UnprovidedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-breadcrumb:')),
      ).toBe(true);
    });
  });

  describe('rendering safety', () => {
    const expectNoInjection = (): void => {
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('renders a root item label as text', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: PAYLOAD, url: '#x' }, { label: `${PAYLOAD} last` }]);
      });

      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual([
        PAYLOAD,
        `${PAYLOAD} last`,
      ]);
      expect(document.body.textContent).toContain(PAYLOAD);
      expectNoInjection();
    });

    it('renders a router-linked item label as text', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: PAYLOAD, routerLink: '/x' }, { label: 'Last' }]);
      });

      expect((await (await harnessOf(fixture)).getItemLabels())[0]).toBe(PAYLOAD);
      expectNoInjection();
    });

    it('renders the home label as text, router-linked or not', async () => {
      const { fixture, component } = await render((host) => {
        host.home.set({ label: PAYLOAD, url: '#home' });
      });
      const breadcrumb = await harnessOf(fixture);

      expect(await breadcrumb.getHomeName()).toBe(PAYLOAD);
      expectNoInjection();

      component.home.set({ label: PAYLOAD, routerLink: '/' });
      await fixture.whenStable();
      expect(await breadcrumb.getHomeName()).toBe(PAYLOAD);
      expectNoInjection();
    });

    it('renders homeAriaLabel and ariaLabel as attribute text', async () => {
      await render((host) => {
        host.homeAriaLabel.set(PAYLOAD);
        host.ariaLabel.set(PAYLOAD);
      });

      expect(homeLink().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(nav().getAttribute('aria-label')).toBe(PAYLOAD);
      expectNoInjection();
    });

    it('renders as text an object that also carries escape: false, styleClass, tooltipOptions and icon', async () => {
      const wider = {
        label: PAYLOAD,
        url: '#x',
        escape: false,
        styleClass: 'smuggled',
        tooltipOptions: { escape: false },
        icon: 'pi pi-smuggled',
      };
      const smuggled: WjMenuItem = wider;
      const { fixture } = await render((host) => {
        host.home.set(smuggled);
        host.model.set([smuggled, { label: 'Last' }]);
      });

      expect((await (await harnessOf(fixture)).getItemLabels())[0]).toBe(PAYLOAD);
      expect(document.body.textContent).toContain(PAYLOAD);
      expect(document.querySelector('.smuggled, .pi-smuggled')).toBeNull();
      expect(document.querySelector('[data-pc-section="itemicon"]')?.tagName.toLowerCase()).toBe(
        'svg',
      );
      expectNoInjection();
    });
  });

  describe('hit boxes and look', () => {
    it('every link, the home glyph’s included, is at least 24 x 24 px', async () => {
      await render();

      const all = links();
      expect(all.length).toBe(4);
      for (const link of all) {
        const { width, height } = link.getBoundingClientRect();
        expect(width).toBeGreaterThanOrEqual(24);
        expect(height).toBeGreaterThanOrEqual(24);
      }
    });

    it('the glyph-only home link is a 24 px box with the 16 px glyph centred in it', async () => {
      await render();

      const box = homeLink().getBoundingClientRect();
      const icon = glyph().getBoundingClientRect();
      expect(box.width).toBeCloseTo(24, 0);
      expect(box.height).toBeCloseTo(24, 0);
      expect(icon.width).toBeCloseTo(16, 0);
      expect(icon.left + icon.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
      expect(icon.top + icon.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
    });

    it('a short label sits centred in its 24 px box', async () => {
      await render((host) => {
        host.model.set([{ label: 'I', url: '#i' }, { label: 'Current' }]);
      });

      const first = links()[0];
      expect(first?.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
      expect(first ? getComputedStyle(first).justifyContent : '').toBe('center');
    });

    it('keeps Optimus’s trail: a block host, 16 px padding, links without underline', async () => {
      const { element } = await render();

      expect(getComputedStyle(find(element, 'wj-breadcrumb', HTMLElement)).display).toBe('block');
      expect(getComputedStyle(nav()).paddingInlineStart).toBe('16px');
      expect(getComputedStyle(links()[0] ?? nav()).textDecorationLine).toBe('none');
    });

    describe.each<{ scheme: Scheme; rest: string; hover: string }>([
      // zinc.500 / zinc.700 in light (the preset’s fix over Aura’s zinc.400), Aura’s zinc.500 /
      // zinc.400 in dark.
      { scheme: 'light', rest: 'rgb(113, 113, 122)', hover: 'rgb(63, 63, 70)' },
      { scheme: 'dark', rest: 'rgb(113, 113, 122)', hover: 'rgb(161, 161, 170)' },
    ])('the home glyph, $scheme', ({ scheme, rest, hover }) => {
      it('is the preset’s colour at rest and darkens or lightens on hover', async () => {
        await render(() => undefined, scheme);
        // The pointer is page-wide: park it on a neutral element before reading a hoverable colour.
        await userEvent.hover(find(document, '#neutral', HTMLElement));
        await expect.poll(() => colourOf(glyph())).toBe(rest);

        await userEvent.hover(homeLink());
        await expect.poll(() => colourOf(glyph())).toBe(hover);

        await userEvent.hover(find(document, '#neutral', HTMLElement));
        await expect.poll(() => colourOf(glyph())).toBe(rest);
      });
    });
  });

  describe('keyboard', () => {
    /** The focused link's text, or its `aria-label` for the glyph-only home link. */
    const focused = (): string => {
      const link = document.activeElement;
      const text = link?.textContent.trim() ?? '';
      return text === '' ? (link?.getAttribute('aria-label') ?? '') : text;
    };

    async function tabFromBefore(): Promise<void> {
      find(document, '#before', HTMLElement).focus();
      await userEvent.tab();
    }

    it('Tab moves through the links in order, the home link first, then leaves', async () => {
      await render();
      await tabFromBefore();
      expect(focused()).toBe('Home');

      await userEvent.tab();
      expect(focused()).toBe('Docs');
      await userEvent.tab();
      expect(focused()).toBe('Menu');
      // The current page has no link: it is not a stop, so the next Tab leaves the trail.
      await userEvent.tab();
      expect(document.querySelector('nav')?.contains(document.activeElement)).toBe(false);
      expect(focused()).not.toBe('Breadcrumb');
    });

    it('a current page that is a link keeps its Tab stop', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Docs', url: '#docs' },
          { label: 'Menu', url: '#menu' },
          { label: 'Breadcrumb', url: '#here' },
        ]);
      });
      await tabFromBefore();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();

      expect(focused()).toBe('Breadcrumb');
      expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
      expect(document.activeElement?.getAttribute('tabindex')).toBe('0');
    });

    it('a current page that is a routerLink keeps its Tab stop', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Docs', url: '#docs' },
          { label: 'Here', routerLink: '/here' },
        ]);
      });
      await tabFromBefore();
      await userEvent.tab();
      await userEvent.tab();

      expect(focused()).toBe('Here');
    });

    it('takes the link-less current page out of the Tab order and routes no key onto the other links', async () => {
      await render();

      const current = links().at(-1);
      expect(current?.textContent.trim()).toBe('Breadcrumb');
      expect(current?.getAttribute('tabindex')).toBe('-1');
      expect(current?.getAttribute('aria-current')).toBe('page');
      expect(current?.hasAttribute('aria-disabled')).toBe(false);
      // The home link and the other items keep Optimus's own stop, and carry no aria-disabled.
      for (const link of links().slice(0, -1)) {
        expect(link.getAttribute('tabindex')).toBe('0');
        expect(link.hasAttribute('aria-disabled')).toBe(false);
      }
    });

    it('moves the current page to the last visible item, and a hidden one is no stop', async () => {
      const { fixture, component } = await render();

      component.model.set([
        { label: 'Docs', url: '#docs' },
        { label: 'Menu' },
        { label: 'Hidden', visible: false },
      ]);
      await fixture.whenStable();

      const stops = links().map((link) => [link.textContent.trim(), link.getAttribute('tabindex')]);
      expect(stops).toEqual([
        ['', '0'],
        ['Docs', '0'],
        ['Menu', '-1'],
      ]);
    });

    it('a consumer pt.itemLink key still lands beside the routed ones, as an object, a function or a class', async () => {
      const { fixture, component } = await render((host) => {
        host.pt.set({ itemLink: { 'data-from-pt': 'link' } });
      });

      expect(links().every((link) => link.getAttribute('data-from-pt') === 'link')).toBe(true);
      expect(homeLink().getAttribute('data-from-pt')).toBe('link');
      expect(links().at(-1)?.getAttribute('tabindex')).toBe('-1');

      component.pt.set(() => ({ itemLink: () => ({ 'data-from-pt': 'fn' }) }));
      await fixture.whenStable();
      expect(links().every((link) => link.getAttribute('data-from-pt') === 'fn')).toBe(true);
      expect(links().at(-1)?.getAttribute('tabindex')).toBe('-1');

      component.pt.set({ itemLink: 'from-class' });
      await fixture.whenStable();
      expect(links().every((link) => link.classList.contains('from-class'))).toBe(true);
      expect(links().at(-1)?.getAttribute('tabindex')).toBe('-1');
    });

    it('a disabled item with no link is not a Tab stop', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Docs', disabled: true },
          { label: 'Menu', url: '#menu' },
          { label: 'Current' },
        ]);
      });
      await tabFromBefore();
      await userEvent.tab();

      expect(focused()).toBe('Menu');
    });

    /**
     * Records the link every click reaches, in the capture phase, and keeps the page where it is:
     * a hash link in the test page would navigate it. `prevented` reads the click again after
     * Optimus has handled it.
     */
    function recordClicks(): { links: string[]; prevented: boolean[] } {
      const seen = { links: [] as string[], prevented: [] as boolean[] };
      const keepStill = (event: Event): void => {
        const link = event.target instanceof Element ? event.target.closest('a') : null;
        if (link) {
          seen.links.push(link.getAttribute('aria-label') ?? link.textContent.trim());
          event.preventDefault();
        }
      };
      document.addEventListener('click', keepStill, { capture: true });
      cleanups.push(() => {
        document.removeEventListener('click', keepStill, { capture: true });
      });
      return seen;
    }

    const cleanups: (() => void)[] = [];
    afterEach(() => {
      cleanups.splice(0).forEach((cleanup) => {
        cleanup();
      });
    });

    it('a disabled item with a url is announced disabled and is not a Tab stop, and does nothing', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Docs', url: '#docs', disabled: true, command: run },
          { label: 'Menu', url: '#menu' },
          { label: 'Current' },
        ]);
      });
      const docs = links()[1];

      expect(docs?.getAttribute('aria-disabled')).toBe('true');
      expect(docs?.getAttribute('tabindex')).toBe('-1');
      // Optimus still renders the href: the link is announced, not removed.
      expect(docs?.getAttribute('href')).toBe('#docs');
      await tabFromBefore();
      await userEvent.tab();
      expect(focused()).toBe('Menu');
      expect(await (await (await harnessOf(fixture)).getItems())[0]?.isFocused()).toBe(false);

      // A click reaches Optimus, which prevents the default: nothing runs, nothing follows.
      let defaultPrevented: boolean | undefined;
      const read = (event: Event): void => {
        defaultPrevented = event.defaultPrevented;
      };
      document.addEventListener('click', read);
      cleanups.push(() => {
        document.removeEventListener('click', read);
      });
      docs?.click();

      expect(defaultPrevented).toBe(true);
      expect(location.hash).toBe('');
      expect(run).not.toHaveBeenCalled();
    });

    it('a disabled routerLink item is announced disabled and is not a Tab stop', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Docs', routerLink: '/docs', disabled: true },
          { label: 'Menu', url: '#menu' },
          { label: 'Current' },
        ]);
      });
      const docs = links()[1];

      expect(docs?.getAttribute('aria-disabled')).toBe('true');
      expect(docs?.getAttribute('tabindex')).toBe('-1');
      await tabFromBefore();
      await userEvent.tab();

      expect(focused()).toBe('Menu');
    });

    it('a disabled home link is announced disabled and is not a Tab stop', async () => {
      await render((host) => {
        host.home.set({ url: '#home', disabled: true });
      });

      expect(homeLink().getAttribute('aria-disabled')).toBe('true');
      expect(homeLink().getAttribute('tabindex')).toBe('-1');
      await tabFromBefore();

      expect(focused()).toBe('Docs');
    });

    it('a disabled item loses aria-disabled and gets its stop back when it is enabled again', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([{ label: 'Docs', url: '#docs', disabled: true }, { label: 'Current' }]);
      });
      expect(links()[1]?.getAttribute('aria-disabled')).toBe('true');

      component.model.set([{ label: 'Docs', url: '#docs' }, { label: 'Current' }]);
      await fixture.whenStable();

      expect(links()[1]?.hasAttribute('aria-disabled')).toBe(false);
      expect(links()[1]?.getAttribute('tabindex')).toBe('0');
    });

    it('Enter follows a link item, and the home link: each gets a click', async () => {
      await render();
      const clicks = recordClicks();
      await tabFromBefore();
      await userEvent.keyboard('{Enter}');
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      expect(clicks.links).toEqual(['Home', 'Docs']);
    });

    it('gap: Enter does not activate a command-only item, because it has no href', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([{ label: 'Docs', command: run }, { label: 'Current' }]);
      });
      const clicks = recordClicks();
      await tabFromBefore();
      await userEvent.tab();
      expect(focused()).toBe('Docs');

      await userEvent.keyboard('{Enter}');

      expect(clicks.links).toEqual([]);
      expect(run).not.toHaveBeenCalled();
    });

    it('a link item with a command and a url runs the command on Enter', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([{ label: 'Docs', url: '#docs', command: stay(run) }, { label: 'Current' }]);
      });
      await tabFromBefore();
      await userEvent.tab();
      expect(focused()).toBe('Docs');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => run.mock.calls.length).toBe(1);
    });

    it('shows the 2 px solid focus ring on the focused link', async () => {
      await render();
      await tabFromBefore();
      await userEvent.tab();

      const link = document.activeElement;
      expect(link?.textContent.trim()).toBe('Docs');
      await expect.poll(() => (link ? getComputedStyle(link).outlineWidth : '')).toBe('2px');
      expect(link ? getComputedStyle(link).outlineStyle : '').toBe('solid');
    });
  });

  describe('axe', () => {
    const states: { name: string; setup: (host: Host) => void }[] = [
      { name: 'home glyph and three items', setup: () => undefined },
      {
        name: 'a home item with a label',
        setup: (host) => {
          host.home.set({ label: 'Home', url: '#home' });
        },
      },
      {
        name: 'no home',
        setup: (host) => {
          host.home.set(undefined);
        },
      },
      {
        name: 'router-linked items',
        setup: (host) => {
          host.home.set({ routerLink: '/' });
          host.model.set([
            { label: 'Docs', routerLink: ['/components', 'menu'] },
            { label: 'Breadcrumb' },
          ]);
        },
      },
      {
        name: 'a home and no items',
        setup: (host) => {
          host.model.set([]);
        },
      },
    ];

    for (const scheme of ['light', 'dark'] as const) {
      for (const { name, setup } of states) {
        it(`has no axe violations: ${name}, ${scheme}`, async () => {
          const { element } = await render(setup, scheme);

          await expectNoAxeViolations(find(element, 'wj-breadcrumb', HTMLElement));
        });
      }

      it(`has no axe violations: a disabled item, ${scheme}`, async () => {
        const { element } = await render((host) => {
          host.model.set([
            { label: 'Docs', url: '#docs', disabled: true },
            { label: 'Menu', url: '#menu' },
            { label: 'Breadcrumb' },
          ]);
        }, scheme);

        await expectNoAxeViolations(find(element, 'wj-breadcrumb', HTMLElement));
      });
    }
  });
});
