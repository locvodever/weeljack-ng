import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjToggleSwitch, type WjToggleSwitchPt } from 'weeljack-ng/toggleswitch';
import { WjToggleSwitchHarness } from 'weeljack-ng/toggleswitch/testing';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
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

/** A consumer's template: one bare switch, or the same switch inside a field. */
@Component({
  selector: 'wj-toggleswitch-host',
  imports: [WjField, WjToggleSwitch],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Accept the terms" [hint]="hint()" [error]="error()">
        <wj-toggleswitch
          [(checked)]="checked"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
        />
      </wj-field>
    } @else {
      <wj-toggleswitch
        ariaLabel="Accept the terms"
        [(checked)]="checked"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
      />
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly checked = signal(false);
  readonly pt = signal<WjToggleSwitchPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-toggleswitch-aria-host',
  imports: [WjToggleSwitch],
  template: `
    <wj-toggleswitch
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Accept the terms');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-toggleswitch-aria-on-host-host',
  imports: [WjToggleSwitch],
  template: `<wj-toggleswitch aria-label="Accept the terms" />`,
})
class AriaOnHostHost {}

/** A consumer's own label, and a field around a switch with its own `inputId` and description. */
@Component({
  selector: 'wj-toggleswitch-own-ids-host',
  imports: [WjToggleSwitch, WjField],
  template: `
    <p id="note">Note</p>
    <label for="plain">Plain</label>
    <wj-toggleswitch inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Terms" hint="Hint" error="Error">
      <wj-toggleswitch inputId="mine" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-toggleswitch-ngmodel-host',
  imports: [WjField, WjToggleSwitch, FormsModule],
  template: `
    <wj-field label="Accept the terms">
      <wj-toggleswitch [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<boolean | null>(true);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial `true`, written before the inner control exists. */
@Component({
  selector: 'wj-toggleswitch-reactive-host',
  imports: [WjField, WjToggleSwitch, ReactiveFormsModule],
  template: `
    <wj-field label="Accept the terms">
      <wj-toggleswitch [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl(true, { nonNullable: true });
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-toggleswitch-signal-host',
  imports: [WjField, WjToggleSwitch, FormField],
  template: `
    <wj-field label="Accept the terms">
      <wj-toggleswitch [formField]="model.terms" />
    </wj-field>
    <wj-toggleswitch ariaLabel="Bare" [formField]="model.bare" />
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal({ terms: true, bare: false });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Tick it.' });
    disabledRule(path.terms, { when: () => this.off() });
  });
}

/** Three switches for the keyboard spec, the middle one disabled. */
@Component({
  selector: 'wj-toggleswitch-keyboard-host',
  imports: [WjToggleSwitch],
  template: `
    <button type="button" id="before">Before</button>
    <wj-toggleswitch ariaLabel="First" [(checked)]="first" />
    <wj-toggleswitch ariaLabel="Disabled" disabled />
    <wj-toggleswitch ariaLabel="Last" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly first = signal(false);
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
  expect(sliderOf(element).getBoundingClientRect().width).toBe(40);
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

/** The painted track of the first switch. */
const sliderOf = (element: HTMLElement): HTMLElement =>
  find(element, '.p-toggleswitch-slider', HTMLElement);

const inputOf = (element: HTMLElement): HTMLInputElement =>
  find(element, 'input[role=switch]', HTMLInputElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjToggleSwitchHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjToggleSwitchHarness);
}

/** The switches of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjToggleSwitchHarness> {
  const all =
    await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjToggleSwitchHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-toggleswitch at index ${String(index)}`);
    }
    return found;
  };
}

function fieldOf(fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
}

const STATES: [string, (host: Host) => void][] = [
  ['unchecked', () => undefined],
  [
    'checked',
    (host) => {
      host.checked.set(true);
    },
  ],
  [
    'disabled, unchecked',
    (host) => {
      host.disabled.set(true);
    },
  ],
  [
    'disabled, checked',
    (host) => {
      host.disabled.set(true);
      host.checked.set(true);
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
      host.error.set('Accept the terms to continue.');
    },
  ],
];

describe('WjToggleSwitch', () => {
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
    it('checked is two-way: the switch follows it, and a click writes it back', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);
      expect(await toggle.isChecked()).toBe(false);

      component.checked.set(true);
      await fixture.whenStable();
      expect(await toggle.isChecked()).toBe(true);

      await toggle.uncheck();
      expect(component.checked()).toBe(false);

      await toggle.check();
      expect(component.checked()).toBe(true);
    });

    it('disabled, required and invalid reach the control', async () => {
      const { fixture, component, element } = await render();
      const toggle = await harnessOf(fixture);
      expect(await toggle.isDisabled()).toBe(false);
      expect(await toggle.isRequired()).toBe(false);
      expect(await toggle.isInvalid()).toBe(false);
      expect(getComputedStyle(sliderOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();

      expect(await toggle.isRequired()).toBe(true);
      expect(await toggle.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(sliderOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await toggle.isDisabled()).toBe(true);
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

      expect(inputOf(element).getAttribute('data-probe')).toBe('yes');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('pt reaches the root, slider and handle parts too', async () => {
      const { element } = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'a' },
          slider: { 'data-slider': 'b' },
          handle: { 'data-handle': 'c' },
        });
      });

      expect(element.querySelector('p-toggleswitch')?.getAttribute('data-root')).toBe('a');
      expect(sliderOf(element).getAttribute('data-slider')).toBe('b');
      expect(find(element, '.p-toggleswitch-handle', HTMLElement).getAttribute('data-handle')).toBe(
        'c',
      );
    });

    it('is a role=switch checkbox input with a 40 x 24 px hit box', async () => {
      const { element } = await render();
      const root = find(element, 'p-toggleswitch', HTMLElement).getBoundingClientRect();
      const box = sliderOf(element).getBoundingClientRect();

      expect(inputOf(element).type).toBe('checkbox');
      expect(inputOf(element).getAttribute('role')).toBe('switch');
      expect(root.width).toBe(40);
      expect(root.height).toBe(24);
      expect(box.width).toBe(40);
      expect(box.height).toBe(24);
    });

    it('is an inline-flex host with no box of its own around the Optimus root', async () => {
      const { element } = await render();
      const host = find(element, 'wj-toggleswitch', HTMLElement);

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(24);
      expect(host.getBoundingClientRect().width).toBe(40);
    });

    it('zeroes the handle slide under prefers-reduced-motion, on the host', async () => {
      await render();
      const reducedBlocks = (rules: CSSRuleList): CSSMediaRule[] =>
        [...rules].flatMap((rule) => {
          if (
            rule instanceof CSSMediaRule &&
            rule.conditionText.includes('prefers-reduced-motion')
          ) {
            return [rule];
          }
          return rule instanceof CSSGroupingRule ? reducedBlocks(rule.cssRules) : [];
        });
      const zeroed = [...document.styleSheets]
        .flatMap((sheet) => reducedBlocks(sheet.cssRules))
        .flatMap((rule) => [...rule.cssRules])
        .map((rule) => rule.cssText);

      expect(zeroed.some((text) => text.includes('--wj-toggleswitch-slide-duration: 0s'))).toBe(
        true,
      );
    });

    it('keeps Optimus’s 0.2s slide duration outside reduced motion', async () => {
      const { element } = await render();
      const host = find(element, 'wj-toggleswitch', HTMLElement);

      expect(getComputedStyle(host).getPropertyValue('--wj-toggleswitch-slide-duration')).toBe(
        '0.2s',
      );
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the toggled value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const toggle = await harnessOf(fixture);
        expect(await toggle.isChecked()).toBe(true);

        await toggle.uncheck();
        await fixture.whenStable();
        expect(component.value()).toBe(false);

        component.value.set(true);
        await fixture.whenStable();
        expect(await toggle.isChecked()).toBe(true);
      });

      it('disables the switch and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const toggle = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await toggle.focus();
        await toggle.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await toggle.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const toggle = await harnessOf(fixture);
        expect(await toggle.isChecked()).toBe(true);

        await toggle.uncheck();
        expect(component.control.value).toBe(false);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(true);
        expect(await toggle.isChecked()).toBe(true);
      });

      it('disables the switch and marks the control touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const toggle = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await toggle.focus();
        await toggle.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await toggle.isDisabled()).toBe(true);

        component.control.enable();
        expect(await toggle.isDisabled()).toBe(false);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(false);

        expect(component.control.dirty).toBe(false);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the toggled value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const terms = (await allHarnessesOf(fixture))(0);
        expect(await terms.isChecked()).toBe(true);

        await terms.uncheck();
        await fixture.whenStable();
        expect(component.value().terms).toBe(false);

        component.model.terms().value.set(true);
        await fixture.whenStable();
        expect(await terms.isChecked()).toBe(true);
      });

      it('disables the switch and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const terms = (await allHarnessesOf(fixture))(0);
        expect(component.model.terms().touched()).toBe(false);

        await terms.focus();
        await terms.blur();
        expect(component.model.terms().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await terms.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a switch outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.check();
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(checked)] and no forms module', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);

      await toggle.check();
      expect(component.checked()).toBe(true);

      await toggle.focus();
      await toggle.blur();
      expect(await toggle.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id that the label points at, and is named by the label', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const toggle = await harnessOf(fixture);
      const label = element.querySelector('label');
      const field = await fieldOf(fixture);

      expect(await toggle.getId()).toMatch(/^wj-toggleswitch-\d+$/);
      expect(label?.getAttribute('for')).toBe(await toggle.getId());
      // An item-sheet case: the label reaches the inner role=switch input, not the host.
      expect(inputOf(element).id).toBe(label?.getAttribute('for'));
      expect(inputOf(element).getAttribute('role')).toBe('switch');
      expect(find(element, 'wj-toggleswitch', HTMLElement).id).toBe('');
      expect(find(element, 'p-toggleswitch', HTMLElement).id).toBe('');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(true);
    });

    it('puts the label and hint beside the switch, with the track on the label’s first line', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.hint.set('You can change this later.');
      });
      const host = find(element, 'wj-toggleswitch', HTMLElement).getBoundingClientRect();
      const label = find(element, 'label', HTMLElement).getBoundingClientRect();
      const hint = find(element, '.wj-field-hint', HTMLElement).getBoundingClientRect();

      expect(label.left).toBeGreaterThanOrEqual(host.right);
      expect(hint.left).toBeGreaterThanOrEqual(host.right);
      expect(Math.abs(label.top - host.top)).toBeLessThan(1);
      expect(Math.abs(label.height - 24)).toBeLessThan(1);
    });

    it('toggles when the label is clicked', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const toggle = await harnessOf(fixture);

      find(element, 'label', HTMLElement).click();
      await fixture.whenStable();
      expect(component.checked()).toBe(true);
      expect(await toggle.isChecked()).toBe(true);

      find(element, 'label', HTMLElement).click();
      await fixture.whenStable();
      expect(component.checked()).toBe(false);
    });

    it('adopts its own inputId and merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);
      const inField = at(1);
      const field = await fieldOf(fixture);

      expect(await inField.getId()).toBe('mine');
      expect((await inField.getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await field.getHint()).toBe('Hint');
      expect(await field.getError()).toBe('Error');
    });

    it('describes the switch with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const toggle = await harnessOf(fixture);
      expect((await toggle.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await toggle.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await toggle.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const toggle = await harnessOf(fixture);
      expect(await toggle.isInvalid()).toBe(false);
      expect(getComputedStyle(sliderOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Accept the terms to continue.');
      await fixture.whenStable();
      expect(await toggle.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(sliderOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await toggle.isInvalid()).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const toggle = await harnessOf(fixture);

      expect(await toggle.getId()).toBe('');
      expect((await toggle.getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s inputId and ariaDescribedBy, and a <label for> names it', async () => {
      const { fixture, element } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
      expect(element.querySelector('label[for=plain]')?.textContent).toBe('Plain');
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await toggle.isInvalid()).toBe(true);
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId, ariaLabel, ariaLabelledBy and ariaDescribedBy on the input', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const toggle = await harnessOf(fixture);

      expect(await toggle.getId()).toBe('mine');
      expect(await toggle.getAriaAttributes()).toEqual({
        label: 'Accept the terms',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const toggle = await harnessOf(fixture);

      expect((await toggle.getAriaAttributes()).label).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-toggleswitch: aria-label is set on the host, where it is not forwarded to the ' +
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
    it('renders an HTML payload on the four ARIA string inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const toggle = await harnessOf(fixture);

      expect(await toggle.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await toggle.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });
  });

  describe('harness', () => {
    it('is found by state and by aria-label', async () => {
      const { fixture } = await renderAs(KeyboardHost, (host) => {
        host.first.set(true);
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const checked = await loader.getAllHarnesses(WjToggleSwitchHarness.with({ checked: true }));
      const last = await loader.getAllHarnesses(
        WjToggleSwitchHarness.with({ ariaLabel: /^Last$/ }),
      );
      const none = await loader.getAllHarnesses(WjToggleSwitchHarness.with({ ariaLabel: 'Other' }));

      expect(checked).toHaveLength(1);
      expect(last).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const toggle = await harnessOf(fixture);
      expect(await toggle.isFocused()).toBe(false);

      await toggle.focus();
      expect(await toggle.isFocused()).toBe(true);

      await toggle.blur();
      expect(await toggle.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-toggleswitch', HTMLElement),
        );
      });
    });
  });

  describe('keyboard', () => {
    it('Tab and Shift+Tab move focus in document order and skip a disabled switch', async () => {
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
    });

    it('Space toggles the focused switch', async () => {
      const { fixture, component } = await renderAs(KeyboardHost);
      const first = (await allHarnessesOf(fixture))(0);
      await first.focus();

      await userEvent.keyboard(' ');
      expect(component.first()).toBe(true);
      expect(await first.isChecked()).toBe(true);

      await userEvent.keyboard(' ');
      expect(component.first()).toBe(false);
    });

    it('Enter does nothing', async () => {
      const { fixture, component } = await renderAs(KeyboardHost);
      const first = (await allHarnessesOf(fixture))(0);
      await first.focus();

      await userEvent.keyboard('{Enter}');

      expect(component.first()).toBe(false);
      expect(await first.isChecked()).toBe(false);
    });
  });
});
