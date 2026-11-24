/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as vietnamese } from 'weeljack-ng/locale';
import {
  WjToggleButton,
  type WjToggleButtonPt,
  type WjToggleButtonSize,
} from 'weeljack-ng/togglebutton';
import { WjToggleButtonHarness } from 'weeljack-ng/togglebutton/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/** The toggle button's colours as the preset sets them (`wjGuarantees.components.togglebutton`). */
const LOOK = {
  light: {
    unpicked: 'rgb(82, 82, 91)', // surface.600
    track: 'rgb(244, 244, 245)', // surface.100
  },
  dark: {
    unpicked: 'rgb(161, 161, 170)', // surface.400
    track: 'rgb(9, 9, 11)', // surface.950
  },
  pill: 'rgb(113, 113, 122)', // surface.500, both schemes
  picked: 'rgb(255, 255, 255)', // surface.0, both schemes
};

/** Aura's disabled fill and text, which the preset applies to the `span` button (GF1 FR-10). */
const DISABLED = {
  light: { fill: 'rgb(228, 228, 231)', text: 'rgb(113, 113, 122)' }, // zinc.200, zinc.500
  dark: { fill: 'rgb(63, 63, 70)', text: 'rgb(161, 161, 170)' }, // zinc.700, zinc.400
};

/**
 * Parks the pointer on the host's "After" button before a colour or border read. The pointer is
 * page-wide in browser mode, so an earlier test can leave it over the control, and Optimus's hover
 * rules outrank the resting ones.
 */
async function pointerAway(element: HTMLElement): Promise<void> {
  const after = element.querySelector<HTMLElement>('#after');
  if (after === null) throw new Error('The host has no #after button.');
  await userEvent.hover(after);
}

/** A consumer's template: one button, bare (named by a visible text) or inside a field. */
@Component({
  selector: 'wj-togglebutton-host',
  imports: [WjField, WjToggleButton],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Email me a receipt" [hint]="hint()" [error]="error()">
        <wj-togglebutton
          [(checked)]="checked"
          (checkedChange)="log.push($event)"
          [onLabel]="onLabel()"
          [offLabel]="offLabel()"
          [size]="size()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [style.inline-size]="width()"
        />
      </wj-field>
    } @else {
      <span id="name">Email me a receipt</span>
      <wj-togglebutton
        ariaLabelledBy="name"
        [(checked)]="checked"
        (checkedChange)="log.push($event)"
        [onLabel]="onLabel()"
        [offLabel]="offLabel()"
        [size]="size()"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [style.inline-size]="width()"
      />
    }
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: 8px;
      inline-size: 24rem;
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly checked = signal(false);
  readonly onLabel = signal<string | undefined>(undefined);
  readonly offLabel = signal<string | undefined>(undefined);
  readonly size = signal<WjToggleButtonSize | undefined>(undefined);
  readonly pt = signal<WjToggleButtonPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly width = signal<string | undefined>(undefined);
  readonly log: boolean[] = [];
}

/** The ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-togglebutton-aria-host',
  imports: [WjToggleButton],
  template: `
    <wj-togglebutton
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Receipt');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-togglebutton-aria-on-host-host',
  imports: [WjToggleButton],
  template: `<wj-togglebutton aria-label="Receipt" />`,
})
class AriaOnHostHost {}

/** A button with no name of its own, and a consumer id on its root. */
@Component({
  selector: 'wj-togglebutton-nameless-host',
  imports: [WjToggleButton],
  template: `<wj-togglebutton [pt]="pt" />`,
})
class NamelessHost {
  readonly pt: WjToggleButtonPt = { root: { id: 'consumer' } };
}

/** The labels, bound from signals, for the payload spec. */
@Component({
  selector: 'wj-togglebutton-payload-host',
  imports: [WjToggleButton],
  template: `<wj-togglebutton ariaLabel="Payload" [onLabel]="onLabel()" [offLabel]="offLabel()" />`,
})
class PayloadHost {
  readonly onLabel = signal('on');
  readonly offLabel = signal('off');
}

/** A plain button, a field around a button with its own id and description, and a bare one. */
@Component({
  selector: 'wj-togglebutton-own-ids-host',
  imports: [WjToggleButton, WjField],
  template: `
    <p id="note">Note</p>
    <wj-togglebutton inputId="plain" ariaLabel="Plain" ariaDescribedBy="note" />
    <wj-field label="Terms" hint="Hint" error="Error">
      <wj-togglebutton inputId="mine" ariaDescribedBy="note" />
    </wj-field>
    <wj-togglebutton ariaLabel="Bare" />
  `,
})
class OwnIdsHost {}

/** `ngModel` inside a field, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-togglebutton-ngmodel-host',
  imports: [WjField, WjToggleButton, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Agree to the terms">
      <wj-togglebutton [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<boolean | null>(true);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-togglebutton-reactive-host',
  imports: [WjField, WjToggleButton, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Agree to the terms">
      <wj-togglebutton [formControl]="control" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<boolean | null>(true);
}

/** Signal forms with `[formField]` inside a field: a required control and a disableable one. */
@Component({
  selector: 'wj-togglebutton-signal-host',
  imports: [WjField, WjToggleButton, FormField],
  template: `
    <form novalidate>
      <button type="button" id="before">Before</button>
      <wj-field label="Agree to the terms">
        <wj-togglebutton [formField]="model.agree" />
      </wj-field>
      <wj-field label="Keep me signed in">
        <wj-togglebutton [formField]="model.keep" />
      </wj-field>
      <button type="button" id="after">After</button>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal({ agree: false, keep: true });
  readonly model = form(this.value, (path) => {
    required(path.agree, { message: 'Agree to the terms to continue.' });
    disabledRule(path.keep, { when: () => this.off() });
  });
}

/** Two buttons between two native ones, the first disabled, for the keyboard spec. */
@Component({
  selector: 'wj-togglebutton-keyboard-host',
  imports: [WjToggleButton],
  template: `
    <button type="button" id="before">Before</button>
    <wj-togglebutton ariaLabel="Skipped" disabled />
    <wj-togglebutton ariaLabel="Keys" [(checked)]="on" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly on = signal(false);
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
  translation?: WjTranslation,
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...(translation && { translation }) })],
  });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  await expect.poll(() => buttonOf(element).getBoundingClientRect().height).toBeGreaterThan(30);
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

/** Optimus's root: the focusable `role="button"` element of the first toggle button. */
const buttonOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="button"]', HTMLElement);

/** The button of a page with several whose `aria-label` starts with `label`. */
const buttonLabelled = (element: HTMLElement, label: string): HTMLElement =>
  find(element, `[role="button"][aria-label^="${label}"]`, HTMLElement);

/**
 * The button's accessible name, computed as far as this spec needs: `aria-labelledby` (each id's
 * text, the button's own id meaning its shown text), else `aria-label`, else the shown text.
 */
function nameOf(button: HTMLElement): string {
  const ids = button.getAttribute('aria-labelledby')?.split(' ');
  if (ids) {
    return ids
      .map((id) =>
        (id === button.id
          ? labelOf(button)
          : button.ownerDocument.getElementById(id)
        )?.textContent.trim(),
      )
      .join(' ');
  }
  return button.getAttribute('aria-label') ?? button.textContent.trim();
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-togglebutton', HTMLElement);
const pillOf = (element: HTMLElement): HTMLElement =>
  find(element, '.p-togglebutton-content', HTMLElement);
const labelOf = (element: HTMLElement): HTMLElement =>
  find(element, '.p-togglebutton-label', HTMLElement);
const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The toggle button harnesses of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjToggleButtonHarness> {
  const all =
    await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjToggleButtonHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-togglebutton at index ${String(index)}`);
    }
    return found;
  };
}

async function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjToggleButtonHarness> {
  return (await allHarnessesOf(fixture))(0);
}

function fieldOf(fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const STATES: [string, (host: Host) => void][] = [
  ['off', () => undefined],
  [
    'on',
    (host) => {
      host.checked.set(true);
    },
  ],
  [
    'disabled, off',
    (host) => {
      host.disabled.set(true);
    },
  ],
  [
    'disabled, on',
    (host) => {
      host.checked.set(true);
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
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.size.set('large');
      host.checked.set(true);
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Only on a device you trust.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Agree to the terms to continue.');
    },
  ],
];

describe('WjToggleButton', () => {
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
    it('checked is two-way: aria-pressed and the label follow it, and a click writes it back', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);
      expect(await toggle.isChecked()).toBe(false);
      expect(await toggle.getText()).toBe('No');

      component.checked.set(true);
      await fixture.whenStable();
      await expect.poll(() => toggle.isChecked()).toBe(true);
      expect(await toggle.getText()).toBe('Yes');

      await toggle.toggle();
      expect(component.checked()).toBe(false);
      await expect.poll(() => toggle.isChecked()).toBe(false);

      await toggle.toggle();
      expect(component.checked()).toBe(true);
      await expect.poll(() => toggle.isChecked()).toBe(true);
    });

    it('checkedChange fires once per click, with the new state', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);

      component.checked.set(true);
      await fixture.whenStable();
      expect(component.log).toEqual([]);

      await toggle.toggle();
      await toggle.toggle();

      expect(component.log).toEqual([false, true]);
    });

    it('check and uncheck click only when the state differs', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);

      await toggle.uncheck();
      expect(component.log).toEqual([]);
      await toggle.check();
      await toggle.check();
      expect(component.log).toEqual([true]);
      await toggle.uncheck();
      expect(component.log).toEqual([true, false]);
    });

    it('shows the translation’s Yes and No by default, and the app’s onLabel and offLabel over them', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);
      expect(await toggle.getText()).toBe('No');

      component.onLabel.set('Public');
      component.offLabel.set('Private');
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe('Private');
      component.checked.set(true);
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe('Public');

      component.onLabel.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe('Yes');
    });

    it('keeps an empty label the app sets, rather than falling back to the default', async () => {
      const { fixture, component } = await render((host) => {
        host.offLabel.set('');
      });
      const toggle = await harnessOf(fixture);

      expect(await toggle.getText()).toBe('');
      component.checked.set(true);
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe('Yes');
    });

    it('reads Yes and No from the translation: Vietnamese, and a partial override beside English', async () => {
      const vi = await renderAs(Host, () => undefined, 'light', vietnamese);
      expect(await (await harnessOf(vi.fixture)).getText()).toBe('Không');
      vi.component.checked.set(true);
      await vi.fixture.whenStable();
      await expect.poll(async () => (await harnessOf(vi.fixture)).getText()).toBe('Có');
      TestBed.resetTestingModule();

      const partial = await renderAs(Host, () => undefined, 'light', { wj: { toggleOn: 'On' } });
      const toggle = await harnessOf(partial.fixture);
      expect(await toggle.getText()).toBe('No');
      partial.component.checked.set(true);
      await partial.fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe('On');
    });

    it('disabled and invalid reach the button, and a click on a disabled one does nothing', async () => {
      const { fixture, component, element } = await render();
      const toggle = await harnessOf(fixture);
      expect(await toggle.isDisabled()).toBe(false);
      expect(await toggle.isInvalid()).toBe(false);
      expect(getComputedStyle(buttonOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await toggle.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(buttonOf(element)).borderTopColor).toBe(INVALID_BORDER);
      expect(getComputedStyle(buttonOf(element)).borderTopWidth).toBe('1px');

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await toggle.isDisabled()).toBe(true);
      await toggle.toggle();
      expect(component.checked()).toBe(false);
      expect(component.log).toEqual([]);

      component.disabled.set(false);
      component.invalid.set(false);
      await fixture.whenStable();
      expect(await toggle.isDisabled()).toBe(false);
      expect(await toggle.isInvalid()).toBe(false);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(0).isDisabled()).toBe(true);
    });

    it('takes a button out of the Tab order while it is disabled: tabindex -1, and back to 0', async () => {
      const { fixture, component, element } = await render();
      expect(buttonOf(element).getAttribute('tabindex')).toBe('0');

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).getAttribute('tabindex')).toBe('-1');

      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).getAttribute('tabindex')).toBe('0');
    });
  });

  describe('pt', () => {
    it('reaches the root, content and label parts, and the routed attributes win over it', async () => {
      const { element } = await render((host) => {
        host.pt.set({
          root: { 'data-probe': 'yes', 'aria-invalid': 'false', 'aria-disabled': 'false' },
          content: { 'data-content': 'a' },
          label: { 'data-label': 'b' },
        });
        host.invalid.set(true);
        host.disabled.set(true);
      });
      const button = buttonOf(element);

      expect(button.getAttribute('data-probe')).toBe('yes');
      expect(button.getAttribute('aria-invalid')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(pillOf(element).getAttribute('data-content')).toBe('a');
      expect(labelOf(element).getAttribute('data-label')).toBe('b');
    });

    it('lands the routed root attributes on role="button" after toggling, disabling and a pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({ root: { 'data-probe': 'one' } });
        host.invalid.set(true);
      });
      const button = buttonOf(element);
      expect(button.getAttribute('data-probe')).toBe('one');
      expect(button.getAttribute('aria-invalid')).toBe('true');

      await (await harnessOf(fixture)).toggle();
      await fixture.whenStable();
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.getAttribute('data-probe')).toBe('one');
      expect(button.getAttribute('aria-invalid')).toBe('true');

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('data-probe')).toBe('one');
      expect(button.getAttribute('aria-invalid')).toBe('true');

      component.pt.set({ root: { 'data-probe': 'two' } });
      await fixture.whenStable();
      await expect.poll(() => button.getAttribute('data-probe')).toBe('two');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('aria-invalid')).toBe('true');

      component.disabled.set(false);
      component.invalid.set(false);
      await fixture.whenStable();
      await expect.poll(() => button.getAttribute('aria-disabled')).toBeNull();
      expect(button.getAttribute('aria-invalid')).toBeNull();
      expect(button.getAttribute('data-probe')).toBe('two');
    });

    it('takes the function form of pt, and routes over it too', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn', 'aria-invalid': 'false' } }));
        host.invalid.set(true);
      });

      expect(buttonOf(element).getAttribute('data-probe')).toBe('fn');
      expect(buttonOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('lets a consumer’s own id on the root stand when no id is routed, and loses to a routed one', async () => {
      const bare = await renderAs(NamelessHost);
      expect(buttonOf(bare.element).id).toBe('consumer');
      TestBed.resetTestingModule();

      const { element } = await render((host) => {
        host.pt.set({ root: { id: 'consumer' } });
      });
      expect(buttonOf(element).id).toMatch(/^wj-togglebutton-\d+$/);
    });
  });

  describe('the box and the look (#24’s tokens, unchanged)', () => {
    it.each<[WjToggleButtonSize | undefined, number]>([
      [undefined, 44],
      ['small', 36],
      ['large', 52],
    ])('is %s: the button and the host are %s px tall', async (size, height) => {
      const { element } = await render((host) => {
        host.size.set(size);
      });

      expect(buttonOf(element).getBoundingClientRect().height).toBe(height);
      expect(hostOf(element).getBoundingClientRect().height).toBe(height);
    });

    it('follows size when it changes', async () => {
      const { fixture, component, element } = await render();

      component.size.set('large');
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).getBoundingClientRect().height).toBe(52);

      component.size.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).getBoundingClientRect().height).toBe(44);
    });

    it('has a hit box of at least 24 px each way', async () => {
      const { element } = await render();
      const box = buttonOf(element).getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    });

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      const look = LOOK[scheme];

      it('draws the off button in the unpicked text colour on the track, with no pill', async () => {
        const { element } = await render(() => undefined, scheme);
        await pointerAway(element);

        expect(getComputedStyle(buttonOf(element)).color).toBe(look.unpicked);
        expect(getComputedStyle(labelOf(element)).color).toBe(look.unpicked);
        expect(getComputedStyle(buttonOf(element)).backgroundColor).toBe(look.track);
        expect(getComputedStyle(pillOf(element)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      });

      it('draws the on button as a mid-grey pill with white text, on the same track', async () => {
        const { element } = await render((host) => {
          host.checked.set(true);
        }, scheme);
        await pointerAway(element);

        await expect.poll(() => getComputedStyle(pillOf(element)).backgroundColor).toBe(LOOK.pill);
        expect(getComputedStyle(labelOf(element)).color).toBe(LOOK.picked);
        expect(getComputedStyle(buttonOf(element)).backgroundColor).toBe(look.track);
      });

      it('keeps a disabled button readable: the pill stays in the disabled colours at full opacity', async () => {
        const { element } = await render((host) => {
          host.checked.set(true);
          host.disabled.set(true);
        }, scheme);
        await pointerAway(element);

        await expect
          .poll(() => getComputedStyle(pillOf(element)).backgroundColor)
          .toBe(DISABLED[scheme].text);
        expect(getComputedStyle(labelOf(element)).color).toBe(DISABLED[scheme].fill);
        expect(getComputedStyle(buttonOf(element)).opacity).toBe('1');
      });
    });

    it('draws the family focus ring round the button after a key press, and none after a click', async () => {
      const { element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(buttonOf(element));
      const ring = getComputedStyle(buttonOf(element));
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');

      await userEvent.click(byId(element, 'after'));
      await expect.poll(() => getComputedStyle(buttonOf(element)).outlineStyle).toBe('none');
    });
  });

  describe('the host box', () => {
    it('is an inline-flex host that sizes to its button', async () => {
      const { element } = await renderAs(AriaHost);
      const host = hostOf(element).getBoundingClientRect();
      const button = buttonOf(element).getBoundingClientRect();

      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(host.width).toBe(button.width);
      expect(host.height).toBe(button.height);
    });

    it('hugs its shown label, so the width changes as it toggles when the two differ', async () => {
      const { fixture, component, element } = await render((host) => {
        host.onLabel.set('Public');
        host.offLabel.set('Private');
      });
      const off = buttonOf(element).getBoundingClientRect().width;

      component.checked.set(true);
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).getBoundingClientRect().width).not.toBe(off);
    });

    it('keeps a steady width, with the label centred, when the app sizes the host', async () => {
      const { fixture, component, element } = await render((host) => {
        host.onLabel.set('Public');
        host.offLabel.set('Private');
        host.width.set('8rem');
      });
      const centred = (): number => {
        const button = buttonOf(element).getBoundingClientRect();
        const label = labelOf(element).getBoundingClientRect();
        return Math.abs(label.left + label.width / 2 - (button.left + button.width / 2));
      };

      expect(buttonOf(element).getBoundingClientRect().width).toBe(128);
      expect(centred()).toBeLessThan(1);

      component.checked.set(true);
      await fixture.whenStable();
      await expect.poll(() => labelOf(element).textContent.trim()).toBe('Public');
      expect(buttonOf(element).getBoundingClientRect().width).toBe(128);
      expect(centred()).toBeLessThan(1);
    });

    it('sits at the start of its field and never stretches across it', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const field = find(element, 'wj-field', HTMLElement).getBoundingClientRect();
      const host = hostOf(element).getBoundingClientRect();

      expect(getComputedStyle(hostOf(element)).justifySelf).toBe('start');
      expect(host.width).toBeLessThan(field.width / 2);
      expect(Math.abs(host.left - field.left)).toBeLessThan(1);
    });
  });

  describe('the forms APIs', () => {
    describe('ngModel', () => {
      it('writes the value in, and the state out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const toggle = await harnessOf(fixture);
        await expect.poll(() => toggle.isChecked()).toBe(true);

        await toggle.toggle();
        await fixture.whenStable();
        expect(component.value()).toBe(false);
        await expect.poll(() => toggle.isChecked()).toBe(false);

        component.value.set(true);
        await fixture.whenStable();
        await expect.poll(() => toggle.isChecked()).toBe(true);
        expect(await toggle.getText()).toBe('Yes');
      });

      it('shows a null model as off', async () => {
        const { fixture } = await renderAs(NgModelHost, (host) => {
          host.value.set(null);
        });
        const toggle = await harnessOf(fixture);

        await expect.poll(() => toggle.getText()).toBe('No');
        expect(await toggle.isChecked()).toBe(false);
      });

      it('disables the button, and is touched only once focus leaves it', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const toggle = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await toggle.focus();
        expect(component.model().touched).toBe(false);
        await toggle.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        await expect.poll(() => toggle.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows the initial value, writes the state out, and marks it dirty only for the user', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const toggle = await harnessOf(fixture);
        await expect.poll(() => toggle.isChecked()).toBe(true);
        expect(component.control.dirty).toBe(false);

        await toggle.toggle();
        expect(component.control.value).toBe(false);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(true);
        await expect.poll(() => toggle.isChecked()).toBe(true);
        component.control.setValue(null);
        await expect.poll(() => toggle.isChecked()).toBe(false);
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(false);

        expect(component.control.dirty).toBe(false);
      });

      it('disables the button, and marks the control touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const toggle = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await toggle.focus();
        expect(component.control.touched).toBe(false);
        await toggle.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        await expect.poll(() => toggle.isDisabled()).toBe(true);
        component.control.enable();
        await expect.poll(() => toggle.isDisabled()).toBe(false);
      });

      it('marks the control touched when focus tabs away to the next element', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const toggle = await harnessOf(fixture);
        byId(element, 'before').focus();

        await userEvent.tab();
        await expect.poll(() => toggle.isFocused()).toBe(true);
        expect(component.control.touched).toBe(false);
        await userEvent.tab();

        expect(document.activeElement).toBe(byId(element, 'after'));
        expect(component.control.touched).toBe(true);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the state out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => at(1).isChecked()).toBe(true);
        expect(await at(0).isChecked()).toBe(false);

        await at(0).toggle();
        await fixture.whenStable();
        expect(component.value().agree).toBe(true);
        await expect.poll(() => at(0).isChecked()).toBe(true);

        component.model.keep().value.set(false);
        await fixture.whenStable();
        await expect.poll(() => at(1).isChecked()).toBe(false);
      });

      it('disables the button from the form, and marks the field touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(component.model.agree().touched()).toBe(false);

        await at(0).focus();
        expect(component.model.agree().touched()).toBe(false);
        await at(0).blur();
        expect(component.model.agree().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        await expect.poll(() => at(1).isDisabled()).toBe(true);
      });

      it('shows the field error once touched, and clears it when the state changes', async () => {
        const { fixture } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(await at(0).isInvalid()).toBe(false);

        await at(0).focus();
        await at(0).blur();
        await fixture.whenStable();
        await expect.poll(() => at(0).isInvalid()).toBe(true);
        expect(await (await fieldOf(fixture)).getError()).toBe('Agree to the terms to continue.');

        await at(0).check();
        await fixture.whenStable();
        await expect.poll(() => at(0).isInvalid()).toBe(false);
      });
    });
  });

  describe('inside a field', () => {
    it('registers as a plain stacked control: the field is no group and not inline', async () => {
      const { fixture } = await render((host) => {
        host.inField.set(true);
      });
      const field = await fieldOf(fixture);

      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('is named by the field’s label span through aria-labelledby, and takes a generated id', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const toggle = await harnessOf(fixture);
      // The field's label first, then the button's own id, which adds the shown text to the name.
      const [labelId = 'none', own] = ((await toggle.getAriaAttributes()).labelledBy ?? '').split(
        ' ',
      );
      const label = element.querySelector(`#${labelId}`);

      expect(label?.tagName).toBe('SPAN');
      expect(label?.textContent).toBe('Email me a receipt');
      expect(await toggle.getId()).toMatch(/^wj-togglebutton-\d+$/);
      expect(own).toBe(await toggle.getId());
      expect(buttonOf(element).id).toBe(own);
    });

    it('moves focus to the button when the label is clicked, and never toggles it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const toggle = await harnessOf(fixture);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      await expect.poll(() => toggle.isFocused()).toBe(true);
      expect(component.checked()).toBe(false);
      expect(component.log).toEqual([]);
    });

    it('adopts its own inputId, and merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);

      expect(await at(1).getId()).toBe('mine');
      expect((await at(1).getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await (await fieldOf(fixture)).getHint()).toBe('Hint');
    });

    it('describes the button with the hint, then the error, while they show', async () => {
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
      expect(getComputedStyle(buttonOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Agree to the terms to continue.');
      await fixture.whenStable();
      expect(await toggle.isInvalid()).toBe(true);
      await pointerAway(element);
      expect(getComputedStyle(buttonOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await toggle.isInvalid()).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const toggle = (await allHarnessesOf(fixture))(2);

      expect(await toggle.getId()).toBe('');
      expect((await toggle.getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s inputId and ariaDescribedBy on the button', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const toggle = (await allHarnessesOf(fixture))(0);

      expect(await toggle.getId()).toBe('plain');
      expect((await toggle.getAriaAttributes()).describedBy).toBe('note');
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const toggle = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await toggle.isInvalid()).toBe(true);
    });

    it('is named by a visible text through ariaLabelledBy, followed by its own shown text', async () => {
      const { fixture, component, element } = await render();
      const toggle = await harnessOf(fixture);
      expect((await toggle.getAriaAttributes()).labelledBy).toBe(`name ${buttonOf(element).id}`);
      expect(buttonOf(element).id).toMatch(/^wj-togglebutton-\d+$/);
      expect(nameOf(buttonOf(element))).toBe('Email me a receipt No');

      component.checked.set(true);
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe('Yes');
      expect(nameOf(buttonOf(element))).toBe('Email me a receipt Yes');
    });

    it('is named by its shown text alone when it has no name of its own', async () => {
      const { element } = await renderAs(NamelessHost);
      const button = buttonOf(element);

      expect(button.hasAttribute('aria-label')).toBe(false);
      expect(button.hasAttribute('aria-labelledby')).toBe(false);
      expect(nameOf(button)).toBe('No');
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId as the id, and ariaLabel, ariaLabelledBy and ariaDescribedBy on the button', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const toggle = await harnessOf(fixture);

      expect(await toggle.getId()).toBe('mine');
      expect(await toggle.getAriaAttributes()).toEqual({
        label: 'Receipt No',
        labelledBy: 'namer mine',
        describedBy: 'describer',
      });
    });

    it('ends an ariaLabel name in the shown text, which follows the state (WCAG 2.5.3)', async () => {
      const { fixture, component } = await renderAs(KeyboardHost);
      const toggle = (await allHarnessesOf(fixture))(1);
      expect((await toggle.getAriaAttributes()).label).toBe('Keys No');

      component.on.set(true);
      await fixture.whenStable();
      await expect.poll(async () => (await toggle.getAriaAttributes()).label).toBe('Keys Yes');
    });

    it('marks the button aria-disabled="true" only while it is disabled', async () => {
      const { fixture, component, element } = await render();
      expect(buttonOf(element).hasAttribute('aria-disabled')).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).getAttribute('aria-disabled')).toBe('true');

      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => buttonOf(element).hasAttribute('aria-disabled')).toBe(false);
    });

    it('lets aria-pressed follow checked through a click, a consumer write and a click again', async () => {
      const { fixture, component, element } = await render();
      const button = buttonOf(element);
      expect(button.getAttribute('aria-pressed')).toBe('false');

      await userEvent.click(button);
      await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true');

      component.checked.set(false);
      await fixture.whenStable();
      await expect.poll(() => button.getAttribute('aria-pressed')).toBe('false');

      await userEvent.click(button);
      await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true');
      expect(component.checked()).toBe(true);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const toggle = await harnessOf(fixture);

      expect((await toggle.getAriaAttributes()).label).toBeNull();
      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        'WJ0003: wj-togglebutton: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      ]);
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('keyboard', () => {
    it('Tab focuses the button, and Tab again leaves it', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const toggle = (await allHarnessesOf(fixture))(1);
      byId(element, 'before').focus();

      await userEvent.tab();

      await expect.poll(() => toggle.isFocused()).toBe(true);
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('Enter and Space toggle the focused button', async () => {
      const { fixture, component } = await renderAs(KeyboardHost);
      const toggle = (await allHarnessesOf(fixture))(1);
      await toggle.focus();

      await userEvent.keyboard('{Enter}');
      expect(component.on()).toBe(true);
      await expect.poll(() => toggle.isChecked()).toBe(true);

      await userEvent.keyboard(' ');
      expect(component.on()).toBe(false);
      await expect.poll(() => toggle.isChecked()).toBe(false);
      expect(await toggle.isFocused()).toBe(true);
    });

    it('skips a disabled button on Tab and Shift+Tab, and ignores a key sent to it', async () => {
      const { fixture, component, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(false);
      expect(await at(1).isFocused()).toBe(true);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));

      buttonLabelled(element, 'Skipped').dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }),
      );
      expect(await at(0).isChecked()).toBe(false);
      expect(component.on()).toBe(false);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload on onLabel and offLabel as text only', async () => {
      const { fixture, component, element } = await renderAs(PayloadHost);
      const toggle = await harnessOf(fixture);

      component.offLabel.set(PAYLOAD);
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe(PAYLOAD);
      await toggle.toggle();
      component.onLabel.set(PAYLOAD);
      await fixture.whenStable();
      await expect.poll(() => toggle.getText()).toBe(PAYLOAD);

      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload on the four ARIA string inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set(PAYLOAD);
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const toggle = await harnessOf(fixture);

      expect(await toggle.getAriaAttributes()).toEqual({
        label: `${PAYLOAD} No`,
        labelledBy: `${PAYLOAD} ${PAYLOAD}`,
        describedBy: PAYLOAD,
      });
      expect(await toggle.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('motion', () => {
    it('runs the button transition on Optimus’s 0.2s, and at 0s under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      await expect
        .poll(() => getComputedStyle(buttonOf(normal.element)).transitionDuration)
        .toContain('0.2s');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(() => getComputedStyle(buttonOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
      await expect
        .poll(() => getComputedStyle(pillOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
    });
  });

  describe('harness', () => {
    it('is found by state and by the text it shows', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const at = await allHarnessesOf(fixture);
      await at(0).check();

      const checked = await loader.getAllHarnesses(WjToggleButtonHarness.with({ checked: true }));
      const off = await loader.getAllHarnesses(WjToggleButtonHarness.with({ checked: false }));
      const yes = await loader.getAllHarnesses(WjToggleButtonHarness.with({ text: 'Yes' }));
      const no = await loader.getAllHarnesses(WjToggleButtonHarness.with({ text: /^N/ }));

      expect(checked).toHaveLength(1);
      expect(off).toHaveLength(2);
      expect(yes).toHaveLength(1);
      expect(no).toHaveLength(2);
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
        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
      });
    });
  });
});
