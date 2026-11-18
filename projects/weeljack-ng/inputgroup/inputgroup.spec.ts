/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjInputGroup, type WjInputGroupPt } from 'weeljack-ng/inputgroup';
import { WjInputGroupHarness } from 'weeljack-ng/inputgroup/testing';
import { WjInputGroupAddon } from 'weeljack-ng/inputgroupaddon';
import { WjInputGroupAddonHarness } from 'weeljack-ng/inputgroupaddon/testing';
import { WjInputText, type WjInputTextSize } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { WjSelect, type WjSelectOption, type WjSelectSize } from 'weeljack-ng/select';
import { WjSelectHarness } from 'weeljack-ng/select/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;

/** Optimus's form-field radius, `--wj-inputgroup-addon-border-radius` (8 px in the preset). */
const RADIUS = '8px';
/** The row of a 320 px group holding a text input and a select, measured for the native pair. */
const INPUT_WIDTH = 173.40625;
const SELECT_WIDTH = 146.59375;
/** `--wj-form-field-border-color` (zinc.500 in the Noir preset) and `--wj-form-field-invalid-border-color`. */
const BORDER = 'rgb(113, 113, 122)';
const INVALID_BORDER = 'rgb(220, 38, 38)';
/** A 320 px group with a 40 px addon, a text input and a select: the free 280 px shared as in C3. */
const INPUT_WIDTH_AFTER_ADDON = 153.40625;
const SELECT_WIDTH_AFTER_ADDON = 126.59375;

const CURRENCIES: WjSelectOption<string>[] = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'VND', value: 'VND' },
];

/**
 * A consumer's template: a text input and a `wj-select` in one group (C3), in either order, with
 * a button before and after the group for the keyboard walk.
 */
@Component({
  selector: 'wj-inputgroup-host',
  imports: [WjInputGroup, WjInputText, WjSelect],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-inputgroup [pt]="pt()">
        @if (selectFirst()) {
          <wj-select
            ariaLabel="Currency"
            [options]="currencies"
            [size]="selectSize()"
            [disabled]="selectDisabled()"
            [invalid]="selectInvalid()"
            [(value)]="currency"
          />
        }
        <input
          wjInputText
          aria-label="Amount"
          inputmode="decimal"
          [size]="inputSize()"
          [disabled]="inputDisabled()"
          [invalid]="inputInvalid()"
        />
        @if (!selectFirst()) {
          <wj-select
            ariaLabel="Currency"
            [options]="currencies"
            [size]="selectSize()"
            [disabled]="selectDisabled()"
            [invalid]="selectInvalid()"
            [(value)]="currency"
          />
        }
      </wj-inputgroup>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly currencies = CURRENCIES;
  readonly pt = signal<WjInputGroupPt>(undefined);
  readonly currency = signal<string | null>(null);
  readonly selectFirst = signal(false);
  readonly inputSize = signal<WjInputTextSize | undefined>(undefined);
  readonly selectSize = signal<WjSelectSize | undefined>(undefined);
  readonly inputInvalid = signal(false);
  readonly selectInvalid = signal(false);
  readonly inputDisabled = signal(false);
  readonly selectDisabled = signal(false);
}

/** A group with one control only: a lone input, or a lone select. */
@Component({
  selector: 'wj-inputgroup-single-host',
  imports: [WjInputGroup, WjInputText, WjSelect],
  template: `
    <div id="scope" style="width: 320px">
      <wj-inputgroup id="lone-input"><input wjInputText aria-label="Amount" /></wj-inputgroup>
      <wj-inputgroup id="lone-select">
        <wj-select ariaLabel="Currency" [options]="currencies" />
      </wj-inputgroup>
    </div>
  `,
})
class SingleHost {
  readonly currencies = CURRENCIES;
}

/** The group the docs show: captioned through `role="group"` and `aria-labelledby` on the host. */
@Component({
  selector: 'wj-inputgroup-caption-host',
  imports: [WjInputGroup, WjInputText, WjSelect],
  template: `
    <div id="scope" style="width: 320px">
      <span id="caption">Price</span>
      <wj-inputgroup role="group" aria-labelledby="caption">
        <input wjInputText aria-label="Amount" inputmode="decimal" placeholder="0.00" />
        <wj-select ariaLabel="Currency" [options]="currencies" value="USD" />
      </wj-inputgroup>
    </div>
  `,
})
class CaptionHost {
  readonly currencies = CURRENCIES;
}

/** One input in a group inside a `wj-field`, with a hint and an error the test turns on. */
@Component({
  selector: 'wj-inputgroup-field-host',
  imports: [WjField, WjInputGroup, WjInputText],
  template: `
    <div id="scope" style="width: 320px">
      <wj-field label="Price" [hint]="hint()" [error]="error()">
        <wj-inputgroup><input wjInputText id="field-price" inputmode="decimal" /></wj-inputgroup>
      </wj-field>
    </div>
  `,
})
class FieldHost {
  readonly hint = signal<string | undefined>('Before tax.');
  readonly error = signal<string | undefined>(undefined);
}

/** Two controls in one group inside a `wj-field`: the field becomes a labelled group. */
@Component({
  selector: 'wj-inputgroup-field-group-host',
  imports: [WjField, WjInputGroup, WjInputText, WjSelect],
  template: `
    <div id="scope" style="width: 320px">
      <wj-field label="Price" hint="Amount, then currency." [error]="error()">
        <wj-inputgroup>
          <input wjInputText aria-label="Amount" />
          <wj-select ariaLabel="Currency" [options]="currencies" />
        </wj-inputgroup>
      </wj-field>
    </div>
  `,
})
class FieldGroupHost {
  readonly currencies = CURRENCIES;
  readonly error = signal<string | undefined>(undefined);
}

/**
 * C1 and C3 with an addon: text addons around a text input, and optionally a `wj-select` after it.
 * Each addon has an id the input can name.
 */
@Component({
  selector: 'wj-inputgroup-addon-host',
  imports: [WjInputGroup, WjInputGroupAddon, WjInputText, WjSelect],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-inputgroup>
        @if (before()) {
          <wj-inputgroupaddon id="before-unit">{{ before() }}</wj-inputgroupaddon>
        }
        <input
          wjInputText
          aria-label="Amount"
          aria-describedby="before-unit"
          [size]="inputSize()"
          [disabled]="inputDisabled()"
          [invalid]="inputInvalid()"
        />
        @if (withSelect()) {
          <wj-select ariaLabel="Currency" [options]="currencies" />
        }
        @if (after()) {
          <wj-inputgroupaddon id="after-unit">{{ after() }}</wj-inputgroupaddon>
        }
      </wj-inputgroup>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class AddonHost {
  readonly currencies = CURRENCIES;
  readonly before = signal<string | null>('$');
  readonly after = signal<string | null>(null);
  readonly withSelect = signal(false);
  readonly inputSize = signal<WjInputTextSize | undefined>(undefined);
  readonly inputInvalid = signal(false);
  readonly inputDisabled = signal(false);
}

/** C2: a `wj-button` in the addon after the input. */
@Component({
  selector: 'wj-inputgroup-button-addon-host',
  imports: [WjButton, WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <div id="scope" style="width: 320px">
      <wj-inputgroup>
        <input wjInputText aria-label="Discount code" />
        <wj-inputgroupaddon><wj-button label="Apply" /></wj-inputgroupaddon>
      </wj-inputgroup>
    </div>
  `,
})
class ButtonAddonHost {}

/**
 * The docs' "In a field": a unit after the input, described by the addon's id, and a currency
 * before it with an error the test turns on.
 */
@Component({
  selector: 'wj-inputgroup-field-addon-host',
  imports: [WjField, WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <div id="scope" style="width: 320px">
      <wj-field label="Weight" hint="Round to the nearest kilogram.">
        <wj-inputgroup>
          <input wjInputText id="weight" inputmode="numeric" aria-describedby="weight-unit" />
          <wj-inputgroupaddon id="weight-unit">kg</wj-inputgroupaddon>
        </wj-inputgroup>
      </wj-field>
      <wj-field label="Price" [error]="error()">
        <wj-inputgroup>
          <wj-inputgroupaddon id="price-unit">$</wj-inputgroupaddon>
          <input wjInputText id="price" inputmode="decimal" aria-describedby="price-unit" />
        </wj-inputgroup>
      </wj-field>
    </div>
  `,
})
class FieldAddonHost {
  readonly error = signal<string | undefined>(undefined);
}

/** An input group with nothing inside it. */
@Component({
  selector: 'wj-inputgroup-empty-host',
  imports: [WjInputGroup],
  template: `<wj-inputgroup />`,
})
class EmptyHost {}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  host: T;
  element: HTMLElement;
}

/** Renders `type` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render<T extends object>(
  type: Type<T>,
  scheme: Scheme = 'light',
  setup: (host: T) => void = () => undefined,
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(find(element, 'p-inputgroup')).display).toBe('flex');
  return { fixture, host: fixture.componentInstance, element };
}

function find(element: Element, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function box(element: Element, selector: string): DOMRect {
  return find(element, selector).getBoundingClientRect();
}

/** The four corner radii, `top-left / top-right / bottom-right / bottom-left`. */
function radii(element: HTMLElement): string {
  const style = getComputedStyle(element);
  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].join(' / ');
}

/** The four border widths, `top / right / bottom / left`. */
function borders(element: HTMLElement): string {
  const style = getComputedStyle(element);
  return [
    style.borderTopWidth,
    style.borderRightWidth,
    style.borderBottomWidth,
    style.borderLeftWidth,
  ].join(' / ');
}

/** Whether `element` starts a stacking context of its own, so a z-index inside it stays inside. */
function startsStackingContext(element: Element): boolean {
  const style = getComputedStyle(element);
  return (
    style.zIndex !== 'auto' ||
    style.opacity !== '1' ||
    style.transform !== 'none' ||
    style.filter !== 'none' ||
    style.isolation === 'isolate'
  );
}

// The element that draws a control's border, radius and focus ring: the input itself, or the
// `p-select` inside a `wj-select`.
const INPUT = 'input';
const SELECT = 'wj-select > p-select';

/**
 * Parks the pointer in the viewport's bottom-right corner before a border read. The pointer is
 * page-wide in browser mode, and Optimus's hover border outranks the invalid one.
 */
async function pointerAway(): Promise<void> {
  const park = document.createElement('div');
  park.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 8px; height: 8px';
  document.body.append(park);
  try {
    await userEvent.hover(park);
  } finally {
    park.remove();
  }
}

describe('WjInputGroup', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
  });

  describe('content', () => {
    it('projects the input and the select as direct children of the Optimus root, in order', async () => {
      const { element } = await render(Host);
      const root = find(element, 'p-inputgroup');

      expect(Array.from(root.children).map((child) => child.localName)).toEqual([
        'input',
        'wj-select',
      ]);
    });

    it('keeps both controls usable through the harness', async () => {
      const { fixture, host } = await render(Host);
      const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputGroupHarness);
      const input = await group.getHarness(WjInputTextHarness);
      const select = await group.getHarness(WjSelectHarness);

      await input.setValue('12.50');
      await select.selectOption('EUR');

      expect(await input.getValue()).toBe('12.50');
      expect(await select.getValueText()).toBe('EUR');
      expect(host.currency()).toBe('EUR');
    });

    it('keeps the controls’ own inputs: input mode, name and a text payload as text', async () => {
      const { fixture, element } = await render(Host);
      const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputGroupHarness);
      await (await group.getHarness(WjInputTextHarness)).setValue('<b>x</b>');

      expect(find(element, 'input').getAttribute('inputmode')).toBe('decimal');
      expect(find(element, 'p-inputgroup').querySelector('b')).toBeNull();
    });
  });

  describe('growth', () => {
    it('shares the row between the input and the select, as Optimus does for native children', async () => {
      const { element } = await render(Host);

      expect(box(element, 'wj-inputgroup').width).toBe(320);
      expect(box(element, INPUT).width).toBeCloseTo(INPUT_WIDTH, 1);
      expect(box(element, 'wj-select').width).toBeCloseTo(SELECT_WIDTH, 1);
      expect(box(element, SELECT).width).toBeCloseTo(SELECT_WIDTH, 1);
      // No gap and no overlap: the row is exactly the two controls.
      expect(box(element, INPUT).width + box(element, 'wj-select').width).toBeCloseTo(320, 1);
    });

    it('shares it the same way when the select comes first', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.selectFirst.set(true);
      });

      expect(box(element, 'wj-select').width).toBeCloseTo(SELECT_WIDTH, 1);
      expect(box(element, INPUT).width).toBeCloseTo(INPUT_WIDTH, 1);
      expect(box(element, 'wj-select').right).toBe(box(element, INPUT).left);
    });

    it('does not depend on the picked text', async () => {
      const { fixture, host, element } = await render(Host);
      host.currency.set('VND');
      await fixture.whenStable();

      expect(box(element, INPUT).width).toBeCloseTo(INPUT_WIDTH, 1);
      expect(box(element, 'wj-select').width).toBeCloseTo(SELECT_WIDTH, 1);
    });

    it('follows the width the app gave the group', async () => {
      const { fixture, element } = await render(Host);
      find(element, '#scope').style.width = '480px';
      await fixture.whenStable();

      expect(box(element, 'wj-inputgroup').width).toBe(480);
      expect(box(element, INPUT).width + box(element, 'wj-select').width).toBeCloseTo(480, 1);
    });

    it('stretches both controls to the tallest part, at every size', async () => {
      const { fixture, host, element } = await render(Host);

      for (const [inputSize, selectSize, height] of [
        [undefined, undefined, 44],
        ['small', undefined, 44],
        [undefined, 'small', 44],
        ['small', 'small', 36],
        ['large', undefined, 52],
        [undefined, 'large', 52],
      ] as const) {
        host.inputSize.set(inputSize);
        host.selectSize.set(selectSize);
        await fixture.whenStable();
        const label = `input ${String(inputSize)}, select ${String(selectSize)}`;

        expect(box(element, INPUT).height, label).toBe(height);
        expect(box(element, SELECT).height, label).toBe(height);
        expect(box(element, 'wj-inputgroup').height, label).toBe(height);
      }
    });

    it('never wraps: at 120 px the controls shrink and stay on one row', async () => {
      const { fixture, element } = await render(Host);
      find(element, '#scope').style.width = '120px';
      await fixture.whenStable();

      expect(box(element, 'wj-inputgroup').height).toBe(44);
      expect(box(element, INPUT).top).toBe(box(element, 'wj-select').top);
      expect(box(element, INPUT).width + box(element, 'wj-select').width).toBeCloseTo(120, 1);
      expect(box(element, 'wj-select').width).toBeGreaterThan(0);
    });
  });

  describe('corners', () => {
    // Optimus's own result with native children: the first part's start corners and the last
    // part's end corners are 8 px, every inner corner is square.
    it('rounds the input’s start corners and the select’s end corners, the inner ones square', async () => {
      const { element } = await render(Host);

      expect(radii(find(element, INPUT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, SELECT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('swaps with the order: the select first rounds its start corners', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.selectFirst.set(true);
      });

      expect(radii(find(element, SELECT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, INPUT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('follows the writing direction: start is the right side in rtl', async () => {
      const { fixture, element } = await render(Host);
      find(element, '#scope').dir = 'rtl';
      await fixture.whenStable();

      expect(radii(find(element, INPUT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(radii(find(element, SELECT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(box(element, 'wj-select').right).toBe(box(element, INPUT).left);
    });

    it('rounds all four corners of a lone control', async () => {
      const { element } = await render(SingleHost);

      expect(radii(find(element, '#lone-input input'))).toBe(
        `${RADIUS} / ${RADIUS} / ${RADIUS} / ${RADIUS}`,
      );
      expect(radii(find(element, '#lone-select p-select'))).toBe(
        `${RADIUS} / ${RADIUS} / ${RADIUS} / ${RADIUS}`,
      );
    });

    it('keeps the corners at every size', async () => {
      const { fixture, host, element } = await render(Host);
      host.inputSize.set('large');
      host.selectSize.set('small');
      await fixture.whenStable();

      expect(radii(find(element, INPUT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, SELECT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });
  });

  describe('lines', () => {
    it('shows both controls’ borders at the seam: 1 px each, a 2 px line, no gap or overlap', async () => {
      await pointerAway();
      const { element } = await render(Host);

      expect(borders(find(element, INPUT))).toBe('1px / 1px / 1px / 1px');
      expect(borders(find(element, SELECT))).toBe('1px / 1px / 1px / 1px');
      expect(getComputedStyle(find(element, INPUT)).borderRightColor).toBe(BORDER);
      expect(getComputedStyle(find(element, SELECT)).borderLeftColor).toBe(BORDER);
      expect(box(element, INPUT).right).toBe(box(element, 'wj-select').left);
    });

    it('draws no margin between the controls', async () => {
      const { element } = await render(Host);

      expect(getComputedStyle(find(element, INPUT)).marginRight).toBe('0px');
      expect(getComputedStyle(find(element, SELECT)).marginLeft).toBe('0px');
    });
  });

  describe('focus', () => {
    it.each<[string, boolean]>([
      ['the input comes first', false],
      ['the select comes first', true],
    ])('lifts the focused control above its neighbour when %s', async (_name, selectFirst) => {
      const { fixture, element } = await render(Host, 'light', (host) => {
        host.selectFirst.set(selectFirst);
      });

      for (const [focus, ring, neighbour] of [
        [INPUT, INPUT, SELECT],
        ['[role="combobox"]', SELECT, INPUT],
      ] as const) {
        find(element, focus).focus();
        await fixture.whenStable();
        const lifted = getComputedStyle(find(element, ring));

        expect(lifted.zIndex, focus).toBe('1');
        expect(lifted.outlineStyle, focus).toBe('solid');
        expect(lifted.outlineWidth, focus).toBe('2px');
        expect(lifted.outlineOffset, focus).toBe('2px');
        expect(getComputedStyle(find(element, neighbour)).zIndex, focus).toBe('auto');
        // Nothing between the control and the root keeps the lift to itself.
        let parent = find(element, ring).parentElement;
        while (parent !== null && parent.localName !== 'p-inputgroup') {
          expect(startsStackingContext(parent), `${parent.localName} around ${focus}`).toBe(false);
          parent = parent.parentElement;
        }
        find(element, focus).blur();
      }
    });
  });

  describe('invalid and disabled', () => {
    it('marks the invalid input only: the select keeps its own boundary', async () => {
      const { fixture, host, element } = await render(Host);
      host.inputInvalid.set(true);
      await fixture.whenStable();
      await pointerAway();

      expect(getComputedStyle(find(element, INPUT)).borderTopColor).toBe(INVALID_BORDER);
      expect(getComputedStyle(find(element, SELECT)).borderTopColor).toBe(BORDER);
    });

    it('marks the invalid select only: the input keeps its own boundary', async () => {
      const { fixture, host, element } = await render(Host);
      host.selectInvalid.set(true);
      await fixture.whenStable();
      await pointerAway();

      expect(getComputedStyle(find(element, SELECT)).borderTopColor).toBe(INVALID_BORDER);
      expect(getComputedStyle(find(element, INPUT)).borderTopColor).toBe(BORDER);
    });

    it('disables the one control only, and the group draws nothing of its own', async () => {
      const { fixture, host, element } = await render(Host);
      host.selectDisabled.set(true);
      await fixture.whenStable();

      expect(find(element, INPUT)).toHaveProperty('disabled', false);
      expect(find(element, '[role="combobox"]').getAttribute('aria-disabled')).toBe('true');
      for (const selector of ['wj-inputgroup', 'p-inputgroup']) {
        const style = getComputedStyle(find(element, selector));
        expect(style.backgroundColor, selector).toBe('rgba(0, 0, 0, 0)');
        expect(style.borderTopWidth, selector).toBe('0px');
      }
    });

    it('keeps the shape when a control is invalid or disabled', async () => {
      const { fixture, host, element } = await render(Host);
      host.inputDisabled.set(true);
      host.selectInvalid.set(true);
      await fixture.whenStable();

      expect(radii(find(element, INPUT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, SELECT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(box(element, INPUT).width).toBeCloseTo(INPUT_WIDTH, 1);
    });
  });

  describe('text addons (C1)', () => {
    // Optimus's own result with native `p-inputgroup-addon` children in a 320 px group: the addon
    // keeps its content width (at least 40 px), the input takes the rest, and the line between an
    // addon and the input is the input's own border.
    it('shares the row: a 40 px addon, the input fills the rest, no gap and no overlap', async () => {
      const { element } = await render(AddonHost);

      expect(box(element, 'wj-inputgroup').width).toBe(320);
      expect(box(element, 'wj-inputgroupaddon').width).toBe(40);
      expect(box(element, INPUT).width).toBe(280);
      expect(box(element, 'wj-inputgroupaddon').right).toBe(box(element, INPUT).left);
    });

    it('shares it with an addon on each side: 40 + 240 + 40', async () => {
      const { element } = await render(AddonHost, 'light', (host) => {
        host.after.set('.00');
      });

      expect(box(element, INPUT).width).toBe(240);
      expect(box(element, INPUT).right).toBe(box(element, '#after-unit').left);
      expect(box(element, '#after-unit').width).toBe(40);
    });

    it('lets a longer addon text take its width from the input, never wrapping the row', async () => {
      const { fixture, host, element } = await render(AddonHost);
      host.before.set('https://');
      await fixture.whenStable();

      expect(box(element, 'wj-inputgroupaddon').width).toBeGreaterThan(40);
      expect(box(element, 'wj-inputgroupaddon').width + box(element, INPUT).width).toBeCloseTo(
        320,
        1,
      );
      expect(box(element, 'wj-inputgroup').height).toBe(44);
    });

    it('rounds the outer corners only: the addon its start, the input its end', async () => {
      const { element } = await render(AddonHost);

      expect(radii(find(element, 'p-inputgroup-addon'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, INPUT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('rounds an addon after the input at the end, and the input at the start', async () => {
      const { element } = await render(AddonHost, 'light', (host) => {
        host.before.set(null);
        host.after.set('kg');
      });

      expect(radii(find(element, INPUT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, 'p-inputgroup-addon'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('draws one line between the addon and the input: the input’s 1 px, the addon none', async () => {
      await pointerAway();
      const { element } = await render(AddonHost);
      const addon = find(element, 'p-inputgroup-addon');

      expect(borders(addon)).toBe('1px / 0px / 1px / 1px');
      expect(borders(find(element, INPUT))).toBe('1px / 1px / 1px / 1px');
      expect(getComputedStyle(addon).borderLeftColor).toBe(BORDER);
      expect(getComputedStyle(find(element, INPUT)).borderLeftColor).toBe(BORDER);
    });

    it('mirrors in rtl: the addon sits on the right, its start corners the right ones', async () => {
      const { fixture, element } = await render(AddonHost);
      find(element, '#scope').dir = 'rtl';
      await fixture.whenStable();

      expect(radii(find(element, 'p-inputgroup-addon'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(radii(find(element, INPUT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(box(element, 'wj-inputgroupaddon').left).toBe(box(element, INPUT).right);
    });

    it('stretches the addon to the input at every size: 36, 44 and 52 px', async () => {
      const { fixture, host, element } = await render(AddonHost);

      for (const [size, height] of [
        ['small', 36],
        [undefined, 44],
        ['large', 52],
      ] as const) {
        host.inputSize.set(size);
        await fixture.whenStable();

        expect(box(element, INPUT).height, String(size)).toBe(height);
        expect(box(element, 'p-inputgroup-addon').height, String(size)).toBe(height);
        expect(box(element, 'wj-inputgroup').height, String(size)).toBe(height);
      }
    });

    it('lifts the focused input above the addon, ring whole', async () => {
      const { fixture, element } = await render(AddonHost);
      find(element, INPUT).focus();
      await fixture.whenStable();
      const lifted = getComputedStyle(find(element, INPUT));

      expect(lifted.zIndex).toBe('1');
      expect(lifted.outlineWidth).toBe('2px');
      expect(lifted.outlineOffset).toBe('2px');
      expect(getComputedStyle(find(element, 'p-inputgroup-addon')).zIndex).toBe('auto');
    });

    it('leaves the addon alone when the input is invalid or disabled', async () => {
      const { fixture, host, element } = await render(AddonHost);
      host.inputInvalid.set(true);
      await fixture.whenStable();
      await pointerAway();

      expect(getComputedStyle(find(element, INPUT)).borderTopColor).toBe(INVALID_BORDER);
      expect(getComputedStyle(find(element, 'p-inputgroup-addon')).borderTopColor).toBe(BORDER);

      host.inputInvalid.set(false);
      host.inputDisabled.set(true);
      await fixture.whenStable();

      expect(getComputedStyle(find(element, 'p-inputgroup-addon')).borderTopColor).toBe(BORDER);
      expect(radii(find(element, 'p-inputgroup-addon'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
    });
  });

  describe('button addon (C2)', () => {
    it('shares the row: the input takes what the button addon leaves', async () => {
      const { element } = await render(ButtonAddonHost);
      const addon = box(element, 'wj-inputgroupaddon');

      expect(box(element, 'wj-inputgroup').width).toBe(320);
      expect(addon.width + box(element, INPUT).width).toBe(320);
      expect(box(element, INPUT).width).toBeCloseTo(249, 0);
      expect(box(element, INPUT).right).toBe(addon.left);
    });

    it('is 46 px tall: the 44 px button plus the addon’s two 1 px lines, the input stretched', async () => {
      const { element } = await render(ButtonAddonHost);

      expect(box(element, 'button.p-button').height).toBe(44);
      expect(box(element, 'p-inputgroup-addon').height).toBe(46);
      expect(box(element, INPUT).height).toBe(46);
      expect(box(element, 'wj-inputgroup').height).toBe(46);
    });

    it('rounds the input’s start corners and the button’s end corners, the seam square', async () => {
      const { element } = await render(ButtonAddonHost);

      expect(radii(find(element, INPUT))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, 'button.p-button'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(borders(find(element, 'p-inputgroup-addon'))).toBe('1px / 1px / 1px / 0px');
    });
  });

  describe('a text addon, an input and a select (C3 with an addon)', () => {
    it('shares the free width between the input and the select, as C3 does, after the addon', async () => {
      const { element } = await render(AddonHost, 'light', (host) => {
        host.withSelect.set(true);
      });

      expect(box(element, 'wj-inputgroupaddon').width).toBe(40);
      expect(box(element, INPUT).width).toBeCloseTo(INPUT_WIDTH_AFTER_ADDON, 1);
      expect(box(element, 'wj-select').width).toBeCloseTo(SELECT_WIDTH_AFTER_ADDON, 1);
      expect(box(element, 'wj-select').right).toBe(box(element, 'wj-inputgroup').right);
    });

    it('rounds the addon’s start corners and the select’s end corners, the inner ones square', async () => {
      const { element } = await render(AddonHost, 'light', (host) => {
        host.withSelect.set(true);
      });

      expect(radii(find(element, 'p-inputgroup-addon'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, INPUT))).toBe('0px / 0px / 0px / 0px');
      expect(radii(find(element, SELECT))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('squares the select when an addon follows it, which takes the end corners', async () => {
      const { element } = await render(AddonHost, 'light', (host) => {
        host.withSelect.set(true);
        host.after.set('.00');
      });

      expect(element.querySelectorAll('p-inputgroup-addon')).toHaveLength(2);
      expect(radii(find(element, SELECT))).toBe('0px / 0px / 0px / 0px');
      expect(radii(find(element, '#after-unit p-inputgroup-addon'))).toBe(
        `0px / ${RADIUS} / ${RADIUS} / 0px`,
      );
    });
  });

  describe('host box', () => {
    it('takes the block display of the root it wraps, never contents', async () => {
      const { element } = await render(Host);
      const host = find(element, 'wj-inputgroup');
      const root = find(element, 'p-inputgroup');

      expect(getComputedStyle(host).display).toBe('block');
      expect(getComputedStyle(root).display).toBe('flex');
      expect(getComputedStyle(root).flexWrap).toBe('nowrap');
      expect(host.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    it('draws nothing of its own: no background, border, padding or margin', async () => {
      const { element } = await render(Host);
      const style = getComputedStyle(find(element, 'wj-inputgroup'));

      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.paddingTop).toBe('0px');
      expect(style.marginTop).toBe('0px');
    });

    it('has no height with nothing inside it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(
        find(fixture.nativeElement as HTMLElement, 'wj-inputgroup').getBoundingClientRect().height,
      ).toBe(0);
    });
  });

  describe('pt', () => {
    it('reaches host and root, as an object', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' }, host: { 'data-host': 'host' } });
      });
      const root = find(element, 'p-inputgroup');

      await expect.poll(() => root.getAttribute('data-probe')).toBe('root');
      expect(root.getAttribute('data-host')).toBe('host');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });

      await expect.poll(() => find(element, 'p-inputgroup').getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the projected controls in place and sharing the row', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });
      const root = find(element, 'p-inputgroup');

      await expect.poll(() => root.classList.contains('probe-class')).toBe(true);
      expect(root.children).toHaveLength(2);
      expect(box(element, INPUT).width).toBeCloseTo(INPUT_WIDTH, 1);
    });
  });

  describe('inside a wj-field', () => {
    it('one control registers: <label for> names it, and the hint and error describe it', async () => {
      const { fixture, host, element } = await render(FieldHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const field = await loader.getHarness(WjFieldHarness.with({ label: 'Price' }));
      const input = find(element, 'input');
      const label = find(element, 'label.wj-field-label');
      const hintId = find(element, '.wj-field-hint').id;

      expect(await field.isGroup()).toBe(false);
      expect(label.getAttribute('for')).toBe('field-price');
      expect(input).toHaveProperty('labels.0', label);
      expect(await (await field.getHarness(WjInputTextHarness)).getId()).toBe('field-price');
      expect(input.getAttribute('aria-describedby')).toBe(hintId);

      host.error.set('Enter a price above zero.');
      await fixture.whenStable();

      await expect
        .poll(() => input.getAttribute('aria-describedby'))
        .toBe(`${hintId} ${find(element, '.wj-field-error').id}`);
      await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
    });

    it('one control: a click on the label focuses the input', async () => {
      const { element } = await render(FieldHost);

      await userEvent.click(find(element, 'label.wj-field-label'));

      expect(document.activeElement).toBe(find(element, 'input'));
    });

    it('two controls make the field a group named by its span label', async () => {
      const { fixture, host, element } = await render(FieldGroupHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const field = await loader.getHarness(WjFieldHarness.with({ label: 'Price' }));
      const fieldHost = find(element, 'wj-field');
      const label = find(element, '.wj-field-label');
      const hintId = find(element, '.wj-field-hint').id;

      expect(await field.isGroup()).toBe(true);
      expect(fieldHost.getAttribute('role')).toBe('group');
      expect(fieldHost.getAttribute('aria-labelledby')).toBe(label.id);
      expect(label.tagName).toBe('SPAN');
      expect(fieldHost.getAttribute('aria-describedby')).toBe(hintId);

      host.error.set('Enter a price above zero.');
      await fixture.whenStable();
      const errorId = find(element, '.wj-field-error').id;

      expect(fieldHost.getAttribute('aria-describedby')).toBe(`${hintId} ${errorId}`);
      for (const control of [find(element, 'input'), find(element, '[role="combobox"]')]) {
        await expect.poll(() => control.getAttribute('aria-invalid')).toBe('true');
        expect(control.getAttribute('aria-describedby')).toBe(`${hintId} ${errorId}`);
      }
    });
  });

  describe('inside a wj-field, with an addon', () => {
    it('keeps the addon’s id ahead of the field’s hint in the input’s description', async () => {
      const { element } = await render(FieldAddonHost);
      const hintId = find(element, '.wj-field-hint').id;
      const input = find(element, '#weight');

      expect(input.getAttribute('aria-describedby')).toBe(`weight-unit ${hintId}`);
      expect(document.getElementById('weight-unit')?.textContent.trim()).toBe('kg');
      expect(find(element, 'label.wj-field-label').getAttribute('for')).toBe('weight');
    });

    it('adds the error after the addon’s id, and marks the input invalid', async () => {
      const { fixture, host, element } = await render(FieldAddonHost);
      host.error.set('Enter a price above zero.');
      await fixture.whenStable();
      const price = find(element, '#price');
      const errorId = find(element, '.wj-field-error').id;

      await expect.poll(() => price.getAttribute('aria-describedby')).toBe(`price-unit ${errorId}`);
      await expect.poll(() => price.getAttribute('aria-invalid')).toBe('true');
      expect(document.getElementById('price-unit')?.textContent.trim()).toBe('$');
    });

    it('keeps the addon’s grey boundary when the field shows an error', async () => {
      const { fixture, host, element } = await render(FieldAddonHost);
      host.error.set('Enter a price above zero.');
      await fixture.whenStable();
      await pointerAway();

      expect(getComputedStyle(find(element, '#price')).borderTopColor).toBe(INVALID_BORDER);
      expect(getComputedStyle(find(element, '#price-unit p-inputgroup-addon')).borderTopColor).toBe(
        BORDER,
      );
    });
  });

  describe('host attributes', () => {
    it('applies role and aria-labelledby on the host as written, and adds none of its own', async () => {
      const { element } = await render(CaptionHost);
      const group = find(element, 'wj-inputgroup');

      expect(group.getAttribute('role')).toBe('group');
      expect(group.getAttribute('aria-labelledby')).toBe('caption');
      expect(find(element, 'p-inputgroup').getAttribute('role')).toBeNull();
    });

    it('adds no role and no tabindex when the app sets none', async () => {
      const { element } = await render(Host);

      for (const selector of ['wj-inputgroup', 'p-inputgroup']) {
        expect(find(element, selector).getAttribute('role')).toBeNull();
        expect(find(element, selector).tabIndex).toBe(-1);
      }
    });
  });

  describe('harness', () => {
    it('reports no addon for a group of controls', async () => {
      const { fixture } = await render(Host);
      const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputGroupHarness);

      expect(await group.getAddonCount()).toBe(0);
      expect(await group.getAddonTexts()).toEqual([]);
    });

    it('reports the addons’ count and texts, in order, through WjInputGroupAddonHarness', async () => {
      const { fixture } = await render(AddonHost, 'light', (host) => {
        host.after.set('.00');
      });
      const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputGroupHarness);

      expect(await group.getAddonCount()).toBe(2);
      expect(await group.getAddonTexts()).toEqual(['$', '.00']);
      const unit = await group.getHarness(WjInputGroupAddonHarness.with({ text: '.00' }));
      expect(await unit.getText()).toBe('.00');
    });

    it('reports a button addon by its button’s label', async () => {
      const { fixture } = await render(ButtonAddonHost);
      const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputGroupHarness);

      expect(await group.getAddonCount()).toBe(1);
      expect(await group.getAddonTexts()).toEqual(['Apply']);
    });

    it('finds the group and the controls inside it', async () => {
      const { fixture } = await render(Host);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjInputGroupHarness)).toHaveLength(1);
      const group = await loader.getHarness(WjInputGroupHarness);
      expect(await group.getAllHarnesses(WjInputTextHarness)).toHaveLength(1);
      expect(await group.getAllHarnesses(WjSelectHarness)).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each<[string, (host: Host) => void]>([
        ['the input first, then the select', () => undefined],
        [
          'the select first, then the input',
          (host) => {
            host.selectFirst.set(true);
          },
        ],
        [
          'both controls disabled',
          (host) => {
            host.inputDisabled.set(true);
            host.selectDisabled.set(true);
          },
        ],
        [
          'an invalid input',
          (host) => {
            host.inputInvalid.set(true);
          },
        ],
        [
          'an invalid select',
          (host) => {
            host.selectInvalid.set(true);
            host.currency.set('EUR');
          },
        ],
      ])('has no axe violations: %s', async (_name, setup) => {
        const { fixture, element } = await render(Host, scheme, setup);
        await fixture.whenStable();

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it.each<[string, (host: AddonHost) => void]>([
        ['a text addon before the input (C1)', () => undefined],
        [
          'text addons on both sides',
          (host) => {
            host.after.set('.00');
          },
        ],
        [
          'a text addon, an input and a select',
          (host) => {
            host.withSelect.set(true);
          },
        ],
        [
          'an invalid input beside an addon',
          (host) => {
            host.inputInvalid.set(true);
          },
        ],
        [
          'a disabled input beside an addon',
          (host) => {
            host.inputDisabled.set(true);
          },
        ],
      ])('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(AddonHost, scheme, setup);

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: a button addon (C2)', async () => {
        const { element } = await render(ButtonAddonHost, scheme);

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: addons in a field, with a hint and then an error', async () => {
        const { fixture, host, element } = await render(FieldAddonHost, scheme);
        await expectNoAxeViolations(find(element, '#scope'));

        host.error.set('Enter a price above zero.');
        await fixture.whenStable();
        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: a captioned group', async () => {
        const { element } = await render(CaptionHost, scheme);

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: one control in a field, with a hint and then an error', async () => {
        const { fixture, host, element } = await render(FieldHost, scheme);
        await expectNoAxeViolations(find(element, '#scope'));

        host.error.set('Enter a price above zero.');
        await fixture.whenStable();
        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: two controls in a field, with a hint and then an error', async () => {
        const { fixture, host, element } = await render(FieldGroupHost, scheme);
        await expectNoAxeViolations(find(element, '#scope'));

        host.error.set('Enter a price above zero.');
        await fixture.whenStable();
        await expectNoAxeViolations(find(element, '#scope'));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab goes to the input, then the select, then on: the group is no stop', async () => {
      const { element } = await render(Host);
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '[role="combobox"]'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '[role="combobox"]'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, 'input'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before'));
    });

    it('follows the order of the children: the select first, then the input', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.selectFirst.set(true);
      });
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '[role="combobox"]'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));
    });
  });

  describe('setup warning', () => {
    it('is silent when provideWeeljack is present', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0001: wj-inputgroup: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
