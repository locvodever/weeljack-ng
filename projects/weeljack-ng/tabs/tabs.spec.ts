import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjTab,
  WjTabList,
  WjTabPanel,
  WjTabPanels,
  WjTabs,
  type WjTabListPt,
  type WjTabPanelPt,
  type WjTabPanelsPt,
  type WjTabPt,
  type WjTabsPt,
  type WjTabsValue,
} from 'weeljack-ng/tabs';
import { WjTabHarness, WjTabsHarness } from 'weeljack-ng/tabs/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const VIEWPORT = { width: window.innerWidth, height: window.innerHeight };

/** One tab of the host's tabs, and the panel that goes with it. */
interface TabData {
  value: WjTabsValue;
  label: string;
  body?: string;
  disabled?: boolean;
  action?: boolean;
  pt?: WjTabPt;
  panelPt?: WjTabPanelPt;
}

const TABS: TabData[] = [
  { value: 'overview', label: 'Overview', body: 'What the product is.' },
  { value: 'specs', label: 'Specifications', body: 'Every measurement.' },
  { value: 'reviews', label: 'Reviews', body: 'What buyers say.' },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label): TabData => ({ value: label.toLowerCase(), label, body: `${label} report.` }));

/** A consumer's template: native buttons around the tabs, tabs and panels declared with `@for`. */
@Component({
  selector: 'wj-tabs-host',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <button type="button" id="before">Before</button>
    <span id="caption">Account settings</span>
    <div [style.width]="width()">
      <wj-tabs
        [value]="value()"
        (valueChange)="changed($event)"
        [scrollable]="scrollable()"
        [selectOnFocus]="selectOnFocus()"
        [pt]="pt()"
      >
        <wj-tablist [ariaLabel]="ariaLabel()" [ariaLabelledBy]="ariaLabelledBy()" [pt]="listPt()">
          @for (tab of tabs(); track tab.value) {
            <wj-tab [value]="tab.value" [disabled]="tab.disabled ?? false" [pt]="tab.pt">{{
              tab.label
            }}</wj-tab>
          }
          @if (bonus()) {
            <wj-tab value="bonus">Bonus</wj-tab>
          }
        </wj-tablist>
        <wj-tabpanels [pt]="panelsPt()">
          @for (tab of tabs(); track tab.value) {
            <wj-tabpanel [value]="tab.value" [pt]="tab.panelPt">
              <p class="body">{{ tab.body }}</p>
              @if (tab.action) {
                <button type="button" class="action">Action {{ tab.value }}</button>
              }
            </wj-tabpanel>
          }
          @if (bonus()) {
            <wj-tabpanel value="bonus">Only while it is declared.</wj-tabpanel>
          }
        </wj-tabpanels>
      </wj-tabs>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly tabs = signal<TabData[]>(TABS);
  readonly value = signal<WjTabsValue>('overview');
  readonly scrollable = signal(false);
  readonly selectOnFocus = signal(false);
  readonly ariaLabel = signal<string | undefined>('Product details');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTabsPt>(undefined);
  readonly listPt = signal<WjTabListPt>(undefined);
  readonly panelsPt = signal<WjTabPanelsPt>(undefined);
  readonly bonus = signal(false);
  readonly width = signal<string | undefined>(undefined);
  /** Every value `valueChange` reported, in order. */
  readonly reported = signal<WjTabsValue[]>([]);

  protected changed(next: WjTabsValue): void {
    this.value.set(next);
    this.reported.update((list) => [...list, next]);
  }
}

/** Bare attributes, the way a template writes `scrollable`, `selectOnFocus` and `disabled`. */
@Component({
  selector: 'wj-tabs-bare-host',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <wj-tabs value="a" scrollable selectOnFocus>
      <wj-tablist ariaLabel="Bare">
        <wj-tab value="a">A</wj-tab>
        <wj-tab value="b" disabled>B</wj-tab>
      </wj-tablist>
      <wj-tabpanels>
        <wj-tabpanel value="a">Alpha</wj-tabpanel>
        <wj-tabpanel value="b">Bravo</wj-tabpanel>
      </wj-tabpanels>
    </wj-tabs>
  `,
})
class BareHost {}

/** Content a consumer writes in the wrong place: it must not render. */
@Component({
  selector: 'wj-tabs-stray-host',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <wj-tabs value="a">
      <p id="stray">Not a part</p>
      <wj-tab id="orphan" value="x">Orphan tab</wj-tab>
      <wj-tablist ariaLabel="Stray">
        <p id="loose-in-list">Loose in the list</p>
        <wj-tab value="a">A</wj-tab>
      </wj-tablist>
      <wj-tabpanels>
        <p id="loose-in-panels">Loose in the panels</p>
        <wj-tabpanel value="a">Alpha</wj-tabpanel>
      </wj-tabpanels>
    </wj-tabs>
  `,
})
class StrayHost {}

/** A consumer who writes `aria-*` on a host instead of using the inputs and the parts' text. */
@Component({
  selector: 'wj-tabs-aria-main-host',
  imports: [WjTabs],
  template: `<wj-tabs value="a" aria-label="Details" />`,
})
class AriaOnMainHost {}

@Component({
  selector: 'wj-tabs-aria-list-host',
  imports: [WjTabs, WjTabList],
  template: `<wj-tabs value="a"><wj-tablist aria-label="Details" /></wj-tabs>`,
})
class AriaOnListHost {}

@Component({
  selector: 'wj-tabs-aria-tab-host',
  imports: [WjTabs, WjTabList, WjTab],
  template: `
    <wj-tabs value="a">
      <wj-tablist><wj-tab value="a" aria-label="A">A</wj-tab></wj-tablist>
    </wj-tabs>
  `,
})
class AriaOnTabHost {}

@Component({
  selector: 'wj-tabs-aria-panels-host',
  imports: [WjTabs, WjTabPanels],
  template: `<wj-tabs value="a"><wj-tabpanels aria-label="Details" /></wj-tabs>`,
})
class AriaOnPanelsHost {}

@Component({
  selector: 'wj-tabs-aria-panel-host',
  imports: [WjTabs, WjTabPanels, WjTabPanel],
  template: `
    <wj-tabs value="a">
      <wj-tabpanels><wj-tabpanel value="a" aria-label="A">Alpha</wj-tabpanel></wj-tabpanels>
    </wj-tabs>
  `,
})
class AriaOnPanelHost {}

/** A string that is an HTML payload, as every string input of the tabs and their parts. */
@Component({
  selector: 'wj-tabs-payload-host',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <span id="payload-name">Name</span>
    <wj-tabs [value]="payload">
      <wj-tablist [ariaLabel]="payload" [ariaLabelledBy]="payload">
        <wj-tab [value]="payload">Tab</wj-tab>
      </wj-tablist>
      <wj-tabpanels>
        <wj-tabpanel [value]="payload">Panel</wj-tabpanel>
      </wj-tabpanels>
    </wj-tabs>
  `,
})
class PayloadHost {
  protected readonly payload = PAYLOAD;
}

type Scheme = 'light' | 'dark';
type Translation = NonNullable<Parameters<typeof provideWeeljack>[0]>['translation'];

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  tabs: WjTabsHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const tabEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="tab"]'));

const panelEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="tabpanel"]'));

/** The scrolling viewport of the strip, which Optimus draws. */
const viewportEl = (root: ParentNode): HTMLElement =>
  find(root, '[data-pc-section="content"]', HTMLElement);

const navButton = (root: ParentNode, name: 'Previous' | 'Next'): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-pc-group-section="navigator"][aria-label="${name}"]`);

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
  translation: Translation = {},
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  const first = tabEls(element)[0];
  if (first && getComputedStyle(first).fontWeight !== '600') {
    throw new Error("Optimus's tabs styles did not load");
  }
  const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTabsHarness);
  return { fixture, host: fixture.componentInstance, tabs, element };
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

/** Narrows the page to the phone width the browser starts at, so the 12 months overflow. */
async function narrow(): Promise<void> {
  await page.viewport(VIEWPORT.width, VIEWPORT.height);
}

const withMonths = (host: Host): void => {
  host.tabs.set(MONTHS);
  host.value.set('january');
  host.scrollable.set(true);
  host.ariaLabel.set('Monthly reports');
};

/** Scrolls the strip a little, so both the Previous and the Next button show, and waits for them. */
async function showBothScrollButtons(element: HTMLElement): Promise<void> {
  await expect.poll(() => navButton(element, 'Next')).not.toBeNull();
  viewportEl(element).scrollLeft = 120;
  await expect.poll(() => navButton(element, 'Previous')).not.toBeNull();
  await expect.poll(() => navButton(element, 'Next')).not.toBeNull();
}

/** The documented states for axe (FR-26). */
const STATES: [string, (host: Host) => void, boolean][] = [
  ['first tab active', () => undefined, false],
  [
    'a disabled tab',
    (host) => {
      host.tabs.set(TABS.map((tab) => ({ ...tab, disabled: tab.value === 'reviews' })));
    },
    false,
  ],
  ['scrollable with both scroll buttons showing', withMonths, true],
  [
    'a labelled tab list',
    (host) => {
      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('caption');
    },
    false,
  ],
];

type Rule = CSSStyleRule;

/** Every style rule of the page that sits inside a media block whose condition holds `media`. */
function mediaStyleRules(media: string): Rule[] {
  const found: Rule[] = [];
  const walk = (rules: CSSRuleList, inMedia: boolean): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && inMedia) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(
          rule.cssRules,
          inMedia || (rule instanceof CSSMediaRule && rule.conditionText.includes(media)),
        );
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, false);
  }
  return found;
}

/** The layer name chain of the first style rule whose selector holds `selector`, or `null`. */
function layerOfRule(selector: string): string[] | null {
  let layers: string[] | null = null;
  const walk = (rules: CSSRuleList, chain: string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText === selector && layers === null) {
        layers = chain;
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, rule instanceof CSSLayerBlockRule ? [...chain, rule.name] : chain);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, []);
  }
  return layers;
}

describe('WjTabs', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // The strip is unscrolled at this width; the scrollable specs narrow it themselves.
    await page.viewport(1280, 800);
  });

  afterEach(async () => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head
      .querySelectorAll('style[data-optimus-style-id], style[data-wj-spec]')
      .forEach((style) => {
        style.remove();
      });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(VIEWPORT.width, VIEWPORT.height);
  });

  describe('tabs and parts', () => {
    it('draws every tab in declaration order, each with its panel, and shows the active one', async () => {
      const { tabs } = await render();

      expect(await tabs.getTabLabels()).toEqual(['Overview', 'Specifications', 'Reviews']);
      expect(await (await tabs.getSelectedTab())?.getLabel()).toBe('Overview');
      expect(await tabs.getSelectedPanelText()).toBe('What the product is.');
      const all = await tabs.getTabs();
      expect(await Promise.all(all.map((tab) => tab.isSelected()))).toEqual([true, false, false]);
    });

    it('writes Optimus parts only in its own template, in Optimus’s structure', async () => {
      const { element } = await render();
      const root = find(find(element, 'wj-tabs', HTMLElement), 'p-tabs', HTMLElement);

      expect(Array.from(root.children).map((child) => child.localName)).toEqual([
        'p-tablist',
        'p-tabpanels',
      ]);
      const strip = find(root, '[role="tablist"]', HTMLElement);
      expect(Array.from(strip.children).map((child) => child.localName)).toEqual([
        'p-tab',
        'p-tab',
        'p-tab',
        'span',
      ]);
      const panels = find(root, 'p-tabpanels', HTMLElement);
      expect(Array.from(panels.children).map((child) => child.localName)).toEqual([
        'p-tabpanel',
        'p-tabpanel',
        'p-tabpanel',
      ]);
      expect(root.querySelectorAll('wj-tablist, wj-tab, wj-tabpanels, wj-tabpanel').length).toBe(0);
    });

    it('stamps each label and each panel’s content once, inside the Optimus part', async () => {
      const { element } = await render();

      const bodies = Array.from(element.querySelectorAll('.body'));
      expect(bodies.length).toBe(3);
      for (const body of bodies) {
        expect(body.closest('[data-wj-part="tabpanel"]')).not.toBeNull();
        expect(body.closest('wj-tabpanel')).toBeNull();
      }
      expect(tabEls(element).map((tab) => tab.textContent.trim())).toEqual([
        'Overview',
        'Specifications',
        'Reviews',
      ]);
      expect(element.querySelectorAll('wj-tab [data-wj-part]').length).toBe(0);
    });

    it('keeps the part hosts after the Optimus root, hidden and out of the layout', async () => {
      const { element } = await render();
      const tabsHost = find(element, 'wj-tabs', HTMLElement);

      expect(Array.from(tabsHost.children).map((child) => child.localName)).toEqual([
        'p-tabs',
        'wj-tablist',
        'wj-tabpanels',
      ]);
      const hosts = tabsHost.querySelectorAll('wj-tablist, wj-tab, wj-tabpanels, wj-tabpanel');
      expect(hosts.length).toBe(8);
      for (const host of hosts) {
        expect(host.hasAttribute('hidden')).toBe(true);
        expect(getComputedStyle(host).display).toBe('none');
        expect(host.getAttribute('class')).toBeNull();
        expect(host.getAttribute('style')).toBeNull();
      }
    });

    it('renders a tab with no panel, and a panel with no tab, without failing', async () => {
      const { element, tabs } = await render('light', (host) => {
        host.tabs.set([
          { value: 'a', label: 'A', body: 'Alpha' },
          { value: 'b', label: 'B', body: 'Bravo' },
        ]);
        host.value.set('a');
        host.bonus.set(true);
      });

      expect(await tabs.getTabLabels()).toEqual(['A', 'B', 'Bonus']);
      expect(panelEls(element).length).toBe(3);
      await (await tabs.getTabs({ label: 'Bonus' }))[0]?.select();
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('Only while it is declared.');
    });

    it('draws only the strip’s rule, and no Tab stop, with no tabs', async () => {
      const { element } = await render('light', (host) => {
        host.tabs.set([]);
      });
      find(element, '#before', HTMLElement).focus();

      expect(tabEls(element).length).toBe(0);
      expect(panelEls(element).length).toBe(0);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('does not render content that is not a part', async () => {
      const { element } = await renderSmall(StrayHost);

      expect(element.querySelector('#stray')).toBeNull();
      expect(element.querySelector('#orphan')).toBeNull();
      expect(element.querySelector('#loose-in-list')).toBeNull();
      expect(element.querySelector('#loose-in-panels')).toBeNull();
      expect(tabEls(element).length).toBe(1);
      expect(panelEls(element).length).toBe(1);
    });

    it('follows tabs added, removed and reordered', async () => {
      const { host, tabs, element } = await render();
      const overviewBody = find(element, '.body', HTMLElement);

      host.tabs.set([...TABS].reverse());
      await expect
        .poll(() => tabs.getTabLabels())
        .toEqual(['Reviews', 'Specifications', 'Overview']);
      expect(overviewBody.isConnected).toBe(true);
      expect(overviewBody.textContent).toBe('What the product is.');
      expect(element.querySelectorAll('.body').length).toBe(3);
      expect(await tabs.getSelectedPanelText()).toBe('What the product is.');

      host.tabs.set(TABS.slice(1));
      await expect.poll(() => tabs.getTabLabels()).toEqual(['Specifications', 'Reviews']);
      expect(overviewBody.isConnected).toBe(false);

      host.bonus.set(true);
      await expect.poll(() => tabs.getTabLabels()).toEqual(['Specifications', 'Reviews', 'Bonus']);

      host.bonus.set(false);
      host.tabs.set([]);
      await expect.poll(() => tabs.getTabLabels()).toEqual([]);
      expect(element.querySelector('p-tab')).toBeNull();
    });
  });

  describe('value', () => {
    it('shows the panel of the value it holds, and follows a value set from outside', async () => {
      const { host, tabs } = await render('light', (hostInstance) => {
        hostInstance.value.set('specs');
      });

      expect(await (await tabs.getSelectedTab())?.getLabel()).toBe('Specifications');
      expect(await tabs.getSelectedPanelText()).toBe('Every measurement.');

      host.value.set('reviews');
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('What buyers say.');
      expect(await (await tabs.getSelectedTab())?.getLabel()).toBe('Reviews');
    });

    it('reports a click once, and a click on the active tab reports nothing new', async () => {
      const { host, tabs } = await render();
      const [overview, specs] = await tabs.getTabs();

      await specs?.select();
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('Every measurement.');
      expect(host.value()).toBe('specs');

      await specs?.select();
      await overview?.select();
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('What the product is.');
      expect(host.reported()).toEqual(['specs', 'overview']);
    });

    it('reports a key press the same way, once per press', async () => {
      const { host, tabs } = await render();
      const [, specs, reviews] = await tabs.getTabs();

      await specs?.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('Every measurement.');

      await reviews?.focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('What buyers say.');
      expect(host.reported()).toEqual(['specs', 'reviews']);
    });

    it('accepts a number as a tab value', async () => {
      const { host, tabs } = await render('light', (hostInstance) => {
        hostInstance.tabs.set([
          { value: 1, label: 'One', body: 'First' },
          { value: 2, label: 'Two', body: 'Second' },
        ]);
        hostInstance.value.set(1);
      });

      await (await tabs.getTabs())[1]?.select();
      await expect.poll(() => tabs.getSelectedPanelText()).toBe('Second');
      expect(host.value()).toBe(2);
    });

    it('leaves no tab active, and reports nothing, when the value matches no tab', async () => {
      const { host, tabs, element } = await render('light', (hostInstance) => {
        hostInstance.value.set('missing');
      });

      expect(await tabs.getSelectedTab()).toBeNull();
      expect(await tabs.getSelectedPanelText()).toBeNull();
      expect(tabEls(element).map((tab) => tab.getAttribute('tabindex'))).toEqual([
        '-1',
        '-1',
        '-1',
      ]);
      expect(host.reported()).toEqual([]);
    });

    it('takes bare scrollable, selectOnFocus and disabled attributes', async () => {
      const { fixture, element } = await renderSmall(BareHost);
      const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTabsHarness);
      const [a, b] = await tabs.getTabs();

      expect(element.querySelector('.p-tabs-scrollable')).not.toBeNull();
      expect(await a?.isDisabled()).toBe(false);
      expect(await b?.isDisabled()).toBe(true);
      expect(await tabs.getTabListAriaLabel()).toBe('Bare');
    });
  });

  describe('scrollable', () => {
    it('adds the scrollable class, and the buttons follow overflow whatever scrollable says', async () => {
      await narrow();
      const { element } = await render('light', (host) => {
        withMonths(host);
        host.scrollable.set(false);
      });

      expect(element.querySelector('.p-tabs-scrollable')).toBeNull();
      await expect.poll(() => navButton(element, 'Next')).not.toBeNull();
      expect(navButton(element, 'Previous')).toBeNull();
    });

    it('shows Next first, then Previous too once scrolled, both named from the translation', async () => {
      await narrow();
      const { element } = await render('light', withMonths);

      expect(element.querySelector('.p-tabs-scrollable')).not.toBeNull();
      await showBothScrollButtons(element);
      expect(navButton(element, 'Previous')?.getAttribute('aria-label')).toBe('Previous');
      expect(navButton(element, 'Next')?.getAttribute('aria-label')).toBe('Next');
    });

    it('follows a changed translation for the scroll buttons', async () => {
      await narrow();
      const { element } = await render('light', withMonths, {
        aria: { previous: 'Trước', next: 'Sau' },
      });

      await expect.poll(() => element.querySelector('[aria-label="Sau"]')).not.toBeNull();
      viewportEl(element).scrollLeft = 120;
      await expect.poll(() => element.querySelector('[aria-label="Trước"]')).not.toBeNull();
    });

    it('scrolls the strip when a scroll button is clicked, and keeps every label on one line', async () => {
      await narrow();
      const { element } = await render('light', withMonths);
      await expect.poll(() => navButton(element, 'Next')).not.toBeNull();

      navButton(element, 'Next')?.click();
      await expect.poll(() => viewportEl(element).scrollLeft, { timeout: 3000 }).toBeGreaterThan(0);
      for (const tab of tabEls(element)) {
        expect(getComputedStyle(tab).whiteSpace).toBe('nowrap');
        expect(tab.getBoundingClientRect().height).toBeLessThan(80);
      }
    });

    it('reaches the scroll buttons through the tab list pt', async () => {
      await narrow();
      const { element } = await render('light', (host) => {
        withMonths(host);
        host.listPt.set({
          prevButton: { 'data-probe': 'prev' },
          nextButton: { 'data-probe': 'next' },
        });
      });

      await showBothScrollButtons(element);
      expect(element.querySelector('[data-probe="prev"]')?.localName).toBe('button');
      expect(element.querySelector('[data-probe="next"]')?.localName).toBe('button');
    });
  });

  describe('pt', () => {
    it('reaches the tabs, the tab list and its parts, a tab, the panels and a panel', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: { 'data-probe': 'tabs' } });
        host.listPt.set({
          root: { 'data-probe': 'list' },
          content: { 'data-probe': 'content' },
          tabList: { 'data-probe': 'tablist' },
          activeBar: { 'data-probe': 'bar' },
        });
        host.panelsPt.set({ root: { 'data-probe': 'panels' } });
        host.tabs.set(
          TABS.map((tab) => ({
            ...tab,
            pt: { root: { 'data-probe': `tab-${String(tab.value)}` } },
            panelPt: { root: { 'data-probe': `panel-${String(tab.value)}` } },
          })),
        );
      });

      const probe = (name: string): Element | null =>
        element.querySelector(`[data-probe="${name}"]`);
      expect(probe('tabs')?.localName).toBe('p-tabs');
      expect(probe('list')?.localName).toBe('p-tablist');
      expect(probe('content')?.localName).toBe('div');
      expect(probe('tablist')?.getAttribute('role')).toBe('tablist');
      expect(probe('bar')?.localName).toBe('span');
      expect(probe('panels')?.localName).toBe('p-tabpanels');
      expect(probe('tab-specs')?.localName).toBe('p-tab');
      expect(probe('panel-specs')?.localName).toBe('p-tabpanel');
    });

    it('accepts a class string and the function form for a part', async () => {
      const { element } = await render('light', (host) => {
        host.tabs.set([
          {
            ...TABS[0],
            value: 'overview',
            label: 'Overview',
            pt: { root: 'probe-class' },
            panelPt: () => ({ root: () => ({ 'data-probe': 'fn' }) }),
          },
        ]);
      });

      expect(find(element, 'p-tab', HTMLElement).classList.contains('probe-class')).toBe(true);
      expect(find(element, '[data-probe="fn"]', HTMLElement).localName).toBe('p-tabpanel');
    });

    it('changes nothing when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });
  });

  describe('the routed attributes', () => {
    it('puts ariaLabel on the role="tablist" element', async () => {
      const { tabs, element } = await render();

      expect(await tabs.getTabListAriaLabel()).toBe('Product details');
      expect(await tabs.getTabListAriaLabelledBy()).toBeNull();
      expect(find(element, '[role="tablist"]', HTMLElement).getAttribute('aria-label')).toBe(
        'Product details',
      );
      expect(element.querySelectorAll('[aria-label="Product details"]').length).toBe(1);
    });

    it('puts ariaLabelledBy on the role="tablist" element, pointing at a real caption', async () => {
      const { tabs, element } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
      });

      expect(await tabs.getTabListAriaLabelledBy()).toBe('caption');
      expect(await tabs.getTabListAriaLabel()).toBeNull();
      expect(element.querySelector('#caption')?.textContent).toBe('Account settings');
    });

    it('follows a name set, changed and cleared after the first render', async () => {
      const { host, tabs, fixture } = await render();

      host.ariaLabel.set('Renamed');
      await fixture.whenStable();
      await expect.poll(() => tabs.getTabListAriaLabel()).toBe('Renamed');

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('caption');
      await fixture.whenStable();
      await expect.poll(() => tabs.getTabListAriaLabel()).toBeNull();
      await expect.poll(() => tabs.getTabListAriaLabelledBy()).toBe('caption');

      host.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => tabs.getTabListAriaLabelledBy()).toBeNull();
    });

    it('keeps the consumer’s tab list pt keys, and lets the routed name win over the same key', async () => {
      const { tabs, element } = await render('light', (host) => {
        host.listPt.set({ tabList: { 'data-probe': 'kept', 'aria-label': 'From pt' } });
      });

      expect(element.querySelector('[data-probe="kept"]')?.getAttribute('role')).toBe('tablist');
      expect(await tabs.getTabListAriaLabel()).toBe('Product details');
    });

    it('keeps a consumer’s own name when nothing is routed', async () => {
      const { tabs } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
        host.listPt.set(() => ({ tabList: { 'aria-label': 'From pt' } }));
      });

      expect(await tabs.getTabListAriaLabel()).toBe('From pt');
    });

    it('puts tabindex="0" on every panel, shown or hidden, and wins over the consumer’s value', async () => {
      const { element } = await render('light', (host) => {
        host.tabs.set(
          TABS.map((tab) => ({
            ...tab,
            panelPt: { root: { tabindex: '-1', 'data-probe': 'kept' } },
          })),
        );
      });

      const panels = panelEls(element);
      expect(panels.length).toBe(3);
      expect(panels.map((panel) => panel.getAttribute('tabindex'))).toEqual(['0', '0', '0']);
      expect(element.querySelectorAll('[data-probe="kept"]').length).toBe(3);
      expect(panels.map((panel) => panel.hasAttribute('hidden'))).toEqual([false, true, true]);
    });
  });

  describe('disabled tab', () => {
    const withDisabled = (host: Host): void => {
      host.tabs.set(TABS.map((tab) => ({ ...tab, disabled: tab.value === 'specs' })));
    };

    it('cannot be activated, takes no focus and is not clickable', async () => {
      const { host, tabs, element } = await render('light', withDisabled);
      const specs = (await tabs.getTabs())[1];

      expect(await specs?.isDisabled()).toBe(true);
      expect(tabEls(element)[1]?.getAttribute('tabindex')).toBe('-1');
      await specs?.select();
      expect(await specs?.isSelected()).toBe(false);
      expect(await tabs.getSelectedPanelText()).toBe('What the product is.');
      expect(host.reported()).toEqual([]);
    });

    it('is skipped by the Tab key', async () => {
      const { element } = await render('light', withDisabled);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(tabEls(element)[0]);
      await userEvent.tab();
      expect(document.activeElement).not.toBe(tabEls(element)[1]);
    });
  });

  describe('host attributes and setup', () => {
    it.each([
      [
        'wj-tabs',
        AriaOnMainHost,
        'Remove it: name the tab list with the ariaLabel input of wj-tablist',
      ],
      ['wj-tablist', AriaOnListHost, 'Use the ariaLabel or ariaLabelledBy input instead'],
      ['wj-tab', AriaOnTabHost, 'Remove it: the tab is named by its own text'],
      ['wj-tabpanels', AriaOnPanelsHost, 'Remove it: each panel is named by its tab'],
      ['wj-tabpanel', AriaOnPanelHost, 'Remove it: the panel is named by its tab'],
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
        'WJ0001: wj-tabs: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in a value, an ariaLabel and an ariaLabelledBy as text, never as markup', async () => {
      const { element } = await renderSmall(PayloadHost);
      const tab = tabEls(element)[0];
      const panel = panelEls(element)[0];
      const list = find(element, '[role="tablist"]', HTMLElement);

      expect(element.querySelector('img')).toBeNull();
      expect(tab?.id.endsWith(PAYLOAD)).toBe(true);
      expect(tab?.getAttribute('aria-selected')).toBe('true');
      expect(panel?.id.endsWith(PAYLOAD)).toBe(true);
      expect(panel?.getAttribute('aria-labelledby')).toBe(tab?.id);
      expect(list.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(list.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('is a block with no box of its own', async () => {
      const { element } = await render();
      const style = getComputedStyle(find(element, 'wj-tabs', HTMLElement));

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.margin).toBe('0px');
    });

    it('lays the strip out unscrolled, with no scroll buttons, when the tabs fit', async () => {
      const { element } = await render();

      expect(viewportEl(element).scrollWidth).toBeLessThanOrEqual(viewportEl(element).clientWidth);
      expect(element.querySelector('[data-pc-group-section="navigator"]')).toBeNull();
    });
  });

  describe('hit boxes', () => {
    it('makes every tab at least 24 by 24 px', async () => {
      const { element } = await render();

      for (const tab of tabEls(element)) {
        const box = tab.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    it('makes both scroll buttons at least 24 by 24 px', async () => {
      await narrow();
      const { element } = await render('light', withMonths);

      await showBothScrollButtons(element);
      for (const name of ['Previous', 'Next'] as const) {
        const box = (navButton(element, name) ?? element).getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup, isNarrow) => {
        if (isNarrow) {
          await narrow();
        }
        const { element } = await render(scheme, setup);
        if (isNarrow) {
          await showBothScrollButtons(element);
        }

        await expectNoAxeViolations(find(element, 'wj-tabs', HTMLElement));
      });
    });

    it('has no axe violations with a panel that holds a focusable control', async () => {
      const { element } = await render('light', (host) => {
        host.tabs.set(TABS.map((tab) => ({ ...tab, action: true })));
      });

      await expectNoAxeViolations(find(element, 'wj-tabs', HTMLElement));
    });
  });

  describe('keyboard', () => {
    /** Moves the pointer onto a neutral element so no tab stays hovered. */
    const clearPointer = async (element: HTMLElement): Promise<void> => {
      await userEvent.hover(find(element, '#before', HTMLElement));
    };

    it('Tab lands on the active tab, a second Tab leaves for the panel, then the page continues', async () => {
      const { element } = await render('light', (host) => {
        host.tabs.set(TABS.map((tab) => ({ ...tab, action: tab.value === 'overview' })));
      });
      const tabs = tabEls(element);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(tabs[0]);
      await userEvent.tab();
      expect(document.activeElement).toBe(panelEls(element)[0]);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '.action', HTMLElement));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(panelEls(element)[0]);
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(tabs[0]);
    });

    it('lands on whichever tab is active, and no other tab is a Tab stop', async () => {
      const { element } = await render('light', (host) => {
        host.value.set('reviews');
      });
      const tabs = tabEls(element);
      find(element, '#before', HTMLElement).focus();

      expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
      await userEvent.tab();
      expect(document.activeElement).toBe(tabs[2]);
    });

    it('Right Arrow moves focus exactly one tab and wraps from the last to the first, activating nothing', async () => {
      const { tabs, host } = await render();
      const all = await tabs.getTabs();
      await all[0]?.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(await all[1]?.isFocused()).toBe(true);
      expect(await all[2]?.isFocused()).toBe(false);
      await userEvent.keyboard('{ArrowRight}');
      expect(await all[2]?.isFocused()).toBe(true);
      await userEvent.keyboard('{ArrowRight}');
      expect(await all[0]?.isFocused()).toBe(true);

      expect(await tabs.getSelectedPanelText()).toBe('What the product is.');
      expect(host.reported()).toEqual([]);
    });

    it('Left Arrow moves focus exactly one tab and wraps from the first to the last', async () => {
      const { tabs } = await render();
      const all = await tabs.getTabs();
      await all[0]?.focus();

      await userEvent.keyboard('{ArrowLeft}');
      expect(await all[2]?.isFocused()).toBe(true);
      await userEvent.keyboard('{ArrowLeft}');
      expect(await all[1]?.isFocused()).toBe(true);
      expect(await all[0]?.isFocused()).toBe(false);
    });

    it('the arrow keys skip a disabled tab', async () => {
      const { tabs } = await render('light', (host) => {
        host.tabs.set(TABS.map((tab) => ({ ...tab, disabled: tab.value === 'specs' })));
      });
      const [first, , last] = await tabs.getTabs();
      await first?.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(await last?.isFocused()).toBe(true);
      await userEvent.keyboard('{ArrowLeft}');
      expect(await first?.isFocused()).toBe(true);
    });

    it('Home moves to the first tab and End to the last, skipping a disabled one', async () => {
      const { tabs } = await render('light', (host) => {
        host.tabs.set(TABS.map((tab) => ({ ...tab, disabled: tab.value === 'reviews' })));
      });
      const [first, second] = await tabs.getTabs();
      await first?.focus();

      await userEvent.keyboard('{End}');
      expect(await second?.isFocused()).toBe(true);
      await userEvent.keyboard('{Home}');
      expect(await first?.isFocused()).toBe(true);
    });

    it('Enter and Space activate the focused tab, once per press (manual activation)', async () => {
      const { tabs, host } = await render();
      const [, specs, reviews] = await tabs.getTabs();

      await specs?.focus();
      expect(await specs?.isSelected()).toBe(false);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => specs?.isSelected()).toBe(true);

      await reviews?.focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => reviews?.isSelected()).toBe(true);
      expect(host.reported()).toEqual(['specs', 'reviews']);
    });

    it('focus alone activates a tab with selectOnFocus', async () => {
      const { tabs, host } = await render('light', (hostInstance) => {
        hostInstance.selectOnFocus.set(true);
      });
      const [first, second] = await tabs.getTabs();
      await first?.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(await second?.isFocused()).toBe(true);
      await expect.poll(() => second?.isSelected()).toBe(true);
      expect(await tabs.getSelectedPanelText()).toBe('Every measurement.');
      expect(host.reported()).toEqual(['specs']);
    });

    it('focus alone activates nothing without selectOnFocus', async () => {
      const { tabs, host, fixture } = await render();
      const [, second] = await tabs.getTabs();

      await second?.focus();
      await fixture.whenStable();

      expect(await second?.isFocused()).toBe(true);
      expect(await second?.isSelected()).toBe(false);
      expect(host.reported()).toEqual([]);
    });

    it('Page Down and Page Up scroll the strip to the last and the first tab without moving focus', async () => {
      await narrow();
      const { tabs, element } = await render('light', withMonths);
      const [january] = await tabs.getTabs();
      await january?.focus();
      await clearPointer(element);
      await january?.focus();

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => viewportEl(element).scrollLeft, { timeout: 3000 }).toBeGreaterThan(0);
      expect(await january?.isFocused()).toBe(true);
      expect(await (await tabs.getSelectedTab())?.getLabel()).toBe('January');

      await userEvent.keyboard('{PageUp}');
      await expect.poll(() => viewportEl(element).scrollLeft, { timeout: 3000 }).toBe(0);
      expect(await january?.isFocused()).toBe(true);
    });
  });

  describe('harness', () => {
    it('finds tabs by label and reports state through ARIA', async () => {
      const { tabs } = await render('light', (host) => {
        host.tabs.set(TABS.map((tab) => ({ ...tab, disabled: tab.value === 'reviews' })));
      });

      const specs = await tabs.getTabs({ label: 'Specifications' });
      expect(specs.length).toBe(1);
      expect(await specs[0]?.isDisabled()).toBe(false);
      expect((await tabs.getTabs({ label: /^R/ })).length).toBe(1);
      expect(await (await tabs.getTabs({ label: 'Reviews' }))[0]?.isDisabled()).toBe(true);
    });

    it('finds one tab through the loader and drives it', async () => {
      const { fixture } = await render();
      const tab = await TestbedHarnessEnvironment.loader(fixture).getHarness(
        WjTabHarness.with({ label: 'Reviews' }),
      );

      expect(await tab.isSelected()).toBe(false);
      await tab.select();
      await expect.poll(() => tab.isSelected()).toBe(true);
      await tab.focus();
      expect(await tab.isFocused()).toBe(true);
    });

    it('reads the tab list’s name attributes and the panel on show', async () => {
      const { tabs } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
      });

      expect(await tabs.getTabListAriaLabel()).toBeNull();
      expect(await tabs.getTabListAriaLabelledBy()).toBe('caption');
      expect(await tabs.getSelectedPanelText()).toBe('What the product is.');
    });

    it('names no Optimus class', () => {
      expect(WjTabHarness.hostSelector).toBe('[data-wj-part="tab"]');
      expect(WjTabsHarness.hostSelector).toBe('wj-tabs');
    });
  });

  describe('motion', () => {
    /** Appends a copy of `rule` to the page, inside the `wj` layer and after every other style. */
    const addToWjLayer = (rule: Rule): void => {
      const style = document.createElement('style');
      style.setAttribute('data-wj-spec', '');
      style.textContent = `@layer wj { ${rule.cssText} }`;
      document.head.append(style);
    };

    it('moves the active bar and scrolls smoothly by default, on Optimus’s own rules', async () => {
      const { element } = await render();
      const bar = find(element, '[data-pc-section="activebar"]', HTMLElement);

      expect(getComputedStyle(bar).transitionProperty).toBe('all');
      expect(getComputedStyle(bar).transitionDuration).toBe('0.25s');
      expect(getComputedStyle(viewportEl(element)).scrollBehavior).toBe('smooth');
    });

    it('holds a reduced-motion rule for the bar and one for the strip, in the wj layer', async () => {
      await render();

      const rules = mediaStyleRules('prefers-reduced-motion');
      const bar = rules.find((rule) => rule.selectorText.endsWith('.p-tablist-active-bar'));
      const strip = rules.find((rule) => rule.selectorText.endsWith('.p-tablist-viewport'));
      expect(bar?.style.transitionProperty).toBe('none');
      expect(strip?.style.scrollBehavior).toBe('auto');
      expect(layerOfRule('.p-tablist-active-bar')).toEqual(['wj']);
      expect(layerOfRule('.p-tablist-viewport')).toEqual(['wj']);
    });

    it('wins over Optimus’s rule: the same rule, once its media block applies, stops the bar and the glide', async () => {
      // `matchMedia` cannot change what a CSS media query matches, and a CDP emulation would change
      // the whole shared page. So the spec lifts the rule out of its media block, into the same
      // `wj` layer after every other style, and reads the cascade the way a reduced-motion reader
      // gets it: only selector specificity can decide it.
      const { element } = await render();
      const bar = find(element, '[data-pc-section="activebar"]', HTMLElement);
      const rules = mediaStyleRules('prefers-reduced-motion');
      const barRule = rules.find((rule) => rule.selectorText.endsWith('.p-tablist-active-bar'));
      const stripRule = rules.find((rule) => rule.selectorText.endsWith('.p-tablist-viewport'));
      if (!barRule || !stripRule) {
        throw new Error('the reduced-motion rules are missing');
      }

      addToWjLayer(barRule);
      addToWjLayer(stripRule);

      expect(getComputedStyle(bar).transitionProperty).toBe('none');
      expect(getComputedStyle(bar).transitionDuration).toBe('0s');
      expect(getComputedStyle(viewportEl(element)).scrollBehavior).toBe('auto');
    });

    it('touches only the bar and the strip', async () => {
      await render();

      const rules = mediaStyleRules('prefers-reduced-motion').filter((rule) =>
        rule.selectorText.includes('_nghost'),
      );
      expect(rules.map((rule) => rule.selectorText.replace(/_nghost-[a-z0-9-]+/, 'host'))).toEqual([
        '[host] .p-tablist-active-bar',
        '[host] .p-tablist-viewport',
      ]);
    });
  });
});
