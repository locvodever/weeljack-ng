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
import { WjRating, type WjRatingPt } from 'weeljack-ng/rating';
import { WjRatingHarness } from 'weeljack-ng/rating/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** The star colours as the preset sets them (`text.muted.color`, `primary.color`). */
const LOOK = {
  light: {
    off: 'rgb(113, 113, 122)', // surface.500 (text.muted.color)
    on: 'rgb(9, 9, 11)', // surface.950 (primary.color)
  },
  dark: {
    off: 'rgb(161, 161, 170)', // surface.400 (text.muted.color)
    on: 'rgb(250, 250, 250)', // surface.50 (primary.color)
  },
};

/** A consumer's template: one rating, bare (named by a visible text) or inside a field. */
@Component({
  selector: 'wj-rating-host',
  imports: [WjField, WjRating],
  template: `
    <button type="button" id="before">Before</button>
    @if (inField()) {
      <wj-field label="Delivery experience" [hint]="hint()" [error]="error()">
        <wj-rating
          [(value)]="value"
          (valueChange)="log.push($event)"
          [stars]="stars()"
          [readonly]="readonly()"
          [disabled]="disabled()"
          [required]="required()"
          [invalid]="invalid()"
          [pt]="pt()"
        />
      </wj-field>
    } @else {
      <span id="name">Rate this recipe</span>
      <wj-rating
        ariaLabelledBy="name"
        [(value)]="value"
        (valueChange)="log.push($event)"
        [stars]="stars()"
        [readonly]="readonly()"
        [disabled]="disabled()"
        [required]="required()"
        [invalid]="invalid()"
        [pt]="pt()"
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
    wj-field {
      justify-self: stretch;
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<number | null>(null);
  readonly stars = signal(5);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly invalid = signal(false);
  readonly pt = signal<WjRatingPt>(undefined);
  readonly log: (number | null)[] = [];
}

/** The ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-rating-aria-host',
  imports: [WjRating],
  template: `
    <wj-rating
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly ariaLabel = signal<string | undefined>('Recipe');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-rating-aria-on-host-host',
  imports: [WjRating],
  template: `<wj-rating aria-label="Recipe" />`,
})
class AriaOnHostHost {}

/** A rating with no name of its own, and a consumer id and role on its root. */
@Component({
  selector: 'wj-rating-nameless-host',
  imports: [WjRating],
  template: `<wj-rating [pt]="pt" />`,
})
class NamelessHost {
  readonly pt: WjRatingPt = { root: { id: 'consumer', role: 'group' } };
}

/** A plain rating, a field around one with a description of its own, and a bare one. */
@Component({
  selector: 'wj-rating-own-ids-host',
  imports: [WjRating, WjField],
  template: `
    <p id="note">Note</p>
    <wj-rating ariaLabel="Plain" ariaDescribedBy="note" />
    <wj-field label="Quality" hint="Hint" error="Error">
      <wj-rating ariaDescribedBy="note" />
    </wj-field>
    <wj-rating ariaLabel="Bare" />
  `,
})
class OwnIdsHost {}

/** A field around a rating that names itself by a text of its own. */
@Component({
  selector: 'wj-rating-own-label-host',
  imports: [WjRating, WjField],
  template: `
    <span id="mine">Mine</span>
    <wj-field label="Quality">
      <wj-rating ariaLabelledBy="mine" />
    </wj-field>
  `,
})
class OwnLabelHost {}

/** `ngModel` inside a field, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-rating-ngmodel-host',
  imports: [WjField, WjRating, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Quality">
      <wj-rating [(ngModel)]="value" [disabled]="disabled()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<number | null>(3);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-rating-reactive-host',
  imports: [WjField, WjRating, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="Quality">
      <wj-rating [formControl]="control" [readonly]="readonly()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(4);
  readonly readonly = signal(false);
}

/** Signal forms with `[formField]` inside a field: a required rating and a disableable one. */
@Component({
  selector: 'wj-rating-signal-host',
  imports: [WjField, WjRating, FormField],
  template: `
    <form novalidate>
      <button type="button" id="before">Before</button>
      <wj-field label="Product quality">
        <wj-rating [formField]="model.quality" />
      </wj-field>
      <wj-field label="Delivery experience">
        <wj-rating [formField]="model.delivery" />
      </wj-field>
      <button type="button" id="after">After</button>
    </form>
  `,
})
class SignalHost {
  readonly off = signal(false);
  readonly value = signal<{ quality: number | null; delivery: number | null }>({
    quality: null,
    delivery: 2,
  });
  readonly model = form(this.value, (path) => {
    required(path.quality, { message: 'Rate the product to continue.' });
    disabledRule(path.delivery, { when: () => this.off() });
  });
}

/** Two ratings between two native buttons, the first disabled, for the keyboard spec. */
@Component({
  selector: 'wj-rating-keyboard-host',
  imports: [WjRating],
  template: `
    <button type="button" id="before">Before</button>
    <wj-rating ariaLabel="Skipped" disabled [value]="3" />
    <wj-rating ariaLabel="Keys" [(value)]="value" [readonly]="readonly()" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly value = signal<number | null>(null);
  readonly readonly = signal(false);
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
  await expect.poll(() => starOf(element, 0).getBoundingClientRect().height).toBeGreaterThan(20);
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

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-rating', HTMLElement);
/** Optimus's root: the group the wrapper gives its role to. */
const groupOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="radiogroup"]', HTMLElement);
const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The `index`th star's box of the first rating (its click target), 0-based. */
function starOf(element: HTMLElement, index: number): HTMLElement {
  const star = element.querySelectorAll<HTMLElement>('.p-rating-option')[index];
  if (star === undefined) {
    throw new Error(`star ${String(index)} is missing`);
  }
  return star;
}

/** The `index`th star's native radio of the first rating, 0-based. */
function radioOf(element: HTMLElement, index: number): HTMLInputElement {
  const radio = starOf(element, index).querySelector('input');
  if (radio === null) {
    throw new Error(`radio ${String(index)} is missing`);
  }
  return radio;
}

/** The rating harnesses of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjRatingHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjRatingHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-rating at index ${String(index)}`);
    }
    return found;
  };
}

async function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjRatingHarness> {
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
  ['empty', () => undefined],
  [
    'rated',
    (host) => {
      host.value.set(3);
    },
  ],
  [
    'readonly',
    (host) => {
      host.value.set(4);
      host.readonly.set(true);
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set(3);
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
      host.hint.set('1 star is poor, 5 is great.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Rate the product to continue.');
    },
  ],
];

describe('WjRating', () => {
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

  describe('keyboard (FR-28)', () => {
    /** The `index`th `wj-rating` of the page. */
    const ratingAt = (element: HTMLElement, index: number): HTMLElement => {
      const found = element.querySelectorAll<HTMLElement>('wj-rating')[index];
      if (found === undefined) throw new Error(`no wj-rating at ${String(index)}`);
      return found;
    };
    const radiosIn = (rating: HTMLElement): HTMLInputElement[] => [
      ...rating.querySelectorAll('input'),
    ];

    it('Tab enters at the first star of an empty rating, and Tab again leaves it', async () => {
      const { element } = await renderAs(KeyboardHost);
      byId(element, 'before').focus();

      await userEvent.tab();

      await expect.poll(() => document.activeElement).toBe(radiosIn(ratingAt(element, 1))[0]);
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('Tab enters at the checked star of a rated rating', async () => {
      const { element } = await renderAs(KeyboardHost, (host) => {
        host.value.set(4);
      });
      byId(element, 'before').focus();

      await userEvent.tab();

      await expect.poll(() => document.activeElement).toBe(radiosIn(ratingAt(element, 1))[3]);
    });

    it('Arrow Right and Down pick the next star, Arrow Left and Up the previous (native radios, not the PRD’s Up)', async () => {
      const { fixture, component } = await renderAs(KeyboardHost, (host) => {
        host.value.set(2);
      });
      const keys = (await allHarnessesOf(fixture))(1);
      await keys.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(component.value()).toBe(3);
      await userEvent.keyboard('{ArrowDown}');
      expect(component.value()).toBe(4);
      await userEvent.keyboard('{ArrowLeft}');
      expect(component.value()).toBe(3);
      await userEvent.keyboard('{ArrowUp}');
      expect(component.value()).toBe(2);
      await expect.poll(() => keys.getValue()).toBe(2);
    });

    it('wraps at both ends, as native radios do', async () => {
      const { fixture, component } = await renderAs(KeyboardHost, (host) => {
        host.value.set(1);
      });
      const keys = (await allHarnessesOf(fixture))(1);
      await keys.focus();

      await userEvent.keyboard('{ArrowLeft}');
      expect(component.value()).toBe(5);
      await userEvent.keyboard('{ArrowRight}');
      expect(component.value()).toBe(1);
      await expect.poll(() => keys.getValue()).toBe(1);
    });

    it('moves the rating with an arrow instead of clearing it: one emission per key, never a null in between', async () => {
      // Optimus's focus handler marks the focused star, a pick of the focused star clears, and a
      // key on a radio clicks it (the click reaches the star's own click handler) and then fires
      // `change`. Without the wrapper's capture-phase click guard every arrow emitted `null`
      // before the new value.
      const { fixture, component } = await render((host) => {
        host.value.set(2);
      });
      const rating = await harnessOf(fixture);
      await rating.focus();
      component.log.length = 0;

      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowLeft}');

      expect(component.log).toEqual([3, 4, 3]);
      expect(component.value()).toBe(3);
      await expect.poll(() => rating.getValue()).toBe(3);
    });

    it('Space picks the star Tab entered an empty rating at, once', async () => {
      const { fixture, component, element } = await render();
      const rating = await harnessOf(fixture);
      byId(element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => rating.isFocused()).toBe(true);

      await userEvent.keyboard(' ');

      expect(component.log).toEqual([1]);
      await expect.poll(() => rating.getValue()).toBe(1);
    });

    it('Space on the picked star changes nothing: no key clears a rating', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(3);
      });
      const rating = await harnessOf(fixture);
      byId(element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => rating.isFocused()).toBe(true);

      await userEvent.keyboard(' ');
      await userEvent.keyboard('{Enter}');

      expect(component.value()).toBe(3);
      expect(component.log).toEqual([]);
      expect(await rating.getValue()).toBe(3);
      expect(getComputedStyle(starOf(element, 2)).outlineStyle).toBe('solid');
    });

    it('still clears on a click of the current star after keys were used', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(2);
      });
      const rating = await harnessOf(fixture);
      await rating.focus();
      await userEvent.keyboard('{ArrowRight}');
      component.log.length = 0;

      await rating.rate(3);

      expect(component.value()).toBeNull();
      expect(component.log).toEqual([null]);
      await expect.poll(() => rating.getValue()).toBeNull();
    });

    it('with readonly the arrows move focus, and never the value or the checked radio', async () => {
      const { fixture, component, element } = await renderAs(KeyboardHost, (host) => {
        host.value.set(2);
        host.readonly.set(true);
      });
      const keys = (await allHarnessesOf(fixture))(1);
      byId(element, 'before').focus();
      await userEvent.tab();
      await expect.poll(() => keys.isFocused()).toBe(true);
      const radios = radiosIn(ratingAt(element, 1));
      expect(document.activeElement).toBe(radios[1]);

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(radios[2]);
      expect(component.value()).toBe(2);
      expect(await keys.getValue()).toBe(2);
      expect(radios.map((radio) => radio.checked)).toEqual([false, true, false, false, false]);
    });

    it('draws the family ring on the focused star of a read-only rating too', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(2);
        host.readonly.set(true);
      });
      const rating = await harnessOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      await expect.poll(() => rating.isFocused()).toBe(true);
      await expect.poll(() => getComputedStyle(starOf(element, 1)).outlineStyle).toBe('solid');

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => getComputedStyle(starOf(element, 2)).outlineStyle).toBe('solid');
      expect(getComputedStyle(starOf(element, 1)).outlineStyle).toBe('none');
    });

    it('skips a disabled rating on Tab and Shift+Tab', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const at = await allHarnessesOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await at(0).isFocused()).toBe(false);
      expect(await at(1).isFocused()).toBe(true);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
      expect(await at(0).getValue()).toBe(3);
    });

    it('draws the family focus ring round the focused star after a key press, and none after a click', async () => {
      const { fixture, element } = await render();
      const rating = await harnessOf(fixture);
      byId(element, 'before').focus();

      await userEvent.tab();
      await expect.poll(() => rating.isFocused()).toBe(true);
      const ring = getComputedStyle(starOf(element, 0));
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');
      expect(getComputedStyle(starOf(element, 1)).outlineStyle).toBe('none');

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => getComputedStyle(starOf(element, 1)).outlineStyle).toBe('solid');
      expect(getComputedStyle(starOf(element, 0)).outlineStyle).toBe('none');

      await userEvent.click(byId(element, 'after'));
      await expect.poll(() => getComputedStyle(starOf(element, 1)).outlineStyle).toBe('none');
    });
  });

  describe('inputs and outputs', () => {
    it('value is two-way: the stars follow it, and a click writes it back', async () => {
      const { fixture, component } = await render();
      const rating = await harnessOf(fixture);
      expect(await rating.getValue()).toBeNull();

      component.value.set(4);
      await fixture.whenStable();
      await expect.poll(() => rating.getValue()).toBe(4);

      await rating.rate(2);
      expect(component.value()).toBe(2);
      await expect.poll(() => rating.getValue()).toBe(2);
    });

    it('valueChange fires once per click, with the new value, and null for a click that clears', async () => {
      const { fixture, component } = await render();
      const rating = await harnessOf(fixture);

      component.value.set(3);
      await fixture.whenStable();
      expect(component.log).toEqual([]);

      await rating.rate(5);
      await rating.rate(5);
      await rating.rate(1);

      expect(component.log).toEqual([5, null, 1]);
      await expect.poll(() => rating.getValue()).toBe(1);
    });

    it('clear clicks the current star, and does nothing while no star is picked', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(3);
      });
      const rating = await harnessOf(fixture);

      await rating.clear();
      expect(component.value()).toBeNull();
      await expect.poll(() => rating.getValue()).toBeNull();

      await rating.clear();
      expect(component.log).toEqual([null]);
    });

    it('has five stars by default, and as many as stars says when it is created', async () => {
      const five = await render();
      expect(await (await harnessOf(five.fixture)).getStarCount()).toBe(5);
      TestBed.resetTestingModule();

      const three = await render((host) => {
        host.stars.set(3);
      });
      expect(await (await harnessOf(three.fixture)).getStarCount()).toBe(3);
      TestBed.resetTestingModule();

      const ten = await render((host) => {
        host.stars.set(10);
      });
      expect(await (await harnessOf(ten.fixture)).getStarCount()).toBe(10);
    });

    it('reads stars when the rating is created: a later change is not shown (an Optimus limit)', async () => {
      const { fixture, component } = await render();
      const rating = await harnessOf(fixture);

      component.stars.set(3);
      await fixture.whenStable();

      expect(await rating.getStarCount()).toBe(5);
    });

    it('labels each star from the translation: English, Vietnamese, and a partial override', async () => {
      const en = await render();
      expect(await (await harnessOf(en.fixture)).getStarLabels()).toEqual([
        '1 star',
        '2 stars',
        '3 stars',
        '4 stars',
        '5 stars',
      ]);
      TestBed.resetTestingModule();

      const vi = await renderAs(Host, () => undefined, 'light', vietnamese);
      expect((await (await harnessOf(vi.fixture)).getStarLabels()).slice(0, 2)).toEqual([
        '1 sao',
        '2 sao',
      ]);
      TestBed.resetTestingModule();

      const partial = await renderAs(Host, () => undefined, 'light', { aria: { star: 'One' } });
      expect((await (await harnessOf(partial.fixture)).getStarLabels()).slice(0, 2)).toEqual([
        'One',
        '2 stars',
      ]);
    });

    it('disabled stops a click and reaches every radio', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(3);
      });
      const rating = await harnessOf(fixture);
      expect(await rating.isDisabled()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      await expect.poll(() => rating.isDisabled()).toBe(true);
      await rating.rate(5);

      expect(component.value()).toBe(3);
      expect(component.log).toEqual([]);

      component.disabled.set(false);
      await fixture.whenStable();
      await expect.poll(() => rating.isDisabled()).toBe(false);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(0).isDisabled()).toBe(true);
    });

    it('readonly keeps the value and the look, and a click changes nothing', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(4);
      });
      const rating = await harnessOf(fixture);
      expect(await rating.isReadonly()).toBe(false);

      component.readonly.set(true);
      await fixture.whenStable();
      await expect.poll(() => rating.isReadonly()).toBe(true);
      await rating.rate(1);
      await rating.rate(4);

      expect(component.value()).toBe(4);
      expect(component.log).toEqual([]);
      expect(await rating.getValue()).toBe(4);
      expect(getComputedStyle(starOf(element, 0)).cursor).toBe('not-allowed');

      component.readonly.set(false);
      await fixture.whenStable();
      await expect.poll(() => rating.isReadonly()).toBe(false);
      await rating.rate(1);
      expect(component.value()).toBe(1);
    });

    it('required and invalid reach the group as aria-required and aria-invalid', async () => {
      const { fixture, component } = await render();
      const rating = await harnessOf(fixture);
      expect(await rating.isRequired()).toBe(false);
      expect(await rating.isInvalid()).toBe(false);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      await expect.poll(() => rating.isRequired()).toBe(true);
      expect(await rating.isInvalid()).toBe(true);

      component.required.set(false);
      component.invalid.set(false);
      await fixture.whenStable();
      await expect.poll(() => rating.isRequired()).toBe(false);
      expect(await rating.isInvalid()).toBe(false);
    });
  });

  describe('pt', () => {
    it('reaches the root, option, icon and hidden-input parts, and the routed attributes win over it', async () => {
      const { element } = await render((host) => {
        host.value.set(2);
        host.pt.set({
          root: { 'data-probe': 'yes', role: 'group', 'aria-invalid': 'false' },
          option: { 'data-option': 'a' },
          onIcon: { 'data-on': 'b' },
          offIcon: { 'data-off': 'c' },
          hiddenOptionInput: { 'data-input': 'd' },
        });
        host.invalid.set(true);
      });

      expect(groupOf(element).getAttribute('data-probe')).toBe('yes');
      expect(groupOf(element).getAttribute('role')).toBe('radiogroup');
      expect(groupOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(starOf(element, 0).getAttribute('data-option')).toBe('a');
      expect(element.querySelector('.p-rating-on-icon')?.getAttribute('data-on')).toBe('b');
      expect(element.querySelector('.p-rating-off-icon')?.getAttribute('data-off')).toBe('c');
      expect(radioOf(element, 0).getAttribute('data-input')).toBe('d');
    });

    it('lands the routed root attributes after a rating, a disable, an invalid and a pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({ root: { 'data-probe': 'one' } });
        host.invalid.set(true);
        host.required.set(true);
      });
      const group = groupOf(element);
      expect(group.getAttribute('data-probe')).toBe('one');
      expect(group.getAttribute('aria-invalid')).toBe('true');
      expect(group.getAttribute('aria-required')).toBe('true');

      await (await harnessOf(fixture)).rate(3);
      await fixture.whenStable();
      expect(group.getAttribute('role')).toBe('radiogroup');
      expect(group.getAttribute('data-probe')).toBe('one');
      expect(group.getAttribute('aria-invalid')).toBe('true');

      component.disabled.set(true);
      component.readonly.set(true);
      await fixture.whenStable();
      await expect.poll(() => group.getAttribute('aria-readonly')).toBe('true');
      expect(group.getAttribute('data-probe')).toBe('one');

      component.pt.set({ root: { 'data-probe': 'two' } });
      await fixture.whenStable();
      await expect.poll(() => group.getAttribute('data-probe')).toBe('two');
      expect(group.getAttribute('aria-readonly')).toBe('true');
      expect(group.getAttribute('aria-invalid')).toBe('true');

      component.invalid.set(false);
      component.required.set(false);
      component.readonly.set(false);
      await fixture.whenStable();
      await expect.poll(() => group.getAttribute('aria-readonly')).toBeNull();
      expect(group.getAttribute('aria-invalid')).toBeNull();
      expect(group.getAttribute('aria-required')).toBeNull();
      expect(group.getAttribute('role')).toBe('radiogroup');
      expect(group.getAttribute('data-probe')).toBe('two');
    });

    it('takes the function form of pt, and routes over it too', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn', 'aria-invalid': 'false' } }));
        host.invalid.set(true);
      });

      expect(groupOf(element).getAttribute('data-probe')).toBe('fn');
      expect(groupOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('keeps a consumer’s own id on the root when no id is routed, and loses to the field’s', async () => {
      const bare = await renderAs(NamelessHost);
      expect(groupOf(bare.element).id).toBe('consumer');
      expect(groupOf(bare.element).getAttribute('role')).toBe('radiogroup');
      TestBed.resetTestingModule();

      const { element } = await render((host) => {
        host.inField.set(true);
        host.pt.set({ root: { id: 'consumer' } });
      });
      expect(groupOf(element).id).toMatch(/^wj-rating-\d+$/);
    });
  });

  describe('the stars and the look', () => {
    it('draws 24 px stars in 24 px hit boxes, 4 px apart, in a row that never wraps', async () => {
      const { element } = await render();
      const icon = find(element, '.p-rating-icon', SVGElement).getBoundingClientRect();
      const first = starOf(element, 0).getBoundingClientRect();
      const second = starOf(element, 1).getBoundingClientRect();

      expect(icon.width).toBe(24);
      expect(icon.height).toBe(24);
      expect(first.width).toBeGreaterThanOrEqual(24);
      expect(first.height).toBeGreaterThanOrEqual(24);
      expect(second.left - first.right).toBe(4);
      expect(second.top).toBe(first.top);
      expect(groupOf(element).getBoundingClientRect().width).toBe(136);
    });

    it('keeps the row on one line, ten stars wide, in a narrow container', async () => {
      const { element } = await render((host) => {
        host.stars.set(10);
      });
      hostOf(element).style.maxInlineSize = '6rem';

      expect(groupOf(element).getBoundingClientRect().width).toBe(276);
      expect(starOf(element, 9).getBoundingClientRect().top).toBe(
        starOf(element, 0).getBoundingClientRect().top,
      );
    });

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('draws off stars in the muted text colour and on stars in the primary colour', async () => {
        const { element } = await render((host) => {
          host.value.set(2);
        }, scheme);

        expect(getComputedStyle(find(element, '.p-rating-off-icon', SVGElement)).color).toBe(
          LOOK[scheme].off,
        );
        expect(getComputedStyle(find(element, '.p-rating-on-icon', SVGElement)).color).toBe(
          LOOK[scheme].on,
        );
      });

      it('turns only the hovered star to the primary colour, and not while read-only', async () => {
        const { fixture, component, element } = await render(undefined, scheme);
        const off = (index: number): string =>
          getComputedStyle(starOf(element, index).querySelector('svg') ?? element).color;

        await userEvent.hover(starOf(element, 2));
        await expect.poll(() => off(2)).toBe(LOOK[scheme].on);
        expect(off(1)).toBe(LOOK[scheme].off);
        expect(off(0)).toBe(LOOK[scheme].off);

        await userEvent.hover(byId(element, 'after'));
        await expect.poll(() => off(2)).toBe(LOOK[scheme].off);

        component.readonly.set(true);
        await fixture.whenStable();
        await userEvent.hover(starOf(element, 2));
        expect(off(2)).toBe(LOOK[scheme].off);
        await userEvent.hover(byId(element, 'after'));
      });
    });

    it('turns the unpicked stars invalid, keeps the picked ones primary and draws no outline', async () => {
      const { element } = await render((host) => {
        host.value.set(2);
        host.invalid.set(true);
      });

      // The preset's `aria-invalid` rule (`--wj-form-field-invalid-border-color`, #dc2626 in light).
      await expect
        .poll(() => getComputedStyle(find(element, '.p-rating-off-icon', SVGElement)).color)
        .toBe('rgb(220, 38, 38)');
      expect(getComputedStyle(find(element, '.p-rating-on-icon', SVGElement)).color).toBe(
        LOOK.light.on,
      );
      expect(getComputedStyle(groupOf(element)).outlineStyle).toBe('none');
      expect(getComputedStyle(groupOf(element)).borderTopStyle).toBe('none');
    });

    it('dims a disabled rating to 0.6 and keeps the filled stars', async () => {
      const { element } = await render((host) => {
        host.value.set(3);
        host.disabled.set(true);
      });

      expect(getComputedStyle(groupOf(element)).opacity).toBe('0.6');
      expect(element.querySelectorAll('.p-rating-on-icon')).toHaveLength(3);
    });
  });

  describe('the host box', () => {
    it('is an inline-flex host that sizes to its star row', async () => {
      const { element } = await renderAs(AriaHost);
      const host = hostOf(element).getBoundingClientRect();
      const group = groupOf(element).getBoundingClientRect();

      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(host.width).toBe(group.width);
      expect(host.height).toBe(group.height);
    });

    it('keeps its star row at the start of its field, and the rest of the row empty', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const field = find(element, 'wj-field', HTMLElement).getBoundingClientRect();
      const group = groupOf(element).getBoundingClientRect();

      expect(field.width).toBeGreaterThan(300);
      expect(group.width).toBe(136);
      expect(Math.abs(group.left - field.left)).toBeLessThan(1);
    });
  });

  describe('the forms APIs', () => {
    describe('ngModel', () => {
      it('writes the value in, and the value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const rating = await harnessOf(fixture);
        await expect.poll(() => rating.getValue()).toBe(3);

        await rating.rate(5);
        await fixture.whenStable();
        expect(component.value()).toBe(5);

        component.value.set(null);
        await fixture.whenStable();
        await expect.poll(() => rating.getValue()).toBeNull();
      });

      it('disables the rating, and is touched only once focus leaves it', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const rating = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await rating.focus();
        expect(component.model().touched).toBe(false);
        await rating.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        await expect.poll(() => rating.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows the initial value, writes the value out, and marks it dirty only for the user', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const rating = await harnessOf(fixture);
        await expect.poll(() => rating.getValue()).toBe(4);
        expect(component.control.dirty).toBe(false);

        await rating.rate(2);
        expect(component.control.value).toBe(2);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(5);
        await expect.poll(() => rating.getValue()).toBe(5);
        component.control.setValue(null);
        await expect.poll(() => rating.getValue()).toBeNull();
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(1);

        expect(component.control.dirty).toBe(false);
      });

      it('shows a value the form wrote back after the user cleared it', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const rating = await harnessOf(fixture);
        await expect.poll(() => rating.getValue()).toBe(4);

        await rating.clear();
        expect(component.control.value).toBeNull();
        component.control.setValue(4);

        await expect.poll(() => rating.getValue()).toBe(4);
      });

      it('disables the rating, and marks the control touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const rating = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await rating.focus();
        expect(component.control.touched).toBe(false);
        await rating.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        await expect.poll(() => rating.isDisabled()).toBe(true);
        component.control.enable();
        await expect.poll(() => rating.isDisabled()).toBe(false);
      });

      it('marks the control touched when focus tabs away to the next element', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const rating = await harnessOf(fixture);
        byId(element, 'before').focus();

        await userEvent.tab();
        await expect.poll(() => rating.isFocused()).toBe(true);
        expect(component.control.touched).toBe(false);
        await userEvent.tab();

        expect(document.activeElement).toBe(byId(element, 'after'));
        expect(component.control.touched).toBe(true);
      });

      it('does not mark the control touched while focus moves between stars', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost, (host) => {
          host.readonly.set(true);
        });
        const rating = await harnessOf(fixture);
        byId(element, 'before').focus();
        await userEvent.tab();
        await expect.poll(() => rating.isFocused()).toBe(true);

        await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');

        expect(await rating.isFocused()).toBe(true);
        expect(component.control.touched).toBe(false);
        await userEvent.tab();
        expect(component.control.touched).toBe(true);
      });

      it('is touched by a pick, as Optimus does, even while focus is still inside', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const rating = await harnessOf(fixture);

        await rating.rate(2);

        expect(await rating.isFocused()).toBe(true);
        expect(component.control.touched).toBe(true);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        await expect.poll(() => at(1).getValue()).toBe(2);
        expect(await at(0).getValue()).toBeNull();

        await at(0).rate(4);
        await fixture.whenStable();
        expect(component.value().quality).toBe(4);
        await expect.poll(() => at(0).getValue()).toBe(4);

        component.model.delivery().value.set(5);
        await fixture.whenStable();
        await expect.poll(() => at(1).getValue()).toBe(5);
      });

      it('disables the rating from the form, and marks the field touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(component.model.quality().touched()).toBe(false);

        await at(0).focus();
        expect(component.model.quality().touched()).toBe(false);
        await at(0).blur();
        expect(component.model.quality().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        await expect.poll(() => at(1).isDisabled()).toBe(true);
      });

      it('shows the field error once touched, and clears it when a star is picked', async () => {
        const { fixture } = await renderAs(SignalHost);
        const at = await allHarnessesOf(fixture);
        expect(await at(0).isInvalid()).toBe(false);

        await at(0).focus();
        await at(0).blur();
        await fixture.whenStable();
        await expect.poll(() => at(0).isInvalid()).toBe(true);
        expect(await (await fieldOf(fixture)).getError()).toBe('Rate the product to continue.');

        await at(0).rate(3);
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

    it('is a radiogroup named by the field’s label span, and takes a generated id', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const rating = await harnessOf(fixture);
      const { labelledBy } = await rating.getAriaAttributes();
      const label = element.querySelector(`#${labelledBy ?? 'none'}`);

      expect(groupOf(element).getAttribute('role')).toBe('radiogroup');
      expect(label?.tagName).toBe('SPAN');
      expect(label?.textContent).toBe('Delivery experience');
      expect(await rating.getId()).toMatch(/^wj-rating-\d+$/);
    });

    it('lets ariaLabelledBy win over the field’s label', async () => {
      const { element } = await renderAs(OwnLabelHost);

      expect(groupOf(element).getAttribute('aria-labelledby')).toBe('mine');
    });

    it('does not move focus when the label is clicked, because the group is not focusable', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
      });
      const rating = await harnessOf(fixture);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await rating.isFocused()).toBe(false);
      expect(component.value()).toBeNull();
      expect(component.log).toEqual([]);
    });

    it('merges ariaDescribedBy before the field’s ids', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const at = await allHarnessesOf(fixture);

      expect((await at(1).getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await (await fieldOf(fixture)).getHint()).toBe('Hint');
    });

    it('describes the group with the hint, then the error, while they show', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('1 star is poor, 5 is great.');
      });
      const rating = await harnessOf(fixture);
      expect((await rating.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Rate the product to continue.');
      await fixture.whenStable();
      expect((await rating.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await rating.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, not by its own invalid input', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const rating = await harnessOf(fixture);
      expect(await rating.isInvalid()).toBe(false);

      component.error.set('Rate the product to continue.');
      await fixture.whenStable();
      expect(await rating.isInvalid()).toBe(true);

      component.error.set('');
      await fixture.whenStable();
      expect(await rating.isInvalid()).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id and no aria-describedby of its own', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const rating = (await allHarnessesOf(fixture))(2);

      expect(await rating.getId()).toBe('');
      expect((await rating.getAriaAttributes()).describedBy).toBeNull();
    });

    it('keeps the consumer’s ariaDescribedBy on the group', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const rating = (await allHarnessesOf(fixture))(0);

      expect((await rating.getAriaAttributes()).describedBy).toBe('note');
    });

    it('follows its own invalid input for aria-invalid', async () => {
      const { fixture, component } = await render();
      const rating = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();

      expect(await rating.isInvalid()).toBe(true);
    });

    it('is a radiogroup named by a visible text through ariaLabelledBy', async () => {
      const { fixture, element } = await render();
      const rating = await harnessOf(fixture);

      expect(groupOf(element).getAttribute('role')).toBe('radiogroup');
      expect((await rating.getAriaAttributes()).labelledBy).toBe('name');
      expect(byId(element, 'name').textContent).toBe('Rate this recipe');
    });

    it('has no name of its own when none is given', async () => {
      const { element } = await renderAs(NamelessHost);
      const group = groupOf(element);

      expect(group.hasAttribute('aria-label')).toBe(false);
      expect(group.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets ariaLabel, ariaLabelledBy and ariaDescribedBy on the group, and there is no inputId', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      const rating = await harnessOf(fixture);
      expect(await rating.getAriaAttributes()).toEqual({
        label: 'Recipe',
        labelledBy: null,
        describedBy: null,
      });

      component.ariaLabel.set('Dish');
      component.ariaLabelledBy.set('some-id');
      component.ariaDescribedBy.set('other-id');
      await fixture.whenStable();

      expect(await rating.getAriaAttributes()).toEqual({
        label: 'Dish',
        labelledBy: 'some-id',
        describedBy: 'other-id',
      });
      expect(await rating.getId()).toBe('');
      expect(hostOf(element).hasAttribute('id')).toBe(false);
    });

    it('marks aria-required only while required, and aria-readonly only while readonly', async () => {
      const { fixture, component } = await render();
      const rating = await harnessOf(fixture);
      expect(await rating.isRequired()).toBe(false);
      expect(await rating.isReadonly()).toBe(false);

      component.required.set(true);
      await fixture.whenStable();
      await expect.poll(() => rating.isRequired()).toBe(true);
      expect(await rating.isReadonly()).toBe(false);

      component.readonly.set(true);
      await fixture.whenStable();
      await expect.poll(() => rating.isReadonly()).toBe(true);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const rating = await harnessOf(fixture);

      expect((await rating.getAriaAttributes()).label).toBeNull();
      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        'WJ0003: wj-rating: aria-label is set on the host, where it is not forwarded to the ' +
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
    it('renders an HTML payload on the three ARIA string inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const rating = await harnessOf(fixture);

      expect(await rating.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('motion', () => {
    it('runs the star transition on Optimus’s 0.2s, and at 0s under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const normal = await render();
      await expect
        .poll(
          () =>
            getComputedStyle(find(normal.element, '.p-rating-icon', SVGElement)).transitionDuration,
        )
        .toContain('0.2s');
      TestBed.resetTestingModule();

      await emulateReducedMotion(true);
      const reduced = await render();
      await expect
        .poll(
          () =>
            getComputedStyle(find(reduced.element, '.p-rating-icon', SVGElement))
              .transitionDuration,
        )
        .toMatch(/^(0s)(, 0s)*$/);
      await expect
        .poll(() => getComputedStyle(starOf(reduced.element, 0)).transitionDuration)
        .toMatch(/^(0s)(, 0s)*$/);
    });
  });

  describe('harness', () => {
    it('is found by the value it holds', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const at = await allHarnessesOf(fixture);
      await at(0).rate(4);

      const four = await loader.getAllHarnesses(WjRatingHarness.with({ value: 4 }));
      const none = await loader.getAllHarnesses(WjRatingHarness.with({ value: null }));

      expect(four).toHaveLength(1);
      expect(none).toHaveLength(2);
    });

    it('reads the focus state, on the checked star', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set(3);
      });
      const rating = await harnessOf(fixture);
      expect(await rating.isFocused()).toBe(false);

      await rating.focus();
      expect(await rating.isFocused()).toBe(true);
      expect(document.activeElement).toBe(radioOf(element, 2));

      await rating.blur();
      expect(await rating.isFocused()).toBe(false);
    });

    it('throws for a star the rating does not have', async () => {
      const { fixture } = await render();
      const rating = await harnessOf(fixture);

      await expect(rating.rate(6)).rejects.toThrow('The rating has no star 6.');
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
