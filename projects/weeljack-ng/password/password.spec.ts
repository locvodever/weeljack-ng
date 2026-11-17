/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import { WjPassword, type WjPasswordPt, type WjPasswordSize } from 'weeljack-ng/password';
import { WjPasswordHarness } from 'weeljack-ng/password/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/** A consumer's template: one bare password, or the same password inside a field. */
@Component({
  selector: 'wj-password-host',
  imports: [WjField, WjPassword],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="New password" [hint]="hint()" [error]="error()">
        <wj-password
          [(value)]="value"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [toggleMask]="toggleMask()"
          [feedback]="feedback()"
          [placeholder]="placeholder()"
          [autocomplete]="autocomplete()"
        />
      </wj-field>
    } @else {
      <wj-password
        ariaLabel="New password"
        [(value)]="value"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
        [toggleMask]="toggleMask()"
        [feedback]="feedback()"
        [placeholder]="placeholder()"
        [autocomplete]="autocomplete()"
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
  readonly pt = signal<WjPasswordPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjPasswordSize | undefined>(undefined);
  readonly toggleMask = signal(false);
  readonly feedback = signal(true);
  readonly placeholder = signal<string | undefined>(undefined);
  readonly autocomplete = signal<string | undefined>(undefined);
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-password-aria-host',
  imports: [WjPassword],
  template: `
    <wj-password
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('New password');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-password-aria-on-host-host',
  imports: [WjPassword],
  template: `<wj-password aria-label="New password" />`,
})
class AriaOnHostHost {}

/** A consumer's own label, and a field around a password with its own `inputId` and description. */
@Component({
  selector: 'wj-password-own-ids-host',
  imports: [WjPassword, WjField],
  template: `
    <p id="note">Note</p>
    <label for="plain">Plain</label>
    <wj-password inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Password" hint="Hint" error="Error">
      <wj-password inputId="mine" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-password-ngmodel-host',
  imports: [WjField, WjPassword, FormsModule],
  template: `
    <wj-field label="New password">
      <wj-password [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>('start');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-password-reactive-host',
  imports: [WjField, WjPassword, ReactiveFormsModule],
  template: `
    <wj-field label="New password">
      <wj-password [formControl]="control" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<string | null>('start');
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-password-signal-host',
  imports: [WjField, WjPassword, FormField],
  template: `
    <wj-field label="New password">
      <wj-password [formField]="model.secret" />
    </wj-field>
    <wj-password ariaLabel="Bare" [formField]="model.bare" />
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal({ secret: 'start', bare: '' });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Enter it.' });
    disabledRule(path.secret, { when: () => this.off() });
  });
}

/** Two controls for the keyboard spec: the toggle is part of the tab order. */
@Component({
  selector: 'wj-password-keyboard-host',
  imports: [WjPassword],
  template: `
    <button type="button" id="before">Before</button>
    <wj-password ariaLabel="First" toggleMask />
    <wj-password ariaLabel="Disabled" toggleMask disabled />
    <wj-password ariaLabel="Last" />
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
  expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');
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

const toggleOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, 'button.wj-password-toggle', HTMLButtonElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjPasswordHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjPasswordHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjPasswordHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjPasswordHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-password at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/**
 * Waits until the overlay is fully open: shown, with its enter over. Optimus keeps `p-motion`
 * hidden (`display: none`) while closed, and shows it and starts the enter in the same frame, so a
 * shown `p-motion` with no motion class left means the enter has ended. This also holds when the
 * enter was already over before the first sample (a slow keystroke under load).
 */
async function overlayOpen(element: HTMLElement): Promise<void> {
  const open = (): boolean => {
    const motion = element.querySelector<HTMLElement>('p-motion');
    return motion !== null && motion.style.display !== 'none' && motion.className === 'p-motion';
  };
  await expect.poll(open).toBe(true);
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const STATES: [string, (host: Host) => void][] = [
  [
    'masked',
    (host) => {
      host.toggleMask.set(true);
    },
  ],
  [
    'unmasked',
    (host) => {
      host.toggleMask.set(true);
      host.value.set('secret');
    },
  ],
  [
    'disabled',
    (host) => {
      host.toggleMask.set(true);
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.toggleMask.set(true);
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.toggleMask.set(true);
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.toggleMask.set(true);
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.toggleMask.set(true);
      host.hint.set('At least 12 characters.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.toggleMask.set(true);
      host.error.set('Enter a password.');
    },
  ],
];

describe('WjPassword', () => {
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
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await emulateReducedMotion(false);
  });

  describe('inputs', () => {
    it('value is two-way: the input follows it, and typing writes it back', async () => {
      const { fixture, component } = await render();
      const password = await harnessOf(fixture);
      expect(await password.getValue()).toBe('');

      component.value.set('from the model');
      await fixture.whenStable();
      expect(await password.getValue()).toBe('from the model');

      await password.setValue('typed');
      expect(component.value()).toBe('typed');
    });

    it('disabled, required and invalid reach the input', async () => {
      const { fixture, component, element } = await render();
      const password = await harnessOf(fixture);
      expect(await password.isDisabled()).toBe(false);
      expect(await password.isRequired()).toBe(false);
      expect(await password.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await password.isRequired()).toBe(true);
      expect(await password.isInvalid()).toBe(true);
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await password.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('placeholder and autocomplete reach the input and follow the bound value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.placeholder.set('At least 12 characters');
        host.autocomplete.set('new-password');
      });
      const password = await harnessOf(fixture);

      expect(await password.getPlaceholder()).toBe('At least 12 characters');
      expect(inputOf(element).getAttribute('autocomplete')).toBe('new-password');

      component.autocomplete.set('current-password');
      component.placeholder.set(undefined);
      await fixture.whenStable();
      expect(inputOf(element).getAttribute('autocomplete')).toBe('current-password');
      expect(await password.getPlaceholder()).toBeNull();
    });

    it('pt reaches the input, root and meter parts, and the routed attributes win over it', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'a' },
          pcInputText: { root: { 'data-probe': 'yes', 'aria-invalid': 'false' } },
          meter: { 'data-meter': 'b' },
        });
        host.invalid.set(true);
      });
      await (await harnessOf(fixture)).setValue('abc');

      expect(find(element, 'p-password', HTMLElement).getAttribute('data-root')).toBe('a');
      expect(inputOf(element).getAttribute('data-probe')).toBe('yes');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(find(element, '.p-password-meter', HTMLElement).getAttribute('data-meter')).toBe('b');
    });

    it('is an inline-flex host with the Optimus root and input stretched to its width', async () => {
      const { element } = await render();
      const host = find(element, 'wj-password', HTMLElement);
      host.style.inlineSize = '320px';

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(find(element, 'p-password', HTMLElement).getBoundingClientRect().width).toBe(320);
      expect(inputOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('steps the height 36 / 44 / 52 px with size, and follows the bound value', async () => {
      const { fixture, component, element } = await render();
      const height = (): number => inputOf(element).getBoundingClientRect().height;
      expect(height()).toBe(44);
      expect(find(element, 'wj-password', HTMLElement).getBoundingClientRect().height).toBe(44);

      component.size.set('small');
      await fixture.whenStable();
      expect(height()).toBe(36);

      component.size.set('large');
      await fixture.whenStable();
      expect(height()).toBe(52);
    });
  });

  describe('the mask toggle', () => {
    it('is absent without toggleMask', async () => {
      const { fixture, element } = await render();

      expect(await (await harnessOf(fixture)).hasToggle()).toBe(false);
      expect(element.querySelector('button.wj-password-toggle')).toBeNull();
      expect(element.querySelector('[data-p-icon]')).toBeNull();
    });

    it('is a real button after the input, named "Show Password" while masked, not pressed', async () => {
      const { fixture, element } = await render((host) => {
        host.toggleMask.set(true);
      });
      const password = await harnessOf(fixture);
      const button = toggleOf(element);

      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(await password.isMasked()).toBe(true);
      expect(await password.getToggleName()).toBe('Show Password');
      expect(await password.isTogglePressed()).toBe(false);
      expect(button.querySelector('svg[data-p-icon="eye"]')).not.toBeNull();
      expect(
        inputOf(element).compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('a click shows the text, renames the button "Hide Password" and presses it', async () => {
      const { fixture, element } = await render((host) => {
        host.toggleMask.set(true);
        host.value.set('secret');
      });
      const password = await harnessOf(fixture);

      await password.toggleMask();

      expect(await password.isMasked()).toBe(false);
      expect(inputOf(element).type).toBe('text');
      expect(await password.getValue()).toBe('secret');
      expect(await password.getToggleName()).toBe('Hide Password');
      expect(await password.isTogglePressed()).toBe(true);
      expect(toggleOf(element).querySelector('svg[data-p-icon="eyeslash"]')).not.toBeNull();

      await password.toggleMask();
      expect(await password.isMasked()).toBe(true);
      expect(await password.getToggleName()).toBe('Show Password');
      expect(await password.isTogglePressed()).toBe(false);
    });

    it('keeps focus on the same button after a click, Enter and Space', async () => {
      const { fixture, element } = await render((host) => {
        host.toggleMask.set(true);
      });
      const password = await harnessOf(fixture);
      const button = toggleOf(element);

      await userEvent.click(button);
      await fixture.whenStable();
      expect(await password.isMasked()).toBe(false);
      expect(document.activeElement).toBe(button);
      expect(toggleOf(element)).toBe(button);

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(await password.isMasked()).toBe(true);
      expect(document.activeElement).toBe(button);
      expect(toggleOf(element)).toBe(button);

      await userEvent.keyboard(' ');
      await fixture.whenStable();
      expect(await password.isMasked()).toBe(false);
      expect(document.activeElement).toBe(button);
      expect(toggleOf(element)).toBe(button);
      expect(await password.isToggleFocused()).toBe(true);
    });

    it('is disabled with the control, and cannot flip the mask', async () => {
      const { fixture, component, element } = await render((host) => {
        host.toggleMask.set(true);
      });
      const password = await harnessOf(fixture);
      expect(toggleOf(element).disabled).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(toggleOf(element).disabled).toBe(true);
      toggleOf(element).click();
      await fixture.whenStable();
      expect(await password.isMasked()).toBe(true);
    });

    it('has a hit box of 28 / 36 / 44 px, inset 4 px in the box, and the text clears it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.toggleMask.set(true);
      });
      const side = (): number => toggleOf(element).getBoundingClientRect().width;
      const clearance = (): number => parseFloat(getComputedStyle(inputOf(element)).paddingRight);

      for (const [size, expected] of [
        [undefined, 36],
        ['small', 28],
        ['large', 44],
      ] as const) {
        component.size.set(size);
        await fixture.whenStable();
        const box = inputOf(element).getBoundingClientRect();
        const button = toggleOf(element).getBoundingClientRect();

        expect(side()).toBe(expected);
        expect(button.height).toBe(expected);
        expect(box.right - button.right).toBe(4);
        expect(button.top - box.top).toBe(4);
        expect(clearance()).toBeGreaterThanOrEqual(expected + 8);
      }
    });

    it('draws the glyph in the muted text colour', async () => {
      const { element } = await render((host) => {
        host.toggleMask.set(true);
      });
      const muted = getComputedStyle(document.documentElement)
        .getPropertyValue('--wj-text-muted-color')
        .trim();
      const probe = document.createElement('span');
      probe.style.color = muted;
      document.body.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();

      expect(getComputedStyle(toggleOf(element)).color).toBe(expected);
    });

    it('keeps a long value inside the input, under the padding that clears the button', async () => {
      const { fixture, element } = await render((host) => {
        host.toggleMask.set(true);
        host.value.set('x'.repeat(200));
      });
      await fixture.whenStable();
      const host = find(element, 'wj-password', HTMLElement);
      host.style.inlineSize = '200px';

      expect(inputOf(element).getBoundingClientRect().width).toBe(200);
      expect(inputOf(element).scrollWidth).toBeGreaterThan(200);
    });
  });

  describe('the translated labels', () => {
    it('reads the English default of the wj group', async () => {
      const { fixture } = await render((host) => {
        host.toggleMask.set(true);
      });
      const password = await harnessOf(fixture);

      expect(await password.getToggleName()).toBe('Show Password');
      await password.toggleMask();
      expect(await password.getToggleName()).toBe('Hide Password');
    });

    it('reads a vi override, and the Optimus prompt and strength texts follow it', async () => {
      const { fixture } = await renderAs(
        Host,
        (host) => {
          host.toggleMask.set(true);
        },
        'light',
        { translation: viLocale },
      );
      const password = await harnessOf(fixture);

      expect(await password.getToggleName()).toBe(viLocale.wj?.showPassword);
      await password.toggleMask();
      expect(await password.getToggleName()).toBe(viLocale.wj?.hidePassword);

      await password.focus();
      await userEvent.keyboard('a');
      expect(await password.getStrengthText()).toBe(viLocale.weak);
      await password.blur();
    });

    it('reads a partial override and keeps the other English label', async () => {
      const { fixture } = await renderAs(
        Host,
        (host) => {
          host.toggleMask.set(true);
        },
        'light',
        { translation: { wj: { showPassword: 'Reveal' } } },
      );
      const password = await harnessOf(fixture);

      expect(await password.getToggleName()).toBe('Reveal');
      await password.toggleMask();
      expect(await password.getToggleName()).toBe('Hide Password');
    });
  });

  describe('the strength overlay', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('opens on typing with the strength text, and closes on blur', async () => {
      const { fixture, element } = await render();
      const password = await harnessOf(fixture);
      expect(await password.getStrengthText()).toBeNull();

      await password.focus();
      await userEvent.keyboard('a');
      expect(await password.getStrengthText()).toBe('Weak');

      await userEvent.keyboard('bcdefgh1A!');
      expect(await password.getStrengthText()).toBe('Strong');

      await overlayOpen(element);
      await password.blur();
      await expect.poll(() => password.getStrengthText()).toBeNull();
    });

    it('Escape closes the overlay and focus stays on the input', async () => {
      const { fixture, element } = await render();
      const password = await harnessOf(fixture);
      await password.focus();
      await userEvent.keyboard('a');
      expect(await password.getStrengthText()).not.toBeNull();

      await overlayOpen(element);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => password.getStrengthText()).toBeNull();
      expect(await password.isFocused()).toBe(true);
    });

    it('stays closed with feedback off', async () => {
      const { fixture } = await render((host) => {
        host.feedback.set(false);
      });
      const password = await harnessOf(fixture);

      await password.focus();
      await userEvent.keyboard('a');

      expect(await password.getStrengthText()).toBeNull();
    });

    it('opens with a motion by default, and without one under reduced motion', async () => {
      const animations = async (reduce: boolean): Promise<number> => {
        await emulateReducedMotion(reduce);
        const { fixture } = await render();
        const password = await harnessOf(fixture);
        await password.focus();
        await userEvent.keyboard('a');
        await expect.poll(() => password.getStrengthText()).not.toBeNull();
        const count = document.getAnimations().length;
        TestBed.resetTestingModule();
        return count;
      };

      expect(await animations(false)).toBeGreaterThan(0);
      expect(await animations(true)).toBe(0);
    });

    it('does not animate the meter fill under reduced motion, and does by default', async () => {
      const fill = (element: HTMLElement): string =>
        getComputedStyle(find(element, '.p-password-meter-label', HTMLElement)).transitionProperty;

      const normal = await render();
      await (await harnessOf(normal.fixture)).setValue('a');
      expect(fill(normal.element)).toBe('width');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await (await harnessOf(reduced.fixture)).setValue('a');
      expect(fill(reduced.element)).toBe('none');
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const password = await harnessOf(fixture);
        expect(await password.getValue()).toBe('start');

        await password.setValue('typed');
        await fixture.whenStable();
        expect(component.value()).toBe('typed');

        component.value.set('from the model');
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await password.getValue()).toBe('from the model');
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const password = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await password.focus();
        await password.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await password.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const password = await harnessOf(fixture);
        expect(await password.getValue()).toBe('start');

        await password.setValue('typed');
        expect(component.control.value).toBe('typed');
        expect(component.control.dirty).toBe(true);

        component.control.setValue('from the form');
        expect(await password.getValue()).toBe('from the form');
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const password = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await password.focus();
        await password.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await password.isDisabled()).toBe(true);

        component.control.enable();
        expect(await password.isDisabled()).toBe(false);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue('from the form');

        expect(component.control.dirty).toBe(false);
      });

      it('shows an empty input for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getValue()).toBe('');
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the typed value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const secret = (await allHarnessesOf(fixture))(0);
        expect(await secret.getValue()).toBe('start');

        await secret.setValue('typed');
        await fixture.whenStable();
        expect(component.value().secret).toBe('typed');

        component.model.secret().value.set('from the form');
        await fixture.whenStable();
        expect(await secret.getValue()).toBe('from the form');
      });

      it('disables the control and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const secret = (await allHarnessesOf(fixture))(0);
        expect(component.model.secret().touched()).toBe(false);

        await secret.focus();
        await secret.blur();
        expect(component.model.secret().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await secret.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.setValue('now filled');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component } = await render();
      const password = await harnessOf(fixture);

      await password.setValue('typed');
      expect(component.value()).toBe('typed');

      await password.focus();
      await password.blur();
      expect(await password.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id that the label points at, and is named by the label', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const password = await harnessOf(fixture);
      const label = element.querySelector('label');
      const field = await fieldOf(fixture);

      expect(await password.getId()).toMatch(/^wj-password-\d+$/);
      expect(label?.getAttribute('for')).toBe(await password.getId());
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('fills the width of the field with no fluid input', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.toggleMask.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(find(element, 'wj-password', HTMLElement).getBoundingClientRect().width).toBe(
        fieldBox.width,
      );
      expect(inputOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
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
      const password = await harnessOf(fixture);
      expect((await password.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await password.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await password.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const password = await harnessOf(fixture);
      expect(await password.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Enter a password.');
      await fixture.whenStable();
      expect(await password.isInvalid()).toBe(true);
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await password.isInvalid()).toBe(false);
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const password = await harnessOf(fixture);

      expect(await password.getId()).toBe('');
      expect((await password.getAriaAttributes()).describedBy).toBeNull();
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
      const password = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await password.isInvalid()).toBe(true);

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
      const password = await harnessOf(fixture);

      expect(await password.getId()).toBe('mine');
      expect(await password.getAriaAttributes()).toEqual({
        label: 'New password',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const password = await harnessOf(fixture);

      expect((await password.getAriaAttributes()).label).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-password: aria-label is set on the host, where it is not forwarded to the ' +
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
    it('renders an HTML payload on the string inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const password = await harnessOf(fixture);

      expect(await password.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await password.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on placeholder, autocomplete and value as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.placeholder.set(PAYLOAD);
        host.autocomplete.set(PAYLOAD);
        host.value.set(PAYLOAD);
      });
      const password = await harnessOf(fixture);

      expect(await password.getPlaceholder()).toBe(PAYLOAD);
      expect(inputOf(element).getAttribute('autocomplete')).toBe(PAYLOAD);
      expect(await password.getValue()).toBe(PAYLOAD);
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

      const byLabel = await loader.getAllHarnesses(WjPasswordHarness.with({ ariaLabel: /^New/ }));
      const byPlaceholder = await loader.getAllHarnesses(
        WjPasswordHarness.with({ placeholder: 'Hint' }),
      );
      const none = await loader.getAllHarnesses(WjPasswordHarness.with({ ariaLabel: 'Other' }));

      expect(byLabel).toHaveLength(1);
      expect(byPlaceholder).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('reads the focus state, and refuses a toggle that is not there', async () => {
      const { fixture } = await render();
      const password = await harnessOf(fixture);
      expect(await password.isFocused()).toBe(false);

      await password.focus();
      expect(await password.isFocused()).toBe(true);

      await password.blur();
      expect(await password.isFocused()).toBe(false);
      await expect(password.toggleMask()).rejects.toThrow('set toggleMask');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-password', HTMLElement),
        );
      });

      it('has no axe violations with the strength overlay open', async () => {
        // The overlay's own motion must end for axe to read its final colours.
        document.getElementById('wj-spec-no-motion')?.remove();
        const { fixture, element } = await render((host) => {
          host.toggleMask.set(true);
        }, scheme);
        const password = await harnessOf(fixture);
        await password.focus();
        await userEvent.keyboard('Abcdef1!');
        expect(await password.getStrengthText()).toBe('Strong');
        await overlayOpen(element);

        await expectNoAxeViolations(find(element, 'wj-password', HTMLElement));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab goes to the input then to the toggle, and skips a disabled control', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(true);

      await userEvent.tab();
      expect(await at(0).isToggleFocused()).toBe(true);

      await userEvent.tab();
      expect(await at(2).isFocused()).toBe(true);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await at(2).isFocused()).toBe(true);
    });

    it('Enter and Space on the toggle each flip the mask once', async () => {
      const { fixture } = await renderAs(KeyboardHost);
      const first = (await allHarnessesOf(fixture))(0);
      await first.focus();
      await userEvent.tab();
      expect(await first.isMasked()).toBe(true);

      await userEvent.keyboard('{Enter}');
      expect(await first.isMasked()).toBe(false);

      await userEvent.keyboard(' ');
      expect(await first.isMasked()).toBe(true);
      expect(await first.isToggleFocused()).toBe(true);
    });
  });
});
