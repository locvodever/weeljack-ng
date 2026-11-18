import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import {
  FormField,
  disabled as disabledRule,
  form,
  required,
  submit,
} from '@angular/forms/signals';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjInputMask, type WjInputMaskPt, type WjInputMaskSize } from 'weeljack-ng/inputmask';
import { WjInputMaskHarness } from 'weeljack-ng/inputmask/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const PHONE = '(999) 999-9999';
/** What the phone mask shows once the input has focus and nothing is typed. */
const PHONE_EMPTY = '(___) ___-____';
const PHONE_FULL = '(555) 012-3456';
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

/** A consumer's template: one bare masked input, or the same input inside a field. */
@Component({
  selector: 'wj-inputmask-host',
  imports: [WjField, WjInputMask],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Phone" [hint]="hint()" [error]="error()">
        <input
          [wjInputMask]="mask()"
          [slotChar]="slotChar()"
          [autoClear]="autoClear()"
          [size]="size()"
          [pt]="pt()"
          [invalid]="invalid()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="value()"
          (completed)="completedCount.update(bump)"
          (unmaskedChange)="unmasked.set($event)"
        />
      </wj-field>
    } @else {
      <input
        [wjInputMask]="mask()"
        [slotChar]="slotChar()"
        [autoClear]="autoClear()"
        aria-label="Phone"
        [size]="size()"
        [pt]="pt()"
        [invalid]="invalid()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        (completed)="completedCount.update(bump)"
        (unmaskedChange)="unmasked.set($event)"
      />
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly mask = signal(PHONE);
  readonly slotChar = signal('_');
  readonly autoClear = signal(true);
  readonly size = signal<WjInputMaskSize | undefined>(undefined);
  readonly pt = signal<WjInputMaskPt>(undefined);
  readonly invalid = signal(false);
  readonly placeholder = signal('');
  readonly disabled = signal(false);
  readonly value = signal('');
  readonly completedCount = signal(0);
  readonly unmasked = signal<string | null>(null);

  protected readonly bump = (count: number): number => count + 1;
}

/** A field around an input that sets its own static `id` and `aria-describedby`. */
@Component({
  selector: 'wj-inputmask-static-host',
  imports: [WjField, WjInputMask],
  template: `
    <p id="note">Note</p>
    <wj-field label="Phone" hint="Hint" error="Error">
      <input wjInputMask="(999) 999-9999" id="mine" aria-describedby="note" />
    </wj-field>
  `,
})
class StaticAttributesHost {}

/** The same static attributes on an input outside any field. */
@Component({
  selector: 'wj-inputmask-bare-static-host',
  imports: [WjInputMask],
  template: `
    <p id="note">Note</p>
    <label for="mine">Phone</label>
    <input wjInputMask="(999) 999-9999" id="mine" aria-describedby="note" />
    <input wjInputMask="(999) 999-9999" aria-label="Other" />
  `,
})
class BareStaticAttributesHost {}

/** A static mask, as the docs write it. */
@Component({
  selector: 'wj-inputmask-static-mask-host',
  imports: [WjInputMask],
  template: `<input wjInputMask="99/99/9999" aria-label="Date" />`,
})
class StaticMaskHost {}

/** Every height step, so one render measures them all. */
@Component({
  selector: 'wj-inputmask-gallery-host',
  imports: [WjInputMask],
  template: `
    <input wjInputMask="(999) 999-9999" size="small" aria-label="Small" />
    <input wjInputMask="(999) 999-9999" aria-label="Default" />
    <input wjInputMask="(999) 999-9999" size="large" aria-label="Large" />
  `,
})
class GalleryHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-inputmask-ngmodel-host',
  imports: [WjField, WjInputMask, FormsModule],
  template: `
    <wj-field label="Phone">
      <input wjInputMask="(999) 999-9999" [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>(PHONE_FULL);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` inside a field, with an initial masked value. */
@Component({
  selector: 'wj-inputmask-reactive-host',
  imports: [WjField, WjInputMask, ReactiveFormsModule],
  template: `
    <wj-field label="Phone">
      <input wjInputMask="(999) 999-9999" [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl(PHONE_FULL, { nonNullable: true });
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-inputmask-signal-host',
  imports: [WjField, WjInputMask, FormField],
  template: `
    <form novalidate (submit)="onSubmit($event)">
      <wj-field label="Phone">
        <input wjInputMask="(999) 999-9999" [formField]="model.phone" />
      </wj-field>
      <input wjInputMask="(999) 999-9999" aria-label="Bare" [formField]="model.bare" />
      <button type="submit">Save</button>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal({ phone: PHONE_FULL, bare: '' });
  readonly model = form(this.value, (path) => {
    required(path.phone, { message: 'Enter a phone number.' });
    required(path.bare, { message: 'Enter a value.' });
    disabledRule(path.phone, { when: () => this.off() });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.model, () => Promise.resolve());
  }
}

/** A bare invalid attribute. */
@Component({
  selector: 'wj-inputmask-bare-invalid-host',
  imports: [WjInputMask],
  template: `<input wjInputMask="(999) 999-9999" aria-label="Phone" invalid />`,
})
class BareInvalidHost {}

/** Three masked inputs for the keyboard spec, the middle one disabled. */
@Component({
  selector: 'wj-inputmask-keyboard-host',
  imports: [WjInputMask],
  template: `
    <button type="button" id="before">Before</button>
    <input wjInputMask="(999) 999-9999" aria-label="First" />
    <input wjInputMask="(999) 999-9999" aria-label="Disabled" disabled />
    <input wjInputMask="(999) 999-9999" aria-label="Last" />
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
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');
  return { fixture, component: fixture.componentInstance, element };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered<Host>> => renderAs(Host, setup, scheme);

function inputsOf(element: HTMLElement): HTMLInputElement[] {
  return Array.from(element.querySelectorAll<HTMLInputElement>('input[wjInputMask]'));
}

function inputOf(element: HTMLElement): HTMLInputElement {
  const [input] = inputsOf(element);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('input[wjInputMask] is missing');
  }
  return input;
}

function byId(element: HTMLElement, id: string): HTMLElement {
  const found = element.querySelector(`#${id}`);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`#${id} is missing`);
  }
  return found;
}

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjInputMaskHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputMaskHarness);
}

/** The inputs of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjInputMaskHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjInputMaskHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no input[wjInputMask] at index ${String(index)}`);
    }
    return found;
  };
}

function fieldOf(fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
}

/**
 * Focuses the input and waits until Optimus has finished placing the caret. Optimus writes the
 * mask and places the caret from a 10 ms timer after focus, and a key pressed before that lands
 * on a stale caret. Polling the shown text is not enough: it does not change when the input
 * already shows `shown` (a full value, or a mask already on display), so the poll would pass
 * before the timer ran.
 *
 * The timer leaves the caret on the first unfilled slot, or selects everything when no slot is
 * left. A focus listener, registered after Optimus's own, parks the selection somewhere else
 * before the timer can fire, so the expected selection only appears once the timer has run. No
 * sleep: the spec polls the state the user would see.
 */
async function focusMasked(
  input: WjInputMaskHarness,
  shown: string,
  slotChar = '_',
): Promise<void> {
  const element = TestbedHarnessEnvironment.getNativeElement(await input.host());
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('input[wjInputMask] is missing');
  }
  const slot = shown.indexOf(slotChar);
  const expected = slot === -1 ? { start: 0, end: shown.length } : { start: slot, end: slot };
  const parked = expected.start === 0 ? shown.length : 0;
  const park = (): void => {
    element.setSelectionRange(parked, parked);
  };
  element.addEventListener('focus', park, { once: true });
  await input.focus();
  await expect.poll(() => input.getValue()).toBe(shown);
  await expect
    .poll(() => [element.selectionStart, element.selectionEnd])
    .toEqual([expected.start, expected.end]);
}

const STATES: [string, (host: Host) => void][] = [
  [
    'empty with a placeholder',
    (host) => {
      host.placeholder.set('(555) 555-0123');
    },
  ],
  [
    'partially filled',
    (host) => {
      host.value.set('(555) 0__-____');
    },
  ],
  [
    'complete',
    (host) => {
      host.value.set(PHONE_FULL);
    },
  ],
  [
    'disabled',
    (host) => {
      host.disabled.set(true);
      host.value.set(PHONE_FULL);
    },
  ],
  [
    'small',
    (host) => {
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Include the area code.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Enter the full number.');
    },
  ],
];

describe('WjInputMask', () => {
  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
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

  describe('inputs and outputs', () => {
    it('size steps the height: 36 px small, 44 px default, 52 px large', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(GalleryHost);
      await fixture.whenStable();

      const heights = inputsOf(fixture.nativeElement as HTMLElement).map(
        (input) => input.getBoundingClientRect().height,
      );

      expect(heights).toEqual([36, 44, 52]);
    });

    it('size follows the bound value and writes no native size attribute', async () => {
      const { element, component, fixture } = await render();
      expect(inputOf(element).getBoundingClientRect().height).toBe(44);

      component.size.set('small');
      await fixture.whenStable();

      expect(inputOf(element).getBoundingClientRect().height).toBe(36);
      expect(inputOf(element).hasAttribute('size')).toBe(false);
    });

    it('wjInputMask is the mask, as a static attribute', async () => {
      const { fixture, element } = await renderAs(StaticMaskHost);
      const input = await harnessOf(fixture);

      await focusMasked(input, '__/__/____');

      expect(inputOf(element).value).toBe('__/__/____');
    });

    it('wjInputMask bound to a signal can change the mask, and the harness still finds it', async () => {
      const { fixture, component } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);
      await input.blur();

      component.mask.set('aaa-9999');
      await fixture.whenStable();
      await focusMasked(input, '___-____');
    });

    it('slotChar replaces the slot character', async () => {
      const { fixture } = await render((host) => {
        host.slotChar.set('#');
      });
      const input = await harnessOf(fixture);

      await focusMasked(input, '(###) ###-####', '#');
    });

    it('autoClear clears an incomplete value on blur, and keeps it when off', async () => {
      const { fixture, component } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);
      await userEvent.keyboard('555');
      expect(await input.getValue()).toBe('(555) ___-____');

      await input.blur();
      expect(await input.getValue()).toBe('');

      component.autoClear.set(false);
      await fixture.whenStable();
      await focusMasked(input, PHONE_EMPTY);
      await userEvent.keyboard('555');
      await input.blur();
      expect(await input.getValue()).toBe('(555) ___-____');
    });

    it('completed emits once the required slots are filled', async () => {
      const { fixture, component } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);

      await userEvent.keyboard('555012345');
      expect(component.completedCount()).toBe(0);

      await userEvent.keyboard('6');
      expect(component.completedCount()).toBe(1);
      expect(await input.getValue()).toBe(PHONE_FULL);
    });

    it('unmaskedChange emits the value without literals or slot characters', async () => {
      const { fixture, component } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);

      await userEvent.keyboard('5550');

      expect(component.unmasked()).toBe('5550');
      expect(await input.getValue()).toBe('(555) 0__-____');
    });

    it('pt reaches the root, which is the input itself, and survives state changes', async () => {
      const { element, component, fixture } = await render((host) => {
        host.pt.set({ root: { 'data-probe': 'yes' } });
      });
      expect(inputOf(element).getAttribute('data-probe')).toBe('yes');

      component.size.set('large');
      component.disabled.set(true);
      await fixture.whenStable();
      expect(inputOf(element).getAttribute('data-probe')).toBe('yes');

      component.pt.set({ root: { 'data-probe': 'no' } });
      await fixture.whenStable();
      expect(inputOf(element).getAttribute('data-probe')).toBe('no');
    });

    it('invalid shows the invalid border and aria-invalid', async () => {
      const { element, component, fixture } = await render();
      const input = await harnessOf(fixture);
      expect(await input.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await input.isInvalid()).toBe(true);
      await pointerAway(element);
      await expect
        .poll(() => getComputedStyle(inputOf(element)).borderTopColor)
        .toBe(INVALID_BORDER);
    });

    it('reads a bare invalid attribute as true', async () => {
      const { fixture } = await renderAs(BareInvalidHost);

      expect(await (await harnessOf(fixture)).isInvalid()).toBe(true);
    });

    it('leaves the native attributes native', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set('(555) 555-0123');
        host.disabled.set(true);
      });
      const input = await harnessOf(fixture);

      expect(await input.getPlaceholder()).toBe('(555) 555-0123');
      expect(await input.isDisabled()).toBe(true);
      expect(await input.isRequired()).toBe(false);
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('shows the masked value written in, and writes the typed text out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const input = await harnessOf(fixture);
        expect(await input.getValue()).toBe(PHONE_FULL);

        component.value.set('');
        await fixture.whenStable();
        await focusMasked(input, PHONE_EMPTY);
        await userEvent.keyboard('5550');
        await fixture.whenStable();

        expect(component.value()).toBe('(555) 0__-____');
      });

      it('disables the input and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const input = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await input.focus();
        await input.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await input.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows the initial and a written value, and writes the typed text out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const input = await harnessOf(fixture);
        expect(await input.getValue()).toBe(PHONE_FULL);

        component.control.setValue('(555) 555-0123');
        expect(await input.getValue()).toBe('(555) 555-0123');

        component.control.setValue('');
        await focusMasked(input, PHONE_EMPTY);
        await userEvent.keyboard('5550');

        expect(component.control.value).toBe('(555) 0__-____');
      });

      it('disables the input and marks the control touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const input = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await input.focus();
        await input.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await input.isDisabled()).toBe(true);
      });
    });

    describe('[formField]', () => {
      it('shows the masked value written in, and writes the typed text out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const phone = (await allHarnessesOf(fixture))(0);
        expect(await phone.getValue()).toBe(PHONE_FULL);

        component.model.phone().value.set('');
        await fixture.whenStable();
        await focusMasked(phone, PHONE_EMPTY);
        await userEvent.keyboard('5550');
        await fixture.whenStable();

        expect(component.value().phone).toBe('(555) 0__-____');
      });

      it('disables the input and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const phone = (await allHarnessesOf(fixture))(0);
        expect(component.model.phone().touched()).toBe(false);

        await phone.focus();
        await phone.blur();
        expect(component.model.phone().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await phone.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid state onto an input outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);
        expect(await bare.isInvalid()).toBe(true);

        await focusMasked(bare, PHONE_EMPTY);
        await userEvent.keyboard('5');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });
  });

  describe('inside a field', () => {
    it('gets a generated id that the label points at, and is named by the label', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const input = await harnessOf(fixture);
      const label = element.querySelector('label');

      expect(await input.getId()).toMatch(/^wj-inputmask-\d+$/);
      expect(label?.getAttribute('for')).toBe(await input.getId());
      expect(await (await fieldOf(fixture)).isGroup()).toBe(false);
    });

    it('adopts a static id and merges a static aria-describedby before the field’s ids', async () => {
      const { fixture } = await renderAs(StaticAttributesHost);
      const input = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const { describedBy } = await input.getAriaAttributes();

      expect(await input.getId()).toBe('mine');
      expect(describedBy).toMatch(/^note wj-field-hint-\d+ wj-field-error-\d+$/);
      expect(await field.getHint()).toBe('Hint');
      expect(await field.getError()).toBe('Error');
    });

    it('describes the input with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const input = await harnessOf(fixture);
      expect((await input.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await input.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await input.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const input = await harnessOf(fixture);
      expect(await input.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Enter the full number.');
      await fixture.whenStable();
      expect(await input.isInvalid()).toBe(true);
      await pointerAway(element);
      // Polled: the border colour can still be on its way under a loaded suite.
      await expect
        .poll(() => getComputedStyle(inputOf(element)).borderTopColor)
        .toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await input.isInvalid()).toBe(false);
    });

    it('shows a signal-forms error only once the input is touched', async () => {
      const { fixture, component } = await renderAs(SignalHost);
      const phone = (await allHarnessesOf(fixture))(0);
      const field = await fieldOf(fixture);

      component.model.phone().value.set('');
      await fixture.whenStable();
      expect(await phone.isInvalid()).toBe(false);

      await phone.focus();
      await phone.blur();
      await fixture.whenStable();
      expect(await phone.isInvalid()).toBe(true);
      expect(await field.getError()).toBe('Enter a phone number.');
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);

      expect(await input.getId()).toBe('');
      expect((await input.getAriaAttributes()).describedBy).toBeNull();
    });

    it('leaves a static id and aria-describedby as the consumer wrote them', async () => {
      const { fixture } = await renderAs(BareStaticAttributesHost);
      const at = await allHarnessesOf(fixture);
      const first = at(0);
      const second = at(1);

      expect(await first.getId()).toBe('mine');
      expect((await first.getAriaAttributes()).describedBy).toBe('note');
      expect(await second.getId()).toBe('');
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const input = await harnessOf(fixture);
      expect(await input.isInvalid()).toBe(false);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await input.isInvalid()).toBe(true);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload as the value and as the placeholder as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(PAYLOAD);
        host.placeholder.set(PAYLOAD);
      });
      const input = await harnessOf(fixture);

      expect(await input.getValue()).toBe(PAYLOAD);
      expect(await input.getPlaceholder()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('treats an HTML payload as the mask as literal text, and creates nothing', async () => {
      const { fixture, element } = await render((host) => {
        host.mask.set(PAYLOAD);
      });
      const input = await harnessOf(fixture);
      await input.focus();
      await expect.poll(() => input.getValue()).not.toBe('');

      expect(inputOf(element).value).toContain('<img');
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by placeholder', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set('(555) 555-0123');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const found = await loader.getAllHarnesses(
        WjInputMaskHarness.with({ placeholder: /^\(555/ }),
      );
      const none = await loader.getAllHarnesses(WjInputMaskHarness.with({ placeholder: 'other' }));

      expect(found).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('reads the ARIA attributes and the focus state', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);

      expect(await input.getAriaAttributes()).toEqual({
        label: 'Phone',
        labelledBy: null,
        describedBy: null,
      });
      expect(await input.isFocused()).toBe(false);

      await input.focus();
      expect(await input.isFocused()).toBe(true);

      await input.blur();
      expect(await input.isFocused()).toBe(false);
    });

    it('types text one key at a time and clears', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);

      await input.typeText('5550');
      expect(await input.getValue()).toBe('(555) 0__-____');

      await input.clear();
      expect(await input.getValue()).toBe('');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(element.querySelector('wj-field') ?? inputOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab and Shift+Tab move focus in document order and skip a disabled input', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      const first = at(0);
      const last = at(2);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await first.isFocused()).toBe(true);

      await userEvent.tab();
      expect(await last.isFocused()).toBe(true);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await last.isFocused()).toBe(true);

      await userEvent.tab({ shift: true });
      expect(await first.isFocused()).toBe(true);
    });

    it('typing fills the next slot and skips the literals', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);

      await userEvent.keyboard('555');
      expect(await input.getValue()).toBe('(555) ___-____');

      await userEvent.keyboard('0123456');
      expect(await input.getValue()).toBe(PHONE_FULL);
    });

    it('does not accept a character the mask rejects', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);

      await userEvent.keyboard('5a5');

      expect(await input.getValue()).toBe('(55_) ___-____');
    });

    it('Backspace clears the slot before the caret', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);
      await userEvent.keyboard('5550');

      await userEvent.keyboard('{Backspace}');
      expect(await input.getValue()).toBe('(555) ___-____');

      await userEvent.keyboard('{Backspace}');
      expect(await input.getValue()).toBe('(55_) ___-____');
    });

    it('Delete clears the slot at the caret', async () => {
      const { fixture, element } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);
      await userEvent.keyboard('5550');
      inputOf(element).setSelectionRange(1, 1);

      await userEvent.keyboard('{Delete}');

      expect(await input.getValue()).toBe('(550) ___-____');
    });

    it('Escape restores the text the input had when it got focus', async () => {
      const { fixture } = await render((host) => {
        host.value.set(PHONE_FULL);
      });
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_FULL);

      // A full value is selected whole on focus, so Backspace clears all of it, as it does for a user.
      await userEvent.keyboard('{Backspace}');
      expect(await input.getValue()).toBe(PHONE_EMPTY);

      await userEvent.keyboard('{Escape}');
      expect(await input.getValue()).toBe(PHONE_FULL);
    });

    it('Enter checks completeness as blur does', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);
      await focusMasked(input, PHONE_EMPTY);
      await userEvent.keyboard('555');
      expect(await input.getValue()).toBe('(555) ___-____');

      await userEvent.keyboard('{Enter}');

      expect(await input.getValue()).toBe('');
      expect(await input.isFocused()).toBe(true);
    });
  });
});
