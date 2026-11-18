import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjFieldset, type WjFieldsetPt } from 'weeljack-ng/fieldset';
import { WjFieldsetHarness } from 'weeljack-ng/fieldset/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: native buttons around one fieldset, driven by signals. */
@Component({
  selector: 'wj-fieldset-host',
  imports: [WjFieldset],
  template: `
    <button type="button" id="before">Before</button>
    <div [style.width]="width()">
      <wj-fieldset
        [legend]="legend()"
        [toggleable]="toggleable()"
        [collapsed]="collapsed()"
        (collapsedChange)="changed($event)"
        [pt]="pt()"
      >
        <p class="body">Leave it with the neighbour.</p>
        @if (action()) {
          <button type="button" class="action">Action</button>
        }
      </wj-fieldset>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly legend = signal('Order notes');
  readonly toggleable = signal(true);
  readonly collapsed = signal(false);
  readonly pt = signal<WjFieldsetPt>(undefined);
  readonly action = signal(false);
  readonly width = signal<string | undefined>(undefined);
  /** Every value `collapsedChange` reported, in order. */
  readonly reported = signal<boolean[]>([]);

  protected changed(next: boolean): void {
    this.collapsed.set(next);
    this.reported.update((list) => [...list, next]);
  }
}

/** A bare `toggleable` attribute, and `collapsed` bound (a model takes no bare attribute). */
@Component({
  selector: 'wj-fieldset-bare-host',
  imports: [WjFieldset],
  template: `
    <wj-fieldset legend="Bare" toggleable [collapsed]="true">
      <p class="body">Hidden at rest.</p>
    </wj-fieldset>
  `,
})
class BareHost {}

/** A consumer who writes `aria-*` on the host instead of using the legend. */
@Component({
  selector: 'wj-fieldset-aria-host',
  imports: [WjFieldset],
  template: `<wj-fieldset legend="Titled" aria-label="Other">Content</wj-fieldset>`,
})
class AriaOnHostHost {}

/** Two fieldsets side by side: every id they write is unique. */
@Component({
  selector: 'wj-fieldset-pair-host',
  imports: [WjFieldset],
  template: `
    <wj-fieldset legend="First" toggleable>One</wj-fieldset>
    <wj-fieldset legend="Second">Two</wj-fieldset>
  `,
})
class PairHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  fieldset: WjFieldsetHarness;
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

/** Records every class list the motion element showed while it ran; call the result to stop. */
function recordMotion(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('[pmotionname]')) {
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

const regionOf = (root: ParentNode): HTMLElement => find(root, '[role="region"]', HTMLElement);
const legendOf = (root: ParentNode): HTMLElement => find(root, 'legend', HTMLElement);
const toggleOf = (root: ParentNode): HTMLElement => find(root, 'legend button', HTMLElement);
const boxOf = (root: ParentNode): HTMLElement => find(root, 'fieldset', HTMLElement);

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
  const label = find(element, '[data-pc-section="legendlabel"]', HTMLElement);
  if (getComputedStyle(label).fontWeight !== '600') {
    throw new Error("Optimus's fieldset styles did not load");
  }
  await settled(
    element,
    fixture.componentInstance.collapsed() && fixture.componentInstance.toggleable(),
  );
  const fieldset = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldsetHarness);
  return { fixture, host: fixture.componentInstance, fieldset, element };
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

/**
 * Waits until the content has finished expanding or collapsing: the region's `aria-hidden` flips
 * at once, but Optimus shows or removes the content (`display`) a frame or more later, and the
 * enter or leave class stays until the motion ends. A read straight after `whenStable()` would see
 * the motion, not the end state.
 */
async function settled(root: HTMLElement, collapsed: boolean): Promise<void> {
  const region = regionOf(root);
  await expect
    .poll(() => ({
      hidden: region.getAttribute('aria-hidden'),
      shown: getComputedStyle(region).display !== 'none',
      running: /enter-active|leave-active/.test(region.className),
    }))
    .toEqual({ hidden: String(collapsed), shown: !collapsed, running: false });
}

/** The accessible name of `element` from `aria-labelledby`, as a reader would build it. */
function labelledText(element: Element): string {
  const ids = element.getAttribute('aria-labelledby')?.split(' ') ?? [];
  return ids
    .map((id) => document.getElementById(id)?.textContent.trim() ?? '')
    .join(' ')
    .trim();
}

/** Every `id` in `root` that appears twice, so a duplicate can be named. */
function duplicateIds(root: ParentNode): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const element of root.querySelectorAll('[id]')) {
    if (seen.has(element.id)) {
      dupes.add(element.id);
    }
    seen.add(element.id);
  }
  return [...dupes];
}

/** The documented states for axe (FR-43). */
const STATES: [string, (host: Host) => void][] = [
  [
    'not toggleable',
    (host) => {
      host.toggleable.set(false);
    },
  ],
  ['toggleable and expanded', () => undefined],
  [
    'toggleable and collapsed',
    (host) => {
      host.collapsed.set(true);
    },
  ],
];

describe('WjFieldset', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: a toggle then ends at once.
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

  describe('inputs and content', () => {
    it('shows the legend on the border and the content in the box', async () => {
      const { element, fieldset } = await render();

      expect(await fieldset.getLegend()).toBe('Order notes');
      expect(legendOf(element).textContent.trim()).toBe('Order notes');
      expect(boxOf(element).contains(legendOf(element))).toBe(true);
      expect(await fieldset.getContentText()).toBe('Leave it with the neighbour.');
      expect(element.querySelectorAll('.body').length).toBe(1);
      expect(find(element, 'wj-fieldset', HTMLElement).children.length).toBe(1);
    });

    it('draws a toggle only while toggleable', async () => {
      const { host, element, fieldset } = await render('light', (instance) => {
        instance.toggleable.set(false);
      });

      expect(await fieldset.isToggleable()).toBe(false);
      expect(element.querySelector('legend button')).toBeNull();
      expect(await fieldset.isCollapsed()).toBe(false);

      host.toggleable.set(true);
      await expect.poll(() => fieldset.isToggleable()).toBe(true);
      expect(toggleOf(element).getAttribute('aria-expanded')).toBe('true');
    });

    it('accepts a bare toggleable attribute, and starts collapsed when told to', async () => {
      const { fixture, element } = await renderSmall(BareHost);
      const fieldset =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldsetHarness);

      expect(await fieldset.isToggleable()).toBe(true);
      await settled(element, true);
      expect(await fieldset.isCollapsed()).toBe(true);
      expect(toggleOf(element).getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps a non-toggleable fieldset open whatever collapsed says', async () => {
      const { element, fieldset } = await render('light', (host) => {
        host.toggleable.set(false);
        host.collapsed.set(true);
      });

      expect(getComputedStyle(regionOf(element)).display).not.toBe('none');
      expect(regionOf(element).getAttribute('aria-hidden')).toBe('false');
      expect(regionOf(element).hasAttribute('tabindex')).toBe(false);
      expect(await fieldset.isCollapsed()).toBe(false);
    });

    it('starts collapsed when collapsed is set, leaving only the legend on the border', async () => {
      const { element, fieldset } = await render('light', (host) => {
        host.collapsed.set(true);
      });

      expect(await fieldset.isCollapsed()).toBe(true);
      expect(getComputedStyle(regionOf(element)).display).toBe('none');
      expect(await fieldset.getContentText()).toBe('Leave it with the neighbour.');
      expect(await fieldset.getLegend()).toBe('Order notes');
    });

    it('is a block with no box of its own', async () => {
      const { element } = await render();
      const host = find(element, 'wj-fieldset', HTMLElement);
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(host.getBoundingClientRect().height).toBe(
        find(host, 'p-fieldset', HTMLElement).getBoundingClientRect().height,
      );
    });

    it('is not a form control: it joins no wj-field and is not a form-associated element', async () => {
      const { element } = await render();

      expect(boxOf(element).localName).toBe('fieldset');
      expect(find(element, 'wj-fieldset', HTMLElement).closest('wj-field')).toBeNull();
      expect(boxOf(element).hasAttribute('disabled')).toBe(false);
    });
  });

  describe('collapsed model', () => {
    it('reports every toggle and follows the parent in both directions', async () => {
      const { host, fieldset, element } = await render();

      await fieldset.toggle();
      await settled(element, true);
      expect(host.reported()).toEqual([true]);
      expect(await fieldset.isCollapsed()).toBe(true);

      host.collapsed.set(false);
      await settled(element, false);
      expect(await fieldset.isCollapsed()).toBe(false);
      expect(host.reported()).toEqual([true]);

      await fieldset.toggle();
      await settled(element, true);
      await fieldset.toggle();
      await settled(element, false);
      expect(host.reported()).toEqual([true, true, false]);
    });

    it('reports two toggles made in the same task, and ends where it began', async () => {
      const { host, element } = await render();
      const toggle = toggleOf(element);

      toggle.click();
      toggle.click();
      await settled(element, false);

      expect(host.reported()).toEqual([true, false]);
      expect(host.collapsed()).toBe(false);
    });
  });

  describe('pt', () => {
    it('reaches every part', async () => {
      const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: probe('root'),
          legend: probe('legend'),
          toggleButton: probe('toggle'),
          toggleIcon: probe('icon'),
          legendLabel: probe('label'),
          contentContainer: probe('container'),
          contentWrapper: probe('wrapper'),
          content: probe('content'),
        });
      });

      const at = (name: string): Element | null => element.querySelector(`[data-probe="${name}"]`);
      expect(at('root')?.localName).toBe('fieldset');
      expect(at('legend')?.localName).toBe('legend');
      expect(at('toggle')?.localName).toBe('button');
      expect(at('icon')?.localName).toBe('svg');
      expect(at('label')?.localName).toBe('span');
      expect(at('container')?.getAttribute('role')).toBe('region');
      expect(at('wrapper')?.getAttribute('data-pc-section')).toBe('contentwrapper');
      expect(at('content')?.getAttribute('data-pc-section')).toBe('content');
    });

    it('accepts a class string and the function form for a part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: 'probe-class', legendLabel: () => ({ 'data-probe': 'fn' }) });
      });

      expect(boxOf(element).classList.contains('probe-class')).toBe(true);
      expect(find(element, '[data-probe="fn"]', HTMLElement).localName).toBe('span');
    });

    it('changes nothing visible when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });

    it('keeps a consumer key on a part the wrapper routes attributes to', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          legend: { 'data-keep': 'legend' },
          toggleIcon: { 'data-keep': 'icon' },
          contentContainer: { 'data-keep': 'region' },
        });
      });

      expect(legendOf(element).getAttribute('data-keep')).toBe('legend');
      expect(find(element, 'legend svg', SVGElement).getAttribute('data-keep')).toBe('icon');
      expect(regionOf(element).getAttribute('data-keep')).toBe('region');
      expect(duplicateIds(element)).toEqual([]);
    });

    it('lets a routed attribute win over a consumer value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          legend: { id: 'mine' },
          toggleIcon: { 'aria-hidden': 'false' },
          contentContainer: { 'aria-labelledby': 'mine' },
        });
      });

      expect(legendOf(element).id).not.toBe('mine');
      expect(find(element, 'legend svg', SVGElement).getAttribute('aria-hidden')).toBe('true');
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(legendOf(element).id);
    });
  });

  describe('accessible names and ids (the two gaps fixed)', () => {
    it('hides the plus icon shown while collapsed, as the minus icon already is', async () => {
      const { host, element, fieldset } = await render();
      const minus = find(element, 'legend svg[data-p-icon="minus"]', SVGElement);
      expect(minus.getAttribute('aria-hidden')).toBe('true');

      await fieldset.toggle();
      await settled(element, true);
      expect(element.querySelector('legend svg[data-p-icon="minus"]')).toBeNull();
      expect(
        find(element, 'legend svg[data-p-icon="plus"]', SVGElement).getAttribute('aria-hidden'),
      ).toBe('true');

      host.collapsed.set(false);
      await settled(element, false);
      expect(
        find(element, 'legend svg[data-p-icon="minus"]', SVGElement).getAttribute('aria-hidden'),
      ).toBe('true');
    });

    it('gives the legend a unique id and labels the region by it, toggleable and expanded', async () => {
      const { element } = await render();
      const legend = legendOf(element);

      expect(legend.id).toMatch(/^wj-fieldset-legend-\d+$/);
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(legend.id);
      expect(labelledText(regionOf(element))).toBe('Order notes');
      expect(regionOf(element).getAttribute('role')).toBe('region');
    });

    it('labels the region by the legend while toggleable and collapsed', async () => {
      const { element } = await render('light', (host) => {
        host.collapsed.set(true);
      });

      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(legendOf(element).id);
      expect(labelledText(regionOf(element))).toBe('Order notes');
    });

    it('labels the region by the legend when the fieldset is not toggleable', async () => {
      const { element } = await render('light', (host) => {
        host.toggleable.set(false);
      });
      const label = regionOf(element).getAttribute('aria-labelledby');

      // Optimus points it at the toggle's id, which does not exist here.
      expect(label).toBe(legendOf(element).id);
      expect(document.getElementById(label ?? '')).toBe(legendOf(element));
      expect(labelledText(regionOf(element))).toBe('Order notes');
    });

    it('keeps the toggle named by the legend and tied to the region', async () => {
      const { element, fieldset } = await render();
      const toggle = toggleOf(element);

      expect(toggle.getAttribute('aria-label')).toBe('Order notes');
      expect(toggle.getAttribute('aria-controls')).toBe(regionOf(element).id);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.hasAttribute('autofocus')).toBe(false);

      await fieldset.toggle();
      await settled(element, true);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('follows the legend text when it changes', async () => {
      const { host, element } = await render();

      host.legend.set('Gift note');
      await expect.poll(() => toggleOf(element).getAttribute('aria-label')).toBe('Gift note');
      expect(labelledText(regionOf(element))).toBe('Gift note');
    });

    it('writes unique ids for two fieldsets on one page', async () => {
      const { element } = await renderSmall(PairHost);
      const legends = Array.from(element.querySelectorAll('legend'));

      expect(legends.length).toBe(2);
      expect(new Set(legends.map((legend) => legend.id)).size).toBe(2);
      expect(duplicateIds(element)).toEqual([]);
    });

    it('does not focus the toggle on load', async () => {
      const { element } = await render();

      expect(document.activeElement).not.toBe(toggleOf(element));
    });
  });

  describe('dev warnings', () => {
    it('stays silent for a named fieldset', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays silent for a toggleable and a plain fieldset side by side', async () => {
      await renderSmall(PairHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      const { element } = await renderSmall(AriaOnHostHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-fieldset: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the legend input to name the group. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(element.querySelector('[aria-label="Other"]:not(wj-fieldset)')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-fieldset: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in legend as text, never as markup', async () => {
      const { element, fieldset } = await render('light', (host) => {
        host.legend.set(PAYLOAD);
      });

      expect(await fieldset.getLegend()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(toggleOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(labelledText(regionOf(element))).toBe(PAYLOAD);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('shows an HTML payload in legend as text when not toggleable', async () => {
      const { element, fieldset } = await render('light', (host) => {
        host.toggleable.set(false);
        host.legend.set(PAYLOAD);
      });

      expect(await fieldset.getLegend()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('lets a long legend wrap, never truncating it', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('12rem');
        host.toggleable.set(false);
        host.legend.set('A very long fieldset legend that keeps going and going');
      });
      const label = find(element, 'legend span', HTMLElement);
      const lineHeight = parseFloat(getComputedStyle(label).fontSize);

      expect(label.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
      expect(getComputedStyle(label).textOverflow).toBe('clip');
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    });

    it('lets a long legend wrap inside the toggle too', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('12rem');
        host.legend.set('A very long fieldset legend that keeps going and going');
      });
      const toggle = toggleOf(element);

      expect(toggle.getBoundingClientRect().height).toBeGreaterThan(
        parseFloat(getComputedStyle(toggle).fontSize) * 1.5,
      );
      expect(toggle.scrollWidth).toBeLessThanOrEqual(toggle.clientWidth);
    });
  });

  describe('hit boxes', () => {
    it('makes the toggle at least 24 by 24 px', async () => {
      const { element } = await render();
      const box = toggleOf(element).getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    });
  });

  describe('collapsed content', () => {
    it('leaves a focusable control out of the Tab order, with its region still labelled', async () => {
      const { element } = await render('light', (host) => {
        host.action.set(true);
        host.collapsed.set(true);
      });
      const region = regionOf(element);

      expect(region.getAttribute('aria-hidden')).toBe('true');
      expect(region.getAttribute('tabindex')).toBe('-1');
      expect(region.getAttribute('aria-labelledby')).toBe(legendOf(element).id);
      expect(getComputedStyle(region).display).toBe('none');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);
        // A pointer left on a hoverable control changes its colours: park it on a neutral element.
        await userEvent.hover(document.body);

        await expectNoAxeViolations(find(element, 'wj-fieldset', HTMLElement));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the toggle inside the legend, and Shift+Tab walks back', async () => {
      const { element } = await render();
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(toggleOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(toggleOf(element));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });

    it('Tab skips a non-toggleable fieldset, which has no stop of its own', async () => {
      const { element } = await render('light', (host) => {
        host.toggleable.set(false);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('Tab skips the content of a collapsed fieldset and visits it once open', async () => {
      const { element, fieldset } = await render('light', (host) => {
        host.action.set(true);
        host.collapsed.set(true);
      });
      const action = find(element, '.action', HTMLElement);
      await fieldset.focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await fieldset.toggle();
      await settled(element, false);
      await fieldset.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(action);
      expect(action.hasAttribute('tabindex')).toBe(false);

      await fieldset.toggle();
      await settled(element, true);
      expect(action.getAttribute('tabindex')).toBe('-1');
    });

    it('Enter and Space each toggle the focused fieldset exactly once per press', async () => {
      const { element, host, fieldset } = await render();
      await fieldset.focus();

      await userEvent.keyboard('{Enter}');
      await settled(element, true);
      expect(host.reported()).toEqual([true]);
      await userEvent.keyboard('{Enter}');
      await settled(element, false);
      expect(host.reported()).toEqual([true, false]);
      await userEvent.keyboard(' ');
      await settled(element, true);
      expect(host.reported()).toEqual([true, false, true]);
      await userEvent.keyboard(' ');
      await settled(element, false);

      expect(host.reported()).toEqual([true, false, true, false]);
      expect(await fieldset.isFocused()).toBe(true);
    });

    it('a click toggles exactly once too', async () => {
      const { element, host, fieldset } = await render();

      await fieldset.toggle();
      await settled(element, true);

      expect(host.reported()).toEqual([true]);
    });
  });

  describe('harness', () => {
    it('reads the legend and the content, and finds a fieldset by its legend', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const fieldset = await loader.getHarness(WjFieldsetHarness.with({ legend: 'Order notes' }));

      expect(await fieldset.getLegend()).toBe('Order notes');
      expect(await fieldset.getContentText()).toBe('Leave it with the neighbour.');
      expect(await fieldset.isToggleable()).toBe(true);
      expect(await loader.getAllHarnesses(WjFieldsetHarness.with({ legend: /^Other/ }))).toEqual(
        [],
      );
    });

    it('toggles and focuses the toggle, and says whether it has focus', async () => {
      const { element, fieldset } = await render();

      expect(await fieldset.isCollapsed()).toBe(false);
      expect(await fieldset.isFocused()).toBe(false);
      await fieldset.focus();
      expect(await fieldset.isFocused()).toBe(true);
      await fieldset.toggle();
      await settled(element, true);
      expect(await fieldset.isCollapsed()).toBe(true);
      expect(await fieldset.getContentText()).toBe('Leave it with the neighbour.');
    });

    it('says what a fieldset with no toggle is, and refuses to toggle it', async () => {
      const { fieldset } = await render('light', (host) => {
        host.toggleable.set(false);
      });

      expect(await fieldset.isToggleable()).toBe(false);
      expect(await fieldset.isFocused()).toBe(false);
      expect(await fieldset.getLegend()).toBe('Order notes');
      await expect(fieldset.toggle()).rejects.toThrow('not toggleable');
      await expect(fieldset.focus()).rejects.toThrow('not toggleable');
    });

    it('names no Optimus class', () => {
      expect(WjFieldsetHarness.hostSelector).toBe('wj-fieldset');
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still reports every toggle', async () => {
      const { element, host, fieldset } = await render();
      const stop = recordMotion();

      await fieldset.toggle();
      await settled(element, true);
      await fieldset.toggle();
      await settled(element, false);

      expect(stop()).toEqual([]);
      expect(host.reported()).toEqual([true, false]);
    });

    it('pt.motion cannot switch safe off', async () => {
      const { element, fieldset } = await render('light', (host) => {
        host.pt.set({ motion: { safe: false } });
      });
      const stop = recordMotion();

      await fieldset.toggle();
      await settled(element, true);
      await fieldset.toggle();
      await settled(element, false);

      expect(stop()).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const { element, fieldset } = await render();
      const stop = recordMotion();

      await fieldset.toggle();
      await settled(element, true);
      await fieldset.toggle();
      await settled(element, false);

      expect(stop().length).toBeGreaterThan(0);
    });
  });
});
