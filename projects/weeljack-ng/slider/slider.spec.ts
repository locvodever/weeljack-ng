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
import { WjSlider, type WjSliderOrientation, type WjSliderPt } from 'weeljack-ng/slider';
import { WjSliderHarness } from 'weeljack-ng/slider/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** The slider's colours as the preset sets them (surface.500, surface.600 / 400, primary). */
const LOOK = {
  light: {
    ring: 'rgb(113, 113, 122)', // surface.500: the track and the handle's ring at rest
    hover: 'rgb(82, 82, 91)', // surface.600
    range: 'rgb(9, 9, 11)', // surface.950 (primary.color)
    face: 'rgb(255, 255, 255)', // surface.0
  },
  dark: {
    ring: 'rgb(113, 113, 122)', // surface.500
    hover: 'rgb(161, 161, 170)', // surface.400
    range: 'rgb(250, 250, 250)', // surface.50 (primary.color)
    face: 'rgb(9, 9, 11)', // surface.950
  },
};

/** A consumer's template: one slider, bare (named by a visible text) or inside a field. */
@Component({
  selector: 'wj-slider-host',
  imports: [WjField, WjSlider],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Text size" [hint]="hint()" [error]="error()">
        <wj-slider
          [(value)]="value"
          (valueChange)="log.push($event)"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [orientation]="orientation()"
          [disabled]="disabled()"
          [invalid]="invalid()"
          [pt]="pt()"
        />
      </wj-field>
    } @else {
      <span id="name">Volume</span>
      <wj-slider
        ariaLabelledBy="name"
        [(value)]="value"
        (valueChange)="log.push($event)"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [orientation]="orientation()"
        [disabled]="disabled()"
        [invalid]="invalid()"
        [pt]="pt()"
        [style.block-size]="orientation() === 'vertical' ? '12rem' : null"
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
  readonly orientation = signal<WjSliderOrientation>('horizontal');
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly tall = signal(false);
  readonly pt = signal<WjSliderPt>(undefined);
  readonly log: (number | null)[] = [];
}

/** The ARIA string inputs, with `inputId`, bound from signals. */
@Component({
  selector: 'wj-slider-aria-host',
  imports: [WjSlider],
  template: `
    <wj-slider
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
  selector: 'wj-slider-aria-on-host-host',
  imports: [WjSlider],
  template: `<wj-slider aria-label="Volume" />`,
})
class AriaOnHostHost {}

/** A slider with no name of its own, and a consumer id on its handle. */
@Component({
  selector: 'wj-slider-nameless-host',
  imports: [WjSlider],
  template: `<wj-slider [pt]="pt" />`,
})
class NamelessHost {
  readonly pt: WjSliderPt = { handle: { id: 'consumer' } };
}

/** A plain slider, a field around one with a description of its own, and a bare one. */
@Component({
  selector: 'wj-slider-own-ids-host',
  imports: [WjSlider, WjField],
  template: `
    <p id="note">Note</p>
    <wj-slider ariaLabel="Plain" ariaDescribedBy="note" [value]="10" />
    <wj-field label="Quality" hint="Hint" error="Error">
      <wj-slider ariaDescribedBy="note" />
    </wj-field>
    <wj-slider ariaLabel="Bare" />
  `,
})
class OwnIdsHost {}

/** A field around a slider that names itself by a text of its own. */
@Component({
  selector: 'wj-slider-own-label-host',
  imports: [WjSlider, WjField],
  template: `
    <span id="mine">Mine</span>
    <wj-field label="Quality">
      <wj-slider ariaLabelledBy="mine" />
    </wj-field>
  `,
})
class OwnLabelHost {}

/** A static `step="5"` attribute, as the docs write it. */
@Component({
  selector: 'wj-slider-attribute-host',
  imports: [WjSlider],
  template: `<wj-slider ariaLabel="Opacity" step="5" [value]="50" />`,
})
class AttributeHost {}

/** `ngModel` inside a field, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-slider-ngmodel-host',
  imports: [WjField, WjSlider, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Volume">
      <wj-slider [(ngModel)]="value" [disabled]="disabled()" />
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
  selector: 'wj-slider-reactive-host',
  imports: [WjField, WjSlider, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Volume">
      <wj-slider [formControl]="control" [min]="min()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(40);
  readonly min = signal<number | undefined>(undefined);
}

/** Signal forms with `[formField]`: `min` and `max` rules that push into the slider. */
@Component({
  selector: 'wj-slider-signal-host',
  imports: [WjField, WjSlider, FormField],
  template: `
    <form novalidate>
      <button type="button" id="before">Before</button>
      <wj-field label="Text size">
        <wj-slider [formField]="model.size" />
      </wj-field>
      <wj-field label="Maximum price">
        <wj-slider [formField]="model.price" />
      </wj-field>
      <button type="button" id="after">After</button>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ size: number | null; price: number | null }>({
    size: null,
    price: 30,
  });
  readonly model = form(this.value, (path) => {
    minRule(path.size, 12);
    maxRule(path.size, 32);
    disabledRule(path.price, { when: () => this.off() });
  });
}

/** Two sliders between two native buttons, the first disabled, for the keyboard spec. */
@Component({
  selector: 'wj-slider-keyboard-host',
  imports: [WjSlider],
  template: `
    <button type="button" id="before">Before</button>
    <wj-slider ariaLabel="Skipped" disabled [value]="30" />
    <wj-slider
      ariaLabel="Keys"
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [orientation]="orientation()"
      [style.block-size]="orientation() === 'vertical' ? '12rem' : null"
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
  readonly orientation = signal<WjSliderOrientation>('horizontal');
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
  await expect.poll(() => handleOf(element).getBoundingClientRect().height).toBe(24);
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

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-slider', HTMLElement);
/** Optimus's root: the track. */
const trackOf = (element: HTMLElement): HTMLElement => find(element, '.p-slider', HTMLElement);
const rangeOf = (element: HTMLElement): HTMLElement =>
  find(element, '.p-slider-range', HTMLElement);
/** The one focusable part, `role="slider"`, of the first slider. */
const handleOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="slider"]', HTMLElement);
const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/**
 * Where the handle's centre sits along the track of the first slider: 0 at the start of the track
 * (the left, or the bottom when vertical) and 1 at its end. Asserted from the rendered boxes, so a
 * model that moved with the handle where it was is caught.
 */
function placeOf(element: HTMLElement): number {
  const handle = handleOf(element).getBoundingClientRect();
  const track = trackOf(element).getBoundingClientRect();
  return trackOf(element).classList.contains('p-slider-vertical')
    ? (track.bottom - (handle.top + handle.height / 2)) / track.height
    : (handle.left + handle.width / 2 - track.left) / track.width;
}

/** Polls until the handle sits where `value` is on [`min`, `max`], within a pixel's worth. */
async function expectPlace(element: HTMLElement, value: number, min = 0, max = 100): Promise<void> {
  await expect.poll(() => placeOf(element)).toBeCloseTo((value - min) / (max - min), 1);
}

/** The slider harnesses of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjSliderHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjSliderHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-slider at index ${String(index)}`);
    }
    return found;
  };
}

async function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjSliderHarness> {
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
function press(target: HTMLElement, key: string): boolean {
  return target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
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
    'vertical',
    (host) => {
      host.orientation.set('vertical');
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
      host.hint.set('Applies to the reader only.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Set a maximum price.');
    },
  ],
];

describe('WjSlider', () => {
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
    it('Tab enters at the handle, and Tab again leaves it', async () => {
      const { element } = await renderAs(KeyboardHost);
      byId(element, 'before').focus();

      await userEvent.tab();

      await expect
        .poll(() => document.activeElement)
        .toBe(element.querySelectorAll('[role="slider"]')[1]);
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('moves by one step with an arrow and by ten with a page, and goes to min and max', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.value.set(40);
      });
      byId(element, 'before').focus();
      await userEvent.tab();
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

    it('moves by 5 with an arrow and by 50 with a page when step is 5', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.step.set(5);
        host.value.set(20);
      });
      byId(element, 'before').focus();
      await userEvent.tab();

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
      byId(element, 'before').focus();
      await userEvent.tab();

      await userEvent.keyboard('{PageUp}');
      expect(component.value()).toBe(100);
      await userEvent.keyboard('{ArrowRight}{ArrowUp}{PageUp}{End}');
      expect(component.value()).toBe(100);

      await userEvent.keyboard('{Home}');
      expect(component.value()).toBe(0);
      await userEvent.keyboard('{ArrowLeft}{ArrowDown}{PageDown}{Home}');
      expect(component.value()).toBe(0);
    });

    it('keeps one map when vertical: Arrow Up adds and Arrow Down takes', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.orientation.set('vertical');
        host.value.set(50);
      });
      byId(element, 'before').focus();
      await userEvent.tab();

      await userEvent.keyboard('{ArrowUp}');
      expect(component.value()).toBe(51);
      await userEvent.keyboard('{ArrowRight}');
      expect(component.value()).toBe(52);
      await userEvent.keyboard('{ArrowDown}');
      expect(component.value()).toBe(51);
      await userEvent.keyboard('{ArrowLeft}');
      expect(component.value()).toBe(50);
      await userEvent.keyboard('{PageUp}');
      expect(component.value()).toBe(60);
      await userEvent.keyboard('{End}');
      expect(component.value()).toBe(100);
    });

    it('snaps to the grid from min when min is not 0', async () => {
      const { component, element } = await renderAs(KeyboardHost, (host) => {
        host.min.set(12);
        host.max.set(32);
        host.step.set(4);
        host.value.set(16);
      });
      byId(element, 'before').focus();
      await userEvent.tab();

      await userEvent.keyboard('{ArrowRight}');
      expect(component.value()).toBe(20);
      await userEvent.keyboard('{PageUp}');
      expect(component.value()).toBe(32);
      await userEvent.keyboard('{Home}');
      expect(component.value()).toBe(12);
    });

    it('skips a disabled slider on Tab and Shift+Tab, and its keys change nothing', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(false);
      expect(await at(1).isFocused()).toBe(true);
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));

      const skipped = find(element, '[aria-label="Skipped"]', HTMLElement);
      expect(skipped.hasAttribute('tabindex')).toBe(false);
      expect(press(skipped, 'ArrowRight')).toBe(false);
      expect(press(skipped, 'End')).toBe(false);
      expect(await at(0).getValue()).toBe(30);
    });

    it('keeps focus on the handle, and the page where it is, through every key', async () => {
      // Optimus's `updateValue` focuses the handle, and a Page key that nothing cancels scrolls the
      // page. Neither may happen: the focus stays, and the page does not move.
      const { element } = await renderAs(KeyboardHost);
      byId(element, 'before').focus();
      await userEvent.tab();
      const handle = element.querySelectorAll<HTMLElement>('[role="slider"]')[1];
      expect(document.activeElement).toBe(handle);
      expect(document.documentElement.scrollHeight).toBeGreaterThan(window.innerHeight + 1000);
      const top = window.scrollY;

      for (const key of ['PageDown', 'PageUp', 'End', 'Home', 'ArrowDown', 'ArrowRight']) {
        await userEvent.keyboard(`{${key}}`);
        expect(document.activeElement).toBe(handle);
        expect(window.scrollY).toBe(top);
      }
    });

    it('moves the value once per key and never writes a null in between', async () => {
      const { component, element } = await render();
      component.log.length = 0;
      byId(element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(handleOf(element));

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}{PageUp}{Home}{End}');

      expect(component.log).toEqual([41, 42, 41, 51, 0, 100]);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('moves the rendered handle with each key, not only the model', async () => {
      const { element } = await render();
      byId(element, 'before').focus();
      await userEvent.tab();
      await expectPlace(element, 40);

      await userEvent.keyboard('{PageUp}');
      await expectPlace(element, 50);
      await userEvent.keyboard('{End}');
      await expectPlace(element, 100);
      await userEvent.keyboard('{Home}');
      await expectPlace(element, 0);
      expect(handleOf(element).getAttribute('aria-valuenow')).toBe('0');
    });

    it('starts from min when the value is null: a key writes a number', async () => {
      const { component, element } = await render((host) => {
        host.min.set(20);
        host.value.set(null);
      });
      byId(element, 'before').focus();
      await userEvent.tab();

      await userEvent.keyboard('{ArrowRight}');

      expect(component.value()).toBe(21);
      await expectPlace(element, 21, 20);
    });

    it('goes to min on Home from null, writing the number it showed', async () => {
      const { component, element } = await render((host) => {
        host.min.set(20);
        host.value.set(null);
      });
      byId(element, 'before').focus();
      await userEvent.tab();

      await userEvent.keyboard('{Home}');

      expect(component.value()).toBe(20);
    });

    it('draws the family focus ring round the handle after a key press', async () => {
      const { element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(handleOf(element));
      const ring = getComputedStyle(handleOf(element));

      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');
      expect(ring.borderTopLeftRadius).toBe('50%');
    });

    it('is moved by a harness: steps, pages and the ends, each by its key', async () => {
      const { fixture, component } = await render();
      const slider = await harnessOf(fixture);

      await slider.stepUp(3);
      expect(component.value()).toBe(43);
      await slider.stepDown();
      expect(component.value()).toBe(42);
      await slider.pageUp(2);
      expect(component.value()).toBe(62);
      await slider.pageDown();
      expect(component.value()).toBe(52);
      await slider.toMax();
      expect(component.value()).toBe(100);
      await slider.toMin();
      expect(component.value()).toBe(0);
      await expect.poll(() => slider.getValue()).toBe(0);
    });
  });

  describe('dragging and clicking', () => {
    /** Drags the handle to `fraction` of the way along the horizontal track. */
    async function dragTo(element: HTMLElement, fraction: number): Promise<void> {
      const track = trackOf(element).getBoundingClientRect();
      await userEvent.pointer([
        { target: handleOf(element), keys: '[MouseLeft>]' },
        { coords: { x: track.left + fraction * track.width, y: track.top + track.height / 2 } },
        { keys: '[/MouseLeft]' },
      ]);
    }

    it('drags the handle: the value and the rendered handle follow, without a null or a scroll', async () => {
      const { component, element } = await render((host) => {
        host.tall.set(true);
      });
      component.log.length = 0;
      const top = window.scrollY;

      await dragTo(element, 0.8);

      await expect.poll(() => component.value()).toBeGreaterThanOrEqual(79);
      expect(component.value()).toBeLessThanOrEqual(81);
      await expectPlace(element, component.value() ?? 0);
      expect(component.log.every((value) => value !== null)).toBe(true);
      expect([...component.log].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(component.log);
      expect(document.activeElement).toBe(handleOf(element));
      expect(window.scrollY).toBe(top);
    });

    it('drags to both ends of the track and no further', async () => {
      const { component, element } = await render();

      await dragTo(element, 1.5);
      await expect.poll(() => component.value()).toBe(100);
      await dragTo(element, -0.5);
      await expect.poll(() => component.value()).toBe(0);
      await expectPlace(element, 0);
    });

    it('snaps a drag to step', async () => {
      const { component, element } = await render((host) => {
        host.step.set(10);
        host.value.set(0);
      });

      await dragTo(element, 0.47);

      await expect.poll(() => component.value()).toBe(40);
      expect((component.value() ?? 1) % 10).toBe(0);
    });

    it('jumps to where the track is clicked', async () => {
      const { component, element } = await render();
      const track = trackOf(element).getBoundingClientRect();

      await userEvent.pointer({
        target: trackOf(element),
        coords: { x: track.width * 0.75, y: track.height / 2 },
        keys: '[MouseLeft]',
      });

      await expect.poll(() => component.value()).toBeGreaterThanOrEqual(74);
      expect(component.value()).toBeLessThanOrEqual(76);
    });

    it('ignores a press and a drag while disabled: Optimus turns pointer events off', async () => {
      const { component, element } = await render((host) => {
        host.disabled.set(true);
      });
      expect(getComputedStyle(trackOf(element)).pointerEvents).toBe('none');
      const track = trackOf(element).getBoundingClientRect();

      // Optimus's own guards, reached by events a pointer could not send.
      handleOf(element).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: track.left + track.width * 0.9, bubbles: true }),
      );
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);
    });
  });

  describe('inputs and outputs', () => {
    it('value is two-way: the handle follows it, and a key writes it back', async () => {
      const { fixture, component, element } = await render();
      const slider = await harnessOf(fixture);
      expect(await slider.getValue()).toBe(40);
      await expectPlace(element, 40);

      component.value.set(75);
      await fixture.whenStable();
      await expect.poll(() => slider.getValue()).toBe(75);
      await expectPlace(element, 75);

      await slider.stepDown();
      expect(component.value()).toBe(74);
      await expect.poll(() => slider.getValue()).toBe(74);
    });

    it('fills the range up to the handle', async () => {
      const { fixture, component, element } = await render();

      await expect
        .poll(
          () =>
            rangeOf(element).getBoundingClientRect().width /
            trackOf(element).getBoundingClientRect().width,
        )
        .toBeCloseTo(0.4, 1);

      component.value.set(90);
      await fixture.whenStable();
      await expect
        .poll(
          () =>
            rangeOf(element).getBoundingClientRect().width /
            trackOf(element).getBoundingClientRect().width,
        )
        .toBeCloseTo(0.9, 1);
    });

    it('valueChange fires once per change, with the new value', async () => {
      const { fixture, component } = await render();
      const slider = await harnessOf(fixture);

      component.value.set(60);
      await fixture.whenStable();
      expect(component.log).toEqual([]);

      await slider.stepUp();
      await slider.stepUp();
      await slider.pageDown();

      expect(component.log).toEqual([61, 62, 52]);
    });

    it('min and max are 0 and 100 by default, and the app’s own when set', async () => {
      const { fixture, component } = await render();
      const slider = await harnessOf(fixture);
      expect(await slider.getMin()).toBe(0);
      expect(await slider.getMax()).toBe(100);

      component.min.set(12);
      component.max.set(32);
      component.value.set(16);
      await fixture.whenStable();

      await expect.poll(() => slider.getMin()).toBe(12);
      expect(await slider.getMax()).toBe(32);
    });

    it('places the handle on the app’s own range', async () => {
      const { element } = await render((host) => {
        host.min.set(12);
        host.max.set(32);
        host.value.set(16);
      });

      await expectPlace(element, 16, 12, 32);
    });

    it('moves the handle when max changes under a value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(100);
      });
      await expectPlace(element, 100);

      component.max.set(200);
      await fixture.whenStable();

      await expectPlace(element, 100, 0, 200);
    });

    it('moves the handle when min changes under a value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(50);
      });

      component.min.set(40);
      await fixture.whenStable();

      await expectPlace(element, 50, 40, 100);
    });

    it('falls back to 0 and 100 when min and max are set back to undefined', async () => {
      const { fixture, component } = await render((host) => {
        host.min.set(12);
        host.max.set(32);
      });
      const slider = await harnessOf(fixture);
      await expect.poll(() => slider.getMin()).toBe(12);

      component.min.set(undefined);
      component.max.set(undefined);
      await fixture.whenStable();

      await expect.poll(() => slider.getMin()).toBe(0);
      expect(await slider.getMax()).toBe(100);
    });

    it('reads step from a static attribute, and moves by it', async () => {
      const { fixture } = await renderAs(AttributeHost);
      const slider = await harnessOf(fixture);

      await slider.stepUp();

      await expect.poll(() => slider.getValue()).toBe(55);
    });

    it('orientation reaches the handle, and a vertical handle moves along the vertical axis', async () => {
      const { fixture, component, element } = await render();
      const slider = await harnessOf(fixture);
      expect(await slider.getOrientation()).toBe('horizontal');
      const flat = handleOf(element).getBoundingClientRect();

      component.orientation.set('vertical');
      await fixture.whenStable();
      await expect.poll(() => slider.getOrientation()).toBe('vertical');
      await expect.poll(() => trackOf(element).classList.contains('p-slider-vertical')).toBe(true);
      const at40 = handleOf(element).getBoundingClientRect();
      await slider.toMax();
      await expect
        .poll(() => handleOf(element).getBoundingClientRect().top)
        .toBeLessThan(at40.top - 50);
      const top = handleOf(element).getBoundingClientRect();
      await slider.toMin();
      await expect
        .poll(() => handleOf(element).getBoundingClientRect().top)
        .toBeGreaterThan(at40.top + 50);

      // The handle moves along the vertical axis only: its x never changes.
      expect(top.left).toBe(at40.left);
      expect(handleOf(element).getBoundingClientRect().left).toBe(at40.left);
      expect(flat.top).not.toBe(at40.top);
      expect(top.width).toBe(24);
      await expectPlace(element, 0);
    });

    it('a horizontal handle moves along the horizontal axis only', async () => {
      const { fixture, element } = await render();
      const slider = await harnessOf(fixture);
      const before = handleOf(element).getBoundingClientRect();

      await slider.toMax();

      await expect
        .poll(() => handleOf(element).getBoundingClientRect().left)
        .toBeGreaterThan(before.left + 50);
      expect(handleOf(element).getBoundingClientRect().top).toBe(before.top);
    });

    it('disabled takes the handle out of the Tab order and ignores clicks, and a form can disable it', async () => {
      const { fixture, component, element } = await render();
      const slider = await harnessOf(fixture);
      expect(await slider.isDisabled()).toBe(false);
      expect(handleOf(element).getAttribute('tabindex')).toBe('0');

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => slider.isDisabled()).toBe(true);
      expect(handleOf(element).hasAttribute('tabindex')).toBe(false);
      await slider.stepUp();
      await slider.toMax();
      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);

      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => slider.isDisabled()).toBe(false);
      await expect.poll(() => handleOf(element).getAttribute('tabindex')).toBe('0');
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(0).isDisabled()).toBe(true);
    });

    it('invalid reaches the handle as aria-invalid and turns only its ring invalid', async () => {
      const { fixture, component, element } = await render();
      const slider = await harnessOf(fixture);
      expect(await slider.isInvalid()).toBe(false);
      const track = getComputedStyle(trackOf(element));
      const clean = [track.backgroundColor, track.outlineStyle, track.borderTopStyle];
      const handle = getComputedStyle(handleOf(element));
      const cleanHandle = [handle.backgroundColor, handle.outlineStyle, handle.borderTopStyle];

      component.invalid.set(true);
      await fixture.whenStable();
      await expect.poll(() => slider.isInvalid()).toBe(true);

      const invalid = getComputedStyle(trackOf(element));
      expect([invalid.backgroundColor, invalid.outlineStyle, invalid.borderTopStyle]).toEqual(
        clean,
      );
      // The preset's `aria-invalid` rule: the ring takes `--wj-form-field-invalid-border-color`.
      await expect
        .poll(() => getComputedStyle(handleOf(element)).backgroundColor)
        .toBe('rgb(220, 38, 38)');
      const now = getComputedStyle(handleOf(element));
      expect([now.outlineStyle, now.borderTopStyle]).toEqual(cleanHandle.slice(1));

      component.invalid.set(false);
      await fixture.whenStable();
      await expect.poll(() => slider.isInvalid()).toBe(false);
    });
  });

  describe('null shows min (FR-32)', () => {
    it.each([0, 20])('with min %i: the handle is at min, the model stays null', async (min) => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(min);
        host.value.set(null);
      });
      const slider = await harnessOf(fixture);

      expect(await slider.getValue()).toBe(min);
      await expectPlace(element, 0);
      expect(component.value()).toBeNull();
      expect(component.log).toEqual([]);
    });

    it('draws a null exactly as the value min', async () => {
      const empty = await render((host) => {
        host.min.set(20);
        host.value.set(null);
      });
      await expectPlace(empty.element, 20, 20);
      const nullBox = handleOf(empty.element).getBoundingClientRect();
      const nullRange = rangeOf(empty.element).getBoundingClientRect().width;
      TestBed.resetTestingModule();

      const atMin = await render((host) => {
        host.min.set(20);
        host.value.set(20);
      });

      expect(handleOf(atMin.element).getBoundingClientRect().left).toBe(nullBox.left);
      expect(rangeOf(atMin.element).getBoundingClientRect().width).toBe(nullRange);
      expect(nullRange).toBe(0);
    });

    it('moves a null to min when min changes, and keeps it null', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(null);
      });
      const slider = await harnessOf(fixture);
      expect(await slider.getValue()).toBe(0);

      component.min.set(30);
      await fixture.whenStable();

      await expect.poll(() => slider.getValue()).toBe(30);
      expect(component.value()).toBeNull();
    });

    it('shows min again when the model goes back to null', async () => {
      const { fixture, component, element } = await render((host) => {
        host.min.set(20);
        host.value.set(70);
      });
      const slider = await harnessOf(fixture);
      await expectPlace(element, 70, 20);

      component.value.set(null);
      await fixture.whenStable();

      await expect.poll(() => slider.getValue()).toBe(20);
      await expectPlace(element, 20, 20);
    });
  });

  describe('pt', () => {
    it('reaches the root, range and handle parts, and the routed attributes win over it', async () => {
      const { element } = await render((host) => {
        host.pt.set({
          root: { 'data-probe': 'root' },
          range: { 'data-probe': 'range' },
          handle: { 'data-probe': 'handle', 'aria-invalid': 'false', 'aria-disabled': 'false' },
        });
        host.invalid.set(true);
        host.disabled.set(true);
      });

      expect(trackOf(element).getAttribute('data-probe')).toBe('root');
      expect(rangeOf(element).getAttribute('data-probe')).toBe('range');
      expect(handleOf(element).getAttribute('data-probe')).toBe('handle');
      expect(handleOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(handleOf(element).getAttribute('aria-disabled')).toBe('true');
    });

    it('lands the routed handle attributes after a move, a disable, an invalid and a pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({ handle: { 'data-probe': 'one' } });
        host.invalid.set(true);
      });
      const handle = handleOf(element);
      expect(handle.getAttribute('data-probe')).toBe('one');
      expect(handle.getAttribute('aria-invalid')).toBe('true');

      await (await harnessOf(fixture)).stepUp();
      await fixture.whenStable();
      expect(handle.getAttribute('role')).toBe('slider');
      expect(handle.getAttribute('data-probe')).toBe('one');
      expect(handle.getAttribute('aria-invalid')).toBe('true');

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => handle.getAttribute('aria-disabled')).toBe('true');
      expect(handle.getAttribute('data-probe')).toBe('one');

      component.pt.set({ handle: { 'data-probe': 'two' } });
      await fixture.whenStable();
      await expect.poll(() => handle.getAttribute('data-probe')).toBe('two');
      expect(handle.getAttribute('aria-disabled')).toBe('true');
      expect(handle.getAttribute('aria-invalid')).toBe('true');

      component.invalid.set(false);
      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => handle.getAttribute('aria-disabled')).toBeNull();
      expect(handle.getAttribute('aria-invalid')).toBeNull();
      expect(handle.getAttribute('data-probe')).toBe('two');
    });

    it('takes the function form of pt, and routes over it too', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ handle: { 'data-probe': 'fn', 'aria-invalid': 'false' } }));
        host.invalid.set(true);
      });

      expect(handleOf(element).getAttribute('data-probe')).toBe('fn');
      expect(handleOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('keeps a consumer’s own id on the handle when no id is routed, and loses to the field’s', async () => {
      const bare = await renderAs(NamelessHost);
      expect(handleOf(bare.element).id).toBe('consumer');
      TestBed.resetTestingModule();

      const { element } = await render((host) => {
        host.inField.set(true);
        host.pt.set({ handle: { id: 'consumer' } });
      });
      expect(handleOf(element).id).toMatch(/^wj-slider-\d+$/);
    });

    it('never routes aria-valuenow: Optimus keeps it current', async () => {
      const { fixture, element } = await render();
      const slider = await harnessOf(fixture);

      await slider.pageUp();

      await expect.poll(() => handleOf(element).getAttribute('aria-valuenow')).toBe('50');
      expect(handleOf(element).getAttribute('aria-valuemin')).toBe('0');
      expect(handleOf(element).getAttribute('aria-valuemax')).toBe('100');
    });
  });

  describe('the look', () => {
    it('draws a 24 px handle with a 20 px face, in a 3 px track', async () => {
      const { element } = await render();
      const handle = handleOf(element).getBoundingClientRect();
      const face = getComputedStyle(handleOf(element), '::before');

      expect(handle.width).toBe(24);
      expect(handle.height).toBe(24);
      expect(face.width).toBe('20px');
      expect(face.height).toBe('20px');
      expect(trackOf(element).getBoundingClientRect().height).toBe(3);
    });

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('draws the track and the handle’s ring in surface.500, the face and the range as the preset says', async () => {
        const { element } = await render(undefined, scheme);

        expect(getComputedStyle(trackOf(element)).backgroundColor).toBe(LOOK[scheme].ring);
        expect(getComputedStyle(handleOf(element)).backgroundColor).toBe(LOOK[scheme].ring);
        expect(getComputedStyle(handleOf(element), '::before').backgroundColor).toBe(
          LOOK[scheme].face,
        );
        expect(getComputedStyle(rangeOf(element)).backgroundColor).toBe(LOOK[scheme].range);
      });

      it('darkens the ring under the pointer to the form-field hover step, and takes no pointer while disabled', async () => {
        const { fixture, component, element } = await render(undefined, scheme);
        const ring = (): string => getComputedStyle(handleOf(element)).backgroundColor;

        await userEvent.hover(handleOf(element));
        await expect.poll(ring).toBe(LOOK[scheme].hover);

        await userEvent.hover(byId(element, 'after'));
        await expect.poll(ring).toBe(LOOK[scheme].ring);

        component.disabled.set(true);
        await fixture.whenStable();
        // Optimus's hover rule is `:not(.p-disabled)`, and a disabled slider takes no pointer.
        await expect.poll(() => getComputedStyle(trackOf(element)).pointerEvents).toBe('none');
      });
    });

    it('dims a disabled slider to 0.6 and keeps the handle position', async () => {
      const { element } = await render((host) => {
        host.disabled.set(true);
      });

      expect(getComputedStyle(trackOf(element)).opacity).toBe('0.6');
      await expectPlace(element, 40);
    });
  });

  describe('the host box', () => {
    it('is a block that holds the track and the whole handle: 24 px tall, 12 px in at each side', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const box = host.getBoundingClientRect();
      const track = trackOf(element).getBoundingClientRect();

      expect(getComputedStyle(host).display).toBe('block');
      expect(box.height).toBe(24);
      expect(track.left - box.left).toBe(12);
      expect(box.right - track.right).toBe(12);
      expect(track.top - box.top).toBe(10.5);
    });

    it('keeps the handle inside the host at min and at max', async () => {
      const { fixture, element } = await render();
      const slider = await harnessOf(fixture);
      const box = hostOf(element).getBoundingClientRect();

      await slider.toMax();
      await expectPlace(element, 100);
      const high = handleOf(element).getBoundingClientRect();
      await slider.toMin();
      await expectPlace(element, 0);
      const low = handleOf(element).getBoundingClientRect();

      for (const handle of [low, high]) {
        expect(handle.left).toBeGreaterThanOrEqual(box.left);
        expect(handle.right).toBeLessThanOrEqual(box.right);
        expect(handle.top).toBeGreaterThanOrEqual(box.top);
        expect(handle.bottom).toBeLessThanOrEqual(box.bottom);
      }
      expect(low.left).toBe(box.left);
      expect(high.right).toBe(box.right);
    });

    it('fills its column', async () => {
      const { element } = await render();

      expect(hostOf(element).getBoundingClientRect().width).toBe(384);
    });

    it('is a vertical track in the host’s own height, with the room swapped, and keeps the handle inside', async () => {
      const { fixture, element } = await render((host) => {
        host.orientation.set('vertical');
      });
      const slider = await harnessOf(fixture);
      await expect.poll(() => trackOf(element).classList.contains('p-slider-vertical')).toBe(true);
      const host = hostOf(element);
      const style = getComputedStyle(host);

      expect(host.getBoundingClientRect().height).toBe(192);
      await expect.poll(() => trackOf(element).getBoundingClientRect().height).toBe(168);
      expect(trackOf(element).getBoundingClientRect().width).toBe(3);
      expect(style.paddingTop).toBe('12px');
      expect(style.paddingBottom).toBe('12px');
      expect(style.paddingLeft).toBe('10.5px');
      const box = host.getBoundingClientRect();
      for (const move of [() => slider.toMax(), () => slider.toMin()]) {
        await move();
        const handle = handleOf(element).getBoundingClientRect();
        expect(handle.top).toBeGreaterThanOrEqual(box.top);
        expect(handle.bottom).toBeLessThanOrEqual(box.bottom);
        expect(handle.left).toBeGreaterThanOrEqual(box.left);
      }
    });

    it('keeps its handle clear of the hint above it and the error below it in a field', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Applies to the reader only.');
        host.error.set('Set a maximum price.');
        host.value.set(100);
      });
      const handle = handleOf(element).getBoundingClientRect();
      const hint = find(element, '.wj-field-hint', HTMLElement).getBoundingClientRect();
      const error = find(element, '.wj-field-error', HTMLElement).getBoundingClientRect();
      const field = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(hint.bottom).toBeLessThanOrEqual(handle.top);
      expect(handle.bottom).toBeLessThanOrEqual(error.top);
      expect(handle.left).toBeGreaterThanOrEqual(field.left);
      expect(handle.right).toBeLessThanOrEqual(field.right);
    });
  });

  describe('the forms APIs', () => {
    describe('ngModel', () => {
      it('writes the value in, and the value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const slider = await harnessOf(fixture);
        await expect.poll(() => slider.getValue()).toBe(30);

        await slider.stepUp(5);
        await fixture.whenStable();
        expect(component.value()).toBe(35);

        component.value.set(null);
        await fixture.whenStable();
        await expect.poll(() => slider.getValue()).toBe(0);
      });

      it('disables the slider, and is touched only once focus leaves it', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const slider = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await slider.focus();
        await slider.stepUp();
        expect(component.model().touched).toBe(false);
        await slider.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        await expect.poll(() => slider.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows the initial value, writes the value out, and marks it dirty only for the user', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const slider = await harnessOf(fixture);
        await expect.poll(() => slider.getValue()).toBe(40);
        await expectPlace(element, 40);
        expect(component.control.dirty).toBe(false);

        await slider.stepUp(2);
        expect(component.control.value).toBe(42);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(80);
        await expect.poll(() => slider.getValue()).toBe(80);
        await expectPlace(element, 80);
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(10);

        expect(component.control.dirty).toBe(false);
      });

      it('keeps the control’s value null while the handle shows min', async () => {
        const { fixture, component } = await renderAs(ReactiveHost, (host) => {
          host.control.setValue(null);
          host.min.set(20);
        });
        const slider = await harnessOf(fixture);

        await expect.poll(() => slider.getValue()).toBe(20);
        expect(component.control.value).toBeNull();
        expect(component.control.dirty).toBe(false);

        component.control.setValue(60);
        await expect.poll(() => slider.getValue()).toBe(60);
        component.control.setValue(null);
        await expect.poll(() => slider.getValue()).toBe(20);
        expect(component.control.value).toBeNull();

        await slider.stepUp();
        expect(component.control.value).toBe(21);
      });

      it('disables the slider, and marks the control touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const slider = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await slider.focus();
        await slider.pageUp();
        expect(component.control.touched).toBe(false);
        await slider.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        await expect.poll(() => slider.isDisabled()).toBe(true);
        component.control.enable();
        await expect.poll(() => slider.isDisabled()).toBe(false);
      });

      it('marks the control touched when focus tabs away to the next element, and not on a key or a drag inside', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const slider = await harnessOf(fixture);
        byId(element, 'before').focus();

        await userEvent.tab();
        await expect.poll(() => slider.isFocused()).toBe(true);
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
        expect(component.value().price).toBe(34);
        await expect.poll(() => at(1).getValue()).toBe(34);

        component.model.price().value.set(70);
        await fixture.whenStable();
        await expect.poll(() => at(1).getValue()).toBe(70);
      });

      it('pushes the schema’s min and max into the slider, over the defaults', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);

        await expect.poll(() => at(0).getMin()).toBe(12);
        expect(await at(0).getMax()).toBe(32);
        expect(await at(1).getMin()).toBe(0);
        expect(await at(1).getMax()).toBe(100);
        // The form's value is null, and the handle shows the pushed min.
        expect(component.value().size).toBeNull();
        expect(await at(0).getValue()).toBe(12);
        const handle = element.querySelectorAll<HTMLElement>('[role="slider"]')[0];
        const track = element.querySelectorAll<HTMLElement>('.p-slider')[0];
        expect(handle?.getBoundingClientRect().left).toBe(
          (track?.getBoundingClientRect().left ?? 0) - 12,
        );
      });

      it('moves from the pushed min with a key, and writes the number', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => at(0).getMin()).toBe(12);

        await at(0).stepUp(3);
        await fixture.whenStable();

        expect(component.value().size).toBe(15);
        await at(0).toMax();
        await fixture.whenStable();
        expect(component.value().size).toBe(32);
        await at(0).toMin();
        await fixture.whenStable();
        expect(component.value().size).toBe(12);
        expect(component.model.size().invalid()).toBe(false);
      });

      it('reports a value below the pushed min as the form’s error, which no key can cause', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => at(0).getMin()).toBe(12);

        component.model.size().value.set(5);
        await fixture.whenStable();

        expect(component.model.size().invalid()).toBe(true);
        await at(0).stepDown(3);
        await fixture.whenStable();
        expect(component.value().size).toBe(12);
        expect(component.model.size().invalid()).toBe(false);
      });

      it('disables the slider from the form, and marks the field touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(component.model.price().touched()).toBe(false);

        await at(1).focus();
        expect(component.model.price().touched()).toBe(false);
        await at(1).blur();
        expect(component.model.price().touched()).toBe(true);

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
      const slider = await harnessOf(fixture);
      const { labelledBy } = await slider.getAriaAttributes();
      const label = element.querySelector(`#${labelledBy ?? 'none'}`);

      expect(handleOf(element).getAttribute('role')).toBe('slider');
      expect(label?.tagName).toBe('SPAN');
      expect(label?.textContent).toBe('Text size');
      expect(await slider.getId()).toMatch(/^wj-slider-\d+$/);
    });

    it('lets ariaLabelledBy win over the field’s label', async () => {
      const { element } = await renderAs(OwnLabelHost);

      expect(handleOf(element).getAttribute('aria-labelledby')).toBe('mine');
    });

    it('merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);

      expect((await at(1).getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await (await fieldOf(fixture)).getHint()).toBe('Hint');
    });

    it('describes the handle with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Applies to the reader only.');
      });
      const slider = await harnessOf(fixture);
      expect((await slider.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Set a maximum price.');
      await fixture.whenStable();
      expect((await slider.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await slider.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const slider = await harnessOf(fixture);
      expect(await slider.isInvalid()).toBe(false);

      component.error.set('Set a maximum price.');
      await fixture.whenStable();
      expect(await slider.isInvalid()).toBe(true);

      component.error.set('');
      await fixture.whenStable();
      expect(await slider.isInvalid()).toBe(false);
    });

    it('moves focus to the handle when the label is clicked, as the field does for a control `<label for>` cannot name', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const slider = await harnessOf(fixture);
      expect(await slider.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await slider.isFocused()).toBe(true);
      expect(component.value()).toBe(40);
      expect(component.log).toEqual([]);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const slider = (await allHarnessesOf(fixture))(2);

      expect(await slider.getId()).toBe('');
      expect((await slider.getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s ariaDescribedBy on the handle', async () => {
      const { fixture } = await renderAs(OwnIdsHost);

      expect((await (await allHarnessesOf(fixture))(0).getAriaAttributes()).describedBy).toBe(
        'note',
      );
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const slider = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await slider.isInvalid()).toBe(true);
    });

    it('is a slider named by a visible text through ariaLabelledBy', async () => {
      const { fixture, element } = await render();
      const slider = await harnessOf(fixture);

      expect(handleOf(element).getAttribute('role')).toBe('slider');
      expect((await slider.getAriaAttributes()).labelledBy).toBe('name');
      expect(byId(element, 'name').textContent).toBe('Volume');
    });

    it('has no name of its own when none is given', async () => {
      const { element } = await renderAs(NamelessHost);
      const handle = handleOf(element);

      expect(handle.hasAttribute('aria-label')).toBe(false);
      expect(handle.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets ariaLabel, ariaLabelledBy, ariaDescribedBy and inputId on the handle', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      const slider = await harnessOf(fixture);
      expect(await slider.getAriaAttributes()).toEqual({
        label: 'Volume',
        labelledBy: null,
        describedBy: null,
      });
      expect(await slider.getId()).toBe('');

      component.ariaLabel.set('Gain');
      component.ariaLabelledBy.set('some-id');
      component.ariaDescribedBy.set('other-id');
      component.inputId.set('my-slider');
      await fixture.whenStable();

      expect(await slider.getAriaAttributes()).toEqual({
        label: 'Gain',
        labelledBy: 'some-id',
        describedBy: 'other-id',
      });
      expect(await slider.getId()).toBe('my-slider');
      expect(hostOf(element).hasAttribute('id')).toBe(false);
    });

    it('marks aria-disabled only while disabled, and always names the value range', async () => {
      const { fixture, component, element } = await render();
      const slider = await harnessOf(fixture);
      expect(handleOf(element).hasAttribute('aria-disabled')).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => slider.isDisabled()).toBe(true);
      expect(handleOf(element).getAttribute('aria-valuenow')).toBe('40');
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const slider = await harnessOf(fixture);

      expect((await slider.getAriaAttributes()).label).toBeNull();
      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        'WJ0003: wj-slider: aria-label is set on the host, where it is not forwarded to the ' +
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
      const slider = await harnessOf(fixture);

      expect(await slider.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(await slider.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('motion', () => {
    it('runs the handle’s transition on Optimus’s 0.2s, and at 0s under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      await expect
        .poll(() => getComputedStyle(handleOf(normal.element)).transitionDuration)
        .toContain('0.2s');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(() => getComputedStyle(handleOf(reduced.element)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
      expect(getComputedStyle(handleOf(reduced.element), '::before').transitionDuration).toMatch(
        /^(0s)(, 0s)*$/,
      );
    });

    it('never glides the handle: no transition names its position', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const { element } = await render();

      const properties = getComputedStyle(handleOf(element)).transitionProperty;

      expect(properties).not.toMatch(/all|inset|left|right|bottom|top|margin|transform/);
    });
  });

  describe('harness', () => {
    it('is found by its ariaLabel, as text or a pattern', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const plain = await loader.getAllHarnesses(WjSliderHarness.with({ ariaLabel: 'Plain' }));
      const bare = await loader.getAllHarnesses(WjSliderHarness.with({ ariaLabel: /^Ba/ }));
      const all = await loader.getAllHarnesses(WjSliderHarness);

      expect(plain).toHaveLength(1);
      expect(await plain[0]?.getValue()).toBe(10);
      expect(bare).toHaveLength(1);
      expect(all).toHaveLength(3);
    });

    it('reads the value, the range and the orientation', async () => {
      const { fixture } = await render((host) => {
        host.min.set(12);
        host.max.set(32);
        host.value.set(20);
      });
      const slider = await harnessOf(fixture);

      await expect.poll(() => slider.getMin()).toBe(12);
      expect(await slider.getMax()).toBe(32);
      expect(await slider.getValue()).toBe(20);
      expect(await slider.getOrientation()).toBe('horizontal');
    });

    it('reads the focus state', async () => {
      const { fixture, element } = await render();
      const slider = await harnessOf(fixture);
      expect(await slider.isFocused()).toBe(false);

      await slider.focus();
      expect(await slider.isFocused()).toBe(true);
      expect(document.activeElement).toBe(handleOf(element));

      await slider.blur();
      expect(await slider.isFocused()).toBe(false);
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
