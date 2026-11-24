/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { MultiSelect } from '@openng/optimus-ui/multiselect';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import * as multiselectApi from 'weeljack-ng/multiselect';
import {
  WjMultiSelect,
  type WjMultiSelectPt,
  type WjMultiSelectSize,
} from 'weeljack-ng/multiselect';
import { WjMultiSelectHarness } from 'weeljack-ng/multiselect/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';
/** The viewport the run starts with (414 px wide). */
const VIEWPORT = { width: window.innerWidth, height: window.innerHeight };

/**
 * Parks the pointer in the viewport's bottom-right corner before a read that a hover would change.
 * The pointer is page-wide in browser mode, so an earlier test can leave it over the control or a
 * row, and Optimus moves the focused row to the one under it (`focusOnHover`).
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

type Days = WjOption<string>[];

const DAYS: Days = [
  { label: 'Monday', value: 'mon' },
  { label: 'Tuesday', value: 'tue' },
  { label: 'Wednesday', value: 'wed' },
  { label: 'Thursday', value: 'thu' },
  { label: 'Friday', value: 'fri' },
  { label: 'Saturday', value: 'sat' },
  { label: 'Sunday', value: 'sun' },
];

/** The same days with Wednesday unavailable. */
const DAYS_WITH_DISABLED: Days = DAYS.map((day) =>
  day.value === 'wed' ? { ...day, disabled: true } : day,
);

/** Enough options to scroll the panel (it scrolls past 200 px; a row is 40 px). */
const MANY: Days = Array.from({ length: 14 }, (_, index) => ({
  label: `Option ${String(index + 1)}`,
  value: `o${String(index + 1)}`,
}));

/** A consumer's template: one bare multi select, or the same one inside a field. */
@Component({
  selector: 'wj-multiselect-host',
  imports: [WjField, WjMultiSelect],
  template: `
    @if (inField()) {
      <wj-field label="Days" [hint]="hint()" [error]="error()">
        <wj-multiselect
          [value]="value()"
          (valueChange)="pick($event)"
          [options]="options()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [placeholder]="placeholder()"
        />
      </wj-field>
    } @else {
      <wj-multiselect
        ariaLabel="Days"
        [value]="value()"
        (valueChange)="pick($event)"
        [options]="options()"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
        [placeholder]="placeholder()"
      />
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string[]>([]);
  readonly options = signal<Days>(DAYS);
  readonly pt = signal<WjMultiSelectPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjMultiSelectSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>('Select days');
  /** Every value the control reported, in order. */
  readonly emitted: string[][] = [];

  pick(value: string[]): void {
    this.emitted.push(value);
    this.value.set(value);
  }
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-multiselect-aria-host',
  imports: [WjMultiSelect],
  template: `
    <wj-multiselect
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Days');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-multiselect-aria-on-host-host',
  imports: [WjMultiSelect],
  template: `<wj-multiselect aria-label="Days" />`,
})
class AriaOnHostHost {}

/** A field around a multi select with its own `inputId`, `ariaLabelledBy` and description. */
@Component({
  selector: 'wj-multiselect-own-ids-host',
  imports: [WjMultiSelect, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-multiselect ariaLabel="Plain" inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Days" hint="Hint" error="Error">
      <wj-multiselect inputId="mine" ariaLabelledBy="namer" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** Two controls inside one field: `wj-field` becomes a group, and each keeps its own id. */
@Component({
  selector: 'wj-multiselect-pair-host',
  imports: [WjMultiSelect, WjField],
  template: `
    <wj-field label="Route">
      <wj-multiselect ariaLabel="From" [options]="options" />
      <wj-multiselect ariaLabel="To" [options]="options" />
    </wj-field>
  `,
})
class PairHost {
  readonly options = DAYS;
}

/** `ngModel` inside a field, with an array written in. */
@Component({
  selector: 'wj-multiselect-ngmodel-host',
  imports: [WjField, WjMultiSelect, FormsModule],
  template: `
    <wj-field label="Days">
      <wj-multiselect [(ngModel)]="value" [options]="options" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly options = DAYS;
  readonly value = signal<string[] | null>(['tue']);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-multiselect-reactive-host',
  imports: [WjField, WjMultiSelect, ReactiveFormsModule],
  template: `
    <wj-field label="Days">
      <wj-multiselect [formControl]="control" [options]="options" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly select = viewChild.required(WjMultiSelect);
  readonly options = DAYS;
  readonly control = new FormControl<string[] | null>(['tue']);
  /** Every value the control announced, in order. */
  readonly announced: (string[] | null)[] = [];

  constructor() {
    this.control.valueChanges.subscribe((value) => {
      this.announced.push(value);
    });
  }
}

interface Rota {
  days: string[];
  bare: string[];
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-multiselect-signal-host',
  imports: [WjField, WjMultiSelect, FormField],
  template: `
    <wj-field label="Days">
      <wj-multiselect [formField]="model.days" [options]="options" />
    </wj-field>
    <wj-multiselect ariaLabel="Bare" [formField]="model.bare" [options]="options" />
  `,
})
class SignalHost {
  readonly options = DAYS;
  readonly value = signal<Rota>({ days: ['tue'], bare: [] });
  readonly model = form(this.value, (path) => {
    required(path.bare);
    minLength(path.bare, 1, { message: 'Pick one.' });
  });
}

/** The option's value is an object: `T` survives the model and the options. */
interface Plan {
  id: number;
  name: string;
}

const PLANS: WjOption<Plan>[] = [
  { label: 'Free', value: { id: 1, name: 'free' } },
  { label: 'Team', value: { id: 2, name: 'team' } },
  { label: 'Company', value: { id: 3, name: 'company' } },
];

@Component({
  selector: 'wj-multiselect-object-host',
  imports: [WjMultiSelect],
  template: `<wj-multiselect ariaLabel="Plans" [(value)]="plans" [options]="options" />`,
})
class ObjectHost {
  readonly options = PLANS;
  readonly plans = signal<Plan[]>([{ id: 2, name: 'team' }]);
}

/** Two buttons around the control and a long list, for Tab and keys. */
@Component({
  selector: 'wj-multiselect-keyboard-host',
  imports: [WjMultiSelect],
  template: `
    <button id="before">Before</button>
    <wj-multiselect ariaLabel="Days" [(value)]="value" [options]="options()" />
    <button id="after">After</button>
  `,
})
class KeyboardHost {
  readonly value = signal<string[]>([]);
  readonly options = signal<Days>(DAYS_WITH_DISABLED);
}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
}

/** The fixture currently on screen, so `afterEach` can close a list a spec left open. */
let current: Rendered<unknown> | undefined;

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
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(rootOf(element)).borderTopLeftRadius).toBe('8px');
  const rendered = { fixture, component: fixture.componentInstance, element };
  current = rendered;
  return rendered;
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

const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-multiselect', HTMLElement);
const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-multiselect', HTMLElement);
const inputOf = (element: HTMLElement): HTMLInputElement =>
  find(element, '[role="combobox"]', HTMLInputElement);
const labelOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="label"]', HTMLElement);
const listOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="listbox"]', HTMLElement);
const overlayOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="overlay"]', HTMLElement);
const scrollerOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="listcontainer"]', HTMLElement);
const toggleAllOf = (element: HTMLElement): HTMLInputElement =>
  find(element, '[data-pc-section="header"] input[type="checkbox"]', HTMLInputElement);
const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The option rows, in order (the empty message is a row too, without `aria-selected`). */
const rowsOf = (element: HTMLElement): HTMLElement[] =>
  Array.from(element.querySelectorAll<HTMLElement>('[role="option"][aria-selected]'));

function rowOf(element: HTMLElement, label: string): HTMLElement {
  const row = rowsOf(element).find((candidate) => candidate.textContent.trim() === label);
  if (row === undefined) {
    throw new Error(`no row labelled ${label}`);
  }
  return row;
}

/** The label of the row the combobox points at with `aria-activedescendant`, or `null`. */
function activeRow(element: HTMLElement): string | null {
  const id = inputOf(element).getAttribute('aria-activedescendant');
  const row = id === null ? null : element.querySelector(`[id="${id}"]`);
  return row === null ? null : row.textContent.trim();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjMultiSelectHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjMultiSelectHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjMultiSelectHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjMultiSelectHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-multiselect at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/**
 * Waits until the overlay is fully open: shown, with its enter over. Optimus keeps `p-motion`
 * hidden (`display: none`) while closed, and shows it and starts the enter in the same frame, so a
 * shown `p-motion` with no motion class left means the enter has ended.
 */
async function overlayOpen(element: HTMLElement): Promise<void> {
  const open = (): boolean => {
    const motion = element.querySelector<HTMLElement>('p-motion');
    return motion !== null && motion.style.display !== 'none' && motion.className === 'p-motion';
  };
  await expect.poll(open).toBe(true);
}

/**
 * Lets Optimus's own motion run: the spec-wide `transition: none` would also stop the overlay's
 * enter and leave from ever ending. Specs that open the list call it; the afterEach removes it too.
 */
function withMotion(): void {
  document.getElementById('wj-spec-no-motion')?.remove();
}

/** Opens the list with the harness and waits for it. The pointer is parked away first. */
async function openAt(
  fixture: ComponentFixture<unknown>,
  element: HTMLElement,
): Promise<WjMultiSelectHarness> {
  withMotion();
  await pointerAway();
  const select = await harnessOf(fixture);
  await select.open();
  await expect.poll(() => select.isOpen()).toBe(true);
  await overlayOpen(element);
  return select;
}

/**
 * Closes an open list and waits for its leave to end, so nothing is left open at teardown. An
 * Escape sent while the enter is still running is swallowed, so the enter ends first.
 */
async function closeList(select: WjMultiSelectHarness, element: HTMLElement): Promise<void> {
  if (await select.isOpen()) {
    await overlayOpen(element);
  }
  if (document.activeElement !== inputOf(element)) {
    inputOf(element).focus();
  }
  await select.close();
  await expect.poll(() => select.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
}

/** Reduces motion for this window only: Optimus's motion runner reads `window.matchMedia`. */
const realMatchMedia = window.matchMedia.bind(window);
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

/** What `--wj-text-muted-color` computes to, measured on a throwaway element. */
function mutedColor(): string {
  const probe = document.createElement('span');
  probe.style.color = 'var(--wj-text-muted-color)';
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const STATES: [string, (host: Host) => void][] = [
  ['closed with the placeholder', () => undefined],
  [
    'closed with two values',
    (host) => {
      host.value.set(['mon', 'wed']);
    },
  ],
  [
    'closed with four values (the count)',
    (host) => {
      host.value.set(['mon', 'tue', 'wed', 'thu']);
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set(['mon', 'wed']);
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.value.set(['mon']);
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.value.set(['mon']);
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Pick every day you can work.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Pick at least one day.');
    },
  ],
];

describe('WjMultiSelect', () => {
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

  afterEach(async () => {
    try {
      // A list left open would reach the next spec: close it and wait for the leave.
      if (current !== undefined) {
        const selects = await TestbedHarnessEnvironment.loader(current.fixture).getAllHarnesses(
          WjMultiSelectHarness,
        );
        for (const select of selects) {
          if (await select.isOpen()) {
            await closeList(select, current.element);
          }
        }
      }
    } finally {
      current = undefined;
      document.getElementById('wj-spec-no-motion')?.remove();
      ROOT.classList.remove('wj-dark');
      document.body.style.backgroundColor = '';
      document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
        style.remove();
      });
      Reflect.deleteProperty(window, 'wjInjected');
      await page.viewport(VIEWPORT.width, VIEWPORT.height);
    }
  });

  it('exports the component and no Optimus class', () => {
    expect(Object.keys(multiselectApi)).toEqual(['WjMultiSelect']);
  });

  describe('inputs and outputs', () => {
    it('value is two-way: a written array shows its labels in pick order, picks append, unpicks remove, each a report', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.getText()).toBe('Select days');

      component.value.set(['wed', 'mon']);
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Wednesday, Monday');
      expect(component.emitted).toEqual([]);

      await openAt(fixture, element);
      await select.toggleOption('Tuesday');
      await fixture.whenStable();
      expect(component.value()).toEqual(['wed', 'mon', 'tue']);
      expect(component.emitted).toEqual([['wed', 'mon', 'tue']]);
      await expect.poll(() => select.getText()).toBe('Wednesday, Monday, Tuesday');

      await select.toggleOption('Monday');
      await fixture.whenStable();
      expect(component.value()).toEqual(['wed', 'tue']);
      expect(component.emitted).toEqual([
        ['wed', 'mon', 'tue'],
        ['wed', 'tue'],
      ]);
      expect(await select.isOpen()).toBe(true);

      await closeList(select, element);
    });

    it('every pick, unpick and toggle-all is a new array, and the app’s own array is never changed', async () => {
      const { fixture, component, element } = await render();
      const mine = ['mon'];
      component.value.set(mine);
      await fixture.whenStable();
      const select = await openAt(fixture, element);

      await select.toggleOption('Tuesday');
      await select.toggleOption('Tuesday');
      await select.toggleAll();
      await select.toggleAll();
      await fixture.whenStable();

      expect(mine).toEqual(['mon']);
      expect(component.emitted).toHaveLength(4);
      expect(component.emitted[0]).toEqual(['mon', 'tue']);
      expect(component.emitted[1]).toEqual(['mon']);
      expect(component.emitted[2]).toEqual(DAYS.map((day) => day.value));
      expect(component.emitted[3]).toEqual([]);
      const arrays = [mine, ...component.emitted];
      expect(new Set(arrays).size).toBe(arrays.length);

      await closeList(select, element);
    });

    it('keeps the value an object when the options’ values are objects', async () => {
      const { fixture, component, element } = await renderAs(ObjectHost);
      const select = await harnessOf(fixture);
      await expect.poll(() => select.getText()).toBe('Team');

      await openAt(fixture, element);
      await select.toggleOption('Company');
      await fixture.whenStable();
      expect(component.plans()).toEqual([
        { id: 2, name: 'team' },
        { id: 3, name: 'company' },
      ]);
      expect(await select.getSelectedLabels()).toEqual(['Team', 'Company']);

      await closeList(select, element);
    });

    it('options shows the labels in order, and a new array keeps the value, the first binding included', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(['tue']);
      });
      const select = await harnessOf(fixture);
      // The value is there from the first render, not wiped when the options bind.
      await expect.poll(() => select.getText()).toBe('Tuesday');
      expect(component.value()).toEqual(['tue']);

      await openAt(fixture, element);
      expect(await select.getOptionLabels()).toEqual(DAYS.map((day) => day.label));

      component.options.set([...DAYS].reverse());
      await fixture.whenStable();
      await expect
        .poll(() => select.getOptionLabels())
        .toEqual(DAYS.map((day) => day.label).reverse());
      expect(await select.getSelectedLabels()).toEqual(['Tuesday']);
      expect(component.value()).toEqual(['tue']);
      expect(component.emitted).toEqual([]);

      await closeList(select, element);
    });

    it('keeps a value that no option has: not shown, not lost, and put back in front of the next pick', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(['zzz', 'tue']);
      });
      const select = await harnessOf(fixture);
      // Optimus alone shows the word "null" for a value it has no option for.
      await expect.poll(() => select.getText()).toBe('Tuesday');
      expect(component.value()).toEqual(['zzz', 'tue']);

      await openAt(fixture, element);
      await select.toggleOption('Monday');
      await fixture.whenStable();
      expect(component.value()).toEqual(['zzz', 'tue', 'mon']);

      await select.toggleOption('Tuesday');
      await fixture.whenStable();
      expect(component.value()).toEqual(['zzz', 'mon']);

      await select.toggleAll();
      await fixture.whenStable();
      expect(component.value()).toEqual(['zzz', ...DAYS.map((day) => day.value)]);

      await closeList(select, element);
    });

    it('shows a value again when the option for it arrives, and the placeholder while none has it', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(['sat']);
        host.options.set(DAYS.slice(0, 3));
      });
      const select = await harnessOf(fixture);
      await expect.poll(() => select.getText()).toBe('Select days');

      component.options.set(DAYS);
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Saturday');
      expect(component.value()).toEqual(['sat']);
    });

    it('disabled stops the list opening; required and invalid, inputId and placeholder reach the control', async () => {
      const { fixture, component, element } = await render((host) => {
        host.disabled.set(true);
        host.required.set(true);
        host.invalid.set(true);
      });
      const select = await harnessOf(fixture);
      expect(await select.isDisabled()).toBe(true);
      expect(await select.isRequired()).toBe(true);
      expect(await select.isInvalid()).toBe(true);

      await select.open();
      await fixture.whenStable();
      expect(await select.isOpen()).toBe(false);
      expect(element.querySelector('[role="listbox"]')).toBeNull();

      component.disabled.set(false);
      component.required.set(false);
      component.invalid.set(false);
      component.placeholder.set('Pick');
      await fixture.whenStable();
      expect(await select.isDisabled()).toBe(false);
      expect(await select.isRequired()).toBe(false);
      expect(await select.isInvalid()).toBe(false);
      expect(await select.getText()).toBe('Pick');
    });

    it('lets a form write null, which becomes an empty array and shows the placeholder', async () => {
      const { fixture, component } = await renderAs(ReactiveHost);
      const select = await harnessOf(fixture);
      await expect.poll(() => select.getText()).toBe('Tuesday');

      component.control.setValue(null);
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('');
      expect(component.select().value()).toEqual([]);
      expect(component.control.value).toBeNull();

      component.control.setValue(['mon']);
      await expect.poll(() => select.getText()).toBe('Monday');
      expect(component.select().value()).toEqual(['mon']);
    });
  });

  describe('closed text', () => {
    it.each([
      [[], 'Select days'],
      [['mon'], 'Monday'],
      [['mon', 'tue', 'wed'], 'Monday, Tuesday, Wednesday'],
      [['mon', 'tue', 'wed', 'thu'], '4 items selected'],
      [['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], '7 items selected'],
    ])('with %j picked shows "%s"', async (picked, text) => {
      const { fixture, component } = await render((host) => {
        host.value.set(picked);
      });
      const select = await harnessOf(fixture);

      await expect.poll(() => select.getText()).toBe(text);
      expect(component.emitted).toEqual([]);
    });

    it('keeps to one line and cuts a long text with an ellipsis, at the same height', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(['mon', 'tue', 'wed']);
      });
      hostOf(element).style.inlineSize = '140px';
      await fixture.whenStable();
      const label = labelOf(element);
      const style = getComputedStyle(label);

      expect(style.whiteSpace).toBe('nowrap');
      expect(style.textOverflow).toBe('ellipsis');
      expect(style.overflowX).toBe('hidden');
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(rootOf(element).getBoundingClientRect().height).toBe(44);
    });
  });

  describe('box', () => {
    it('is an inline-flex host with the Optimus root stretched to its width', async () => {
      const { element } = await render();
      hostOf(element).style.inlineSize = '320px';

      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(rootOf(element).getBoundingClientRect().width).toBe(320);
    });

    it.each<[WjMultiSelectSize | undefined, number]>([
      ['small', 36],
      [undefined, 44],
      ['large', 52],
    ])('is %s: %i px tall', async (size, height) => {
      const { element } = await render((host) => {
        host.size.set(size);
        host.value.set(['mon']);
      });

      expect(rootOf(element).getBoundingClientRect().height).toBe(height);
    });

    it.each<Scheme>(['light', 'dark'])(
      'draws the chevron in the muted text colour in the %s scheme',
      async (scheme) => {
        const { element } = await render(() => undefined, scheme);

        expect(
          getComputedStyle(find(element, '[data-pc-section="dropdown"]', HTMLElement)).color,
        ).toBe(mutedColor());
      },
    );

    it('has option rows, option checkboxes and a toggle-all checkbox of at least 24 px', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element);

      for (const row of rowsOf(element)) {
        const box = row.getBoundingClientRect();
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
      const boxes = element.querySelectorAll('[data-pc-section="box"]');
      expect(boxes).toHaveLength(DAYS.length + 1);
      for (const checkbox of boxes) {
        const box = checkbox.getBoundingClientRect();
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
      const input = toggleAllOf(element).getBoundingClientRect();
      expect(input.height).toBeGreaterThanOrEqual(24);
      expect(input.width).toBeGreaterThanOrEqual(24);

      await closeList(select, element);
    });

    it('gives a picked row no fill of its own: its checkbox carries the pick', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(['mon', 'wed']);
      });
      const select = await openAt(fixture, element);
      // Monday holds the focus fill on open; Wednesday is picked and not focused, Thursday neither.
      const picked = rowOf(element, 'Wednesday');
      const plain = rowOf(element, 'Thursday');

      expect(getComputedStyle(picked).backgroundColor).toBe(
        getComputedStyle(plain).backgroundColor,
      );
      expect(picked.classList.contains('p-multiselect-option-selected')).toBe(false);
      const box = (row: HTMLElement): HTMLElement =>
        find(row, '[data-pc-section="box"]', HTMLElement);
      expect(getComputedStyle(box(picked)).backgroundColor).not.toBe(
        getComputedStyle(box(plain)).backgroundColor,
      );

      await closeList(select, element);
    });

    it('scrolls the options past 200 px instead of growing the panel', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set(MANY);
      });
      const select = await openAt(fixture, element);
      const scroller = scrollerOf(element);

      expect(scroller.getBoundingClientRect().height).toBe(200);
      expect(scroller.scrollHeight).toBeGreaterThan(200);
      expect(getComputedStyle(scroller).overflowY).toBe('auto');

      await closeList(select, element);
    });
  });

  describe('the list', () => {
    it('has a header with the toggle-all checkbox and nothing else, above the options', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element);
      const header = find(element, '[data-pc-section="header"]', HTMLElement);

      expect(header.querySelectorAll('input')).toHaveLength(1);
      expect(header.querySelector('[role="searchbox"]')).toBeNull();
      expect(header.textContent.trim()).toBe('');
      expect(
        header.compareDocumentPosition(listOf(element)) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(listOf(element).getAttribute('aria-multiselectable')).toBe('true');

      await closeList(select, element);
    });

    it('shows the empty message under the header when there are no options', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([]);
      });
      const select = await openAt(fixture, element);
      const message = find(element, '[data-pc-section="emptymessage"]', HTMLElement);

      expect(message.textContent.trim()).toBe('No available options');
      expect(toggleAllOf(element)).toBeTruthy();
      expect(
        toggleAllOf(element).compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(await select.getOptionLabels()).toEqual([]);

      await closeList(select, element);
    });

    it('marks a disabled option aria-disabled, and clicking it picks nothing', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set(DAYS_WITH_DISABLED);
      });
      const select = await openAt(fixture, element);

      expect(await select.isOptionDisabled('Wednesday')).toBe(true);
      expect(await select.isOptionDisabled('Tuesday')).toBe(false);
      expect(rowOf(element, 'Tuesday').hasAttribute('aria-disabled')).toBe(false);

      await select.toggleOption('Wednesday');
      await fixture.whenStable();
      expect(component.value()).toEqual([]);
      expect(component.emitted).toEqual([]);

      await closeList(select, element);
    });

    it('picks every enabled option in option order with toggle-all, keeps a picked disabled one, and unpicks all', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set(DAYS_WITH_DISABLED);
        host.value.set(['fri', 'mon']);
      });
      const select = await openAt(fixture, element);

      await select.toggleAll();
      await fixture.whenStable();
      expect(component.value()).toEqual(['mon', 'tue', 'thu', 'fri', 'sat', 'sun']);

      await select.toggleAll();
      await fixture.whenStable();
      expect(component.value()).toEqual([]);

      await closeList(select, element);
    });

    it('checks toggle-all only while every option is picked, and names it from the translation', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element);
      expect(toggleAllOf(element).checked).toBe(false);
      expect(toggleAllOf(element).getAttribute('aria-label')).toBe('Select all');

      await select.toggleAll();
      await fixture.whenStable();
      await expect.poll(() => toggleAllOf(element).checked).toBe(true);
      expect(toggleAllOf(element).getAttribute('aria-label')).toBe('Select all');

      await select.toggleOption('Monday');
      await fixture.whenStable();
      await expect.poll(() => toggleAllOf(element).checked).toBe(false);
      expect(component.value()).toHaveLength(DAYS.length - 1);

      await closeList(select, element);
    });

    it('reads picked and unpicked from aria-selected and the harness', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(['tue', 'sun']);
      });
      const select = await openAt(fixture, element);

      expect(await select.getSelectedLabels()).toEqual(['Tuesday', 'Sunday']);
      expect(rowOf(element, 'Tuesday').getAttribute('aria-selected')).toBe('true');
      expect(rowOf(element, 'Monday').getAttribute('aria-selected')).toBe('false');

      await closeList(select, element);
    });
  });

  describe('the model round trip', () => {
    /** The echo write: after each pick the bridge writes the new array back into Optimus. */
    it('keeps the open panel, the focused row and the scroll position through a pick by click, by Space and by toggle-all', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set(MANY);
      });
      const select = await openAt(fixture, element);
      const panel = overlayOf(element);
      const scroller = scrollerOf(element);
      scroller.scrollTop = 160;
      await expect.poll(() => scroller.scrollTop).toBe(160);

      // A pick by click: the clicked row is the focused one, and the echo changes nothing around it.
      await select.toggleOption('Option 9');
      await fixture.whenStable();
      expect(component.value()).toEqual(['o9']);
      expect(await select.isOpen()).toBe(true);
      expect(overlayOf(element)).toBe(panel);
      expect(scroller.scrollTop).toBe(160);
      expect(activeRow(element)).toBe('Option 9');

      // A pick by Space on the focused row.
      inputOf(element).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => activeRow(element)).toBe('Option 10');
      const top = scroller.scrollTop;
      await userEvent.keyboard(' ');
      await expect.poll(() => component.value()).toEqual(['o9', 'o10']);
      expect(overlayOf(element)).toBe(panel);
      expect(activeRow(element)).toBe('Option 10');
      expect(scroller.scrollTop).toBe(top);
      expect(document.activeElement).toBe(inputOf(element));

      // Toggle-all.
      await select.toggleAll();
      await fixture.whenStable();
      expect(component.value()).toHaveLength(MANY.length);
      expect(await select.isOpen()).toBe(true);
      expect(overlayOf(element)).toBe(panel);
      expect(scroller.scrollTop).toBe(top);
      // The click gave the focus to the checkbox; the focused option is still the one it was.
      inputOf(element).focus();
      await expect.poll(() => activeRow(element)).toBe('Option 10');

      await closeList(select, element);
    });

    it('keeps the open panel and the focus when the app writes a new value while the list is open', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element);
      inputOf(element).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => activeRow(element)).toBe('Monday');
      const panel = overlayOf(element);

      component.value.set(['fri', 'sat']);
      await fixture.whenStable();

      await expect.poll(() => select.getText()).toBe('Friday, Saturday');
      expect(await select.isOpen()).toBe(true);
      expect(overlayOf(element)).toBe(panel);
      expect(activeRow(element)).toBe('Monday');
      expect(document.activeElement).toBe(inputOf(element));
      expect(await select.getSelectedLabels()).toEqual(['Friday', 'Saturday']);
      expect(component.emitted).toEqual([]);

      await closeList(select, element);
    });

    it('writes into Optimus once per change of the model, not on focus, hover, pt, size, placeholder, invalid or disabled', async () => {
      const writes = vi.spyOn(MultiSelect.prototype, 'writeValue');
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element);
      const settled = writes.mock.calls.length;

      inputOf(element).focus();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');
      await userEvent.hover(rowOf(element, 'Friday'));
      component.pt.set({ root: { 'data-root': 'x' } });
      component.size.set('large');
      component.placeholder.set('Other');
      component.invalid.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      component.disabled.set(false);
      await fixture.whenStable();
      expect(writes.mock.calls.length).toBe(settled);

      // A pick: Optimus writes its own value once, and the bridge echoes the model once.
      await select.toggleOption('Monday');
      await fixture.whenStable();
      expect(writes.mock.calls.length).toBe(settled + 2);

      await pointerAway();
      await closeList(select, element);
    });
  });

  describe('pass-through', () => {
    /** `hiddenInput` is read by Optimus's template but missing from its `pt` type. */
    const UNTYPED: Record<string, unknown> = { hiddenInput: { 'data-input': 'c' } };
    const OBJECT_PT: WjMultiSelectPt = {
      ...UNTYPED,
      root: { 'data-root': 'a' },
      labelContainer: { 'data-container': 'b' },
      label: { 'data-label': 'd' },
      dropdown: { 'data-dropdown': 'e' },
      overlay: { 'data-overlay': 'f' },
      header: { 'data-header': 'g' },
      pcHeaderCheckbox: { root: { 'data-hcb': 'h' }, input: { 'data-hcb-input': 'h2' } },
      listContainer: { 'data-scroller': 'i' },
      list: { 'data-list': 'j' },
      option: { 'data-option': 'k' },
      pcOptionCheckbox: { root: { 'data-ocb': 'l' }, box: { 'data-ocb-box': 'l2' } },
      emptyMessage: { 'data-empty': 'm' },
    };
    const NAMES = [
      'data-root',
      'data-input',
      'data-container',
      'data-label',
      'data-dropdown',
      'data-overlay',
      'data-header',
      'data-hcb',
      'data-hcb-input',
      'data-scroller',
      'data-list',
      'data-option',
      'data-ocb',
      'data-ocb-box',
      'data-empty',
    ] as const;

    /** How many elements carry each marker attribute. */
    const counts = (element: HTMLElement): Record<string, number> =>
      Object.fromEntries(NAMES.map((name) => [name, element.querySelectorAll(`[${name}]`).length]));

    const CLOSED = {
      'data-root': 1,
      'data-input': 1,
      'data-container': 1,
      'data-label': 1,
      'data-dropdown': 1,
      'data-overlay': 0,
      'data-header': 0,
      'data-hcb': 0,
      'data-hcb-input': 0,
      'data-scroller': 0,
      'data-list': 0,
      'data-option': 0,
      'data-ocb': 0,
      'data-ocb-box': 0,
      'data-empty': 0,
    };
    const OPEN = {
      ...CLOSED,
      'data-overlay': 1,
      'data-header': 1,
      'data-hcb': 1,
      'data-hcb-input': 1,
      'data-scroller': 1,
      'data-list': 1,
      'data-option': DAYS.length,
      'data-ocb': DAYS.length,
      'data-ocb-box': DAYS.length,
    };

    it('reaches every part, the child checkboxes included, and the routed attributes win', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
        host.invalid.set(true);
      });
      expect(counts(element)).toEqual(CLOSED);
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      const select = await openAt(fixture, element);
      expect(counts(element)).toEqual(OPEN);

      await closeList(select, element);
    });

    it('reaches the empty message', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
        host.options.set([]);
      });
      const select = await openAt(fixture, element);

      expect(counts(element)).toMatchObject({ 'data-empty': 1, 'data-hcb': 1, 'data-option': 0 });

      await closeList(select, element);
    });

    /** Each form of `pt`: the object, the whole function, and per-part functions. */
    const FORMS: [string, () => WjMultiSelectPt][] = [
      ['an object', () => OBJECT_PT],
      ['a function of the whole pt', () => () => OBJECT_PT],
      [
        'a function per part',
        () => ({
          ...UNTYPED,
          root: () => ({ 'data-root': 'a' }),
          labelContainer: () => ({ 'data-container': 'b' }),
          label: () => ({ 'data-label': 'd' }),
          dropdown: () => ({ 'data-dropdown': 'e' }),
          overlay: () => ({ 'data-overlay': 'f' }),
          header: () => ({ 'data-header': 'g' }),
          pcHeaderCheckbox: {
            root: () => ({ 'data-hcb': 'h' }),
            input: () => ({ 'data-hcb-input': 'h2' }),
          },
          listContainer: () => ({ 'data-scroller': 'i' }),
          list: () => ({ 'data-list': 'j' }),
          option: () => ({ 'data-option': 'k' }),
          pcOptionCheckbox: {
            root: () => ({ 'data-ocb': 'l' }),
            box: () => ({ 'data-ocb-box': 'l2' }),
          },
          emptyMessage: () => ({ 'data-empty': 'm' }),
        }),
      ],
    ];

    it.each(FORMS)(
      'lands every part with %s, after picks, toggle-all, close and reopen, and new options',
      async (_name, make) => {
        const { fixture, component, element } = await render((host) => {
          host.pt.set(make());
        });
        expect(counts(element)).toEqual(CLOSED);

        const select = await openAt(fixture, element);
        expect(counts(element)).toEqual(OPEN);

        await select.toggleOption('Tuesday');
        await fixture.whenStable();
        expect(counts(element)).toEqual(OPEN);

        await select.toggleAll();
        await fixture.whenStable();
        expect(counts(element)).toEqual(OPEN);
        await select.toggleAll();
        await fixture.whenStable();
        expect(counts(element)).toEqual(OPEN);

        await closeList(select, element);
        expect(counts(element)).toEqual(CLOSED);
        await openAt(fixture, element);
        expect(counts(element)).toEqual(OPEN);

        component.options.set([...DAYS].reverse());
        await fixture.whenStable();
        await expect.poll(() => counts(element)).toEqual(OPEN);

        await closeList(select, element);
      },
    );

    it('keeps reaching the root parts after value, disabled, invalid and pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
      });
      component.value.set(['mon']);
      component.invalid.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      expect(counts(element)).toEqual(CLOSED);
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      component.disabled.set(false);
      component.pt.set({
        root: { 'data-root': 'changed' },
        pcOptionCheckbox: { root: { 'data-ocb': 'changed' } },
      });
      await fixture.whenStable();
      expect(rootOf(element).getAttribute('data-root')).toBe('changed');

      const select = await openAt(fixture, element);
      expect(
        Array.from(element.querySelectorAll('[data-ocb]')).every(
          (box) => box.getAttribute('data-ocb') === 'changed',
        ),
      ).toBe(true);
      expect(element.querySelectorAll('[data-ocb]')).toHaveLength(DAYS.length);

      await closeList(select, element);
    });

    it('calls a function-form pt once with the root, not once per part', async () => {
      const whole = vi.fn((context: unknown) => ({
        root: { 'data-root': 'fn' },
        // The function gets the root's instance, as Optimus gives it.
        label: {
          'data-label': Reflect.get(Object(context), 'instance') === undefined ? 'none' : 'fn',
        },
        pcOptionCheckbox: { root: { 'data-ocb': 'fn' } },
      }));
      const { fixture, element } = await render((host) => {
        host.pt.set(whole);
      });
      expect(rootOf(element).getAttribute('data-root')).toBe('fn');
      expect(labelOf(element).getAttribute('data-label')).toBe('fn');

      const select = await openAt(fixture, element);
      expect(element.querySelectorAll('[data-ocb]')).toHaveLength(DAYS.length);
      const calls = whole.mock.calls as unknown[][];
      const before = calls.length;
      await select.toggleOption('Monday');
      await fixture.whenStable();
      expect(calls.length).toBe(before);

      await closeList(select, element);
    });

    it('keeps a string pt as a class list, on the parts the wrapper also routes into', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ ...UNTYPED, option: 'consumer-row', listContainer: 'consumer-scroller' });
        host.options.set(DAYS_WITH_DISABLED);
        host.invalid.set(true);
      });
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      const select = await openAt(fixture, element);
      expect(rowOf(element, 'Monday').classList.contains('consumer-row')).toBe(true);
      expect(rowOf(element, 'Wednesday').getAttribute('aria-disabled')).toBe('true');
      expect(scrollerOf(element).classList.contains('consumer-scroller')).toBe(true);

      await closeList(select, element);
    });

    it('keeps a consumer attribute on an option, and the routed ones win over the same names, clearing included', async () => {
      const { fixture, element } = await render((host) => {
        const hidden: Record<string, unknown> = {
          hiddenInput: { 'aria-invalid': 'false', 'data-input': 'c' },
        };
        host.pt.set({
          ...hidden,
          option: { 'data-option': 'mine', 'aria-disabled': 'false' },
        });
        host.options.set(DAYS_WITH_DISABLED);
        host.invalid.set(true);
      });
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(inputOf(element).getAttribute('data-input')).toBe('c');

      const select = await openAt(fixture, element);
      expect(rowOf(element, 'Monday').getAttribute('data-option')).toBe('mine');
      expect(rowOf(element, 'Wednesday').getAttribute('aria-disabled')).toBe('true');
      expect(rowOf(element, 'Monday').hasAttribute('aria-disabled')).toBe(false);

      await closeList(select, element);
    });
  });

  describe('forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the array in, and the picked array out', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const select = await harnessOf(fixture);
        await expect.poll(() => select.getText()).toBe('Tuesday');

        await openAt(fixture, element);
        await select.toggleOption('Friday');
        await fixture.whenStable();
        expect(component.value()).toEqual(['tue', 'fri']);

        component.value.set(['sun']);
        await fixture.whenStable();
        await fixture.whenStable();
        await expect.poll(() => select.getText()).toBe('Sunday');

        component.value.set(null);
        await fixture.whenStable();
        await fixture.whenStable();
        await expect.poll(() => select.getText()).toBe('');
        await closeList(select, element);
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const select = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await select.focus();
        expect(component.model().touched).toBe(false);
        await select.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await select.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value with no change announced, then writes in and out', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        await expect.poll(() => select.getText()).toBe('Tuesday');
        await fixture.whenStable();
        expect(component.control.value).toEqual(['tue']);
        expect(component.announced).toEqual([]);
        expect(component.control.dirty).toBe(false);

        await openAt(fixture, element);
        await select.toggleOption('Thursday');
        expect(component.control.value).toEqual(['tue', 'thu']);
        expect(component.control.dirty).toBe(true);
        expect(component.announced).toEqual([['tue', 'thu']]);

        component.control.setValue(['sat']);
        await expect.poll(() => select.getText()).toBe('Saturday');
        expect(component.control.dirty).toBe(true);
        await closeList(select, element);
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await select.focus();
        await select.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await select.isDisabled()).toBe(true);

        component.control.enable();
        expect(await select.isDisabled()).toBe(false);
      });
    });

    describe('[formField]', () => {
      it('writes the array in, and the picked array out', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const days = (await allHarnessesOf(fixture))(0);
        await expect.poll(() => days.getText()).toBe('Tuesday');

        await openAt(fixture, element);
        await days.toggleOption('Monday');
        await fixture.whenStable();
        expect(component.value().days).toEqual(['tue', 'mon']);

        component.model.days().value.set(['sun']);
        await fixture.whenStable();
        await expect.poll(() => days.getText()).toBe('Sunday');
        await closeList(days, element);
      });

      it('marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const days = (await allHarnessesOf(fixture))(0);
        expect(component.model.days().touched()).toBe(false);

        await days.focus();
        await days.blur();

        expect(component.model.days().touched()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const all = await allHarnessesOf(fixture);
        const bare = all(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        withMotion();
        await pointerAway();
        await bare.toggleOption('Monday');
        await fixture.whenStable();
        expect(component.value().bare).toEqual(['mon']);
        expect(await bare.isInvalid()).toBe(false);
        await closeList(bare, element);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element);

      await select.toggleOption('Sunday');
      expect(component.value()).toEqual(['sun']);

      await select.focus();
      await select.blur();
      expect(await select.isFocused()).toBe(false);
      await closeList(select, element);
    });
  });

  describe('touched', () => {
    it('is reported when focus leaves the control, not while it is only focused', async () => {
      const { fixture } = await renderAs(ReactiveHost);
      const select = await harnessOf(fixture);
      const host = fixture.componentInstance;

      await select.focus();
      expect(host.control.touched).toBe(false);
      await select.blur();
      expect(host.control.touched).toBe(true);
    });

    it('Gap: a click on an option moves focus off the combobox, so the control is touched while its list is still open', async () => {
      const { fixture, element, component } = await renderAs(ReactiveHost);
      const select = await openAt(fixture, element);
      inputOf(element).focus();
      expect(component.control.touched).toBe(false);

      await userEvent.click(rowOf(element, 'Friday'));

      await expect.poll(() => component.control.touched).toBe(true);
      expect(await select.isOpen()).toBe(true);
      expect(document.activeElement).not.toBe(inputOf(element));
      inputOf(element).focus();
      await closeList(select, element);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id and is named by the field label through <label for>', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const select = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLLabelElement);

      expect(await select.getId()).toMatch(/^wj-multiselect-\d+$/);
      expect(label.htmlFor).toBe(await select.getId());
      expect(inputOf(element).labels).toHaveLength(1);
      expect((await select.getAriaAttributes()).labelledBy).toBeNull();
      expect(await field.getLabel()).toBe('Days');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('moves focus to the combobox when the field label is clicked, and opens nothing', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const select = await harnessOf(fixture);
      expect(await select.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await select.isFocused()).toBe(true);
      expect(await select.isOpen()).toBe(false);
    });

    it('fills the width of the field', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(hostOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
      expect(rootOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
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

    it('registers two controls as a group, each with its own generated id', async () => {
      const { fixture } = await renderAs(PairHost);
      const all = await allHarnessesOf(fixture);
      const field = await fieldOf(fixture);

      expect(await field.isGroup()).toBe(true);
      expect(await all(0).getId()).toMatch(/^wj-multiselect-\d+$/);
      expect(await all(1).getId()).toMatch(/^wj-multiselect-\d+$/);
      expect(await all(0).getId()).not.toBe(await all(1).getId());
    });

    it('describes the combobox with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const select = await harnessOf(fixture);
      expect((await select.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await select.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await select.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const select = await harnessOf(fixture);
      expect(await select.isInvalid()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Pick at least one day.');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(false);
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id, no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const select = await harnessOf(fixture);
      const aria = await select.getAriaAttributes();

      expect(await select.getId()).toBe('');
      expect(aria.labelledBy).toBeNull();
      expect(aria.describedBy).toBeNull();
      expect(aria.label).toBe('Days');
    });

    it('keeps the consumer’s inputId and ariaDescribedBy', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId, ariaLabel, ariaLabelledBy and ariaDescribedBy on the combobox', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const select = await harnessOf(fixture);

      expect(await select.getId()).toBe('mine');
      expect(await select.getAriaAttributes()).toEqual({
        label: 'Days',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('marks the combobox as opening a listbox, expanded only while the list is open', async () => {
      const { fixture, element } = await render();
      const input = inputOf(element);
      expect(input.getAttribute('aria-haspopup')).toBe('listbox');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.hasAttribute('aria-controls')).toBe(false);

      const select = await openAt(fixture, element);
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(element.querySelector(`[id="${input.getAttribute('aria-controls') ?? ''}"]`)).toBe(
        overlayOf(element),
      );

      await closeList(select, element);
    });

    it('gives the listbox its name and multiselectable state, and every option its set size, position and state', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(['tue']);
      });
      const select = await openAt(fixture, element);

      expect(listOf(element).getAttribute('aria-label')).toBe('Option List');
      expect(listOf(element).getAttribute('aria-multiselectable')).toBe('true');
      const thursday = rowOf(element, 'Thursday');
      expect(thursday.getAttribute('aria-setsize')).toBe('7');
      expect(thursday.getAttribute('aria-posinset')).toBe('4');
      expect(rowOf(element, 'Tuesday').getAttribute('aria-selected')).toBe('true');
      expect(rowOf(element, 'Tuesday').getAttribute('aria-checked')).toBe('true');

      await closeList(select, element);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-multiselect: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-multiselect: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('translation', () => {
    it('reads the empty message, the count, the list name and the toggle-all names from the translation, in English by default', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(['mon', 'tue', 'wed', 'thu']);
      });
      const select = await openAt(fixture, element);

      expect(await select.getText()).toBe('4 items selected');
      expect(listOf(element).getAttribute('aria-label')).toBe('Option List');
      expect(toggleAllOf(element).getAttribute('aria-label')).toBe('Select all');

      component.options.set([]);
      await fixture.whenStable();
      await expect
        .poll(() => element.querySelector('[data-pc-section="emptymessage"]')?.textContent.trim())
        .toBe('No available options');

      await closeList(select, element);
    });

    it('takes every one of them from a locale, so none is an Optimus string', async () => {
      const { fixture, component, element } = await renderAs(Host, () => undefined, 'light', {
        translation: viLocale,
      });
      component.value.set(['mon', 'tue', 'wed', 'thu']);
      await fixture.whenStable();
      const select = await openAt(fixture, element);

      expect(await select.getText()).toBe('Đã chọn 4 mục');
      expect(listOf(element).getAttribute('aria-label')).toBe(viLocale.aria?.listLabel);
      expect(toggleAllOf(element).getAttribute('aria-label')).toBe(viLocale.aria?.unselectAll);

      await select.toggleAll();
      await fixture.whenStable();
      await expect
        .poll(() => toggleAllOf(element).getAttribute('aria-label'))
        .toBe(viLocale.aria?.selectAll);

      component.options.set([]);
      await fixture.whenStable();
      await expect
        .poll(() => element.querySelector('[data-pc-section="emptymessage"]')?.textContent.trim())
        .toBe(viLocale.emptyMessage);

      await closeList(select, element);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload on the ARIA inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const select = await harnessOf(fixture);

      expect(await select.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await select.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on the placeholder as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.placeholder.set(PAYLOAD);
      });
      const select = await harnessOf(fixture);

      expect(await select.getText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload on an option label as text only, in the list and in the shown text', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set([
          { label: `1 ${PAYLOAD}`, value: 'a' },
          { label: `2 ${PAYLOAD}`, value: 'b' },
        ]);
      });
      const select = await openAt(fixture, element);

      expect(await select.getOptionLabels()).toEqual([`1 ${PAYLOAD}`, `2 ${PAYLOAD}`]);
      expect(element.querySelector('img')).toBeNull();

      await select.toggleOption(`2 ${PAYLOAD}`);
      await fixture.whenStable();
      expect(component.value()).toEqual(['b']);
      await expect.poll(() => select.getText()).toBe(`2 ${PAYLOAD}`);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      await closeList(select, element);
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the text it shows', async () => {
      const { fixture } = await render((host) => {
        host.value.set(['mon', 'wed']);
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const withText = async (text: string): Promise<number> =>
        (await loader.getAllHarnesses(WjMultiSelectHarness.with({ text }))).length;

      await expect.poll(() => withText('Monday, Wednesday')).toBe(1);
      expect(await withText('Sunday')).toBe(0);
      expect(
        await loader.getAllHarnesses(WjMultiSelectHarness.with({ ariaLabel: /^Da/ })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjMultiSelectHarness.with({ ariaLabel: 'Other' })),
      ).toHaveLength(0);
    });

    it('opens, reads the options, toggles by label and with toggle-all, reads the picks, and closes', async () => {
      withMotion();
      await pointerAway();
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.isOpen()).toBe(false);
      expect(await select.getOptionLabels()).toEqual([]);

      await select.open();
      await expect.poll(() => select.isOpen()).toBe(true);
      await overlayOpen(element);
      expect(await select.getOptionLabels()).toEqual(DAYS.map((day) => day.label));

      await select.toggleOption('Friday');
      await select.toggleOption('Monday');
      await fixture.whenStable();
      expect(component.value()).toEqual(['fri', 'mon']);
      expect(await select.getSelectedLabels()).toEqual(['Monday', 'Friday']);
      expect(await select.getText()).toBe('Friday, Monday');

      await select.toggleAll();
      await fixture.whenStable();
      expect(await select.getSelectedLabels()).toHaveLength(DAYS.length);

      await closeList(select, element);
    });

    it('opens the list itself to pick, and refuses an unknown label', async () => {
      withMotion();
      await pointerAway();
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);

      await select.toggleOption('Monday');
      await expect.poll(() => select.isOpen()).toBe(true);
      await overlayOpen(element);
      await expect(select.toggleOption('Nowhere')).rejects.toThrow('no option labelled');
      await expect(select.isOptionDisabled('Nowhere')).rejects.toThrow('no option labelled');

      await closeList(select, element);
    });

    it('reads the state: disabled, required, invalid, the id and the focus', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.required.set(true);
        host.error.set('Error');
      });
      const select = await harnessOf(fixture);

      expect(await select.isRequired()).toBe(true);
      expect(await select.isInvalid()).toBe(true);
      expect(await select.getId()).toMatch(/^wj-multiselect-\d+$/);
      expect(await select.isFocused()).toBe(false);

      await select.focus();
      expect(await select.isFocused()).toBe(true);
      await select.blur();
      expect(await select.isFocused()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await select.isDisabled()).toBe(true);
    });

    it('reads an empty string for the text when there is neither a pick nor a placeholder', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set(undefined);
      });
      const select = await harnessOf(fixture);

      expect(await select.getText()).toBe('');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
      });

      it('has no axe violations open with a focused option', async () => {
        const { fixture, element } = await render(() => undefined, scheme);
        const select = await openAt(fixture, element);
        inputOf(element).focus();
        await userEvent.keyboard('{ArrowDown}');
        await expect.poll(() => activeRow(element)).toBe('Monday');

        await expectNoAxeViolations(hostOf(element));
        await closeList(select, element);
      });

      it('has no axe violations open with picks made, all picked, and a disabled option', async () => {
        const { fixture, element } = await render((host) => {
          host.options.set(DAYS_WITH_DISABLED);
          host.value.set(['mon', 'sun']);
        }, scheme);
        const select = await openAt(fixture, element);
        await expectNoAxeViolations(hostOf(element));

        await select.toggleAll();
        await fixture.whenStable();
        await expectNoAxeViolations(hostOf(element));
        await closeList(select, element);
      });

      it('has no axe violations open with no options', async () => {
        const { fixture, element } = await render((host) => {
          host.options.set([]);
        }, scheme);
        const select = await openAt(fixture, element);

        await expectNoAxeViolations(hostOf(element));
        await closeList(select, element);
      });

      it('has no axe violations open in a field, with an error', async () => {
        const { fixture, element } = await render((host) => {
          host.inField.set(true);
          host.error.set('Pick at least one day.');
        }, scheme);
        const select = await openAt(fixture, element);

        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
        await closeList(select, element);
      });
    });
  });

  describe('motion', () => {
    it('opens with a motion by default, and without one under reduced motion', async () => {
      const motions = async (reduce: boolean): Promise<number> => {
        reduceMotion(reduce);
        const { fixture, element } = await render();
        // Count what starts on the overlay itself: the enter. A colour transition on the control
        // would pass the default case for the wrong reason.
        let started = 0;
        const count = (event: Event): void => {
          if (event.target instanceof Element && event.target.closest('p-motion') !== null) {
            started += 1;
          }
        };
        document.addEventListener('animationstart', count, true);
        document.addEventListener('transitionrun', count, true);
        try {
          await openAt(fixture, element);
        } finally {
          document.removeEventListener('animationstart', count, true);
          document.removeEventListener('transitionrun', count, true);
        }
        const select = await harnessOf(fixture);
        await closeList(select, element);
        current = undefined;
        TestBed.resetTestingModule();
        return started;
      };

      expect(await motions(false)).toBeGreaterThan(0);
      expect(await motions(true)).toBe(0);
    });
  });

  describe('keyboard', () => {
    beforeEach(async () => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for. The pointer is parked
      // away, because Optimus moves the focused row to the one under it (`focusOnHover`).
      withMotion();
      await pointerAway();
    });

    /** Renders the keyboard host and focuses the control by Tab from the button before it. */
    async function focusFirst(
      setup: (host: KeyboardHost) => void = () => undefined,
    ): Promise<Rendered<KeyboardHost> & { select: WjMultiSelectHarness }> {
      const rendered = await renderAs(KeyboardHost, setup);
      const select = await harnessOf(rendered.fixture);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      expect(await select.isFocused()).toBe(true);
      return { ...rendered, select };
    }

    type Keyed = Rendered<KeyboardHost> & { select: WjMultiSelectHarness };

    /** Sends one key and waits for the row the combobox points at to be `expected`. */
    async function press(keyed: Keyed, key: string, expected: string | null): Promise<void> {
      await userEvent.keyboard(key);
      await expect.poll(() => activeRow(keyed.element)).toBe(expected);
    }

    /** Opens with ArrowDown and waits for the list: the first row is focused, nothing picked. */
    async function openByKey(keyed: Keyed): Promise<void> {
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
    }

    /** The element holding focus, as a short name. */
    function focused(): string {
      const active = document.activeElement;
      if (active === null || active === document.body) {
        return 'body';
      }
      return (
        active.getAttribute('role') ??
        (active instanceof HTMLInputElement
          ? active.type
          : (active.getAttribute('data-pc-section') ?? ''))
      );
    }

    it('Tab goes to the combobox, and on to the next control, and Shift+Tab comes back', async () => {
      const { element, select } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await select.isFocused()).toBe(true);
    });

    it('skips a disabled control', async () => {
      const rendered = await renderAs(Host, (host) => {
        host.disabled.set(true);
      });
      const select = await harnessOf(rendered.fixture);

      await userEvent.tab();

      expect(await select.isFocused()).toBe(false);
    });

    it('Down opens the list and focuses the first row, then moves down, skipping a disabled option', async () => {
      const keyed = await focusFirst();
      expect(await keyed.select.isOpen()).toBe(false);

      await openByKey(keyed);
      await expect.poll(() => activeRow(keyed.element)).toBe('Monday');
      await press(keyed, '{ArrowDown}', 'Tuesday');
      await press(keyed, '{ArrowDown}', 'Thursday');
      expect(keyed.component.value()).toEqual([]);

      await closeList(keyed.select, keyed.element);
    });

    it('Up opens the list on the last row, and moves up', async () => {
      const keyed = await focusFirst();

      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      await expect.poll(() => activeRow(keyed.element)).toBe('Sunday');
      await press(keyed, '{ArrowUp}', 'Saturday');

      await closeList(keyed.select, keyed.element);
    });

    it('Home and End go to the first and the last option, and the list stays open', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await press(keyed, '{End}', 'Sunday');
      await press(keyed, '{Home}', 'Monday');
      expect(await keyed.select.isOpen()).toBe(true);

      await closeList(keyed.select, keyed.element);
    });

    it('Space and Enter toggle the focused option, each a report, and the list stays open', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Tuesday');

      await userEvent.keyboard(' ');
      await expect.poll(() => keyed.component.value()).toEqual(['tue']);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => keyed.component.value()).toEqual([]);
      await press(keyed, '{ArrowDown}', 'Thursday');
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => keyed.component.value()).toEqual(['thu']);

      expect(await keyed.select.isOpen()).toBe(true);
      expect(await keyed.select.isFocused()).toBe(true);
      await closeList(keyed.select, keyed.element);
    });

    it('Space and Enter open a closed list', async () => {
      const keyed = await focusFirst();

      await userEvent.keyboard(' ');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      await closeList(keyed.select, keyed.element);

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      await closeList(keyed.select, keyed.element);
    });

    it('Escape closes the list and focus stays on the combobox', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => keyed.select.isOpen()).toBe(false);
      expect(await keyed.select.isFocused()).toBe(true);
      await expect.poll(() => keyed.element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('typing a letter opens the list and focuses the first option that starts with it, picking nothing', async () => {
      const keyed = await focusFirst();

      await userEvent.keyboard('f');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      await expect.poll(() => activeRow(keyed.element)).toBe('Friday');
      expect(keyed.component.value()).toEqual([]);

      await closeList(keyed.select, keyed.element);
    });

    it('Ctrl+A picks every enabled option', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await userEvent.keyboard('{Control>}a{/Control}');

      await expect
        .poll(() => keyed.component.value())
        .toEqual(['mon', 'tue', 'thu', 'fri', 'sat', 'sun']);
      await closeList(keyed.select, keyed.element);
    });

    it('PageDown and PageUp scroll the list to its end and its start, and move no focus', async () => {
      const keyed = await focusFirst((host) => {
        host.options.set(MANY);
      });
      await openByKey(keyed);
      const scroller = scrollerOf(keyed.element);

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => scroller.scrollTop).toBeGreaterThan(0);
      await userEvent.keyboard('{PageUp}');
      // The first option is back in view (the list has 4 px of padding above it).
      await expect.poll(() => scroller.scrollTop).toBeLessThanOrEqual(4);
      expect(activeRow(keyed.element)).toBe('Option 1');

      await closeList(keyed.select, keyed.element);
    });

    it('Tab from an open list goes through the toggle-all checkbox and the options box and back to the combobox: focus is never lost', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      const path: string[] = [];
      for (let step = 0; step < 4; step++) {
        await userEvent.tab();
        path.push(focused());
      }
      expect(path).toEqual(['checkbox', 'listcontainer', 'combobox', 'checkbox']);

      const back: string[] = [];
      for (let step = 0; step < 3; step++) {
        await userEvent.tab({ shift: true });
        back.push(focused());
      }
      expect(back).toHaveLength(3);
      for (const stop of back) {
        expect(['checkbox', 'listcontainer', 'combobox']).toContain(stop);
      }

      await closeList(keyed.select, keyed.element);
    });

    it('Space on the toggle-all checkbox picks every enabled option, and again unpicks them', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await userEvent.tab();
      expect(document.activeElement).toBe(toggleAllOf(keyed.element));

      await userEvent.keyboard(' ');
      await expect
        .poll(() => keyed.component.value())
        .toEqual(['mon', 'tue', 'thu', 'fri', 'sat', 'sun']);
      expect(await keyed.select.isOpen()).toBe(true);

      await userEvent.keyboard(' ');
      await expect.poll(() => keyed.component.value()).toEqual([]);

      // On to the options box, then back round to the combobox.
      await userEvent.tab();
      await userEvent.tab();
      expect(await keyed.select.isFocused()).toBe(true);
      await closeList(keyed.select, keyed.element);
    });

    it('Escape closes the list while the toggle-all checkbox holds the focus', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await userEvent.tab();
      expect(document.activeElement).toBe(toggleAllOf(keyed.element));

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => keyed.select.isOpen()).toBe(false);
      await expect.poll(() => keyed.element.querySelector('[role="listbox"]')).toBeNull();
    });
  });
});
