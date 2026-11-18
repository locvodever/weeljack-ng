import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjMeterGroup,
  type WjMeterGroupLabelPosition,
  type WjMeterGroupPt,
  type WjMeterItem,
} from 'weeljack-ng/metergroup';
import { WjMeterGroupHarness } from 'weeljack-ng/metergroup/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const WJ0160 =
  'WJ0160: wj-metergroup: the meter has no accessible name. Set ariaLabel, or ' +
  'ariaLabelledBy to the id of its visible label. ' +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0160';

const STORAGE: WjMeterItem[] = [
  { label: 'Apps', value: 16, color: 'var(--wj-sky-600)' },
  { label: 'Messages', value: 8, color: 'var(--wj-green-950)' },
  { label: 'Media', value: 24, color: 'var(--wj-purple-500)' },
];
const STORAGE_TEXT = 'Apps (16%), Messages (8%), Media (24%)';

/** A consumer's template: one meter group between two buttons, with visible text to name it by. */
@Component({
  selector: 'wj-metergroup-host',
  imports: [WjMeterGroup],
  template: `
    <button type="button" id="before">Before</button>
    <div id="box">
      <span id="label">Storage</span>
      <span id="hint">Of 128 GB</span>
      <wj-metergroup
        [value]="value()"
        [labelPosition]="labelPosition()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="labelledBy()"
        [ariaDescribedBy]="describedBy()"
        [pt]="pt()"
      />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly value = signal<WjMeterItem[]>([]);
  readonly labelPosition = signal<WjMeterGroupLabelPosition>('end');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjMeterGroupPt>(undefined);
}

/** A meter group with a name and items, every other input at its default. */
@Component({
  selector: 'wj-metergroup-bare-host',
  imports: [WjMeterGroup],
  template: `<wj-metergroup ariaLabel="Storage" [value]="items" />`,
})
class BareHost {
  readonly items = STORAGE;
}

/** A meter group with a name and nothing else. */
@Component({
  selector: 'wj-metergroup-empty-host',
  imports: [WjMeterGroup],
  template: `<wj-metergroup ariaLabel="Storage" />`,
})
class EmptyHost {}

/** Two meter groups with no name: a missing one and an empty one. */
@Component({
  selector: 'wj-metergroup-unnamed-host',
  imports: [WjMeterGroup],
  template: `
    <wj-metergroup />
    <wj-metergroup ariaLabel="" />
  `,
})
class UnnamedHost {}

/** One meter group named by `ariaLabel`, one by `ariaLabelledBy`. */
@Component({
  selector: 'wj-metergroup-named-host',
  imports: [WjMeterGroup],
  template: `
    <span id="named-by">Storage</span>
    <wj-metergroup ariaLabel="Storage" />
    <wj-metergroup ariaLabelledBy="named-by" />
  `,
})
class NamedHost {}

/** A consumer who writes `aria-label` on the host. */
@Component({
  selector: 'wj-metergroup-aria-host',
  imports: [WjMeterGroup],
  template: `<wj-metergroup aria-label="Storage" ariaLabel="Storage" />`,
})
class AriaOnHostHost {}

/** Two meter groups in a harness search: told apart by name. */
@Component({
  selector: 'wj-metergroup-pair-host',
  imports: [WjMeterGroup],
  template: `
    <span id="first-name">Storage</span>
    <wj-metergroup ariaLabelledBy="first-name" [value]="first" />
    <wj-metergroup ariaLabel="Monthly budget" [value]="second" />
  `,
})
class PairHost {
  readonly first = STORAGE;
  readonly second: WjMeterItem[] = [{ label: 'Rent', value: 40, color: 'var(--wj-sky-600)' }];
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  meter: WjMeterGroupHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = (host) => {
    host.labelledBy.set('label');
  },
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const meter = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjMeterGroupHarness);
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(parts(element).meter).display).toBe('flex');
  return { fixture, host: fixture.componentInstance, meter, element };
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The `wj-metergroup` host, Optimus's `meter` element inside it, its bar and its legend. */
function parts(element: ParentNode): {
  host: HTMLElement;
  meter: HTMLElement;
  bar: HTMLElement;
  list: HTMLElement;
} {
  const host = find(element, 'wj-metergroup', HTMLElement);
  return {
    host,
    meter: find(host, 'p-metergroup', HTMLElement),
    bar: find(host, '.p-metergroup-meters', HTMLElement),
    list: find(host, '.p-metergroup-label-list', HTMLElement),
  };
}

const attributeOf = (element: HTMLElement, name: string): string | null =>
  parts(element).meter.getAttribute(name);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The legend's entries as the reader sees them: "Apps (16%)". */
const legendOf = (element: ParentNode): string[] =>
  Array.from(parts(element).list.querySelectorAll('li')).map((entry) => entry.textContent.trim());

/** The painted segments' widths, in order. Items of 0 draw none. */
const segmentsOf = (element: ParentNode): string[] =>
  Array.from(parts(element).bar.querySelectorAll<HTMLElement>('.p-metergroup-meter')).map(
    (segment) => segment.style.width,
  );

/** `variable` (a `--wj-*` custom property) as the computed colour a painted box would show. */
function colourOf(variable: string): string {
  const probe = document.body.appendChild(document.createElement('i'));
  probe.style.backgroundColor = `var(${variable})`;
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
}

/** A copy of `items` that throws, in a module's strict mode, if anything writes to it. */
function frozen(items: WjMeterItem[]): WjMeterItem[] {
  const copy = items.map((item) => Object.freeze({ ...item }));
  Object.freeze(copy);
  return copy;
}

describe('WjMeterGroup', () => {
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

  describe('defaults', () => {
    it('with a name and items it draws the legend at the end, over a 0 to 100 meter', async () => {
      ROOT.classList.remove('wj-dark');
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const meter = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjMeterGroupHarness);
      const { host, meter: root, bar, list } = parts(element);

      expect(getComputedStyle(host).display).toBe('block');
      expect(root.getAttribute('role')).toBe('meter');
      expect(root.getAttribute('aria-valuemin')).toBe('0');
      expect(root.getAttribute('aria-valuemax')).toBe('100');
      expect(root.getAttribute('aria-valuenow')).toBe('48');
      expect(list.getBoundingClientRect().top).toBeGreaterThan(bar.getBoundingClientRect().bottom);
      expect(await meter.getTotalPercent()).toBe(48);
      expect(legendOf(element)).toEqual(['Apps (16%)', 'Messages (8%)', 'Media (24%)']);
    });

    it('with no items it is an empty bar with no legend entries and no value text', async () => {
      ROOT.classList.remove('wj-dark');
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const meter = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjMeterGroupHarness);
      const { meter: root } = parts(element);

      expect(root.getAttribute('aria-valuenow')).toBe('0');
      expect(root.hasAttribute('aria-valuetext')).toBe(false);
      expect(legendOf(element)).toEqual([]);
      expect(segmentsOf(element)).toEqual([]);
      expect(await meter.getItems()).toEqual([]);
      expect(await meter.getValueText()).toBeNull();
    });

    it('draws Optimus’s look: an 8 px track, 16 px to the legend, round markers, the host adding no box', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
      });
      const { host, bar, list } = parts(element);
      const own = getComputedStyle(host);
      const marker = find(list, '.p-metergroup-label-marker', HTMLElement);
      const text = find(list, '.p-metergroup-label-text', HTMLElement);

      expect(bar.getBoundingClientRect().height).toBe(8);
      expect(getComputedStyle(bar).backgroundColor).toBe(colourOf('--wj-content-border-color'));
      expect(list.getBoundingClientRect().top - bar.getBoundingClientRect().bottom).toBe(16);
      expect(marker.getBoundingClientRect().width).toBe(8);
      expect(marker.getBoundingClientRect().height).toBe(8);
      expect(getComputedStyle(text).color).toBe(own.color);
      for (const property of ['padding', 'borderTopWidth', 'backgroundColor'] as const) {
        expect(own[property]).toMatch(/^(0px|rgba\(0, 0, 0, 0\))$/);
      }
    });
  });

  describe('value and labelPosition', () => {
    it('draws one segment per item, as wide as its percentage, in the app’s colour', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
      });

      expect(segmentsOf(element)).toEqual(['16%', '8%', '24%']);
      const segment = (position: number): HTMLElement =>
        find(
          parts(element).bar,
          `.p-metergroup-meter:nth-of-type(${String(position)})`,
          HTMLElement,
        );
      // The palette variable is defined, so the comparison below is not transparent against transparent.
      expect(colourOf('--wj-sky-600')).not.toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(segment(1)).backgroundColor).toBe(colourOf('--wj-sky-600'));
      expect(getComputedStyle(segment(3)).backgroundColor).toBe(colourOf('--wj-purple-500'));
    });

    it('keeps an item of 0 in the legend and draws no segment for it', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set([
          { label: 'Apps', value: 30, color: 'var(--wj-sky-600)' },
          { label: 'Empty', value: 0, color: 'var(--wj-green-950)' },
        ]);
      });

      expect(legendOf(element)).toEqual(['Apps (30%)', 'Empty (0%)']);
      expect(segmentsOf(element)).toEqual(['30%']);
    });

    it('puts the legend below the bar at end and above it at start, and follows a change', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(STORAGE);
        initial.labelPosition.set('start');
      });
      const { bar, list } = parts(element);

      expect(list.getBoundingClientRect().bottom).toBeLessThan(bar.getBoundingClientRect().top);
      expect(bar.getBoundingClientRect().top - list.getBoundingClientRect().bottom).toBe(16);

      host.labelPosition.set('end');

      // Optimus draws the legend again at its new place: read the element afresh.
      await expect
        .poll(
          () =>
            parts(element).list.getBoundingClientRect().top >
            parts(element).bar.getBoundingClientRect().bottom,
        )
        .toBe(true);
    });
  });

  describe('legend and value text (FR-35)', () => {
    it('reads the legend: min 0, max 100, now the rounded total, text the entries joined', async () => {
      const { element, meter } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
      });

      expect(attributeOf(element, 'aria-valuemin')).toBe('0');
      expect(attributeOf(element, 'aria-valuemax')).toBe('100');
      expect(attributeOf(element, 'aria-valuenow')).toBe('48');
      expect(attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);
      expect(await meter.getValueText()).toBe(STORAGE_TEXT);
      expect(await meter.getTotalPercent()).toBe(48);
      expect(await meter.getItems()).toEqual([
        { label: 'Apps', percent: 16 },
        { label: 'Messages', percent: 8 },
        { label: 'Media', percent: 24 },
      ]);
    });

    it('computes each entry as Optimus does: rounded and clamped to 0 to 100', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set([
          { label: 'Fraction', value: 16.4, color: 'var(--wj-sky-600)' },
          { label: 'Half', value: 8.5, color: 'var(--wj-green-950)' },
          { label: 'Over', value: 150, color: 'var(--wj-purple-500)' },
          { label: 'Under', value: -5, color: 'var(--wj-sky-600)' },
        ]);
      });
      const text = 'Fraction (16%), Half (9%), Over (100%), Under (0%)';

      expect(attributeOf(element, 'aria-valuetext')).toBe(text);
      expect(legendOf(element).join(', ')).toBe(text);
      // Optimus's own total stops at 100.
      expect(attributeOf(element, 'aria-valuenow')).toBe('100');
    });

    it('says the same thing as the legend, entry for entry, over a sweep of values', async () => {
      const values = [0, 0.4, 0.5, 1.5, 2.5, 4.5, 7, 16.5, 33.3, 49.5, 66.6, 99.5, 100, 101];
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(
          values.map((value, index) => ({
            label: `Item ${String(index)}`,
            value,
            color: 'var(--wj-sky-600)',
          })),
        );
      });

      expect(attributeOf(element, 'aria-valuetext')).toBe(legendOf(element).join(', '));
    });

    it('updates the legend and the value text when value changes, and when it empties', async () => {
      const { host, element, meter } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(STORAGE);
      });

      host.value.set([
        { label: 'Apps', value: 30, color: 'var(--wj-sky-600)' },
        { label: 'Photos', value: 12, color: 'var(--wj-green-950)' },
      ]);
      await expect.poll(() => legendOf(element)).toEqual(['Apps (30%)', 'Photos (12%)']);
      expect(attributeOf(element, 'aria-valuetext')).toBe('Apps (30%), Photos (12%)');
      expect(attributeOf(element, 'aria-valuenow')).toBe('42');
      expect(segmentsOf(element)).toEqual(['30%', '12%']);
      expect(await meter.getItems()).toEqual([
        { label: 'Apps', percent: 30 },
        { label: 'Photos', percent: 12 },
      ]);

      host.value.set([]);
      await expect.poll(() => legendOf(element)).toEqual([]);
      expect(attributeOf(element, 'aria-valuetext')).toBeNull();
      expect(attributeOf(element, 'aria-valuenow')).toBe('0');
      expect(await meter.getValueText()).toBeNull();

      host.value.set(STORAGE);
      await expect.poll(() => attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);
      expect(legendOf(element)).toEqual(['Apps (16%)', 'Messages (8%)', 'Media (24%)']);
    });

    it('keeps the value text in step with the legend over many changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(STORAGE);
      });

      for (let share = 1; share <= 20; share += 1) {
        host.value.set([
          { label: 'One', value: share, color: 'var(--wj-sky-600)' },
          { label: 'Two', value: share * 2, color: 'var(--wj-green-950)' },
        ]);
        const text = `One (${String(share)}%), Two (${String(share * 2)}%)`;
        await expect.poll(() => attributeOf(element, 'aria-valuetext')).toBe(text);
        expect(legendOf(element).join(', ')).toBe(text);
      }
    });

    it('follows a changed label with the same values', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(STORAGE);
      });

      host.value.set(STORAGE.map((item) => ({ ...item, label: item.label.toUpperCase() })));

      await expect
        .poll(() => attributeOf(element, 'aria-valuetext'))
        .toBe('APPS (16%), MESSAGES (8%), MEDIA (24%)');
      expect(legendOf(element)[0]).toBe('APPS (16%)');
    });
  });

  describe('min and max (FR-34)', () => {
    it('exposes neither: the meter always reads from 0 to 100', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
      });

      expectTypeOf<WjMeterGroup>().not.toHaveProperty('min');
      expectTypeOf<WjMeterGroup>().not.toHaveProperty('max');
      expect(attributeOf(element, 'aria-valuemin')).toBe('0');
      expect(attributeOf(element, 'aria-valuemax')).toBe('100');
    });
  });

  describe('the app’s data', () => {
    it('never writes to a frozen array or frozen items, through renders and changes', async () => {
      const first = frozen(STORAGE);
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(first);
      });
      expect(legendOf(element)).toEqual(['Apps (16%)', 'Messages (8%)', 'Media (24%)']);

      const second = frozen([
        { label: 'Apps', value: 30, color: 'var(--wj-sky-600)' },
        { label: 'Over', value: 150, color: 'var(--wj-green-950)' },
      ]);
      host.value.set(second);
      await expect.poll(() => legendOf(element)).toEqual(['Apps (30%)', 'Over (100%)']);
      host.labelPosition.set('start');
      host.value.set(first);
      await expect.poll(() => attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);

      for (const items of [first, second]) {
        expect(Object.isFrozen(items)).toBe(true);
        expect(items.every((item) => Object.isFrozen(item))).toBe(true);
      }
      expect(first).toEqual(STORAGE);
      expect(second).toEqual([
        { label: 'Apps', value: 30, color: 'var(--wj-sky-600)' },
        { label: 'Over', value: 150, color: 'var(--wj-green-950)' },
      ]);
    });

    it('leaves the array and its items as they were: same identity, same content, same keys', async () => {
      const items: WjMeterItem[] = [
        { label: 'Apps', value: 16.4, color: 'var(--wj-sky-600)' },
        { label: 'Odd', value: 150, color: 'var(--wj-green-950)' },
      ];
      const before = JSON.stringify(items);
      const [firstItem, secondItem] = items;
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(items);
      });
      await expect.poll(() => legendOf(element).length).toBe(2);
      host.labelPosition.set('start');
      host.labelledBy.set(undefined);
      host.ariaLabel.set('Storage');
      await expect.poll(() => attributeOf(element, 'aria-label')).toBe('Storage');

      expect(JSON.stringify(items)).toBe(before);
      expect(items).toHaveLength(2);
      expect(items[0]).toBe(firstItem);
      expect(items[1]).toBe(secondItem);
      expect(items.map((item) => Object.keys(item))).toEqual([
        ['label', 'value', 'color'],
        ['label', 'value', 'color'],
      ]);
    });
  });

  describe('name and description', () => {
    it('ariaLabel lands on the meter element, and clears with it', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.ariaLabel.set('Storage');
        initial.value.set(STORAGE);
      });
      expect(attributeOf(element, 'aria-label')).toBe('Storage');

      host.ariaLabel.set(undefined);

      await expect.poll(() => attributeOf(element, 'aria-label')).toBeNull();
      expect(attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);
    });

    it('ariaLabelledBy and ariaDescribedBy land on the meter element, and only on it', async () => {
      const { element, meter } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.describedBy.set('hint');
        host.value.set(STORAGE);
      });

      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-describedby')).toBe('hint');
      expect(attributeOf(element, 'role')).toBe('meter');
      expect(element.querySelectorAll('wj-metergroup [aria-labelledby]')).toHaveLength(1);
      expect(element.querySelectorAll('wj-metergroup [aria-describedby]')).toHaveLength(1);
      expect(await meter.getAccessibleName()).toBe('Storage');
    });

    it('clears a routed id once the input goes, after several value changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.describedBy.set('hint');
        initial.value.set(STORAGE);
      });

      host.value.set(STORAGE.slice(0, 2));
      host.labelledBy.set('hint');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('hint');
      host.labelledBy.set(undefined);
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBeNull();
      host.describedBy.set(undefined);
      await expect.poll(() => attributeOf(element, 'aria-describedby')).toBeNull();
      host.value.set(STORAGE);
      host.labelledBy.set('label');
      host.describedBy.set('label');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-describedby')).toBe('label');
      expect(attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);
    });

    it('puts no role and no aria-* on the wj-metergroup host itself', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.describedBy.set('hint');
        host.value.set(STORAGE);
      });
      const { host } = parts(element);

      expect(host.hasAttribute('role')).toBe(false);
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('names the meter by its visible label', async () => {
      const { element, meter } = await render('light', (host) => {
        host.labelledBy.set('label');
      });

      expect(byId(element, 'label').textContent).toBe('Storage');
      expect(attributeOf(element, 'aria-label')).toBeNull();
      expect(await meter.getAccessibleName()).toBe('Storage');
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
        host.pt.set({
          meters: { 'data-probe': 'meters' },
          labelList: { 'data-probe': 'list' },
          labelText: { 'data-probe': 'text' },
        });
      });

      expect(find(element, '[data-probe="meters"]', HTMLElement)).toBe(parts(element).bar);
      expect(find(element, '[data-probe="list"]', HTMLElement)).toBe(parts(element).list);
      expect(find(element, '[data-probe="text"]', HTMLElement).className).toContain(
        'p-metergroup-label-text',
      );
    });

    it('reaches the inner parts, as a function with a function part', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
        host.pt.set(() => ({ meters: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(find(element, '[data-probe="fn"]', HTMLElement)).toBe(parts(element).bar);
    });

    it('keeps the consumer host keys beside the routed ones', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
        host.pt.set({ host: { 'data-probe': 'host', title: 'Storage' } });
      });

      expect(attributeOf(element, 'data-probe')).toBe('host');
      expect(attributeOf(element, 'title')).toBe('Storage');
      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);
    });

    it('keeps the consumer host keys of a function pt, and across value changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.describedBy.set('hint');
        initial.labelledBy.set('label');
        initial.value.set(STORAGE);
        initial.pt.set(() => ({ host: { 'data-probe': 'fn-host' } }));
      });
      expect(attributeOf(element, 'data-probe')).toBe('fn-host');
      expect(attributeOf(element, 'aria-describedby')).toBe('hint');

      host.value.set(STORAGE.slice(0, 1));

      await expect.poll(() => attributeOf(element, 'aria-valuetext')).toBe('Apps (16%)');
      expect(attributeOf(element, 'data-probe')).toBe('fn-host');
    });

    it('lets the routed attributes win over consumer keys of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
        host.pt.set({ host: { 'aria-labelledby': 'other', 'aria-valuetext': 'Nothing' } });
      });

      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-valuetext')).toBe(STORAGE_TEXT);
    });
  });

  describe('WJ0160', () => {
    it('warns once, with its own text, when neither ariaLabel nor ariaLabelledBy is set', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(UnnamedHost);
      await fixture.whenStable();

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0160);
    });

    it('stays silent when the meter is named by ariaLabel or by ariaLabelledBy', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const named = TestBed.createComponent(NamedHost);
      await named.whenStable();
      expect(warn).not.toHaveBeenCalled();

      // The same application, so the render hooks of the first fixture have run: an unnamed one
      // still warns.
      TestBed.createComponent(UnnamedHost);
      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0160);
    });

    it('treats a description alone as no name', async () => {
      await render('light', (host) => {
        host.describedBy.set('hint');
      });

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0160);
    });

    it('does not warn when the name is removed after the first render', async () => {
      const { host, fixture } = await render('light', (initial) => {
        initial.ariaLabel.set('Storage');
      });
      host.ariaLabel.set(undefined);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('ARIA', () => {
    it('warns WJ0003 once, and forwards nothing, when aria-* is on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-metergroup: aria-label is set on the host, where it is not forwarded to ' +
          'the focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input ' +
          'instead. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(NamedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-metergroup: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('reports the name and the description ids through the harness', async () => {
      const { meter, host } = await render('light', (initial) => {
        initial.ariaLabel.set('Storage');
        initial.describedBy.set('hint');
        initial.value.set(STORAGE);
      });

      expect(await meter.getAriaAttributes()).toEqual({
        label: 'Storage',
        labelledBy: null,
        describedBy: 'hint',
      });
      expect(await meter.getAccessibleName()).toBe('Storage');

      host.ariaLabel.set(undefined);
      host.labelledBy.set('label');
      host.describedBy.set(undefined);

      await expect
        .poll(() => meter.getAriaAttributes())
        .toEqual({ label: null, labelledBy: 'label', describedBy: null });
    });

    it('finds a meter group by its accessible name through the harness', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(PairHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      await fixture.whenStable();

      const first = await loader.getHarness(WjMeterGroupHarness.with({ label: 'Storage' }));
      const second = await loader.getHarness(WjMeterGroupHarness.with({ label: /^monthly/i }));

      expect(await first.getValueText()).toBe(STORAGE_TEXT);
      expect(await second.getItems()).toEqual([{ label: 'Rent', percent: 40 }]);
      expect(await loader.getAllHarnesses(WjMeterGroupHarness)).toHaveLength(2);
    });
  });

  describe('HTML payloads', () => {
    it('shows a payload in an item label as legend text and value text, never as markup', async () => {
      const { element, meter } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set([{ label: PAYLOAD, value: 10, color: 'var(--wj-sky-600)' }]);
      });

      expect(legendOf(element)).toEqual([`${PAYLOAD} (10%)`]);
      expect(attributeOf(element, 'aria-valuetext')).toBe(`${PAYLOAD} (10%)`);
      expect(await meter.getItems()).toEqual([{ label: PAYLOAD, percent: 10 }]);
      expect(element.querySelector('wj-metergroup img')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps a payload in ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.labelledBy.set(PAYLOAD);
        host.describedBy.set(PAYLOAD);
      });

      expect(attributeOf(element, 'aria-label')).toBe(PAYLOAD);
      expect(attributeOf(element, 'aria-labelledby')).toBe(PAYLOAD);
      expect(attributeOf(element, 'aria-describedby')).toBe(PAYLOAD);
      expect(element.querySelector('wj-metergroup img')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('accessibility', () => {
    const states: [string, (host: Host) => void][] = [
      [
        'three items, legend at the end',
        (host) => {
          host.labelledBy.set('label');
          host.value.set(STORAGE);
        },
      ],
      [
        'legend at the start',
        (host) => {
          host.labelledBy.set('label');
          host.value.set(STORAGE);
          host.labelPosition.set('start');
        },
      ],
      [
        'empty value',
        (host) => {
          host.labelledBy.set('label');
        },
      ],
      [
        'named with ariaLabel and described',
        (host) => {
          host.ariaLabel.set('Storage');
          host.describedBy.set('hint');
          host.value.set(STORAGE);
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(states)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(byId(element, 'box'));
      });

      it('has no axe violations after the value has changed and emptied', async () => {
        const { host, element } = await render(scheme, (initial) => {
          initial.labelledBy.set('label');
          initial.value.set(STORAGE);
        });

        host.value.set(STORAGE.slice(0, 1));
        await expect.poll(() => legendOf(element)).toEqual(['Apps (16%)']);
        await expectNoAxeViolations(byId(element, 'box'));

        host.value.set([]);
        await expect.poll(() => legendOf(element)).toEqual([]);
        await expectNoAxeViolations(byId(element, 'box'));
      });
    });
  });

  describe('keyboard', () => {
    it('is not focusable: Tab passes from the button before it to the one after it', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(STORAGE);
      });
      byId(element, 'before').focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(byId(element, 'after'));
      expect(parts(element).host.querySelectorAll('[tabindex]')).toHaveLength(0);
    });

    it('Shift+Tab passes back over it too', async () => {
      const { element } = await render();
      byId(element, 'after').focus();

      await userEvent.tab({ shift: true });

      expect(document.activeElement).toBe(byId(element, 'before'));
    });
  });
});
