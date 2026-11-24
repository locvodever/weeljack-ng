/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import {
  FormField,
  disabled as disabledRule,
  form,
  max as maxRule,
  min as minRule,
  required,
} from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import {
  WjInputNumber,
  type WjInputNumberMode,
  type WjInputNumberPt,
  type WjInputNumberSize,
} from 'weeljack-ng/inputnumber';
import { WjInputNumberHarness } from 'weeljack-ng/inputnumber/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/**
 * Parks the pointer on the host's "After" button before a border read. The pointer is page-wide in
 * browser mode, so an earlier test can leave it over the control, and Optimus's hover border
 * outranks the invalid one.
 */
async function pointerAway(element: HTMLElement): Promise<void> {
  const after = element.querySelector<HTMLElement>('#after');
  if (after === null) throw new Error('The host has no #after button.');
  await userEvent.hover(after);
}

/** A consumer's template: one bare number input, or the same one inside a field. */
@Component({
  selector: 'wj-inputnumber-host',
  imports: [WjField, WjInputNumber],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Quantity" [hint]="hint()" [error]="error()">
        <wj-inputnumber
          [(value)]="value"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [placeholder]="placeholder()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [mode]="mode()"
          [currency]="currency()"
          [locale]="locale()"
          [minFractionDigits]="minFractionDigits()"
          [maxFractionDigits]="maxFractionDigits()"
          [prefix]="prefix()"
          [suffix]="suffix()"
          [showButtons]="showButtons()"
        />
      </wj-field>
    } @else {
      <wj-inputnumber
        ariaLabel="Quantity"
        [(value)]="value"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
        [placeholder]="placeholder()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [mode]="mode()"
        [currency]="currency()"
        [locale]="locale()"
        [minFractionDigits]="minFractionDigits()"
        [maxFractionDigits]="maxFractionDigits()"
        [prefix]="prefix()"
        [suffix]="suffix()"
        [showButtons]="showButtons()"
      />
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<number | null>(null);
  readonly pt = signal<WjInputNumberPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjInputNumberSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>(undefined);
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly step = signal<number | undefined>(undefined);
  readonly mode = signal<WjInputNumberMode>('decimal');
  readonly currency = signal<string | undefined>(undefined);
  /** Pinned, so the spec never reads the machine's locale. */
  readonly locale = signal<string | undefined>('en-US');
  readonly minFractionDigits = signal<number | undefined>(undefined);
  readonly maxFractionDigits = signal<number | undefined>(undefined);
  readonly prefix = signal<string | undefined>(undefined);
  readonly suffix = signal<string | undefined>(undefined);
  readonly showButtons = signal(false);
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-inputnumber-aria-host',
  imports: [WjInputNumber],
  template: `
    <wj-inputnumber
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Quantity');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-inputnumber-aria-on-host-host',
  imports: [WjInputNumber],
  template: `<wj-inputnumber aria-label="Quantity" />`,
})
class AriaOnHostHost {}

/** A consumer's own label, and a field around a number input with its own `inputId`. */
@Component({
  selector: 'wj-inputnumber-own-ids-host',
  imports: [WjInputNumber, WjField],
  template: `
    <p id="note">Note</p>
    <label for="plain">Plain</label>
    <wj-inputnumber inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Quantity" hint="Hint" error="Error">
      <wj-inputnumber inputId="mine" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-inputnumber-ngmodel-host',
  imports: [WjField, WjInputNumber, FormsModule],
  template: `
    <wj-field label="Quantity">
      <wj-inputnumber locale="en-US" [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<number | null>(5);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-inputnumber-reactive-host',
  imports: [WjField, WjInputNumber, ReactiveFormsModule],
  template: `
    <wj-field label="Quantity">
      <wj-inputnumber locale="en-US" [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(5);
}

/** A reactive control that commits on blur: Optimus reads the wrapper's `NgControl`. */
@Component({
  selector: 'wj-inputnumber-blur-host',
  imports: [WjField, WjInputNumber, ReactiveFormsModule],
  template: `
    <wj-field label="Quantity">
      <wj-inputnumber locale="en-US" [formControl]="control" />
    </wj-field>
  `,
})
class BlurHost {
  readonly control = new FormControl<number | null>(5, { updateOn: 'blur' });
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-inputnumber-signal-host',
  imports: [WjField, WjInputNumber, FormField],
  template: `
    <wj-field label="Tickets">
      <wj-inputnumber locale="en-US" [formField]="model.tickets" />
    </wj-field>
    <wj-inputnumber ariaLabel="Bare" locale="en-US" [formField]="model.bare" />
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ tickets: number | null; bare: number | null }>({
    tickets: 5,
    bare: null,
  });
  readonly model = form(this.value, (path) => {
    minRule(path.tickets, 1);
    maxRule(path.tickets, 10);
    required(path.bare, { message: 'Enter it.' });
    disabledRule(path.tickets, { when: () => this.off() });
  });
}

/** Controls for the keyboard spec: the spin buttons are never tab stops. */
@Component({
  selector: 'wj-inputnumber-keyboard-host',
  imports: [WjInputNumber],
  template: `
    <button type="button" id="before">Before</button>
    <wj-inputnumber ariaLabel="First" showButtons />
    <wj-inputnumber ariaLabel="Disabled" showButtons disabled />
    <wj-inputnumber ariaLabel="Last" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {}

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
  expect(inputOf(element).getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
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

const inputOf = (element: HTMLElement): HTMLInputElement =>
  find(element, 'input.p-inputtext', HTMLInputElement);

const decrementOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, 'button.p-inputnumber-decrement-button', HTMLButtonElement);

const incrementOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, 'button.p-inputnumber-increment-button', HTMLButtonElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjInputNumberHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputNumberHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjInputNumberHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjInputNumberHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-inputnumber at index ${String(index)}`);
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

/** Waits for the input's text, which Optimus formats from its own handlers. */
const textOf =
  (element: HTMLElement): (() => string) =>
  () =>
    inputOf(element).value;

const STATES: [string, (host: Host) => void][] = [
  [
    'empty with a placeholder',
    (host) => {
      host.placeholder.set('Enter a number');
    },
  ],
  [
    'with a value',
    (host) => {
      host.value.set(1234.5);
    },
  ],
  [
    'currency',
    (host) => {
      host.mode.set('currency');
      host.currency.set('VND');
      host.locale.set('vi-VN');
      host.value.set(125000);
    },
  ],
  [
    'with spin buttons',
    (host) => {
      host.showButtons.set(true);
      host.value.set(3);
    },
  ],
  [
    'disabled',
    (host) => {
      host.showButtons.set(true);
      host.value.set(3);
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.showButtons.set(true);
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.showButtons.set(true);
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.showButtons.set(true);
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.showButtons.set(true);
      host.hint.set('Between 1 and 99.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.showButtons.set(true);
      host.error.set('Enter a quantity.');
    },
  ],
];

describe('WjInputNumber', () => {
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
    it('value is two-way: the input follows it, and typing writes it back', async () => {
      const { fixture, component } = await render();
      const number = await harnessOf(fixture);
      expect(await number.getText()).toBe('');
      expect(await number.getValue()).toBeNull();

      component.value.set(1234.5);
      await fixture.whenStable();
      expect(await number.getText()).toBe('1,234.5');
      expect(await number.getValue()).toBe(1234.5);

      await number.clear();
      await number.typeText('42');
      expect(component.value()).toBe(42);
      expect(await number.getText()).toBe('42');
    });

    it('shows an empty input again when the value goes back to null', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(7);
      });
      const number = await harnessOf(fixture);
      expect(await number.getText()).toBe('7');

      component.value.set(null);
      await fixture.whenStable();

      expect(await number.getText()).toBe('');
      expect(await number.getValue()).toBeNull();
    });

    it('disabled, required and invalid reach the input', async () => {
      const { fixture, component, element } = await render();
      const number = await harnessOf(fixture);
      expect(await number.isDisabled()).toBe(false);
      expect(await number.isRequired()).toBe(false);
      expect(await number.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await number.isRequired()).toBe(true);
      expect(await number.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await number.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('placeholder reaches the input and follows the bound value', async () => {
      const { fixture, component } = await render((host) => {
        host.placeholder.set('Enter a number');
      });
      const number = await harnessOf(fixture);
      expect(await number.getPlaceholder()).toBe('Enter a number');

      component.placeholder.set(undefined);
      await fixture.whenStable();
      expect(await number.getPlaceholder()).toBeNull();
    });

    it('min, max and step reach the input, and step is what the arrows change by', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(1);
        host.max.set(9);
        host.step.set(2);
        host.value.set(3);
      });
      const number = await harnessOf(fixture);
      expect(await number.getMin()).toBe(1);
      expect(await number.getMax()).toBe(9);

      await number.focus();
      await number.increment();
      await fixture.whenStable();
      expect(component.value()).toBe(5);

      component.min.set(undefined);
      component.max.set(undefined);
      await fixture.whenStable();
      expect(await number.getMin()).toBeNull();
      expect(await number.getMax()).toBeNull();
    });

    it('mode, currency and locale format the amount: 125000 VND in vi-VN', async () => {
      const { fixture, component } = await render((host) => {
        host.mode.set('currency');
        host.currency.set('VND');
        host.locale.set('vi-VN');
        host.value.set(125000);
      });
      const number = await harnessOf(fixture);
      // Intl puts a no-break space before the symbol.
      expect((await number.getText()).replace(/\s/g, ' ')).toBe('125.000 ₫');

      component.mode.set('decimal');
      component.currency.set(undefined);
      component.locale.set('en-US');
      await fixture.whenStable();
      expect(await number.getText()).toBe('125,000');
    });

    it('minFractionDigits and maxFractionDigits set the decimal places', async () => {
      const { fixture, component } = await render((host) => {
        host.minFractionDigits.set(2);
        host.maxFractionDigits.set(2);
        host.value.set(4.5);
      });
      const number = await harnessOf(fixture);
      expect(await number.getText()).toBe('4.50');

      component.minFractionDigits.set(0);
      component.maxFractionDigits.set(1);
      component.value.set(4.56);
      await fixture.whenStable();
      expect(await number.getText()).toBe('4.6');
    });

    it('prefix and suffix are part of the shown value', async () => {
      const { fixture, component } = await render((host) => {
        host.suffix.set(' kg');
        host.value.set(70);
      });
      const number = await harnessOf(fixture);
      expect(await number.getText()).toBe('70 kg');

      component.suffix.set(undefined);
      component.prefix.set('+');
      await fixture.whenStable();
      expect(await number.getText()).toBe('+70');
    });

    it('size steps the height 36 / 44 / 52 px, and follows the bound value', async () => {
      const { fixture, component, element } = await render();
      const height = (): number => inputOf(element).getBoundingClientRect().height;
      expect(height()).toBe(44);
      expect(find(element, 'wj-inputnumber', HTMLElement).getBoundingClientRect().height).toBe(44);

      component.size.set('small');
      await fixture.whenStable();
      expect(height()).toBe(36);

      component.size.set('large');
      await fixture.whenStable();
      expect(height()).toBe(52);
    });

    it('is an inline-flex host with the Optimus root and input stretched to its width', async () => {
      const { element } = await render();
      const host = find(element, 'wj-inputnumber', HTMLElement);
      host.style.inlineSize = '320px';

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(find(element, 'p-inputnumber', HTMLElement).getBoundingClientRect().width).toBe(320);
      expect(inputOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('stretches the input between the spin buttons to the host width', async () => {
      const { element } = await render((host) => {
        host.showButtons.set(true);
      });
      const host = find(element, 'wj-inputnumber', HTMLElement);
      host.style.inlineSize = '320px';

      expect(find(element, 'p-inputnumber', HTMLElement).getBoundingClientRect().width).toBe(320);
      expect(inputOf(element).getBoundingClientRect().width).toBe(240);
    });

    it('keeps a long value inside the input, scrolling and never ellipsized', async () => {
      const { element } = await render((host) => {
        host.value.set(123456789012345);
      });
      find(element, 'wj-inputnumber', HTMLElement).style.inlineSize = '80px';

      expect(inputOf(element).getBoundingClientRect().width).toBe(80);
      expect(inputOf(element).scrollWidth).toBeGreaterThan(80);
      expect(getComputedStyle(inputOf(element)).textOverflow).toBe('clip');
    });
  });

  describe('pt', () => {
    const PT: WjInputNumberPt = {
      root: { 'data-root': 'a' },
      pcInputText: { root: { 'data-probe': 'yes', 'aria-invalid': 'false' } },
      incrementButton: { 'data-inc': 'up' },
      decrementButton: { 'data-dec': 'down' },
    };

    const landed = (element: HTMLElement, probe = 'yes'): void => {
      expect(find(element, 'p-inputnumber', HTMLElement).getAttribute('data-root')).toBe('a');
      expect(inputOf(element).getAttribute('data-probe')).toBe(probe);
      expect(incrementOf(element).getAttribute('data-inc')).toBe('up');
      expect(decrementOf(element).getAttribute('data-dec')).toBe('down');
    };

    it('reaches the root, the nested input and both spin buttons', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(PT);
        host.showButtons.set(true);
      });
      await fixture.whenStable();

      landed(element);
    });

    it('the routed aria-invalid wins over the pt one on the same attribute', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(PT);
        host.invalid.set(true);
      });
      await fixture.whenStable();

      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(inputOf(element).getAttribute('data-probe')).toBe('yes');
    });

    it('keeps landing after the value, disabled, size, invalid and pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(PT);
        host.showButtons.set(true);
      });
      await fixture.whenStable();
      landed(element);

      component.value.set(12);
      await fixture.whenStable();
      landed(element);

      component.disabled.set(true);
      await fixture.whenStable();
      landed(element);

      component.disabled.set(false);
      component.size.set('small');
      await fixture.whenStable();
      landed(element);

      component.invalid.set(true);
      await fixture.whenStable();
      landed(element);
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      component.pt.set({ ...PT, pcInputText: { root: { 'data-probe': 'changed' } } });
      await fixture.whenStable();
      landed(element, 'changed');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('reaches the parts from a function-form pt as well', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(() => PT);
        host.showButtons.set(true);
      });
      await fixture.whenStable();

      landed(element);
    });
  });

  describe('the spin buttons', () => {
    it('are absent without showButtons', async () => {
      const { fixture, element } = await render();

      expect(await (await harnessOf(fixture)).hasSpinButtons()).toBe(false);
      expect(find(element, 'wj-inputnumber', HTMLElement).querySelector('button')).toBeNull();
      expect(element.querySelector('[data-p-icon]')).toBeNull();
    });

    it('sit before and after the input, drawn as minus and plus, for mouse and touch only', async () => {
      const { fixture, element } = await render((host) => {
        host.showButtons.set(true);
      });
      const input = inputOf(element);
      const minus = decrementOf(element);
      const plus = incrementOf(element);

      expect(await (await harnessOf(fixture)).hasSpinButtons()).toBe(true);
      // Optimus puts the input first in the DOM and orders the buttons around it with CSS.
      expect(minus.getBoundingClientRect().right).toBeLessThanOrEqual(
        input.getBoundingClientRect().left + 1,
      );
      expect(plus.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        input.getBoundingClientRect().right - 1,
      );
      expect(minus.querySelector('svg[data-p-icon="minus"]')).not.toBeNull();
      expect(plus.querySelector('svg[data-p-icon="plus"]')).not.toBeNull();
      for (const button of [minus, plus]) {
        expect(button.type).toBe('button');
        expect(button.getAttribute('tabindex')).toBe('-1');
        expect(button.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('are 40 px wide and as tall as the control, at least 24 x 24 px, at all three sizes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.showButtons.set(true);
      });

      for (const [size, height] of [
        [undefined, 44],
        ['small', 36],
        ['large', 52],
      ] as const) {
        component.size.set(size);
        await fixture.whenStable();
        for (const button of [decrementOf(element), incrementOf(element)]) {
          const box = button.getBoundingClientRect();
          expect(box.width).toBe(40);
          expect(box.height).toBe(height);
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
        expect(inputOf(element).getBoundingClientRect().height).toBe(height);
      }
    });

    it('join the input with square inner corners and 8 px outer ones', async () => {
      const { element } = await render((host) => {
        host.showButtons.set(true);
      });
      const minus = getComputedStyle(decrementOf(element));
      const plus = getComputedStyle(incrementOf(element));

      expect(minus.borderTopLeftRadius).toBe('8px');
      expect(minus.borderTopRightRadius).toBe('0px');
      expect(plus.borderTopRightRadius).toBe('8px');
      expect(plus.borderTopLeftRadius).toBe('0px');
      expect(getComputedStyle(inputOf(element)).borderRadius).toBe('0px');
    });

    it('draw the glyph in the muted text colour', async () => {
      const { element } = await render((host) => {
        host.showButtons.set(true);
      });
      const muted = resolvedColour('--wj-text-muted-color', 'color');

      expect(getComputedStyle(decrementOf(element)).color).toBe(muted);
      expect(getComputedStyle(incrementOf(element)).color).toBe(muted);
    });

    it('take the disabled fill and ink with the control, and not before', async () => {
      const { fixture, component, element } = await render((host) => {
        host.showButtons.set(true);
      });
      const fill = resolvedColour('--wj-form-field-disabled-background', 'backgroundColor');
      const ink = resolvedColour('--wj-form-field-disabled-color', 'color');
      expect(getComputedStyle(incrementOf(element)).backgroundColor).not.toBe(fill);

      component.disabled.set(true);
      await fixture.whenStable();

      for (const button of [decrementOf(element), incrementOf(element)]) {
        expect(button.disabled).toBe(true);
        expect(getComputedStyle(button).backgroundColor).toBe(fill);
        expect(getComputedStyle(button).color).toBe(ink);
        expect(getComputedStyle(button).cursor).toBe('auto');
      }
    });

    it('a click steps the value, and the plus button stops at max', async () => {
      const { fixture, component, element } = await render((host) => {
        host.showButtons.set(true);
        host.max.set(5);
        host.value.set(4);
      });

      await userEvent.click(incrementOf(element));
      await fixture.whenStable();
      expect(component.value()).toBe(5);

      await userEvent.click(incrementOf(element));
      await fixture.whenStable();
      expect(component.value()).toBe(5);

      await userEvent.click(decrementOf(element));
      await fixture.whenStable();
      expect(component.value()).toBe(4);
    });
  });

  describe('focus', () => {
    it('lifts the focused input above its buttons so the ring is drawn whole', async () => {
      const { fixture, element } = await render((host) => {
        host.showButtons.set(true);
      });
      const number = await harnessOf(fixture);
      expect(getComputedStyle(inputOf(element)).zIndex).toBe('auto');

      await number.focus();

      expect(getComputedStyle(inputOf(element)).zIndex).toBe('1');
      expect(getComputedStyle(inputOf(element)).outlineWidth).toBe('2px');
    });
  });

  describe('typing and the model round trip', () => {
    it('keeps the text and the caret while digits, separators and a partial decimal are typed', async () => {
      const { fixture, component, element } = await render((host) => {
        host.maxFractionDigits.set(2);
      });
      const input = inputOf(element);
      await (await harnessOf(fixture)).focus();
      const caret = (): number | null => input.selectionStart;

      await userEvent.keyboard('1234');
      await expect.poll(textOf(element)).toBe('1,234');
      expect(caret()).toBe(5);
      expect(component.value()).toBe(1234);

      await userEvent.keyboard('.');
      await expect.poll(textOf(element)).toBe('1,234.');
      expect(caret()).toBe(6);

      await userEvent.keyboard('5');
      await expect.poll(textOf(element)).toBe('1,234.5');
      expect(component.value()).toBe(1234.5);

      await userEvent.keyboard('0');
      await expect.poll(textOf(element)).toBe('1,234.50');
      expect(caret()).toBe(8);
      expect(component.value()).toBe(1234.5);

      await userEvent.keyboard('7');
      await expect.poll(textOf(element)).toBe('1,234.50');
      await fixture.whenStable();
      expect(textOf(element)()).toBe('1,234.50');
    });

    it('keeps a minus sign typed on its own, and a zero decimal, until the digits come', async () => {
      const { fixture, component, element } = await render((host) => {
        host.maxFractionDigits.set(2);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('-');
      await expect.poll(textOf(element)).toBe('-');
      await fixture.whenStable();
      expect(textOf(element)()).toBe('-');

      await userEvent.keyboard('5');
      await expect.poll(textOf(element)).toBe('-5');
      expect(component.value()).toBe(-5);

      await userEvent.keyboard('.0');
      await expect.poll(textOf(element)).toBe('-5.0');
      await fixture.whenStable();
      expect(textOf(element)()).toBe('-5.0');
      expect(component.value()).toBe(-5);

      await userEvent.keyboard('4');
      await expect.poll(textOf(element)).toBe('-5.04');
      expect(component.value()).toBe(-5.04);
    });

    it('reports a lone minus sign as null, not as text, and keeps it on screen', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(5);
      });
      const input = inputOf(element);
      await (await harnessOf(fixture)).focus();
      input.setSelectionRange(0, input.value.length);

      await userEvent.keyboard('-');

      await expect.poll(() => component.value()).toBeNull();
      await fixture.whenStable();
      expect(input.value).toBe('-');

      await userEvent.keyboard('3');
      await expect.poll(() => component.value()).toBe(-3);
      expect(input.value).toBe('-3');
    });

    it('puts a digit typed in the middle at the caret, and the caret after it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(1234);
      });
      const input = inputOf(element);
      await (await harnessOf(fixture)).focus();
      input.setSelectionRange(3, 3);

      await userEvent.keyboard('9');

      await expect.poll(textOf(element)).toBe('12,934');
      await fixture.whenStable();
      expect(textOf(element)()).toBe('12,934');
      expect(input.selectionStart).toBe(4);
      expect(component.value()).toBe(12934);
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const number = await harnessOf(fixture);
        expect(await number.getText()).toBe('5');

        await number.clear();
        await number.typeText('42');
        await fixture.whenStable();
        expect(component.value()).toBe(42);

        component.value.set(7);
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await number.getText()).toBe('7');
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const number = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await number.focus();
        await number.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await number.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const number = await harnessOf(fixture);
        expect(await number.getText()).toBe('5');

        await number.clear();
        await number.typeText('42');
        expect(component.control.value).toBe(42);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(8);
        expect(await number.getText()).toBe('8');
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const number = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await number.focus();
        await number.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await number.isDisabled()).toBe(true);

        component.control.enable();
        expect(await number.isDisabled()).toBe(false);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(8);

        expect(component.control.dirty).toBe(false);
      });

      it('shows an empty input for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getText()).toBe('');
      });

      it('honours updateOn blur: the control changes when the input blurs, not while typing', async () => {
        const { fixture, component } = await renderAs(BlurHost);
        const number = await harnessOf(fixture);
        expect(await number.getText()).toBe('5');
        await number.focus();
        await number.clear();

        await number.typeText('42');
        await fixture.whenStable();
        expect(component.control.value).toBe(5);
        expect(await number.getText()).toBe('42');

        await number.blur();
        expect(component.control.value).toBe(42);
        expect(component.control.touched).toBe(true);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const tickets = (await allHarnessesOf(fixture))(0);
        expect(await tickets.getText()).toBe('5');

        await tickets.clear();
        await tickets.typeText('8');
        await fixture.whenStable();
        expect(component.value().tickets).toBe(8);

        component.model.tickets().value.set(3);
        await fixture.whenStable();
        expect(await tickets.getText()).toBe('3');
      });

      it('pushes the schema’s min and max into the input', async () => {
        const { fixture } = await renderAs(SignalHost);
        const tickets = (await allHarnessesOf(fixture))(0);

        expect(await tickets.getMin()).toBe(1);
        expect(await tickets.getMax()).toBe(10);
      });

      it('disables the control and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const tickets = (await allHarnessesOf(fixture))(0);
        expect(component.model.tickets().touched()).toBe(false);

        await tickets.focus();
        await tickets.blur();
        expect(component.model.tickets().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await tickets.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.typeText('4');
        await bare.blur();
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component } = await render();
      const number = await harnessOf(fixture);

      await number.typeText('42');
      expect(component.value()).toBe(42);

      await number.focus();
      await number.blur();
      expect(await number.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id that the label points at, and is named by the label', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const number = await harnessOf(fixture);
      const label = element.querySelector('label');
      const field = await fieldOf(fixture);

      expect(await number.getId()).toMatch(/^wj-inputnumber-\d+$/);
      expect(label?.getAttribute('for')).toBe(await number.getId());
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('fills the width of the field, spin buttons included', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.showButtons.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(find(element, 'wj-inputnumber', HTMLElement).getBoundingClientRect().width).toBe(
        fieldBox.width,
      );
      expect(find(element, 'p-inputnumber', HTMLElement).getBoundingClientRect().width).toBe(
        fieldBox.width,
      );
    });

    it('adopts its own inputId and merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);
      const field = await fieldOf(fixture);

      expect(await inField.getId()).toBe('mine');
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
      const number = await harnessOf(fixture);
      expect((await number.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await number.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await number.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const number = await harnessOf(fixture);
      expect(await number.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Enter a quantity.');
      await fixture.whenStable();
      expect(await number.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await number.isInvalid()).toBe(false);
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });

    it('paints only the input invalid: a spin button keeps its own boundary', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.showButtons.set(true);
        host.error.set('Enter a quantity.');
      });
      await pointerAway(element);

      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);
      expect(getComputedStyle(incrementOf(element)).borderTopColor).not.toBe(INVALID_BORDER);
      expect(getComputedStyle(decrementOf(element)).borderTopColor).not.toBe(INVALID_BORDER);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const number = await harnessOf(fixture);

      expect(await number.getId()).toBe('');
      expect((await number.getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s inputId and ariaDescribedBy, and a <label for> names it', async () => {
      const { fixture, element } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
      expect(element.querySelector('label[for=plain]')?.textContent).toBe('Plain');
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component, element } = await render();
      const number = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await number.isInvalid()).toBe(true);

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
      const number = await harnessOf(fixture);

      expect(await number.getId()).toBe('mine');
      expect(await number.getAriaAttributes()).toEqual({
        label: 'Quantity',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('the input is a spin button with the value and range', async () => {
      const { fixture, element } = await render((host) => {
        host.min.set(1);
        host.max.set(12);
        host.value.set(2);
      });
      await fixture.whenStable();

      expect(inputOf(element).getAttribute('role')).toBe('spinbutton');
      expect(inputOf(element).getAttribute('aria-valuenow')).toBe('2');
      expect(inputOf(element).getAttribute('aria-valuemin')).toBe('1');
      expect(inputOf(element).getAttribute('aria-valuemax')).toBe('12');
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const number = await harnessOf(fixture);

      expect((await number.getAriaAttributes()).label).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-inputnumber: aria-label is set on the host, where it is not forwarded to the ' +
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

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('WJ0001: wj-inputnumber'));
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
      const number = await harnessOf(fixture);

      expect(await number.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await number.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on placeholder, prefix and suffix as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.placeholder.set(PAYLOAD);
        host.prefix.set(PAYLOAD);
        host.suffix.set(PAYLOAD);
        host.value.set(5);
      });
      const number = await harnessOf(fixture);

      expect(await number.getPlaceholder()).toBe(PAYLOAD);
      expect(await number.getText()).toBe(`${PAYLOAD}5${PAYLOAD}`);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by placeholder', async () => {
      const { fixture } = await renderAs(Host, (host) => {
        host.placeholder.set('Hint');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(
        WjInputNumberHarness.with({ ariaLabel: /^Qua/ }),
      );
      const byPlaceholder = await loader.getAllHarnesses(
        WjInputNumberHarness.with({ placeholder: 'Hint' }),
      );
      const none = await loader.getAllHarnesses(WjInputNumberHarness.with({ ariaLabel: 'Other' }));

      expect(byLabel).toHaveLength(1);
      expect(byPlaceholder).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('steps with increment and decrement, and commits with commit', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(5);
        host.minFractionDigits.set(2);
      });
      const number = await harnessOf(fixture);

      await number.focus();
      await number.increment();
      await number.increment();
      await number.decrement();
      await fixture.whenStable();
      expect(component.value()).toBe(6);

      await number.clear();
      await number.typeText('7');
      await number.commit();
      await fixture.whenStable();
      expect(await number.getText()).toBe('7.00');
      expect(await number.getValue()).toBe(7);
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const number = await harnessOf(fixture);
      expect(await number.isFocused()).toBe(false);

      await number.focus();
      expect(await number.isFocused()).toBe(true);

      await number.blur();
      expect(await number.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-inputnumber', HTMLElement),
        );
      });
    });
  });

  describe('keyboard', () => {
    it('Tab goes to the input and skips the spin buttons and a disabled control', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(true);

      await userEvent.tab();
      expect(await at(2).isFocused()).toBe(true);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await at(2).isFocused()).toBe(true);
    });

    it('ArrowUp and ArrowDown step by step, and the value follows the model', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(10);
        host.step.set(5);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => component.value()).toBe(15);

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await expect.poll(() => component.value()).toBe(5);
    });

    it('Home goes to min and End to max when they are set', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(2);
        host.max.set(20);
        host.value.set(10);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{Home}');
      await expect.poll(() => component.value()).toBe(2);

      await userEvent.keyboard('{End}');
      await expect.poll(() => component.value()).toBe(20);
    });

    it('Home reaches a min of 0, in the model and in the text', async () => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(0);
        host.max.set(10);
        host.value.set(7);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{Home}');

      await expect.poll(() => component.value()).toBe(0);
      await expect.poll(textOf(element)).toBe('0');
    });

    it('End reaches a max of 0, in the model and in the text', async () => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(-10);
        host.max.set(0);
        host.value.set(-3);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{End}');

      await expect.poll(() => component.value()).toBe(0);
      await expect.poll(textOf(element)).toBe('0');
    });

    it('Home reaches a min of 0 after End has gone to the max', async () => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(0);
        host.max.set(10);
        host.value.set(7);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{End}');
      await expect.poll(() => component.value()).toBe(10);
      await userEvent.keyboard('{Home}');
      await expect.poll(() => component.value()).toBe(0);
      await expect.poll(textOf(element)).toBe('0');
    });

    it('Home goes to a min of 1 as before: the control', async () => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(1);
        host.max.set(10);
        host.value.set(7);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{Home}');

      await expect.poll(() => component.value()).toBe(1);
      await expect.poll(textOf(element)).toBe('1');
    });

    it('Enter commits and formats what was typed', async () => {
      const { fixture, component, element } = await render((host) => {
        host.minFractionDigits.set(2);
        host.maxFractionDigits.set(2);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('12{Enter}');

      await expect.poll(textOf(element)).toBe('12.00');
      expect(component.value()).toBe(12);
    });

    it('Tab commits and formats what was typed, and moves on', async () => {
      const { fixture, component, element } = await render((host) => {
        host.minFractionDigits.set(2);
        host.maxFractionDigits.set(2);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('3');
      await userEvent.tab();

      await expect.poll(textOf(element)).toBe('3.00');
      expect(component.value()).toBe(3);
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('Backspace and Delete edit across the group separator', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(1234);
      });
      const input = inputOf(element);
      await (await harnessOf(fixture)).focus();

      input.setSelectionRange(5, 5);
      await userEvent.keyboard('{Backspace}');
      await expect.poll(textOf(element)).toBe('123');
      expect(component.value()).toBe(123);

      component.value.set(1234);
      await fixture.whenStable();
      input.setSelectionRange(2, 2);
      await userEvent.keyboard('{Backspace}');
      await expect.poll(textOf(element)).toBe('234');
      expect(component.value()).toBe(234);

      component.value.set(1234);
      await fixture.whenStable();
      input.setSelectionRange(0, 0);
      await userEvent.keyboard('{Delete}');
      await expect.poll(textOf(element)).toBe('234');
      expect(component.value()).toBe(234);
    });

    it('rejects characters outside the number format', async () => {
      const { fixture, component, element } = await render();
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('a!b');
      await fixture.whenStable();
      expect(textOf(element)()).toBe('');
      expect(component.value()).toBeNull();

      await userEvent.keyboard('1a2');
      await expect.poll(textOf(element)).toBe('12');
      expect(component.value()).toBe(12);
    });

    it('clamps to min and max when the input blurs', async () => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(1);
        host.max.set(12);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('99');
      await userEvent.tab();

      await expect.poll(textOf(element)).toBe('12');
      expect(component.value()).toBe(12);
    });
  });
});
