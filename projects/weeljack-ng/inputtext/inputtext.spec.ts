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
import { WjInputText, type WjInputTextPt, type WjInputTextSize } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
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

/** A consumer's template: one bare input, or the same input inside a field. */
@Component({
  selector: 'wj-inputtext-host',
  imports: [WjField, WjInputText],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Name" [hint]="hint()" [error]="error()">
        <input
          wjInputText
          [size]="size()"
          [pt]="pt()"
          [invalid]="invalid()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="value()"
        />
      </wj-field>
    } @else {
      <input
        wjInputText
        aria-label="Name"
        [size]="size()"
        [pt]="pt()"
        [invalid]="invalid()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
      />
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly size = signal<WjInputTextSize | undefined>(undefined);
  readonly pt = signal<WjInputTextPt>(undefined);
  readonly invalid = signal(false);
  readonly placeholder = signal('');
  readonly disabled = signal(false);
  readonly value = signal('');
}

/** A field around an input that sets its own static `id` and `aria-describedby`. */
@Component({
  selector: 'wj-inputtext-static-host',
  imports: [WjField, WjInputText],
  template: `
    <p id="note">Note</p>
    <wj-field label="Name" hint="Hint" error="Error">
      <input wjInputText id="mine" aria-describedby="note" />
    </wj-field>
  `,
})
class StaticAttributesHost {}

/** The same static attributes on an input outside any field. */
@Component({
  selector: 'wj-inputtext-bare-static-host',
  imports: [WjInputText],
  template: `
    <p id="note">Note</p>
    <label for="mine">Name</label>
    <input wjInputText id="mine" aria-describedby="note" />
    <input wjInputText aria-label="Other" />
  `,
})
class BareStaticAttributesHost {}

/** Every height step, so one render measures them all. */
@Component({
  selector: 'wj-inputtext-gallery-host',
  imports: [WjInputText],
  template: `
    <input wjInputText size="small" aria-label="Small" />
    <input wjInputText aria-label="Default" />
    <input wjInputText size="large" aria-label="Large" />
  `,
})
class GalleryHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-inputtext-ngmodel-host',
  imports: [WjField, WjInputText, FormsModule],
  template: `
    <wj-field label="Name">
      <input wjInputText [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>('Ada');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` inside a field. */
@Component({
  selector: 'wj-inputtext-reactive-host',
  imports: [WjField, WjInputText, ReactiveFormsModule],
  template: `
    <wj-field label="Name">
      <input wjInputText [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl('Ada', { nonNullable: true });
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-inputtext-signal-host',
  imports: [WjField, WjInputText, FormField],
  template: `
    <form novalidate (submit)="onSubmit($event)">
      <wj-field label="Name">
        <input wjInputText [formField]="model.name" />
      </wj-field>
      <input wjInputText aria-label="Bare" [formField]="model.bare" />
      <button type="submit">Save</button>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal({ name: 'Ada', bare: '' });
  readonly model = form(this.value, (path) => {
    required(path.name, { message: 'Enter a name.' });
    required(path.bare, { message: 'Enter a value.' });
    disabledRule(path.name, { when: () => this.off() });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.model, () => Promise.resolve());
  }
}

/** Plain native binding: no forms module at all. */
@Component({
  selector: 'wj-inputtext-plain-host',
  imports: [WjField, WjInputText],
  template: `
    <wj-field label="Name">
      <input
        wjInputText
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="touched.set(true)"
      />
    </wj-field>
  `,
})
class PlainHost {
  readonly value = signal('Ada');
  readonly disabled = signal(false);
  readonly touched = signal(false);

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.value.set(event.target.value);
    }
  }
}

/** A bare invalid attribute. */
@Component({
  selector: 'wj-inputtext-bare-invalid-host',
  imports: [WjInputText],
  template: `<input wjInputText aria-label="Name" invalid />`,
})
class BareInvalidHost {}

/** Three inputs for the keyboard spec, the middle one disabled. */
@Component({
  selector: 'wj-inputtext-keyboard-host',
  imports: [WjInputText],
  template: `
    <button type="button" id="before">Before</button>
    <input wjInputText aria-label="First" (input)="typed.set(read($event))" />
    <input wjInputText aria-label="Disabled" disabled />
    <input wjInputText aria-label="Last" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly typed = signal('');

  protected read(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }
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
  expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');
  return { fixture, component: fixture.componentInstance, element };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered<Host>> => renderAs(Host, setup, scheme);

function inputsOf(element: HTMLElement): HTMLInputElement[] {
  return Array.from(element.querySelectorAll<HTMLInputElement>('input[wjInputText]'));
}

function inputOf(element: HTMLElement): HTMLInputElement {
  const [input] = inputsOf(element);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('input[wjInputText] is missing');
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

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjInputTextHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputTextHarness);
}

/** The inputs of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjInputTextHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjInputTextHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no input[wjInputText] at index ${String(index)}`);
    }
    return found;
  };
}

function fieldOf(fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
}

const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  [
    'with a value',
    (host) => {
      host.value.set('Ada Lovelace');
    },
  ],
  [
    'with a placeholder',
    (host) => {
      host.placeholder.set('name@example.com');
    },
  ],
  [
    'disabled',
    (host) => {
      host.disabled.set(true);
      host.value.set('Ada');
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
    'invalid',
    (host) => {
      host.invalid.set(true);
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('As on your card.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Enter a name.');
    },
  ],
];

describe('WjInputText', () => {
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

  describe('inputs', () => {
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

    it('pt reaches the root, which is the input itself', async () => {
      const { element } = await render((host) => {
        host.pt.set({ root: { 'data-probe': 'yes' } });
      });

      expect(inputOf(element).getAttribute('data-probe')).toBe('yes');
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
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);
    });

    it('reads a bare invalid attribute as true', async () => {
      const { fixture } = await renderAs(BareInvalidHost);

      expect(await (await harnessOf(fixture)).isInvalid()).toBe(true);
    });

    it('leaves the native attributes native', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set('name@example.com');
        host.disabled.set(true);
      });
      const input = await harnessOf(fixture);

      expect(await input.getPlaceholder()).toBe('name@example.com');
      expect(await input.isDisabled()).toBe(true);
      expect(await input.isRequired()).toBe(false);
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const input = await harnessOf(fixture);
        expect(await input.getValue()).toBe('Ada');

        await input.setValue('Grace');
        await fixture.whenStable();

        expect(component.value()).toBe('Grace');
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
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const input = await harnessOf(fixture);
        expect(await input.getValue()).toBe('Ada');

        await input.setValue('Grace');
        expect(component.control.value).toBe('Grace');

        component.control.setValue('Linus');
        expect(await input.getValue()).toBe('Linus');
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
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const named = (await allHarnessesOf(fixture))(0);
        expect(await named.getValue()).toBe('Ada');

        await named.setValue('Grace');
        await fixture.whenStable();

        expect(component.value().name).toBe('Grace');
      });

      it('disables the input and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const named = (await allHarnessesOf(fixture))(0);
        expect(component.model.name().touched()).toBe(false);

        await named.focus();
        await named.blur();
        expect(component.model.name().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await named.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid state onto an input outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);
        expect(await bare.isInvalid()).toBe(true);

        await bare.setValue('x');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    describe('plain binding', () => {
      it('writes the value in, and the typed value out, with no forms module', async () => {
        const { fixture, component } = await renderAs(PlainHost);
        const input = await harnessOf(fixture);
        expect(await input.getValue()).toBe('Ada');

        await input.setValue('Grace');
        await fixture.whenStable();
        expect(component.value()).toBe('Grace');

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await input.isDisabled()).toBe(true);
      });

      it('is touched on blur', async () => {
        const { fixture, component } = await renderAs(PlainHost);
        const input = await harnessOf(fixture);

        await input.focus();
        await input.blur();

        expect(component.touched()).toBe(true);
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

      expect(await input.getId()).toMatch(/^wj-inputtext-\d+$/);
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

      component.error.set('Enter a name.');
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
      const { fixture } = await renderAs(SignalHost);
      const named = (await allHarnessesOf(fixture))(0);
      const field = await fieldOf(fixture);

      await named.setValue('');
      await fixture.whenStable();
      expect(await named.isInvalid()).toBe(false);

      await named.blur();
      await fixture.whenStable();
      expect(await named.isInvalid()).toBe(true);
      expect(await field.getError()).toBe('Enter a name.');
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
  });

  describe('harness', () => {
    it('is found by placeholder', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set('name@example.com');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const found = await loader.getAllHarnesses(
        WjInputTextHarness.with({ placeholder: /^name@/ }),
      );
      const none = await loader.getAllHarnesses(WjInputTextHarness.with({ placeholder: 'other' }));

      expect(found).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('reads the ARIA attributes and the focus state', async () => {
      const { fixture } = await render();
      const input = await harnessOf(fixture);

      expect(await input.getAriaAttributes()).toEqual({
        label: 'Name',
        labelledBy: null,
        describedBy: null,
      });
      expect(await input.isFocused()).toBe(false);

      await input.focus();
      expect(await input.isFocused()).toBe(true);

      await input.blur();
      expect(await input.isFocused()).toBe(false);
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

    it('typing updates the value', async () => {
      const { fixture, component } = await renderAs(KeyboardHost);
      const first = (await allHarnessesOf(fixture))(0);
      await first.focus();

      await userEvent.keyboard('Ada');

      expect(component.typed()).toBe('Ada');
      expect(await first.getValue()).toBe('Ada');
    });
  });
});
