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
} from '@angular/forms/signals';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjKnob, type WjKnobPt } from 'weeljack-ng/knob';
import { WjKnobHarness } from 'weeljack-ng/knob/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** The knob's colours as the preset sets them (surface.500, primary, text.muted). */
const LOOK = {
  light: {
    range: 'rgb(113, 113, 122)', // surface.500
    value: 'rgb(9, 9, 11)', // surface.950 (primary.color)
    text: 'rgb(113, 113, 122)', // surface.500 (text.muted.color)
  },
  dark: {
    range: 'rgb(113, 113, 122)', // surface.500
    value: 'rgb(250, 250, 250)', // surface.50 (primary.color)
    text: 'rgb(161, 161, 170)', // surface.400 (text.muted.color)
  },
};

/** A consumer's template: one knob, bare (named by a visible text) or inside a field. */
@Component({
  selector: 'wj-knob-host',
  imports: [WjField, WjKnob],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Volume" [hint]="hint()" [error]="error()">
        <wj-knob
          [(value)]="value"
          (valueChange)="log.push($event)"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [readonly]="readonly()"
          [disabled]="disabled()"
          [invalid]="invalid()"
          [diameter]="diameter()"
          [showValue]="showValue()"
          [valueTemplate]="valueTemplate()"
          [pt]="pt()"
        />
      </wj-field>
    } @else {
      <span id="name">Volume</span>
      <wj-knob
        ariaLabelledBy="name"
        [(value)]="value"
        (valueChange)="log.push($event)"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [readonly]="readonly()"
        [disabled]="disabled()"
        [invalid]="invalid()"
        [diameter]="diameter()"
        [showValue]="showValue()"
        [valueTemplate]="valueTemplate()"
        [pt]="pt()"
      />
    }
    <button type="button" id="after">After</button>
    @if (tall()) {
      <div class="spacer"></div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: 24rem;
      justify-items: start;
    }
    .spacer {
      block-size: 3000px;
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<number | null>(40);
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly step = signal(1);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly diameter = signal(100);
  readonly showValue = signal(true);
  readonly valueTemplate = signal('{value}');
  readonly tall = signal(false);
  readonly pt = signal<WjKnobPt>(undefined);
  readonly log: (number | null)[] = [];
}

/** The ARIA string inputs, with `inputId`, bound from signals. */
@Component({
  selector: 'wj-knob-aria-host',
  imports: [WjKnob],
  template: `
    <wj-knob
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
      [inputId]="inputId()"
    />
  `,
})
class AriaHost {
  readonly ariaLabel = signal<string | undefined>('Volume');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly inputId = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-knob-aria-on-host-host',
  imports: [WjKnob],
  template: `<wj-knob aria-label="Volume" />`,
})
class AriaOnHostHost {}

/** A knob with no name of its own, and a consumer id on its dial. */
@Component({
  selector: 'wj-knob-nameless-host',
  imports: [WjKnob],
  template: `<wj-knob [pt]="pt" />`,
})
class NamelessHost {
  readonly pt: WjKnobPt = { svg: { id: 'consumer' } };
}

/** A plain knob, a field around one with a description of its own, and a bare one. */
@Component({
  selector: 'wj-knob-own-ids-host',
  imports: [WjKnob, WjField],
  template: `
    <p id="note">Note</p>
    <wj-knob ariaLabel="Plain" ariaDescribedBy="note" [value]="10" />
    <wj-field label="Quality" hint="Hint" error="Error">
      <wj-knob ariaDescribedBy="note" />
    </wj-field>
    <wj-knob ariaLabel="Bare" />
  `,
})
class OwnIdsHost {}

/** A field around a knob that names itself by a text of its own. */
@Component({
  selector: 'wj-knob-own-label-host',
  imports: [WjKnob, WjField],
  template: `
    <span id="mine">Mine</span>
    <wj-field label="Quality">
      <wj-knob ariaLabelledBy="mine" />
    </wj-field>
  `,
})
class OwnLabelHost {}

/** A static `step="5"` attribute, as the docs write it. */
@Component({
  selector: 'wj-knob-attribute-host',
  imports: [WjKnob],
  template: `<wj-knob ariaLabel="Opacity" step="5" diameter="64" [value]="50" />`,
})
class AttributeHost {}

/** `ngModel` inside a field, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-knob-ngmodel-host',
  imports: [WjField, WjKnob, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Volume">
      <wj-knob [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<number | null>(30);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-knob-reactive-host',
  imports: [WjField, WjKnob, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Volume">
      <wj-knob [formControl]="control" [min]="min()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(40);
  readonly min = signal<number | undefined>(undefined);
}

/** Signal forms with `[formField]`: `min` and `max` rules that push into the knob. */
@Component({
  selector: 'wj-knob-signal-host',
  imports: [WjField, WjKnob, FormField],
  template: `
    <form novalidate>
      <button type="button" id="before">Before</button>
      <wj-field label="Bass">
        <wj-knob [formField]="model.bass" />
      </wj-field>
      <wj-field label="Treble">
        <wj-knob [formField]="model.treble" />
      </wj-field>
      <button type="button" id="after">After</button>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ bass: number | null; treble: number | null }>({
    bass: null,
    treble: 30,
  });
  readonly model = form(this.value, (path) => {
    minRule(path.bass, 12);
    maxRule(path.bass, 32);
    disabledRule(path.treble, { when: () => this.off() });
  });
}

/** Two knobs between two native buttons, the first read-only, the second disabled, then the keys. */
@Component({
  selector: 'wj-knob-keyboard-host',
  imports: [WjKnob],
  template: `
    <button type="button" id="before">Before</button>
    <wj-knob ariaLabel="Read" readonly [value]="30" />
    <wj-knob ariaLabel="Off" disabled [value]="30" />
    <wj-knob
      ariaLabel="Keys"
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [valueTemplate]="'{value}%'"
    />
    <button type="button" id="after">After</button>
    <div class="spacer"></div>
  `,
  styles: `
    .spacer {
      block-size: 3000px;
    }
  `,
})
class KeyboardHost {
  readonly value = signal<number | null>(50);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(1);
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
  await expect.poll(() => getComputedStyle(rangeOf(element)).fill).toBe('none');
  return { fixture, component: fixture.componentInstance, element };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered<Host>> => renderAs(Host, setup, scheme);

function find<E extends Element>(element: Element, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-knob', HTMLElement);
/** Optimus's root, `p-knob`. */
const rootOf = (element: HTMLElement): HTMLElement => find(element, '.p-knob', HTMLElement);
/** The one focusable part, `svg role="slider"`, of the first knob. */
const dialOf = (element: HTMLElement): SVGSVGElement =>
  find(element, 'svg[role="slider"]', SVGSVGElement);
const rangeOf = (element: HTMLElement): SVGPathElement =>
  find(element, '.p-knob-range', SVGPathElement);
const arcOf = (element: HTMLElement): SVGPathElement =>
  find(element, '.p-knob-value', SVGPathElement);
const textOf = (element: HTMLElement): SVGTextElement =>
  find(element, '.p-knob-text', SVGTextElement);
const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** Where the first knob's value arc ends, as the point Optimus drew, in the 100 unit viewBox. */
function arcEnd(element: HTMLElement): { x: number; y: number } {
  const numbers = (arcOf(element).getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? [];
  return { x: Number(numbers.at(-2)), y: Number(numbers.at(-1)) };
}

/** Where the value arc of a knob over [`min`, `max`] ends for `value`: 240 degrees round to -60. */
function expectedEnd(value: number, min = 0, max = 100): { x: number; y: number } {
  const radians = (4 * Math.PI) / 3 - ((value - min) / (max - min)) * ((5 * Math.PI) / 3);
  return { x: 50 + Math.cos(radians) * 40, y: 50 - Math.sin(radians) * 40 };
}

/** Polls until the rendered arc ends where `value` is on [`min`, `max`]. */
async function expectArc(element: HTMLElement, value: number, min = 0, max = 100): Promise<void> {
  const want = expectedEnd(value, min, max);
  await expect.poll(() => arcEnd(element).x).toBeCloseTo(want.x, 1);
  expect(arcEnd(element).y).toBeCloseTo(want.y, 1);
}

/** The knob harnesses of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjKnobHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjKnobHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-knob at index ${String(index)}`);
    }
    return found;
  };
}

async function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjKnobHarness> {
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

/** Sends `key` to `target` the way a browser does; `false` when something cancelled it. */
function press(target: Element, key: string): boolean {
  return target.dispatchEvent(
    new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }),
  );
}

/** A point on the arc `degrees` anti-clockwise from 3 o'clock, as a coordinate inside the dial. */
function onArc(element: HTMLElement, degrees: number): { x: number; y: number } {
  const half = dialOf(element).getBoundingClientRect().width / 2;
  const radius = half * 0.8;
  const radians = (degrees * Math.PI) / 180;
  return { x: half + Math.cos(radians) * radius, y: half - Math.sin(radians) * radius };
}

const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  [
    'with a value template',
    (host) => {
      host.valueTemplate.set('{value}%');
    },
  ],
  [
    'at min',
    (host) => {
      host.value.set(0);
    },
  ],
  [
    'at max',
    (host) => {
      host.value.set(100);
    },
  ],
  [
    'read-only',
    (host) => {
      host.readonly.set(true);
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
    'empty (null)',
    (host) => {
      host.value.set(null);
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Applies to all speakers.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Set the bass between 20 and 80.');
    },
  ],
];

describe('WjKnob', () => {
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

  describe('keyboard (FR-7)', () => {
    /** Tabs from the first button past the read-only knob (a stop) to the third, the one that takes keys. */
    async function focusKeys(element: HTMLElement): Promise<SVGSVGElement> {
      byId(element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(dialOf(element));
      await userEvent.tab();
      const dial = element.querySelectorAll<SVGSVGElement>('svg[role="slider"]')[2];
      await expect.poll(() => document.activeElement).toBe(dial);
      return dial ?? dialOf(element);
    }

    it('Tab stops at a read-only knob, skips a disabled one, enters at the third, and leaves it', async () => {
      const { element } = await renderAs(KeyboardHost);

      const dial = await focusKeys(element);

      expect(dial.getAttribute('aria-label')).toBe('Keys');
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(dial);
    });

    it('moves by one step with an arrow and by ten with a page, and goes to min and max', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.value.set(40);
      });
      await focusKeys(element);
      const value = (): number | null => component.value();

      await userEvent.keyboard('{ArrowRight}');
      expect(value()).toBe(41);
      await userEvent.keyboard('{ArrowUp}');
      expect(value()).toBe(42);
      await userEvent.keyboard('{ArrowLeft}');
      expect(value()).toBe(41);
      await userEvent.keyboard('{ArrowDown}');
      expect(value()).toBe(40);
      await userEvent.keyboard('{PageUp}');
      expect(value()).toBe(50);
      await userEvent.keyboard('{PageDown}{PageDown}');
      expect(value()).toBe(30);
      await userEvent.keyboard('{Home}');
      expect(value()).toBe(0);
      await userEvent.keyboard('{End}');
      expect(value()).toBe(100);
    });

    it('moves by 5 with an arrow and by 50 with a page when step is 5: Optimus alone moves by 1 and 10', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.step.set(5);
        host.value.set(20);
      });
      await focusKeys(element);

      await userEvent.keyboard('{ArrowRight}');
      expect(component.value()).toBe(25);
      await userEvent.keyboard('{ArrowUp}');
      expect(component.value()).toBe(30);
      await userEvent.keyboard('{ArrowLeft}');
      expect(component.value()).toBe(25);
      await userEvent.keyboard('{ArrowDown}');
      expect(component.value()).toBe(20);
      await userEvent.keyboard('{PageUp}');
      expect(component.value()).toBe(70);
      await userEvent.keyboard('{PageDown}');
      expect(component.value()).toBe(20);
      await userEvent.keyboard('{Home}');
      expect(component.value()).toBe(0);
      await userEvent.keyboard('{End}');
      expect(component.value()).toBe(100);
    });

    it('stops at both ends, and a page that would pass an end lands on it', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.value.set(95);
      });
      await focusKeys(element);

      await userEvent.keyboard('{PageUp}');
      expect(component.value()).toBe(100);
      await userEvent.keyboard('{ArrowRight}{ArrowUp}{PageUp}{End}');
      expect(component.value()).toBe(100);

      await userEvent.keyboard('{Home}');
      expect(component.value()).toBe(0);
      await userEvent.keyboard('{ArrowLeft}{ArrowDown}{PageDown}{Home}');
      expect(component.value()).toBe(0);
    });

    it('snaps to the grid from min when min is not 0', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.min.set(12);
        host.max.set(32);
        host.step.set(4);
        host.value.set(16);
      });
      await focusKeys(element);

      await userEvent.keyboard('{ArrowRight}');
      expect(component.value()).toBe(20);
      await userEvent.keyboard('{PageUp}');
      expect(component.value()).toBe(32);
      await userEvent.keyboard('{Home}');
      expect(component.value()).toBe(12);
    });

    it('leaves a read-only and a disabled knob as they are: the keys change nothing and are cancelled', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      const [read, off] = Array.from(element.querySelectorAll('svg[role="slider"]'));

      expect(read?.getAttribute('tabindex')).toBe('0');
      expect(off?.getAttribute('tabindex')).toBe('-1');
      for (const dial of [read, off]) {
        for (const key of ['ArrowRight', 'ArrowDown', 'PageUp', 'Home', 'End']) {
          expect(dial && press(dial, key)).toBe(false);
        }
      }
      expect(await at(0).getValue()).toBe(30);
      expect(await at(1).getValue()).toBe(30);
    });

    it('Tab from a preceding button reaches a read-only knob, and skips a disabled one', async () => {
      const { element } = await renderAs(KeyboardHost);
      const [read, off] = Array.from(element.querySelectorAll('svg[role="slider"]'));
      byId(element, 'before').focus();

      await userEvent.tab();

      await expect.poll(() => document.activeElement).toBe(read);
      expect(read?.getAttribute('aria-readonly')).toBe('true');
      await userEvent.tab();
      expect(document.activeElement).not.toBe(off);
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Keys');
    });

    it('the tabindex of a read-only knob follows disabled: -1 while disabled, 0 again after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.readonly.set(true);
      });
      expect(dialOf(element).getAttribute('tabindex')).toBe('0');

      component.disabled.set(true);
      await fixture.whenStable();

      await expect.poll(() => dialOf(element).getAttribute('tabindex')).toBe('-1');

      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => dialOf(element).getAttribute('tabindex')).toBe('0');

      component.readonly.set(false);
      await fixture.whenStable();
      await expect.poll(() => dialOf(element).getAttribute('tabindex')).toBe('0');
    });

    it('does not move a focused read-only knob with a trusted key either', async () => {
      const { fixture, component, element } = await render((host) => {
        host.readonly.set(true);
      });
      const knob = await harnessOf(fixture);
      await knob.focus();

      await userEvent.keyboard('{ArrowRight}{PageUp}{End}{Home}');

      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);
      expect(dialOf(element).getAttribute('aria-valuenow')).toBe('40');
    });

    it('keeps focus on the dial, and the page where it is, through every key', async () => {
      const { element } = await renderAs(KeyboardHost);
      const dial = await focusKeys(element);
      expect(document.documentElement.scrollHeight).toBeGreaterThan(window.innerHeight + 1000);
      const top = window.scrollY;

      for (const key of ['PageDown', 'PageUp', 'End', 'Home', 'ArrowDown', 'ArrowRight']) {
        await userEvent.keyboard(`{${key}}`);
        expect(document.activeElement).toBe(dial);
        expect(window.scrollY).toBe(top);
      }
    });

    it('moves the value once per key and never writes a null in between', async () => {
      const { fixture, component } = await render();
      const knob = await harnessOf(fixture);
      component.log.length = 0;
      await knob.focus();

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}{PageUp}{Home}{End}');

      expect(component.log).toEqual([41, 42, 41, 51, 0, 100]);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('moves the rendered arc and text with each key, not only the model', async () => {
      const { fixture, element } = await render((host) => {
        host.valueTemplate.set('{value}%');
      });
      const knob = await harnessOf(fixture);
      await knob.focus();
      await expectArc(element, 40);
      expect(await knob.getShownText()).toBe('40%');

      await userEvent.keyboard('{PageUp}');
      await expectArc(element, 50);
      expect(await knob.getShownText()).toBe('50%');
      await userEvent.keyboard('{End}');
      await expectArc(element, 100);
      await userEvent.keyboard('{Home}');
      await expectArc(element, 0);
      expect(await knob.getShownText()).toBe('0%');
      expect(dialOf(element).getAttribute('aria-valuenow')).toBe('0');
    });

    it('starts from min when the value is null: a key writes a number', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(20);
        host.value.set(null);
      });
      const knob = await harnessOf(fixture);
      await knob.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(component.value()).toBe(21);
      await expect.poll(() => knob.getValue()).toBe(21);
    });

    it('goes to min on Home from null, writing the number it showed', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(20);
        host.value.set(null);
      });
      await (await harnessOf(fixture)).focus();

      await userEvent.keyboard('{Home}');

      expect(component.value()).toBe(20);
    });

    it('draws the family focus ring, round, around the dial after a Tab', async () => {
      const { element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(dialOf(element));
      const ring = getComputedStyle(dialOf(element));

      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');
      expect(ring.borderTopLeftRadius).toBe('50%');
    });

    it('is moved by a harness: steps, pages and the ends, each by its key', async () => {
      const { fixture, component } = await render();
      const knob = await harnessOf(fixture);

      await knob.stepUp(3);
      expect(component.value()).toBe(43);
      await knob.stepDown();
      expect(component.value()).toBe(42);
      await knob.pageUp(2);
      expect(component.value()).toBe(62);
      await knob.pageDown();
      expect(component.value()).toBe(52);
      await knob.toMax();
      expect(component.value()).toBe(100);
      await knob.toMin();
      expect(component.value()).toBe(0);
      await expect.poll(() => knob.getValue()).toBe(0);
    });
  });

  describe('pointer', () => {
    it.each([
      [90, 50],
      [0, 80],
      [180, 20],
    ])('jumps to the arc clicked at %i degrees: %i', async (degrees, value) => {
      const { component, element } = await render();
      component.log.length = 0;

      await userEvent.pointer({
        target: dialOf(element),
        coords: onArc(element, degrees),
        keys: '[MouseLeft]',
      });

      await expect.poll(() => component.value()).toBe(value);
      expect(component.log).toEqual([value]);
      await expectArc(element, value);
    });

    it('drags round the arc: the value and the drawn arc follow, once per change, without a null', async () => {
      const { component, element } = await render((host) => {
        host.tall.set(true);
      });
      component.log.length = 0;
      const box = dialOf(element).getBoundingClientRect();
      const at = onArc(element, 0);
      const top = window.scrollY;

      await userEvent.pointer([
        { target: dialOf(element), coords: onArc(element, 180), keys: '[MouseLeft>]' },
        { coords: { x: box.left + onArc(element, 90).x, y: box.top + onArc(element, 90).y } },
        { coords: { x: box.left + at.x, y: box.top + at.y } },
        { keys: '[/MouseLeft]' },
      ]);

      await expect.poll(() => component.value()).toBe(80);
      await expectArc(element, 80);
      expect(component.log.every((value) => value !== null)).toBe(true);
      expect(component.log.at(-1)).toBe(80);
      expect(window.scrollY).toBe(top);
    });

    it('snaps a click to step', async () => {
      const { component, element } = await render((host) => {
        host.step.set(10);
        host.value.set(0);
      });

      await userEvent.pointer({
        target: dialOf(element),
        coords: onArc(element, 90),
        keys: '[MouseLeft]',
      });

      await expect.poll(() => component.value()).toBe(50);
      expect((component.value() ?? 1) % 10).toBe(0);
    });

    it('ignores a click while read-only', async () => {
      const { component, element } = await render((host) => {
        host.readonly.set(true);
      });

      await userEvent.pointer({
        target: dialOf(element),
        coords: onArc(element, 0),
        keys: '[MouseLeft]',
      });

      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);
    });

    it('ignores a press, a click and a drag while disabled: Optimus’s own guards', async () => {
      const { component, element } = await render((host) => {
        host.disabled.set(true);
      });
      const box = dialOf(element).getBoundingClientRect();

      // Optimus's guards, reached by events a pointer could not send to a dimmed control.
      dialOf(element).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      dialOf(element).dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: box.right - 5, clientY: box.top + 50 }),
      );
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: box.right - 5 }));
      window.dispatchEvent(new MouseEvent('mouseup'));

      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);
    });
  });

  describe('inputs and outputs', () => {
    it('value is two-way: the arc follows it, and a key writes it back', async () => {
      const { fixture, component, element } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.getValue()).toBe(40);
      await expectArc(element, 40);

      component.value.set(75);
      await fixture.whenStable();
      await expect.poll(() => knob.getValue()).toBe(75);
      await expectArc(element, 75);

      await knob.stepDown();
      expect(component.value()).toBe(74);
      await expect.poll(() => knob.getValue()).toBe(74);
    });

    it('valueChange fires once per change, with the new value', async () => {
      const { fixture, component } = await render();
      const knob = await harnessOf(fixture);

      component.value.set(60);
      await fixture.whenStable();
      expect(component.log).toEqual([]);

      await knob.stepUp();
      await knob.stepUp();
      await knob.pageDown();

      expect(component.log).toEqual([61, 62, 52]);
    });

    it('min and max are 0 and 100 by default, and the app’s own when set', async () => {
      const { fixture, component } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.getMin()).toBe(0);
      expect(await knob.getMax()).toBe(100);

      component.min.set(12);
      component.max.set(32);
      component.value.set(16);
      await fixture.whenStable();

      await expect.poll(() => knob.getMin()).toBe(12);
      expect(await knob.getMax()).toBe(32);
    });

    it('draws the first render on the app’s own range', async () => {
      const { element } = await render((host) => {
        host.min.set(16);
        host.max.set(30);
        host.value.set(20);
      });

      await expectArc(element, 20, 16, 30);
      expect(dialOf(element).getAttribute('aria-valuenow')).toBe('20');
    });

    it('moves the arc when max changes under a value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(100);
      });
      await expectArc(element, 100);

      component.max.set(200);
      await fixture.whenStable();

      await expectArc(element, 100, 0, 200);
    });

    it('moves the arc when min changes under a value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(50);
      });

      component.min.set(40);
      await fixture.whenStable();

      await expectArc(element, 50, 40, 100);
    });

    it('draws a range that changes together with its value on the new range at once', async () => {
      const { fixture, component, element } = await render();

      component.min.set(16);
      component.max.set(30);
      component.value.set(20);
      await fixture.whenStable();

      await expectArc(element, 20, 16, 30);
    });

    it('falls back to 0 and 100 when min and max are set back to undefined', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(12);
        host.max.set(32);
      });
      const knob = await harnessOf(fixture);
      await expect.poll(() => knob.getMin()).toBe(12);

      component.min.set(undefined);
      component.max.set(undefined);
      await fixture.whenStable();

      await expect.poll(() => knob.getMin()).toBe(0);
      expect(await knob.getMax()).toBe(100);
    });

    it('reads step and diameter from static attributes, and moves by the step', async () => {
      const { fixture, element } = await renderAs(AttributeHost);
      const knob = await harnessOf(fixture);

      expect(dialOf(element).getBoundingClientRect().width).toBe(64);
      await knob.stepUp();
      await expect.poll(() => knob.getValue()).toBe(55);
    });

    it('showValue hides the text and shows it again, and the number stays on aria-valuenow', async () => {
      const { fixture, component, element } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.getShownText()).toBe('40');

      component.showValue.set(false);
      await fixture.whenStable();
      await expect.poll(() => knob.getShownText()).toBeNull();
      expect(element.querySelector('.p-knob-text')).toBeNull();
      expect(dialOf(element).getAttribute('aria-valuenow')).toBe('40');

      component.showValue.set(true);
      await fixture.whenStable();
      await expect.poll(() => knob.getShownText()).toBe('40');
    });

    it('valueTemplate puts the value where {value} is', async () => {
      const { fixture, component } = await render((host) => {
        host.valueTemplate.set('{value}%');
      });
      const knob = await harnessOf(fixture);
      expect(await knob.getShownText()).toBe('40%');

      component.valueTemplate.set('~{value} dB');
      await fixture.whenStable();
      await expect.poll(() => knob.getShownText()).toBe('~40 dB');
    });

    it('diameter sets the dial’s width and height, and the arcs scale with it', async () => {
      const { fixture, component, element } = await render();
      const range = rangeOf(element).getBoundingClientRect();
      expect(dialOf(element).getBoundingClientRect().width).toBe(100);

      component.diameter.set(160);
      await fixture.whenStable();

      await expect.poll(() => dialOf(element).getBoundingClientRect().width).toBe(160);
      expect(dialOf(element).getBoundingClientRect().height).toBe(160);
      expect(rangeOf(element).getBoundingClientRect().width).toBeCloseTo(range.width * 1.6, 0);

      component.diameter.set(64);
      await fixture.whenStable();
      await expect.poll(() => dialOf(element).getBoundingClientRect().height).toBe(64);
    });

    it('readonly shows the value, keeps the dial in the Tab order and says so', async () => {
      const { fixture, component, element } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.isReadonly()).toBe(false);
      expect(dialOf(element).getAttribute('tabindex')).toBe('0');

      component.readonly.set(true);
      await fixture.whenStable();

      await expect.poll(() => knob.isReadonly()).toBe(true);
      expect(dialOf(element).getAttribute('tabindex')).toBe('0');
      expect(dialOf(element).getAttribute('aria-readonly')).toBe('true');
      expect(dialOf(element).getAttribute('aria-valuenow')).toBe('40');
      expect(await knob.isDisabled()).toBe(false);
      expect(getComputedStyle(dialOf(element)).opacity).toBe('1');
    });

    it('disabled takes the dial out of the Tab order and ignores keys, and a form can disable it', async () => {
      const { fixture, component, element } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.isDisabled()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => knob.isDisabled()).toBe(true);
      expect(dialOf(element).getAttribute('tabindex')).toBe('-1');
      await knob.stepUp();
      await knob.toMax();
      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);

      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => knob.isDisabled()).toBe(false);
      await expect.poll(() => dialOf(element).getAttribute('tabindex')).toBe('0');
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('invalid reaches the dial as aria-invalid and paints nothing', async () => {
      const { fixture, component, element } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.isInvalid()).toBe(false);
      const look = (): string[] => {
        const style = getComputedStyle(dialOf(element));
        const range = getComputedStyle(rangeOf(element));
        return [style.outlineStyle, style.borderTopStyle, style.opacity, range.stroke];
      };
      const clean = look();

      component.invalid.set(true);
      await fixture.whenStable();
      await expect.poll(() => knob.isInvalid()).toBe(true);

      expect(look()).toEqual(clean);
      component.invalid.set(false);
      await fixture.whenStable();
      await expect.poll(() => knob.isInvalid()).toBe(false);
    });
  });

  describe('null shows min', () => {
    it.each([0, 20])(
      'with min %i: the arc and text show min, the model stays null',
      async (min) => {
        const { fixture, component, element } = await render((host) => {
          host.min.set(min);
          host.value.set(null);
        });
        const knob = await harnessOf(fixture);

        expect(await knob.getValue()).toBe(min);
        expect(await knob.getShownText()).toBe(String(min));
        await expectArc(element, min, min);
        expect(component.value()).toBeNull();
        expect(component.log).toEqual([]);
      },
    );

    it('moves a null to min when min changes, and keeps it null', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(null);
      });
      const knob = await harnessOf(fixture);
      expect(await knob.getValue()).toBe(0);

      component.min.set(30);
      await fixture.whenStable();

      await expect.poll(() => knob.getValue()).toBe(30);
      expect(component.value()).toBeNull();
    });

    it('shows min again when the model goes back to null', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(20);
        host.value.set(70);
      });
      const knob = await harnessOf(fixture);
      await expect.poll(() => knob.getValue()).toBe(70);

      component.value.set(null);
      await fixture.whenStable();

      await expect.poll(() => knob.getValue()).toBe(20);
      expect(await knob.getShownText()).toBe('20');
    });
  });

  describe('pt', () => {
    it('reaches the svg, range, value and text parts, and the routed attributes win over it', async () => {
      const { element } = await render((host) => {
        host.pt.set({
          svg: {
            'data-probe': 'svg',
            'aria-invalid': 'false',
            'aria-disabled': 'false',
            'aria-readonly': 'false',
          },
          range: { 'data-probe': 'range' },
          value: { 'data-probe': 'value' },
          text: { 'data-probe': 'text' },
        });
        host.invalid.set(true);
        host.disabled.set(true);
        host.readonly.set(true);
      });

      expect(dialOf(element).getAttribute('data-probe')).toBe('svg');
      expect(rangeOf(element).getAttribute('data-probe')).toBe('range');
      expect(arcOf(element).getAttribute('data-probe')).toBe('value');
      expect(textOf(element).getAttribute('data-probe')).toBe('text');
      expect(dialOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(dialOf(element).getAttribute('aria-disabled')).toBe('true');
      expect(dialOf(element).getAttribute('aria-readonly')).toBe('true');
    });

    it('lands the routed dial attributes after a move, a disable, a read-only, an invalid and a pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({ svg: { 'data-probe': 'one' } });
        host.invalid.set(true);
      });
      const dial = dialOf(element);
      expect(dial.getAttribute('data-probe')).toBe('one');
      expect(dial.getAttribute('aria-invalid')).toBe('true');

      await (await harnessOf(fixture)).stepUp();
      await fixture.whenStable();
      expect(dial.getAttribute('role')).toBe('slider');
      expect(dial.getAttribute('data-probe')).toBe('one');
      expect(dial.getAttribute('aria-invalid')).toBe('true');

      component.readonly.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => dial.getAttribute('aria-disabled')).toBe('true');
      expect(dial.getAttribute('aria-readonly')).toBe('true');
      expect(dial.getAttribute('data-probe')).toBe('one');

      component.pt.set({ svg: { 'data-probe': 'two' } });
      await fixture.whenStable();
      await expect.poll(() => dial.getAttribute('data-probe')).toBe('two');
      expect(dial.getAttribute('aria-disabled')).toBe('true');
      expect(dial.getAttribute('aria-readonly')).toBe('true');
      expect(dial.getAttribute('aria-invalid')).toBe('true');

      component.invalid.set(false);
      component.disabled.set(false);
      component.readonly.set(false);
      await fixture.whenStable();
      await expect.poll(() => dial.getAttribute('aria-disabled')).toBeNull();
      expect(dial.getAttribute('aria-readonly')).toBeNull();
      expect(dial.getAttribute('aria-invalid')).toBeNull();
      expect(dial.getAttribute('data-probe')).toBe('two');
    });

    it('takes the function form of pt, and routes over it too', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ svg: { 'data-probe': 'fn', 'aria-invalid': 'false' } }));
        host.invalid.set(true);
      });

      expect(dialOf(element).getAttribute('data-probe')).toBe('fn');
      expect(dialOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('keeps a consumer’s own id on the dial when no id is routed, and loses to the field’s', async () => {
      const bare = await renderAs(NamelessHost);
      expect(dialOf(bare.element).id).toBe('consumer');
      TestBed.resetTestingModule();

      const { element } = await render((host) => {
        host.inField.set(true);
        host.pt.set({ svg: { id: 'consumer' } });
      });
      expect(dialOf(element).id).toMatch(/^wj-knob-\d+$/);
    });

    it('never routes aria-valuenow: Optimus keeps it current', async () => {
      const { fixture, element } = await render();
      const knob = await harnessOf(fixture);

      await knob.pageUp();

      await expect.poll(() => dialOf(element).getAttribute('aria-valuenow')).toBe('50');
      expect(dialOf(element).getAttribute('aria-valuemin')).toBe('0');
      expect(dialOf(element).getAttribute('aria-valuemax')).toBe('100');
    });
  });

  describe('the look', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('draws the range in surface.500, the value in the primary and the text in the muted colour', async () => {
        const { element } = await render(undefined, scheme);

        expect(getComputedStyle(rangeOf(element)).stroke).toBe(LOOK[scheme].range);
        expect(getComputedStyle(arcOf(element)).stroke).toBe(LOOK[scheme].value);
        expect(getComputedStyle(textOf(element)).fill).toBe(LOOK[scheme].text);
      });
    });

    it('draws a 14 unit stroke that scales with the diameter, and the text at 1.3rem', async () => {
      const { element } = await render();

      expect(rangeOf(element).getAttribute('stroke-width')).toBe('14');
      expect(arcOf(element).getAttribute('stroke-width')).toBe('14');
      expect(getComputedStyle(textOf(element)).fontSize).toBe(
        `${String(1.3 * parseFloat(getComputedStyle(ROOT).fontSize))}px`,
      );
    });

    it('dims a disabled knob to 0.6, keeps the arc, and leaves a read-only one as it is', async () => {
      const off = await render((host) => {
        host.disabled.set(true);
      });
      expect(getComputedStyle(rootOf(off.element)).opacity).toBe('0.6');
      await expectArc(off.element, 40);
      TestBed.resetTestingModule();

      const read = await render((host) => {
        host.readonly.set(true);
      });
      expect(getComputedStyle(rootOf(read.element)).opacity).toBe('1');
    });

    it('has a hit box of at least 24 px at the default, and is the diameter at 24', async () => {
      const { fixture, component, element } = await render();
      const box = dialOf(element).getBoundingClientRect();
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);

      component.diameter.set(24);
      await fixture.whenStable();
      await expect.poll(() => dialOf(element).getBoundingClientRect().width).toBe(24);
      expect(dialOf(element).getBoundingClientRect().height).toBe(24);
    });
  });

  describe('the host box', () => {
    it.each([64, 100, 160])(
      'is exactly the %i px square of the dial, with no gap under the svg',
      async (diameter) => {
        const { element } = await render((host) => {
          host.diameter.set(diameter);
        });
        await expect.poll(() => dialOf(element).getBoundingClientRect().width).toBe(diameter);

        const box = hostOf(element).getBoundingClientRect();

        expect(box.width).toBe(diameter);
        expect(box.height).toBe(diameter);
        expect(rootOf(element).getBoundingClientRect().height).toBe(diameter);
      },
    );

    it('is inline-level outside a grid, and Optimus’s root is its flex item', async () => {
      const { element } = await renderAs(AttributeHost);

      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(getComputedStyle(rootOf(element)).display).toBe('flex');
      expect(hostOf(element).getBoundingClientRect().height).toBe(64);
    });

    it('keeps a field’s error right under the dial, not a gap lower', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.error.set('Set the bass between 20 and 80.');
      });
      const dial = dialOf(element).getBoundingClientRect();
      const error = find(element, '.wj-field-error', HTMLElement).getBoundingClientRect();

      expect(error.top - dial.bottom).toBeLessThan(16);
      expect(error.top).toBeGreaterThanOrEqual(dial.bottom);
    });
  });

  describe('the forms APIs', () => {
    describe('ngModel', () => {
      it('writes the value in, and the value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const knob = await harnessOf(fixture);
        await expect.poll(() => knob.getValue()).toBe(30);

        await knob.stepUp(5);
        await fixture.whenStable();
        expect(component.value()).toBe(35);

        component.value.set(null);
        await fixture.whenStable();
        await expect.poll(() => knob.getValue()).toBe(0);
      });

      it('disables the knob, and is touched only once focus leaves it', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const knob = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await knob.focus();
        await knob.stepUp();
        expect(component.model().touched).toBe(false);
        await knob.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        await expect.poll(() => knob.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows the initial value, writes the value out, and marks it dirty only for the user', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const knob = await harnessOf(fixture);
        await expect.poll(() => knob.getValue()).toBe(40);
        await expectArc(element, 40);
        expect(component.control.dirty).toBe(false);

        await knob.stepUp(2);
        expect(component.control.value).toBe(42);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(80);
        await expect.poll(() => knob.getValue()).toBe(80);
        await expectArc(element, 80);
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(10);

        expect(component.control.dirty).toBe(false);
      });

      it('keeps the control’s value null while the knob shows min', async () => {
        const { fixture, component } = await renderAs(ReactiveHost, (host) => {
          host.control.setValue(null);
          host.min.set(20);
        });
        const knob = await harnessOf(fixture);

        await expect.poll(() => knob.getValue()).toBe(20);
        expect(component.control.value).toBeNull();
        expect(component.control.dirty).toBe(false);

        component.control.setValue(60);
        await expect.poll(() => knob.getValue()).toBe(60);
        component.control.setValue(null);
        await expect.poll(() => knob.getValue()).toBe(20);
        expect(component.control.value).toBeNull();

        await knob.stepUp();
        expect(component.control.value).toBe(21);
      });

      it('disables the knob, and marks the control touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const knob = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await knob.focus();
        await knob.pageUp();
        expect(component.control.touched).toBe(false);
        await knob.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        await expect.poll(() => knob.isDisabled()).toBe(true);
        component.control.enable();
        await expect.poll(() => knob.isDisabled()).toBe(false);
      });

      it('marks the control touched when focus tabs away to the next element, and not on a key inside', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const knob = await harnessOf(fixture);
        byId(element, 'before').focus();

        await userEvent.tab();
        await expect.poll(() => knob.isFocused()).toBe(true);
        await userEvent.keyboard('{ArrowRight}{End}');
        expect(component.control.touched).toBe(false);
        await userEvent.tab();

        expect(document.activeElement).toBe(byId(element, 'after'));
        expect(component.control.touched).toBe(true);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => at(1).getValue()).toBe(30);

        await at(1).stepUp(4);
        await fixture.whenStable();
        expect(component.value().treble).toBe(34);
        await expect.poll(() => at(1).getValue()).toBe(34);

        component.model.treble().value.set(70);
        await fixture.whenStable();
        await expect.poll(() => at(1).getValue()).toBe(70);
      });

      it('pushes the schema’s min and max into the knob, over the defaults', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);

        await expect.poll(() => at(0).getMin()).toBe(12);
        expect(await at(0).getMax()).toBe(32);
        expect(await at(1).getMin()).toBe(0);
        expect(await at(1).getMax()).toBe(100);
        // The form's value is null, and the knob shows the pushed min.
        expect(component.value().bass).toBeNull();
        expect(await at(0).getValue()).toBe(12);
        expect(await at(0).getShownText()).toBe('12');
        const first = find(element, 'wj-knob', HTMLElement);
        await expectArc(first, 12, 12, 32);
      });

      it('moves from the pushed min with a key, and writes the number', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => at(0).getMin()).toBe(12);

        await at(0).stepUp(3);
        await fixture.whenStable();

        expect(component.value().bass).toBe(15);
        await at(0).toMax();
        await fixture.whenStable();
        expect(component.value().bass).toBe(32);
        await at(0).toMin();
        await fixture.whenStable();
        expect(component.value().bass).toBe(12);
        expect(component.model.bass().invalid()).toBe(false);
      });

      it('disables the knob from the form, and marks the field touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(component.model.treble().touched()).toBe(false);

        await at(1).focus();
        expect(component.model.treble().touched()).toBe(false);
        await at(1).blur();
        expect(component.model.treble().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        await expect.poll(() => at(1).isDisabled()).toBe(true);
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

    it('is a slider named by the field’s label span, and takes a generated id', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const knob = await harnessOf(fixture);
      const { labelledBy } = await knob.getAriaAttributes();
      const label = element.querySelector(`#${labelledBy ?? 'none'}`);

      expect(dialOf(element).getAttribute('role')).toBe('slider');
      expect(label?.tagName).toBe('SPAN');
      expect(label?.textContent).toBe('Volume');
      expect(await knob.getId()).toMatch(/^wj-knob-\d+$/);
    });

    it('lets ariaLabelledBy win over the field’s label', async () => {
      const { element } = await renderAs(OwnLabelHost);

      expect(dialOf(element).getAttribute('aria-labelledby')).toBe('mine');
    });

    it('merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);

      expect((await at(1).getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await (await fieldOf(fixture)).getHint()).toBe('Hint');
    });

    it('describes the dial with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Applies to all speakers.');
      });
      const knob = await harnessOf(fixture);
      expect((await knob.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Set the bass between 20 and 80.');
      await fixture.whenStable();
      expect((await knob.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await knob.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const knob = await harnessOf(fixture);
      expect(await knob.isInvalid()).toBe(false);

      component.error.set('Set the bass between 20 and 80.');
      await fixture.whenStable();
      expect(await knob.isInvalid()).toBe(true);

      component.error.set('');
      await fixture.whenStable();
      expect(await knob.isInvalid()).toBe(false);
    });

    it('moves focus to the dial when the label is clicked, through its routed id', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const knob = await harnessOf(fixture);
      expect(await knob.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await knob.isFocused()).toBe(true);
      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const knob = (await allHarnessesOf(fixture))(2);

      expect(await knob.getId()).toBe('');
      expect((await knob.getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s ariaDescribedBy on the dial', async () => {
      const { fixture } = await renderAs(OwnIdsHost);

      expect((await (await allHarnessesOf(fixture))(0).getAriaAttributes()).describedBy).toBe(
        'note',
      );
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const knob = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await knob.isInvalid()).toBe(true);
    });

    it('is a slider named by a visible text through ariaLabelledBy', async () => {
      const { fixture, element } = await render();
      const knob = await harnessOf(fixture);

      expect(dialOf(element).getAttribute('role')).toBe('slider');
      expect((await knob.getAriaAttributes()).labelledBy).toBe('name');
      expect(byId(element, 'name').textContent).toBe('Volume');
    });

    it('has no name of its own when none is given', async () => {
      const { element } = await renderAs(NamelessHost);
      const dial = dialOf(element);

      expect(dial.hasAttribute('aria-label')).toBe(false);
      expect(dial.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets ariaLabel, ariaLabelledBy, ariaDescribedBy and inputId on the dial', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      const knob = await harnessOf(fixture);
      expect(await knob.getAriaAttributes()).toEqual({
        label: 'Volume',
        labelledBy: null,
        describedBy: null,
      });
      expect(await knob.getId()).toBe('');

      component.ariaLabel.set('Gain');
      component.ariaLabelledBy.set('some-id');
      component.ariaDescribedBy.set('other-id');
      component.inputId.set('my-knob');
      await fixture.whenStable();

      expect(await knob.getAriaAttributes()).toEqual({
        label: 'Gain',
        labelledBy: 'some-id',
        describedBy: 'other-id',
      });
      expect(await knob.getId()).toBe('my-knob');
      expect(hostOf(element).hasAttribute('id')).toBe(false);
    });

    it('marks aria-disabled and aria-readonly only while they apply, and always names the value range', async () => {
      const { fixture, component, element } = await render();
      const knob = await harnessOf(fixture);
      expect(dialOf(element).hasAttribute('aria-disabled')).toBe(false);
      expect(dialOf(element).hasAttribute('aria-readonly')).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => knob.isDisabled()).toBe(true);
      expect(dialOf(element).hasAttribute('aria-readonly')).toBe(false);

      component.disabled.set(false);
      component.readonly.set(true);
      await fixture.whenStable();
      await expect.poll(() => knob.isReadonly()).toBe(true);
      expect(dialOf(element).hasAttribute('aria-disabled')).toBe(false);
      expect(dialOf(element).getAttribute('aria-valuenow')).toBe('40');
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const knob = await harnessOf(fixture);

      expect((await knob.getAriaAttributes()).label).toBeNull();
      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        'WJ0003: wj-knob: aria-label is set on the host, where it is not forwarded to the ' +
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
    it('renders an HTML payload on the ARIA string inputs and inputId as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      const knob = await harnessOf(fixture);

      expect(await knob.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(await knob.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload in valueTemplate as text, with no element and no handler', async () => {
      const { fixture, element } = await render((host) => {
        host.valueTemplate.set(`${PAYLOAD}{value}`);
      });
      const knob = await harnessOf(fixture);

      expect(await knob.getShownText()).toBe(`${PAYLOAD}40`);
      expect(textOf(element).children).toHaveLength(0);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('motion', () => {
    it('runs the dial’s transition on Optimus’s 0.2s, and at 0s under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      await expect
        .poll(() => getComputedStyle(dialOf(normal.element)).transitionDuration)
        .toContain('0.2s');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(() => getComputedStyle(dialOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
    });

    it('fades the range arc’s stroke in 0.1s normally, and not at all under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      const arc = getComputedStyle(rangeOf(normal.element));
      expect(arc.transitionDuration).toBe('0.1s');
      expect(arc.transitionProperty).toBe('stroke');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(() => getComputedStyle(rangeOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
      expect(getComputedStyle(rangeOf(reduced.element)).transitionProperty).toBe('stroke');
    });

    it('never animates the arc’s length or the dial’s position: no running transition names one', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const { element } = await render();

      for (const part of [dialOf(element), rangeOf(element), arcOf(element)]) {
        const style = getComputedStyle(part);
        const durations = style.transitionDuration.split(', ');
        const running = style.transitionProperty
          .split(', ')
          .filter((_property, index) => durations[index % durations.length] !== '0s');
        expect(running.join(' ')).not.toMatch(
          /all|stroke-dash|inset|left|right|bottom|top|margin|transform/,
        );
      }
    });
  });

  describe('harness', () => {
    it('is found by its ariaLabel, as text or a pattern', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const plain = await loader.getAllHarnesses(WjKnobHarness.with({ ariaLabel: 'Plain' }));
      const bare = await loader.getAllHarnesses(WjKnobHarness.with({ ariaLabel: /^Ba/ }));
      const all = await loader.getAllHarnesses(WjKnobHarness);

      expect(plain).toHaveLength(1);
      expect(await plain[0]?.getValue()).toBe(10);
      expect(bare).toHaveLength(1);
      expect(all).toHaveLength(3);
    });

    it('reads the value, the range and the shown text', async () => {
      const { fixture } = await render((host) => {
        host.min.set(12);
        host.max.set(32);
        host.value.set(20);
        host.valueTemplate.set('{value} dB');
      });
      const knob = await harnessOf(fixture);

      await expect.poll(() => knob.getMin()).toBe(12);
      expect(await knob.getMax()).toBe(32);
      expect(await knob.getValue()).toBe(20);
      expect(await knob.getShownText()).toBe('20 dB');
    });

    it('reads the focus state', async () => {
      const { fixture, element } = await render();
      const knob = await harnessOf(fixture);
      expect(await knob.isFocused()).toBe(false);

      await knob.focus();
      expect(await knob.isFocused()).toBe(true);
      expect(document.activeElement).toBe(dialOf(element));

      await knob.blur();
      expect(await knob.isFocused()).toBe(false);
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
