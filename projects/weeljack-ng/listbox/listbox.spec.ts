/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import { FilterService, OverlayService } from '@openng/optimus-ui/api';
import { Listbox } from '@openng/optimus-ui/listbox';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import * as listboxApi from 'weeljack-ng/listbox';
import { WjListbox, type WjListboxPt } from 'weeljack-ng/listbox';
import { WjListboxHarness } from 'weeljack-ng/listbox/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/**
 * Parks the pointer in the viewport's bottom-right corner before a colour read. The pointer is
 * page-wide in browser mode, so an earlier test can leave it over a row, and Optimus's hover fill
 * outranks the other fills (and `focusOnHover` moves the focused row). The host renders only the
 * list, so a throwaway fixed target stands in for a neutral element; the pointer stays there after
 * it is removed.
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

/** Five fruits; the third is disabled, so keyboard navigation has something to skip. */
const FRUIT: WjOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
];

/** Forty numbered options: enough to make the list scroll inside its 14rem. */
const LONG: WjOption<number>[] = Array.from({ length: 40 }, (_, index) => ({
  label: `Option ${String(index + 1)}`,
  value: index + 1,
}));

/** Twenty-five numbered options; the fifth is disabled, so a ten-option step has one to skip. */
const PAGED: WjOption<number>[] = Array.from({ length: 25 }, (_, index) => ({
  label: `Option ${String(index + 1)}`,
  value: index + 1,
  disabled: index === 4,
}));

/** A consumer's template: one bare list, or the same list inside a field. */
@Component({
  selector: 'wj-listbox-host',
  imports: [WjField, WjListbox],
  template: `
    @if (inField()) {
      <wj-field label="Fruit" [hint]="hint()" [error]="error()">
        <wj-listbox
          [(value)]="value"
          [options]="options()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
        />
      </wj-field>
    } @else {
      <wj-listbox
        ariaLabel="Fruit"
        [(value)]="value"
        [options]="options()"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
      />
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string | null>(null);
  readonly options = signal<WjOption<string>[]>(FRUIT);
  readonly pt = signal<WjListboxPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
}

/** The ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-listbox-aria-host',
  imports: [WjListbox],
  template: `
    <wj-listbox
      [options]="options"
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly options = FRUIT;
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Fruit');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-listbox-aria-on-host-host',
  imports: [WjListbox],
  template: `<wj-listbox aria-label="Fruit" [options]="options" />`,
})
class AriaOnHostHost {
  readonly options = FRUIT;
}

/** A field around a list with its own `inputId`, `ariaLabelledBy` and description. */
@Component({
  selector: 'wj-listbox-own-ids-host',
  imports: [WjListbox, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-listbox ariaLabel="Plain" inputId="plain" ariaDescribedBy="note" [options]="options" />
    <wj-field label="Fruit" hint="Hint" error="Error">
      <wj-listbox
        inputId="mine"
        ariaLabelledBy="namer"
        ariaDescribedBy="note"
        [options]="options"
      />
    </wj-field>
  `,
})
class OwnIdsHost {
  readonly options = FRUIT;
}

/** `ngModel` inside a field, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-listbox-ngmodel-host',
  imports: [WjField, WjListbox, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Fruit">
      <wj-listbox [(ngModel)]="value" [options]="options" [disabled]="disabled()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly options = FRUIT;
  readonly value = signal<string | null>('banana');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-listbox-reactive-host',
  imports: [WjField, WjListbox, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Fruit">
      <wj-listbox [formControl]="control" [options]="options" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class ReactiveHost {
  readonly options = FRUIT;
  readonly control = new FormControl<string | null>('banana');
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-listbox-signal-host',
  imports: [WjField, WjListbox, FormField],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Fruit">
      <wj-listbox [formField]="model.fruit" [options]="options" />
    </wj-field>
    <wj-listbox ariaLabel="Bare" [formField]="model.bare" [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class SignalHost {
  readonly options = FRUIT;
  readonly off = signal(false);
  readonly value = signal<{ fruit: string | null; bare: string | null }>({
    fruit: 'banana',
    bare: null,
  });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Pick one.' });
    disabledRule(path.fruit, { when: () => this.off() });
  });
}

/** The option's value is an object: `T` survives model and options, and equality is deep. */
interface Plan {
  id: number;
  name: string;
}

@Component({
  selector: 'wj-listbox-object-host',
  imports: [WjListbox],
  template: `<wj-listbox ariaLabel="Plan" [(value)]="plan" [options]="options" />`,
})
class ObjectHost {
  readonly options: WjOption<Plan>[] = [
    { label: 'Free', value: { id: 1, name: 'free' } },
    { label: 'Team', value: { id: 2, name: 'team' } },
  ];
  readonly plan = signal<Plan | null>({ id: 2, name: 'team' });
}

/** The two-way model and the native events a consumer listens to on the host. */
@Component({
  selector: 'wj-listbox-events-host',
  imports: [WjListbox],
  template: `
    <wj-listbox
      ariaLabel="Fruit"
      [value]="value()"
      [options]="options"
      (valueChange)="value.set($event); note('valueChange')"
      (focusin)="note('focusin')"
      (focusout)="note('focusout')"
      (click)="note('click')"
      (dblclick)="note('dblclick')"
    />
  `,
})
class EventsHost {
  readonly options = FRUIT;
  readonly value = signal<string | null>(null);
  readonly log: string[] = [];
  note(name: string): void {
    this.log.push(name);
  }
}

/** Two lists and two buttons for the keyboard specs; the second list is disabled. */
@Component({
  selector: 'wj-listbox-keyboard-host',
  imports: [WjListbox],
  template: `
    <button type="button" id="before">Before</button>
    <wj-listbox ariaLabel="Fruit" [(value)]="value" [options]="options" />
    <wj-listbox ariaLabel="Disabled" disabled [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly options = FRUIT;
  readonly value = signal<string | null>(null);
}

/** A list with no option, between two buttons: only Optimus's empty message and its entry. */
@Component({
  selector: 'wj-listbox-empty-keyboard-host',
  imports: [WjListbox],
  template: `
    <button type="button" id="before">Before</button>
    <wj-listbox ariaLabel="Empty" [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class EmptyKeyboardHost {
  readonly options: WjOption<string>[] = [];
}

/** A long list between two buttons, which can be disabled: it scrolls inside its box. */
@Component({
  selector: 'wj-listbox-long-host',
  imports: [WjListbox],
  template: `
    <button type="button" id="before">Before</button>
    <wj-listbox ariaLabel="Number" [(value)]="value" [options]="options" [disabled]="disabled()" />
    <button type="button" id="after">After</button>
  `,
})
class LongHost {
  readonly options = LONG;
  readonly value = signal<number | null>(null);
  readonly disabled = signal(false);
}

/** A long list with one disabled option, for PageDown and PageUp. */
@Component({
  selector: 'wj-listbox-paged-host',
  imports: [WjListbox],
  template: `
    <button type="button" id="before">Before</button>
    <wj-listbox ariaLabel="Number" [(value)]="value" [options]="options" />
  `,
})
class PagedHost {
  readonly options = PAGED;
  readonly value = signal<number | null>(null);
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
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(rootOf(element)).borderTopLeftRadius).toBe('8px');
  return { fixture, component: fixture.componentInstance, element };
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

const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-listbox', HTMLElement);

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-listbox', HTMLElement);

const listOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="listbox"]', HTMLElement);

/** The scrolling box around the list. */
const containerOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="listcontainer"]', HTMLElement);

/** The hidden element in front of the list: where the resolved id goes, and Optimus's entry. */
const entryOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="hiddenfirstfocusableelement"]', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const rowOf = (element: HTMLElement, label: string): HTMLElement =>
  find(element, `[role="option"][aria-label="${label}"]`, HTMLElement);

const rowsOf = (element: HTMLElement): HTMLElement[] => [
  ...element.querySelectorAll<HTMLElement>('[role="option"]'),
];

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjListboxHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjListboxHarness);

/** The lists of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjListboxHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjListboxHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-listbox at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/** The label of the option the list points at with `aria-activedescendant`, or `null`. */
function activeLabel(element: HTMLElement): string | null {
  const id = listOf(element).getAttribute('aria-activedescendant');
  return id === null
    ? null
    : (element.querySelector(`[id="${id}"]`)?.getAttribute('aria-label') ?? null);
}

/** A colour token resolved to the `rgb(…)` string a computed style reports in this scheme. */
function resolved(property: 'color' | 'backgroundColor', token: string): string {
  const probe = document.createElement('span');
  probe.style[property] = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe)[property];
  probe.remove();
  return value;
}

/** Focuses the button `id` and Tabs once, the way a keyboard user arrives. */
async function tabFrom(element: HTMLElement, id: string): Promise<void> {
  byId(element, id).focus();
  await userEvent.tab();
}

/** Every routed attribute of an in-field list, as the field and the wrapper put it there. */
function expectRouted(element: HTMLElement, disabled = false): void {
  const list = listOf(element);
  const label = find(element, '.wj-field-label', HTMLElement);
  expect(list.getAttribute('aria-labelledby')).toBe(label.id);
  expect(list.getAttribute('aria-describedby')).toMatch(/^wj-field-hint-\d+ wj-field-error-\d+$/);
  expect(list.getAttribute('aria-invalid')).toBe('true');
  expect(list.getAttribute('aria-multiselectable')).toBe('false');
  expect(containerOf(element).getAttribute('tabindex')).toBe('-1');
  if (disabled) {
    expect(entryOf(element).hasAttribute('id')).toBe(false);
  } else {
    expect(entryOf(element).getAttribute('id')).toMatch(/^wj-listbox-\d+$/);
  }
}

const STATES: [string, (host: Host) => void][] = [
  ['nothing picked', () => undefined],
  [
    'one picked',
    (host) => {
      host.value.set('banana');
    },
  ],
  [
    'with a disabled option',
    (host) => {
      host.value.set('date');
    },
  ],
  [
    'required',
    (host) => {
      host.required.set(true);
    },
  ],
  [
    'empty',
    (host) => {
      host.options.set([]);
    },
  ],
  [
    'scrolling',
    (host) => {
      host.options.set(LONG.map((option) => ({ ...option, value: String(option.value) })));
      host.value.set('3');
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set('banana');
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
    'disabled and invalid',
    (host) => {
      host.value.set('banana');
      host.disabled.set(true);
      host.invalid.set(true);
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Choose the one you like best.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Pick a fruit.');
    },
  ],
];

describe('WjListbox', () => {
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
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('value is two-way: the list follows it, and picking writes it back', async () => {
      const { fixture, component } = await render();
      const list = await harnessOf(fixture);
      expect(await list.getSelectedLabel()).toBeNull();

      component.value.set('banana');
      await fixture.whenStable();
      expect(await list.getSelectedLabel()).toBe('Banana');

      await list.selectOption('Elderberry');
      await fixture.whenStable();
      expect(component.value()).toBe('elderberry');
      expect(await list.getSelectedLabel()).toBe('Elderberry');

      component.value.set(null);
      await fixture.whenStable();
      expect(await list.getSelectedLabel()).toBeNull();
    });

    it('options lists the labels in order and follows the bound list', async () => {
      const { fixture, component } = await render();
      const list = await harnessOf(fixture);
      expect(await list.getOptionLabels()).toEqual([
        'Apple',
        'Banana',
        'Cherry',
        'Date',
        'Elderberry',
      ]);

      component.options.set([{ label: 'Fig', value: 'fig' }]);
      await fixture.whenStable();
      expect(await list.getOptionLabels()).toEqual(['Fig']);
    });

    it('keeps the value type of an object option and compares it deeply', async () => {
      const { fixture, component } = await renderAs(ObjectHost);
      const list = await harnessOf(fixture);
      expect(await list.getSelectedLabel()).toBe('Team');

      await list.selectOption('Free');
      await fixture.whenStable();
      expect(component.plan()).toEqual({ id: 1, name: 'free' });
      expect(component.plan()).toBe(component.options[0]?.value);

      component.plan.set({ id: 2, name: 'team' });
      await fixture.whenStable();
      expect(await list.getSelectedLabel()).toBe('Team');
    });

    it('a disabled option is shown and cannot be picked, and says so', async () => {
      const { fixture, component, element } = await render();
      const list = await harnessOf(fixture);

      expect(await list.isOptionDisabled('Cherry')).toBe(true);
      expect(await list.isOptionDisabled('Apple')).toBe(false);
      expect(rowOf(element, 'Cherry').getAttribute('data-p-disabled')).toBe('true');
      rowOf(element, 'Cherry').click();
      await fixture.whenStable();
      expect(component.value()).toBeNull();
    });

    it('picking the picked option again unpicks it, and the value becomes null', async () => {
      const { fixture, component } = await render();
      const list = await harnessOf(fixture);

      await list.selectOption('Banana');
      await fixture.whenStable();
      expect(component.value()).toBe('banana');

      await list.selectOption('Banana');
      await fixture.whenStable();
      expect(component.value()).toBeNull();
      expect(await list.getSelectedLabel()).toBeNull();
    });

    it('disabled, required and invalid reach the list', async () => {
      const { fixture, component, element } = await render();
      const list = await harnessOf(fixture);
      expect(await list.isDisabled()).toBe(false);
      expect(await list.isRequired()).toBe(false);
      expect(await list.isInvalid()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await list.isRequired()).toBe(true);
      expect(await list.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await list.isDisabled()).toBe(true);
    });

    it('a disabled list ignores a click', async () => {
      const { fixture, component, element } = await render((host) => {
        host.disabled.set(true);
      });

      rowOf(element, 'Banana').click();
      await fixture.whenStable();

      expect(component.value()).toBeNull();
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('marks every row disabled while the list is, and a disabled row alone while it is not', async () => {
      const { fixture, component, element } = await render();
      const list = await harnessOf(fixture);
      const flags = (): (string | null)[] =>
        rowsOf(element).map((row) => row.getAttribute('aria-disabled'));
      expect(flags()).toEqual(['false', 'false', 'true', 'false', 'false']);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(flags()).toEqual(['true', 'true', 'true', 'true', 'true']);
      expect(await list.isOptionDisabled('Apple')).toBe(true);

      component.disabled.set(false);
      await fixture.whenStable();
      expect(flags()).toEqual(['false', 'false', 'true', 'false', 'false']);
    });

    it('hides the multiselectable claim Optimus hard-codes on a single-choice list', async () => {
      const { element } = await render();

      expect(listOf(element).getAttribute('aria-multiselectable')).toBe('false');
    });

    it('reads the picked option as aria-selected on exactly one row', async () => {
      const { element } = await render((host) => {
        host.value.set('date');
      });

      expect(rowsOf(element).map((row) => row.getAttribute('aria-selected'))).toEqual([
        'false',
        'false',
        'false',
        'true',
        'false',
      ]);
    });

    it('pt reaches the root, container, list, option and empty-message parts, and the routed attributes win over it', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'a' },
          listContainer: { 'data-container': 'b', tabindex: '0' },
          list: { 'data-list': 'c', 'aria-multiselectable': 'true', 'aria-invalid': 'false' },
          option: { 'data-option': 'd', 'aria-disabled': 'false' },
          hiddenFirstFocusableEl: { 'data-entry': 'e' },
        });
        host.invalid.set(true);
        host.disabled.set(true);
      });

      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(containerOf(element).getAttribute('data-container')).toBe('b');
      expect(containerOf(element).getAttribute('tabindex')).toBe('-1');
      expect(listOf(element).getAttribute('data-list')).toBe('c');
      expect(listOf(element).getAttribute('aria-multiselectable')).toBe('false');
      expect(listOf(element).getAttribute('aria-invalid')).toBe('true');
      // Gap: Optimus's type spells the part `hiddenFirstFocusableEl`, its template reads
      // `hiddenFirstFocusableElement`, so a consumer's attribute on it never lands. An Optimus fix
      // turns this red, and the docs page loses its gap.
      expect(entryOf(element).hasAttribute('data-entry')).toBe(false);
      expect(element.querySelectorAll('[role="option"][data-option="d"]')).toHaveLength(5);
      expect(rowsOf(element).every((row) => row.getAttribute('aria-disabled') === 'true')).toBe(
        true,
      );
      expect(await (await harnessOf(fixture)).isDisabled()).toBe(true);
    });

    it('pt reaches the empty-message part', async () => {
      const { element } = await render((host) => {
        host.options.set([]);
        host.pt.set({ emptyMessage: { 'data-empty': 'f' } });
      });

      expect(element.querySelector('[data-empty="f"]')?.textContent.trim()).toBe(
        'No available options',
      );
    });

    it('is a block host that draws no box of its own, and the Optimus box fills it', async () => {
      const { element } = await render();
      const host = hostOf(element);
      host.style.inlineSize = '320px';
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.paddingTop).toBe('0px');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(rootOf(element).getBoundingClientRect().width).toBe(320);
      expect(rootOf(element).getBoundingClientRect().height).toBe(
        host.getBoundingClientRect().height,
      );
    });

    it('grows with its options up to 14rem, and then scrolls inside the box', async () => {
      const short = await render();
      const shortBox = containerOf(short.element);
      expect(shortBox.clientHeight).toBe(shortBox.scrollHeight);
      expect(shortBox.clientHeight).toBeLessThan(224);
      TestBed.resetTestingModule();

      const { element } = await renderAs(LongHost);
      const box = containerOf(element);

      expect(box.getBoundingClientRect().height).toBe(224);
      expect(getComputedStyle(box).overflowY).toBe('auto');
      expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    });

    it('keeps every row at least 24px tall and wide, and wraps a long label at its spaces', async () => {
      const long = 'A long option label that wraps onto several lines in a narrow list box';
      const { element } = await render((host) => {
        host.options.set([...FRUIT, { label: long, value: 'long' }]);
      });
      hostOf(element).style.inlineSize = '160px';

      for (const row of rowsOf(element)) {
        const box = row.getBoundingClientRect();
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
      const apple = rowOf(element, 'Apple').getBoundingClientRect().height;
      expect(rowOf(element, long).getBoundingClientRect().height).toBeGreaterThan(apple * 2);
      expect(containerOf(element).scrollWidth).toBeLessThanOrEqual(
        containerOf(element).clientWidth,
      );
    });

    describe.each<Scheme>(['light', 'dark'])('the picked row in %s', (scheme) => {
      it('takes the noir highlight, and keeps it when the list loses focus', async () => {
        const { fixture, element } = await render((host) => {
          host.value.set('banana');
        }, scheme);
        await pointerAway();
        const picked = getComputedStyle(rowOf(element, 'Banana'));
        const plain = getComputedStyle(rowOf(element, 'Apple'));

        expect(picked.backgroundColor).toBe(
          resolved('backgroundColor', '--wj-highlight-background'),
        );
        expect(picked.color).toBe(resolved('color', '--wj-highlight-color'));
        expect(plain.backgroundColor).not.toBe(picked.backgroundColor);

        await (await harnessOf(fixture)).focus();
        await (await harnessOf(fixture)).blur();
        expect(getComputedStyle(rowOf(element, 'Banana')).backgroundColor).toBe(
          resolved('backgroundColor', '--wj-highlight-background'),
        );
      });
    });
  });

  describe('the focus ring', () => {
    beforeEach(() => {
      // `focusOnHover` would move the focused row under a pointer another spec left behind.
      return pointerAway();
    });

    it.each<Scheme>(['light', 'dark'])(
      'rings the focused row 2px inside its edge while the list has keyboard focus (%s)',
      async (scheme) => {
        const { element } = await renderAs(KeyboardHost, () => undefined, scheme);
        await tabFrom(element, 'before');
        await expect.poll(() => activeLabel(element)).toBe('Apple');
        const ring = getComputedStyle(rowOf(element, 'Apple'));

        expect(ring.outlineStyle).toBe('solid');
        expect(ring.outlineWidth).toBe('2px');
        expect(ring.outlineOffset).toBe('-2px');
        expect(ring.outlineColor).toBe(resolved('color', '--wj-focus-ring-color'));
        expect(getComputedStyle(rowOf(element, 'Date')).outlineStyle).toBe('none');
      },
    );

    it.each<Scheme>(['light', 'dark'])(
      'rings the picked row in the highlight colour, where the focus ring would vanish (%s)',
      async (scheme) => {
        const { element } = await renderAs(
          KeyboardHost,
          (host) => {
            host.value.set('banana');
          },
          scheme,
        );
        await tabFrom(element, 'before');
        await expect.poll(() => activeLabel(element)).toBe('Banana');
        const ring = getComputedStyle(rowOf(element, 'Banana'));

        expect(ring.outlineStyle).toBe('solid');
        expect(ring.outlineWidth).toBe('2px');
        expect(ring.outlineColor).toBe(resolved('color', '--wj-highlight-color'));
      },
    );

    it('follows the focused row as the arrows move it, and draws no ring on a mouse focus', async () => {
      const { element } = await renderAs(KeyboardHost);
      await tabFrom(element, 'before');
      await expect.poll(() => activeLabel(element)).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => activeLabel(element)).toBe('Banana');
      expect(getComputedStyle(rowOf(element, 'Banana')).outlineStyle).toBe('solid');
      expect(getComputedStyle(rowOf(element, 'Apple')).outlineStyle).toBe('none');

      byId(element, 'before').focus();
      await userEvent.click(rowOf(element, 'Date'));
      await expect.poll(() => activeLabel(element)).toBe('Date');
      expect(getComputedStyle(rowOf(element, 'Date')).outlineStyle).toBe('none');
    });

    it('never changes the border of the box', async () => {
      const { element } = await renderAs(KeyboardHost);
      const before = getComputedStyle(rootOf(element)).borderTopColor;

      await tabFrom(element, 'before');

      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(before);
      expect(getComputedStyle(rootOf(element)).borderTopWidth).toBe('1px');
    });

    it('rings the message row of an empty list while its hidden entry has keyboard focus', async () => {
      const { element } = await renderAs(EmptyKeyboardHost);
      await tabFrom(element, 'before');
      await expect.poll(() => document.activeElement).toBe(entryOf(element));
      const message = getComputedStyle(
        find(element, '[data-pc-section="emptymessage"]', HTMLElement),
      );

      expect(message.outlineStyle).toBe('solid');
      expect(message.outlineWidth).toBe('2px');
      expect(message.outlineColor).toBe(resolved('color', '--wj-focus-ring-color'));
    });
  });

  describe('Optimus behaviours the wrapper depends on', () => {
    it('writes the model into Optimus once per change: its writeValue reads no signal the bridge would track', async () => {
      const write = vi.spyOn(Listbox.prototype, 'writeValue');
      const { fixture, component, element } = await render();
      const list = await harnessOf(fixture);
      const first = write.mock.calls.length;
      expect(first).toBeGreaterThan(0);

      // A focus move, a hover, new options, a new pt, an invalid flip and a disabled flip change
      // signals Optimus reads in its own render; none may re-run the bridge's effect.
      await list.focus();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await userEvent.hover(rowOf(element, 'Date'));
      await pointerAway();
      component.options.set([...FRUIT]);
      component.pt.set({ list: { 'data-list': 'x' } });
      component.invalid.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      component.disabled.set(false);
      await fixture.whenStable();
      expect(write).toHaveBeenCalledTimes(first);

      await list.selectOption('Date');
      await fixture.whenStable();
      expect(write).toHaveBeenCalledTimes(first + 1);
    });

    it('keeps a form’s initial value through the first binding of the options', async () => {
      const { fixture, component } = await renderAs(ReactiveHost);
      const list = await harnessOf(fixture);

      expect(await list.getSelectedLabel()).toBe('Banana');
      expect(component.control.value).toBe('banana');
    });

    it('keeps the value when options change, and picks again when its option comes back', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('banana');
      });
      const list = await harnessOf(fixture);
      expect(await list.getSelectedLabel()).toBe('Banana');

      component.options.set([{ label: 'Fig', value: 'fig' }]);
      await fixture.whenStable();
      expect(component.value()).toBe('banana');
      expect(await list.getSelectedLabel()).toBeNull();

      component.options.set([...FRUIT]);
      await fixture.whenStable();
      expect(component.value()).toBe('banana');
      expect(await list.getSelectedLabel()).toBe('Banana');
    });

    it('renders a value that no option has without throwing, picks nothing and keeps the value', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('zucchini');
      });
      const list = await harnessOf(fixture);

      expect(await list.getOptionLabels()).toHaveLength(5);
      expect(await list.getSelectedLabel()).toBeNull();
      expect(component.value()).toBe('zucchini');

      await list.selectOption('Apple');
      await fixture.whenStable();
      expect(component.value()).toBe('apple');
    });

    it.each(['click', 'Enter'])(
      'keeps focus, the focused row and the scroll position through the echo write after a pick by %s',
      async (how) => {
        const { fixture, component, element } = await renderAs(LongHost);
        await pointerAway();
        await tabFrom(element, 'before');
        const box = containerOf(element);
        for (let step = 0; step < 20; step += 1) {
          await userEvent.keyboard('{ArrowDown}');
        }
        expect(activeLabel(element)).toBe('Option 21');
        await expect.poll(() => box.scrollTop).toBeGreaterThan(0);
        const scrolled = box.scrollTop;

        if (how === 'click') {
          await userEvent.click(rowOf(element, 'Option 21'));
        } else {
          await userEvent.keyboard('{Enter}');
        }
        await fixture.whenStable();

        expect(component.value()).toBe(21);
        expect(document.activeElement).toBe(listOf(element));
        expect(activeLabel(element)).toBe('Option 21');
        expect(box.scrollTop).toBe(scrolled);
        expect(await (await harnessOf(fixture)).getSelectedLabel()).toBe('Option 21');
      },
    );
  });

  describe('pt of every form', () => {
    const forms: [string, WjListboxPt][] = [
      [
        'an object',
        { root: { 'data-root': 'x' }, list: { 'data-list': 'x' }, option: { 'data-option': 'x' } },
      ],
      [
        'a function',
        () => ({
          root: { 'data-root': 'x' },
          list: { 'data-list': 'x' },
          option: { 'data-option': 'x' },
        }),
      ],
      [
        'per-part functions',
        {
          root: () => ({ 'data-root': 'x' }),
          list: () => ({ 'data-list': 'x' }),
          option: () => ({ 'data-option': 'x' }),
        },
      ],
    ];

    it.each(forms)(
      'lands the consumer’s parts and the routed attributes, and keeps both through every state change: %s',
      async (_name, pt) => {
        const { fixture, component, element } = await render((host) => {
          host.inField.set(true);
          host.hint.set('Hint');
          host.error.set('Error');
          host.invalid.set(false);
          host.pt.set(pt);
        });
        const list = await harnessOf(fixture);
        const expectAll = (disabled = false): void => {
          expect(rootOf(element).getAttribute('data-root')).toBe('x');
          expect(listOf(element).getAttribute('data-list')).toBe('x');
          expect(
            [...element.querySelectorAll('[role="option"]')].every(
              (row) => row.getAttribute('data-option') === 'x',
            ),
          ).toBe(true);
          expectRouted(element, disabled);
        };
        expectAll();

        await list.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expectAll();

        component.options.set([...FRUIT, { label: 'Fig', value: 'fig' }]);
        await fixture.whenStable();
        expectAll();

        component.value.set('banana');
        await fixture.whenStable();
        expectAll();

        component.disabled.set(true);
        await fixture.whenStable();
        expectAll(true);
        component.disabled.set(false);
        await fixture.whenStable();
        expectAll();

        component.error.set('');
        await fixture.whenStable();
        expect(listOf(element).hasAttribute('aria-invalid')).toBe(false);
        component.error.set('Error again');
        await fixture.whenStable();
        expectAll();

        component.pt.set({
          root: { 'data-root': 'x' },
          list: { 'data-list': 'x' },
          option: { 'data-option': 'x' },
        });
        await fixture.whenStable();
        expectAll();
      },
    );

    it('keeps a consumer pt string as a class on the part the wrapper also routes into', async () => {
      const { element } = await render((host) => {
        host.pt.set({ option: 'consumer-option', list: 'consumer-list' });
      });

      expect(element.querySelectorAll('[role="option"].consumer-option')).toHaveLength(5);
      expect(listOf(element).classList.contains('consumer-list')).toBe(true);
      expect(rowOf(element, 'Cherry').getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('the list', () => {
    it('keeps Optimus services as root internals and exports only the wrapper', async () => {
      const { fixture } = await render();
      const host = fixture.debugElement.query((node) => node.name === 'wj-listbox');

      expect(host.injector.get(FilterService)).toBe(TestBed.inject(FilterService));
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(listboxApi)).toEqual(['WjListbox']);
    });

    it('shows the translation’s empty message as the only content of an empty list', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([]);
      });
      const list = await harnessOf(fixture);

      expect(await list.getEmptyMessage()).toBe('No available options');
      expect(await list.getOptionLabels()).toEqual([]);
      expect(element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('takes the empty message and the entry from a vi override', async () => {
      const { fixture } = await renderAs(
        Host,
        (host) => {
          host.options.set([]);
        },
        'light',
        { translation: viLocale },
      );

      expect(await (await harnessOf(fixture)).getEmptyMessage()).toBe(viLocale.emptyMessage);
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const list = await harnessOf(fixture);
        expect(await list.getSelectedLabel()).toBe('Banana');

        await list.selectOption('Date');
        await fixture.whenStable();
        expect(component.value()).toBe('date');

        component.value.set('apple');
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await list.getSelectedLabel()).toBe('Apple');
      });

      it('disables the list, and marks the model touched when focus leaves it', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const list = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await list.focus();
        await list.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await list.isDisabled()).toBe(true);
        expect(element.querySelector('p-listbox')).not.toBeNull();
      });

      it('does not mark the model touched while focus moves inside the list, only when it leaves', async () => {
        const { component, element } = await renderAs(NgModelHost);

        await tabFrom(element, 'before');
        expect(document.activeElement).toBe(listOf(element));
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await userEvent.click(rowOf(element, 'Date'));
        expect(component.model().touched).toBe(false);

        await userEvent.tab();
        expect(document.activeElement).toBe(byId(element, 'after'));
        expect(component.model().touched).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const list = await harnessOf(fixture);
        expect(await list.getSelectedLabel()).toBe('Banana');

        await list.selectOption('Date');
        expect(component.control.value).toBe('date');
        expect(component.control.dirty).toBe(true);

        component.control.setValue('apple');
        expect(await list.getSelectedLabel()).toBe('Apple');
      });

      it('disables the control, and marks it touched when focus leaves the list', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const list = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await list.focus();
        await list.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await list.isDisabled()).toBe(true);

        component.control.enable();
        expect(await list.isDisabled()).toBe(false);
      });

      it('does not mark the control touched while focus moves inside the list, only when it leaves', async () => {
        const { component, element } = await renderAs(ReactiveHost);

        await tabFrom(element, 'before');
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await userEvent.click(rowOf(element, 'Elderberry'));
        expect(component.control.touched).toBe(false);

        await userEvent.tab({ shift: true });
        expect(document.activeElement).toBe(byId(element, 'before'));
        expect(component.control.touched).toBe(true);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue('apple');

        expect(component.control.dirty).toBe(false);
      });

      it('shows nothing picked for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getSelectedLabel()).toBeNull();
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const fruit = (await allHarnessesOf(fixture))(0);
        expect(await fruit.getSelectedLabel()).toBe('Banana');

        await fruit.selectOption('Date');
        await fixture.whenStable();
        expect(component.value().fruit).toBe('date');

        component.model.fruit().value.set('apple');
        await fixture.whenStable();
        expect(await fruit.getSelectedLabel()).toBe('Apple');
      });

      it('disables the control, and marks the field touched when focus leaves the list', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const fruit = (await allHarnessesOf(fixture))(0);
        expect(component.model.fruit().touched()).toBe(false);

        await fruit.focus();
        await fruit.blur();
        expect(component.model.fruit().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await fruit.isDisabled()).toBe(true);
      });

      it('does not mark the field touched while focus moves inside the list, only when it leaves', async () => {
        const { component, element } = await renderAs(SignalHost);

        await tabFrom(element, 'before');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.click(rowOf(element, 'Date'));
        expect(component.model.fruit().touched()).toBe(false);

        await userEvent.tab();
        expect(component.model.fruit().touched()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a list outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.selectOption('Apple');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component } = await render();
      const list = await harnessOf(fixture);

      await list.selectOption('Banana');
      expect(component.value()).toBe('banana');

      await list.focus();
      await list.blur();
      expect(await list.isFocused()).toBe(false);
    });

    it('reports valueChange, and the native focusin, focusout, click and dblclick of the host', async () => {
      const { fixture, component, element } = await renderAs(EventsHost);
      const list = await harnessOf(fixture);

      await userEvent.click(rowOf(element, 'Banana'));
      expect(component.value()).toBe('banana');
      expect(component.log).toContain('valueChange');
      expect(component.log).toContain('click');
      expect(component.log).toContain('focusin');

      await userEvent.dblClick(rowOf(element, 'Date'));
      expect(component.log).toContain('dblclick');

      await list.blur();
      expect(component.log).toContain('focusout');
    });
  });

  describe('inside a field', () => {
    it('is named by the field label through aria-labelledby, and carries a generated id on its entry', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const list = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLElement);

      expect(await list.getId()).toMatch(/^wj-listbox-\d+$/);
      expect(entryOf(element).getAttribute('id')).toBe(await list.getId());
      expect(listOf(element).hasAttribute('id')).toBe(true);
      expect(listOf(element).id).not.toBe(await list.getId());
      expect(label.tagName).toBe('SPAN');
      expect(label.hasAttribute('for')).toBe(false);
      expect((await list.getAriaAttributes()).labelledBy).toBe(label.id);
      expect(await field.getLabel()).toBe('Fruit');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('moves focus into the list when the field label is clicked, and picks nothing', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const list = await harnessOf(fixture);
      expect(await list.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      await expect.poll(() => list.isFocused()).toBe(true);
      expect(component.value()).toBeNull();
    });

    it('does not focus a disabled list on a label click, and gives it its id back when enabled', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.disabled.set(true);
      });
      const list = await harnessOf(fixture);
      expect(await list.getId()).toBe('');

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));
      expect(await list.isFocused()).toBe(false);
      expect(document.activeElement).not.toBe(listOf(element));

      component.disabled.set(false);
      await fixture.whenStable();
      expect(await list.getId()).toMatch(/^wj-listbox-\d+$/);
      await userEvent.click(find(element, '.wj-field-label', HTMLElement));
      await expect.poll(() => list.isFocused()).toBe(true);
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

    it('describes the list with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const list = await harnessOf(fixture);
      expect((await list.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await list.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await list.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const list = await harnessOf(fixture);
      expect(await list.isInvalid()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Pick a fruit.');
      await fixture.whenStable();
      expect(await list.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await list.isInvalid()).toBe(false);
      expect(listOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id, no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const list = await harnessOf(fixture);
      const aria = await list.getAriaAttributes();

      expect(await list.getId()).toBe('');
      expect(aria.labelledBy).toBeNull();
      expect(aria.describedBy).toBeNull();
      expect(aria.label).toBe('Fruit');
    });

    it('keeps the consumer’s inputId and ariaDescribedBy', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component, element } = await render();
      const list = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await list.isInvalid()).toBe(true);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(listOf(element).hasAttribute('aria-invalid')).toBe(false);
    });

    it('sets aria-required only while it is required', async () => {
      const { fixture, component, element } = await render();
      expect(listOf(element).hasAttribute('aria-required')).toBe(false);

      component.required.set(true);
      await fixture.whenStable();
      expect(await (await harnessOf(fixture)).isRequired()).toBe(true);

      component.required.set(false);
      await fixture.whenStable();
      expect(listOf(element).hasAttribute('aria-required')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets ariaLabel, ariaLabelledBy and ariaDescribedBy on the list, and inputId on the entry', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const list = await harnessOf(fixture);

      expect(await list.getId()).toBe('mine');
      expect(await list.getAriaAttributes()).toEqual({
        label: 'Fruit',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-listbox: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
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
      const list = await harnessOf(fixture);

      expect(await list.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await list.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on option labels, in the list and once picked, as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([{ label: PAYLOAD, value: 'payload' }]);
      });
      const list = await harnessOf(fixture);

      expect(await list.getOptionLabels()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();

      await list.selectOption(PAYLOAD);
      await fixture.whenStable();
      expect(await list.getSelectedLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the label it holds', async () => {
      const { fixture } = await render((host) => {
        host.value.set('banana');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(WjListboxHarness.with({ ariaLabel: /^Fru/ }));
      const byPicked = await loader.getAllHarnesses(
        WjListboxHarness.with({ selectedLabel: 'Banana' }),
      );
      const none = await loader.getAllHarnesses(WjListboxHarness.with({ selectedLabel: 'Apple' }));

      expect(byLabel).toHaveLength(1);
      expect(byPicked).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('reads no empty message for a list with options, and refuses an unknown label', async () => {
      const { fixture } = await render();
      const list = await harnessOf(fixture);

      expect(await list.getEmptyMessage()).toBeNull();
      await expect(list.selectOption('Zucchini')).rejects.toThrow('no option labelled');
      await expect(list.isOptionDisabled('Zucchini')).rejects.toThrow('no option labelled');
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const list = await harnessOf(fixture);
      expect(await list.isFocused()).toBe(false);

      await list.focus();
      expect(await list.isFocused()).toBe(true);

      await list.blur();
      expect(await list.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-listbox', HTMLElement),
        );
      });

      it('has no axe violations with a focused option, picked or not', async () => {
        await pointerAway();
        const { element } = await renderAs(
          KeyboardHost,
          (host) => {
            host.value.set('banana');
          },
          scheme,
        );
        await tabFrom(element, 'before');
        expect(activeLabel(element)).toBe('Banana');
        await expectNoAxeViolations(hostOf(element));

        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(element)).toBe('Date');
        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations for an empty list with its entry focused', async () => {
        await pointerAway();
        const { element } = await renderAs(EmptyKeyboardHost, () => undefined, scheme);
        await tabFrom(element, 'before');
        expect(document.activeElement).toBe(entryOf(element));

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      // `focusOnHover` would move the focused row under a pointer another spec left behind.
      return pointerAway();
    });

    /** Renders the keyboard host and Tabs into the first list from the button before it. */
    async function focusFirst(): Promise<Rendered<KeyboardHost> & { list: WjListboxHarness }> {
      const rendered = await renderAs(KeyboardHost);
      const list = (await allHarnessesOf(rendered.fixture))(0);
      await tabFrom(rendered.element, 'before');
      expect(await list.isFocused()).toBe(true);
      return { ...rendered, list };
    }

    it('Tab enters the list in one step, onto the first option while nothing is picked', async () => {
      const { element } = await focusFirst();

      expect(document.activeElement).toBe(listOf(element));
      expect(activeLabel(element)).toBe('Apple');
    });

    it('Tab enters the list onto the picked option', async () => {
      const { element } = await renderAs(KeyboardHost, (host) => {
        host.value.set('date');
      });

      await tabFrom(element, 'before');

      expect(activeLabel(element)).toBe('Date');
    });

    it('Tab leaves the list in one step, skipping a disabled list, and Shift+Tab comes back and leaves in one step', async () => {
      const { element, list } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
      expect(await list.isFocused()).toBe(false);

      await userEvent.tab({ shift: true });
      expect(await list.isFocused()).toBe(true);
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
    });

    it('leaves a scrolling list in one step each way: its box is not a Tab stop', async () => {
      const { element } = await renderAs(LongHost);
      expect(containerOf(element).scrollHeight).toBeGreaterThan(containerOf(element).clientHeight);

      await tabFrom(element, 'before');
      expect(document.activeElement).toBe(listOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(listOf(element));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
    });

    it('skips a disabled scrolling list on Tab and on Shift+Tab', async () => {
      const { element } = await renderAs(LongHost, (host) => {
        host.disabled.set(true);
      });

      await tabFrom(element, 'before');
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
    });

    it('Down and Up move through the options, skipping a disabled one, and stop at the ends', async () => {
      const { element, list } = await focusFirst();

      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Banana');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Date');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(activeLabel(element)).toBe('Elderberry');
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(activeLabel(element)).toBe('Banana');
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(activeLabel(element)).toBe('Apple');
      expect(await list.getSelectedLabel()).toBeNull();
    });

    it('Home and End jump to the first and the last option without picking', async () => {
      const { element, list } = await focusFirst();

      await userEvent.keyboard('{End}');
      expect(activeLabel(element)).toBe('Elderberry');
      await userEvent.keyboard('{Home}');
      expect(activeLabel(element)).toBe('Apple');
      expect(await list.getSelectedLabel()).toBeNull();
    });

    it('PageDown and PageUp move focus ten pickable options, skip a disabled one and stop at the ends', async () => {
      const { element } = await renderAs(PagedHost);
      await tabFrom(element, 'before');
      expect(activeLabel(element)).toBe('Option 1');

      // Option 5 is disabled, so ten steps from Option 1 land on Option 12, not 11.
      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => activeLabel(element)).toBe('Option 12');

      await userEvent.keyboard('{PageUp}');
      await expect.poll(() => activeLabel(element)).toBe('Option 1');

      await userEvent.keyboard('{PageUp}');
      await expect.poll(() => activeLabel(element)).toBe('Option 1');

      await userEvent.keyboard('{PageDown}{PageDown}');
      await expect.poll(() => activeLabel(element)).toBe('Option 22');
      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => activeLabel(element)).toBe('Option 25');
      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => activeLabel(element)).toBe('Option 25');
      expect(document.activeElement).toBe(listOf(element));
    });

    it('PageDown moves focus without picking, and Enter then picks the option it reached', async () => {
      const { fixture, component, element } = await renderAs(PagedHost);
      await tabFrom(element, 'before');

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => activeLabel(element)).toBe('Option 12');
      expect(component.value()).toBeNull();

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(component.value()).toBe(12);
    });

    it('Enter picks the focused option, Enter again unpicks it, and focus stays on the list', async () => {
      const { fixture, component, element, list } = await focusFirst();

      await userEvent.keyboard('{ArrowDown}{Enter}');
      await fixture.whenStable();
      expect(component.value()).toBe('banana');
      expect(await list.getSelectedLabel()).toBe('Banana');
      expect(document.activeElement).toBe(listOf(element));

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(component.value()).toBeNull();
      expect(activeLabel(element)).toBe('Banana');
    });

    it('Escape does nothing: there is no overlay, the value is kept and focus stays', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.value.set('banana');
      });
      await tabFrom(element, 'before');

      await userEvent.keyboard('{Escape}');

      expect(component.value()).toBe('banana');
      expect(document.activeElement).toBe(listOf(element));
    });

    it('Space picks the focused option and does not scroll the page', async () => {
      const { fixture, component, element } = await focusFirst();

      await userEvent.keyboard('{ArrowDown}{ArrowDown} ');
      await fixture.whenStable();

      expect(component.value()).toBe('date');
      expect(activeLabel(element)).toBe('Date');
      expect(window.scrollY).toBe(0);
    });

    it.each([
      ['e', 'Elderberry'],
      ['b', 'Banana'],
      ['da', 'Date'],
    ])('typing "%s" moves to the option that starts with it', async (typed, expected) => {
      const { element, list } = await focusFirst();

      await userEvent.keyboard(typed);

      await expect.poll(() => activeLabel(element)).toBe(expected);
      expect(await list.getSelectedLabel()).toBeNull();
    });

    it('typing the first letter of a disabled option moves nowhere', async () => {
      const { element } = await focusFirst();

      await userEvent.keyboard('c');

      expect(activeLabel(element)).toBe('Apple');
    });

    it('does nothing on a disabled list', async () => {
      const { fixture } = await renderAs(KeyboardHost);
      const disabled = (await allHarnessesOf(fixture))(1);
      const host = fixture.nativeElement as HTMLElement;
      const list = host.querySelectorAll<HTMLElement>('[role="listbox"]')[1];

      list?.focus();
      await userEvent.keyboard('{ArrowDown}{Enter} a');

      expect(await disabled.getSelectedLabel()).toBeNull();
    });
  });
});
