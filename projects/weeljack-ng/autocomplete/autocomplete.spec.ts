/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { FilterService, OverlayService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjOption } from 'weeljack-ng';
import * as autocompleteApi from 'weeljack-ng/autocomplete';
import {
  WjAutoComplete,
  type WjAutoCompletePt,
  type WjAutoCompleteSize,
} from 'weeljack-ng/autocomplete';
import { WjAutoCompleteHarness } from 'weeljack-ng/autocomplete/testing';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/**
 * Parks the pointer in the viewport's bottom-right corner before a border read. The pointer is
 * page-wide in browser mode, so an earlier test can leave it over the control, and Optimus's hover
 * border outranks the invalid one. The host renders only the control, so a throwaway fixed target
 * stands in for a neutral element; the pointer stays there after it is removed.
 */
async function pointerAway(): Promise<void> {
  const park = document.createElement('div');
  park.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 8px; height: 8px';
  document.body.append(park);
  try {
    await userEvent.hover(park);
  } finally {
    park.remove();
  }
}

/** Five countries; the third is disabled, so keyboard navigation has something to skip. */
const COUNTRIES: WjOption<string>[] = [
  { label: 'Argentina', value: 'ar' },
  { label: 'Australia', value: 'au' },
  { label: 'Austria', value: 'at', disabled: true },
  { label: 'Brazil', value: 'br' },
  { label: 'Canada', value: 'ca' },
];

function country(label: string): WjOption<string> {
  const found = COUNTRIES.find((option) => option.label === label);
  if (found === undefined) {
    throw new Error(`COUNTRIES has no ${label}`);
  }
  return found;
}

const ARGENTINA = country('Argentina');
const AUSTRALIA = country('Australia');
const BRAZIL = country('Brazil');

/** Forty numbered options: enough to make the list scroll. */
const LONG: WjOption<number>[] = Array.from({ length: 40 }, (_, index) => ({
  label: `Item ${String(index + 1).padStart(2, '0')}`,
  value: index + 1,
}));

/** What an app's `query` handler does: the options whose label starts with the text, new array. */
function startingWith<T>(options: WjOption<T>[], text: string): WjOption<T>[] {
  return options.filter((option) => option.label.toLowerCase().startsWith(text.toLowerCase()));
}

/** A consumer's template: one bare autocomplete, or the same one inside a field. */
@Component({
  selector: 'wj-autocomplete-host',
  imports: [WjField, WjAutoComplete],
  template: `
    @if (inField()) {
      <wj-field label="Country" [hint]="hint()" [error]="error()">
        <wj-autocomplete
          [(value)]="value"
          [suggestions]="suggestions()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [placeholder]="placeholder()"
          (query)="search($event)"
        />
      </wj-field>
    } @else {
      <wj-autocomplete
        ariaLabel="Country"
        [(value)]="value"
        [suggestions]="suggestions()"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
        [placeholder]="placeholder()"
        (query)="search($event)"
      />
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<WjOption<string> | null>(null);
  readonly suggestions = signal<WjOption<string>[]>([]);
  readonly source = signal<WjOption<string>[]>(COUNTRIES);
  /** `false` holds the answer back, so the search stays in flight. */
  readonly answering = signal(true);
  readonly pt = signal<WjAutoCompletePt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjAutoCompleteSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>(undefined);
  readonly queries: string[] = [];

  search(text: string): void {
    this.queries.push(text);
    if (this.answering()) {
      this.suggestions.set(startingWith(this.source(), text));
    }
  }
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-autocomplete-aria-host',
  imports: [WjAutoComplete],
  template: `
    <wj-autocomplete
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Country');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-autocomplete-aria-on-host-host',
  imports: [WjAutoComplete],
  template: `<wj-autocomplete aria-label="Country" />`,
})
class AriaOnHostHost {}

/** A field around an autocomplete with its own `inputId`, `ariaLabelledBy` and description. */
@Component({
  selector: 'wj-autocomplete-own-ids-host',
  imports: [WjAutoComplete, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-autocomplete ariaLabel="Plain" inputId="plain" ariaDescribedBy="note" />
    <wj-field label="Country" hint="Hint" error="Error">
      <wj-autocomplete inputId="mine" ariaLabelledBy="namer" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** Two controls inside one field: `wj-field` becomes a group, and each keeps its own id. */
@Component({
  selector: 'wj-autocomplete-pair-host',
  imports: [WjAutoComplete, WjField],
  template: `
    <wj-field label="Route">
      <wj-autocomplete ariaLabel="From" />
      <wj-autocomplete ariaLabel="To" />
    </wj-field>
  `,
})
class PairHost {}

/** `ngModel` inside a field, with the option written in. */
@Component({
  selector: 'wj-autocomplete-ngmodel-host',
  imports: [WjField, WjAutoComplete, FormsModule],
  template: `
    <wj-field label="Country">
      <wj-autocomplete
        [(ngModel)]="value"
        [suggestions]="suggestions()"
        [disabled]="disabled()"
        (query)="search($event)"
      />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly value = signal<WjOption<string> | null>(AUSTRALIA);
  readonly suggestions = signal<WjOption<string>[]>([]);
  readonly disabled = signal(false);

  search(text: string): void {
    this.suggestions.set(startingWith(COUNTRIES, text));
  }
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-autocomplete-reactive-host',
  imports: [WjField, WjAutoComplete, ReactiveFormsModule],
  template: `
    <wj-field label="Country">
      <wj-autocomplete
        [formControl]="control"
        [suggestions]="suggestions()"
        (query)="search($event)"
      />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<WjOption<string> | null>(AUSTRALIA);
  readonly suggestions = signal<WjOption<string>[]>([]);

  search(text: string): void {
    this.suggestions.set(startingWith(COUNTRIES, text));
  }
}

interface Trip {
  country: WjOption<string> | null;
  bare: WjOption<string> | null;
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-autocomplete-signal-host',
  imports: [WjField, WjAutoComplete, FormField],
  template: `
    <wj-field label="Country">
      <wj-autocomplete
        [formField]="model.country"
        [suggestions]="suggestions()"
        (query)="search($event)"
      />
    </wj-field>
    <wj-autocomplete
      ariaLabel="Bare"
      [formField]="model.bare"
      [suggestions]="suggestions()"
      (query)="search($event)"
    />
  `,
})
class SignalHost {
  readonly suggestions = signal<WjOption<string>[]>([]);
  readonly value = signal<Trip>({ country: AUSTRALIA, bare: null });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Pick one.' });
  });

  search(text: string): void {
    this.suggestions.set(startingWith(COUNTRIES, text));
  }
}

/** The option's value is an object: `T` survives the model and the suggestions. */
interface Plan {
  id: number;
  name: string;
}

const PLANS: WjOption<Plan>[] = [
  { label: 'Free', value: { id: 1, name: 'free' } },
  { label: 'Team', value: { id: 2, name: 'team' } },
];

@Component({
  selector: 'wj-autocomplete-object-host',
  imports: [WjAutoComplete],
  template: `
    <wj-autocomplete
      ariaLabel="Plan"
      [(value)]="plan"
      [suggestions]="suggestions()"
      (query)="suggestions.set(startingWith(plans, $event))"
    />
  `,
})
class ObjectHost {
  readonly plans = PLANS;
  readonly suggestions = signal<WjOption<Plan>[]>([]);
  readonly plan = signal<WjOption<Plan> | null>(PLANS[1] ?? null);
  protected readonly startingWith = startingWith;
}

/** Two controls and two native buttons for the keyboard specs; the second control is disabled. */
@Component({
  selector: 'wj-autocomplete-keyboard-host',
  imports: [WjAutoComplete],
  template: `
    <button type="button" id="before">Before</button>
    <wj-autocomplete
      ariaLabel="Country"
      placeholder="Start typing"
      [(value)]="value"
      [suggestions]="suggestions()"
      (query)="search($event)"
    />
    <wj-autocomplete ariaLabel="Disabled" disabled />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly value = signal<WjOption<string> | null>(null);
  readonly suggestions = signal<WjOption<string>[]>([]);
  readonly queries: string[] = [];

  search(text: string): void {
    this.queries.push(text);
    this.suggestions.set(startingWith(COUNTRIES, text));
  }
}

/** A long list, for PageDown and PageUp. */
@Component({
  selector: 'wj-autocomplete-long-host',
  imports: [WjAutoComplete],
  template: `
    <wj-autocomplete
      ariaLabel="Item"
      [suggestions]="suggestions()"
      (query)="suggestions.set(longFor($event))"
    />
  `,
})
class LongHost {
  readonly suggestions = signal<WjOption<number>[]>([]);
  protected longFor(text: string): WjOption<number>[] {
    return startingWith(LONG, text);
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

const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-autocomplete', HTMLElement);

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-autocomplete', HTMLElement);

const inputOf = (element: HTMLElement): HTMLInputElement =>
  find(element, '[role="combobox"]', HTMLInputElement);

const listOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="listbox"]', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjAutoCompleteHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjAutoCompleteHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjAutoCompleteHarness> {
  const all =
    await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjAutoCompleteHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-autocomplete at index ${String(index)}`);
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

/**
 * Lets Optimus's own motion run: the spec-wide `transition: none` would also stop the overlay's
 * enter and leave from ever ending. Specs that open the list call it; the afterEach removes it too.
 */
function withMotion(): void {
  document.getElementById('wj-spec-no-motion')?.remove();
}

/**
 * Focuses the input, types `text` with trusted keys, and waits for the app's answer to open the
 * list: the 300 ms debounce, the `query`, the new `suggestions` and the overlay's enter. Polls
 * the visible effect first, so no key races Optimus's timers. The pointer is parked away first:
 * Optimus focuses the row under it (`focusOnHover`), which would move the active suggestion.
 */
async function openWith(
  fixture: ComponentFixture<unknown>,
  element: HTMLElement,
  text: string,
): Promise<WjAutoCompleteHarness> {
  withMotion();
  await pointerAway();
  const autocomplete = await harnessOf(fixture);
  await autocomplete.focus();
  await userEvent.keyboard(text);
  await expect.poll(() => autocomplete.isOpen()).toBe(true);
  await overlayOpen(element);
  return autocomplete;
}

/**
 * Closes an open list and waits for its leave to end, so nothing is left open at teardown. An
 * Escape sent while the enter is still running is swallowed, so the enter ends first.
 */
async function closeList(autocomplete: WjAutoCompleteHarness, element: HTMLElement): Promise<void> {
  if (await autocomplete.isOpen()) {
    await overlayOpen(element);
  }
  await autocomplete.close();
  await expect.poll(() => autocomplete.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
}

/** The label of the option the input points at with `aria-activedescendant`, or `null`. */
function activeLabel(element: HTMLElement): string | null {
  const id = inputOf(element).getAttribute('aria-activedescendant');
  return id === null
    ? null
    : (element.querySelector(`[id="${id}"]`)?.getAttribute('aria-label') ?? null);
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const STATES: [string, (host: Host) => void][] = [
  [
    'empty with a placeholder',
    (host) => {
      host.placeholder.set('Start typing a country');
    },
  ],
  [
    'with a picked value',
    (host) => {
      host.value.set(AUSTRALIA);
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set(AUSTRALIA);
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.placeholder.set('Start typing a country');
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.value.set(AUSTRALIA);
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.value.set(AUSTRALIA);
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.placeholder.set('Start typing a country');
      host.hint.set('Start typing, then pick from the list.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.placeholder.set('Start typing a country');
      host.error.set('Pick a country from the list.');
    },
  ],
];

describe('WjAutoComplete', () => {
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

  describe('inputs and outputs', () => {
    it('value is two-way: a written option shows its label with no search, picking writes it back', async () => {
      withMotion();
      const { fixture, component, element } = await render();
      const autocomplete = await harnessOf(fixture);

      component.value.set(AUSTRALIA);
      await fixture.whenStable();
      await expect.poll(() => autocomplete.getText()).toBe('Australia');
      expect(component.queries).toEqual([]);

      await autocomplete.focus();
      await userEvent.keyboard('{Control>}a{/Control}br');
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);
      await autocomplete.selectSuggestion('Brazil');
      await fixture.whenStable();
      expect(component.value()).toBe(BRAZIL);
      await expect.poll(() => autocomplete.getText()).toBe('Brazil');
      await expect.poll(() => autocomplete.isOpen()).toBe(false);

      component.value.set(null);
      await fixture.whenStable();
      await expect.poll(() => autocomplete.getText()).toBe('');
    });

    it('query carries the typed text once, after the debounce, and a new array answers it', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'au');

      expect(component.queries).toEqual(['au']);
      expect(await autocomplete.getSuggestionLabels()).toEqual(['Australia', 'Austria']);

      component.source.set([{ label: 'Austral', value: 'x' }]);
      await userEvent.keyboard('s');
      await expect.poll(() => autocomplete.getSuggestionLabels()).toEqual(['Austral']);
      expect(component.queries).toEqual(['au', 'aus']);

      await closeList(autocomplete, element);
    });

    it('emptying the input before the debounce ends cancels the query', async () => {
      withMotion();
      const { fixture, component, element } = await render();
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();

      await userEvent.keyboard('x{Backspace}');
      await userEvent.keyboard('b');

      await expect.poll(() => component.queries).toEqual(['b']);
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);
      await closeList(autocomplete, element);
    });

    it('an empty answer shows the translation’s empty message as the list’s only row', async () => {
      const { fixture, element } = await render();
      const autocomplete = await openWith(fixture, element, 'zz');

      expect(await autocomplete.getEmptyMessage()).toBe('No results found');
      expect(await autocomplete.getSuggestionLabels()).toEqual([]);
      expect(listOf(element).querySelectorAll('[role="option"]')).toHaveLength(1);
      expect(element.querySelector('.p-autocomplete-loader')).toBeNull();

      await closeList(autocomplete, element);
    });

    it('takes the empty message and the list name from a vi override', async () => {
      const { fixture, element } = await renderAs(Host, () => undefined, 'light', {
        translation: viLocale,
      });
      const autocomplete = await openWith(fixture, element, 'zz');

      expect(await autocomplete.getEmptyMessage()).toBe(viLocale['emptySearchMessage']);
      expect(listOf(element).getAttribute('aria-label')).toBe(viLocale.aria?.listLabel);

      await closeList(autocomplete, element);
    });

    it('names the list from the English translation by default', async () => {
      const { fixture, element } = await render();
      const autocomplete = await openWith(fixture, element, 'au');

      expect(listOf(element).getAttribute('aria-label')).toBe('Option List');

      await closeList(autocomplete, element);
    });

    it('shows a spinner between the query and the answer, and drops it with the answer', async () => {
      withMotion();
      const { fixture, component, element } = await render((host) => {
        host.answering.set(false);
      });
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.keyboard('au');

      await expect.poll(() => element.querySelector('.p-autocomplete-loader')).not.toBeNull();
      const loader = find(element, '.p-autocomplete-loader', SVGElement);
      expect(loader.getAttribute('aria-hidden')).toBe('true');
      expect(component.queries).toEqual(['au']);
      expect(await autocomplete.isOpen()).toBe(false);

      component.suggestions.set(startingWith(COUNTRIES, 'au'));
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      expect(element.querySelector('.p-autocomplete-loader')).toBeNull();
      await overlayOpen(element);

      await closeList(autocomplete, element);
    });

    it('stops the spinner under reduced motion', async () => {
      await emulateReducedMotion(true);
      const { fixture, element } = await render((host) => {
        host.answering.set(false);
      });
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.keyboard('au');
      await expect.poll(() => element.querySelector('.p-autocomplete-loader')).not.toBeNull();

      expect(
        getComputedStyle(find(element, '.p-autocomplete-loader', SVGElement)).animationName,
      ).toBe('none');
    });

    it('keeps the value type of an object option and compares it deeply', async () => {
      const { fixture, component, element } = await renderAs(ObjectHost);
      const autocomplete = await harnessOf(fixture);
      expect(await autocomplete.getText()).toBe('Team');

      await openWith(fixture, element, '{Control>}a{/Control}fr');
      await autocomplete.selectSuggestion('Free');
      await fixture.whenStable();
      expect(component.plan()).toBe(PLANS[0]);
      expect(component.plan()?.value).toEqual({ id: 1, name: 'free' });

      component.plan.set({ label: 'Team', value: { id: 2, name: 'team' } });
      await fixture.whenStable();
      await expect.poll(() => autocomplete.getText()).toBe('Team');
    });

    it('a disabled suggestion is shown, announced as unavailable and cannot be picked', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'au');

      const austria = find(element, '[role="option"][aria-label="Austria"]', HTMLElement);
      expect(austria.getAttribute('aria-disabled')).toBe('true');
      // Optimus's disabled row takes no pointer events, so a mouse cannot pick it.
      expect(getComputedStyle(austria).pointerEvents).toBe('none');
      expect(
        find(element, '[role="option"][aria-label="Australia"]', HTMLElement).hasAttribute(
          'aria-disabled',
        ),
      ).toBe(false);

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeLabel(element)).toBe('Australia');
      expect(component.value()).toBeNull();

      await closeList(autocomplete, element);
    });

    it('placeholder shows while the input is empty and follows the bound value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.placeholder.set('Start typing a country');
      });
      expect(inputOf(element).getAttribute('placeholder')).toBe('Start typing a country');

      component.placeholder.set('Search');
      await fixture.whenStable();
      expect(inputOf(element).getAttribute('placeholder')).toBe('Search');
    });

    it('disabled, required and invalid reach the input', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await harnessOf(fixture);
      expect(await autocomplete.isDisabled()).toBe(false);
      expect(await autocomplete.isRequired()).toBe(false);
      expect(await autocomplete.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await autocomplete.isRequired()).toBe(true);
      expect(await autocomplete.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await autocomplete.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });
  });

  describe('pass-through', () => {
    const PARTS = ['data-root', 'data-input', 'data-overlay', 'data-list', 'data-option'] as const;
    const OBJECT_PT: WjAutoCompletePt = {
      root: { 'data-root': 'a' },
      pcInputText: { root: { 'data-input': 'b', 'aria-invalid': 'false' } },
      loader: { 'data-loader': 'c' },
      overlay: { 'data-overlay': 'd' },
      list: { 'data-list': 'e' },
      option: { 'data-option': 'f' },
      emptyMessage: { 'data-empty': 'g' },
    };

    /** How many elements carry each marker attribute. */
    const counts = (element: HTMLElement, names: readonly string[]): Record<string, number> =>
      Object.fromEntries(names.map((name) => [name, element.querySelectorAll(`[${name}]`).length]));

    it('reaches the root, the input, the overlay, the list and each option, and the routed attributes win', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
        host.invalid.set(true);
      });
      expect(counts(element, ['data-root', 'data-input'])).toEqual({
        'data-root': 1,
        'data-input': 1,
      });
      expect(inputOf(element).getAttribute('data-input')).toBe('b');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      const autocomplete = await openWith(fixture, element, 'au');
      expect(counts(element, PARTS)).toEqual({
        'data-root': 1,
        'data-input': 1,
        'data-overlay': 1,
        'data-list': 1,
        'data-option': 2,
      });

      await closeList(autocomplete, element);
    });

    it('reaches the empty-message row, and the loader while a search runs', async () => {
      withMotion();
      const { fixture, component, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
        host.answering.set(false);
      });
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.keyboard('zz');

      await expect.poll(() => element.querySelectorAll('[data-loader]').length).toBe(1);

      component.suggestions.set([]);
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);
      expect(element.querySelectorAll('[data-empty]')).toHaveLength(1);
      expect(element.querySelectorAll('[data-loader]')).toHaveLength(0);

      await closeList(autocomplete, element);
    });

    it('keeps reaching every part after the list closes and reopens, and after value, disabled, invalid and pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
      });
      const autocomplete = await openWith(fixture, element, 'au');
      await closeList(autocomplete, element);
      expect(counts(element, ['data-root', 'data-input'])).toEqual({
        'data-root': 1,
        'data-input': 1,
      });

      await userEvent.keyboard('{Control>}a{/Control}a');
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);
      expect(element.querySelectorAll('[data-list]')).toHaveLength(1);
      expect(element.querySelectorAll('[data-option]')).toHaveLength(3);
      await closeList(autocomplete, element);

      component.value.set(AUSTRALIA);
      component.invalid.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      expect(counts(element, ['data-root', 'data-input'])).toEqual({
        'data-root': 1,
        'data-input': 1,
      });
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      component.pt.set({
        root: { 'data-root': 'changed' },
        pcInputText: { root: { 'data-input': 'changed' } },
      });
      await fixture.whenStable();
      expect(rootOf(element).getAttribute('data-root')).toBe('changed');
      expect(inputOf(element).getAttribute('data-input')).toBe('changed');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
    });

    it('takes the function form, whole and per part', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(() => ({
          root: { 'data-root': 'fn' },
          pcInputText: { root: { 'data-input': 'fn' } },
          list: () => ({ 'data-list': 'fn' }),
          option: () => ({ 'data-option': 'fn' }),
        }));
      });
      expect(rootOf(element).getAttribute('data-root')).toBe('fn');
      expect(inputOf(element).getAttribute('data-input')).toBe('fn');

      const autocomplete = await openWith(fixture, element, 'au');
      expect(listOf(element).getAttribute('data-list')).toBe('fn');
      expect(element.querySelectorAll('[role="option"][data-option="fn"]')).toHaveLength(2);

      await closeList(autocomplete, element);
    });

    it('keeps a string pt as a class list on the parts the wrapper also routes into', async () => {
      const { element } = await render((host) => {
        host.pt.set({ pcInputText: { root: 'consumer-input' } });
        host.invalid.set(true);
      });

      expect(inputOf(element).classList.contains('consumer-input')).toBe(true);
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('box', () => {
    it('is an inline-flex host with the Optimus root and the input stretched to its width', async () => {
      const { element } = await render();
      hostOf(element).style.inlineSize = '320px';

      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(rootOf(element).getBoundingClientRect().width).toBe(320);
      expect(inputOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('steps the height 36 / 44 / 52 px with size, on the host, the root and the input', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const heights = (): number[] =>
        [hostOf(element), rootOf(element), inputOf(element)].map(
          (box) => box.getBoundingClientRect().height,
        );
      expect(heights()).toEqual([44, 44, 44]);

      component.size.set('small');
      await fixture.whenStable();
      expect(heights()).toEqual([36, 36, 36]);

      component.size.set('large');
      await fixture.whenStable();
      expect(heights()).toEqual([52, 52, 52]);
    });

    it('gets the input text line-height 1.5 from the root layer styles, not from the entry', async () => {
      const { element } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const style = getComputedStyle(inputOf(element));

      expect(parseFloat(style.lineHeight)).toBe(parseFloat(style.fontSize) * 1.5);
    });

    it('keeps the input and every row at least 24 by 24 px', async () => {
      const { fixture, element } = await render();
      const input = inputOf(element).getBoundingClientRect();
      expect(Math.min(input.width, input.height)).toBeGreaterThanOrEqual(24);

      const autocomplete = await openWith(fixture, element, 'a');
      const rows = Array.from(element.querySelectorAll('[role="option"]'));
      expect(rows).toHaveLength(3);
      for (const row of rows) {
        const box = row.getBoundingClientRect();
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }

      await closeList(autocomplete, element);
    });
  });

  describe('the list', () => {
    it('opens inside the host, and Optimus services stay root internals', async () => {
      const { fixture, element } = await render();
      const autocomplete = await openWith(fixture, element, 'au');

      expect(hostOf(element).contains(listOf(element))).toBe(true);
      const host = fixture.debugElement.query((node) => node.name === 'wj-autocomplete');
      expect(host.injector.get(FilterService)).toBe(TestBed.inject(FilterService));
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(autocompleteApi)).toEqual(['WjAutoComplete']);

      await closeList(autocomplete, element);
    });

    it('opens with a motion by default, and without one under reduced motion', async () => {
      const motions = async (reduce: boolean): Promise<number> => {
        await emulateReducedMotion(reduce);
        const { fixture, element } = await render();
        // Count what starts on the overlay itself: the enter. A colour transition on the input
        // would pass the default case for the wrong reason.
        let started = 0;
        const count = (event: Event): void => {
          if (event.target instanceof Element && event.target.closest('p-motion') !== null) {
            started += 1;
          }
        };
        document.addEventListener('animationstart', count, true);
        document.addEventListener('transitionrun', count, true);
        try {
          await openWith(fixture, element, 'au');
        } finally {
          document.removeEventListener('animationstart', count, true);
          document.removeEventListener('transitionrun', count, true);
        }
        TestBed.resetTestingModule();
        return started;
      };

      expect(await motions(false)).toBeGreaterThan(0);
      expect(await motions(true)).toBe(0);
    });

    it('picking a suggestion with the mouse closes the list and keeps focus on the input', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'br');

      await userEvent.click(find(element, '[role="option"][aria-label="Brazil"]', HTMLElement));
      await fixture.whenStable();

      expect(component.value()).toBe(BRAZIL);
      await expect.poll(() => autocomplete.getText()).toBe('Brazil');
      await expect.poll(() => autocomplete.isOpen()).toBe(false);
      expect(await autocomplete.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('reads the picked option as selected, and its row takes the picked state', async () => {
      withMotion();
      const { fixture, element } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.keyboard('{Control>}a{/Control}au');
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);

      expect(
        find(element, '[role="option"][aria-label="Australia"]', HTMLElement).getAttribute(
          'aria-selected',
        ),
      ).toBe('true');
      expect(
        find(element, '[role="option"][aria-label="Austria"]', HTMLElement).getAttribute(
          'aria-selected',
        ),
      ).toBe('false');

      await closeList(autocomplete, element);
    });

    it('announces the selection through its live region, not the result count', async () => {
      const { fixture, element } = await render();
      const autocomplete = await openWith(fixture, element, 'au');
      const status = find(element, '[role="status"]', HTMLElement);

      expect(status.textContent.trim()).toBe('No selected item');
      expect(listOf(element).textContent).not.toContain('results are available');

      await autocomplete.selectSuggestion('Australia');
      await expect.poll(() => autocomplete.isOpen()).toBe(false);
    });
  });

  describe('the model round trip while typing', () => {
    it('keeps the text, the caret and the open list while the app answers each query', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'a');
      expect(await autocomplete.getSuggestionLabels()).toEqual([
        'Argentina',
        'Australia',
        'Austria',
      ]);

      await userEvent.keyboard('u');
      await expect.poll(() => component.queries).toEqual(['a', 'au']);
      await expect.poll(() => autocomplete.getSuggestionLabels()).toEqual(['Australia', 'Austria']);
      expect(await autocomplete.getText()).toBe('au');
      expect(inputOf(element).selectionStart).toBe(2);
      expect(await autocomplete.isOpen()).toBe(true);

      await closeList(autocomplete, element);
    });

    it('keeps a caret placed mid-text when the answer lands', async () => {
      withMotion();
      const { fixture, component, element } = await render();
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.keyboard('aus{ArrowLeft}{ArrowLeft}');
      expect(inputOf(element).selectionStart).toBe(1);

      await expect.poll(() => component.queries).toEqual(['aus']);
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);

      expect(await autocomplete.getText()).toBe('aus');
      expect(inputOf(element).selectionStart).toBe(1);
      expect(inputOf(element).selectionEnd).toBe(1);

      await closeList(autocomplete, element);
    });

    it('writes the model back once on a pick, and keeps typing after it', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'br');

      await autocomplete.selectSuggestion('Brazil');
      await fixture.whenStable();
      expect(component.value()).toBe(BRAZIL);
      await expect.poll(() => autocomplete.getText()).toBe('Brazil');
      // Optimus resets the input when the list's leave ends, so typing waits for the list to go.
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();

      await autocomplete.focus();
      await userEvent.keyboard('{End}x');
      await expect.poll(() => component.queries.at(-1)).toBe('Brazilx');
      expect(await autocomplete.getText()).toBe('Brazilx');
      expect(component.value()).toBe(BRAZIL);

      await closeList(autocomplete, element);
    });
  });

  describe('forced selection', () => {
    it('picks the suggestion whose label matches the typed text, ignoring case, when focus leaves', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'brazil');

      await userEvent.tab();
      await fixture.whenStable();

      expect(component.value()).toBe(BRAZIL);
      await expect.poll(() => autocomplete.getText()).toBe('Brazil');
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('clears text that matches no suggestion, and the value, when focus leaves', async () => {
      withMotion();
      const { fixture, component, element } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.keyboard('{Control>}a{/Control}bra');
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);

      await userEvent.tab();

      await expect.poll(() => autocomplete.getText()).toBe('');
      await expect.poll(() => component.value()).toBeNull();
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('clears the value when the input is emptied', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const autocomplete = await harnessOf(fixture);
      await expect.poll(() => autocomplete.getText()).toBe('Australia');
      await autocomplete.focus();

      await userEvent.keyboard(`{End}${'{Backspace}'.repeat('Australia'.length)}`);

      await expect.poll(() => component.value()).toBeNull();
      expect(await autocomplete.getText()).toBe('');
    });

    it('keeps a value the form wrote when the input is focused and left untouched', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const autocomplete = await harnessOf(fixture);
      await autocomplete.focus();
      await userEvent.tab();

      expect(component.value()).toBe(AUSTRALIA);
      expect(await autocomplete.getText()).toBe('Australia');
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the option in, and the picked option out', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const autocomplete = await harnessOf(fixture);
        await expect.poll(() => autocomplete.getText()).toBe('Australia');

        await openWith(fixture, element, '{Control>}a{/Control}br');
        await autocomplete.selectSuggestion('Brazil');
        await fixture.whenStable();
        expect(component.value()).toBe(BRAZIL);

        component.value.set(ARGENTINA);
        await fixture.whenStable();
        await fixture.whenStable();
        await expect.poll(() => autocomplete.getText()).toBe('Argentina');
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const autocomplete = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await autocomplete.focus();
        await autocomplete.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await autocomplete.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive option, then writes in and out', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const autocomplete = await harnessOf(fixture);
        await expect.poll(() => autocomplete.getText()).toBe('Australia');

        await openWith(fixture, element, '{Control>}a{/Control}br');
        await autocomplete.selectSuggestion('Brazil');
        expect(component.control.value).toBe(BRAZIL);
        expect(component.control.dirty).toBe(true);

        component.control.setValue(ARGENTINA);
        await expect.poll(() => autocomplete.getText()).toBe('Argentina');
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const autocomplete = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await autocomplete.focus();
        await autocomplete.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await autocomplete.isDisabled()).toBe(true);

        component.control.enable();
        expect(await autocomplete.isDisabled()).toBe(false);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue(ARGENTINA);

        expect(component.control.dirty).toBe(false);
      });

      it('shows an empty input for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const autocomplete = await harnessOf(fixture);
        await expect.poll(() => autocomplete.getText()).toBe('Australia');

        component.control.setValue(null);

        await expect.poll(() => autocomplete.getText()).toBe('');
      });
    });

    describe('[formField]', () => {
      it('writes the option in, and the picked option out', async () => {
        withMotion();
        const { fixture, component, element } = await renderAs(SignalHost);
        const country = (await allHarnessesOf(fixture))(0);
        await expect.poll(() => country.getText()).toBe('Australia');

        await country.focus();
        await userEvent.keyboard('{Control>}a{/Control}br');
        await expect.poll(() => country.isOpen()).toBe(true);
        await overlayOpen(element);
        await country.selectSuggestion('Brazil');
        await fixture.whenStable();
        expect(component.value().country).toBe(BRAZIL);

        component.model.country().value.set(ARGENTINA);
        await fixture.whenStable();
        await expect.poll(() => country.getText()).toBe('Argentina');
      });

      it('marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const country = (await allHarnessesOf(fixture))(0);
        expect(component.model.country().touched()).toBe(false);

        await country.focus();
        await country.blur();

        expect(component.model.country().touched()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        withMotion();
        const { fixture, component, element } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.focus();
        await userEvent.keyboard('br');
        await expect.poll(() => bare.isOpen()).toBe(true);
        await overlayOpen(element);
        await bare.selectSuggestion('Brazil');
        await fixture.whenStable();
        expect(component.value().bare).toBe(BRAZIL);
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await openWith(fixture, element, 'br');

      await autocomplete.selectSuggestion('Brazil');
      expect(component.value()).toBe(BRAZIL);

      await autocomplete.focus();
      await autocomplete.blur();
      expect(await autocomplete.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id and is named by the field label through <label for>', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const autocomplete = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLLabelElement);

      expect(await autocomplete.getId()).toMatch(/^wj-autocomplete-\d+$/);
      expect(label.htmlFor).toBe(await autocomplete.getId());
      expect(inputOf(element).labels).toHaveLength(1);
      expect((await autocomplete.getAriaAttributes()).labelledBy).toBeNull();
      expect(await field.getLabel()).toBe('Country');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('moves focus to the input when the field label is clicked, and opens nothing', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const autocomplete = await harnessOf(fixture);
      expect(await autocomplete.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await autocomplete.isFocused()).toBe(true);
      expect(await autocomplete.isOpen()).toBe(false);
    });

    it('fills the width of the field', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(hostOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
      expect(rootOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
      expect(inputOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
    });

    it('adopts its own inputId, lets a consumer ariaLabelledBy win, and merges ariaDescribedBy first', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);
      const field = await fieldOf(fixture);

      expect(await inField.getId()).toBe('mine');
      expect((await inField.getAriaAttributes()).labelledBy).toBe('namer');
      expect((await inField.getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await field.getHint()).toBe('Hint');
      expect(await field.getError()).toBe('Error');
    });

    it('registers two controls as a group, each with its own generated id', async () => {
      const { fixture } = await renderAs(PairHost);
      const all = await allHarnessesOf(fixture);
      const field = await fieldOf(fixture);

      expect(await field.isGroup()).toBe(true);
      expect(await all(0).getId()).toMatch(/^wj-autocomplete-\d+$/);
      expect(await all(1).getId()).toMatch(/^wj-autocomplete-\d+$/);
      expect(await all(0).getId()).not.toBe(await all(1).getId());
    });

    it('describes the input with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const autocomplete = await harnessOf(fixture);
      expect((await autocomplete.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await autocomplete.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await autocomplete.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const autocomplete = await harnessOf(fixture);
      expect(await autocomplete.isInvalid()).toBe(false);
      expect(getComputedStyle(inputOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Pick a country from the list.');
      await fixture.whenStable();
      expect(await autocomplete.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(inputOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await autocomplete.isInvalid()).toBe(false);
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id, no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const autocomplete = await harnessOf(fixture);
      const aria = await autocomplete.getAriaAttributes();

      expect(await autocomplete.getId()).toBe('');
      expect(aria.labelledBy).toBeNull();
      expect(aria.describedBy).toBeNull();
      expect(aria.label).toBe('Country');
    });

    it('keeps the consumer’s inputId and ariaDescribedBy', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component, element } = await render();
      const autocomplete = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await autocomplete.isInvalid()).toBe(true);

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
      const autocomplete = await harnessOf(fixture);

      expect(await autocomplete.getId()).toBe('mine');
      expect(await autocomplete.getAriaAttributes()).toEqual({
        label: 'Country',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('marks the input as an autocompleting combobox that is expanded only while the list is open', async () => {
      const { fixture, element } = await render();
      const input = inputOf(element);
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.hasAttribute('aria-controls')).toBe(false);

      const autocomplete = await openWith(fixture, element, 'au');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe(listOf(element).id);

      await closeList(autocomplete, element);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-autocomplete: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      await renderAs(AriaHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-autocomplete: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('safety', () => {
    it('renders an HTML payload on the ARIA inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const autocomplete = await harnessOf(fixture);

      expect(await autocomplete.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await autocomplete.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on the placeholder as text only', async () => {
      const { element } = await render((host) => {
        host.placeholder.set(PAYLOAD);
      });

      expect(inputOf(element).getAttribute('placeholder')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload on suggestion labels, in the list and once picked, as text only', async () => {
      const { fixture, component, element } = await render((host) => {
        host.source.set([{ label: PAYLOAD, value: 'payload' }]);
      });
      const autocomplete = await openWith(fixture, element, '<');

      expect(await autocomplete.getSuggestionLabels()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();

      await autocomplete.selectSuggestion(PAYLOAD);
      await fixture.whenStable();
      expect(component.value()?.label).toBe(PAYLOAD);
      await expect.poll(() => autocomplete.getText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload written as the value as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set({ label: PAYLOAD, value: 'payload' });
      });
      const autocomplete = await harnessOf(fixture);

      await expect.poll(() => autocomplete.getText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the text it shows', async () => {
      const { fixture } = await render((host) => {
        host.value.set(AUSTRALIA);
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const withText = async (text: string): Promise<number> =>
        (await loader.getAllHarnesses(WjAutoCompleteHarness.with({ text }))).length;

      await expect.poll(() => withText('Australia')).toBe(1);
      expect(await withText('Brazil')).toBe(0);
      expect(
        await loader.getAllHarnesses(WjAutoCompleteHarness.with({ ariaLabel: /^Coun/ })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjAutoCompleteHarness.with({ ariaLabel: 'Other' })),
      ).toHaveLength(0);
    });

    it('types text, reads the suggestions, picks one, and closes and clears', async () => {
      withMotion();
      const { fixture, component, element } = await render();
      const autocomplete = await harnessOf(fixture);
      expect(await autocomplete.isOpen()).toBe(false);

      await autocomplete.typeText('au');
      await expect.poll(() => autocomplete.isOpen()).toBe(true);
      await overlayOpen(element);
      expect(await autocomplete.getText()).toBe('au');
      expect(await autocomplete.getSuggestionLabels()).toEqual(['Australia', 'Austria']);
      expect(await autocomplete.getEmptyMessage()).toBeNull();

      await autocomplete.selectSuggestion('Australia');
      await fixture.whenStable();
      expect(component.value()).toBe(AUSTRALIA);
      await expect.poll(() => autocomplete.isOpen()).toBe(false);

      await autocomplete.clear();
      await expect.poll(() => component.value()).toBeNull();
      expect(await autocomplete.getText()).toBe('');
    });

    it('closes an open list with Escape and refuses an unknown label', async () => {
      const { fixture, element } = await render();
      const autocomplete = await openWith(fixture, element, 'au');

      await expect(autocomplete.selectSuggestion('Zucchini')).rejects.toThrow(
        'no suggestion labelled',
      );
      await closeList(autocomplete, element);
      expect(await autocomplete.getSuggestionLabels()).toEqual([]);
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const autocomplete = await harnessOf(fixture);
      expect(await autocomplete.isFocused()).toBe(false);

      await autocomplete.focus();
      expect(await autocomplete.isFocused()).toBe(true);

      await autocomplete.blur();
      expect(await autocomplete.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
      });

      it('has no axe violations open with suggestions and a focused one', async () => {
        // The overlay's own motion must end for axe to read its final colours (`openWith` lets it).
        const { fixture, element } = await render(() => undefined, scheme);
        const autocomplete = await openWith(fixture, element, 'au');
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(element)).toBe('Australia');

        await expectNoAxeViolations(hostOf(element));
        await closeList(autocomplete, element);
      });

      it('has no axe violations open with no results', async () => {
        const { fixture, element } = await render(() => undefined, scheme);
        const autocomplete = await openWith(fixture, element, 'zz');
        expect(await autocomplete.getEmptyMessage()).toBe('No results found');

        await expectNoAxeViolations(hostOf(element));
        await closeList(autocomplete, element);
      });

      it('has no axe violations while a search runs', async () => {
        const { fixture, element } = await render((host) => {
          host.answering.set(false);
        }, scheme);
        const autocomplete = await harnessOf(fixture);
        await autocomplete.focus();
        await userEvent.keyboard('au');
        await expect.poll(() => element.querySelector('.p-autocomplete-loader')).not.toBeNull();

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    beforeEach(async () => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for. The pointer is parked
      // away, because Optimus focuses the row under it (`focusOnHover`).
      withMotion();
      await pointerAway();
    });

    /** Renders the keyboard host and focuses the first control by Tab from the button before it. */
    async function focusFirst(): Promise<
      Rendered<KeyboardHost> & { autocomplete: WjAutoCompleteHarness }
    > {
      const rendered = await renderAs(KeyboardHost);
      const autocomplete = (await allHarnessesOf(rendered.fixture))(0);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      expect(await autocomplete.isFocused()).toBe(true);
      return { ...rendered, autocomplete };
    }

    /** Types `text` into the focused first control and waits for the open list. */
    async function typeAndOpen(
      rendered: Rendered<KeyboardHost> & { autocomplete: WjAutoCompleteHarness },
      text: string,
    ): Promise<void> {
      await userEvent.keyboard(text);
      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(true);
      await overlayOpen(rendered.element);
    }

    it('Tab goes to the input, skips a disabled control, and moves on', async () => {
      const { element, autocomplete } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await autocomplete.isFocused()).toBe(true);
    });

    it('typing opens the list after the debounce, with no row focused, and does not open it on focus', async () => {
      const rendered = await focusFirst();
      expect(await rendered.autocomplete.isOpen()).toBe(false);
      expect(rendered.component.queries).toEqual([]);

      await typeAndOpen(rendered, 'a');

      expect(rendered.component.queries).toEqual(['a']);
      expect(await rendered.autocomplete.getSuggestionLabels()).toEqual([
        'Argentina',
        'Australia',
        'Austria',
      ]);
      expect(activeLabel(rendered.element)).toBeNull();

      await closeList(rendered.autocomplete, rendered.element);
    });

    it('Down and Up move through the suggestions, skipping a disabled one and stopping at the ends', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'a');
      const { element } = rendered;

      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Argentina');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Australia');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Australia');
      await userEvent.keyboard('{ArrowUp}');
      expect(activeLabel(element)).toBe('Argentina');
      await userEvent.keyboard('{ArrowUp}');
      expect(activeLabel(element)).toBe('Argentina');
      expect(await rendered.autocomplete.isOpen()).toBe(true);

      await closeList(rendered.autocomplete, element);
    });

    it('Up in the open list focuses the last suggestion that is not disabled', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'a');

      await userEvent.keyboard('{ArrowUp}');

      expect(activeLabel(rendered.element)).toBe('Australia');
      await closeList(rendered.autocomplete, rendered.element);
    });

    it('Left and Right move the caret, drop the focused suggestion, and leave the list open', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');
      const { element } = rendered;
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Australia');

      await userEvent.keyboard('{ArrowLeft}');
      expect(activeLabel(element)).toBeNull();
      expect(inputOf(element).selectionStart).toBe(1);
      await userEvent.keyboard('{ArrowRight}');
      expect(inputOf(element).selectionStart).toBe(2);
      expect(await rendered.autocomplete.isOpen()).toBe(true);

      await closeList(rendered.autocomplete, element);
    });

    it('Home and End move the caret to the start and the end of the text, and drop the focused suggestion', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'aus');
      const { element } = rendered;
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Australia');

      await userEvent.keyboard('{Home}');
      expect([inputOf(element).selectionStart, inputOf(element).selectionEnd]).toEqual([0, 0]);
      expect(activeLabel(element)).toBeNull();
      await userEvent.keyboard('{End}');
      expect([inputOf(element).selectionStart, inputOf(element).selectionEnd]).toEqual([3, 3]);
      expect(await rendered.autocomplete.isOpen()).toBe(true);

      await closeList(rendered.autocomplete, element);
    });

    it('PageDown and PageUp scroll the list to its end and its start without moving the focused suggestion', async () => {
      const { fixture, element } = await renderAs(LongHost);
      const autocomplete = await openWith(fixture, element, 'item');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Item 01');
      const container = find(element, '.p-autocomplete-list-container', HTMLElement);
      expect(container.scrollTop).toBe(0);

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => container.scrollTop).toBeGreaterThan(0);
      expect(activeLabel(element)).toBe('Item 01');
      expect(await autocomplete.isOpen()).toBe(true);

      await userEvent.keyboard('{PageUp}');
      // The first row scrolls into view with the list's own 4px padding above it.
      await expect.poll(() => container.scrollTop).toBeLessThanOrEqual(4);
      expect(activeLabel(element)).toBe('Item 01');

      await closeList(autocomplete, element);
    });

    it('Enter picks the focused suggestion, closes the list and keeps focus on the input', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(rendered.element)).toBe('Australia');

      await userEvent.keyboard('{Enter}');
      await rendered.fixture.whenStable();

      expect(rendered.component.value()).toBe(AUSTRALIA);
      await expect.poll(() => rendered.autocomplete.getText()).toBe('Australia');
      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      expect(await rendered.autocomplete.isFocused()).toBe(true);
    });

    it('Enter with no focused suggestion only closes the list, and clears the text that matches none', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      await expect.poll(() => rendered.autocomplete.getText()).toBe('');
      expect(rendered.component.value()).toBeNull();
      expect(await rendered.autocomplete.isFocused()).toBe(true);
    });

    it('Alt+Up picks the focused suggestion and closes the list', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');
      await userEvent.keyboard('{ArrowDown}');

      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
      await rendered.fixture.whenStable();

      expect(rendered.component.value()).toBe(AUSTRALIA);
      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      expect(await rendered.autocomplete.isFocused()).toBe(true);
    });

    it('Escape closes the list without picking, keeps focus on the input, and clears text that matches none', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(rendered.element)).toBe('Australia');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      expect(rendered.component.value()).toBeNull();
      await expect.poll(() => rendered.autocomplete.getText()).toBe('');
      expect(await rendered.autocomplete.isFocused()).toBe(true);
      await expect.poll(() => rendered.element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('Escape keeps text that is exactly a suggestion’s label, and picks that suggestion', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'brazil');

      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();

      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      await expect.poll(() => rendered.component.value()).toBe(BRAZIL);
      expect(await rendered.autocomplete.getText()).toBe('Brazil');
    });

    it('Tab picks the focused suggestion and closes the list, but Optimus returns focus to the input: a second Tab moves on', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(rendered.element)).toBe('Australia');

      await userEvent.tab();
      await rendered.fixture.whenStable();

      expect(rendered.component.value()).toBe(AUSTRALIA);
      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      await expect.poll(() => rendered.autocomplete.isFocused()).toBe(true);
      await expect.poll(() => rendered.element.querySelector('[role="listbox"]')).toBeNull();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(rendered.element, 'after'));
    });

    it('Tab with no focused suggestion closes the list, moves focus on, and clears the text that matches none', async () => {
      const rendered = await focusFirst();
      await typeAndOpen(rendered, 'au');

      await userEvent.tab();

      expect(document.activeElement).toBe(byId(rendered.element, 'after'));
      await expect.poll(() => rendered.autocomplete.isOpen()).toBe(false);
      await expect.poll(() => rendered.autocomplete.getText()).toBe('');
      expect(rendered.component.value()).toBeNull();
    });

    it('Backspace edits the text, and the value goes once the text is empty', async () => {
      const rendered = await focusFirst();
      rendered.component.value.set(AUSTRALIA);
      await rendered.fixture.whenStable();
      await expect.poll(() => rendered.autocomplete.getText()).toBe('Australia');
      await userEvent.keyboard('{End}{Backspace}');
      expect(await rendered.autocomplete.getText()).toBe('Australi');
      expect(rendered.component.value()).toBe(AUSTRALIA);

      await userEvent.keyboard('{Backspace}'.repeat('Australi'.length));

      await expect.poll(() => rendered.component.value()).toBeNull();
      expect(await rendered.autocomplete.getText()).toBe('');
    });

    it('does nothing on a disabled control', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const disabled = (await allHarnessesOf(fixture))(1);
      const host = element.querySelectorAll<HTMLElement>('wj-autocomplete')[1];

      const input = host?.querySelector<HTMLElement>('[role="combobox"]');
      expect(input?.getAttribute('tabindex')).toBe('-1');
      input?.focus();
      await userEvent.keyboard('{ArrowDown}{Enter}a');

      expect(await disabled.isOpen()).toBe(false);
      expect(await disabled.getText()).toBe('');
    });
  });
});
