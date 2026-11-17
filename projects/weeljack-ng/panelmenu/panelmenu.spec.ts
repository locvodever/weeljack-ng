/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjPanelMenu, WjPanelMenuItemSlot, type WjPanelMenuPt } from 'weeljack-ng/panelmenu';
import { WjPanelMenuHarness } from 'weeljack-ng/panelmenu/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const docsNav = (): WjMenuItem[] => [
  { label: 'Start', items: [{ label: 'Install' }, { label: 'Theming' }] },
  {
    label: 'Components',
    items: [
      { label: 'Buttons', items: [{ label: 'Button' }, { label: 'Toggle' }] },
      { label: 'Menus' },
    ],
  },
  { label: 'Help' },
];

/** One open panel holding an enabled and a disabled item. */
const withDisabled = (): WjMenuItem[] => [
  { label: 'Start', expanded: true, items: [{ label: 'On' }, { label: 'Off', disabled: true }] },
];

/** Every item of a model at any depth, in order, as the slot sees them. */
const flatten = (items: readonly WjMenuItem[]): WjMenuItem[] =>
  items.flatMap((item) => [item, ...flatten(item.items ?? [])]);

/** A consumer's template: one menu in its own `nav`, optionally with an item slot. */
@Component({
  selector: 'wj-panelmenu-host',
  imports: [WjPanelMenu, WjPanelMenuItemSlot],
  styles: `
    .stage {
      inline-size: 18rem;
      min-block-size: 24rem;
    }
  `,
  template: `
    <div class="stage">
      <button id="before" type="button">Before</button>
      <nav aria-label="Docs">
        <wj-panelmenu [model]="model()" [multiple]="multiple()" [pt]="pt()">
          @if (withSlot()) {
            <ng-template wjPanelMenuItem let-item>
              <span class="icon" aria-hidden="true"></span>
              <span class="text" [attr.data-index]="position(item)">{{ item.label }}</span>
            </ng-template>
          }
        </wj-panelmenu>
      </nav>
      <button id="after" type="button">After</button>
    </div>
  `,
})
class Host {
  readonly model = signal<WjMenuItem[]>(docsNav());
  readonly multiple = signal(false);
  readonly pt = signal<WjPanelMenuPt>(undefined);
  readonly withSlot = signal(false);
  readonly position = (item: WjMenuItem): number => flatten(this.model()).indexOf(item);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-panelmenu-aria-on-host-host',
  imports: [WjPanelMenu],
  template: `<wj-panelmenu aria-label="Docs" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = docsNav();
}

/** A menu rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-panelmenu-unprovided-host',
  imports: [WjPanelMenu],
  template: `<wj-panelmenu [model]="model" />`,
})
class UnprovidedHost {
  readonly model = docsNav();
}

/**
 * What axe reports of Optimus's own structure, listed on the docs page, and where: a parent that is
 * expanded keeps `aria-label` = its own label while its visible text includes the items nested in
 * it (`label-content-name-mismatch`). It is not reachable through `pt`.
 */
const OPTIMUS_STRUCTURE: Readonly<Record<string, (html: string) => boolean>> = {
  'label-content-name-mismatch': (html) => html.includes('aria-expanded="true"'),
};

/** Fails on any axe violation but that finding, and on that anywhere else. */
async function expectOnlyOptimusStructure(): Promise<void> {
  const untolerated = (await runAxe()).flatMap(({ id, nodes }) =>
    nodes
      .filter(({ html }) => OPTIMUS_STRUCTURE[id]?.(html) !== true)
      .map(({ html }) => `${id}: ${html}`),
  );

  expect(untolerated).toEqual([]);
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner reads
 * `window.matchMedia`. A CDP emulation would change the whole shared browser page, and with it every
 * spec file running beside this one.
 */
function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? reduce : value;
          },
        })
      : list;
  });
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The header of the panel labelled `label`. */
const headerEl = (label: string): HTMLElement =>
  find(document, `[data-pc-section="header"][aria-label="${label}"]`, HTMLElement);
/** The tree item labelled `label`. */
const itemEl = (label: string): HTMLElement =>
  find(document, `[role="treeitem"][aria-label="${label}"]`, HTMLElement);
const hostEl = (): HTMLElement => find(document, 'wj-panelmenu', HTMLElement);

/** Renders `Host` with `provideWeeljack` and a router, in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideWeeljack({ darkMode: 'class' })],
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

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjPanelMenuHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjPanelMenuHarness);

/** The label of whatever the keyboard is on: a header, or the tree's active item. */
const activeLabel = (): string => {
  const focused = document.querySelector('[role="treeitem"][data-p-focused="true"]');
  return (
    (focused ?? document.activeElement)?.getAttribute('aria-label') ??
    document.activeElement?.id ??
    ''
  );
};

/** Tabs onto the first header, with a bound. */
async function tabOntoMenu(): Promise<void> {
  for (let tabs = 0; tabs < 3 && document.activeElement !== firstHeader(); tabs++) {
    await userEvent.tab();
  }
  await expect.poll(() => document.activeElement === firstHeader()).toBe(true);
}

const firstHeader = (): Element | null => document.querySelector('[data-pc-section="header"]');

/**
 * Records every class list a panel's content container has from now on, so a spec can tell whether
 * its enter and leave motion ran. Call the returned function to stop and read them.
 */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('[data-pc-section="contentcontainer"]')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen];
  };
}

const motionClasses = (classes: string[]): string[] =>
  classes.filter((name) => /enter-active|leave-active/.test(name));

describe('WjPanelMenu', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an expand or a collapse then ends at once.
    reduceMotion(true);
  });

  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('model renders one collapsed panel per root item, and follows a new array', async () => {
      const { fixture, component } = await render();
      const menu = await harnessOf(fixture);

      expect(await menu.getPanelLabels()).toEqual(['Start', 'Components', 'Help']);
      for (const panel of await menu.getPanels()) {
        expect(await panel.isExpanded()).toBe(false);
      }
      expect(await menu.getItemLabels()).toEqual([]);

      component.model.set([{ label: 'Undo' }, { label: 'Redo' }]);
      await fixture.whenStable();
      expect(await menu.getPanelLabels()).toEqual(['Undo', 'Redo']);
    });

    it('with no items renders nothing: no box, no tab stop, a host with no height', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([]);
      });
      const menu = await harnessOf(fixture);

      expect(document.querySelector('p-panelmenu')).toBeNull();
      expect(document.querySelector('[role="tree"], [role="button"]')).toBeNull();
      expect(getComputedStyle(hostEl()).display).toBe('block');
      expect(hostEl().getBoundingClientRect().height).toBe(0);
      expect(await menu.getPanels()).toEqual([]);

      component.model.set(docsNav());
      await fixture.whenStable();
      expect(await menu.getPanelLabels()).toEqual(['Start', 'Components', 'Help']);
    });

    it('opens a panel on a click and shows its items, nested ones collapsed until opened', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      const [start, components] = await menu.getPanels();

      await components?.toggle();
      expect(await components?.isExpanded()).toBe(true);
      expect(await components?.getItemLabels()).toEqual(['Buttons', 'Menus']);

      await (await components?.getItems({ label: 'Buttons' }))?.[0]?.click();
      expect(await components?.getItemLabels()).toEqual(['Buttons', 'Button', 'Toggle', 'Menus']);
      expect(await start?.isExpanded()).toBe(false);
    });

    it('is single by default: opening a panel closes the open one', async () => {
      const { fixture } = await render();
      const [start, components] = await (await harnessOf(fixture)).getPanels();

      await start?.toggle();
      await components?.toggle();

      expect(await start?.isExpanded()).toBe(false);
      expect(await components?.isExpanded()).toBe(true);
    });

    it('multiple lets several panels stay open', async () => {
      const { fixture } = await render((host) => {
        host.multiple.set(true);
      });
      const [start, components] = await (await harnessOf(fixture)).getPanels();

      await start?.toggle();
      await components?.toggle();

      expect(await start?.isExpanded()).toBe(true);
      expect(await components?.isExpanded()).toBe(true);
      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual([
        'Install',
        'Theming',
        'Buttons',
        'Menus',
      ]);
    });

    it('expanded opens a panel and a nested parent at first render', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Components',
            expanded: true,
            items: [{ label: 'Buttons', expanded: true, items: [{ label: 'Button' }] }],
          },
          { label: 'Help' },
        ]);
      });
      const menu = await harnessOf(fixture);

      expect(await (await menu.getPanels())[0]?.isExpanded()).toBe(true);
      expect(await menu.getItemLabels()).toEqual(['Buttons', 'Button']);
    });

    it('keeps the open state until the app passes a new array, which resets it', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([
          { label: 'Open', expanded: true, items: [{ label: 'One' }] },
          { label: 'Shut', items: [{ label: 'Two' }] },
        ]);
      });
      const menu = await harnessOf(fixture);
      const [open, shut] = await menu.getPanels();

      await open?.toggle();
      await shut?.toggle();
      expect(await open?.isExpanded()).toBe(false);
      expect(await shut?.isExpanded()).toBe(true);

      // The same array again: nothing is rebuilt, the state stays.
      component.model.set(component.model());
      await fixture.whenStable();
      expect(await (await menu.getPanels())[1]?.isExpanded()).toBe(true);

      // A new array: back to the items' own `expanded`.
      component.model.update((items) => [...items]);
      await fixture.whenStable();
      const [open2, shut2] = await menu.getPanels();
      expect(await open2?.isExpanded()).toBe(true);
      expect(await shut2?.isExpanded()).toBe(false);
    });

    it('never changes the app’s objects when a panel opens or a parent expands', async () => {
      const items: WjMenuItem[] = [
        {
          label: 'Components',
          expanded: false,
          items: [{ label: 'Buttons', items: [{ label: 'Button' }] }],
        },
      ];
      const before = JSON.stringify(items);
      const { fixture } = await render((host) => {
        host.model.set(items);
      });
      const menu = await harnessOf(fixture);

      await (await menu.getPanels())[0]?.toggle();
      await menu.clickItem('Buttons');

      expect(await menu.getItemLabels()).toEqual(['Buttons', 'Button']);
      expect(JSON.stringify(items)).toBe(before);
      expect(items[0]?.expanded).toBe(false);
      expect(items[0]).not.toHaveProperty('escape');
      expect(items[0]?.items?.[0]).not.toHaveProperty('escape');
    });

    it('leaves out an item with visible false, draws a separator', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [
              { label: 'One' },
              { separator: true },
              { label: 'Hidden', visible: false },
              { label: 'Two' },
            ],
          },
          { label: 'Gone', visible: false },
        ]);
      });
      const menu = await harnessOf(fixture);

      expect(await menu.getPanelLabels()).toEqual(['Start']);
      expect(await menu.getItemLabels()).toEqual(['One', 'Two']);
      expect(document.querySelectorAll('[data-pc-section="separator"]')).toHaveLength(1);
    });

    it('a disabled panel and a disabled item report it and run nothing on a click', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Locked', disabled: true, command: run, items: [{ label: 'Inside' }] },
          {
            label: 'Start',
            expanded: true,
            items: [
              { label: 'Cut', command: run },
              { label: 'Paste', command: run, disabled: true },
            ],
          },
        ]);
      });
      const menu = await harnessOf(fixture);
      const [locked] = await menu.getPanels();
      const [cut, paste] = await menu.getItems();

      expect(await locked?.isDisabled()).toBe(true);
      expect(await paste?.isDisabled()).toBe(true);
      expect(await cut?.isDisabled()).toBe(false);

      await locked?.toggle();
      expect(await locked?.isExpanded()).toBe(false);
      await paste?.click();
      expect(run).not.toHaveBeenCalled();
      await cut?.click();
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('a url item is a real link, with its target', async () => {
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            url: 'https://example.com/start',
            items: [{ label: 'Docs', url: 'https://example.com/docs', target: '_blank' }],
          },
        ]);
      });

      const link = find(itemEl('Docs'), 'a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/docs');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(find(headerEl('Start'), 'a', HTMLAnchorElement).getAttribute('href')).toBe(
        'https://example.com/start',
      );
    });

    it('does not route: a routerLink item is no router link, and its command still runs', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Start',
            routerLink: '/start',
            fragment: 'top',
            queryParams: { a: 'b' },
            items: [
              {
                label: 'Docs',
                routerLink: '/docs',
                queryParams: { a: 'b' },
                fragment: 'x',
                command: run,
              },
            ],
          },
        ]);
      });
      await (await (await harnessOf(fixture)).getPanels())[0]?.toggle();

      const link = find(itemEl('Docs'), 'a', HTMLAnchorElement);
      expect(link.hasAttribute('href')).toBe(false);
      expect(find(headerEl('Start'), 'a', HTMLAnchorElement).hasAttribute('href')).toBe(false);
      await (await harnessOf(fixture)).clickItem('Docs');
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe('ARIA', () => {
    it('gives each header a button role named by its label, and each panel a tree', async () => {
      await render((host) => {
        host.model.set([{ label: 'Start', expanded: true, items: [{ label: 'Install' }] }]);
      });

      expect(headerEl('Start').getAttribute('role')).toBe('button');
      expect(headerEl('Start').getAttribute('aria-expanded')).toBe('true');
      expect(find(document, '[role="tree"]', HTMLElement)).toBeInstanceOf(HTMLElement);
      expect(itemEl('Install').getAttribute('role')).toBe('treeitem');
    });

    it('makes the bare list around each open panel’s tree presentational, and keeps it so', async () => {
      const { fixture, component } = await render();
      const menu = await harnessOf(fixture);
      const lists = (): HTMLElement[] => [
        ...document.querySelectorAll<HTMLElement>('ul[ppanelmenulist]'),
      ];
      const expectAllPresentational = (): void => {
        expect(lists().length).toBeGreaterThan(0);
        expect(lists().map((list) => list.getAttribute('role'))).toEqual(lists().map(() => 'none'));
      };

      const [start, components] = await menu.getPanels();
      await start?.toggle();
      expectAllPresentational();
      expect(find(lists()[0] ?? document, '[role="tree"]', HTMLElement)).toBeInstanceOf(
        HTMLElement,
      );

      await components?.toggle();
      expectAllPresentational();

      component.model.set([{ label: 'New', expanded: true, items: [{ label: 'One' }] }]);
      await fixture.whenStable();
      expectAllPresentational();
    });

    it('has no aria attribute on the host and no input for one', async () => {
      await render();

      expect(
        hostEl()
          .getAttributeNames()
          .filter((name) => name.startsWith('aria-')),
      ).toEqual([]);
      expect(find(document, 'nav', HTMLElement).getAttribute('aria-label')).toBe('Docs');
    });

    it('warns WJ0003 once for aria-* on the host, with the nav advice, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      const message = String(warn.mock.calls[0]?.[0]);
      expect(message).toContain('WJ0003: wj-panelmenu:');
      expect(message).toContain('Wrap the menu in your own <nav aria-label="..."> instead');
      expect(message).not.toContain('ariaLabel input');
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[aria-label="Docs"]')).toBe(
        element.querySelector('wj-panelmenu'),
      );
      expect(element.querySelector('p-panelmenu')?.getAttribute('aria-label')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(UnprovidedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-panelmenu:')),
      ).toBe(true);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Start', expanded: true, items: [{ label: 'Install' }, { separator: true }] },
        ]);
        host.pt.set({
          root: { 'data-from-pt': 'root' },
          panel: { 'data-from-pt': 'panel' },
          header: { 'data-from-pt': 'header' },
          headerContent: { 'data-from-pt': 'header-content' },
          headerLink: { 'data-from-pt': 'header-link' },
          headerLabel: { 'data-from-pt': 'header-label' },
          contentContainer: { 'data-from-pt': 'content-container' },
          content: { 'data-from-pt': 'content' },
          rootList: { 'data-from-pt': 'root-list' },
          item: { 'data-from-pt': 'item' },
          itemContent: { 'data-from-pt': 'item-content' },
          itemLink: { 'data-from-pt': 'item-link' },
          itemLabel: { 'data-from-pt': 'item-label' },
          separator: { 'data-from-pt': 'separator' },
        });
      });

      const from = (selector: string): string | null =>
        document.querySelector(selector)?.getAttribute('data-from-pt') ?? null;
      expect(from('[data-pc-section="root"]')).toBe('root');
      expect(from('[data-pc-section="panel"]')).toBe('panel');
      expect(from('[data-pc-section="header"]')).toBe('header');
      expect(from('[data-pc-section="headercontent"]')).toBe('header-content');
      expect(from('[data-pc-section="headerlink"]')).toBe('header-link');
      expect(from('[data-pc-section="headerlabel"]')).toBe('header-label');
      expect(from('[data-pc-section="contentcontainer"]')).toBe('content-container');
      expect(from('[data-pc-section="content"]')).toBe('content');
      expect(from('[data-pc-section="rootlist"]')).toBe('root-list');
      expect(from('[data-pc-section="item"]')).toBe('item');
      expect(from('[data-pc-section="itemcontent"]')).toBe('item-content');
      expect(from('[data-pc-section="itemlink"]')).toBe('item-link');
      expect(from('[data-pc-section="itemlabel"]')).toBe('item-label');
      expect(from('[data-pc-section="separator"]')).toBe('separator');
    });

    it('reaches a nested level’s submenu part', async () => {
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [{ label: 'Buttons', expanded: true, items: [{ label: 'Button' }] }],
          },
        ]);
        host.pt.set({ submenu: { 'data-from-pt': 'submenu' } });
      });

      expect(
        document.querySelector('[data-pc-section="submenu"]')?.getAttribute('data-from-pt'),
      ).toBe('submenu');
    });

    it('takes the function form', async () => {
      await render((host) => {
        host.pt.set(() => ({ root: { 'data-fn': 'yes' } }));
      });

      expect(find(document, '[data-pc-section="root"]', HTMLElement).getAttribute('data-fn')).toBe(
        'yes',
      );
    });

    it('draws a separator as presentational, so the tree holds only items', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Start', expanded: true, items: [{ label: 'One' }, { separator: true }] },
        ]);
      });

      const separator = find(document, '[data-pc-section="separator"]', HTMLElement);
      expect(separator.getAttribute('role')).toBe('none');
    });

    it('marks a disabled nested item aria-disabled, and an enabled one not', async () => {
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [{ label: 'On' }, { label: 'Off', disabled: true }],
          },
        ]);
      });

      expect(itemEl('Off').getAttribute('aria-disabled')).toBe('true');
      expect(itemEl('On').hasAttribute('aria-disabled')).toBe(false);
    });

    it('keeps a consumer’s item pt as an object beside the routed attributes', async () => {
      await render((host) => {
        host.model.set(withDisabled());
        host.pt.set({ item: { 'data-kept': 'yes' } });
      });

      expect(itemEl('On').getAttribute('data-kept')).toBe('yes');
      expect(itemEl('Off').getAttribute('data-kept')).toBe('yes');
      expect(itemEl('Off').getAttribute('aria-disabled')).toBe('true');
    });

    it('keeps a consumer’s item pt as a class string', async () => {
      await render((host) => {
        host.model.set(withDisabled());
        host.pt.set({ item: 'kept-class' });
      });

      expect(itemEl('On').classList.contains('kept-class')).toBe(true);
      expect(itemEl('Off').getAttribute('aria-disabled')).toBe('true');
    });

    it('keeps a consumer’s item pt as a function', async () => {
      await render((host) => {
        host.model.set(withDisabled());
        host.pt.set({ item: () => ({ 'data-kept': 'fn' }) });
      });

      expect(itemEl('On').getAttribute('data-kept')).toBe('fn');
      expect(itemEl('Off').getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('commands', () => {
    it('runs a header’s command with the click event and the app’s own item object', async () => {
      const received: WjMenuItemCommandEvent[] = [];
      const start: WjMenuItem = {
        label: 'Start',
        command: (event) => {
          received.push(event);
        },
        items: [{ label: 'Install' }],
      };
      const { fixture } = await render((host) => {
        host.model.set([start]);
      });

      await (await (await harnessOf(fixture)).getPanels())[0]?.toggle();

      expect(received).toHaveLength(1);
      expect(received[0]?.item).toBe(start);
      expect(received[0]?.originalEvent).toBeInstanceOf(Event);
    });

    it('runs a nested item’s command with the app’s own object, at any depth', async () => {
      const received: WjMenuItem[] = [];
      const button: WjMenuItem = {
        label: 'Button',
        command: ({ item }) => {
          received.push(item);
        },
      };
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Components',
            expanded: true,
            items: [{ label: 'Buttons', expanded: true, items: [button] }],
          },
        ]);
      });

      await (await harnessOf(fixture)).clickItem('Button');

      expect(received).toEqual([button]);
      expect(received[0]).toBe(button);
    });
  });

  describe('item slot', () => {
    it('renders the consumer’s template for every header and item, in place of the default label', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
        host.model.set([
          { label: 'Start', expanded: true, items: [{ label: 'Install' }, { label: 'Theming' }] },
        ]);
      });
      const menu = await harnessOf(fixture);

      expect(await menu.getPanelLabels()).toEqual(['Start']);
      expect(await menu.getItemLabels()).toEqual(['Install', 'Theming']);
      expect(document.querySelectorAll('.icon')).toHaveLength(3);
      expect(document.querySelector('[data-pc-section="itemlabel"]')).toBeNull();
      expect(document.querySelector('[data-pc-section="headerlabel"]')).toBeNull();
    });

    it('hands the app’s own item objects to the template, not copies', async () => {
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([
          { label: 'Start', expanded: true, items: [{ label: 'Install' }, { label: 'Theming' }] },
        ]);
      });

      // `indexOf` finds an item only by identity: -1 would mean the template got a copy.
      const indices = [...document.querySelectorAll('.text')].map((node) =>
        node.getAttribute('data-index'),
      );
      expect(indices).toEqual(['0', '1', '2']);
    });

    it('hands a slotted item’s command the app’s object too', async () => {
      const seen: unknown[] = [];
      const install: WjMenuItem = {
        label: 'Install',
        command: ({ item }) => {
          seen.push(item);
        },
      };
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Start', expanded: true, items: [install] }]);
      });

      await (await harnessOf(fixture)).clickItem('Install');

      expect(seen).toEqual([install]);
      expect(seen[0]).toBe(install);
    });

    it('keeps Optimus’s own rendering when no slot is given', async () => {
      await render();

      expect(document.querySelector('.icon')).toBeNull();
      expect(document.querySelector('[data-pc-section="headerlabel"]')).not.toBeNull();
    });

    it('wraps each slotted header and item in one link box that keeps the padding and size', async () => {
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Start', expanded: true, items: [{ label: 'Install' }] }]);
      });

      for (const link of [
        find(headerEl('Start'), 'a', HTMLAnchorElement),
        find(itemEl('Install'), 'a', HTMLAnchorElement),
      ]) {
        expect(link.classList.contains('p-panelmenu-item-link')).toBe(true);
        expect(link.getAttribute('data-pc-section')).toBe('itemlink');
        expect(link.getAttribute('tabindex')).toBe('-1');
        expect(link.hasAttribute('href')).toBe(false);
        expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
        expect(getComputedStyle(link).paddingLeft).toBe('12px');
        expect(getComputedStyle(link).paddingTop).toBe('8px');
      }
    });

    it('gives a slotted url item an href and a target', async () => {
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [{ label: 'Docs', url: 'https://example.com/', target: '_blank' }],
          },
        ]);
      });

      const link = find(itemEl('Docs'), 'a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('wraps a long slotted label instead of cutting it off', async () => {
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'A very long label that keeps going and going '.repeat(6) }]);
      });

      const text = find(document, '.text', HTMLElement);
      expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1);
      expect(text.getBoundingClientRect().height).toBeGreaterThan(20);
    });
  });

  describe('rendering safety', () => {
    const expectText = (payload: string): void => {
      expect(document.body.textContent).toContain(payload);
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('renders a panel header label as text', async () => {
      await render((host) => {
        host.model.set([{ label: PAYLOAD, items: [{ label: 'One' }] }]);
      });

      expectText(PAYLOAD);
    });

    it('renders a nested item label as text, at every level', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: `${PAYLOAD} panel`,
            expanded: true,
            items: [
              { label: `${PAYLOAD} item`, expanded: true, items: [{ label: `${PAYLOAD} leaf` }] },
            ],
          },
        ]);
      });

      expectText(`${PAYLOAD} panel`);
      expectText(`${PAYLOAD} item`);
      expectText(`${PAYLOAD} leaf`);
      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual([
        `${PAYLOAD} item`,
        `${PAYLOAD} leaf`,
      ]);
    });

    it('renders a nested item with a routerLink as text: Optimus would draw its label as HTML', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: PAYLOAD,
            routerLink: '/panel',
            expanded: true,
            items: [
              {
                label: `${PAYLOAD} routed`,
                routerLink: '/docs',
                queryParams: { a: 'b' },
                fragment: 'x',
              },
              {
                label: `${PAYLOAD} deep parent`,
                routerLink: '/deep',
                expanded: true,
                items: [{ label: `${PAYLOAD} deep leaf`, routerLink: ['/deep', 'leaf'] }],
              },
            ],
          },
        ]);
      });

      expectText(PAYLOAD);
      expectText(`${PAYLOAD} routed`);
      expectText(`${PAYLOAD} deep parent`);
      expectText(`${PAYLOAD} deep leaf`);
      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual([
        `${PAYLOAD} routed`,
        `${PAYLOAD} deep parent`,
        `${PAYLOAD} deep leaf`,
      ]);
    });

    it('renders as text an object that also carries escape: false, styleClass and tooltipOptions', async () => {
      const leaf = {
        label: `${PAYLOAD} leaf`,
        escape: false,
        routerLink: '/x',
        styleClass: 'smuggled',
      };
      const wider = {
        label: PAYLOAD,
        escape: false,
        styleClass: 'smuggled',
        tooltipOptions: { escape: false },
        expanded: true,
        items: [{ label: `${PAYLOAD} item`, escape: false, items: [leaf] }],
      };
      const smuggled: WjMenuItem = wider;
      await render((host) => {
        host.model.set([smuggled]);
      });

      expectText(PAYLOAD);
      expectText(`${PAYLOAD} item`);
      expectText(`${PAYLOAD} leaf`);
      expect(document.querySelector('.smuggled')).toBeNull();
    });

    it('renders a url as an attribute, never as markup', async () => {
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [
              {
                label: 'Docs',
                url: `https://example.com/"><img src=x onerror="window.wjInjected = true">`,
              },
            ],
          },
        ]);
      });

      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the first header, and a header is the panel’s one button stop', async () => {
      await render();

      await tabOntoMenu();
      expect(document.activeElement).toBe(headerEl('Start'));
      expect(headerEl('Start').getAttribute('tabindex')).toBe('0');
    });

    it('Tab moves from one header to the next', async () => {
      await render();
      await tabOntoMenu();

      await userEvent.tab();
      expect(document.activeElement).toBe(headerEl('Components'));
      await userEvent.tab();
      expect(document.activeElement).toBe(headerEl('Help'));
      await userEvent.tab();
      expect(document.activeElement?.id).toBe('after');
    });

    it('Enter and Space on a header open and close its panel', async () => {
      const { fixture } = await render();
      const [start] = await (await harnessOf(fixture)).getPanels();
      await tabOntoMenu();

      await userEvent.keyboard('{Enter}');
      expect(await start?.isExpanded()).toBe(true);
      await userEvent.keyboard('{Enter}');
      expect(await start?.isExpanded()).toBe(false);
      await userEvent.keyboard(' ');
      expect(await start?.isExpanded()).toBe(true);
      await userEvent.keyboard(' ');
      expect(await start?.isExpanded()).toBe(false);
    });

    it('Arrow Down and Arrow Up move between headers, and from a closed header skip its items', async () => {
      await render();
      await tabOntoMenu();

      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel()).toBe('Components');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel()).toBe('Help');
      await userEvent.keyboard('{ArrowUp}');
      expect(activeLabel()).toBe('Components');
    });

    it('Arrow Down on an open header moves into its items, and Arrow Down and Up move inside', async () => {
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [{ label: 'Install' }, { label: 'Off', disabled: true }, { label: 'Theming' }],
          },
          { label: 'Help' },
        ]);
      });
      await tabOntoMenu();

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Install');
      expect(document.activeElement?.getAttribute('role')).toBe('tree');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Theming');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Install');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => document.activeElement).toBe(headerEl('Start'));
    });

    it('Arrow Down past the last item moves on to the next header', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Start', expanded: true, items: [{ label: 'Install' }] },
          { label: 'Help' },
        ]);
      });
      await tabOntoMenu();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      await expect.poll(() => document.activeElement).toBe(headerEl('Help'));
    });

    it('Enter and Space on a nested parent show and hide its items', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Components',
            expanded: true,
            items: [{ label: 'Buttons', items: [{ label: 'Button' }] }, { label: 'Menus' }],
          },
        ]);
      });
      const menu = await harnessOf(fixture);
      await tabOntoMenu();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Buttons');

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => menu.getItemLabels()).toEqual(['Buttons', 'Button', 'Menus']);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Button');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Buttons');
      await userEvent.keyboard(' ');
      await expect.poll(() => menu.getItemLabels()).toEqual(['Buttons', 'Menus']);
    });

    it('Arrow Right marks a nested parent expanded without showing its items (Optimus gap)', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Components',
            expanded: true,
            items: [{ label: 'Buttons', items: [{ label: 'Button' }] }],
          },
        ]);
      });
      const menu = await harnessOf(fixture);
      await tabOntoMenu();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Buttons');

      await userEvent.keyboard('{ArrowRight}');

      await expect.poll(() => itemEl('Buttons').getAttribute('aria-expanded')).toBe('true');
      expect(await menu.getItemLabels()).toEqual(['Buttons']);
    });

    it('Home and End jump to the first and last item of the open tree', async () => {
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }],
          },
        ]);
      });
      await tabOntoMenu();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('One');

      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Three');
      await userEvent.keyboard('{Home}');
      await expect.poll(activeLabel).toBe('One');
    });

    it('Enter and Space run the active item', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [
              { label: 'Cut', command: run },
              { label: 'Copy', command: run },
            ],
          },
        ]);
      });
      await tabOntoMenu();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Cut');

      await userEvent.keyboard('{Enter}');
      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item.label).toBe('Cut');

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard(' ');
      expect(run).toHaveBeenCalledTimes(2);
      expect(run.mock.calls[1]?.[0].item.label).toBe('Copy');
    });

    it('Enter runs a slotted item exactly as a plain one', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const copy: WjMenuItem = { label: 'Copy', command: run };
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Start', expanded: true, items: [{ label: 'Cut' }, copy] }]);
      });
      await tabOntoMenu();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item).toBe(copy);
    });

    it('Enter and Space open and close a slotted header too', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
      });
      const [start] = await (await harnessOf(fixture)).getPanels();
      await tabOntoMenu();

      await userEvent.keyboard('{Enter}');
      expect(await start?.isExpanded()).toBe(true);
      await userEvent.keyboard(' ');
      expect(await start?.isExpanded()).toBe(false);
    });

    it('a disabled header cannot be opened from the keyboard', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Locked', disabled: true, items: [{ label: 'Inside' }] },
          { label: 'Help' },
        ]);
      });
      const [locked] = await (await harnessOf(fixture)).getPanels();
      await locked?.focus();

      await userEvent.keyboard('{Enter}');

      expect(await locked?.isExpanded()).toBe(false);
    });

    it('Home and End on a header do nothing (Optimus gap)', async () => {
      await render();
      await tabOntoMenu();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Components');

      await userEvent.keyboard('{Home}');
      expect(activeLabel()).toBe('Components');
      await userEvent.keyboard('{End}');
      expect(activeLabel()).toBe('Components');
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still opens and closes', async () => {
      const { fixture } = await render();
      const [start] = await (await harnessOf(fixture)).getPanels();
      const read = recordClasses();

      await start?.toggle();
      expect(await start?.isExpanded()).toBe(true);
      await start?.toggle();
      expect(await start?.isExpanded()).toBe(false);

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const { fixture } = await render();
      const [start] = await (await harnessOf(fixture)).getPanels();
      const read = recordClasses();

      await start?.toggle();
      await expect.poll(() => motionClasses(read()).length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    const states: Record<string, (host: Host) => void> = {
      'all collapsed': () => undefined,
      'one panel expanded': (host) => {
        host.model.update((items) =>
          items.map((item, index) => ({ ...item, expanded: index === 0 })),
        );
      },
      'a nested level expanded': (host) => {
        host.model.set([
          {
            label: 'Components',
            expanded: true,
            items: [
              {
                label: 'Buttons',
                expanded: true,
                items: [{ label: 'Button' }, { label: 'Toggle' }],
              },
              { label: 'Menus' },
            ],
          },
          { label: 'Help' },
        ]);
      },
      'multiple with two open': (host) => {
        host.multiple.set(true);
        host.model.update((items) =>
          items.map((item, index) => ({ ...item, expanded: index < 2 })),
        );
      },
      'a disabled item and a disabled panel': (host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [
              { label: 'Install' },
              { label: 'Off', disabled: true },
              { separator: true },
              { label: 'Theming' },
            ],
          },
          { label: 'Locked', disabled: true, items: [{ label: 'Inside' }] },
        ]);
      },
      'the item slot in use': (host) => {
        host.withSlot.set(true);
        host.model.update((items) =>
          items.map((item, index) => ({ ...item, expanded: index === 0 })),
        );
      },
      'url items': (host) => {
        host.model.set([
          {
            label: 'Start',
            expanded: true,
            items: [{ label: 'Docs', url: 'https://example.com/' }],
          },
        ]);
      },
    };

    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, setup] of Object.entries(states)) {
        it(`has no axe violations: ${name}, ${scheme}`, async () => {
          await render(setup, scheme);

          await (name === 'all collapsed' ? expectNoAxeViolations() : expectOnlyOptimusStructure());
        });
      }
    }

    it('gives every header and shown item a hit box of at least 24 × 24 px, slotted ones too', async () => {
      const { fixture, component } = await render((host) => {
        host.multiple.set(true);
        host.model.update((items) => items.map((item) => ({ ...item, expanded: true })));
      });
      const sizes = (): DOMRect[] =>
        [
          ...document.querySelectorAll(
            '[data-pc-section="header"], [data-pc-section="itemcontent"]:not([aria-hidden="true"] *)',
          ),
        ].map((box) => box.getBoundingClientRect());

      for (const box of sizes()) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
      component.withSlot.set(true);
      await fixture.whenStable();
      expect(sizes().length).toBeGreaterThanOrEqual(5);
      for (const box of sizes()) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
    });
  });
});
