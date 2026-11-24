import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjInputMask } from 'weeljack-ng/inputmask';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjKeyFilter, type WjKeyFilterPattern } from 'weeljack-ng/keyfilter';
import { WjKeyFilterHarness } from 'weeljack-ng/keyfilter/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Pattern = RegExp | WjKeyFilterPattern | null | undefined;

/** One bare native input with a bound pattern. */
@Component({
  selector: 'wj-keyfilter-native-host',
  imports: [WjKeyFilter],
  template: `
    <input
      [wjKeyFilter]="pattern()"
      aria-label="Value"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
    />
  `,
})
class NativeHost {
  readonly pattern = signal<Pattern>('pint');
  readonly placeholder = signal('');
  readonly disabled = signal(false);
}

/** A filtered `wjInputText`, bare or inside a field. */
@Component({
  selector: 'wj-keyfilter-text-host',
  imports: [WjField, WjInputText, WjKeyFilter],
  template: `
    @if (inField()) {
      <wj-field label="Postcode" [hint]="hint()" [error]="error()">
        <input wjInputText [wjKeyFilter]="pattern()" [value]="value()" [disabled]="disabled()" />
      </wj-field>
    } @else {
      <input
        wjInputText
        [wjKeyFilter]="pattern()"
        aria-label="Postcode"
        [value]="value()"
        [disabled]="disabled()"
      />
    }
  `,
})
class TextHost {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly pattern = signal<Pattern>('pint');
  readonly value = signal('');
  readonly disabled = signal(false);
}

/** The attribute written statically, as the docs write it. */
@Component({
  selector: 'wj-keyfilter-static-host',
  imports: [WjInputText, WjKeyFilter],
  template: `
    <input wjKeyFilter="pint" aria-label="Native" />
    <input wjInputText wjKeyFilter="alpha" aria-label="Styled" />
  `,
})
class StaticHost {}

/** A filter beside a mask. */
@Component({
  selector: 'wj-keyfilter-mask-host',
  imports: [WjInputMask, WjKeyFilter],
  template: `<input wjInputMask="aaa-9999" wjKeyFilter="alphanum" aria-label="Code" />`,
})
class MaskHost {}

/** `ngModel` on a filtered `wjInputText` inside a field. */
@Component({
  selector: 'wj-keyfilter-ngmodel-host',
  imports: [WjField, WjInputText, WjKeyFilter, FormsModule],
  template: `
    <wj-field label="Postcode">
      <input wjInputText wjKeyFilter="pint" [(ngModel)]="value" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>('');
}

/** A reactive `FormControl` on a filtered `wjInputText` inside a field. */
@Component({
  selector: 'wj-keyfilter-reactive-host',
  imports: [WjField, WjInputText, WjKeyFilter, ReactiveFormsModule],
  template: `
    <wj-field label="Postcode">
      <input wjInputText wjKeyFilter="pint" [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl('', { nonNullable: true });
}

/** Signal forms with `[formField]` on a filtered `wjInputText` inside a field. */
@Component({
  selector: 'wj-keyfilter-signal-host',
  imports: [WjField, WjInputText, WjKeyFilter, FormField],
  template: `
    <wj-field label="Postcode">
      <input wjInputText wjKeyFilter="pint" [formField]="model.postcode" />
    </wj-field>
  `,
})
class SignalHost {
  readonly value = signal({ postcode: '' });
  readonly model = form(this.value);
}

/** A one-input form: Enter submits it. */
@Component({
  selector: 'wj-keyfilter-form-host',
  imports: [WjKeyFilter],
  template: `
    <button type="button" id="before">Before</button>
    <form (submit)="onSubmit($event)">
      <input wjKeyFilter="pint" aria-label="Value" />
    </form>
    <button type="button" id="after">After</button>
  `,
})
class FormHost {
  readonly submitted = signal(0);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.update((count) => count + 1);
  }
}

/** Two filtered inputs, to find one by placeholder. */
@Component({
  selector: 'wj-keyfilter-pair-host',
  imports: [WjKeyFilter],
  template: `
    <input wjKeyFilter="pint" aria-label="Digits" placeholder="Digits" />
    <input wjKeyFilter="alpha" aria-label="Letters" placeholder="Letters" />
  `,
})
class PairHost {}

/**
 * The three forms APIs with the forms directive listed before `wjKeyFilter`: the accessor then
 * hears an `input` event before Optimus's Android handler restores the text, so only the
 * re-dispatched `input` event lets the form read the restored text.
 */
@Component({
  selector: 'wj-keyfilter-android-ngmodel-host',
  imports: [FormsModule, WjInputText, WjKeyFilter],
  template: `<input wjInputText wjKeyFilter="pint" aria-label="Postcode" [(ngModel)]="value" />`,
})
class AndroidNgModelHost {
  readonly value = signal<string | null>('');
}

@Component({
  selector: 'wj-keyfilter-android-reactive-host',
  imports: [ReactiveFormsModule, WjInputText, WjKeyFilter],
  template: `<input
    wjInputText
    wjKeyFilter="pint"
    aria-label="Postcode"
    [formControl]="control"
  />`,
})
class AndroidReactiveHost {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'wj-keyfilter-android-signal-host',
  imports: [FormField, WjInputText, WjKeyFilter],
  template: `<input
    wjInputText
    wjKeyFilter="pint"
    aria-label="Postcode"
    [formField]="model.postcode"
  />`,
})
class AndroidSignalHost {
  readonly value = signal({ postcode: '' });
  readonly model = form(this.value);
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
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

function inputsOf(element: HTMLElement): HTMLInputElement[] {
  return Array.from(element.querySelectorAll<HTMLInputElement>('input[wjKeyFilter]'));
}

function inputOf(element: HTMLElement): HTMLInputElement {
  const [input] = inputsOf(element);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('input[wjKeyFilter] is missing');
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

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjKeyFilterHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjKeyFilterHarness);
}

/** Focuses the input and types `text` with real, trusted keys (the browser honours a block). */
async function typeKeys(input: WjKeyFilterHarness, text: string): Promise<void> {
  await input.focus();
  await userEvent.keyboard(text);
}

/** Dispatches a cancelable `paste` carrying `text` and reports whether it was blocked. */
function pasteBlocked(input: HTMLInputElement, text: string): boolean {
  const clipboardData = new DataTransfer();
  clipboardData.setData('text', text);
  const event = new ClipboardEvent('paste', { clipboardData, cancelable: true, bubbles: true });
  input.dispatchEvent(event);
  return event.defaultPrevented;
}

/** What each named pattern keeps of `typed`: allowed characters in, the rest dropped. */
const PRESETS: [WjKeyFilterPattern, string, string][] = [
  ['pint', '1a-.2 ', '12'],
  ['int', '-1-2a.', '-12'],
  ['pnum', '1.2-a ', '1.2'],
  ['money', '1,2 3.5x-', '1,2 3.5'],
  ['num', '-1.5-x,', '-1.5'],
  ['hex', 'aF09g-', 'aF09'],
  ['email', 'a_b.c-d@e! ', 'a_b.c-d@e'],
  ['alpha', 'aB_c1-', 'aB_c'],
  ['alphanum', 'a1_B-! ', 'a1_B'],
];

describe('WjKeyFilter', () => {
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

  describe('named patterns', () => {
    it.each(PRESETS)('%s keeps only the characters it names', async (pattern, typed, kept) => {
      const { fixture } = await renderAs(NativeHost, (host) => {
        host.pattern.set(pattern);
      });
      const input = await harnessOf(fixture);

      await typeKeys(input, typed);

      expect(await input.getValue()).toBe(kept);
    });

    it('takes a changed pattern from the next key', async () => {
      const { fixture, component } = await renderAs(NativeHost);
      const input = await harnessOf(fixture);
      await typeKeys(input, '1a');
      expect(await input.getValue()).toBe('1');

      component.pattern.set('alpha');
      await fixture.whenStable();
      await input.clear();
      await typeKeys(input, '2b');

      expect(await input.getValue()).toBe('b');
    });

    it('accepts every key when there is no pattern', async () => {
      const { fixture } = await renderAs(NativeHost, (host) => {
        host.pattern.set(undefined);
      });
      const input = await harnessOf(fixture);

      await typeKeys(input, 'a1-!');

      expect(await input.getValue()).toBe('a1-!');
    });
  });

  describe('a regular expression', () => {
    it('keeps the characters the expression accepts, anchored over the whole text', async () => {
      const { fixture } = await renderAs(NativeHost, (host) => {
        host.pattern.set(/^[A-Za-z0-9-]*$/);
      });
      const input = await harnessOf(fixture);

      await typeKeys(input, 'ab-1!_ 2');

      expect(await input.getValue()).toBe('ab-12');
    });

    it('with a quantifier stops the key that would overshoot', async () => {
      const { fixture } = await renderAs(NativeHost, (host) => {
        host.pattern.set(/^\d{0,4}$/);
      });
      const input = await harnessOf(fixture);

      await typeKeys(input, '123456');

      expect(await input.getValue()).toBe('1234');
    });

    it('lets a key through after the first when the expression is not anchored', async () => {
      const { fixture } = await renderAs(NativeHost, (host) => {
        host.pattern.set(/[a-z]/);
      });
      const input = await harnessOf(fixture);

      await typeKeys(input, '1a!');

      // The empty input rejects "1" and accepts "a", then "a!" still contains a letter.
      expect(await input.getValue()).toBe('a!');
    });
  });

  describe('paste', () => {
    it('is blocked when any pasted character fails, and kept when all pass', async () => {
      const { element } = await renderAs(NativeHost);
      const input = inputOf(element);

      expect(pasteBlocked(input, '12a')).toBe(true);
      expect(pasteBlocked(input, '123')).toBe(false);
    });

    it('is blocked as a whole text for a quantified expression', async () => {
      const { element } = await renderAs(NativeHost, (host) => {
        host.pattern.set(/^\d{4}$/);
      });
      const input = inputOf(element);

      expect(pasteBlocked(input, '12345')).toBe(true);
      expect(pasteBlocked(input, '1234')).toBe(false);
    });

    it('through the harness adds only an accepted text', async () => {
      const { fixture } = await renderAs(NativeHost);
      const input = await harnessOf(fixture);

      await input.pasteText('12a');
      expect(await input.getValue()).toBe('');

      await input.pasteText('123');
      expect(await input.getValue()).toBe('123');
    });
  });

  describe('navigation keys', () => {
    it('Backspace, Delete and the arrows keep editing the text', async () => {
      const { fixture } = await renderAs(NativeHost);
      const input = await harnessOf(fixture);
      await typeKeys(input, '1234');

      await userEvent.keyboard('{Backspace}');
      expect(await input.getValue()).toBe('123');

      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}9');
      expect(await input.getValue()).toBe('1923');

      await userEvent.keyboard('{Delete}');
      expect(await input.getValue()).toBe('193');

      await userEvent.keyboard('{Home}8{End}7');
      expect(await input.getValue()).toBe('81937');
    });

    it('Tab moves focus on', async () => {
      const { fixture, element } = await renderAs(FormHost);
      const input = await harnessOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await input.isFocused()).toBe(true);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await input.isFocused()).toBe(true);
    });

    it('Enter submits the form', async () => {
      const { fixture, component } = await renderAs(FormHost);
      const input = await harnessOf(fixture);
      await typeKeys(input, '12');

      await userEvent.keyboard('{Enter}');

      expect(component.submitted()).toBe(1);
    });

    it('Escape is left alone', async () => {
      const { fixture } = await renderAs(NativeHost);
      const input = await harnessOf(fixture);
      await typeKeys(input, '12');

      await userEvent.keyboard('{Escape}');

      expect(await input.getValue()).toBe('12');
      expect(await input.isFocused()).toBe(true);
    });
  });

  describe('beside the other inputs', () => {
    it('filters a wjInputText, whose look stays', async () => {
      const { fixture, element } = await renderAs(TextHost);
      const input = await harnessOf(fixture);

      await typeKeys(input, '1a2');

      expect(await input.getValue()).toBe('12');
      expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');
    });

    it('works on a wjInputMask without breaking the mask', async () => {
      const { fixture } = await renderAs(MaskHost);
      const input = await harnessOf(fixture);
      await input.focus();
      await expect.poll(() => input.getValue()).toBe('___-____');

      await userEvent.keyboard('ab1');

      // The mask writes the keys it accepts itself, so its own pattern decides: it shapes the
      // text and the filter adds no second character.
      expect(await input.getValue()).toBe('ab_-____');
    });

    it('is found by its attribute when the pattern is written statically', async () => {
      const { element } = await renderAs(StaticHost);

      expect(inputsOf(element)).toHaveLength(2);
    });

    it('is found by its attribute when the pattern is bound', async () => {
      const { element } = await renderAs(NativeHost);

      expect(inputsOf(element)).toHaveLength(1);
    });
  });

  describe('the forms APIs', () => {
    describe('ngModel', () => {
      it('holds only accepted characters, and shows a written value', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const input = await harnessOf(fixture);

        await typeKeys(input, '1a2b');
        await fixture.whenStable();
        expect(component.value()).toBe('12');

        component.value.set('999');
        await fixture.whenStable();
        expect(await input.getValue()).toBe('999');
      });
    });

    describe('FormControl', () => {
      it('holds only accepted characters, and shows a written value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const input = await harnessOf(fixture);

        await typeKeys(input, '1a2b');
        expect(component.control.value).toBe('12');

        component.control.setValue('999');
        expect(await input.getValue()).toBe('999');
      });
    });

    describe('[formField]', () => {
      it('holds only accepted characters, and shows a written value', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const input = await harnessOf(fixture);

        await typeKeys(input, '1a2b');
        await fixture.whenStable();
        expect(component.value().postcode).toBe('12');

        component.model.postcode().value.set('999');
        await fixture.whenStable();
        expect(await input.getValue()).toBe('999');
      });
    });
  });

  describe('Android', () => {
    /**
     * Optimus picks its Android path in the directive's constructor from `navigator.userAgent`, so
     * the stub is in place before the fixture is created. It stubs the environment, not Optimus.
     */
    function stubAndroid(): void {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
      );
    }

    it('restores the last valid text and tells ngModel', async () => {
      stubAndroid();
      const { fixture, component } = await renderAs(AndroidNgModelHost);
      const input = await harnessOf(fixture);

      await typeKeys(input, '1a2b');
      await fixture.whenStable();

      expect(await input.getValue()).toBe('12');
      expect(component.value()).toBe('12');
    });

    it('restores the last valid text and tells a FormControl', async () => {
      stubAndroid();
      const { fixture, component } = await renderAs(AndroidReactiveHost);
      const input = await harnessOf(fixture);

      await typeKeys(input, '1a2b');

      expect(await input.getValue()).toBe('12');
      expect(component.control.value).toBe('12');
    });

    it('restores the last valid text and tells [formField]', async () => {
      stubAndroid();
      const { fixture, component } = await renderAs(AndroidSignalHost);
      const input = await harnessOf(fixture);

      await typeKeys(input, '1a2b');
      await fixture.whenStable();

      expect(await input.getValue()).toBe('12');
      expect(component.value().postcode).toBe('12');
    });

    it('lets a key reach the input, restores it, and dispatches a second input event', async () => {
      stubAndroid();
      const { element } = await renderAs(AndroidReactiveHost);
      const input = inputOf(element);
      const heard: string[] = [];
      element.addEventListener('input', () => {
        heard.push(input.value);
      });

      input.focus();
      await userEvent.keyboard('a');
      // Not blocked at keypress: the browser's own `input` event came, then ours after the restore.
      expect(heard).toEqual(['', '']);

      heard.length = 0;
      // An accepted key is one event: Optimus restores nothing, so nothing is re-dispatched.
      await userEvent.keyboard('2');
      expect(heard).toEqual(['2']);
    });
  });

  describe('safety', () => {
    it('keeps or drops a typed or pasted payload as characters, and never parses it', async () => {
      const { fixture, element } = await renderAs(NativeHost, (host) => {
        host.pattern.set(/^.*$/);
      });
      const input = await harnessOf(fixture);

      await input.pasteText(PAYLOAD);

      expect(await input.getValue()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      await input.clear();
      await input.typeText(PAYLOAD);
      expect(await input.getValue()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('drops every character of a payload that the pattern rejects', async () => {
      const { fixture, element } = await renderAs(NativeHost, (host) => {
        host.pattern.set('pint');
      });
      const input = await harnessOf(fixture);

      await input.typeText(PAYLOAD);
      await input.pasteText(PAYLOAD);

      expect(await input.getValue()).toBe('');
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by placeholder', async () => {
      const { fixture } = await renderAs(PairHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const letters = await loader.getHarness(WjKeyFilterHarness.with({ placeholder: 'Letters' }));
      const digits = await loader.getHarness(WjKeyFilterHarness.with({ placeholder: /^Dig/ }));

      expect(await letters.getPlaceholder()).toBe('Letters');
      expect(await digits.getPlaceholder()).toBe('Digits');
      expect(await loader.getAllHarnesses(WjKeyFilterHarness)).toHaveLength(2);
    });

    it('types text one key at a time and drops what the filter blocks', async () => {
      const { fixture } = await renderAs(NativeHost, (host) => {
        host.pattern.set('alpha');
      });
      const input = await harnessOf(fixture);

      await input.typeText('ab1c-d');
      expect(await input.getValue()).toBe('abcd');

      await input.clear();
      expect(await input.getValue()).toBe('');
    });

    it('reads the disabled and focus states', async () => {
      const { fixture, component } = await renderAs(NativeHost);
      const input = await harnessOf(fixture);
      expect(await input.isDisabled()).toBe(false);
      expect(await input.isFocused()).toBe(false);

      await input.focus();
      expect(await input.isFocused()).toBe(true);
      await input.blur();
      expect(await input.isFocused()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await input.isDisabled()).toBe(true);
    });
  });

  describe('setup checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(NativeHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: input[wjKeyFilter]: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns nothing when set up, and has no ARIA input or host warning', async () => {
      const { element } = await renderAs(NativeHost);

      expect(warn).not.toHaveBeenCalled();
      expect(inputOf(element).getAttribute('aria-label')).toBe('Value');
    });
  });

  describe('accessibility', () => {
    const STATES: [string, (host: TextHost) => void][] = [
      [
        'in a field with a hint',
        (host) => {
          host.inField.set(true);
          host.hint.set('Digits only.');
        },
      ],
      [
        'in a field with an error',
        (host) => {
          host.inField.set(true);
          host.error.set('Enter the digits of your postcode.');
        },
      ],
      [
        'in a field with a value',
        (host) => {
          host.inField.set(true);
          host.hint.set('Digits only.');
          host.value.set('12345');
        },
      ],
      [
        'bare',
        (host) => {
          host.value.set('12345');
        },
      ],
      [
        'disabled',
        (host) => {
          host.inField.set(true);
          host.disabled.set(true);
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await renderAs(TextHost, setup, scheme);
        // A render without Optimus's styles would pass axe for the wrong reason: fail loudly.
        expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');

        await expectNoAxeViolations(element.querySelector('wj-field') ?? inputOf(element));
      });
    });
  });
});
