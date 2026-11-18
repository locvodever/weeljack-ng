/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjInputOtp, type WjInputOtpPt, type WjInputOtpSize } from 'weeljack-ng/inputotp';
import { WjInputOtpHarness } from 'weeljack-ng/inputotp/testing';
import { vi as vietnamese } from 'weeljack-ng/locale';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/**
 * Parks the pointer on the host's "After" button before a border read. The pointer is page-wide in
 * browser mode, so an earlier test can leave it over a box, and Optimus's hover border outranks the
 * invalid one.
 */
async function pointerAway(element: HTMLElement): Promise<void> {
  const after = element.querySelector<HTMLElement>('#after');
  if (after === null) throw new Error('The host has no #after button.');
  await userEvent.hover(after);
}

/** A consumer's template: one bare OTP input, or the same one inside a field. */
@Component({
  selector: 'wj-inputotp-host',
  imports: [WjField, WjInputOtp],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Verification code" [hint]="hint()" [error]="error()">
        <wj-inputotp
          [(value)]="value"
          [pt]="pt()"
          [length]="length()"
          [integerOnly]="integerOnly()"
          [mask]="mask()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
        />
      </wj-field>
    } @else {
      <wj-inputotp
        ariaLabel="Verification code"
        [(value)]="value"
        [pt]="pt()"
        [length]="length()"
        [integerOnly]="integerOnly()"
        [mask]="mask()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
      />
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string | null>(null);
  readonly pt = signal<WjInputOtpPt>(undefined);
  readonly length = signal(4);
  readonly integerOnly = signal(false);
  readonly mask = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjInputOtpSize | undefined>(undefined);
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-inputotp-aria-host',
  imports: [WjInputOtp],
  template: `
    <wj-inputotp
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Verification code');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-inputotp-aria-on-host-host',
  imports: [WjInputOtp],
  template: `<wj-inputotp aria-label="Verification code" />`,
})
class AriaOnHostHost {}

/** A consumer's own label and description, with and without a field. */
@Component({
  selector: 'wj-inputotp-own-ids-host',
  imports: [WjInputOtp, WjField],
  template: `
    <p id="note">Note</p>
    <span id="plain">Plain</span>
    <wj-inputotp ariaLabelledBy="plain" ariaDescribedBy="note" />
    <wj-field label="Verification code" hint="Hint" error="Error">
      <wj-inputotp inputId="mine" ariaLabelledBy="plain" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-inputotp-ngmodel-host',
  imports: [WjField, WjInputOtp, FormsModule],
  template: `
    <wj-field label="Verification code">
      <wj-inputotp [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>('1234');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-inputotp-reactive-host',
  imports: [WjField, WjInputOtp, ReactiveFormsModule],
  template: `
    <wj-field label="Verification code">
      <wj-inputotp [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<string | null>('1234');
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-inputotp-signal-host',
  imports: [WjField, WjInputOtp, FormField],
  template: `
    <wj-field label="Verification code">
      <wj-inputotp [formField]="model.code" />
    </wj-field>
    <wj-inputotp ariaLabel="Bare" [formField]="model.bare" />
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ code: string | null; bare: string | null }>({
    code: '1234',
    bare: null,
  });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Enter it.' });
    disabledRule(path.code, { when: () => this.off() });
  });
}

/** Controls for the keyboard spec. */
@Component({
  selector: 'wj-inputotp-keyboard-host',
  imports: [WjInputOtp],
  template: `
    <button type="button" id="before">Before</button>
    <wj-inputotp ariaLabel="First" [(value)]="value" />
    <wj-inputotp ariaLabel="Digits" integerOnly [(value)]="digits" />
    <wj-inputotp ariaLabel="Disabled" disabled />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly value = signal<string | null>(null);
  readonly digits = signal<string | null>(null);
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
  expect(boxesOf(element)[0]?.getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
  return { fixture, component: fixture.componentInstance, element };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation: Parameters<typeof provideWeeljack>[0] = {},
): Promise<Rendered<Host>> => renderAs(Host, setup, scheme, translation);

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The boxes of the fixture's first OTP input, in order. */
const boxesOf = (element: HTMLElement): HTMLInputElement[] =>
  Array.from(element.querySelectorAll<HTMLInputElement>('wj-inputotp input.p-inputtext'));

function boxAt(element: HTMLElement, index: number): HTMLInputElement {
  const box = boxesOf(element)[index];
  if (box === undefined) throw new Error(`no box at index ${String(index)}`);
  return box;
}

const valuesOf = (element: HTMLElement): string[] => boxesOf(element).map((box) => box.value);

const groupOf = (element: HTMLElement): HTMLElement => find(element, 'p-inputotp', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjInputOtpHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputOtpHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjInputOtpHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjInputOtpHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-inputotp at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/** Focuses the first box and types `text` with real key events, as a user does. */
async function type(element: HTMLElement, text: string): Promise<void> {
  boxAt(element, 0).focus();
  await userEvent.keyboard(text);
}

const STATES: [string, (host: Host) => void][] = [
  [
    'empty',
    () => {
      // nothing set
    },
  ],
  [
    'partly filled',
    (host) => {
      host.value.set('12');
    },
  ],
  [
    'full',
    (host) => {
      host.value.set('1234');
    },
  ],
  [
    'masked',
    (host) => {
      host.mask.set(true);
      host.value.set('1234');
    },
  ],
  [
    'integer only',
    (host) => {
      host.integerOnly.set(true);
      host.length.set(6);
      host.value.set('123456');
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set('1234');
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.value.set('12');
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.size.set('small');
      host.value.set('1234');
    },
  ],
  [
    'large',
    (host) => {
      host.size.set('large');
      host.value.set('1234');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Check your email for the code.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.length.set(6);
      host.error.set('Enter all 6 characters.');
    },
  ],
];

describe('WjInputOtp', () => {
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
    it('value is two-way: the boxes follow it, and typing writes it back', async () => {
      const { fixture, component, element } = await render();
      const otp = await harnessOf(fixture);
      expect(await otp.getValue()).toBe('');

      component.value.set('4821');
      await fixture.whenStable();
      expect(valuesOf(element)).toEqual(['4', '8', '2', '1']);
      expect(await otp.getValue()).toBe('4821');

      await otp.clear();
      await otp.typeCode('73');
      expect(component.value()).toBe('73');
      expect(valuesOf(element)).toEqual(['7', '3', '', '']);
    });

    it('empties the boxes again when the value goes back to null', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('1234');
      });
      expect(valuesOf(element)).toEqual(['1', '2', '3', '4']);

      component.value.set(null);
      await fixture.whenStable();

      expect(valuesOf(element)).toEqual(['', '', '', '']);
    });

    it('reports null, not an empty string, when every box is emptied', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('1');
      });
      boxAt(fixture.nativeElement as HTMLElement, 0).focus();

      await userEvent.keyboard('{Backspace}');

      expect(component.value()).toBeNull();
    });

    it('length sets the number of boxes, and follows the bound value', async () => {
      const { fixture, component, element } = await render();
      const otp = await harnessOf(fixture);
      expect(await otp.getLength()).toBe(4);

      component.length.set(6);
      await fixture.whenStable();
      expect(await otp.getLength()).toBe(6);

      component.length.set(3);
      await fixture.whenStable();
      expect(boxesOf(element)).toHaveLength(3);
    });

    it('reads a static length attribute as a number', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      TestBed.overrideComponent(AriaHost, {
        set: { template: '<wj-inputotp ariaLabel="Code" length="5" />' },
      });
      const fixture = TestBed.createComponent(AriaHost);
      await fixture.whenStable();

      expect(await (await harnessOf(fixture)).getLength()).toBe(5);
    });

    it('integerOnly shows the numeric keypad and rejects a letter', async () => {
      const { fixture, component, element } = await render((host) => {
        host.integerOnly.set(true);
      });
      expect(boxAt(element, 0).getAttribute('inputmode')).toBe('numeric');

      await type(element, 'a1b2');
      await fixture.whenStable();

      expect(component.value()).toBe('12');
      expect(valuesOf(element)).toEqual(['1', '2', '', '']);
    });

    it('without integerOnly the keypad is text and a letter is kept', async () => {
      const { fixture, component, element } = await render();
      expect(boxAt(element, 0).getAttribute('inputmode')).toBe('text');

      await type(element, 'a1');
      await fixture.whenStable();

      expect(component.value()).toBe('a1');
    });

    it('mask turns every box into a password input and follows the bound value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.mask.set(true);
        host.value.set('1234');
      });
      expect(boxesOf(element).every((box) => box.type === 'password')).toBe(true);
      expect(valuesOf(element)).toEqual(['1', '2', '3', '4']);

      component.mask.set(false);
      await fixture.whenStable();
      expect(boxesOf(element).every((box) => box.type === 'text')).toBe(true);
    });

    it('disabled, required and invalid reach every box', async () => {
      const { fixture, component, element } = await render();
      const otp = await harnessOf(fixture);
      expect(await otp.isDisabled()).toBe(false);
      expect(await otp.isRequired()).toBe(false);
      expect(await otp.isInvalid()).toBe(false);
      expect(getComputedStyle(boxAt(element, 0)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await otp.isRequired()).toBe(true);
      expect(await otp.isInvalid()).toBe(true);
      await pointerAway(element);
      for (const box of boxesOf(element)) {
        expect(getComputedStyle(box).borderTopColor).toBe(INVALID_BORDER);
      }

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await otp.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(2).isDisabled()).toBe(true);
    });

    it('size steps the boxes 32 x 36, 40 x 44 and 48 x 52 px, 8 px apart, and follows the value', async () => {
      const { fixture, component, element } = await render();
      const measure = (): { width: number; height: number; gap: number } => {
        const first = boxAt(element, 0).getBoundingClientRect();
        const second = boxAt(element, 1).getBoundingClientRect();
        return {
          width: first.width,
          height: first.height,
          gap: second.left - first.right,
        };
      };
      expect(measure()).toEqual({ width: 40, height: 44, gap: 8 });

      component.size.set('small');
      await fixture.whenStable();
      expect(measure()).toEqual({ width: 32, height: 36, gap: 8 });

      component.size.set('large');
      await fixture.whenStable();
      expect(measure()).toEqual({ width: 48, height: 52, gap: 8 });
    });

    it('keeps every box at least 24 px wide at small, centres the character, and draws no group box', async () => {
      const { element } = await render((host) => {
        host.size.set('small');
        host.value.set('1234');
      });
      const group = getComputedStyle(groupOf(element));

      for (const box of boxesOf(element)) {
        expect(box.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
        expect(getComputedStyle(box).textAlign).toBe('center');
      }
      expect(group.borderTopWidth).toBe('0px');
      expect(group.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('is an inline-flex host that sizes to its boxes and sits at the start', async () => {
      const { element } = await render();
      const host = find(element, 'wj-inputotp', HTMLElement);

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().width).toBe(4 * 40 + 3 * 8);
      expect(host.getBoundingClientRect().left).toBeLessThan(
        boxAt(element, 0).getBoundingClientRect().left + 1,
      );
    });

    it('shrinks the boxes together in a narrow container, to 32 px, and never wraps', async () => {
      const { element } = await render((host) => {
        host.length.set(6);
      });
      const host = find(element, 'wj-inputotp', HTMLElement);
      const tops = (): Set<number> =>
        new Set(boxesOf(element).map((box) => box.getBoundingClientRect().top));
      const widths = (): number[] =>
        boxesOf(element).map((box) => box.getBoundingClientRect().width);

      host.style.maxInlineSize = '260px';
      const shrunk = widths();
      expect(Math.max(...shrunk) - Math.min(...shrunk)).toBeLessThan(1);
      expect(shrunk[0]).toBeGreaterThan(32);
      expect(shrunk[0]).toBeLessThan(40);
      expect(tops().size).toBe(1);

      host.style.maxInlineSize = '120px';
      expect(widths()).toEqual([32, 32, 32, 32, 32, 32]);
      expect(tops().size).toBe(1);
    });
  });

  describe('the names of the boxes (FR-27)', () => {
    it('names every box from wj.otpCharacter, {0} its 1-based position, in the English default', async () => {
      const { fixture } = await render();

      expect(await (await harnessOf(fixture)).getBoxNames()).toEqual([
        'Please enter one time password character 1',
        'Please enter one time password character 2',
        'Please enter one time password character 3',
        'Please enter one time password character 4',
      ]);
    });

    it('reads Vietnamese through the vi locale', async () => {
      const { fixture } = await render(undefined, 'light', { translation: vietnamese });

      expect(await (await harnessOf(fixture)).getBoxNames()).toEqual([
        'Vui lòng nhập ký tự OTP 1',
        'Vui lòng nhập ký tự OTP 2',
        'Vui lòng nhập ký tự OTP 3',
        'Vui lòng nhập ký tự OTP 4',
      ]);
    });

    it('reads an app’s own text, and keeps the default when wj has no otpCharacter', async () => {
      const own = await render(undefined, 'light', {
        translation: { wj: { otpCharacter: 'Digit {0}' } },
      });
      expect(await (await harnessOf(own.fixture)).getBoxNames()).toEqual([
        'Digit 1',
        'Digit 2',
        'Digit 3',
        'Digit 4',
      ]);
      TestBed.resetTestingModule();

      const partial = await render(undefined, 'light', {
        translation: { wj: { showPassword: 'Hiện' } },
      });
      expect((await (await harnessOf(partial.fixture)).getBoxNames())[0]).toBe(
        'Please enter one time password character 1',
      );
    });

    it('names a new box, and drops a removed one, when length changes', async () => {
      const { fixture, component } = await render();
      const otp = await harnessOf(fixture);

      component.length.set(6);
      await fixture.whenStable();
      const six = await otp.getBoxNames();
      expect(six).toHaveLength(6);
      expect(six[5]).toBe('Please enter one time password character 6');

      component.length.set(2);
      await fixture.whenStable();
      expect(await otp.getBoxNames()).toEqual([
        'Please enter one time password character 1',
        'Please enter one time password character 2',
      ]);
    });

    it('keeps the names while the value, disabled, mask, size and invalid change', async () => {
      const { fixture, component } = await render();
      const otp = await harnessOf(fixture);
      const names = await otp.getBoxNames();

      component.value.set('1234');
      await fixture.whenStable();
      expect(await otp.getBoxNames()).toEqual(names);

      component.mask.set(true);
      component.size.set('small');
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await otp.getBoxNames()).toEqual(names);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await otp.getBoxNames()).toEqual(names);
    });

    it('names every box inside a field too, and every name is distinct', async () => {
      const { fixture } = await render((host) => {
        host.inField.set(true);
        host.length.set(6);
      });
      const names = await (await harnessOf(fixture)).getBoxNames();

      expect(new Set(names).size).toBe(6);
      expect(
        names.every((name) => name?.startsWith('Please enter one time password character')),
      ).toBe(true);
    });

    it('renders an HTML payload in the translation as attribute text only', async () => {
      const { fixture, element } = await render(undefined, 'light', {
        translation: { wj: { otpCharacter: `${PAYLOAD} {0}` } },
      });

      expect((await (await harnessOf(fixture)).getBoxNames())[1]).toBe(`${PAYLOAD} 2`);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('the group (FR-26)', () => {
    it('is a role="group" named by ariaLabel outside a field', async () => {
      const { fixture, element } = await render();
      const otp = await harnessOf(fixture);

      expect(groupOf(element).getAttribute('role')).toBe('group');
      expect(await otp.getGroupAttributes()).toEqual({
        label: 'Verification code',
        labelledBy: null,
      });
    });

    it('is named by the field label inside a field', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const otp = await harnessOf(fixture);
      const label = find(element, 'wj-field [id]:is(span, label)', HTMLElement);

      expect(groupOf(element).getAttribute('role')).toBe('group');
      expect((await otp.getGroupAttributes()).labelledBy).toBe(label.id);
      expect(label.textContent).toContain('Verification code');
      expect(await (await fieldOf(fixture)).isGroup()).toBe(false);
    });

    it('lets a consumer’s ariaLabelledBy win over the field label', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);

      expect((await inField.getGroupAttributes()).labelledBy).toBe('plain');
    });

    it('keeps the role and the name after the value, length and disabled change', async () => {
      const { fixture, component, element } = await render();
      const otp = await harnessOf(fixture);

      component.value.set('12');
      component.length.set(6);
      component.disabled.set(true);
      await fixture.whenStable();

      expect(groupOf(element).getAttribute('role')).toBe('group');
      expect((await otp.getGroupAttributes()).label).toBe('Verification code');
    });
  });

  describe('pt', () => {
    const PT: WjInputOtpPt = {
      root: { 'data-root': 'a' },
      pcInputText: { root: { 'data-probe': 'yes', 'aria-invalid': 'false' } },
    };

    const landed = (element: HTMLElement, probe = 'yes'): void => {
      expect(groupOf(element).getAttribute('data-root')).toBe('a');
      expect(boxesOf(element).length).toBeGreaterThan(0);
      for (const box of boxesOf(element)) {
        expect(box.getAttribute('data-probe')).toBe(probe);
      }
    };

    it('reaches the root and every box', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(PT);
      });
      await fixture.whenStable();

      landed(element);
    });

    it('the routed role and name win over a pt value on the same attribute', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ root: { role: 'region', 'aria-label': 'Mine' } });
      });
      await fixture.whenStable();

      expect(groupOf(element).getAttribute('role')).toBe('group');
      expect(groupOf(element).getAttribute('aria-label')).toBe('Verification code');
    });

    it('the routed aria-invalid and name win over the pt ones on the same attribute', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          pcInputText: { root: { 'aria-label': 'Mine', 'aria-invalid': 'false' } },
        });
        host.invalid.set(true);
      });
      await fixture.whenStable();

      for (const [index, box] of boxesOf(element).entries()) {
        expect(box.getAttribute('aria-invalid')).toBe('true');
        expect(box.getAttribute('aria-label')).toBe(
          `Please enter one time password character ${String(index + 1)}`,
        );
      }
    });

    it('keeps landing after the value, length, disabled, size, invalid and pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(PT);
      });
      await fixture.whenStable();
      landed(element);

      component.value.set('12');
      await fixture.whenStable();
      landed(element);

      component.length.set(6);
      await fixture.whenStable();
      landed(element);
      expect(boxesOf(element)).toHaveLength(6);

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
      expect(boxAt(element, 5).getAttribute('aria-invalid')).toBe('true');

      component.pt.set({ ...PT, pcInputText: { root: { 'data-probe': 'changed' } } });
      await fixture.whenStable();
      landed(element, 'changed');
    });

    it('reaches the root and every box from a function-form pt as well', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(() => PT);
      });
      await fixture.whenStable();

      landed(element);
    });

    it('reaches every box from a function-form pcInputText part', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ pcInputText: () => ({ root: { 'data-probe': 'fn' } }) });
      });
      await fixture.whenStable();

      for (const box of boxesOf(element)) {
        expect(box.getAttribute('data-probe')).toBe('fn');
      }
    });
  });

  describe('typing and the model round trip', () => {
    it('keeps a character typed in a box with empty boxes before it, where it was typed', async () => {
      const { fixture, component, element } = await render();
      await userEvent.click(boxAt(element, 2));

      await userEvent.keyboard('7');
      await fixture.whenStable();

      expect(valuesOf(element)).toEqual(['', '', '7', '']);
      expect(component.value()).toBe('7');
      expect(document.activeElement).toBe(boxAt(element, 3));
    });

    it('keeps the boxes and the focus while a code is typed in order', async () => {
      const { fixture, component, element } = await render();

      await type(element, '12');
      await fixture.whenStable();

      expect(valuesOf(element)).toEqual(['1', '2', '', '']);
      expect(component.value()).toBe('12');
      expect(document.activeElement).toBe(boxAt(element, 2));
    });

    it('shows a value the model sets while the user has a partial entry', async () => {
      const { fixture, component, element } = await render();
      await type(element, '12');

      component.value.set('9876');
      await fixture.whenStable();

      expect(valuesOf(element)).toEqual(['9', '8', '7', '6']);
    });

    it('takes a pasted code whole, and cuts it to length', async () => {
      const { fixture, component, element } = await render();
      const otp = await harnessOf(fixture);

      await otp.pasteCode('482913');
      await fixture.whenStable();

      expect(component.value()).toBe('4829');
      expect(valuesOf(element)).toEqual(['4', '8', '2', '9']);
    });

    it('rejects a pasted code with a letter under integerOnly', async () => {
      const { fixture, component } = await render((host) => {
        host.integerOnly.set(true);
      });
      const otp = await harnessOf(fixture);

      await otp.pasteCode('48a9');
      await fixture.whenStable();

      expect(component.value()).toBeNull();
      expect(await otp.getValue()).toBe('');
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const otp = await harnessOf(fixture);
        expect(await otp.getValue()).toBe('1234');

        await otp.clear();
        await otp.typeCode('9');
        await fixture.whenStable();
        expect(component.value()).toBe('9');

        component.value.set('5678');
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await otp.getValue()).toBe('5678');
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const otp = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await otp.focus();
        await otp.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await otp.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const otp = await harnessOf(fixture);
        expect(await otp.getValue()).toBe('1234');

        await otp.clear();
        await otp.typeCode('42');
        expect(component.control.value).toBe('42');
        expect(component.control.dirty).toBe(true);

        component.control.setValue('8080');
        expect(await otp.getValue()).toBe('8080');
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const otp = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await otp.focus();
        await otp.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await otp.isDisabled()).toBe(true);

        component.control.enable();
        expect(await otp.isDisabled()).toBe(false);
      });

      it('marks the control touched when focus leaves the group, not while it moves between boxes', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        boxAt(element, 0).focus();

        await userEvent.tab();
        await userEvent.tab();
        expect(document.activeElement).toBe(boxAt(element, 2));
        expect(component.control.touched).toBe(false);

        boxAt(element, 3).focus();
        boxAt(element, 3).blur();
        await fixture.whenStable();
        expect(component.control.touched).toBe(true);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue('8080');

        expect(component.control.dirty).toBe(false);
      });

      it('shows empty boxes for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getValue()).toBe('');
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const code = (await allHarnessesOf(fixture))(0);
        expect(await code.getValue()).toBe('1234');

        await code.clear();
        await code.typeCode('8');
        await fixture.whenStable();
        expect(component.value().code).toBe('8');

        component.model.code().value.set('3333');
        await fixture.whenStable();
        expect(await code.getValue()).toBe('3333');
      });

      it('disables the control and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const code = (await allHarnessesOf(fixture))(0);
        expect(component.model.code().touched()).toBe(false);

        await code.focus();
        await code.blur();
        expect(component.model.code().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await code.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.typeCode('4');
        await bare.blur();
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component } = await render();
      const otp = await harnessOf(fixture);

      await otp.typeCode('42');
      expect(component.value()).toBe('42');

      await otp.focus();
      await otp.blur();
      expect(await otp.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gives the first box a generated id that the field points at, and no label for', async () => {
      const { fixture } = await render((host) => {
        host.inField.set(true);
      });
      const otp = await harnessOf(fixture);
      const field = await fieldOf(fixture);

      expect(await otp.getId()).toMatch(/^wj-inputotp-\d+$/);
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('puts the id on the first box only', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });

      expect(boxAt(element, 0).id).toMatch(/^wj-inputotp-\d+$/);
      for (const box of boxesOf(element).slice(1)) {
        expect(box.hasAttribute('id')).toBe(false);
      }
    });

    it('starts at the start edge of the field and leaves the rest of the row empty', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();
      const group = groupOf(element).getBoundingClientRect();

      expect(group.left).toBeLessThanOrEqual(fieldBox.left + 1);
      expect(group.width).toBe(4 * 40 + 3 * 8);
      expect(group.width).toBeLessThan(fieldBox.width);
    });

    it('adopts its own inputId and merges ariaDescribedBy before the field’s ids, on every box', async () => {
      const { fixture, element } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);
      const field = await fieldOf(fixture);

      expect(await inField.getId()).toBe('mine');
      expect(await inField.getDescribedBy()).toMatch(/^note wj-field-hint-\d+ wj-field-error-\d+$/);
      const second = element.querySelectorAll('wj-inputotp')[1]?.querySelectorAll('input')[3];
      expect(second?.getAttribute('aria-describedby')).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await field.getHint()).toBe('Hint');
      expect(await field.getError()).toBe('Error');
    });

    it('describes every box with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const otp = await harnessOf(fixture);
      expect(await otp.getDescribedBy()).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect(await otp.getDescribedBy()).toMatch(/^wj-field-hint-\d+ wj-field-error-\d+$/);
      expect(boxAt(element, 3).getAttribute('aria-describedby')).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect(await otp.getDescribedBy()).toBeNull();
    });

    it('is invalid exactly while the field shows an error, on every box, and clears after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const otp = await harnessOf(fixture);
      expect(await otp.isInvalid()).toBe(false);
      expect(getComputedStyle(boxAt(element, 0)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Enter all 4 characters.');
      await fixture.whenStable();
      expect(await otp.isInvalid()).toBe(true);
      await pointerAway(element);
      for (const box of boxesOf(element)) {
        expect(getComputedStyle(box).borderTopColor).toBe(INVALID_BORDER);
      }

      component.error.set('');
      await fixture.whenStable();
      expect(await otp.isInvalid()).toBe(false);
      expect(boxAt(element, 0).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture, element } = await render();
      const otp = await harnessOf(fixture);

      expect(await otp.getId()).toBe('');
      expect(await otp.getDescribedBy()).toBeNull();
      expect(boxAt(element, 0).hasAttribute('id')).toBe(false);
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component } = await render();
      const otp = await harnessOf(fixture);
      expect(await otp.isInvalid()).toBe(false);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await otp.isInvalid()).toBe(true);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(await otp.isInvalid()).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId on the first box, ariaLabel and ariaLabelledBy on the group, ariaDescribedBy on every box', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      const otp = await harnessOf(fixture);
      expect(await otp.getGroupAttributes()).toEqual({
        label: 'Verification code',
        labelledBy: null,
      });

      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();

      expect(await otp.getId()).toBe('mine');
      expect(await otp.getGroupAttributes()).toEqual({
        label: 'Verification code',
        labelledBy: 'namer',
      });
      for (const box of boxesOf(element)) {
        expect(box.getAttribute('aria-describedby')).toBe('describer');
      }
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const otp = await harnessOf(fixture);

      expect((await otp.getGroupAttributes()).label).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-inputotp: aria-label is set on the host, where it is not forwarded to the ' +
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

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('WJ0001: wj-inputotp'));
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
      const otp = await harnessOf(fixture);

      expect(await otp.getGroupAttributes()).toEqual({ label: PAYLOAD, labelledBy: PAYLOAD });
      expect(await otp.getDescribedBy()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await otp.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload as the value as box text only', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(PAYLOAD.slice(0, 4));
      });
      const otp = await harnessOf(fixture);

      expect(await otp.getValue()).toBe(PAYLOAD.slice(0, 4));
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by the group’s aria-label and by length', async () => {
      const { fixture } = await renderAs(Host, (host) => {
        host.length.set(6);
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(WjInputOtpHarness.with({ ariaLabel: /^Verif/ }));
      const byLength = await loader.getAllHarnesses(WjInputOtpHarness.with({ length: 6 }));
      const none = await loader.getAllHarnesses(WjInputOtpHarness.with({ length: 4 }));

      expect(byLabel).toHaveLength(1);
      expect(byLength).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('types a code, pastes a code, and reads the box count and every name', async () => {
      const { fixture, component } = await render();
      const otp = await harnessOf(fixture);

      await otp.typeCode('12345');
      expect(await otp.getValue()).toBe('1234');
      expect(component.value()).toBe('1234');

      await otp.clear();
      await otp.pasteCode('9876');
      expect(await otp.getValue()).toBe('9876');
      expect(await otp.getLength()).toBe(4);
      expect(await otp.getBoxNames()).toHaveLength(4);
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const otp = await harnessOf(fixture);
      expect(await otp.isFocused()).toBe(false);

      await otp.focus();
      expect(await otp.isFocused()).toBe(true);

      await otp.blur();
      expect(await otp.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-inputotp', HTMLElement),
        );
      });
    });
  });

  describe('keyboard', () => {
    it('Tab goes through every box as a tab stop, skips a disabled control, and Shift+Tab goes back', async () => {
      const { element } = await renderAs(KeyboardHost);
      const first = Array.from(
        element.querySelectorAll('wj-inputotp')[0]?.querySelectorAll('input') ?? [],
      );
      byId(element, 'before').focus();

      for (const box of first) {
        await userEvent.tab();
        expect(document.activeElement).toBe(box);
      }

      await userEvent.tab();
      expect(document.activeElement).toBe(
        element.querySelectorAll('wj-inputotp')[1]?.querySelector('input'),
      );

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(first[3]);
    });

    it('typing a character fills the box and moves to the next', async () => {
      const { element } = await renderAs(Host);
      boxAt(element, 0).focus();

      await userEvent.keyboard('1');

      await expect.poll(() => document.activeElement).toBe(boxAt(element, 1));
      expect(boxAt(element, 0).value).toBe('1');
    });

    it('Backspace on an empty box moves to the previous one', async () => {
      const { element } = await renderAs(Host, (host) => {
        host.value.set('1');
      });
      boxAt(element, 1).focus();

      await userEvent.keyboard('{Backspace}');

      await expect.poll(() => document.activeElement).toBe(boxAt(element, 0));
    });

    it('Backspace on a filled box empties it and moves to the previous one', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('12');
      });
      boxAt(element, 1).focus();

      await userEvent.keyboard('{Backspace}');
      await fixture.whenStable();

      expect(component.value()).toBe('1');
      expect(document.activeElement).toBe(boxAt(element, 0));
    });

    it('ArrowLeft and ArrowRight move between boxes, and ArrowUp and ArrowDown do nothing', async () => {
      const { element } = await renderAs(Host, (host) => {
        host.value.set('1234');
      });
      boxAt(element, 1).focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(boxAt(element, 2));

      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(document.activeElement).toBe(boxAt(element, 0));

      await userEvent.keyboard('{ArrowUp}{ArrowDown}');
      expect(document.activeElement).toBe(boxAt(element, 0));
      expect(valuesOf(element)).toEqual(['1', '2', '3', '4']);
    });

    it('a character typed in a filled box replaces it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('1234');
      });
      boxAt(element, 1).focus();

      await userEvent.keyboard('9');
      await fixture.whenStable();

      expect(component.value()).toBe('1934');
    });

    it('with integerOnly, Tab and Shift+Tab still move through the boxes and out of the group', async () => {
      const { element } = await renderAs(KeyboardHost);
      const digits = Array.from(
        element.querySelectorAll('wj-inputotp')[1]?.querySelectorAll('input') ?? [],
      );
      digits[0]?.focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(digits[1]);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(digits[0]);

      digits[3]?.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('does not cancel Tab or Enter, which Optimus’s integerOnly check would', async () => {
      const { element } = await renderAs(KeyboardHost);
      const cancelled: Record<string, boolean> = {};
      const record = (event: KeyboardEvent): void => {
        cancelled[event.key] = event.defaultPrevented;
      };
      document.addEventListener('keydown', record);
      element.querySelectorAll('wj-inputotp')[1]?.querySelector('input')?.focus();

      await userEvent.keyboard('{Enter}{Tab}');
      document.removeEventListener('keydown', record);

      expect(cancelled).toEqual({ Enter: false, Tab: false });
    });

    it('with integerOnly, Delete still removes the character', async () => {
      const { fixture, component, element } = await render((host) => {
        host.integerOnly.set(true);
        host.value.set('1234');
      });
      boxAt(element, 1).focus();

      await userEvent.keyboard('{Delete}');
      await fixture.whenStable();

      expect(boxAt(element, 1).value).toBe('');
      expect(component.value()).toBe('134');
    });

    it('does nothing past the last box', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('1234');
      });
      boxAt(element, 3).focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(boxAt(element, 3));
      await fixture.whenStable();
      expect(component.value()).toBe('1234');
    });

    it('with integerOnly, a letter is rejected and the focus stays', async () => {
      const { element } = await renderAs(KeyboardHost);
      const digits = element.querySelectorAll('wj-inputotp')[1]?.querySelector('input');
      digits?.focus();

      await userEvent.keyboard('x');

      expect(digits?.value).toBe('');
      expect(document.activeElement).toBe(digits);
    });
  });
});
