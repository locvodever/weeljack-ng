/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjRadioButton, type WjRadioButtonPt } from 'weeljack-ng/radiobutton';
import { WjRadioButtonHarness } from 'weeljack-ng/radiobutton/testing';
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

/** A consumer's template: one group of three radios, bare or inside a field. */
@Component({
  selector: 'wj-radiobutton-host',
  imports: [WjField, WjRadioButton],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Delivery speed" [hint]="hint()" [error]="error()">
        <div class="options">
          <label for="speed-first">
            <wj-radiobutton
              inputId="speed-first"
              name="speed"
              [option]="first()"
              [(value)]="value"
              [pt]="pt()"
              [invalid]="invalid()"
              [disabled]="disabled()"
              [required]="required()"
            />
            Standard
          </label>
          <label for="speed-express">
            <wj-radiobutton
              inputId="speed-express"
              name="speed"
              option="express"
              [(value)]="value"
              (valueChange)="log.push($event)"
              [pt]="pt()"
              [invalid]="invalid()"
              [disabled]="disabled() || expressOff()"
              [required]="required()"
            />
            Express
          </label>
          <label for="speed-pickup">
            <wj-radiobutton
              inputId="speed-pickup"
              name="speed"
              option="pickup"
              [(value)]="value"
              [pt]="pt()"
              [invalid]="invalid()"
              [disabled]="disabled()"
              [required]="required()"
            />
            Pick up in store
          </label>
        </div>
      </wj-field>
    } @else {
      <div class="options" role="radiogroup" aria-label="Delivery speed">
        <label for="speed-first">
          <wj-radiobutton
            inputId="speed-first"
            name="speed"
            [option]="first()"
            [(value)]="value"
            [pt]="pt()"
            [invalid]="invalid()"
            [disabled]="disabled()"
            [required]="required()"
          />
          Standard
        </label>
        <label for="speed-express">
          <wj-radiobutton
            inputId="speed-express"
            name="speed"
            option="express"
            [(value)]="value"
            (valueChange)="log.push($event)"
            [pt]="pt()"
            [invalid]="invalid()"
            [disabled]="disabled() || expressOff()"
            [required]="required()"
          />
          Express
        </label>
        <label for="speed-pickup">
          <wj-radiobutton
            inputId="speed-pickup"
            name="speed"
            option="pickup"
            [(value)]="value"
            [pt]="pt()"
            [invalid]="invalid()"
            [disabled]="disabled()"
            [required]="required()"
          />
          Pick up in store
        </label>
      </div>
    }
    <button type="button" id="after">After</button>
  `,
  styles: `
    .options {
      display: grid;
      gap: 8px;
    }

    label {
      display: flex;
      align-items: start;
      gap: 8px;
      min-block-size: 24px;
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string | null>(null);
  readonly first = signal('standard');
  readonly pt = signal<WjRadioButtonPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly expressOff = signal(false);
  readonly required = signal(false);
  readonly log: (string | null)[] = [];
}

/** Numbers as options: `T` is a number, not a string. */
@Component({
  selector: 'wj-radiobutton-number-host',
  imports: [WjRadioButton],
  template: `
    <wj-radiobutton name="count" [option]="1" ariaLabel="One" [(value)]="value" />
    <wj-radiobutton name="count" [option]="2" ariaLabel="Two" [(value)]="value" />
  `,
})
class NumberHost {
  readonly value = signal<number | null>(null);
}

/** A radio with a bound `name` and a string `option`, for the payload spec. */
@Component({
  selector: 'wj-radiobutton-payload-host',
  imports: [WjRadioButton],
  template: `<wj-radiobutton [name]="name()" [option]="option()" ariaLabel="Payload" />`,
})
class PayloadHost {
  readonly name = signal('group');
  readonly option = signal('one');
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-radiobutton-aria-host',
  imports: [WjRadioButton],
  template: `
    <wj-radiobutton
      name="aria"
      option="a"
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Standard');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-radiobutton-aria-on-host-host',
  imports: [WjRadioButton],
  template: `<wj-radiobutton name="host" option="a" aria-label="Standard" />`,
})
class AriaOnHostHost {}

/** A consumer's own label, and a field around radios with their own `inputId` and description. */
@Component({
  selector: 'wj-radiobutton-own-ids-host',
  imports: [WjRadioButton, WjField],
  template: `
    <p id="note">Note</p>
    <label for="plain">Plain</label>
    <wj-radiobutton name="own-plain" option="a" inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Terms" hint="Hint" error="Error">
      <wj-radiobutton name="own-field" option="a" inputId="mine" ariaDescribedBy="note" />
      <wj-radiobutton name="own-field" option="b" ariaLabel="Second" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** One radio in a field: it registers inline, like a checkbox. */
@Component({
  selector: 'wj-radiobutton-single-host',
  imports: [WjRadioButton, WjField],
  template: `
    <wj-field label="Subscribe" hint="Weekly.">
      <wj-radiobutton name="solo" option="yes" />
    </wj-field>
  `,
})
class SingleHost {}

/** Radios with no `name`, in a group of their own. */
@Component({
  selector: 'wj-radiobutton-nameless-host',
  imports: [WjRadioButton],
  template: `
    <wj-radiobutton option="a" ariaLabel="First" />
    <wj-radiobutton option="b" ariaLabel="Second" />
  `,
})
class NamelessHost {}

/** `ngModel` inside a field: three radios sharing one model. */
@Component({
  selector: 'wj-radiobutton-ngmodel-host',
  imports: [WjField, WjRadioButton, FormsModule],
  template: `
    <wj-field label="Delivery speed">
      <wj-radiobutton
        name="nm"
        option="standard"
        ariaLabel="Standard"
        [(ngModel)]="value"
        [disabled]="disabled()"
      />
      <wj-radiobutton
        name="nm"
        option="express"
        ariaLabel="Express"
        [(ngModel)]="value"
        [disabled]="disabled()"
      />
      <wj-radiobutton
        name="nm"
        option="pickup"
        ariaLabel="Pickup"
        [(ngModel)]="value"
        [disabled]="disabled()"
      />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>('express');
  readonly disabled = signal(false);
}

/** A reactive group: three `formControlName`s on one control, with an initial value. */
@Component({
  selector: 'wj-radiobutton-reactive-host',
  imports: [WjField, WjRadioButton, ReactiveFormsModule],
  template: `
    <form [formGroup]="group">
      <wj-field label="Cup size">
        <wj-radiobutton name="rs" option="small" ariaLabel="Small" formControlName="size" />
        <wj-radiobutton name="rs" option="medium" ariaLabel="Medium" formControlName="size" />
        <wj-radiobutton name="rs" option="large" ariaLabel="Large" formControlName="size" />
      </wj-field>
    </form>
  `,
})
class ReactiveHost {
  readonly group = new FormGroup({ size: new FormControl<string | null>('medium') });
}

/** Signal forms: three `[formField]`s on one field, with no `name` of their own. */
@Component({
  selector: 'wj-radiobutton-signal-host',
  imports: [WjField, WjRadioButton, FormField],
  template: `
    <form novalidate>
      <wj-field label="Payment method">
        <wj-radiobutton option="card" ariaLabel="Card" [formField]="model.pay" />
        <wj-radiobutton option="bank" ariaLabel="Bank transfer" [formField]="model.pay" />
        <wj-radiobutton option="cash" ariaLabel="Cash" [formField]="model.pay" />
      </wj-field>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ pay: string | null }>({ pay: 'bank' });
  readonly model = form(this.value, (path) => {
    required(path.pay, { message: 'Choose a payment method.' });
    disabledRule(path.pay, { when: () => this.off() });
  });
}

/** A page that mixes plain, `ngModel`, reactive and `[formField]` groups. */
@Component({
  selector: 'wj-radiobutton-mixed-host',
  imports: [WjRadioButton, FormsModule, ReactiveFormsModule, FormField],
  template: `
    <div role="radiogroup" aria-label="Plain">
      <wj-radiobutton name="mx-plain" option="a" ariaLabel="plain a" [(value)]="plain" />
      <wj-radiobutton name="mx-plain" option="b" ariaLabel="plain b" [(value)]="plain" />
    </div>
    <div role="radiogroup" aria-label="Model">
      <wj-radiobutton name="mx-model" option="a" ariaLabel="model a" [(ngModel)]="model" />
      <wj-radiobutton name="mx-model" option="b" ariaLabel="model b" [(ngModel)]="model" />
    </div>
    <div role="radiogroup" aria-label="Reactive" [formGroup]="group">
      <wj-radiobutton name="mx-reactive" option="a" ariaLabel="reactive a" formControlName="size" />
      <wj-radiobutton name="mx-reactive" option="b" ariaLabel="reactive b" formControlName="size" />
    </div>
    <div role="radiogroup" aria-label="Signal">
      <wj-radiobutton option="a" ariaLabel="signal a" [formField]="signalModel.pay" />
      <wj-radiobutton option="b" ariaLabel="signal b" [formField]="signalModel.pay" />
    </div>
  `,
})
class MixedHost {
  readonly plain = signal<string | null>('a');
  model: string | null = 'a';
  readonly group = new FormGroup({ size: new FormControl<string | null>('a') });
  readonly value = signal<{ pay: string | null }>({ pay: 'a' });
  readonly signalModel = form(this.value);
}

/** Three radios for the keyboard spec, the middle one disabled, between two native buttons. */
@Component({
  selector: 'wj-radiobutton-keyboard-host',
  imports: [WjRadioButton],
  template: `
    <button type="button" id="before">Before</button>
    <div role="radiogroup" aria-label="Keys">
      <wj-radiobutton name="kb" option="a" ariaLabel="First" [(value)]="picked" />
      <wj-radiobutton name="kb" option="b" ariaLabel="Disabled" disabled [(value)]="picked" />
      <wj-radiobutton name="kb" option="c" ariaLabel="Last" [(value)]="picked" />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly picked = signal<string | null>(null);
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
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  await expect.poll(() => boxOf(element).getBoundingClientRect().width).toBe(24);
  return { fixture, component: fixture.componentInstance, element };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered<Host>> => renderAs(Host, setup, scheme);

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The painted box of the first radio. */
const boxOf = (element: HTMLElement): HTMLElement =>
  find(element, '.p-radiobutton-box', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The `input` of the radio whose `aria-label` is `label`. */
const inputLabelled = (element: HTMLElement, label: string): HTMLInputElement =>
  find(element, `input[aria-label="${label}"]`, HTMLInputElement);

/** The radio harnesses of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjRadioButtonHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjRadioButtonHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-radiobutton at index ${String(index)}`);
    }
    return found;
  };
}

function fieldOf(fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
}

/** Which of `harnesses` are checked, as a string of 1s and 0s. */
async function checkedPattern(...harnesses: WjRadioButtonHarness[]): Promise<string> {
  const states = await Promise.all(harnesses.map((harness) => harness.isChecked()));
  return states.map((state) => (state ? '1' : '0')).join('');
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const STATES: [string, (host: Host) => void][] = [
  ['none checked', () => undefined],
  [
    'one checked',
    (host) => {
      host.value.set('express');
    },
  ],
  [
    'one radio disabled',
    (host) => {
      host.value.set('standard');
      host.expressOff.set(true);
    },
  ],
  [
    'the whole group disabled',
    (host) => {
      host.value.set('express');
      host.disabled.set(true);
    },
  ],
  [
    'required',
    (host) => {
      host.required.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.invalid.set(true);
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('You can change this later.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Choose a delivery speed.');
    },
  ],
];

describe('WjRadioButton', () => {
  let warn: MockInstance<typeof console.warn>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await emulateReducedMotion(false);
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs and outputs', () => {
    it('value is two-way: the radio whose option equals it is checked, and a click writes it back', async () => {
      const { fixture, component } = await render();
      const at = await allHarnessesOf(fixture);
      expect(await checkedPattern(at(0), at(1), at(2))).toBe('000');

      component.value.set('express');
      await fixture.whenStable();
      await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('010');

      await at(2).check();
      expect(component.value()).toBe('pickup');
      await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');
    });

    it('valueChange fires on the radio the user checks, with its option', async () => {
      const { fixture, component } = await render();
      const at = await allHarnessesOf(fixture);

      await at(0).check();
      expect(component.log).toEqual([]);

      await at(1).check();
      expect(component.log).toEqual(['express']);
      expect(component.value()).toBe('express');
    });

    it('option is compared with == as Optimus does, and keeps its type through the model', async () => {
      const { fixture, component } = await renderAs(NumberHost);
      const at = await allHarnessesOf(fixture);

      await at(1).check();

      expect(component.value()).toBe(2);
      component.value.set(1);
      await fixture.whenStable();
      await expect.poll(() => checkedPattern(at(0), at(1))).toBe('10');
    });

    it('checks again when the radio’s own option changes', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('standard');
      });
      const at = await allHarnessesOf(fixture);
      await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');

      component.first.set('other');
      await fixture.whenStable();
      await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('000');

      component.first.set('standard');
      await fixture.whenStable();
      await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
    });

    it('name reaches every input, so the browser makes one group', async () => {
      const { fixture } = await render();
      const at = await allHarnessesOf(fixture);

      expect(await at(0).getName()).toBe('speed');
      expect(await at(1).getName()).toBe('speed');
      expect(await at(2).getName()).toBe('speed');
    });

    it('disabled, required and invalid reach the control', async () => {
      const { fixture, component, element } = await render();
      const at = await allHarnessesOf(fixture);
      expect(await at(0).isDisabled()).toBe(false);
      expect(await at(0).isRequired()).toBe(false);
      expect(await at(0).isInvalid()).toBe(false);
      expect(getComputedStyle(boxOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();

      expect(await at(0).isRequired()).toBe(true);
      expect(await at(0).isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(boxOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await at(0).isDisabled()).toBe(true);
      expect(await at(2).isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('pt reaches the input part, and the routed attributes win over it', async () => {
      const { element } = await render((host) => {
        host.pt.set({ input: { 'data-probe': 'yes', 'aria-invalid': 'false' } });
        host.invalid.set(true);
      });

      const input = find(element, 'input[type=radio]', HTMLInputElement);
      expect(input.getAttribute('data-probe')).toBe('yes');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('pt reaches the root, box and icon parts, and again after it changes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'a' },
          box: { 'data-box': 'b' },
          icon: { 'data-icon': 'c' },
        });
      });
      const root = find(element, 'p-radiobutton', HTMLElement);

      expect(root.getAttribute('data-root')).toBe('a');
      expect(boxOf(element).getAttribute('data-box')).toBe('b');
      expect(find(element, '.p-radiobutton-icon', HTMLElement).getAttribute('data-icon')).toBe('c');

      component.pt.set({ box: { 'data-box': 'again' } });
      await fixture.whenStable();
      await expect.poll(() => boxOf(element).getAttribute('data-box')).toBe('again');

      // Routed attributes land after state changes too: the invalid flag, then a value.
      component.invalid.set(true);
      component.value.set('express');
      await fixture.whenStable();
      await expect
        .poll(() =>
          find(element, 'input[type=radio]', HTMLInputElement).getAttribute('aria-invalid'),
        )
        .toBe('true');
      expect(boxOf(element).getAttribute('data-box')).toBe('again');
    });

    it('is a real radio with a 24 x 24 px hit box and no size of its own', async () => {
      const { element } = await render();
      const input = find(element, 'input[type=radio]', HTMLInputElement);
      const root = find(element, 'p-radiobutton', HTMLElement).getBoundingClientRect();
      const box = boxOf(element).getBoundingClientRect();
      const target = input.getBoundingClientRect();

      expect(input.type).toBe('radio');
      expect(root.width).toBeGreaterThanOrEqual(24);
      expect(root.height).toBeGreaterThanOrEqual(24);
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(target.width).toBeGreaterThanOrEqual(24);
      expect(target.height).toBeGreaterThanOrEqual(24);
    });

    it('is an inline-flex host with no box of its own around the Optimus root', async () => {
      // Bare: inside the spec's flex `label` the host would be blockified to `flex`.
      const { element } = await renderAs(AriaHost);
      const host = find(element, 'wj-radiobutton', HTMLElement);

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(24);
      expect(host.getBoundingClientRect().width).toBe(24);
    });

    it('draws a 16 px dot on the ink fill when checked, and none when not', async () => {
      const { fixture, component, element } = await render();
      const icon = find(element, '.p-radiobutton-icon', HTMLElement);
      expect(getComputedStyle(icon).width).toBe('16px');

      component.value.set('standard');
      await fixture.whenStable();
      await expect
        .poll(() => getComputedStyle(boxOf(element)).backgroundColor)
        .toBe('rgb(9, 9, 11)');
    });

    it('draws the family focus ring round the box after a key press, and none after a click', async () => {
      const { element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();
      const input = find(element, 'input[type=radio]', HTMLInputElement);
      await expect.poll(() => document.activeElement).toBe(input);
      const ring = getComputedStyle(boxOf(element));
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');

      await userEvent.click(byId(element, 'after'));
      await expect.poll(() => getComputedStyle(boxOf(element)).outlineStyle).toBe('none');
    });
  });

  describe('the group story (FR-17)', () => {
    it('is one native group: one tab stop, arrows that check and wrap, and Space', async () => {
      const { fixture, component, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(true);
      expect(component.picked()).toBeNull();

      await userEvent.keyboard('{ArrowDown}');
      expect(component.picked()).toBe('c');
      expect(await at(2).isFocused()).toBe(true);

      await userEvent.keyboard('{ArrowRight}');
      expect(component.picked()).toBe('a');
      expect(await at(0).isFocused()).toBe(true);

      await userEvent.keyboard('{ArrowUp}');
      expect(component.picked()).toBe('c');

      await userEvent.keyboard('{ArrowLeft}');
      expect(component.picked()).toBe('a');
      await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
    });

    it('Tab enters at the first radio when none is checked, and at the checked one otherwise', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(true);
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await at(2).check();
      byId(element, 'before').focus();
      await userEvent.tab();
      expect(await at(2).isFocused()).toBe(true);
    });

    it('skips a disabled radio on the arrows, and leaves the group on Tab and Shift+Tab', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      await at(0).focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(await at(2).isFocused()).toBe(true);
      expect(await at(1).isChecked()).toBe(false);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await at(2).isFocused()).toBe(true);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
    });

    it('Space checks the focused radio, and Enter does nothing', async () => {
      const { fixture, component } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      await at(0).focus();

      await userEvent.keyboard('{Enter}');
      expect(component.picked()).toBeNull();

      await userEvent.keyboard(' ');
      expect(component.picked()).toBe('a');
      expect(await at(0).isChecked()).toBe(true);
    });

    it('a radio with no name is a group of its own, and WJ0090 says so once', async () => {
      const { fixture } = await renderAs(NamelessHost);
      const at = await allHarnessesOf(fixture);
      await fixture.whenStable();

      expect(await at(0).getName()).toBe('');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0090: wj-radiobutton: it has no name, so it forms a group of its own and arrow keys do ' +
          'not reach the other options. Give every radio button of one group the same name. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0090',
      );
    });

    it('does not raise WJ0090 for a named group, or for the name a [formField] pushes', async () => {
      await renderAs(Host);
      TestBed.resetTestingModule();
      const { fixture, element } = await renderAs(SignalHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
      const names = new Set(
        [...element.querySelectorAll('input[type=radio]')].map((input) =>
          input.getAttribute('name'),
        ),
      );
      expect(names.size).toBe(1);
      expect([...names][0]).toBeTruthy();
    });
  });

  describe('the forms APIs and Optimus’s NgControl lookup (FR-18)', () => {
    describe('plain [(value)] with no forms directive', () => {
      it('renders, writes the value in and out, and unchecks the others', async () => {
        const { fixture, component } = await render();
        const at = await allHarnessesOf(fixture);

        await at(0).check();
        await at(1).check();
        expect(component.value()).toBe('express');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('010');

        component.value.set('pickup');
        await fixture.whenStable();
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('marks nothing touched in the form but blurs cleanly', async () => {
        const { fixture } = await render();
        const at = await allHarnessesOf(fixture);

        await at(0).focus();
        await at(0).blur();

        expect(await at(0).isFocused()).toBe(false);
      });
    });

    describe('ngModel', () => {
      it('writes the value in, and the checked option out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('010');

        await at(2).check();
        await fixture.whenStable();
        expect(component.value()).toBe('pickup');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');

        component.value.set('standard');
        await fixture.whenStable();
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
      });

      it('disables the radios and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const at = await allHarnessesOf(fixture);
        expect(component.model().touched).toBe(false);

        await at(0).focus();
        await at(0).blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await at(0).isDisabled()).toBe(true);
      });
    });

    describe('formControlName in one FormGroup', () => {
      it('shows the initial value, then unchecks the previous radio on a click', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('010');

        await at(2).check();
        expect(component.group.controls.size.value).toBe('large');
        expect(component.group.controls.size.dirty).toBe(true);
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');

        await at(0).check();
        expect(component.group.controls.size.value).toBe('small');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('unchecks the previous radio on an arrow key', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const at = await allHarnessesOf(fixture);
        await at(1).focus();

        await userEvent.keyboard('{ArrowDown}');

        expect(component.group.controls.size.value).toBe('large');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');

        await userEvent.keyboard('{ArrowDown}');
        expect(component.group.controls.size.value).toBe('small');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
      });

      it('checks the radio for a value the form writes, even one picked before', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const at = await allHarnessesOf(fixture);
        await at(0).check();
        await at(2).check();
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');

        // Small was picked, then unchecked by the registry, so its model still says 'small'.
        component.group.controls.size.setValue('small');

        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
        component.group.controls.size.setValue(null);
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('000');
        component.group.reset({ size: 'medium' });
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('010');
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.group.controls.size.setValue('large');

        expect(component.group.controls.size.dirty).toBe(false);
      });

      it('disables the radios and marks the control touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const at = await allHarnessesOf(fixture);
        expect(component.group.controls.size.touched).toBe(false);

        await at(1).focus();
        await at(1).blur();
        expect(component.group.controls.size.touched).toBe(true);

        component.group.controls.size.disable();
        expect(await at(0).isDisabled()).toBe(true);
        component.group.controls.size.enable();
        expect(await at(0).isDisabled()).toBe(false);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the checked option out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('010');

        await at(2).check();
        await fixture.whenStable();
        expect(component.value().pay).toBe('cash');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');

        component.model.pay().value.set('card');
        await fixture.whenStable();
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('100');
      });

      it('pushes one shared name, and disables the radios and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(await at(0).getName()).not.toBe('');
        expect(await at(0).getName()).toBe(await at(2).getName());
        expect(component.model.pay().touched()).toBe(false);

        await at(1).focus();
        await at(1).blur();
        expect(component.model.pay().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await at(0).isDisabled()).toBe(true);
      });

      it('shows the field error once touched, on every radio, and clears it on a pick', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        component.model.pay().value.set(null);
        await fixture.whenStable();
        expect(await at(0).isInvalid()).toBe(false);

        await at(0).focus();
        await at(0).blur();
        await fixture.whenStable();
        expect(await at(0).isInvalid()).toBe(true);
        expect(await at(2).isInvalid()).toBe(true);
        expect(await (await fieldOf(fixture)).getError()).toBe('Choose a payment method.');

        await at(1).check();
        await fixture.whenStable();
        expect(await at(0).isInvalid()).toBe(false);
      });

      it('arrow keys check the next radio and write the form', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await at(1).focus();

        await userEvent.keyboard('{ArrowDown}');

        expect(component.value().pay).toBe('cash');
        await expect.poll(() => checkedPattern(at(0), at(1), at(2))).toBe('001');
      });
    });

    describe('a page that mixes all four', () => {
      it('throws nothing, and each group is its own group', async () => {
        const { fixture, component, element } = await renderAs(MixedHost);
        const input = (label: string): HTMLInputElement => inputLabelled(element, label);
        await expect
          .poll(() =>
            [input('plain a'), input('model a'), input('reactive a'), input('signal a')].map(
              (i) => i.checked,
            ),
          )
          .toEqual([true, true, true, true]);

        await userEvent.click(input('plain b'));
        await userEvent.click(input('model b'));
        await userEvent.click(input('reactive b'));
        await userEvent.click(input('signal b'));
        await fixture.whenStable();

        expect(component.plain()).toBe('b');
        expect(component.model).toBe('b');
        expect(component.group.controls.size.value).toBe('b');
        expect(component.value().pay).toBe('b');
        await expect
          .poll(() =>
            [input('plain a'), input('model a'), input('reactive a'), input('signal a')].map(
              (i) => i.checked,
            ),
          )
          .toEqual([false, false, false, false]);
        expect(
          [input('plain b'), input('model b'), input('reactive b'), input('signal b')].map(
            (i) => i.checked,
          ),
        ).toEqual([true, true, true, true]);
        expect(consoleError).not.toHaveBeenCalled();
      });
    });
  });

  describe('inside a field', () => {
    it('keeps each radio’s own id and makes the field a group named by its label', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
        host.hint.set('You can change this later.');
      });
      const at = await allHarnessesOf(fixture);
      const field = await fieldOf(fixture);
      const wrapper = find(element, 'wj-field', HTMLElement);

      expect(await at(0).getId()).toBe('speed-first');
      expect(await at(1).getId()).toBe('speed-express');
      expect(await field.isGroup()).toBe(true);
      expect(await field.isInline()).toBe(false);
      expect(wrapper.getAttribute('role')).toBe('group');
      expect(
        element.querySelector(`#${wrapper.getAttribute('aria-labelledby') ?? 'none'}`)?.tagName,
      ).toBe('SPAN');
    });

    it('puts a lone radio inline: the label beside the box, on the box’s first line', async () => {
      const { fixture, element } = await renderAs(SingleHost);
      const at = await allHarnessesOf(fixture);
      const field = await fieldOf(fixture);
      const host = find(element, 'wj-radiobutton', HTMLElement).getBoundingClientRect();
      const label = find(element, 'label', HTMLElement);

      expect(await field.isInline()).toBe(true);
      expect(await field.isGroup()).toBe(false);
      expect(label.getAttribute('for')).toBe(await at(0).getId());
      expect(label.getBoundingClientRect().left).toBeGreaterThanOrEqual(host.right);
      expect(Math.abs(label.getBoundingClientRect().top - host.top)).toBeLessThan(1);
    });

    it('adopts its own inputId and merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);

      expect(await at(1).getId()).toBe('mine');
      expect((await at(1).getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await (await fieldOf(fixture)).getHint()).toBe('Hint');
    });

    it('describes every radio with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const at = await allHarnessesOf(fixture);
      expect((await at(0).getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await at(2).getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await at(0).getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const at = await allHarnessesOf(fixture);
      expect(await at(0).isInvalid()).toBe(false);
      expect(getComputedStyle(boxOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Choose a delivery speed.');
      await fixture.whenStable();
      expect(await at(0).isInvalid()).toBe(true);
      expect(await at(1).isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(boxOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await at(0).isInvalid()).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);

      expect(await at(0).getId()).toBe('');
      expect((await at(0).getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s inputId and ariaDescribedBy, and a <label for> names it', async () => {
      const { fixture, element } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);

      expect(await at(0).getId()).toBe('plain');
      expect((await at(0).getAriaAttributes()).describedBy).toBe('note');
      expect(await at(0).getLabelText()).toBe('Plain');
      expect(element.querySelector('label[for=plain]')?.textContent).toBe('Plain');
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const at = await allHarnessesOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await at(0).isInvalid()).toBe(true);
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId, ariaLabel, ariaLabelledBy and ariaDescribedBy on the input', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const at = await allHarnessesOf(fixture);

      expect(await at(0).getId()).toBe('mine');
      expect(await at(0).getAriaAttributes()).toEqual({
        label: 'Standard',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const at = await allHarnessesOf(fixture);

      expect((await at(0).getAriaAttributes()).label).toBeNull();
      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        'WJ0003: wj-radiobutton: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      ]);
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('safety', () => {
    it('renders an HTML payload on the four ARIA string inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const at = await allHarnessesOf(fixture);

      expect(await at(0).getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await at(0).getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on name and on a string option as text only', async () => {
      const { fixture, component, element } = await renderAs(PayloadHost);
      component.name.set(PAYLOAD);
      component.option.set(PAYLOAD);
      await fixture.whenStable();
      const at = await allHarnessesOf(fixture);

      expect(await at(0).getName()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('motion', () => {
    it('runs the box transition on Optimus’s 0.2s, and at 0s under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      await expect
        .poll(() => getComputedStyle(boxOf(normal.element)).transitionDuration)
        .toContain('0.2s');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(() => getComputedStyle(boxOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
    });
  });

  describe('harness', () => {
    it('is found by state, by name and by label', async () => {
      const { fixture } = await render((host) => {
        host.value.set('express');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const checked = await loader.getAllHarnesses(WjRadioButtonHarness.with({ checked: true }));
      const named = await loader.getAllHarnesses(WjRadioButtonHarness.with({ name: /^speed$/ }));
      const none = await loader.getAllHarnesses(WjRadioButtonHarness.with({ name: 'other' }));
      const pickup = await loader.getAllHarnesses(WjRadioButtonHarness.with({ label: /Pick up/ }));

      expect(checked).toHaveLength(1);
      expect(named).toHaveLength(3);
      expect(none).toHaveLength(0);
      expect(pickup).toHaveLength(1);
      expect(await pickup[0]?.getLabelText()).toBe('Pick up in store');
    });

    it('reads the label of a wrapping label, and the aria-label when there is none', async () => {
      const { fixture } = await render();
      const at = await allHarnessesOf(fixture);
      expect(await at(0).getLabelText()).toBe('Standard');

      TestBed.resetTestingModule();
      const keyboard = await renderAs(KeyboardHost);
      expect(await (await allHarnessesOf(keyboard.fixture))(0).getLabelText()).toBe('First');
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const at = await allHarnessesOf(fixture);
      expect(await at(0).isFocused()).toBe(false);

      await at(0).focus();
      expect(await at(0).isFocused()).toBe(true);

      await at(0).blur();
      expect(await at(0).isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, '.options', HTMLElement),
        );
      });
    });
  });
});
