import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import {
  WjToolbar,
  WjToolbarCenterSlot,
  WjToolbarEndSlot,
  WjToolbarStartSlot,
  type WjToolbarPt,
} from 'weeljack-ng/toolbar';
import { WjToolbarHarness } from 'weeljack-ng/toolbar/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: native buttons around one toolbar, sections and content driven by signals. */
@Component({
  selector: 'wj-toolbar-host',
  imports: [WjToolbar, WjToolbarStartSlot, WjToolbarCenterSlot, WjToolbarEndSlot, WjButton],
  template: `
    <button type="button" id="before">Before</button>
    <p id="caption">Table actions</p>
    <div [style.width]="width()">
      <wj-toolbar
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
        [style.--wj-toolbar-gap]="gap()"
      >
        @if (leading()) {
          <wj-button class="lead" label="Lead one" size="small" />
          <wj-button class="lead" label="Lead two" size="small" />
        }
        @if (start()) {
          <ng-template wjToolbarStart>
            @for (label of startLabels(); track label) {
              <wj-button class="start" [label]="label" size="small" severity="secondary" />
            }
          </ng-template>
        }
        @if (center()) {
          <ng-template wjToolbarCenter>
            <wj-button class="center" label="Undo" size="small" severity="secondary" />
            <wj-button class="center" label="Redo" size="small" severity="secondary" />
          </ng-template>
        }
        @if (end()) {
          <ng-template wjToolbarEnd>
            <wj-button class="end" label="Share" size="small" severity="secondary" />
            <wj-button class="end" label="Save" size="small" />
          </ng-template>
        }
      </wj-toolbar>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjToolbarPt>(undefined);
  readonly leading = signal(false);
  readonly start = signal(true);
  readonly center = signal(true);
  readonly end = signal(true);
  readonly startLabels = signal(['New', 'Open']);
  readonly width = signal<string | undefined>(undefined);
  readonly gap = signal<string | undefined>(undefined);
}

/** A toolbar with no sections at all, only default content. */
@Component({
  selector: 'wj-toolbar-bare-host',
  imports: [WjToolbar],
  template: `<wj-toolbar><span class="only">Only content</span></wj-toolbar>`,
})
class BareHost {}

/** A consumer who writes `aria-*` on the host instead of using the inputs. */
@Component({
  selector: 'wj-toolbar-aria-host',
  imports: [WjToolbar],
  template: `<wj-toolbar aria-label="Other">Content</wj-toolbar>`,
})
class AriaOnHostHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  toolbar: WjToolbarHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function findAll(root: ParentNode, selector: string): HTMLElement[] {
  return [...root.querySelectorAll(selector)].filter(
    (found): found is HTMLElement => found instanceof HTMLElement,
  );
}

const barOf = (root: ParentNode): HTMLElement => find(root, '[role="toolbar"]', HTMLElement);
const sectionOf = (root: ParentNode, name: 'start' | 'center' | 'end'): HTMLElement =>
  find(root, `[data-pc-section="${name}"]`, HTMLElement);

/** The inner edges of the bar's content box: where its border and padding end. */
function contentBox(bar: HTMLElement): { left: number; right: number } {
  const box = bar.getBoundingClientRect();
  const style = getComputedStyle(bar);
  return {
    left: box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
    right: box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
  };
}

const middle = (box: { left: number; right: number }): number => (box.left + box.right) / 2;

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
  if (getComputedStyle(barOf(element)).display !== 'flex') {
    throw new Error("Optimus's toolbar styles did not load");
  }
  const toolbar = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjToolbarHarness);
  return { fixture, host: fixture.componentInstance, toolbar, element };
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

/** The documented states for axe (FR-48). */
const STATES: [string, (host: Host) => void][] = [
  ['three sections filled with buttons', () => undefined],
  [
    'labelled through ariaLabel',
    (host) => {
      host.ariaLabel.set('Document');
    },
  ],
  [
    'labelled through ariaLabelledBy',
    (host) => {
      host.ariaLabelledBy.set('caption');
    },
  ],
];

describe('WjToolbar', () => {
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
  });

  describe('inputs and content', () => {
    it('renders default content first, then the sections in order', async () => {
      const { element } = await render('light', (host) => {
        host.leading.set(true);
      });
      const order = [...barOf(element).children]
        .map((child) => child.getAttribute('data-pc-section') ?? child.className.split(' ')[0])
        .filter((name) => name !== undefined && name !== '');

      expect(order).toEqual(['lead', 'lead', 'start', 'center', 'end']);
    });

    it('renders nothing of its own when there is no content and no slot', async () => {
      const { element } = await renderSmall(BareHost);

      expect(element.querySelector('.only')?.textContent).toBe('Only content');
      for (const name of ['start', 'center', 'end']) {
        expect(element.querySelector(`[data-pc-section="${name}"]`)).toBeNull();
      }
    });

    it('is a block with no box of its own', async () => {
      const { element } = await render();
      const host = getComputedStyle(find(element, 'wj-toolbar', HTMLElement));

      expect(host.display).toBe('block');
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
        expect(host.getPropertyValue(`margin-${side.toLowerCase()}`)).toBe('0px');
        expect(host.getPropertyValue(`padding-${side.toLowerCase()}`)).toBe('0px');
        expect(host.getPropertyValue(`border-${side.toLowerCase()}-width`)).toBe('0px');
      }
      expect(host.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('draws the bar the way the preset says: 1 px border, 12 px padding and radius', async () => {
      const { element } = await render();
      const bar = getComputedStyle(barOf(element));

      expect(bar.borderTopWidth).toBe('1px');
      expect(bar.paddingTop).toBe('12px');
      expect(bar.borderTopLeftRadius).toBe('12px');
      expect(bar.alignItems).toBe('center');
    });
  });

  describe('slots', () => {
    it('renders each slot template in its own section', async () => {
      const { element, toolbar } = await render();

      expect(await toolbar.getStartText()).toBe('NewOpen');
      expect(await toolbar.getCenterText()).toBe('UndoRedo');
      expect(await toolbar.getEndText()).toBe('ShareSave');
      expect(findAll(sectionOf(element, 'start'), 'button.p-button').length).toBe(2);
      expect(findAll(sectionOf(element, 'center'), 'button.p-button').length).toBe(2);
      expect(findAll(sectionOf(element, 'end'), 'button.p-button').length).toBe(2);
    });

    it('draws no section for a slot nobody filled', async () => {
      const { element, toolbar } = await render('light', (host) => {
        host.start.set(false);
        host.end.set(false);
      });

      expect(await toolbar.getStartText()).toBeNull();
      expect(await toolbar.getEndText()).toBeNull();
      expect(await toolbar.getCenterText()).toBe('UndoRedo');
      expect(element.querySelector('[data-pc-section="start"]')).toBeNull();
      expect(element.querySelector('[data-pc-section="end"]')).toBeNull();
    });

    it('follows a slot that appears and goes after the toolbar was created', async () => {
      const { element, host, toolbar } = await render('light', (instance) => {
        instance.start.set(false);
        instance.center.set(false);
        instance.end.set(false);
      });
      expect(element.querySelectorAll('[data-pc-section]').length).toBeGreaterThan(0);
      expect(await toolbar.getStartText()).toBeNull();

      host.start.set(true);
      host.center.set(true);
      host.end.set(true);
      await expect.poll(() => element.querySelectorAll('.start').length).toBe(2);
      await expect.poll(() => element.querySelectorAll('.center').length).toBe(2);
      await expect.poll(() => element.querySelectorAll('.end').length).toBe(2);

      host.start.set(false);
      host.center.set(false);
      host.end.set(false);
      await expect.poll(() => element.querySelectorAll('.start').length).toBe(0);
      await expect.poll(() => element.querySelectorAll('.center').length).toBe(0);
      await expect.poll(() => element.querySelectorAll('.end').length).toBe(0);
      for (const name of ['start', 'center', 'end']) {
        expect(element.querySelector(`[data-pc-section="${name}"]`)).toBeNull();
      }
    });

    it('stamps a slot template once, and follows the content inside it', async () => {
      const { element, host } = await render();

      host.startLabels.set(['New', 'Open', 'Close']);
      await expect.poll(() => element.querySelectorAll('.start').length).toBe(3);
      host.startLabels.set(['New']);
      await expect.poll(() => element.querySelectorAll('.start').length).toBe(1);
    });
  });

  describe('pt', () => {
    it('reaches every part', async () => {
      const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: probe('root'),
          start: probe('start'),
          center: probe('center'),
          end: probe('end'),
        });
      });

      const at = (name: string): Element | null => element.querySelector(`[data-probe="${name}"]`);
      expect(at('root')?.localName).toBe('p-toolbar');
      expect(at('start')?.getAttribute('data-pc-section')).toBe('start');
      expect(at('center')?.getAttribute('data-pc-section')).toBe('center');
      expect(at('end')?.getAttribute('data-pc-section')).toBe('end');
    });

    it('accepts a class string and the function form for a part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: 'probe-class', end: () => ({ 'data-probe': 'fn' }) });
      });

      expect(barOf(element).classList.contains('probe-class')).toBe(true);
      expect(find(element, '[data-probe="fn"]', HTMLElement).getAttribute('data-pc-section')).toBe(
        'end',
      );
    });

    it('changes nothing visible when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
      expect(barOf(element).hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('accessible name', () => {
    it('is a role="toolbar" element with no name until one is given', async () => {
      const { element, toolbar } = await render();
      const bar = barOf(element);

      expect(bar.localName).toBe('p-toolbar');
      expect(bar.hasAttribute('aria-label')).toBe(false);
      expect(bar.hasAttribute('aria-labelledby')).toBe(false);
      expect(await toolbar.getAriaLabel()).toBeNull();
      expect(await toolbar.getAriaLabelledBy()).toBeNull();
    });

    it('lands ariaLabel on the role="toolbar" element, and clears it when unset', async () => {
      const { element, fixture, host, toolbar } = await render('light', (instance) => {
        instance.ariaLabel.set('Document');
      });

      expect(barOf(element).getAttribute('aria-label')).toBe('Document');
      expect(await toolbar.getAriaLabel()).toBe('Document');
      expect(find(element, 'wj-toolbar', HTMLElement).hasAttribute('aria-label')).toBe(false);

      host.ariaLabel.set('Table');
      await fixture.whenStable();
      expect(barOf(element).getAttribute('aria-label')).toBe('Table');

      host.ariaLabel.set(undefined);
      await fixture.whenStable();
      expect(barOf(element).hasAttribute('aria-label')).toBe(false);
      expect(await toolbar.getAriaLabel()).toBeNull();
    });

    it('lands ariaLabelledBy on the role="toolbar" element, and clears it when unset', async () => {
      const { element, fixture, host, toolbar } = await render('light', (instance) => {
        instance.ariaLabelledBy.set('caption');
      });

      expect(barOf(element).getAttribute('aria-labelledby')).toBe('caption');
      expect(await toolbar.getAriaLabelledBy()).toBe('caption');
      expect(find(element, 'wj-toolbar', HTMLElement).hasAttribute('aria-labelledby')).toBe(false);

      host.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      expect(barOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(await toolbar.getAriaLabelledBy()).toBeNull();
    });

    it('can carry both names at once', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Document');
        host.ariaLabelledBy.set('caption');
      });

      expect(barOf(element).getAttribute('aria-label')).toBe('Document');
      expect(barOf(element).getAttribute('aria-labelledby')).toBe('caption');
    });

    it('keeps a consumer key on the root the wrapper routes aria-label to', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Document');
        host.pt.set({ root: { 'data-keep': 'root' } });
      });

      expect(barOf(element).getAttribute('data-keep')).toBe('root');
      expect(barOf(element).getAttribute('aria-label')).toBe('Document');
    });

    it('lets a routed aria-label win over a consumer value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Document');
        host.pt.set({ root: { 'aria-label': 'Consumer' } });
      });

      expect(barOf(element).getAttribute('aria-label')).toBe('Document');
    });

    it('keeps a consumer aria-label while ariaLabel is unset, and in the function form', async () => {
      const { element, host, fixture } = await render('light', (instance) => {
        instance.pt.set({ root: { 'aria-label': 'Consumer' } });
      });
      expect(barOf(element).getAttribute('aria-label')).toBe('Consumer');

      host.pt.set(() => ({ root: { 'aria-label': 'From a function', 'data-keep': 'fn' } }));
      await fixture.whenStable();
      expect(barOf(element).getAttribute('aria-label')).toBe('From a function');
      expect(barOf(element).getAttribute('data-keep')).toBe('fn');

      host.ariaLabel.set('Document');
      await fixture.whenStable();
      expect(barOf(element).getAttribute('aria-label')).toBe('Document');
      expect(barOf(element).getAttribute('data-keep')).toBe('fn');
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      const { element } = await renderSmall(AriaOnHostHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-toolbar: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel or ariaLabelledBy input to name the toolbar. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(element.querySelector('[aria-label="Other"]:not(wj-toolbar)')).toBeNull();
    });

    it('stays silent for a named toolbar', async () => {
      await render('light', (host) => {
        host.ariaLabel.set('Document');
      });

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-toolbar: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in ariaLabel as text, never as markup', async () => {
      const { element, toolbar } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
      });

      expect(await toolbar.getAriaLabel()).toBe(PAYLOAD);
      expect(barOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('shows an HTML payload in ariaLabelledBy as an attribute, never as markup', async () => {
      const { element, toolbar } = await render('light', (host) => {
        host.ariaLabelledBy.set(PAYLOAD);
      });

      expect(await toolbar.getAriaLabelledBy()).toBe(PAYLOAD);
      expect(barOf(element).getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('beats Optimus: the bar packs from the inline start, not space-between', async () => {
      const { element } = await render();

      // Chrome serialises `flex-start` as `flow-start`; the geometry specs below prove the packing.
      expect(['flex-start', 'flow-start', 'start']).toContain(
        getComputedStyle(barOf(element)).justifyContent,
      );
    });

    it('packs default content from the inline start, 8 px apart, never spread', async () => {
      const { element } = await render('light', (host) => {
        host.leading.set(true);
        host.start.set(false);
        host.center.set(false);
        host.end.set(false);
        host.width.set('900px');
      });
      const [one, two] = findAll(element, '.lead').map((lead) => lead.getBoundingClientRect());
      const box = contentBox(barOf(element));

      expect(Math.abs((one?.left ?? NaN) - box.left)).toBeLessThanOrEqual(1);
      expect(Math.abs((two?.left ?? NaN) - (one?.right ?? NaN) - 8)).toBeLessThanOrEqual(1);
      expect(box.right - (two?.right ?? NaN)).toBeGreaterThan(500);
    });

    it('sends a lone end section to the inline end', async () => {
      const { element } = await render('light', (host) => {
        host.start.set(false);
        host.center.set(false);
        host.width.set('900px');
      });
      const end = sectionOf(element, 'end').getBoundingClientRect();
      const box = contentBox(barOf(element));

      expect(Math.abs(end.right - box.right)).toBeLessThanOrEqual(1);
      expect(end.left - box.left).toBeGreaterThan(500);
    });

    it('keeps a lone start section at the inline start', async () => {
      const { element } = await render('light', (host) => {
        host.center.set(false);
        host.end.set(false);
        host.width.set('900px');
      });
      const start = sectionOf(element, 'start').getBoundingClientRect();
      const box = contentBox(barOf(element));

      expect(Math.abs(start.left - box.left)).toBeLessThanOrEqual(1);
      expect(box.right - start.right).toBeGreaterThan(500);
    });

    it('centres the center section in the free space between start and end', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('900px');
        // Unequal neighbours: a plain space-between would centre on the bar, not the free space.
        host.startLabels.set(['New', 'Open', 'Close', 'Archive']);
      });
      const start = sectionOf(element, 'start').getBoundingClientRect();
      const center = sectionOf(element, 'center').getBoundingClientRect();
      const end = sectionOf(element, 'end').getBoundingClientRect();
      const box = contentBox(barOf(element));

      expect(Math.abs(start.left - box.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(end.right - box.right)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(middle(center) - middle({ left: start.right, right: end.left })),
      ).toBeLessThanOrEqual(1);
      expect(getComputedStyle(sectionOf(element, 'end')).marginInlineStart).toBe('0px');
    });

    it('centres the center section in the free space before an end section, with no start', async () => {
      const { element } = await render('light', (host) => {
        host.start.set(false);
        host.width.set('900px');
      });
      const center = sectionOf(element, 'center').getBoundingClientRect();
      const end = sectionOf(element, 'end').getBoundingClientRect();
      const box = contentBox(barOf(element));

      expect(Math.abs(end.right - box.right)).toBeLessThanOrEqual(1);
      // The bar's own 8 px gap sits between the center and the end only, so the centre is half a
      // gap (4 px) left of the middle of the free space: the two sides match once the gap is out.
      const gap = 8;
      expect(
        Math.abs(middle(center) - middle({ left: box.left, right: end.left - gap })),
      ).toBeLessThanOrEqual(1);
    });

    it('centres a lone center section in the bar', async () => {
      const { element } = await render('light', (host) => {
        host.start.set(false);
        host.end.set(false);
        host.width.set('900px');
      });
      const center = sectionOf(element, 'center').getBoundingClientRect();

      expect(Math.abs(middle(center) - middle(contentBox(barOf(element))))).toBeLessThanOrEqual(1);
    });

    it('puts the toolbar gap between the controls of a section, and lets wj-toolbar change it', async () => {
      const { element, host } = await render('light', (instance) => {
        instance.width.set('900px');
      });
      const gapOf = (name: 'start' | 'center' | 'end'): string =>
        getComputedStyle(sectionOf(element, name)).columnGap;

      expect([gapOf('start'), gapOf('center'), gapOf('end')]).toEqual(['8px', '8px', '8px']);
      const [first, second] = findAll(element, '.start').map((button) =>
        button.getBoundingClientRect(),
      );
      expect(Math.abs((second?.left ?? NaN) - (first?.right ?? NaN) - 8)).toBeLessThanOrEqual(1);

      host.gap.set('20px');
      await expect.poll(() => gapOf('start')).toBe('20px');
      expect(gapOf('end')).toBe('20px');
    });

    it('wraps controls and sections onto new rows and never overflows the host', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('14rem');
        host.startLabels.set(['New', 'Open', 'Close', 'Archive', 'Rename', 'Delete']);
      });
      const bar = barOf(element);
      const box = contentBox(bar);
      const tops = new Set(
        findAll(sectionOf(element, 'start'), 'button').map((b) =>
          Math.round(b.getBoundingClientRect().top),
        ),
      );
      const sectionTops = (['start', 'center', 'end'] as const).map((name) =>
        Math.round(sectionOf(element, name).getBoundingClientRect().top),
      );

      expect(getComputedStyle(sectionOf(element, 'start')).flexWrap).toBe('wrap');
      expect(tops.size).toBeGreaterThan(1);
      expect(new Set(sectionTops).size).toBe(3);
      for (const button of findAll(bar, 'button')) {
        const rect = button.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(box.left - 1);
        expect(rect.right).toBeLessThanOrEqual(box.right + 1);
      }
      expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
      const host = find(element, 'wj-toolbar', HTMLElement);
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
    });
  });

  describe('hit boxes', () => {
    it('keeps every control at least 24 by 24 px', async () => {
      const { element } = await render();

      for (const button of findAll(barOf(element), 'button')) {
        const box = button.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);
        // A pointer left on a hoverable control changes its colours: park it on a neutral element.
        await userEvent.hover(document.body);

        await expectNoAxeViolations(find(element, 'wj-toolbar', HTMLElement));
      });
    });
  });

  describe('keyboard', () => {
    /** The eight controls' owners, in the order a reader meets them. */
    const owners = ['lead', 'lead', 'start', 'start', 'center', 'center', 'end', 'end'];

    function controls(element: HTMLElement): HTMLElement[] {
      const list = findAll(barOf(element), 'button');
      expect(list.map((control) => control.closest('wj-button')?.className.split(' ')[0])).toEqual(
        owners,
      );
      return list;
    }

    it('Tab moves through every control in order, and Shift+Tab walks back', async () => {
      const { element } = await render('light', (host) => {
        host.leading.set(true);
      });
      const list = controls(element);
      find(element, '#before', HTMLElement).focus();

      for (const control of list) {
        await userEvent.tab();
        expect(document.activeElement).toBe(control);
      }
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(list.at(-1));
      for (const control of list.slice(0, -1).reverse()) {
        await userEvent.tab({ shift: true });
        expect(document.activeElement).toBe(control);
      }
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });

    it('arrow keys, Home and End move nothing: every control keeps its own Tab stop', async () => {
      const { element } = await render('light', (host) => {
        host.leading.set(true);
      });
      const list = controls(element);
      const second = list[3];
      second?.focus();

      for (const key of [
        '{ArrowRight}',
        '{ArrowLeft}',
        '{ArrowDown}',
        '{ArrowUp}',
        '{Home}',
        '{End}',
      ]) {
        await userEvent.keyboard(key);
        expect(document.activeElement).toBe(second);
      }
      for (const control of list) {
        expect(control.getAttribute('tabindex')).not.toBe('-1');
      }
    });
  });

  describe('harness', () => {
    it('reads each section and the ARIA name attributes', async () => {
      const { fixture } = await render('light', (host) => {
        host.ariaLabel.set('Document');
        host.ariaLabelledBy.set('caption');
      });
      const toolbar = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjToolbarHarness);

      expect(await toolbar.getStartText()).toBe('NewOpen');
      expect(await toolbar.getCenterText()).toBe('UndoRedo');
      expect(await toolbar.getEndText()).toBe('ShareSave');
      expect(await toolbar.getAriaLabel()).toBe('Document');
      expect(await toolbar.getAriaLabelledBy()).toBe('caption');
    });

    it('answers null for a section the toolbar does not have', async () => {
      const { toolbar } = await render('light', (host) => {
        host.start.set(false);
        host.center.set(false);
        host.end.set(false);
      });

      expect(await toolbar.getStartText()).toBeNull();
      expect(await toolbar.getCenterText()).toBeNull();
      expect(await toolbar.getEndText()).toBeNull();
    });

    it('names no Optimus class', () => {
      expect(WjToolbarHarness.hostSelector).toBe('wj-toolbar');
    });
  });
});
