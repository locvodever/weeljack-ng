/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import { OverlayService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjDatePicker, type WjDatePickerPt, type WjDatePickerSize } from 'weeljack-ng/datepicker';
import { WjDatePickerHarness } from 'weeljack-ng/datepicker/testing';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import * as datepickerApi from 'weeljack-ng/datepicker';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/*
 * Every date here is pinned: the picked date is Friday 15 March 2024, so the panel opens on a known
 * month, and a spec that needs "today" fakes only `Date` and says so. Months in `data-date` keys
 * are zero-based, as Optimus writes them: `2024-2-15` is 15 March 2024.
 */
const march15 = (): Date => new Date(2024, 2, 15);
const KEY_MARCH_15 = '2024-2-15';
/** The first day of March 2024, where an inline calendar's Home key lands. */
const FIRST_DAY = '2024-2-1';

/**
 * Parks the pointer on the host's "After" button before a border or colour read. The pointer is
 * page-wide in browser mode, so an earlier test can leave it over the control.
 */
async function pointerAway(element: HTMLElement): Promise<void> {
  const after = element.querySelector<HTMLElement>('#after');
  if (after === null) throw new Error('The host has no #after button.');
  await userEvent.hover(after);
}

/** A consumer's template: one bare date picker, or the same one inside a field. */
@Component({
  selector: 'wj-datepicker-host',
  imports: [WjField, WjDatePicker],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Start date" [hint]="hint()" [error]="error()">
        <wj-datepicker
          [(value)]="value"
          [pt]="pt()"
          [inline]="inline()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [placeholder]="placeholder()"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          [disabledDates]="disabledDates()"
          [disabledDays]="disabledDays()"
          [dateFormat]="dateFormat()"
          [showIcon]="showIcon()"
        />
      </wj-field>
    } @else {
      <wj-datepicker
        ariaLabel="Start date"
        [(value)]="value"
        [pt]="pt()"
        [inline]="inline()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
        [placeholder]="placeholder()"
        [minDate]="minDate()"
        [maxDate]="maxDate()"
        [disabledDates]="disabledDates()"
        [disabledDays]="disabledDays()"
        [dateFormat]="dateFormat()"
        [showIcon]="showIcon()"
      />
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<Date | null>(march15());
  readonly pt = signal<WjDatePickerPt>(undefined);
  readonly inline = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjDatePickerSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>(undefined);
  readonly minDate = signal<Date | undefined>(undefined);
  readonly maxDate = signal<Date | undefined>(undefined);
  readonly disabledDates = signal<Date[]>([]);
  readonly disabledDays = signal<number[]>([]);
  readonly dateFormat = signal<string | undefined>(undefined);
  readonly showIcon = signal(false);
}

/** The four ARIA string inputs, bound from signals, in either mode. */
@Component({
  selector: 'wj-datepicker-aria-host',
  imports: [WjDatePicker],
  template: `
    <wj-datepicker
      [inline]="inline()"
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inline = signal(false);
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Start date');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-datepicker-aria-on-host-host',
  imports: [WjDatePicker],
  template: `<wj-datepicker aria-label="Start date" />`,
})
class AriaOnHostHost {}

/** A consumer's own label, and a field around a date picker with its own `inputId`. */
@Component({
  selector: 'wj-datepicker-own-ids-host',
  imports: [WjDatePicker, WjField],
  template: `
    <p id="note">Note</p>
    <span id="namer">Namer</span>
    <label for="plain">Plain</label>
    <wj-datepicker inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Start date" hint="Hint" error="Error">
      <wj-datepicker inputId="mine" ariaDescribedBy="note" ariaLabelledBy="namer" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-datepicker-ngmodel-host',
  imports: [WjField, WjDatePicker, FormsModule],
  template: `
    <wj-field label="Start date">
      <wj-datepicker [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<Date | null>(march15());
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-datepicker-reactive-host',
  imports: [WjField, WjDatePicker, ReactiveFormsModule],
  template: `
    <wj-field label="Start date">
      <wj-datepicker [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  /** `unknown`, so a spec can write what is not a `Date`. */
  readonly control = new FormControl<unknown>(march15());
}

/** A reactive control that commits on blur. */
@Component({
  selector: 'wj-datepicker-blur-host',
  imports: [WjField, WjDatePicker, ReactiveFormsModule],
  template: `
    <wj-field label="Start date">
      <wj-datepicker [formControl]="control" />
    </wj-field>
  `,
})
class BlurHost {
  readonly control = new FormControl<Date | null>(march15(), { updateOn: 'blur' });
}

/** An inline calendar under `ngModel`, to see it marked touched. */
@Component({
  selector: 'wj-datepicker-inline-forms-host',
  imports: [WjField, WjDatePicker, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Delivery date">
      <wj-datepicker inline [formControl]="control" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class InlineFormsHost {
  readonly control = new FormControl<Date | null>(march15());
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-datepicker-signal-host',
  imports: [WjField, WjDatePicker, FormField],
  template: `
    <wj-field label="Start date">
      <wj-datepicker [formField]="model.start" />
    </wj-field>
    <wj-datepicker ariaLabel="Bare" [formField]="model.bare" />
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ start: Date | null; bare: Date | null }>({
    start: march15(),
    bare: null,
  });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Choose it.' });
    disabledRule(path.start, { when: () => this.off() });
  });
}

/** Controls for the keyboard spec: a popup with a button, a disabled one, a last one. */
@Component({
  selector: 'wj-datepicker-keyboard-host',
  imports: [WjDatePicker],
  template: `
    <button type="button" id="before">Before</button>
    <wj-datepicker ariaLabel="First" showIcon [(value)]="value" />
    <wj-datepicker ariaLabel="Disabled" showIcon disabled />
    <wj-datepicker ariaLabel="Last" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly value = signal<Date | null>(march15());
}

/** An inline calendar between two buttons, for the keyboard spec. */
@Component({
  selector: 'wj-datepicker-inline-keyboard-host',
  imports: [WjDatePicker],
  template: `
    <button type="button" id="before">Before</button>
    <wj-datepicker inline ariaLabel="Delivery date" [(value)]="value" />
    <button type="button" id="after">After</button>
  `,
})
class InlineKeyboardHost {
  readonly value = signal<Date | null>(march15());
}

/** An inline calendar in a container the spec sizes. */
@Component({
  selector: 'wj-datepicker-narrow-host',
  imports: [WjDatePicker, WjField],
  template: `
    <div id="box">
      <wj-field label="Delivery date">
        <wj-datepicker inline [value]="value" />
      </wj-field>
    </div>
  `,
})
class NarrowHost {
  readonly value = march15();
}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
}

/** Renders `type` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function renderAs<T>(
  type: new () => T,
  setup: (component: T) => void = () => undefined,
  scheme: Scheme = 'light',
  translation: Parameters<typeof provideWeeljack>[0] = {},
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...translation })],
  });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered<Host>> => renderAs(Host, setup, scheme);

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const inputOf = (element: HTMLElement): HTMLInputElement =>
  find(element, 'input[role="combobox"]', HTMLInputElement);

const buttonOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, 'button[aria-haspopup="dialog"]', HTMLButtonElement);

const panelOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="dialog"], [role="group"]', HTMLElement);

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-datepicker', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const dayOf = (element: HTMLElement, key: string): HTMLElement =>
  find(element, `span[data-date="${key}"]`, HTMLElement);

const section = (element: HTMLElement, name: string): HTMLElement =>
  find(element, `[data-pc-section="${name}"]`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjDatePickerHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjDatePickerHarness);

/** The pickers of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjDatePickerHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjDatePickerHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-datepicker at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/** What a CSS custom property of the root resolves to as a colour. */
function resolvedColour(property: string, as: 'color' | 'backgroundColor'): string {
  const probe = document.createElement('span');
  probe.style[as] = `var(${property})`;
  document.body.append(probe);
  const resolved = getComputedStyle(probe)[as];
  probe.remove();
  return resolved;
}

/**
 * Waits until the overlay is fully open: shown, with its enter over. Optimus keeps `p-motion`
 * hidden while closed, and shows it and starts the enter in the same frame, so a shown `p-motion`
 * with no motion class left means the enter has ended. Optimus drops a key pressed within about
 * 20 ms of opening, so every spec waits here before it presses one.
 */
async function panelOpen(element: HTMLElement): Promise<void> {
  const open = (): boolean => {
    const motion = element.querySelector<HTMLElement>('p-motion');
    return motion !== null && motion.style.display !== 'none' && motion.className === 'p-motion';
  };
  await expect.poll(open).toBe(true);
}

/** Opens the popup and waits for it to be fully open. */
async function openPanel(picker: WjDatePickerHarness, element: HTMLElement): Promise<void> {
  await picker.open();
  await expect.poll(() => picker.isOpen()).toBe(true);
  await panelOpen(element);
}

/** Closes an open popup and waits for its leave to end, so nothing is left open at teardown. */
async function closePanel(picker: WjDatePickerHarness, element: HTMLElement): Promise<void> {
  await picker.close();
  await expect.poll(() => picker.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
}

/** The `data-date` key of the focused day, `null` when focus is not on a day. */
const focusedDay = (): string | null => document.activeElement?.getAttribute('data-date') ?? null;

/** The name of the control that has focus, to follow Tab through the open panel. */
const focusedName = (): string | null =>
  document.activeElement?.getAttribute('aria-label') ??
  document.activeElement?.getAttribute('data-date') ??
  document.activeElement?.textContent.trim() ??
  null;

/** Makes `window.matchMedia` answer "reduce" to a reduced-motion query, until the spy is restored. */
function emulateReducedMotion(reduce: boolean): MockInstance<typeof window.matchMedia> {
  const original = window.matchMedia.bind(window);
  return vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((query) =>
      reduce && query.includes('prefers-reduced-motion: reduce')
        ? original('all')
        : original(query),
    );
}

/** Waits `count` animation frames: a frame count, not a duration, so a slow machine waits longer. */
async function frames(count: number): Promise<void> {
  for (let frame = 0; frame < count; frame++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
}

/** Fakes `Date` only, so "today" is 10 March 2024 and every real timer keeps running. */
function pinToday(): void {
  // spec-timing: only `Date` is faked, so "today" is fixed while Optimus's own timers still run
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2024, 2, 10, 12));
}

/** Every `data-probe` part this wrapper's `pt` reaches, as the date picker names it. */
const PROBES: WjDatePickerPt = {
  root: { 'data-probe': 'root' },
  pcInputText: { root: { 'data-probe': 'input' } },
  dropdown: { 'data-probe': 'dropdown' },
  panel: { 'data-probe': 'panel' },
  header: { 'data-probe': 'header' },
  pcPrevButton: { root: { 'data-probe': 'prev' } },
  pcNextButton: { root: { 'data-probe': 'next' } },
  selectMonth: { 'data-probe': 'month' },
  selectYear: { 'data-probe': 'year' },
  table: { 'data-probe': 'table' },
  dayCell: { 'data-probe': 'cell' },
  day: { 'data-probe': 'day' },
};

const POPUP_PARTS = ['root', 'input', 'dropdown'];
const PANEL_PARTS = ['panel', 'header', 'prev', 'next', 'month', 'year', 'table', 'cell', 'day'];

/** The `data-probe` names found inside `element`. */
const probesIn = (element: HTMLElement): Set<string> =>
  new Set(
    Array.from(
      element.querySelectorAll('[data-probe]'),
      (part) => part.getAttribute('data-probe') ?? '',
    ),
  );

/** Asserts every named part carries its probe. */
function expectProbes(element: HTMLElement, names: string[]): void {
  const found = probesIn(element);
  for (const name of names) {
    expect(found.has(name), `the "${name}" part got its pt`).toBe(true);
  }
}

const STATES: [string, (host: Host) => void][] = [
  [
    'empty with a placeholder',
    (host) => {
      host.value.set(null);
      host.placeholder.set('mm/dd/yyyy');
    },
  ],
  [
    'with a value',
    () => {
      /* the default is the picked date */
    },
  ],
  [
    'with the calendar button',
    (host) => {
      host.showIcon.set(true);
    },
  ],
  [
    'disabled',
    (host) => {
      host.showIcon.set(true);
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.showIcon.set(true);
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.showIcon.set(true);
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.showIcon.set(true);
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.showIcon.set(true);
      host.hint.set('The day you arrive.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.showIcon.set(true);
      host.error.set('Choose a date after check-in.');
    },
  ],
  [
    'inline',
    (host) => {
      host.inline.set(true);
    },
  ],
  [
    'inline with min and max',
    (host) => {
      host.inline.set(true);
      host.minDate.set(new Date(2024, 2, 8));
      host.maxDate.set(new Date(2024, 2, 24));
      host.disabledDays.set([0, 6]);
    },
  ],
  [
    'inline in a field',
    (host) => {
      host.inline.set(true);
      host.inField.set(true);
      host.hint.set('Pick a delivery day.');
    },
  ],
  [
    'inline in a field with an error',
    (host) => {
      host.inline.set(true);
      host.inField.set(true);
      host.error.set('Choose a date.');
    },
  ],
];

describe('WjDatePicker', () => {
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
    vi.useRealTimers();
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('value is two-way: the text follows it, a pick writes it back, and clearing gives null', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);
      expect(await picker.getText()).toBe('03/15/2024');

      component.value.set(new Date(2024, 3, 2));
      await fixture.whenStable();
      expect(await picker.getText()).toBe('04/02/2024');

      await openPanel(picker, element);
      await picker.selectDay(20);
      await fixture.whenStable();
      expect(component.value()).toEqual(new Date(2024, 3, 20));
      expect(await picker.getText()).toBe('04/20/2024');

      await picker.clear();
      await fixture.whenStable();
      expect(component.value()).toBeNull();
      expect(await picker.getText()).toBe('');
      await closePanel(picker, element);
    });

    it('shows an empty input again when the value goes back to null', async () => {
      const { fixture, component } = await render();
      const picker = await harnessOf(fixture);
      expect(await picker.getText()).toBe('03/15/2024');

      component.value.set(null);
      await fixture.whenStable();

      expect(await picker.getText()).toBe('');
    });

    it('disabled, required and invalid reach the input, and disabled the button too', async () => {
      const { fixture, component, element } = await render((host) => {
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isDisabled()).toBe(false);
      expect(await picker.isRequired()).toBe(false);
      expect(await picker.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await picker.isRequired()).toBe(true);
      expect(await picker.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await picker.isDisabled()).toBe(true);
      expect(buttonOf(element).disabled).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('placeholder reaches the input and follows the bound value', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(null);
        host.placeholder.set('mm/dd/yyyy');
      });
      const picker = await harnessOf(fixture);
      expect(await picker.getPlaceholder()).toBe('mm/dd/yyyy');

      component.placeholder.set(undefined);
      await fixture.whenStable();
      expect(await picker.getPlaceholder()).toBeNull();
    });

    it('minDate and maxDate switch off the days outside them, and months and years in their views', async () => {
      const { fixture, element } = await render((host) => {
        host.minDate.set(new Date(2024, 2, 10));
        host.maxDate.set(new Date(2024, 2, 20));
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      expect(await picker.isDayDisabled(9)).toBe(true);
      expect(await picker.isDayDisabled(10)).toBe(false);
      expect(await picker.isDayDisabled(20)).toBe(false);
      expect(await picker.isDayDisabled(21)).toBe(true);
      await expect(picker.selectDay(21)).rejects.toThrow('cannot be picked');

      await userEvent.click(section(element, 'selectmonth'));
      await expect
        .poll(() => element.querySelectorAll('[data-pc-section="month"]').length)
        .toBe(12);
      const months = Array.from(element.querySelectorAll('[data-pc-section="month"]'));
      expect(months.map((month) => getComputedStyle(month).pointerEvents)).toEqual([
        'none',
        'none',
        'auto',
        'none',
        'none',
        'none',
        'none',
        'none',
        'none',
        'none',
        'none',
        'none',
      ]);
      await closePanel(picker, element);
    });

    it('disabledDays and disabledDates switch off weekdays and single dates', async () => {
      const { fixture, element } = await render((host) => {
        host.disabledDays.set([0, 6]);
        host.disabledDates.set([new Date(2024, 2, 13)]);
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      // 16 and 17 March 2024 are a Saturday and a Sunday.
      expect(await picker.isDayDisabled(16)).toBe(true);
      expect(await picker.isDayDisabled(17)).toBe(true);
      expect(await picker.isDayDisabled(13)).toBe(true);
      expect(await picker.isDayDisabled(14)).toBe(false);
      await closePanel(picker, element);
    });

    it('dateFormat sets how the date is shown and read, and the translation sets the default', async () => {
      const { fixture, component } = await render((host) => {
        host.dateFormat.set('dd/mm/yy');
      });
      const picker = await harnessOf(fixture);
      expect(await picker.getText()).toBe('15/03/2024');

      component.dateFormat.set(undefined);
      await fixture.whenStable();
      expect(await picker.getText()).toBe('03/15/2024');

      component.dateFormat.set('yy-mm-dd');
      await fixture.whenStable();
      await picker.clear();
      await picker.typeText('2024-05-06');
      await fixture.whenStable();
      expect(component.value()).toEqual(new Date(2024, 4, 6));
    });

    it('showIcon adds the calendar button, named from the translation', async () => {
      const { fixture, component, element } = await render();
      expect(element.querySelector('button[aria-haspopup="dialog"]')).toBeNull();

      component.showIcon.set(true);
      await fixture.whenStable();

      expect(buttonOf(element).getAttribute('aria-label')).toBe('Choose Date');
      expect(buttonOf(element).tabIndex).toBe(0);
      expect(await (await harnessOf(fixture)).isInline()).toBe(false);
    });

    it('size steps the height 36 / 44 / 52 px, and follows the bound value', async () => {
      const { fixture, component, element } = await render();
      expect(inputOf(element).getBoundingClientRect().height).toBe(44);

      component.size.set('small');
      await fixture.whenStable();
      expect(inputOf(element).getBoundingClientRect().height).toBe(36);

      component.size.set('large');
      await fixture.whenStable();
      expect(inputOf(element).getBoundingClientRect().height).toBe(52);

      component.size.set(undefined);
      await fixture.whenStable();
      expect(inputOf(element).getBoundingClientRect().height).toBe(44);
    });

    it('is an inline-flex host with the Optimus root and input stretched to its width', async () => {
      const { element } = await render();
      const host = hostOf(element);
      host.style.inlineSize = '320px';

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(find(element, 'p-datepicker', HTMLElement).getBoundingClientRect().width).toBe(320);
      expect(inputOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('stretches the input beside the calendar button to the host width', async () => {
      const { element } = await render((host) => {
        host.showIcon.set(true);
      });
      hostOf(element).style.inlineSize = '320px';

      expect(find(element, 'p-datepicker', HTMLElement).getBoundingClientRect().width).toBe(320);
      expect(inputOf(element).getBoundingClientRect().width).toBe(320 - 40);
    });

    it('keeps a long typed text inside the input, scrolling and never ellipsized', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);
      hostOf(element).style.inlineSize = '80px';
      await picker.typeText('03/15/2024 and some more words');

      expect(inputOf(element).getBoundingClientRect().width).toBe(80);
      expect(inputOf(element).scrollWidth).toBeGreaterThan(80);
      expect(getComputedStyle(inputOf(element)).textOverflow).toBe('clip');
      await closePanel(picker, element);
    });
  });

  describe('non-Date values', () => {
    it('hands a string the form wrote to Optimus unchanged: it is read, and the control keeps it', async () => {
      const { fixture, component } = await renderAs(ReactiveHost);
      const picker = await harnessOf(fixture);

      component.control.setValue('04/20/2024');
      await fixture.whenStable();

      expect(await picker.getText()).toBe('04/20/2024');
      expect(component.control.value).toBe('04/20/2024');
    });
  });

  describe('inline mode', () => {
    it('shows the calendar alone, always, with no text box and no button', async () => {
      const { fixture, element } = await render((host) => {
        host.inline.set(true);
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      await panelOpen(element);

      expect(await picker.isInline()).toBe(true);
      expect(await picker.isOpen()).toBe(true);
      expect(element.querySelector('input')).toBeNull();
      expect(element.querySelector('button[aria-haspopup]')).toBeNull();
      expect(await picker.getText()).toBe('');
      expect(await picker.getMonth()).toBe('March');
      expect(await picker.getYear()).toBe(2024);
      expect(dayOf(element, KEY_MARCH_15).getAttribute('data-date')).toBe(KEY_MARCH_15);
    });

    it('sizes to its content and starts at the start edge, never stretching to the field', async () => {
      const { element } = await render((host) => {
        host.inline.set(true);
        host.inField.set(true);
      });
      await panelOpen(element);
      const field = find(element, 'wj-field', HTMLElement).getBoundingClientRect();
      const host = hostOf(element).getBoundingClientRect();

      expect(host.width).toBeLessThan(field.width);
      expect(host.width).toBeGreaterThan(250);
      expect(host.left).toBe(field.left);
      expect(host.width).toBe(panelOf(element).getBoundingClientRect().width);
    });

    it('scrolls inside itself in a narrow container, and never widens the page', async () => {
      const { element } = await renderAs(NarrowHost);
      await panelOpen(element);
      const box = byId(element, 'box');
      box.style.inlineSize = '200px';
      const before = ROOT.scrollWidth;

      expect(hostOf(element).getBoundingClientRect().width).toBe(200);
      expect(panelOf(element).scrollWidth).toBeGreaterThan(panelOf(element).clientWidth);
      expect(getComputedStyle(panelOf(element)).overflowX).toBe('auto');
      expect(ROOT.scrollWidth).toBe(before);
      expect(dayOf(element, KEY_MARCH_15).getBoundingClientRect().width).toBe(32);
    });

    it('is a group named by the field label, not by Optimus’s own label', async () => {
      const { element } = await render((host) => {
        host.inline.set(true);
        host.inField.set(true);
      });
      const label = find(element, '.wj-field-label', HTMLElement);

      expect(panelOf(element).getAttribute('role')).toBe('group');
      expect(panelOf(element).getAttribute('aria-labelledby')).toBe(label.id);
      expect(panelOf(element).hasAttribute('aria-modal')).toBe(false);
    });

    it('is named by ariaLabel outside a field, and by Optimus’s translated name with none', async () => {
      const { fixture, component, element } = await renderAs(AriaHost, (host) => {
        host.inline.set(true);
      });
      expect(panelOf(element).getAttribute('aria-label')).toBe('Start date');

      component.ariaLabel.set(undefined);
      await fixture.whenStable();
      expect(panelOf(element).getAttribute('role')).toBe('group');
      expect(panelOf(element).getAttribute('aria-label')).toBe('Choose Date');
    });

    it('an ariaLabelledBy wins over the field’s label, and ariaDescribedBy lands on the group', async () => {
      const { fixture, component, element } = await renderAs(AriaHost, (host) => {
        host.inline.set(true);
      });
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();

      expect(panelOf(element).getAttribute('aria-labelledby')).toBe('namer');
      expect(panelOf(element).getAttribute('aria-describedby')).toBe('describer');
    });

    it('takes the invalid border from the invalid state and puts no aria-invalid on the group', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inline.set(true);
        host.inField.set(true);
      });
      const idle = getComputedStyle(panelOf(element)).borderTopColor;
      expect(idle).not.toBe(INVALID_BORDER);

      component.error.set('Choose a date.');
      await fixture.whenStable();
      await pointerAway(element);

      expect(getComputedStyle(panelOf(element)).borderTopColor).toBe(INVALID_BORDER);
      expect(panelOf(element).hasAttribute('aria-invalid')).toBe(false);

      component.error.set('');
      await fixture.whenStable();
      expect(getComputedStyle(panelOf(element)).borderTopColor).toBe(idle);
    });

    it('switches between popup and inline with the input', async () => {
      const { fixture, component, element } = await render();
      expect(element.querySelector('input[role="combobox"]')).not.toBeNull();

      component.inline.set(true);
      await fixture.whenStable();
      expect(element.querySelector('input')).toBeNull();
      expect(panelOf(element).getAttribute('role')).toBe('group');

      component.inline.set(false);
      await fixture.whenStable();
      expect(element.querySelector('input[role="combobox"]')).not.toBeNull();
      expect(element.querySelector('[role="group"]')).toBeNull();
    });
  });

  describe('the calendar', () => {
    it('is the dialog "Choose Date", with the header buttons named from the translation', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      expect(panelOf(element).getAttribute('role')).toBe('dialog');
      expect(panelOf(element).getAttribute('aria-modal')).toBe('true');
      expect(panelOf(element).getAttribute('aria-label')).toBe('Choose Date');
      expect(find(element, 'button[aria-label="Previous Month"]', HTMLButtonElement)).toBeTruthy();
      expect(find(element, 'button[aria-label="Next Month"]', HTMLButtonElement)).toBeTruthy();
      expect(await picker.getMonth()).toBe('March');
      expect(await picker.getYear()).toBe(2024);
      expect(
        Array.from(
          element.querySelectorAll('[data-pc-section="weekday"]'),
          (day) => day.textContent,
        ),
      ).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
      await closePanel(picker, element);
    });

    it('names the month and year buttons by their visible text, with the translation’s label as the description', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      const views: [string, string, string][] = [
        ['selectmonth', 'March', 'Choose Month'],
        ['selectyear', '2024', 'Choose Year'],
      ];
      for (const [name, text, description] of views) {
        const button = section(element, name);
        expect(button.hasAttribute('aria-label'), name).toBe(false);
        expect(button.textContent.trim(), name).toBe(text);
        expect(button.getAttribute('aria-description'), name).toBe(description);
      }
      await picker.nextMonth();
      expect(section(element, 'selectmonth').textContent.trim()).toBe('April');
      expect(section(element, 'selectmonth').hasAttribute('aria-label')).toBe(false);
      await closePanel(picker, element);
    });

    it('reads Vietnamese from the vi translation with no input: names, format, first weekday', async () => {
      const { fixture, element } = await renderAs(
        Host,
        (host) => {
          host.showIcon.set(true);
        },
        'light',
        { translation: viLocale },
      );
      const picker = await harnessOf(fixture);
      expect(await picker.getText()).toBe('15/03/2024');
      expect(buttonOf(element).getAttribute('aria-label')).toBe('Chọn ngày');
      await openPanel(picker, element);

      expect(panelOf(element).getAttribute('aria-label')).toBe('Chọn ngày');
      expect(section(element, 'selectmonth').getAttribute('aria-description')).toBe('Chọn tháng');
      expect(section(element, 'selectyear').getAttribute('aria-description')).toBe('Chọn năm');
      expect(find(element, 'button[aria-label="Tháng trước"]', HTMLButtonElement)).toBeTruthy();
      expect(find(element, 'button[aria-label="Tháng sau"]', HTMLButtonElement)).toBeTruthy();
      expect(await picker.getMonth()).toBe('Tháng 3');
      expect(
        Array.from(
          element.querySelectorAll('[data-pc-section="weekday"]'),
          (day) => day.textContent,
        ),
      ).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
      await closePanel(picker, element);
    });

    it('shows the next and previous month, and the month and year follow', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await picker.nextMonth();
      expect(await picker.getMonth()).toBe('April');
      await picker.nextMonth();
      expect(await picker.getMonth()).toBe('May');
      await picker.previousMonth();
      await picker.previousMonth();
      await picker.previousMonth();
      expect(await picker.getMonth()).toBe('February');
      expect(await picker.getYear()).toBe(2024);
      await closePanel(picker, element);
    });

    it('opens on today’s month when nothing is picked, with today ringed and not picked', async () => {
      pinToday();
      const { fixture, component, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      expect(await picker.getMonth()).toBe('March');
      const today = dayOf(element, '2024-2-10');
      const other = dayOf(element, '2024-2-12');
      expect(getComputedStyle(today).borderTopColor).toBe(
        resolvedColour('--wj-form-field-border-color', 'color'),
      );
      expect(getComputedStyle(today).borderTopWidth).toBe('1px');
      expect(getComputedStyle(today).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(other).borderTopColor).toBe('rgba(0, 0, 0, 0)');
      expect(component.value()).toBeNull();
      await closePanel(picker, element);
    });

    it('draws the picked day in the primary fill, over today’s fill', async () => {
      pinToday();
      const { fixture, element } = await render((host) => {
        host.value.set(new Date(2024, 2, 10));
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      const picked = getComputedStyle(dayOf(element, '2024-2-10'));
      expect(picked.backgroundColor).toBe(
        resolvedColour('--wj-datepicker-date-selected-background', 'backgroundColor'),
      );
      expect(picked.color).toBe(resolvedColour('--wj-datepicker-date-selected-color', 'color'));
      await closePanel(picker, element);
    });

    it('mutes a day that cannot be picked at full opacity, with no pointer cursor', async () => {
      const { fixture, element } = await render((host) => {
        host.disabledDays.set([0]);
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);
      await pointerAway(element);
      const muted = resolvedColour('--wj-text-muted-color', 'color');

      // 25 February is another month's day, 17 March is a disabled Sunday.
      for (const key of ['2024-1-25', '2024-2-17']) {
        const style = getComputedStyle(dayOf(element, key));
        expect(style.opacity, key).toBe('1');
        expect(style.color, key).toBe(muted);
        expect(style.cursor, key).toBe('default');
        expect(style.textDecorationLine, key).toBe('none');
      }
      expect(getComputedStyle(dayOf(element, '2024-2-18')).color).not.toBe(muted);
      await closePanel(picker, element);
    });

    it('draws the month and year buttons in the page font, at the title’s weight', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);
      const title = getComputedStyle(section(element, 'title'));

      for (const name of ['selectmonth', 'selectyear']) {
        const style = getComputedStyle(section(element, name));
        expect(style.fontFamily, name).toBe(title.fontFamily);
        expect(style.fontSize, name).toBe(title.fontSize);
        expect(style.fontWeight, name).toBe(title.fontWeight);
      }
      await closePanel(picker, element);
    });

    it('measures 32 px day cells, a calendar button of at least 24 px and 44 px header buttons', async () => {
      const { fixture, element } = await render((host) => {
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      const day = dayOf(element, KEY_MARCH_15).getBoundingClientRect();
      expect([day.width, day.height]).toEqual([32, 32]);
      const trigger = buttonOf(element).getBoundingClientRect();
      expect(trigger.width).toBeGreaterThanOrEqual(24);
      expect(trigger.height).toBeGreaterThanOrEqual(24);
      for (const label of ['Previous Month', 'Next Month']) {
        const box = find(
          element,
          `button[aria-label="${label}"]`,
          HTMLElement,
        ).getBoundingClientRect();
        expect(box.width, label).toBeGreaterThanOrEqual(24);
        expect(box.height, label).toBeGreaterThanOrEqual(24);
      }
      await closePanel(picker, element);
    });

    it('measures the calendar button 32 / 40 / 48 px wide and as tall as the input', async () => {
      const { fixture, component, element } = await render((host) => {
        host.showIcon.set(true);
        host.size.set('small');
      });
      const sizes: [WjDatePickerSize | undefined, number, number][] = [
        ['small', 32, 36],
        [undefined, 40, 44],
        ['large', 48, 52],
      ];
      for (const [size, width, height] of sizes) {
        component.size.set(size);
        await fixture.whenStable();
        const box = buttonOf(element).getBoundingClientRect();
        expect([box.width, box.height], String(size)).toEqual([width, height]);
      }
    });

    it('joins the button to the input with square inner corners and 8 px outer ones', async () => {
      const { element } = await render((host) => {
        host.showIcon.set(true);
      });
      const input = getComputedStyle(inputOf(element));
      const button = getComputedStyle(buttonOf(element));

      expect(input.borderTopRightRadius).toBe('0px');
      expect(input.borderTopLeftRadius).toBe('8px');
      expect(button.borderTopRightRadius).toBe('8px');
      expect(button.borderTopLeftRadius).toBe('0px');
    });

    it('lifts the focused input above the button so its ring is drawn whole', async () => {
      const { fixture, element } = await render((host) => {
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(getComputedStyle(inputOf(element)).zIndex).toBe('auto');

      await openPanel(picker, element);

      expect(getComputedStyle(inputOf(element)).zIndex).toBe('1');
      await closePanel(picker, element);
    });

    it('gives the disabled button the disabled fill and ink with the input, and not before', async () => {
      const { fixture, component, element } = await render((host) => {
        host.showIcon.set(true);
      });
      const fill = resolvedColour('--wj-form-field-disabled-background', 'backgroundColor');
      const ink = resolvedColour('--wj-form-field-disabled-color', 'color');
      expect(getComputedStyle(buttonOf(element)).backgroundColor).not.toBe(fill);

      component.disabled.set(true);
      await fixture.whenStable();

      expect(getComputedStyle(buttonOf(element)).backgroundColor).toBe(fill);
      expect(getComputedStyle(buttonOf(element)).color).toBe(ink);
      expect(getComputedStyle(inputOf(element)).backgroundColor).toBe(fill);
    });
  });

  describe('pt', () => {
    it('reaches every part: root, input, button, panel, header, both buttons, month and year, table, cells and days', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(PROBES);
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      expectProbes(element, POPUP_PARTS);
      expect(find(element, 'p-datepicker', HTMLElement).getAttribute('data-probe')).toBe('root');
      expect(inputOf(element).getAttribute('data-probe')).toBe('input');
      expect(buttonOf(element).getAttribute('data-probe')).toBe('dropdown');

      await openPanel(picker, element);
      expectProbes(element, PANEL_PARTS);
      expect(element.querySelectorAll('[data-probe="day"]')).toHaveLength(42);
      expect(
        find(element, 'button[aria-label="Previous Month"]', HTMLElement).getAttribute(
          'data-probe',
        ),
      ).toBe('prev');
      expect(
        find(element, 'button[aria-label="Next Month"]', HTMLElement).getAttribute('data-probe'),
      ).toBe('next');
      await closePanel(picker, element);
    });

    it('reaches the parts from a function-form pt as well', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(() => PROBES);
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS]);
      await closePanel(picker, element);
    });

    it('reaches the parts of a nested function-form pt, resolved once per part', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          pcInputText: () => ({ root: { 'data-probe': 'input' } }),
          pcPrevButton: () => ({ root: { 'data-probe': 'prev' } }),
          day: () => ({ 'data-probe': 'day' }),
          panel: () => ({ 'data-probe': 'panel' }),
        });
      });
      const picker = await harnessOf(fixture);
      expectProbes(element, ['input']);
      await openPanel(picker, element);

      expectProbes(element, ['prev', 'day', 'panel']);
      await closePanel(picker, element);
    });

    it('keeps landing after month navigation, closing and reopening, and value and pt changes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(PROBES);
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);
      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS]);

      await picker.nextMonth();
      await picker.nextMonth();
      expect(await picker.getMonth()).toBe('May');
      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS]);
      expect(element.querySelectorAll('[data-probe="day"]')).toHaveLength(
        element.querySelectorAll('span[data-date]').length,
      );

      await picker.previousMonth();
      expect(await picker.getMonth()).toBe('April');
      expectProbes(element, PANEL_PARTS);

      await closePanel(picker, element);
      await openPanel(picker, element);
      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS]);

      component.value.set(new Date(2024, 5, 3));
      await fixture.whenStable();
      expect(await picker.getMonth()).toBe('June');
      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS]);

      component.pt.set({ ...PROBES, day: { 'data-probe': 'changed-day' } });
      await fixture.whenStable();
      expect(probesIn(element).has('changed-day')).toBe(true);
      expect(probesIn(element).has('day')).toBe(false);
      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS.filter((name) => name !== 'day')]);
      await closePanel(picker, element);
    });

    it('keeps landing after disabled, size and invalid change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(PROBES);
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);

      component.size.set('small');
      component.invalid.set(true);
      await fixture.whenStable();
      expectProbes(element, POPUP_PARTS);

      component.disabled.set(true);
      await fixture.whenStable();
      expectProbes(element, POPUP_PARTS);

      component.disabled.set(false);
      await fixture.whenStable();
      await openPanel(picker, element);
      expectProbes(element, [...POPUP_PARTS, ...PANEL_PARTS]);
      await closePanel(picker, element);
    });

    it('the routed aria-invalid wins over the pt one on the same attribute', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ pcInputText: { root: { 'aria-invalid': 'false', 'data-probe': 'input' } } });
        host.invalid.set(true);
      });
      await fixture.whenStable();

      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(inputOf(element).getAttribute('data-probe')).toBe('input');
    });

    it('reaches the panel and the days of an inline calendar, and the routed role wins', async () => {
      const { fixture, element } = await render((host) => {
        host.inline.set(true);
        host.pt.set({ ...PROBES, panel: { 'data-probe': 'panel', role: 'region' } });
      });
      await fixture.whenStable();

      expectProbes(element, PANEL_PARTS);
      expect(panelOf(element).getAttribute('role')).toBe('group');
      expect(panelOf(element).getAttribute('data-probe')).toBe('panel');
      await (await harnessOf(fixture)).nextMonth();
      expectProbes(element, PANEL_PARTS);
    });
  });

  describe('typing and the model round trip', () => {
    it('keeps the typed text while it is incomplete, instead of rewriting it from the model', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);

      await picker.typeText('04/2');
      await fixture.whenStable();
      expect(await picker.getText()).toBe('04/2');
      expect(component.value()).toBeNull();

      await picker.typeText('0/2024');
      await fixture.whenStable();
      expect(component.value()).toEqual(new Date(2024, 3, 20));
      expect(await picker.getText()).toBe('04/20/2024');
      await closePanel(picker, element);
    });

    it('keeps the text of a picked date as the user edits it, instead of rewriting it from the model', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);
      expect(await picker.getText()).toBe('03/15/2024');

      await userEvent.keyboard('{Backspace}');
      await fixture.whenStable();

      // Optimus reads the shortened text as no date and reports null. Writing that null back would
      // empty the box under the user's caret.
      expect(await picker.getText()).toBe('03/15/202');
      expect(component.value()).toBeNull();
      await closePanel(picker, element);
    });

    it('keeps a short typed date as typed until the input blurs, then formats it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);

      await picker.typeText('4/2/2024');
      await fixture.whenStable();
      expect(component.value()).toEqual(new Date(2024, 3, 2));
      expect(await picker.getText()).toBe('4/2/2024');

      await closePanel(picker, element);
      await picker.blur();
      expect(await picker.getText()).toBe('04/02/2024');
    });

    it('moves the calendar to the typed date, and a pick afterwards keeps that month', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);

      await openPanel(picker, element);
      await picker.typeText('07/04/2024');
      await fixture.whenStable();
      expect(await picker.getMonth()).toBe('July');
      expect(await picker.getYear()).toBe(2024);

      await picker.selectDay(9);
      await fixture.whenStable();
      expect(component.value()).toEqual(new Date(2024, 6, 9));
      await expect.poll(() => picker.isOpen()).toBe(false);

      await openPanel(picker, element);
      expect(await picker.getMonth()).toBe('July');
      await closePanel(picker, element);
    });

    it('clears the value when the text is emptied, and does not reopen a closed panel after a pick', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await picker.selectDay(21);
      await fixture.whenStable();
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
      await fixture.whenStable();
      expect(await picker.isOpen()).toBe(false);
      expect(element.querySelector('[role="dialog"]')).toBeNull();
      expect(await picker.isFocused()).toBe(true);

      await picker.clear();
      await fixture.whenStable();
      expect(component.value()).toBeNull();
      await closePanel(picker, element);
    });
  });

  describe('the overlay', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('opens on input focus, an input click and the calendar button, and the button closes it', async () => {
      const { fixture, element } = await render((host) => {
        host.showIcon.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isOpen()).toBe(false);
      expect(element.querySelector('[role="dialog"]')).toBeNull();

      await picker.focus();
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(element);
      await closePanel(picker, element);

      await userEvent.click(inputOf(element));
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(element);
      await closePanel(picker, element);

      await picker.blur();
      await picker.clickButton();
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(element);
      expect(await picker.isFocused()).toBe(true);

      await picker.clickButton();
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders inside the host, with no appendTo, and uses the root OverlayService', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      expect(hostOf(element).contains(panelOf(element))).toBe(true);
      expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
      const host = fixture.debugElement.query((node) => node.name === 'wj-datepicker');
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(datepickerApi)).toEqual(['WjDatePicker']);
      await closePanel(picker, element);
    });

    it('opens with a motion by default, and without one under reduced motion', async () => {
      // Optimus starts the enter a few frames after the panel shows, so each run watches 12 frames
      // for the overlay's own animation. The emulation reaches script, not the CSS media query that
      // zeroes colour transitions, so only `animationstart` on the overlay is counted.
      const entered = async (reduce: boolean): Promise<boolean> => {
        const emulation = emulateReducedMotion(reduce);
        const { fixture, element } = await render();
        let started = false;
        element.addEventListener('animationstart', () => {
          started = true;
        });
        const picker = await harnessOf(fixture);
        await openPanel(picker, element);
        await frames(12);
        await closePanel(picker, element);
        TestBed.resetTestingModule();
        emulation.mockRestore();
        return started;
      };

      expect(await entered(false)).toBe(true);
      expect(await entered(true)).toBe(false);
    });

    it('Escape closes it and returns focus to the input', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('a pick closes it and returns focus to the input', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await picker.selectDay(18);
      await fixture.whenStable();

      expect(component.value()).toEqual(new Date(2024, 2, 18));
      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('a click outside closes it, leaving focus where the click puts it', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await userEvent.click(byId(element, 'after'));

      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(document.activeElement).toBe(byId(element, 'after'));
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('moves focus to the input, and opens it, when the field label is clicked', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(element);
      await closePanel(picker, element);
    });

    it('does not open when disabled', async () => {
      const { fixture, element } = await render((host) => {
        host.showIcon.set(true);
        host.disabled.set(true);
      });
      const picker = await harnessOf(fixture);

      await userEvent.click(inputOf(element), { force: true });
      await fixture.whenStable();

      expect(await picker.isOpen()).toBe(false);
      expect(element.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const picker = await harnessOf(fixture);
        expect(await picker.getText()).toBe('03/15/2024');

        await openPanel(picker, element);
        await picker.selectDay(22);
        await fixture.whenStable();
        expect(component.value()).toEqual(new Date(2024, 2, 22));

        component.value.set(new Date(2024, 8, 9));
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await picker.getText()).toBe('09/09/2024');
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const picker = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await picker.focus();
        await picker.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await picker.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const picker = await harnessOf(fixture);
        expect(await picker.getText()).toBe('03/15/2024');

        await openPanel(picker, element);
        await picker.selectDay(4);
        expect(component.control.value).toEqual(new Date(2024, 2, 4));
        expect(component.control.dirty).toBe(true);

        component.control.setValue(new Date(2024, 10, 8));
        expect(await picker.getText()).toBe('11/08/2024');
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const picker = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await picker.focus();
        await picker.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await picker.isDisabled()).toBe(true);

        component.control.enable();
        expect(await picker.isDisabled()).toBe(false);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(new Date(2024, 10, 8));

        expect(component.control.dirty).toBe(false);
      });

      it('shows an empty input for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getText()).toBe('');
      });

      it('honours updateOn blur: the control changes when the input blurs, not while typing', async () => {
        const { fixture, component, element } = await renderAs(BlurHost);
        const picker = await harnessOf(fixture);
        await picker.clear();
        await picker.typeText('04/20/2024');
        await fixture.whenStable();
        expect(component.control.value).toEqual(march15());
        expect(await picker.getText()).toBe('04/20/2024');

        await closePanel(picker, element);
        await picker.blur();
        expect(component.control.value).toEqual(new Date(2024, 3, 20));
        expect(component.control.touched).toBe(true);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const start = (await allHarnessesOf(fixture))(0);
        expect(await start.getText()).toBe('03/15/2024');

        await openPanel(start, element);
        await start.selectDay(12);
        await fixture.whenStable();
        expect(component.value().start).toEqual(new Date(2024, 2, 12));

        component.model.start().value.set(new Date(2024, 0, 31));
        await fixture.whenStable();
        expect(await start.getText()).toBe('01/31/2024');
      });

      it('disables the control and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const start = (await allHarnessesOf(fixture))(0);
        expect(component.model.start().touched()).toBe(false);

        await start.focus();
        await start.blur();
        expect(component.model.start().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await start.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture, element } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await openPanel(bare, element);
        await bare.selectDay(8);
        await fixture.whenStable();
        await bare.blur();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);

      await openPanel(picker, element);
      await picker.selectDay(3);
      expect(component.value()).toEqual(new Date(2024, 2, 3));

      await picker.blur();
      expect(await picker.isFocused()).toBe(false);
    });

    it('marks an inline calendar touched when focus leaves it, not while it moves inside it', async () => {
      const { fixture, component, element } = await renderAs(InlineFormsHost);
      expect(component.control.touched).toBe(false);

      await panelOpen(element);
      byId(element, 'before').focus();
      await userEvent.tab();
      await userEvent.tab();
      expect(focusedName()).toBe('March');
      expect(component.control.touched).toBe(false);

      byId(element, 'after').focus();
      await fixture.whenStable();
      expect(component.control.touched).toBe(true);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id on the input, named by the field label through aria-labelledby', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const picker = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLElement);

      expect(await picker.getId()).toMatch(/^wj-datepicker-\d+$/);
      expect(label.tagName).toBe('SPAN');
      expect(label.hasAttribute('for')).toBe(false);
      expect((await picker.getAriaAttributes()).labelledBy).toBe(label.id);
      expect(await field.getLabel()).toBe('Start date');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('fills the width of the field', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(hostOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
      expect(inputOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
    });

    it('adopts its own inputId, lets a consumer ariaLabelledBy win, and merges ariaDescribedBy first', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);
      const field = await fieldOf(fixture);

      expect(await inField.getId()).toBe('mine');
      expect((await inField.getAriaAttributes()).labelledBy).toBe('namer');
      expect((await inField.getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await field.getHint()).toBe('Hint');
      expect(await field.getError()).toBe('Error');
    });

    it('describes the input with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const picker = await harnessOf(fixture);
      expect((await picker.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await picker.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await picker.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Choose a date after check-in.');
      await fixture.whenStable();
      expect(await picker.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await picker.isInvalid()).toBe(false);
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });

    it('describes an inline calendar with the hint and the error, and marks nothing aria-invalid', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.inline.set(true);
        host.hint.set('Hint');
      });
      const picker = await harnessOf(fixture);
      expect((await picker.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await picker.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(panelOf(element).hasAttribute('aria-invalid')).toBe(false);
      expect(await picker.isInvalid()).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id, no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const picker = await harnessOf(fixture);
      const aria = await picker.getAriaAttributes();

      expect(await picker.getId()).toBe('');
      expect(aria.labelledBy).toBeNull();
      expect(aria.describedBy).toBeNull();
      expect(aria.label).toBe('Start date');
    });

    it('keeps the consumer’s inputId and ariaDescribedBy, and a <label for> names the input', async () => {
      const { fixture, element } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
      expect(find(element, 'label[for="plain"]', HTMLLabelElement).control).toBe(
        find(element, '#plain', HTMLInputElement),
      );
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await picker.isInvalid()).toBe(true);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId, ariaLabel, ariaLabelledBy and ariaDescribedBy on the input', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const picker = await harnessOf(fixture);

      expect(await picker.getId()).toBe('mine');
      expect(await picker.getAriaAttributes()).toEqual({
        label: 'Start date',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('the input is a combobox that says it opens a dialog, with its expanded state', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);

      expect(inputOf(element).getAttribute('role')).toBe('combobox');
      expect(inputOf(element).getAttribute('aria-haspopup')).toBe('dialog');
      expect(inputOf(element).getAttribute('aria-expanded')).toBe('false');
      expect(inputOf(element).hasAttribute('aria-controls')).toBe(false);

      await openPanel(picker, element);
      expect(inputOf(element).getAttribute('aria-expanded')).toBe('true');
      expect(inputOf(element).getAttribute('aria-controls')).toBe(panelOf(element).id);
      await closePanel(picker, element);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const picker = await harnessOf(fixture);

      expect((await picker.getAriaAttributes()).label).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-datepicker: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(AriaHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('WJ0001: wj-datepicker'));
    });
  });

  describe('safety', () => {
    it('renders an HTML payload on the ARIA string inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const picker = await harnessOf(fixture);

      expect(await picker.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inline.set(true);
      await fixture.whenStable();
      expect(await picker.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on placeholder and dateFormat as text only', async () => {
      const { fixture, component, element } = await render((host) => {
        host.placeholder.set(PAYLOAD);
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.getPlaceholder()).toBe(PAYLOAD);

      component.value.set(march15());
      component.dateFormat.set("'<b>'dd'</b>'");
      await fixture.whenStable();
      expect(await picker.getText()).toBe('<b>15</b>');
      expect(element.querySelector('b')).toBeNull();
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders typed HTML as the text of the input, never as markup', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);

      await picker.typeText(PAYLOAD);

      expect(await picker.getText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      await closePanel(picker, element);
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by placeholder', async () => {
      const { fixture } = await renderAs(Host, (host) => {
        host.placeholder.set('Hint');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(
        WjDatePickerHarness.with({ ariaLabel: /^Start/ }),
      );
      const byPlaceholder = await loader.getAllHarnesses(
        WjDatePickerHarness.with({ placeholder: 'Hint' }),
      );
      const none = await loader.getAllHarnesses(WjDatePickerHarness.with({ ariaLabel: 'Other' }));

      expect(byLabel).toHaveLength(1);
      expect(byPlaceholder).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('opens and closes the popup, picks a day by number and reads the shown month', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);
      expect(await picker.isInline()).toBe(false);
      expect(await picker.isOpen()).toBe(false);

      await openPanel(picker, element);
      expect(await picker.getMonth()).toBe('March');
      expect(await picker.getYear()).toBe(2024);
      await picker.nextMonth();
      await picker.selectDay(1);
      await fixture.whenStable();

      expect(component.value()).toEqual(new Date(2024, 3, 1));
      await expect.poll(() => picker.isOpen()).toBe(false);
    });

    it('reads an inline calendar: inline, open, no text, and a disabled one', async () => {
      const { fixture, component } = await render((host) => {
        host.inline.set(true);
        host.disabledDays.set([1]);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isInline()).toBe(true);
      expect(await picker.isOpen()).toBe(true);
      expect(await picker.getText()).toBe('');
      expect(await picker.isDayDisabled(18)).toBe(true);
      expect(await picker.isDayDisabled(19)).toBe(false);
      expect(await picker.isDisabled()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await picker.isDisabled()).toBe(true);
    });

    it('throws a clear error for a calendar part that is not showing', async () => {
      const { fixture } = await render();
      const picker = await harnessOf(fixture);

      await expect(picker.getMonth()).rejects.toThrow('is the calendar open?');
      await expect(picker.clickButton()).rejects.toThrow('set showIcon');
    });

    it('reads the focus state', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      expect(await picker.isFocused()).toBe(false);

      await picker.focus();
      expect(await picker.isFocused()).toBe(true);
      await panelOpen(element);
      await closePanel(picker, element);

      await picker.blur();
      expect(await picker.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
      });

      describe('with the panel open', () => {
        beforeEach(() => {
          // The overlay's own motion must end for axe to read its final colours.
          document.getElementById('wj-spec-no-motion')?.remove();
        });

        it('has no axe violations open on the current month, nothing picked', async () => {
          pinToday();
          const { fixture, element } = await render((host) => {
            host.value.set(null);
            host.showIcon.set(true);
          }, scheme);
          const picker = await harnessOf(fixture);
          await openPanel(picker, element);

          await expectNoAxeViolations(hostOf(element));
          await closePanel(picker, element);
        });

        it('has no axe violations open with a picked day, in a field', async () => {
          const { fixture, element } = await render((host) => {
            host.inField.set(true);
            host.showIcon.set(true);
            host.hint.set('The day you arrive.');
          }, scheme);
          const picker = await harnessOf(fixture);
          await openPanel(picker, element);

          await expectNoAxeViolations(find(element, 'wj-field', HTMLElement));
          await closePanel(picker, element);
        });

        it('has no axe violations with the day semantics: today, a pick, and days that cannot be picked', async () => {
          pinToday();
          const { fixture, element } = await render((host) => {
            host.value.set(new Date(2024, 2, 20));
            host.minDate.set(new Date(2024, 2, 5));
            host.disabledDays.set([6]);
            host.showIcon.set(true);
          }, scheme);
          const picker = await harnessOf(fixture);
          await openPanel(picker, element);
          await expect
            .poll(() => dayOf(element, '2024-2-20').closest('td')?.getAttribute('aria-selected'))
            .toBe('true');

          await expectNoAxeViolations(hostOf(element));
          await closePanel(picker, element);
        });

        it('has no axe violations in the month and year views', async () => {
          const { fixture, element } = await render((host) => {
            host.minDate.set(new Date(2024, 1, 10));
            host.maxDate.set(new Date(2026, 4, 20));
          }, scheme);
          const picker = await harnessOf(fixture);
          await openPanel(picker, element);

          await userEvent.click(section(element, 'selectmonth'));
          await expect
            .poll(() => element.querySelectorAll('[data-pc-section="month"]').length)
            .toBe(12);
          await expectNoAxeViolations(hostOf(element));

          await userEvent.click(section(element, 'selectyear'));
          await expect
            .poll(() => element.querySelectorAll('[data-pc-section="year"]').length)
            .toBe(10);
          await expectNoAxeViolations(hostOf(element));
          await closePanel(picker, element);
        });
      });
    });
  });

  describe('day semantics', () => {
    beforeEach(() => {
      // The overlay's own motion has to end for the keys and axe below.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    /** The `td` that holds the day with the `data-date` key. */
    const cellOf = (element: HTMLElement, key: string): HTMLElement => {
      const cell = dayOf(element, key).closest('td');
      if (cell === null) throw new Error(`${key} has no cell`);
      return cell;
    };

    const DAYS = {
      en: {
        picked: 'Wednesday, 20 March 2024',
        today: 'Sunday, 10 March 2024',
        other: 'Thursday, 21 March 2024',
        disabled: 'Monday, 4 March 2024',
      },
      vi: {
        picked: 'Thứ tư, 20 Tháng 3 2024',
        today: 'Chủ nhật, 10 Tháng 3 2024',
        other: 'Thứ năm, 21 Tháng 3 2024',
        disabled: 'Thứ hai, 4 Tháng 3 2024',
      },
    };

    describe.each([
      ['popup', false],
      ['inline', true],
    ])('%s', (_mode, inline) => {
      describe.each<['en' | 'vi', Parameters<typeof provideWeeljack>[0]]>([
        ['en', {}],
        ['vi', { translation: viLocale }],
      ])('in %s', (language, translation) => {
        it('names each day by its full date and marks today, the picked day and the days that cannot be picked', async () => {
          pinToday();
          const { fixture, element } = await renderAs(
            Host,
            (host) => {
              host.inline.set(inline);
              host.value.set(new Date(2024, 2, 20));
              host.minDate.set(new Date(2024, 2, 5));
            },
            'light',
            translation,
          );
          const picker = await harnessOf(fixture);
          if (!inline) await openPanel(picker, element);
          else await panelOpen(element);
          const names = DAYS[language];

          await expect
            .poll(() => cellOf(element, '2024-2-20').getAttribute('aria-label'))
            .toBe(names.picked);
          expect(cellOf(element, '2024-2-21').getAttribute('aria-label')).toBe(names.other);
          expect(cellOf(element, '2024-2-10').getAttribute('aria-label')).toBe(names.today);
          expect(cellOf(element, '2024-2-4').getAttribute('aria-label')).toBe(names.disabled);

          const current = Array.from(element.querySelectorAll('td[aria-current]'));
          expect(current).toEqual([cellOf(element, '2024-2-10')]);
          expect(current[0]?.getAttribute('aria-current')).toBe('date');

          expect(cellOf(element, '2024-2-20').getAttribute('aria-selected')).toBe('true');
          expect(cellOf(element, '2024-2-21').getAttribute('aria-selected')).toBe('false');
          expect(cellOf(element, '2024-2-4').getAttribute('aria-disabled')).toBe('true');
          expect(cellOf(element, '2024-2-4').hasAttribute('aria-selected')).toBe(false);
          expect(cellOf(element, '2024-2-21').hasAttribute('aria-disabled')).toBe(false);
          expect(dayOf(element, '2024-2-20').classList.contains('p-highlight')).toBe(true);
          expect(element.querySelectorAll('span.p-highlight')).toHaveLength(1);
          expect(dayOf(element, '2024-2-20').hasAttribute('aria-label')).toBe(false);
          if (!inline) await closePanel(picker, element);
        });
      });

      it('follows the pick and the month: the label, aria-selected and p-highlight move', async () => {
        const { fixture, component, element } = await render((host) => {
          host.inline.set(inline);
          host.value.set(new Date(2024, 2, 20));
        });
        const picker = await harnessOf(fixture);
        if (!inline) await openPanel(picker, element);
        else await panelOpen(element);

        await picker.selectDay(22);
        await fixture.whenStable();
        if (!inline) {
          await expect.poll(() => picker.isOpen()).toBe(false);
          await openPanel(picker, element);
        }
        expect(component.value()).toEqual(new Date(2024, 2, 22));
        expect(cellOf(element, '2024-2-22').getAttribute('aria-selected')).toBe('true');
        expect(cellOf(element, '2024-2-20').getAttribute('aria-selected')).toBe('false');
        expect(dayOf(element, '2024-2-22').classList.contains('p-highlight')).toBe(true);
        expect(dayOf(element, '2024-2-20').classList.contains('p-highlight')).toBe(false);

        await picker.nextMonth();
        expect(await picker.getMonth()).toBe('April');
        expect(cellOf(element, '2024-3-3').getAttribute('aria-label')).toBe(
          'Wednesday, 3 April 2024',
        );
        expect(element.querySelectorAll('td[aria-selected="true"]')).toHaveLength(0);
        expect(element.querySelectorAll('span.p-highlight')).toHaveLength(0);
        if (!inline) await closePanel(picker, element);
      });
    });

    it('ArrowDown from the input lands on the picked day, not the first', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(new Date(2024, 2, 20));
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await userEvent.keyboard('{ArrowDown}');

      await expect.poll(focusedDay).toBe('2024-2-20');
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('reopening the calendar puts the grid’s Tab stop on the picked day', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(new Date(2024, 2, 20));
      });
      const picker = await harnessOf(fixture);
      await openPanel(picker, element);

      await expect.poll(() => dayOf(element, '2024-2-20').tabIndex).toBe(0);
      expect(element.querySelectorAll('span[data-date][tabindex="0"]')).toHaveLength(1);
      await closePanel(picker, element);
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    /** Renders the keyboard host and focuses the first picker by Tab from the button before it. */
    async function focusFirst(): Promise<Rendered<KeyboardHost> & { picker: WjDatePickerHarness }> {
      const rendered = await renderAs(KeyboardHost);
      const picker = (await allHarnessesOf(rendered.fixture))(0);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(rendered.element);
      return { ...rendered, picker };
    }

    it('Tab opens the popup on the input, skips a disabled picker, and moves on', async () => {
      const { fixture, element, picker } = await focusFirst();

      await userEvent.tab();
      expect(await picker.isOpen()).toBe(false);
      expect(document.activeElement).toBe(buttonOf(element));
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();

      await userEvent.tab();
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Last');
      const last = (await allHarnessesOf(fixture))(2);
      await expect.poll(() => last.isOpen()).toBe(true);
      await panelOpen(element);
      await closePanel(last, element);
    });

    it('ArrowDown moves focus from the input into the open calendar, onto the picked day', async () => {
      const { picker } = await focusFirst();

      await userEvent.keyboard('{ArrowDown}');

      // The wrapper sets Optimus's `p-highlight` on the picked day, which is where it looks.
      expect(focusedDay()).toBe(KEY_MARCH_15);
      expect(await picker.isOpen()).toBe(true);
    });

    it('Escape, Enter and Tab in the input close the calendar and leave focus on the input', async () => {
      const { element, picker } = await focusFirst();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();

      await userEvent.click(inputOf(element));
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(element);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('the arrows move by day and by week, and PageUp and PageDown by month', async () => {
      const { picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      expect(focusedDay()).toBe(KEY_MARCH_15);

      await userEvent.keyboard('{ArrowRight}');
      expect(focusedDay()).toBe('2024-2-16');
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusedDay()).toBe(KEY_MARCH_15);
      await userEvent.keyboard('{ArrowDown}');
      expect(focusedDay()).toBe('2024-2-22');
      await userEvent.keyboard('{ArrowUp}');
      expect(focusedDay()).toBe(KEY_MARCH_15);

      await userEvent.keyboard('{PageDown}');
      await expect.poll(focusedDay).toBe('2024-3-15');
      expect(await picker.getMonth()).toBe('April');
      await userEvent.keyboard('{PageUp}');
      await expect.poll(focusedDay).toBe(KEY_MARCH_15);
      await userEvent.keyboard('{PageUp}');
      await expect.poll(focusedDay).toBe('2024-1-15');
      expect(await picker.getMonth()).toBe('February');
    });

    it('ArrowRight on the last day and ArrowLeft on the first cross into the next and previous month', async () => {
      const { picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{End}');
      await expect.poll(focusedDay).toBe('2024-2-31');

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => picker.getMonth()).toBe('April');
      await expect.poll(focusedDay).toBe('2024-3-1');
      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(() => picker.getMonth()).toBe('March');
      await expect.poll(focusedDay).toBe('2024-2-31');
    });

    it('Home and End go to the first and last day of the month', async () => {
      await focusFirst();
      await userEvent.keyboard('{ArrowDown}');

      await userEvent.keyboard('{Home}');
      expect(focusedDay()).toBe('2024-2-1');
      await userEvent.keyboard('{End}');
      expect(focusedDay()).toBe('2024-2-31');
    });

    it('Enter picks the focused day and Space does too, each closing the calendar onto the input', async () => {
      const { fixture, element, picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}{ArrowRight}');
      expect(focusedDay()).toBe('2024-2-16');

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(await picker.getText()).toBe('03/16/2024');
      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();

      await userEvent.click(inputOf(element));
      await expect.poll(() => picker.isOpen()).toBe(true);
      await panelOpen(element);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(focusedDay()).toBe('2024-2-23');
      await userEvent.keyboard(' ');
      await fixture.whenStable();
      expect(await picker.getText()).toBe('03/23/2024');
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('Escape on a day closes the calendar and returns focus to the input', async () => {
      const { element, picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      expect(focusedDay()).toBe(KEY_MARCH_15);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('Tab cycles inside the open calendar: previous, month, year, next, the day, and round', async () => {
      const { picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      expect(focusedDay()).toBe(KEY_MARCH_15);

      await userEvent.tab();
      expect(focusedName()).toBe('Previous Month');
      await userEvent.tab();
      expect(focusedName()).toBe('March');
      await userEvent.tab();
      expect(focusedName()).toBe('2024');
      await userEvent.tab();
      expect(focusedName()).toBe('Next Month');
      await userEvent.tab();
      expect(focusedDay()).toBe(KEY_MARCH_15);
      await userEvent.tab();
      expect(focusedName()).toBe('Previous Month');
      await userEvent.tab({ shift: true });
      expect(focusedDay()).toBe(KEY_MARCH_15);
      expect(await picker.isOpen()).toBe(true);
    });

    it('Escape on a header button closes the calendar and returns focus to the input', async () => {
      const { element, picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.tab();
      expect(focusedName()).toBe('Previous Month');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="dialog"]')).toBeNull();
    });

    it('Enter on a header button changes the month, and Enter on the month button opens the month view', async () => {
      const { element, picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      expect(await picker.getMonth()).toBe('February');

      await userEvent.tab();
      expect(focusedName()).toBe('February');
      await userEvent.keyboard('{Enter}');
      await expect
        .poll(() => element.querySelectorAll('[data-pc-section="month"]').length)
        .toBe(12);
      await expect
        .poll(() => document.activeElement?.getAttribute('data-pc-section'))
        .toBe('month');
    });

    it('the arrows and Enter move through the month view and pick a month, back in the day view', async () => {
      const { element, picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      await expect
        .poll(() => document.activeElement?.getAttribute('data-pc-section'))
        .toBe('month');
      const months = Array.from(element.querySelectorAll('[data-pc-section="month"]'));
      expect(document.activeElement).toBe(months[0]);

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
      expect(document.activeElement).toBe(months[5]);
      await userEvent.keyboard('{Enter}');

      await expect.poll(() => picker.getMonth()).toBe('June');
      expect(element.querySelector('[data-pc-section="monthview"]')).toBeNull();
    });

    it('the arrows and Enter move through the year view and pick a year', async () => {
      const { element, picker } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => document.activeElement?.getAttribute('data-pc-section')).toBe('year');
      const years = Array.from(element.querySelectorAll('[data-pc-section="year"]'));
      expect(years).toHaveLength(10);
      const start = Number(years[0]?.textContent.trim());

      await userEvent.keyboard('{ArrowRight}{ArrowDown}');
      expect(document.activeElement).toBe(years[3]);
      await userEvent.keyboard('{Enter}');

      await expect.poll(() => picker.getYear()).toBe(start + 3);
      expect(element.querySelector('[data-pc-section="yearview"]')).toBeNull();
    });

    it('takes the same grid keys in an inline calendar, with no trap', async () => {
      const { fixture, component, element } = await renderAs(InlineKeyboardHost);
      const picker = await harnessOf(fixture);
      await panelOpen(element);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(focusedName()).toBe('Previous Month');
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      expect(focusedName()).toBe('Next Month');
      await userEvent.tab();
      // The day grid's one Tab stop is the picked day: an inline calendar has none from Optimus.
      expect(focusedDay()).toBe(KEY_MARCH_15);

      await userEvent.keyboard('{ArrowRight}{ArrowDown}');
      expect(focusedDay()).toBe('2024-2-23');
      await userEvent.keyboard('{Home}');
      expect(focusedDay()).toBe(FIRST_DAY);
      await userEvent.keyboard('{End}');
      expect(focusedDay()).toBe('2024-2-31');
      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(component.value()).toEqual(new Date(2024, 2, 31));
      expect(await picker.getMonth()).toBe('March');

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('drops focus to the page when a key crosses into another month, and leaves a Tab stop on a day', async () => {
      const { fixture, element } = await renderAs(InlineKeyboardHost);
      const picker = await harnessOf(fixture);
      await panelOpen(element);
      byId(element, 'before').focus();
      for (let tab = 0; tab < 5; tab++) {
        await userEvent.tab();
      }
      expect(focusedDay()).toBe(KEY_MARCH_15);

      // The Optimus gap the page lists: it restores focus after a month change only for a popup.
      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => picker.getMonth()).toBe('April');
      await fixture.whenStable();
      expect(focusedDay()).toBeNull();
      expect(element.querySelectorAll('span[data-date][tabindex="0"]')).toHaveLength(1);

      byId(element, 'before').focus();
      for (let tab = 0; tab < 5; tab++) {
        await userEvent.tab();
      }
      expect(focusedDay()).toBe('2024-3-1');
    });

    it('Shift+Tab from the inline calendar’s first button goes back to the page', async () => {
      const { element } = await renderAs(InlineKeyboardHost);
      await panelOpen(element);
      byId(element, 'before').focus();
      await userEvent.tab();
      expect(focusedName()).toBe('Previous Month');

      await userEvent.tab({ shift: true });

      expect(document.activeElement).toBe(byId(element, 'before'));
    });
  });

  describe('the narrow field', () => {
    it('keeps a popup date picker inside a field narrower than the calendar', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      find(element, 'wj-field', HTMLElement).style.inlineSize = '180px';

      expect(hostOf(element).getBoundingClientRect().width).toBe(180);
      expect(inputOf(element).getBoundingClientRect().width).toBe(180);
    });
  });
});
