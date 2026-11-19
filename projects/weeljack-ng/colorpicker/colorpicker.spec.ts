/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form } from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjColorPicker, type WjColorPickerPt } from 'weeljack-ng/colorpicker';
import { WjColorPickerHarness } from 'weeljack-ng/colorpicker/testing';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: one picker, bare (named by a visible text) or inside a field. */
@Component({
  selector: 'wj-colorpicker-host',
  imports: [WjField, WjColorPicker],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Accent color" [hint]="hint()" [error]="error()">
        <wj-colorpicker
          [(value)]="value"
          (valueChange)="log.push($event)"
          [disabled]="disabled()"
          [invalid]="invalid()"
          [pt]="pt()"
        />
      </wj-field>
    } @else {
      <span id="name">Accent color</span>
      <wj-colorpicker
        ariaLabelledBy="name"
        [(value)]="value"
        (valueChange)="log.push($event)"
        [disabled]="disabled()"
        [invalid]="invalid()"
        [pt]="pt()"
      />
    }
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      justify-items: start;
      inline-size: 24rem;
      padding-block-end: 12rem;
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string | null>('#0f766e');
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly pt = signal<WjColorPickerPt>(undefined);
  readonly log: (string | null)[] = [];
}

/** The ARIA string inputs, with `inputId`, bound from signals. */
@Component({
  selector: 'wj-colorpicker-aria-host',
  imports: [WjColorPicker],
  template: `
    <wj-colorpicker
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
      [inputId]="inputId()"
      [value]="'#0f766e'"
    />
  `,
})
class AriaHost {
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly inputId = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-colorpicker-aria-on-host-host',
  imports: [WjColorPicker],
  template: `<wj-colorpicker aria-label="Accent" />`,
})
class AriaOnHostHost {}

/** A field around a picker that names itself by a text of its own, and one with its own ids. */
@Component({
  selector: 'wj-colorpicker-own-ids-host',
  imports: [WjColorPicker, WjField],
  template: `
    <span id="mine">Mine</span>
    <p id="note">Note</p>
    <wj-field label="Accent color" hint="Hint" error="Error">
      <wj-colorpicker ariaLabelledBy="mine" ariaDescribedBy="note" value="#0f766e" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** `ngModel`, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-colorpicker-ngmodel-host',
  imports: [WjField, WjColorPicker, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Accent color">
      <wj-colorpicker [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      display: block;
      padding-block-end: 12rem;
    }
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<string | null>('#0f766e');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-colorpicker-reactive-host',
  imports: [WjField, WjColorPicker, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Accent color">
      <wj-colorpicker [formControl]="control" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      display: block;
      padding-block-end: 12rem;
    }
  `,
})
class ReactiveHost {
  readonly control = new FormControl<string | null>('#0f766e');
}

/** Signal forms with `[formField]`. */
@Component({
  selector: 'wj-colorpicker-signal-host',
  imports: [WjField, WjColorPicker, FormField],
  template: `
    <form novalidate>
      <button type="button" id="before">Before</button>
      <wj-field label="Accent color">
        <wj-colorpicker [formField]="model.accent" />
      </wj-field>
      <button type="button" id="after">After</button>
    </form>
  `,
  styles: `
    :host {
      display: block;
      padding-block-end: 12rem;
    }
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ accent: string | null }>({ accent: '#0f766e' });
  readonly model = form(this.value, (path) => {
    disabledRule(path.accent, { when: () => this.off() });
  });
}

/** Two pickers between two buttons, the first disabled, for the keyboard specs. */
@Component({
  selector: 'wj-colorpicker-keyboard-host',
  imports: [WjColorPicker],
  template: `
    <button type="button" id="before">Before</button>
    <wj-colorpicker ariaLabel="Skipped" disabled value="#0f766e" />
    <wj-colorpicker ariaLabel="Keys" [(value)]="value" (valueChange)="log.push($event)" />
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      display: block;
      padding-block-end: 12rem;
    }
  `,
})
class KeyboardHost {
  readonly value = signal<string | null>('#ff0000');
  readonly log: (string | null)[] = [];
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
  await expect.poll(() => previewOf(element).getBoundingClientRect().height).toBe(24);
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

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-colorpicker', HTMLElement);
/** The first picker's swatch. */
const previewOf = (element: HTMLElement, index = 0): HTMLInputElement => {
  const found = element.querySelectorAll('input')[index];
  if (!(found instanceof HTMLInputElement)) {
    throw new Error(`swatch ${String(index)} is missing`);
  }
  return found;
};
const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);
const swatchOf = (element: HTMLElement, index = 0): string =>
  getComputedStyle(previewOf(element, index)).backgroundColor;

/** The colour a `#rrggbb` string paints, as the browser reports it. */
function rgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${String((n >> 16) & 255)}, ${String((n >> 8) & 255)}, ${String(n & 255)})`;
}

/** The harnesses of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjColorPickerHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjColorPickerHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-colorpicker at index ${String(index)}`);
    }
    return found;
  };
}

async function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjColorPickerHarness> {
  return (await allHarnessesOf(fixture))(0);
}

function fieldOf(fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
}

/**
 * Waits until the panel is fully open: shown, with its enter over. Optimus keeps `p-motion` hidden
 * while closed and shows it with the enter's class; none left means the enter has ended.
 */
async function panelOpen(element: HTMLElement): Promise<void> {
  await expect
    .poll(() => {
      const motion = element.querySelector<HTMLElement>('p-motion');
      return motion !== null && motion.style.display !== 'none' && motion.className === 'p-motion';
    })
    .toBe(true);
}

/** Closes an open panel and waits for its leave to end, so nothing is left open at teardown. */
async function closePanel(picker: WjColorPickerHarness, element: HTMLElement): Promise<void> {
  await picker.close();
  await expect.poll(() => picker.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();
}

/** Clicks `target` a fraction of the way across and down its box, the way a pointer picks a colour. */
async function clickAt(target: HTMLElement, x: number, y: number): Promise<void> {
  const box = target.getBoundingClientRect();
  await userEvent.click(target, { position: { x: box.width * x, y: box.height * y } });
}

/** Opens the panel and picks a colour in its area with the pointer, so the value changes. */
async function pickColour(picker: WjColorPickerHarness, element: HTMLElement): Promise<void> {
  await picker.open();
  await panelOpen(element);
  await clickAt(find(element, '.p-colorpicker-color-selector', HTMLElement), 0.25, 0.25);
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const STATES: [string, (host: Host) => void][] = [
  ['closed with a value', () => undefined],
  [
    'closed with null',
    (host) => {
      host.value.set(null);
    },
  ],
  [
    'disabled',
    (host) => {
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
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Used for links and buttons.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Pick a darker highlight color.');
    },
  ],
];

describe('WjColorPicker', () => {
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
    window.scrollTo(0, 0);
  });

  describe('the value (FR-40)', () => {
    it('shows the colour the value holds on the swatch, and reads it back as #rrggbb', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);

      expect(swatchOf(element)).toBe(rgb('#0f766e'));
      expect(await picker.getValue()).toBe('#0f766e');
      expect(await picker.getSwatchColor()).toBe('#0f766e');
    });

    it('moves the swatch when the app sets a new value', async () => {
      const { fixture, component, element } = await render();
      const picker = await harnessOf(fixture);

      component.value.set('#facc15');
      await fixture.whenStable();

      await expect.poll(() => swatchOf(element)).toBe(rgb('#facc15'));
      expect(await picker.getValue()).toBe('#facc15');
    });

    it('shows Optimus’s red for null while the model and the harness read null (FR-46)', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(null);
      });
      const picker = await harnessOf(fixture);

      expect(component.value()).toBeNull();
      expect(await picker.getValue()).toBeNull();
      expect(swatchOf(element)).toBe(rgb('#ff0000'));
      expect(await picker.getSwatchColor()).toBe('#ff0000');
    });

    it('is 24 px square, the host box included: no baseline gap under the swatch', async () => {
      const { element } = await render();
      const preview = previewOf(element).getBoundingClientRect();
      const host = hostOf(element).getBoundingClientRect();

      expect(preview.width).toBe(24);
      expect(preview.height).toBe(24);
      expect(host.width).toBe(24);
      expect(host.height).toBe(24);
    });

    it('draws a 1 px boundary inside the swatch in the field-border colour, whatever the colour', async () => {
      const { component, fixture, element } = await render();
      const border = getComputedStyle(ROOT).getPropertyValue('--wj-form-field-border-color').trim();
      expect(border).not.toBe('');

      for (const colour of ['#0f766e', '#ffffff']) {
        component.value.set(colour);
        await fixture.whenStable();
        await expect.poll(() => swatchOf(element)).toBe(rgb(colour));
        const shadow = getComputedStyle(previewOf(element)).boxShadow;
        expect(shadow).toContain('inset');
        expect(shadow).toContain('0px 0px 0px 1px');
      }
      expect(previewOf(element).getBoundingClientRect().height).toBe(24);
    });

    it('does not throw for a value that is not a hex colour, and renders nothing from it', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(PAYLOAD);
      });
      const picker = await harnessOf(fixture);

      expect(consoleError).not.toHaveBeenCalled();
      expect(element.querySelector('img')).toBeNull();
      expect(window).not.toHaveProperty('wjInjected');
      expect(await picker.getValue()).toBe(PAYLOAD);
      expect(element.textContent).not.toContain('onerror');
    });
  });

  describe('the panel (FR-41)', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the panel's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('opens inside the host, below the swatch, and the swatch says so: aria-haspopup and aria-expanded', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      const preview = previewOf(element);
      expect(preview.getAttribute('aria-haspopup')).toBe('dialog');
      expect(preview.getAttribute('aria-expanded')).toBe('false');

      await picker.open();
      await panelOpen(element);

      expect(preview.getAttribute('aria-expanded')).toBe('true');
      expect(await picker.isOpen()).toBe(true);
      const panel = find(element, '.p-colorpicker-panel', HTMLElement);
      expect(hostOf(element).contains(panel)).toBe(true);
      expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        preview.getBoundingClientRect().bottom - 1,
      );
      expect(panel.getBoundingClientRect().width).toBe(193);
      expect(panel.getBoundingClientRect().height).toBe(166);

      await closePanel(picker, element);
      expect(preview.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens with a motion by default, and without one under reduced motion (safe: true)', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const animations = async (reduce: boolean): Promise<number> => {
        await emulateReducedMotion(reduce);
        const { fixture } = await render();
        const picker = await harnessOf(fixture);
        await picker.open();
        await expect.poll(() => picker.isOpen()).toBe(true);
        const count = document.getAnimations().length;
        TestBed.resetTestingModule();
        return count;
      };

      expect(await animations(false)).toBeGreaterThan(0);
      expect(await animations(true)).toBe(0);
    });

    it('runs the swatch’s transitions on Optimus’s 0.2s, and at 0s under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      await expect
        .poll(() => getComputedStyle(previewOf(normal.element)).transitionDuration)
        .toContain('0.2s');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(() => getComputedStyle(previewOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
    });

    it('closes on Escape, and a click outside', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      await picker.open();
      await panelOpen(element);

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();

      await picker.open();
      await panelOpen(element);
      await userEvent.click(byId(element, 'before'));
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();
    });

    it('does not open while disabled', async () => {
      const { fixture, element } = await render((host) => {
        host.disabled.set(true);
      });
      const picker = await harnessOf(fixture);

      expect(await picker.isDisabled()).toBe(true);
      previewOf(element).click();
      await fixture.whenStable();

      expect(await picker.isOpen()).toBe(false);
      expect(element.querySelector('.p-colorpicker-panel')).toBeNull();
    });
  });

  describe('the panel is pointer-only (FR-45)', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the panel's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    /** Renders the keyboard host and tabs onto the swatch of the second picker. */
    async function focusKeys(): Promise<Rendered<KeyboardHost> & { picker: WjColorPickerHarness }> {
      const rendered = await renderAs(KeyboardHost);
      const picker = (await allHarnessesOf(rendered.fixture))(1);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => picker.isFocused()).toBe(true);
      return { ...rendered, picker };
    }

    it('skips a disabled picker on Tab and Shift+Tab', async () => {
      const { element, picker } = await focusKeys();

      expect(await picker.isFocused()).toBe(true);
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
    });

    it('opens on Space and closes on Escape, with focus staying on the swatch', async () => {
      const { element, picker } = await focusKeys();

      await userEvent.keyboard(' ');
      await panelOpen(element);
      expect(await picker.isOpen()).toBe(true);
      expect(await picker.isFocused()).toBe(true);

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => picker.isOpen()).toBe(false);
      expect(await picker.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();
    });

    it('draws the family ink ring on the swatch after Tab: 2 px solid at 2 px', async () => {
      const { element } = await focusKeys();
      const ring = getComputedStyle(previewOf(element, 1));

      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');
    });

    it('gives the area and the hue strip no focus and no role, and Tab leaves the picker', async () => {
      // The gap the docs page lists. A failure here means Optimus changed the panel: revisit FR-42.
      const { element, picker } = await focusKeys();
      await userEvent.keyboard(' ');
      await panelOpen(element);
      const panel = find(element, '.p-colorpicker-panel', HTMLElement);

      expect(panel.querySelector('[tabindex], [role]')).toBeNull();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();
    });
  });

  describe('the panel with the pointer', () => {
    beforeEach(() => {
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('picks a colour from the area, and the model, the swatch and the handle follow', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('#ff0000');
      });
      const picker = await harnessOf(fixture);
      await picker.open();
      await panelOpen(element);

      await clickAt(find(element, '.p-colorpicker-color-selector', HTMLElement), 0.5, 0.5);

      // The middle of the area: saturation 50 and brightness 50 on a red hue.
      await expect.poll(() => component.value()).toBe('#804040');
      expect(component.log).toEqual(['#804040']);
      expect(await picker.getValue()).toBe('#804040');
      await expect.poll(() => swatchOf(element)).toBe(rgb('#804040'));
      expect(find(element, '.p-colorpicker-color-handle', HTMLElement).style.left).toBe('75px');
      expect(find(element, '.p-colorpicker-color-handle', HTMLElement).style.top).toBe('75px');
      await closePanel(picker, element);
    });

    it('keeps the panel’s own colour while it is open: a dark pick does not throw the handles off', async () => {
      // Optimus rebuilds { h, s, b } from the hex on every write. Black has no hue and no
      // saturation, so without the skipped echo the area's handle would jump to the left edge and
      // the strip's handle to 300 degrees.
      const { fixture, component, element } = await render((host) => {
        host.value.set('#3366cc');
      });
      const picker = await harnessOf(fixture);
      await picker.open();
      await panelOpen(element);
      const hueHandle = find(element, '.p-colorpicker-hue-handle', HTMLElement);
      const hueBefore = hueHandle.style.top;

      await clickAt(find(element, '.p-colorpicker-color-selector', HTMLElement), 0.99, 0.999);

      await expect.poll(() => component.value()).toBe('#000000');
      await expect.poll(() => swatchOf(element)).toBe(rgb('#000000'));
      // Saturation stays near 100: the handle sits at the right edge, not at the left (0 px).
      expect(
        Number.parseInt(find(element, '.p-colorpicker-color-handle', HTMLElement).style.left, 10),
      ).toBeGreaterThan(140);
      expect(hueHandle.style.top).toBe(hueBefore);
      await closePanel(picker, element);
    });

    it('picks a hue from the strip', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('#ff0000');
      });
      const picker = await harnessOf(fixture);
      await picker.open();
      await panelOpen(element);

      await clickAt(find(element, '.p-colorpicker-hue', HTMLElement), 0.5, 0.5);

      // The middle of the strip is hue 180: cyan.
      await expect.poll(() => component.value()).toBe('#00ffff');
      await expect.poll(() => swatchOf(element)).toBe(rgb('#00ffff'));
      await closePanel(picker, element);
    });

    it('toggles on a click of the swatch, and closes on a click outside', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);

      await userEvent.click(previewOf(element));
      await panelOpen(element);
      expect(await picker.isOpen()).toBe(true);
      await userEvent.click(previewOf(element));
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();

      await picker.open();
      await panelOpen(element);
      await userEvent.click(byId(element, 'before'));
      await expect.poll(() => picker.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('.p-colorpicker-panel')).toBeNull();
    });

    it('is opened and closed by a harness', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);

      await picker.open();
      await panelOpen(element);
      expect(await picker.isOpen()).toBe(true);
      await closePanel(picker, element);
      expect(await picker.isOpen()).toBe(false);
    });
  });

  describe('routed parts (the pt child-forwarding trap)', () => {
    beforeEach(() => {
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('lands the swatch’s and the panel’s attributes on open, after a colour change, and after close and reopen', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      const preview = previewOf(element);
      expect(preview.getAttribute('role')).toBe('combobox');
      expect(preview.getAttribute('aria-haspopup')).toBe('dialog');
      expect(preview.getAttribute('aria-expanded')).toBe('false');
      expect(preview.hasAttribute('aria-controls')).toBe(false);

      await picker.open();
      await panelOpen(element);
      const panelId = find(element, '.p-colorpicker-panel', HTMLElement).id;
      expect(panelId).toMatch(/^wj-colorpicker-panel-\d+$/);
      expect(preview.getAttribute('aria-expanded')).toBe('true');
      expect(preview.getAttribute('aria-controls')).toBe(panelId);

      await clickAt(find(element, '.p-colorpicker-color-selector', HTMLElement), 0.25, 0.25);
      await fixture.whenStable();
      expect(preview.getAttribute('aria-expanded')).toBe('true');
      expect(preview.getAttribute('aria-controls')).toBe(panelId);
      expect(preview.getAttribute('role')).toBe('combobox');
      expect(preview.getAttribute('aria-haspopup')).toBe('dialog');

      await closePanel(picker, element);
      expect(preview.getAttribute('aria-expanded')).toBe('false');
      expect(preview.hasAttribute('aria-controls')).toBe(false);

      await picker.open();
      await panelOpen(element);
      expect(find(element, '.p-colorpicker-panel', HTMLElement).id).toBe(panelId);
      expect(preview.getAttribute('aria-expanded')).toBe('true');
      expect(preview.getAttribute('aria-controls')).toBe(panelId);
      expect(preview.getAttribute('role')).toBe('combobox');
      await closePanel(picker, element);
    });

    it('keeps a consumer’s pt on the parts, and routed attributes win over it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({
          root: { 'data-probe': 'root' },
          panel: { 'data-probe': 'panel', id: 'consumer' },
          hue: { 'data-probe': 'hue' },
          preview: { 'data-probe': 'preview', 'aria-haspopup': 'menu', role: 'textbox' },
        });
      });
      const picker = await harnessOf(fixture);
      expect(find(element, '.p-colorpicker', HTMLElement).getAttribute('data-probe')).toBe('root');
      expect(previewOf(element).getAttribute('data-probe')).toBe('preview');
      expect(previewOf(element).getAttribute('aria-haspopup')).toBe('dialog');
      expect(previewOf(element).getAttribute('role')).toBe('combobox');

      await picker.open();
      await panelOpen(element);
      const panel = find(element, '.p-colorpicker-panel', HTMLElement);
      expect(panel.getAttribute('data-probe')).toBe('panel');
      expect(panel.id).toMatch(/^wj-colorpicker-panel-\d+$/);
      expect(find(element, '.p-colorpicker-hue', HTMLElement).getAttribute('data-probe')).toBe(
        'hue',
      );

      component.pt.set({ hue: { 'data-probe': 'hue two' } });
      await fixture.whenStable();
      await expect
        .poll(() => find(element, '.p-colorpicker-hue', HTMLElement).getAttribute('data-probe'))
        .toBe('hue two');
      expect(previewOf(element).getAttribute('aria-haspopup')).toBe('dialog');
      await closePanel(picker, element);
    });

    it('takes the function form of pt', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(() => ({
          preview: { 'data-probe': 'fn' },
          colorSelector: { 'data-probe': 'fn area' },
        }));
      });
      const picker = await harnessOf(fixture);
      expect(previewOf(element).getAttribute('data-probe')).toBe('fn');

      await picker.open();
      await panelOpen(element);

      expect(
        find(element, '.p-colorpicker-color-selector', HTMLElement).getAttribute('data-probe'),
      ).toBe('fn area');
      expect(previewOf(element).getAttribute('role')).toBe('combobox');
      await closePanel(picker, element);
    });

    it('lands the swatch’s routed attributes after a value change, a disable and an invalid', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({ preview: { 'data-probe': 'one' } });
        host.invalid.set(true);
      });
      const preview = previewOf(element);
      expect(preview.getAttribute('aria-invalid')).toBe('true');
      expect(preview.getAttribute('data-probe')).toBe('one');

      component.value.set('#facc15');
      component.invalid.set(false);
      await fixture.whenStable();
      await expect.poll(() => preview.getAttribute('aria-invalid')).toBeNull();
      expect(preview.getAttribute('data-probe')).toBe('one');
      expect(preview.getAttribute('aria-haspopup')).toBe('dialog');

      component.pt.set({ preview: { 'data-probe': 'two' } });
      await fixture.whenStable();
      await expect.poll(() => preview.getAttribute('data-probe')).toBe('two');
    });
  });

  describe('ARIA routing (FR-5)', () => {
    it('names the swatch with Optimus’s translated name while ariaLabel is unset', async () => {
      const { fixture } = await renderAs(AriaHost);
      const picker = await harnessOf(fixture);

      expect((await picker.getAriaAttributes()).label).toBe('Select a color');
    });

    it('sets ariaLabel over it, and puts Optimus’s name back when ariaLabel is cleared', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      const picker = await harnessOf(fixture);

      component.ariaLabel.set('Accent color');
      await fixture.whenStable();
      await expect.poll(async () => (await picker.getAriaAttributes()).label).toBe('Accent color');

      component.ariaLabel.set(undefined);
      await fixture.whenStable();
      await expect
        .poll(async () => (await picker.getAriaAttributes()).label)
        .toMatch(/^(Accent color|Select a color)$/);
    });

    it('sets ariaLabelledBy, ariaDescribedBy and inputId on the swatch', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('some-id');
      component.ariaDescribedBy.set('other-id');
      component.inputId.set('my-picker');
      await fixture.whenStable();
      const picker = await harnessOf(fixture);

      await expect.poll(() => picker.getId()).toBe('my-picker');
      expect(await picker.getAriaAttributes()).toEqual({
        label: 'Select a color',
        labelledBy: 'some-id',
        describedBy: 'other-id',
      });
      expect(hostOfFixture(fixture).hasAttribute('id')).toBe(false);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const picker = await harnessOf(fixture);

      expect((await picker.getAriaAttributes()).label).toBe('Select a color');
      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        'WJ0003: wj-colorpicker: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      ]);
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('marks aria-invalid only while invalid', async () => {
      const { fixture, component } = await render();
      const picker = await harnessOf(fixture);
      expect(await picker.isInvalid()).toBe(false);

      component.invalid.set(true);
      await fixture.whenStable();

      await expect.poll(() => picker.isInvalid()).toBe(true);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload on the ARIA string inputs and inputId as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      const picker = await harnessOf(fixture);

      await expect.poll(() => picker.getId()).toBe(PAYLOAD);
      expect(await picker.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(window).not.toHaveProperty('wjInjected');
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('the forms APIs', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the panel's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    describe('ngModel', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const picker = await harnessOf(fixture);
        await expect.poll(() => picker.getValue()).toBe('#0f766e');

        await pickColour(picker, fixture.nativeElement as HTMLElement);
        await fixture.whenStable();
        expect(component.value()).not.toBe('#0f766e');
        expect(component.value()).toBe(await picker.getValue());

        component.value.set('#facc15');
        await fixture.whenStable();
        await expect.poll(() => picker.getValue()).toBe('#facc15');
        await expect.poll(() => picker.getSwatchColor()).toBe('#facc15');
        await panelOpen(fixture.nativeElement as HTMLElement);
        await closePanel(picker, fixture.nativeElement as HTMLElement);
      });

      it('disables the picker from the form', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const picker = await harnessOf(fixture);

        component.disabled.set(true);
        await fixture.whenStable();

        await expect.poll(() => picker.isDisabled()).toBe(true);
      });

      it('is touched once the swatch has had focus and lost it', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const picker = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        byId(element, 'before').focus();
        await userEvent.tab();
        await expect.poll(() => picker.isFocused()).toBe(true);
        await userEvent.tab();

        expect(document.activeElement).toBe(byId(element, 'after'));
        expect(component.model().touched).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows the initial value, which was written before the inner control existed', async () => {
        const { fixture, element } = await renderAs(ReactiveHost);
        const picker = await harnessOf(fixture);

        expect(await picker.getValue()).toBe('#0f766e');
        await expect.poll(() => swatchOf(element)).toBe(rgb('#0f766e'));
      });

      it('writes the value out and marks the control dirty only for the user', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const picker = await harnessOf(fixture);

        component.control.setValue('#facc15');
        await fixture.whenStable();
        await expect.poll(() => picker.getValue()).toBe('#facc15');
        expect(component.control.dirty).toBe(false);

        await pickColour(picker, fixture.nativeElement as HTMLElement);
        await fixture.whenStable();

        expect(component.control.value).not.toBe('#facc15');
        expect(component.control.dirty).toBe(true);
        await panelOpen(fixture.nativeElement as HTMLElement);
        await closePanel(picker, fixture.nativeElement as HTMLElement);
      });

      it('keeps the control null until a colour is picked', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const picker = await harnessOf(fixture);

        component.control.setValue(null);
        await fixture.whenStable();

        await expect.poll(() => picker.getValue()).toBeNull();
        expect(component.control.value).toBeNull();
        await expect.poll(() => swatchOf(element)).toBe(rgb('#ff0000'));
      });

      it('disables the picker from the control, and marks it touched when focus leaves it', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const picker = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        byId(element, 'before').focus();
        await userEvent.tab();
        await expect.poll(() => picker.isFocused()).toBe(true);
        await userEvent.tab();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        await fixture.whenStable();
        await expect.poll(() => picker.isDisabled()).toBe(true);
        component.control.enable();
        await fixture.whenStable();
        await expect.poll(() => picker.isDisabled()).toBe(false);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const picker = await harnessOf(fixture);
        await expect.poll(() => picker.getValue()).toBe('#0f766e');

        await pickColour(picker, fixture.nativeElement as HTMLElement);
        await fixture.whenStable();
        expect(component.value().accent).toBe(await picker.getValue());
        expect(component.value().accent).not.toBe('#0f766e');

        component.model.accent().value.set('#facc15');
        await fixture.whenStable();
        await expect.poll(() => picker.getValue()).toBe('#facc15');
        await panelOpen(fixture.nativeElement as HTMLElement);
        await closePanel(picker, fixture.nativeElement as HTMLElement);
      });

      it('disables the picker from the form, and marks the field touched when focus leaves it', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const picker = await harnessOf(fixture);
        expect(component.model.accent().touched()).toBe(false);

        byId(element, 'before').focus();
        await userEvent.tab();
        await expect.poll(() => picker.isFocused()).toBe(true);
        await userEvent.tab();
        expect(component.model.accent().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        await expect.poll(() => picker.isDisabled()).toBe(true);
      });
    });
  });

  describe('inside a field (FR-43)', () => {
    it('registers as a plain stacked control: the field is no group and not inline', async () => {
      const { fixture } = await render((host) => {
        host.inField.set(true);
      });
      const field = await fieldOf(fixture);

      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('names the swatch with the field’s label span, which beats Optimus’s aria-label, and takes a generated id', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const picker = await harnessOf(fixture);
      const { labelledBy, label } = await picker.getAriaAttributes();
      const name = element.querySelector(`#${labelledBy ?? 'none'}`);

      expect(name?.tagName).toBe('SPAN');
      expect(name?.textContent).toBe('Accent color');
      expect(label).toBe('Select a color');
      expect(await picker.getId()).toMatch(/^wj-colorpicker-\d+$/);
    });

    it('lets ariaLabelledBy win over the field’s label, and merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const picker = await harnessOf(fixture);

      expect((await picker.getAriaAttributes()).labelledBy).toBe('mine');
      expect((await picker.getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
    });

    it('describes the swatch with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Used for links and buttons.');
      });
      const picker = await harnessOf(fixture);
      expect((await picker.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Pick a darker highlight color.');
      await fixture.whenStable();

      await expect
        .poll(async () => (await picker.getAriaAttributes()).describedBy)
        .toMatch(/^wj-field-hint-\d+ wj-field-error-\d+$/);
      expect(await (await fieldOf(fixture)).getHint()).toBe('Used for links and buttons.');
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isInvalid()).toBe(false);

      component.error.set('Pick a darker highlight color.');
      await fixture.whenStable();

      await expect.poll(() => picker.isInvalid()).toBe(true);
    });

    it('moves focus to the swatch when the label is clicked, as the field does for a control `<label for>` cannot name', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const picker = await harnessOf(fixture);
      expect(await picker.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await picker.isFocused()).toBe(true);
      expect(await picker.isOpen()).toBe(false);
      expect(component.value()).toBe('#0f766e');
      expect(component.log).toEqual([]);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const picker = await harnessOf(fixture);

      expect(await picker.getId()).toBe('');
      expect((await picker.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is named by a visible text through ariaLabelledBy', async () => {
      const { fixture } = await render();
      const picker = await harnessOf(fixture);

      expect((await picker.getAriaAttributes()).labelledBy).toBe('name');
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture } = await render((host) => {
        host.invalid.set(true);
      });
      const picker = await harnessOf(fixture);

      expect(await picker.isInvalid()).toBe(true);
    });
  });

  describe('touched (FR-43)', () => {
    it('keeps Optimus’s touch-on-focus: touched once the swatch has focus, and still after it leaves', async () => {
      const { fixture, component, element } = await renderAs(NgModelHost);
      const picker = await harnessOf(fixture);
      expect(component.model().touched).toBe(false);

      byId(element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => picker.isFocused()).toBe(true);
      await userEvent.tab();

      expect(component.model().touched).toBe(true);
    });
  });

  describe('harness', () => {
    it('is found by its ariaLabel, as text or a pattern', async () => {
      const { fixture } = await renderAs(KeyboardHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const skipped = await loader.getAllHarnesses(
        WjColorPickerHarness.with({ ariaLabel: 'Skipped' }),
      );
      const keys = await loader.getAllHarnesses(WjColorPickerHarness.with({ ariaLabel: /^Ke/ }));
      const all = await loader.getAllHarnesses(WjColorPickerHarness);

      expect(skipped).toHaveLength(1);
      expect(await skipped[0]?.getValue()).toBe('#0f766e');
      expect(await skipped[0]?.isDisabled()).toBe(true);
      expect(keys).toHaveLength(1);
      expect(all).toHaveLength(2);
    });

    it('reads the id, the focus state and the open state', async () => {
      const { fixture, element } = await render();
      const picker = await harnessOf(fixture);
      expect(await picker.isFocused()).toBe(false);

      await picker.focus();
      expect(await picker.isFocused()).toBe(true);
      expect(document.activeElement).toBe(previewOf(element));

      await picker.blur();
      expect(await picker.isFocused()).toBe(false);
      expect(await picker.isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
      });

      it('has no axe violations open, with the panel shown', async () => {
        // The panel's own motion must end for axe to read its final colours.
        document.getElementById('wj-spec-no-motion')?.remove();
        const { fixture, element } = await render(undefined, scheme);
        const picker = await harnessOf(fixture);
        await picker.open();
        await panelOpen(element);
        expect(await picker.isOpen()).toBe(true);

        await expectNoAxeViolations(hostOf(element));
        await closePanel(picker, element);
      });

      it('has no axe violations open, in a field', async () => {
        document.getElementById('wj-spec-no-motion')?.remove();
        const { fixture, element } = await render((host) => {
          host.inField.set(true);
          host.hint.set('Used for links and buttons.');
        }, scheme);
        const picker = await harnessOf(fixture);
        await picker.open();
        await panelOpen(element);

        await expectNoAxeViolations(find(element, 'wj-field', HTMLElement));
        await closePanel(picker, element);
      });
    });
  });
});

/** The first picker's host of a fixture. */
function hostOfFixture(fixture: ComponentFixture<unknown>): HTMLElement {
  return hostOf(fixture.nativeElement as HTMLElement);
}
