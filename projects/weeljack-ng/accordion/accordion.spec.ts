import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjAccordion,
  WjAccordionContent,
  WjAccordionHeader,
  WjAccordionPanel,
  type WjAccordionContentPt,
  type WjAccordionHeaderPt,
  type WjAccordionPanelPt,
  type WjAccordionPanelValue,
  type WjAccordionPt,
  type WjAccordionValue,
} from 'weeljack-ng/accordion';
import { WjAccordionHarness, WjAccordionPanelHarness } from 'weeljack-ng/accordion/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** One panel of the host's accordion; `header` or `body` left out renders that part absent. */
interface PanelData {
  value: WjAccordionPanelValue;
  header?: string;
  body?: string;
  disabled?: boolean;
  action?: boolean;
  pt?: WjAccordionPanelPt;
  headerPt?: WjAccordionHeaderPt;
  contentPt?: WjAccordionContentPt;
}

const PANELS: PanelData[] = [
  { value: 'shipping', header: 'Shipping', body: 'Ships in two working days.' },
  { value: 'returns', header: 'Returns', body: 'Thirty days, unused.' },
  { value: 'warranty', header: 'Warranty', body: 'Two years on every part.' },
];

/** A consumer's template: native buttons around the accordion, panels declared with `@for`. */
@Component({
  selector: 'wj-accordion-host',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader, WjAccordionContent],
  template: `
    <button type="button" id="before">Before</button>
    <div [style.width]="width()">
      <wj-accordion
        [value]="value()"
        (valueChange)="changed($event)"
        [multiple]="multiple()"
        [pt]="pt()"
      >
        @for (panel of panels(); track panel.value) {
          <wj-accordion-panel
            [value]="panel.value"
            [disabled]="panel.disabled ?? false"
            [pt]="panel.pt"
          >
            @if (panel.header !== undefined) {
              <wj-accordion-header [pt]="panel.headerPt">{{ panel.header }}</wj-accordion-header>
            }
            @if (panel.body !== undefined) {
              <wj-accordion-content [pt]="panel.contentPt">
                <p class="body">{{ panel.body }}</p>
                @if (panel.action) {
                  <button type="button" class="action">Action {{ panel.value }}</button>
                }
              </wj-accordion-content>
            }
          </wj-accordion-panel>
        }
        @if (bonus()) {
          <wj-accordion-panel value="bonus">
            <wj-accordion-header>Bonus</wj-accordion-header>
            <wj-accordion-content>Only while it is declared.</wj-accordion-content>
          </wj-accordion-panel>
        }
      </wj-accordion>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly panels = signal<PanelData[]>(PANELS);
  readonly value = signal<WjAccordionValue | undefined>(undefined);
  readonly multiple = signal(false);
  readonly pt = signal<WjAccordionPt>(undefined);
  readonly bonus = signal(false);
  readonly width = signal<string | undefined>(undefined);
  /** Every value `valueChange` reported, in order. */
  readonly reported = signal<(WjAccordionValue | undefined)[]>([]);

  protected changed(next: WjAccordionValue | undefined): void {
    this.value.set(next);
    this.reported.update((list) => [...list, next]);
  }
}

/** Bare attributes, the way a template writes `multiple` and `disabled`. */
@Component({
  selector: 'wj-accordion-bare-host',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader, WjAccordionContent],
  template: `
    <wj-accordion multiple [value]="['a', 'b']">
      <wj-accordion-panel value="a">
        <wj-accordion-header>A</wj-accordion-header>
        <wj-accordion-content>Alpha</wj-accordion-content>
      </wj-accordion-panel>
      <wj-accordion-panel value="b" disabled>
        <wj-accordion-header>B</wj-accordion-header>
        <wj-accordion-content>Bravo</wj-accordion-content>
      </wj-accordion-panel>
    </wj-accordion>
  `,
})
class BareHost {}

/** Content a consumer writes in the wrong place: it must not render. */
@Component({
  selector: 'wj-accordion-stray-host',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader, WjAccordionContent],
  template: `
    <wj-accordion>
      <p id="stray">Not a panel</p>
      <wj-accordion-header id="orphan">Orphan header</wj-accordion-header>
      <wj-accordion-panel value="a">
        <p id="loose">Loose in the panel</p>
        <wj-accordion-header>A</wj-accordion-header>
        <wj-accordion-content>Alpha</wj-accordion-content>
      </wj-accordion-panel>
    </wj-accordion>
  `,
})
class StrayHost {}

/** A consumer who writes `aria-*` on a host instead of using the parts' own text. */
@Component({
  selector: 'wj-accordion-aria-main-host',
  imports: [WjAccordion],
  template: `<wj-accordion aria-label="Questions" />`,
})
class AriaOnMainHost {}

@Component({
  selector: 'wj-accordion-aria-panel-host',
  imports: [WjAccordion, WjAccordionPanel],
  template: `<wj-accordion><wj-accordion-panel value="a" aria-label="A" /></wj-accordion>`,
})
class AriaOnPanelHost {}

@Component({
  selector: 'wj-accordion-aria-header-host',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader],
  template: `
    <wj-accordion>
      <wj-accordion-panel value="a">
        <wj-accordion-header aria-label="A">A</wj-accordion-header>
      </wj-accordion-panel>
    </wj-accordion>
  `,
})
class AriaOnHeaderHost {}

@Component({
  selector: 'wj-accordion-aria-content-host',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionContent],
  template: `
    <wj-accordion>
      <wj-accordion-panel value="a">
        <wj-accordion-content aria-label="A">Alpha</wj-accordion-content>
      </wj-accordion-panel>
    </wj-accordion>
  `,
})
class AriaOnContentHost {}

/** A string `value` that is an HTML payload, on the accordion and on its panel. */
@Component({
  selector: 'wj-accordion-payload-host',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader, WjAccordionContent],
  template: `
    <wj-accordion [value]="payload">
      <wj-accordion-panel [value]="payload">
        <wj-accordion-header>Header</wj-accordion-header>
        <wj-accordion-content>Content</wj-accordion-content>
      </wj-accordion-panel>
    </wj-accordion>
  `,
})
class PayloadHost {
  protected readonly payload = PAYLOAD;
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  accordion: WjAccordionHarness;
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

/** Records every class list `p-motion` showed while it runs; call the result to stop and read. */
function recordMotion(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('p-motion')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen].filter((name) => /enter-active|leave-active/.test(name));
  };
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const headerEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="accordion-header"]'));

const contentEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="accordion-content"]'));

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  const first = headerEls(element)[0];
  if (first && getComputedStyle(first).fontWeight !== '600') {
    throw new Error("Optimus's accordion styles did not load");
  }
  current = element;
  await allSettled(element);
  const accordion = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjAccordionHarness);
  return { fixture, host: fixture.componentInstance, accordion, element };
}

/** Renders one of the small hosts with `provideWeeljack` (or without it). */
async function renderSmall<T>(
  type: new () => T,
  withProvider = true,
): Promise<{ fixture: ComponentFixture<T>; element: HTMLElement }> {
  if (withProvider) {
    TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  }
  const fixture = TestBed.createComponent(type);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

/** True while the content of `panelEl` is shown: Optimus hides it with `visibility`. */
const contentShown = (panelEl: Element): boolean => {
  const body = find(panelEl, '[data-pc-section="content"]', HTMLElement);
  return getComputedStyle(body).visibility === 'visible';
};

const panelEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="accordion-panel"]'));

/** The fixture currently on screen, so `settled` can read what a user sees. */
let current: HTMLElement | undefined;

/**
 * Waits until every panel's content agrees with its header: shown while `aria-expanded`, hidden
 * while not. Optimus finishes an expand or a collapse a frame or more after it flips the ARIA
 * state, so a read straight after `whenStable()` would see the motion, not the end state.
 */
async function allSettled(root: HTMLElement): Promise<void> {
  await expect
    .poll(() =>
      panelEls(root).every(
        (panel) =>
          (find(panel, '[data-wj-part="accordion-header"]', HTMLElement).getAttribute(
            'aria-expanded',
          ) ===
            'true') ===
          contentShown(panel),
      ),
    )
    .toBe(true);
}

/** Waits until the panel at `index` has finished expanding or collapsing. */
async function settled(accordion: WjAccordionHarness, index: number, open: boolean): Promise<void> {
  const panel = (await accordion.getPanels())[index];
  if (!panel || !current) {
    throw new Error(`panel ${String(index)} is missing`);
  }
  await expect.poll(() => panel.isExpanded()).toBe(open);
  const panelEl = panelEls(current)[index];
  await expect.poll(() => (panelEl ? contentShown(panelEl) : undefined)).toBe(open);
}

/** The documented states for axe (FR-20). */
const STATES: [string, (host: Host) => void][] = [
  ['all collapsed', () => undefined],
  [
    'one expanded',
    (host) => {
      host.value.set('returns');
    },
  ],
  [
    'multiple with two expanded',
    (host) => {
      host.multiple.set(true);
      host.value.set(['shipping', 'warranty']);
    },
  ],
  [
    'one disabled panel',
    (host) => {
      host.panels.set(PANELS.map((panel) => ({ ...panel, disabled: panel.value === 'returns' })));
      host.value.set('shipping');
    },
  ],
];

describe('WjAccordion', () => {
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

  describe('panels and parts', () => {
    it('draws every panel in declaration order, each with its header and content', async () => {
      const { accordion } = await render();

      expect(await accordion.getHeaderTexts()).toEqual(['Shipping', 'Returns', 'Warranty']);
      const panels = await accordion.getPanels();
      expect(await Promise.all(panels.map((panel) => panel.getContentText()))).toEqual([
        'Ships in two working days.',
        'Thirty days, unused.',
        'Two years on every part.',
      ]);
      expect(await Promise.all(panels.map((panel) => panel.isExpanded()))).toEqual([
        false,
        false,
        false,
      ]);
    });

    it('writes Optimus parts only in its own template, in Optimus’s structure', async () => {
      const { element } = await render();
      const accordion = find(element, 'wj-accordion', HTMLElement);
      const root = find(accordion, 'p-accordion', HTMLElement);

      expect(Array.from(root.children).map((child) => child.localName)).toEqual([
        'p-accordion-panel',
        'p-accordion-panel',
        'p-accordion-panel',
      ]);
      for (const panel of Array.from(root.children)) {
        expect(Array.from(panel.children).map((child) => child.localName)).toEqual([
          'p-accordion-header',
          'p-accordion-content',
        ]);
      }
      expect(root.querySelectorAll('wj-accordion-panel, wj-accordion-header').length).toBe(0);
    });

    it('stamps each header and content once, inside the Optimus part', async () => {
      const { element } = await render();

      const bodies = Array.from(element.querySelectorAll('.body'));
      expect(bodies.length).toBe(3);
      for (const body of bodies) {
        expect(body.closest('[data-wj-part="accordion-content"]')).not.toBeNull();
        expect(body.closest('wj-accordion-content')).toBeNull();
      }
      const headers = headerEls(element);
      expect(headers.map((header) => header.textContent.trim())).toEqual([
        'Shipping',
        'Returns',
        'Warranty',
      ]);
      expect(element.querySelectorAll('wj-accordion-header [data-wj-part]').length).toBe(0);
    });

    it('wraps a header’s content in one plain span, beside the chevron', async () => {
      const { element } = await render();
      const header = headerEls(element)[0];
      if (!header) {
        throw new Error('no header');
      }

      const span = header.querySelector(':scope > span');
      // Angular's own `_ngcontent-*` scoping attribute is the only attribute: no class, no style.
      expect(span?.getAttributeNames().filter((name) => !name.startsWith('_ngcontent'))).toEqual(
        [],
      );
      expect(span?.textContent).toBe('Shipping');
      expect(header.querySelectorAll(':scope > span').length).toBe(1);
      const chevron = find(header, 'svg', SVGElement);
      expect(chevron.getBoundingClientRect().left).toBeGreaterThan(
        (span?.getBoundingClientRect().right ?? Infinity) - 1,
      );
    });

    it('keeps the part hosts after the Optimus root, hidden and out of the layout', async () => {
      const { element } = await render();
      const accordion = find(element, 'wj-accordion', HTMLElement);

      expect(Array.from(accordion.children).map((child) => child.localName)).toEqual([
        'p-accordion',
        'wj-accordion-panel',
        'wj-accordion-panel',
        'wj-accordion-panel',
      ]);
      const hosts = accordion.querySelectorAll(
        'wj-accordion-panel, wj-accordion-header, wj-accordion-content',
      );
      expect(hosts.length).toBe(9);
      for (const host of hosts) {
        expect(host.hasAttribute('hidden')).toBe(true);
        expect(getComputedStyle(host).display).toBe('none');
        expect(host.getAttribute('class')).toBeNull();
        expect(host.getAttribute('style')).toBeNull();
      }
    });

    it('renders an empty Optimus part for a header or a content that is left out', async () => {
      const { accordion, element } = await render('light', (host) => {
        host.panels.set([
          { value: 'a', body: 'Only content' },
          { value: 'b', header: 'Only header' },
        ]);
      });

      const panels = await accordion.getPanels();
      expect(await panels[0]?.getHeaderText()).toBe('');
      expect(await panels[0]?.getContentText()).toBe('Only content');
      expect(await panels[1]?.getHeaderText()).toBe('Only header');
      expect(await panels[1]?.getContentText()).toBe('');
      expect(headerEls(element).length).toBe(2);
      expect(contentEls(element).length).toBe(2);
    });

    it('draws nothing, and no Tab stop, with no panels', async () => {
      const { element } = await render('light', (host) => {
        host.panels.set([]);
      });
      find(element, '#before', HTMLElement).focus();

      expect(element.querySelector('p-accordion-panel')).toBeNull();
      expect(find(element, 'wj-accordion', HTMLElement).getBoundingClientRect().height).toBe(0);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('does not render content that is not a panel', async () => {
      const { element } = await renderSmall(StrayHost);

      expect(element.querySelector('#stray')).toBeNull();
      expect(element.querySelector('#orphan')).toBeNull();
      expect(element.querySelector('#loose')).toBeNull();
      expect(headerEls(element).length).toBe(1);
    });

    it('follows panels added, removed and reordered', async () => {
      const { host, accordion, element } = await render();
      const shippingBody = find(element, '.body', HTMLElement);

      host.panels.set([...PANELS].reverse());
      await expect
        .poll(() => accordion.getHeaderTexts())
        .toEqual(['Warranty', 'Returns', 'Shipping']);
      expect(shippingBody.isConnected).toBe(true);
      expect(shippingBody.textContent).toBe('Ships in two working days.');
      expect(element.querySelectorAll('.body').length).toBe(3);

      host.panels.set(PANELS.slice(1));
      await expect.poll(() => accordion.getHeaderTexts()).toEqual(['Returns', 'Warranty']);
      expect(shippingBody.isConnected).toBe(false);

      host.bonus.set(true);
      await expect.poll(() => accordion.getHeaderTexts()).toEqual(['Returns', 'Warranty', 'Bonus']);

      host.bonus.set(false);
      host.panels.set([]);
      await expect.poll(() => accordion.getHeaderTexts()).toEqual([]);
      expect(element.querySelector('p-accordion-panel')).toBeNull();
    });
  });

  describe('value', () => {
    it('opens the panel whose value it holds, and follows a value set from outside', async () => {
      const { host, accordion } = await render('light', (hostInstance) => {
        hostInstance.value.set('returns');
      });

      expect(await accordion.getExpandedPanels().then((open) => open.length)).toBe(1);
      expect(await (await accordion.getPanels())[1]?.isExpanded()).toBe(true);

      host.value.set('warranty');
      await settled(accordion, 2, true);
      await settled(accordion, 1, false);

      host.value.set(undefined);
      await settled(accordion, 2, false);
    });

    it('reports a click: one panel at a time, and a second click closes it', async () => {
      const { host, accordion } = await render();
      const [shipping, returns] = await accordion.getPanels();

      await shipping?.toggle();
      await settled(accordion, 0, true);
      expect(host.value()).toBe('shipping');

      await returns?.toggle();
      await settled(accordion, 1, true);
      await settled(accordion, 0, false);
      expect(host.value()).toBe('returns');

      await returns?.toggle();
      await settled(accordion, 1, false);
      expect(host.value()).toBeUndefined();
      expect(host.reported()).toEqual(['shipping', 'returns', undefined]);
    });

    it('reports a key press the same way, once per press', async () => {
      const { host, accordion } = await render();
      const [shipping, returns] = await accordion.getPanels();

      await shipping?.focus();
      await userEvent.keyboard('{Enter}');
      await settled(accordion, 0, true);
      expect(host.value()).toBe('shipping');

      await returns?.focus();
      await userEvent.keyboard(' ');
      await settled(accordion, 1, true);
      expect(host.value()).toBe('returns');
      expect(host.reported()).toEqual(['shipping', 'returns']);
    });

    it('holds an array with multiple, and each panel opens and closes on its own', async () => {
      const { host, accordion } = await render('light', (hostInstance) => {
        hostInstance.multiple.set(true);
      });
      const [shipping, returns] = await accordion.getPanels();

      await shipping?.toggle();
      await returns?.toggle();
      await settled(accordion, 1, true);
      expect(host.value()).toEqual(['shipping', 'returns']);
      expect((await accordion.getExpandedPanels()).length).toBe(2);

      await shipping?.toggle();
      await settled(accordion, 0, false);
      expect(host.value()).toEqual(['returns']);
      expect(
        await Promise.all(
          (await accordion.getExpandedPanels()).map((panel) => panel.getHeaderText()),
        ),
      ).toEqual(['Returns']);
    });

    it('accepts a number as a panel value', async () => {
      const { host, accordion } = await render('light', (hostInstance) => {
        hostInstance.panels.set([
          { value: 1, header: 'One', body: 'First' },
          { value: 2, header: 'Two', body: 'Second' },
        ]);
      });

      await (await accordion.getPanels())[1]?.toggle();
      await settled(accordion, 1, true);
      expect(host.value()).toBe(2);
    });

    it('takes bare multiple and disabled attributes', async () => {
      const { fixture } = await renderSmall(BareHost);
      const accordion =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjAccordionHarness);
      const [a, b] = await accordion.getPanels();

      expect(await a?.isExpanded()).toBe(true);
      expect(await b?.isExpanded()).toBe(true);
      expect(await a?.isDisabled()).toBe(false);
      expect(await b?.isDisabled()).toBe(true);
    });
  });

  describe('a disabled panel', () => {
    const withDisabled = (host: Host): void => {
      host.panels.set(PANELS.map((panel) => ({ ...panel, disabled: panel.value === 'returns' })));
    };

    it('cannot open, takes no focus and is not clickable', async () => {
      const { host, accordion, element } = await render('light', withDisabled);
      const returns = (await accordion.getPanels())[1];
      const header = headerEls(element)[1];

      expect(await returns?.isDisabled()).toBe(true);
      expect(header?.getAttribute('tabindex')).toBe('-1');
      await returns?.toggle();
      await Promise.resolve();
      expect(await returns?.isExpanded()).toBe(false);
      expect(host.reported()).toEqual([]);
    });

    it('is skipped by the Tab key', async () => {
      const { accordion, element } = await render('light', withDisabled);
      const headers = headerEls(element);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(headers[0]);
      await userEvent.tab();
      expect(document.activeElement).toBe(headers[2]);
      expect(await (await accordion.getPanels())[2]?.isFocused()).toBe(true);
    });
  });

  describe('pt', () => {
    it('reaches the accordion, the panel, the header and the content', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: { 'data-probe': 'accordion' } });
        host.panels.set([
          {
            ...PANELS[0],
            value: 'shipping',
            pt: { root: { 'data-probe': 'panel' } },
            headerPt: {
              root: { 'data-probe': 'header' },
              toggleicon: { 'data-probe': 'toggleicon' },
            },
            contentPt: {
              root: { 'data-probe': 'content' },
              contentWrapper: { 'data-probe': 'wrapper' },
              content: { 'data-probe': 'inner' },
            },
          },
        ]);
      });

      const probe = (name: string): Element | null =>
        element.querySelector(`[data-probe="${name}"]`);
      expect(probe('accordion')?.localName).toBe('p-accordion');
      expect(probe('panel')?.localName).toBe('p-accordion-panel');
      expect(probe('header')?.localName).toBe('p-accordion-header');
      expect(probe('toggleicon')?.localName).toBe('svg');
      expect(probe('content')?.localName).toBe('p-accordion-content');
      expect(probe('wrapper')?.localName).toBe('div');
      expect(probe('inner')?.localName).toBe('div');
    });

    it('accepts a class string and the function form for a part', async () => {
      const { element } = await render('light', (host) => {
        host.panels.set([
          {
            ...PANELS[0],
            value: 'shipping',
            pt: { root: 'probe-class' },
            headerPt: () => ({ root: () => ({ 'data-probe': 'fn' }) }),
          },
        ]);
      });

      expect(
        find(element, 'p-accordion-panel', HTMLElement).classList.contains('probe-class'),
      ).toBe(true);
      expect(find(element, '[data-probe="fn"]', HTMLElement).localName).toBe('p-accordion-header');
    });

    it('changes nothing when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });
  });

  describe('host attributes and setup', () => {
    it.each([
      ['wj-accordion', AriaOnMainHost, 'Remove it: the headers and panels name themselves'],
      ['wj-accordion-panel', AriaOnPanelHost, 'Remove it: the panel is named by its header'],
      ['wj-accordion-header', AriaOnHeaderHost, 'Remove it: the header is named by its own text'],
      ['wj-accordion-content', AriaOnContentHost, 'Remove it: the content is named by its header'],
    ])('warns WJ0003 for aria-* on %s and forwards nothing', async (selector, type, instead) => {
      const { element } = await renderSmall(type);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        `WJ0003: ${selector}: aria-label is set on the host, where it is not forwarded to the ` +
          `focusable element. ${instead}. ` +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(element.querySelector('[aria-label]:not(' + selector + ')')).toBeNull();
    });

    it('stays silent when no host carries aria-*', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-accordion: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in a panel value as text, never as markup', async () => {
      const { element } = await renderSmall(PayloadHost);
      const header = headerEls(element)[0];

      expect(element.querySelector('img')).toBeNull();
      expect(header?.id.endsWith(PAYLOAD)).toBe(true);
      expect(header?.getAttribute('aria-expanded')).toBe('true');
      expect(contentEls(element)[0]?.getAttribute('aria-labelledby')).toBe(header?.id);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('is a block with no box of its own', async () => {
      const { element } = await render();
      const accordion = find(element, 'wj-accordion', HTMLElement);
      const style = getComputedStyle(accordion);

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.margin).toBe('0px');
    });

    it('puts 8 px between a header’s content and its chevron', async () => {
      const { element } = await render();
      const header = headerEls(element)[0];

      expect(getComputedStyle(header ?? element).columnGap).toBe('8px');
    });

    it('wraps a long header at spaces, never truncating it, with the chevron centred', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('200px');
        host.panels.set([
          {
            value: 'long',
            header: 'A header that is much longer than the room the layout gives it',
            body: 'Body',
          },
          { value: 'short', header: 'Short', body: 'Body' },
        ]);
      });
      const [long, short] = headerEls(element);
      const span = find(long ?? element, ':scope > span', HTMLElement);

      expect(
        (long?.getBoundingClientRect().height ?? 0) > (short?.getBoundingClientRect().height ?? 0),
      ).toBe(true);
      expect(getComputedStyle(span).textOverflow).toBe('clip');
      expect(span.scrollWidth).toBeLessThanOrEqual(span.clientWidth);
      expect(getComputedStyle(long ?? element).alignItems).toBe('center');
    });
  });

  describe('hit boxes', () => {
    it('makes every header at least 24 by 24 px', async () => {
      const { element } = await render();

      for (const header of headerEls(element)) {
        const box = header.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('collapsed content', () => {
    it('stays in the page, hidden, with its region named by the header', async () => {
      const { element } = await render('light', (host) => {
        host.panels.set(PANELS.map((panel) => ({ ...panel, action: true })));
        host.value.set('shipping');
      });
      const panels = panelEls(element);

      expect(element.querySelectorAll('.body').length).toBe(3);
      expect(contentShown(panels[0] ?? element)).toBe(true);
      expect(contentShown(panels[1] ?? element)).toBe(false);
      expect(contentEls(element)[1]?.getAttribute('aria-labelledby')).toBe(
        headerEls(element)[1]?.id,
      );
      expect(contentEls(element)[1]?.getAttribute('role')).toBe('region');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(find(element, 'wj-accordion', HTMLElement));
      });
    });
  });

  describe('keyboard', () => {
    const withActions = (host: Host): void => {
      host.panels.set(PANELS.map((panel) => ({ ...panel, action: true })));
      host.value.set('shipping');
    };

    it('Tab walks the headers and the controls of the open panel, Shift+Tab walks back', async () => {
      const { element } = await render('light', withActions);
      const headers = headerEls(element);
      const action = find(element, '.action', HTMLElement);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(headers[0]);
      await userEvent.tab();
      expect(document.activeElement).toBe(action);
      await userEvent.tab();
      expect(document.activeElement).toBe(headers[1]);
      await userEvent.tab();
      expect(document.activeElement).toBe(headers[2]);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(headers[2]);
      await userEvent.tab({ shift: true });
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(action);
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(headers[0]);
    });

    it('Enter and Space each toggle the focused header once', async () => {
      const { accordion, host } = await render('light', (hostInstance) => {
        hostInstance.multiple.set(true);
      });
      const [shipping] = await accordion.getPanels();
      await shipping?.focus();

      await userEvent.keyboard('{Enter}');
      await settled(accordion, 0, true);
      await userEvent.keyboard('{Enter}');
      await settled(accordion, 0, false);
      await userEvent.keyboard(' ');
      await settled(accordion, 0, true);
      await userEvent.keyboard(' ');
      await settled(accordion, 0, false);

      expect(host.reported()).toEqual([['shipping'], [], ['shipping'], []]);
    });

    it('Arrow Down moves focus exactly one header, and wraps from the last to the first', async () => {
      const { accordion } = await render();
      const panels = await accordion.getPanels();
      await panels[0]?.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(await panels[1]?.isFocused()).toBe(true);
      expect(await panels[2]?.isFocused()).toBe(false);

      await userEvent.keyboard('{ArrowDown}');
      expect(await panels[2]?.isFocused()).toBe(true);

      await userEvent.keyboard('{ArrowDown}');
      expect(await panels[0]?.isFocused()).toBe(true);
    });

    it('Arrow Up moves focus exactly one header, and wraps from the first to the last', async () => {
      const { accordion } = await render();
      const panels = await accordion.getPanels();
      await panels[2]?.focus();

      await userEvent.keyboard('{ArrowUp}');
      expect(await panels[1]?.isFocused()).toBe(true);
      expect(await panels[0]?.isFocused()).toBe(false);

      await userEvent.keyboard('{ArrowUp}');
      expect(await panels[0]?.isFocused()).toBe(true);

      await userEvent.keyboard('{ArrowUp}');
      expect(await panels[2]?.isFocused()).toBe(true);
    });

    it('the arrow keys skip a disabled panel', async () => {
      const { accordion } = await render('light', (host) => {
        host.panels.set(PANELS.map((panel) => ({ ...panel, disabled: panel.value === 'returns' })));
      });
      const [first, , last] = await accordion.getPanels();
      await first?.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(await last?.isFocused()).toBe(true);
      await userEvent.keyboard('{ArrowUp}');
      expect(await first?.isFocused()).toBe(true);
    });

    it('Home moves to the first header and End to the last, skipping a disabled one', async () => {
      const { accordion } = await render('light', (host) => {
        host.panels.set(
          PANELS.map((panel) => ({ ...panel, disabled: panel.value === 'warranty' })),
        );
      });
      const [first, second] = await accordion.getPanels();
      await first?.focus();

      await userEvent.keyboard('{End}');
      expect(await second?.isFocused()).toBe(true);
      await userEvent.keyboard('{Home}');
      expect(await first?.isFocused()).toBe(true);
    });

    it('an arrow key opens and closes nothing', async () => {
      const { accordion, host } = await render();
      const [first] = await accordion.getPanels();
      await first?.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowUp}{End}{Home}');

      expect(await accordion.getExpandedPanels()).toEqual([]);
      expect(host.reported()).toEqual([]);
    });
  });

  describe('harness', () => {
    it('finds panels by header text and lists the open ones', async () => {
      const { accordion } = await render('light', (host) => {
        host.multiple.set(true);
        host.value.set(['shipping', 'warranty']);
      });

      const returns = await accordion.getPanels({ headerText: 'Returns' });
      expect(returns.length).toBe(1);
      expect(await returns[0]?.getContentText()).toBe('Thirty days, unused.');
      expect((await accordion.getPanels({ headerText: /^S/ })).length).toBe(1);
      expect(
        await Promise.all(
          (await accordion.getExpandedPanels()).map((panel) => panel.getHeaderText()),
        ),
      ).toEqual(['Shipping', 'Warranty']);
    });

    it('finds one panel through the loader and drives it', async () => {
      const { fixture } = await render();
      const panel = await TestbedHarnessEnvironment.loader(fixture).getHarness(
        WjAccordionPanelHarness.with({ headerText: 'Warranty' }),
      );

      expect(await panel.isExpanded()).toBe(false);
      await panel.toggle();
      await expect.poll(() => panel.isExpanded()).toBe(true);
      await panel.focus();
      expect(await panel.isFocused()).toBe(true);
      expect(await panel.isDisabled()).toBe(false);
    });

    it('names no Optimus class', () => {
      expect(WjAccordionPanelHarness.hostSelector).toBe('[data-wj-part="accordion-panel"]');
      expect(WjAccordionHarness.hostSelector).toBe('wj-accordion');
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still reports every toggle', async () => {
      const { host, accordion } = await render();
      const stop = recordMotion();
      const [shipping] = await accordion.getPanels();

      await shipping?.toggle();
      await settled(accordion, 0, true);
      await shipping?.toggle();
      await settled(accordion, 0, false);

      expect(stop()).toEqual([]);
      expect(host.reported()).toEqual(['shipping', undefined]);
    });

    it('pt.motion cannot switch safe off', async () => {
      const { accordion } = await render('light', (host) => {
        host.pt.set({ motion: { safe: false } });
      });
      const stop = recordMotion();
      const [shipping] = await accordion.getPanels();

      await shipping?.toggle();
      await settled(accordion, 0, true);
      await shipping?.toggle();
      await settled(accordion, 0, false);

      expect(stop()).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const { accordion, element } = await render();
      const stop = recordMotion();
      const [shipping] = await accordion.getPanels();

      await shipping?.toggle();
      await settled(accordion, 0, true);
      await expect.poll(() => contentShown(panelEls(element)[0] ?? element)).toBe(true);
      await shipping?.toggle();
      await settled(accordion, 0, false);
      await expect.poll(() => contentShown(panelEls(element)[0] ?? element)).toBe(false);

      expect(stop().length).toBeGreaterThan(0);
    });
  });
});
