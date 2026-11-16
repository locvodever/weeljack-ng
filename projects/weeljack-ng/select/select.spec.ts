/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import { FilterService, OverlayService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import * as selectApi from 'weeljack-ng/select';
import {
  WjSelect,
  type WjSelectOption,
  type WjSelectPt,
  type WjSelectSize,
} from 'weeljack-ng/select';
import { WjSelectHarness } from 'weeljack-ng/select/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/** Five fruits; the third is disabled, so keyboard navigation has something to skip. */
const FRUIT: WjSelectOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
];

/** Forty numbered options: enough to make the list scroll. */
const LONG: WjSelectOption<number>[] = Array.from({ length: 40 }, (_, index) => ({
  label: `Option ${String(index + 1)}`,
  value: index + 1,
}));

/** A consumer's template: one bare select, or the same select inside a field. */
@Component({
  selector: 'wj-select-host',
  imports: [WjField, WjSelect],
  template: `
    @if (inField()) {
      <wj-field label="Fruit" [hint]="hint()" [error]="error()">
        <wj-select
          [(value)]="value"
          [options]="options()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [placeholder]="placeholder()"
        />
      </wj-field>
    } @else {
      <wj-select
        ariaLabel="Fruit"
        [(value)]="value"
        [options]="options()"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [size]="size()"
        [placeholder]="placeholder()"
      />
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string | null>(null);
  readonly options = signal<WjSelectOption<string>[]>(FRUIT);
  readonly pt = signal<WjSelectPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjSelectSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>(undefined);
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-select-aria-host',
  imports: [WjSelect],
  template: `
    <wj-select
      [options]="options"
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly options = FRUIT;
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Fruit');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-select-aria-on-host-host',
  imports: [WjSelect],
  template: `<wj-select aria-label="Fruit" [options]="options" />`,
})
class AriaOnHostHost {
  readonly options = FRUIT;
}

/** A field around a select with its own `inputId`, `ariaLabelledBy` and description. */
@Component({
  selector: 'wj-select-own-ids-host',
  imports: [WjSelect, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-select ariaLabel="Plain" inputId="plain" ariaDescribedBy="note" [options]="options" />
    <wj-field label="Fruit" hint="Hint" error="Error">
      <wj-select inputId="mine" ariaLabelledBy="namer" ariaDescribedBy="note" [options]="options" />
    </wj-field>
  `,
})
class OwnIdsHost {
  readonly options = FRUIT;
}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-select-ngmodel-host',
  imports: [WjField, WjSelect, FormsModule],
  template: `
    <wj-field label="Fruit">
      <wj-select [(ngModel)]="value" [options]="options" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly options = FRUIT;
  readonly value = signal<string | null>('banana');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-select-reactive-host',
  imports: [WjField, WjSelect, ReactiveFormsModule],
  template: `
    <wj-field label="Fruit">
      <wj-select [formControl]="control" [options]="options" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly options = FRUIT;
  readonly control = new FormControl<string | null>('banana');
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-select-signal-host',
  imports: [WjField, WjSelect, FormField],
  template: `
    <wj-field label="Fruit">
      <wj-select [formField]="model.fruit" [options]="options" />
    </wj-field>
    <wj-select ariaLabel="Bare" [formField]="model.bare" [options]="options" />
  `,
})
class SignalHost {
  readonly options = FRUIT;
  readonly off = signal(false);
  readonly value = signal<{ fruit: string | null; bare: string | null }>({
    fruit: 'banana',
    bare: null,
  });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Pick one.' });
    disabledRule(path.fruit, { when: () => this.off() });
  });
}

/** The option's value is an object: `T` survives model and options, and equality is deep. */
interface Plan {
  id: number;
  name: string;
}

@Component({
  selector: 'wj-select-object-host',
  imports: [WjSelect],
  template: `<wj-select ariaLabel="Plan" [(value)]="plan" [options]="options" />`,
})
class ObjectHost {
  readonly options: WjSelectOption<Plan>[] = [
    { label: 'Free', value: { id: 1, name: 'free' } },
    { label: 'Team', value: { id: 2, name: 'team' } },
  ];
  readonly plan = signal<Plan | null>({ id: 2, name: 'team' });
}

/** Two selects and two native buttons for the keyboard specs; the second select is disabled. */
@Component({
  selector: 'wj-select-keyboard-host',
  imports: [WjSelect],
  template: `
    <button type="button" id="before">Before</button>
    <wj-select ariaLabel="Fruit" placeholder="Pick a fruit" [(value)]="value" [options]="options" />
    <wj-select ariaLabel="Disabled" disabled [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly options = FRUIT;
  readonly value = signal<string | null>(null);
}

/** A long list, for PageDown and PageUp. */
@Component({
  selector: 'wj-select-long-host',
  imports: [WjSelect],
  template: `<wj-select ariaLabel="Number" [options]="options" />`,
})
class LongHost {
  readonly options = LONG;
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
  expect(getComputedStyle(rootOf(element)).borderTopLeftRadius).toBe('8px');
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

const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-select', HTMLElement);

const comboboxOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="combobox"]', HTMLElement);

const listOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="listbox"]', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjSelectHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjSelectHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjSelectHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjSelectHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-select at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/**
 * Waits until the overlay is fully open: its enter has started and is over. Optimus marks the
 * motion with classes on `p-motion`, which sits bare before the enter starts and after it ends.
 */
async function overlayOpen(element: HTMLElement): Promise<void> {
  const motion = (): string | undefined => element.querySelector('p-motion')?.className;
  await expect.poll(motion).toContain('-enter-');
  await expect.poll(motion).toBe('p-motion');
}

/** Closes an open list and waits for its leave to end, so nothing is left open at teardown. */
async function closeList(select: WjSelectHarness, element: HTMLElement): Promise<void> {
  await select.close();
  await expect.poll(() => select.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
}

/** The label of the option the combobox points at with `aria-activedescendant`, or `null`. */
function activeLabel(element: HTMLElement): string | null {
  const id = comboboxOf(element).getAttribute('aria-activedescendant');
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

const mutedColour = (): string => {
  const muted = getComputedStyle(document.documentElement)
    .getPropertyValue('--wj-text-muted-color')
    .trim();
  const probe = document.createElement('span');
  probe.style.color = muted;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

const STATES: [string, (host: Host) => void][] = [
  [
    'closed with the placeholder',
    (host) => {
      host.placeholder.set('Pick a fruit');
    },
  ],
  [
    'closed with a value',
    (host) => {
      host.value.set('banana');
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set('banana');
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.placeholder.set('Pick a fruit');
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.value.set('banana');
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.value.set('banana');
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.placeholder.set('Pick a fruit');
      host.hint.set('Choose the one you like best.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.placeholder.set('Pick a fruit');
      host.error.set('Pick a fruit.');
    },
  ],
];

describe('WjSelect', () => {
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
    it('value is two-way: the select follows it, and picking writes it back', async () => {
      const { fixture, component } = await render();
      const select = await harnessOf(fixture);

      component.value.set('banana');
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Banana');

      await select.selectOption('Elderberry');
      await fixture.whenStable();
      expect(component.value()).toBe('elderberry');
      expect(await select.getValueText()).toBe('Elderberry');

      component.value.set(null);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('');
    });

    it('options lists the labels in order and follows the bound list', async () => {
      const { fixture, component } = await render();
      const select = await harnessOf(fixture);
      expect(await select.getOptionLabels()).toEqual([
        'Apple',
        'Banana',
        'Cherry',
        'Date',
        'Elderberry',
      ]);
      expect(await select.isOpen()).toBe(false);

      component.options.set([{ label: 'Fig', value: 'fig' }]);
      await fixture.whenStable();
      expect(await select.getOptionLabels()).toEqual(['Fig']);
    });

    it('keeps the value type of an object option and compares it deeply', async () => {
      const { fixture, component } = await renderAs(ObjectHost);
      const select = await harnessOf(fixture);
      expect(await select.getValueText()).toBe('Team');

      await select.selectOption('Free');
      await fixture.whenStable();
      expect(component.plan()).toEqual({ id: 1, name: 'free' });
      expect(component.plan()).toBe(component.options[0]?.value);

      component.plan.set({ id: 2, name: 'team' });
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Team');
    });

    it('a disabled option is shown and cannot be picked', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      await select.open();

      const cherry = find(element, '[role="option"][aria-label="Cherry"]', HTMLElement);
      expect(cherry.getAttribute('data-p-disabled')).toBe('true');
      expect(cherry.getAttribute('aria-disabled')).toBe('true');
      expect(
        find(element, '[role="option"][aria-label="Apple"]', HTMLElement).hasAttribute(
          'aria-disabled',
        ),
      ).toBe(false);
      cherry.click();
      await fixture.whenStable();
      expect(component.value()).toBeNull();

      await closeList(select, element);
    });

    it('placeholder shows while nothing is picked and follows the bound value', async () => {
      const { fixture, component } = await render((host) => {
        host.placeholder.set('Pick a fruit');
      });
      const select = await harnessOf(fixture);
      expect(await select.getValueText()).toBe('Pick a fruit');

      component.value.set('apple');
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Apple');

      component.value.set(null);
      component.placeholder.set('Choose');
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Choose');
    });

    it('disabled, required and invalid reach the combobox', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.isDisabled()).toBe(false);
      expect(await select.isRequired()).toBe(false);
      expect(await select.isInvalid()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.required.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await select.isRequired()).toBe(true);
      expect(await select.isInvalid()).toBe(true);
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await select.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('pt reaches the root, label and list parts, and the routed attributes win over it', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'a' },
          label: { 'data-probe': 'yes', 'aria-invalid': 'false' },
          list: { 'data-list': 'b' },
          option: { 'data-option': 'c' },
        });
        host.invalid.set(true);
      });
      const select = await harnessOf(fixture);
      await select.open();

      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(comboboxOf(element).getAttribute('data-probe')).toBe('yes');
      expect(comboboxOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(listOf(element).getAttribute('data-list')).toBe('b');
      expect(element.querySelector('[role="option"][data-option="c"]')).not.toBeNull();

      await closeList(select, element);
    });

    it('keeps a consumer pt of any form on the parts the wrapper also routes into', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          option: 'consumer-option',
          hiddenFirstFocusableEl: { 'data-first': 'x' },
        });
      });
      const select = await harnessOf(fixture);
      await select.open();

      expect(element.querySelector('[role="option"].consumer-option')).not.toBeNull();
      const first = find(element, '[data-pc-section="hiddenfirstfocusableel"]', HTMLElement);
      expect(first.getAttribute('data-first')).toBe('x');
      expect(first.getAttribute('tabindex')).toBe('-1');

      await closeList(select, element);
      TestBed.resetTestingModule();
      const functional = await render((host) => {
        host.pt.set({ option: () => ({ 'data-fn': 'y' }) });
      });
      const again = await harnessOf(functional.fixture);
      await again.open();

      expect(functional.element.querySelectorAll('[role="option"][data-fn="y"]')).toHaveLength(5);

      await closeList(again, functional.element);
    });

    it('hides the chevron’s English-only "dropdown trigger" button from assistive tech', async () => {
      const { element } = await render();
      const chevron = find(element, '.p-select-dropdown', HTMLElement);

      expect(chevron.getAttribute('aria-hidden')).toBe('true');
      expect(chevron.hasAttribute('tabindex')).toBe(false);
    });

    it('is an inline-flex host with the Optimus root stretched to its width', async () => {
      const { element } = await render();
      const host = find(element, 'wj-select', HTMLElement);
      host.style.inlineSize = '320px';

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(rootOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('steps the height 36 / 44 / 52 px with size, and follows the bound value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('banana');
      });
      const height = (): number => rootOf(element).getBoundingClientRect().height;
      expect(height()).toBe(44);
      expect(find(element, 'wj-select', HTMLElement).getBoundingClientRect().height).toBe(44);

      component.size.set('small');
      await fixture.whenStable();
      expect(height()).toBe(36);

      component.size.set('large');
      await fixture.whenStable();
      expect(height()).toBe(52);
    });

    it('gets the label text line-height 1.5 from the root layer styles, not from the entry', async () => {
      const { element } = await render((host) => {
        host.value.set('banana');
      });
      const style = getComputedStyle(comboboxOf(element));

      expect(parseFloat(style.lineHeight)).toBe(parseFloat(style.fontSize) * 1.5);
    });

    it('draws the chevron in the muted text colour', async () => {
      const { element } = await render();

      expect(getComputedStyle(find(element, '.p-select-dropdown', HTMLElement)).color).toBe(
        mutedColour(),
      );
    });

    it('truncates a long selected text with an ellipsis, and keeps it whole for assistive tech', async () => {
      const long = 'A very long option label that cannot fit into a narrow select control';
      const { fixture, element } = await render((host) => {
        host.options.set([{ label: long, value: 'long' }]);
        host.value.set('long');
      });
      find(element, 'wj-select', HTMLElement).style.inlineSize = '140px';
      const label = comboboxOf(element);

      expect(rootOf(element).getBoundingClientRect().width).toBe(140);
      expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(await (await harnessOf(fixture)).getValueText()).toBe(long);
    });
  });

  describe('the list', () => {
    it('opens inside the host, and Optimus services stay root internals', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);
      await select.open();

      expect(find(element, 'wj-select', HTMLElement).contains(listOf(element))).toBe(true);
      const host = fixture.debugElement.query((node) => node.name === 'wj-select');
      expect(host.injector.get(FilterService)).toBe(TestBed.inject(FilterService));
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(selectApi)).toEqual(['WjSelect']);

      await closeList(select, element);
    });

    it('shows the translation’s empty message as the only row of an empty list', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([]);
      });
      const select = await harnessOf(fixture);

      expect(await select.getEmptyMessage()).toBe('No available options');
      expect(await select.getOptionLabels()).toEqual([]);
      expect(listOf(element).querySelectorAll('[role="option"]')).toHaveLength(1);

      await closeList(select, element);
    });

    it('takes the empty message and the list name from a vi override', async () => {
      const { fixture, element } = await renderAs(
        Host,
        (host) => {
          host.options.set([]);
        },
        'light',
        { translation: viLocale },
      );
      const select = await harnessOf(fixture);

      expect(await select.getEmptyMessage()).toBe(viLocale.emptyMessage);
      expect(listOf(element).getAttribute('aria-label')).toBe(viLocale.aria?.listLabel);

      await closeList(select, element);
    });

    it('names the list from the English translation by default', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);
      await select.open();

      expect(listOf(element).getAttribute('aria-label')).toBe('Option List');

      await closeList(select, element);
    });

    it('opens with a motion by default, and without one under reduced motion', async () => {
      document.getElementById('wj-spec-no-motion')?.remove();
      const animations = async (reduce: boolean): Promise<number> => {
        await emulateReducedMotion(reduce);
        const { fixture } = await render();
        const select = await harnessOf(fixture);
        await select.open();
        await expect.poll(() => select.isOpen()).toBe(true);
        const count = document.getAnimations().length;
        TestBed.resetTestingModule();
        return count;
      };

      expect(await animations(false)).toBeGreaterThan(0);
      expect(await animations(true)).toBe(0);
    });

    it('picking an option with the mouse closes the list and keeps focus on the combobox', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);

      await userEvent.click(comboboxOf(element));
      expect(await select.isOpen()).toBe(true);
      await userEvent.click(find(element, '[role="option"][aria-label="Date"]', HTMLElement));
      await fixture.whenStable();

      expect(component.value()).toBe('date');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const select = await harnessOf(fixture);
        expect(await select.getValueText()).toBe('Banana');

        await select.selectOption('Date');
        await fixture.whenStable();
        expect(component.value()).toBe('date');

        component.value.set('apple');
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await select.getValueText()).toBe('Apple');
      });

      it('disables the control and marks the model touched on blur', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const select = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await select.focus();
        await select.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await select.isDisabled()).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        expect(await select.getValueText()).toBe('Banana');

        await select.selectOption('Date');
        expect(component.control.value).toBe('date');
        expect(component.control.dirty).toBe(true);

        component.control.setValue('apple');
        expect(await select.getValueText()).toBe('Apple');
      });

      it('disables the control and marks it touched on blur', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await select.focus();
        await select.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await select.isDisabled()).toBe(true);

        component.control.enable();
        expect(await select.isDisabled()).toBe(false);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue('apple');

        expect(component.control.dirty).toBe(false);
      });

      it('shows the placeholder state for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getValueText()).toBe('');
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const fruit = (await allHarnessesOf(fixture))(0);
        expect(await fruit.getValueText()).toBe('Banana');

        await fruit.selectOption('Date');
        await fixture.whenStable();
        expect(component.value().fruit).toBe('date');

        component.model.fruit().value.set('apple');
        await fixture.whenStable();
        expect(await fruit.getValueText()).toBe('Apple');
      });

      it('disables the control and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const fruit = (await allHarnessesOf(fixture))(0);
        expect(component.model.fruit().touched()).toBe(false);

        await fruit.focus();
        await fruit.blur();
        expect(component.model.fruit().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await fruit.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await bare.selectOption('Apple');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component } = await render();
      const select = await harnessOf(fixture);

      await select.selectOption('Banana');
      expect(component.value()).toBe('banana');

      await select.focus();
      await select.blur();
      expect(await select.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id and is named by the field label through aria-labelledby', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const select = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLElement);

      expect(await select.getId()).toMatch(/^wj-select-\d+$/);
      expect(label.tagName).toBe('SPAN');
      expect(label.hasAttribute('for')).toBe(false);
      expect((await select.getAriaAttributes()).labelledBy).toBe(label.id);
      expect(await field.getLabel()).toBe('Fruit');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('moves focus to the combobox when the field label is clicked, and opens nothing', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const select = await harnessOf(fixture);
      expect(await select.isFocused()).toBe(false);

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(await select.isFocused()).toBe(true);
      expect(await select.isOpen()).toBe(false);
    });

    it('fills the width of the field', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const fieldBox = find(element, 'wj-field', HTMLElement).getBoundingClientRect();

      expect(find(element, 'wj-select', HTMLElement).getBoundingClientRect().width).toBe(
        fieldBox.width,
      );
      expect(rootOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
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

    it('describes the combobox with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const select = await harnessOf(fixture);
      expect((await select.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await select.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await select.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const select = await harnessOf(fixture);
      expect(await select.isInvalid()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Pick a fruit.');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(false);
      expect(comboboxOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id, no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const select = await harnessOf(fixture);
      const aria = await select.getAriaAttributes();

      expect(await select.getId()).toBe('');
      expect(aria.labelledBy).toBeNull();
      expect(aria.describedBy).toBeNull();
      expect(aria.label).toBe('Fruit');
    });

    it('keeps the consumer’s inputId and ariaDescribedBy', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(comboboxOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('ARIA routing', () => {
    it('sets inputId, ariaLabel, ariaLabelledBy and ariaDescribedBy on the combobox', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const select = await harnessOf(fixture);

      expect(await select.getId()).toBe('mine');
      expect(await select.getAriaAttributes()).toEqual({
        label: 'Fruit',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-select: aria-label is set on the host, where it is not forwarded to the ' +
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
    it('renders an HTML payload on the ARIA inputs as attribute text only', async () => {
      const { fixture, component, element } = await renderAs(AriaHost);
      component.inputId.set('payload');
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const select = await harnessOf(fixture);

      expect(await select.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.inputId.set(PAYLOAD);
      await fixture.whenStable();
      expect(await select.getId()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });

    it('renders an HTML payload on the placeholder as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.placeholder.set(PAYLOAD);
      });
      const select = await harnessOf(fixture);

      expect(await select.getValueText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload on option labels, in the list and once picked, as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([{ label: PAYLOAD, value: 'payload' }]);
      });
      const select = await harnessOf(fixture);

      expect(await select.getOptionLabels()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();

      await select.selectOption(PAYLOAD);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the text it shows', async () => {
      const { fixture } = await render((host) => {
        host.value.set('banana');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(WjSelectHarness.with({ ariaLabel: /^Fru/ }));
      const byText = await loader.getAllHarnesses(WjSelectHarness.with({ valueText: 'Banana' }));
      const none = await loader.getAllHarnesses(WjSelectHarness.with({ valueText: 'Apple' }));

      expect(byLabel).toHaveLength(1);
      expect(byText).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('opens, closes and reports the list state, and leaves a read list as it found it', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.isOpen()).toBe(false);

      await select.open();
      expect(await select.isOpen()).toBe(true);
      await select.open();
      expect(await select.isOpen()).toBe(true);

      await closeList(select, element);
      expect(await select.isOpen()).toBe(false);
      expect(await select.getOptionLabels()).toHaveLength(5);
      await expect.poll(() => select.isOpen()).toBe(false);
    });

    it('reports no empty message for a list with options, and refuses an unknown label', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);

      expect(await select.getEmptyMessage()).toBeNull();
      await expect(select.selectOption('Zucchini')).rejects.toThrow('no option labelled');

      await closeList(select, element);
    });

    it('reads the focus state', async () => {
      const { fixture } = await render();
      const select = await harnessOf(fixture);
      expect(await select.isFocused()).toBe(false);

      await select.focus();
      expect(await select.isFocused()).toBe(true);

      await select.blur();
      expect(await select.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-select', HTMLElement),
        );
      });

      it('has no axe violations open with a focused option', async () => {
        // The overlay's own motion must end for axe to read its final colours.
        document.getElementById('wj-spec-no-motion')?.remove();
        const { fixture, element } = await render((host) => {
          host.value.set('banana');
        }, scheme);
        const select = await harnessOf(fixture);
        await select.focus();
        await userEvent.keyboard('{ArrowDown}');
        await overlayOpen(element);
        expect(await select.isOpen()).toBe(true);
        expect(activeLabel(element)).toBe('Banana');

        await expectNoAxeViolations(find(element, 'wj-select', HTMLElement));
        await closeList(select, element);
      });
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for.
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    /** Renders the keyboard host and focuses the first select by Tab from the button before it. */
    async function focusFirst(): Promise<Rendered<KeyboardHost> & { select: WjSelectHarness }> {
      const rendered = await renderAs(KeyboardHost);
      const select = (await allHarnessesOf(rendered.fixture))(0);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      expect(await select.isFocused()).toBe(true);
      return { ...rendered, select };
    }

    it('Tab goes to the combobox, skips a disabled select, and moves on', async () => {
      const { element, select } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await select.isFocused()).toBe(true);
    });

    it('Down opens the list and Down and Up move through the options, skipping a disabled one', async () => {
      const { element, select } = await focusFirst();

      await userEvent.keyboard('{ArrowDown}');
      expect(await select.isOpen()).toBe(true);
      expect(activeLabel(element)).toBeNull();

      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Banana');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Date');
      await userEvent.keyboard('{ArrowUp}');
      expect(activeLabel(element)).toBe('Banana');
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{ArrowUp}');
      expect(activeLabel(element)).toBe('Apple');

      await closeList(select, element);
    });

    it('Up opens the list with the last option focused while nothing is picked', async () => {
      const { element, select } = await focusFirst();

      await userEvent.keyboard('{ArrowUp}');

      expect(await select.isOpen()).toBe(true);
      expect(activeLabel(element)).toBe('Elderberry');
      await closeList(select, element);
    });

    it('Home and End jump to the first and the last option', async () => {
      const { element, select } = await focusFirst();

      await userEvent.keyboard('{End}');
      expect(await select.isOpen()).toBe(true);
      expect(activeLabel(element)).toBe('Elderberry');

      await userEvent.keyboard('{Home}');
      expect(activeLabel(element)).toBe('Apple');

      await closeList(select, element);
    });

    it('PageDown and PageUp scroll the list to its end and its start without moving the focused option', async () => {
      const { fixture, element } = await renderAs(LongHost);
      const select = await harnessOf(fixture);
      await select.focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Option 1');
      await overlayOpen(element);
      const container = find(element, '.p-select-list-container', HTMLElement);
      expect(container.scrollTop).toBe(0);

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => container.scrollTop).toBeGreaterThan(0);
      expect(activeLabel(element)).toBe('Option 1');
      expect(await select.isOpen()).toBe(true);

      await userEvent.keyboard('{PageUp}');
      // The first option scrolls into view with the list's own 4px padding above it.
      await expect.poll(() => container.scrollTop).toBeLessThanOrEqual(4);
      expect(activeLabel(element)).toBe('Option 1');

      await closeList(select, element);
    });

    it('Enter picks the focused option, closes the list and keeps focus on the combobox', async () => {
      const { fixture, component, element, select } = await focusFirst();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeLabel(element)).toBe('Banana');
      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();

      expect(component.value()).toBe('banana');
      expect(await select.getValueText()).toBe('Banana');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.isFocused()).toBe(true);
    });

    it('Space opens the list, and picks the focused option once it is open', async () => {
      const { fixture, component, element, select } = await focusFirst();

      await userEvent.keyboard(' ');
      expect(await select.isOpen()).toBe(true);
      await overlayOpen(element);

      await userEvent.keyboard('{ArrowDown}');
      expect(activeLabel(element)).toBe('Apple');
      await userEvent.keyboard(' ');
      await fixture.whenStable();

      expect(component.value()).toBe('apple');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.isFocused()).toBe(true);
    });

    it('Alt+Up picks the focused option and closes the list', async () => {
      const { fixture, component, element, select } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeLabel(element)).toBe('Banana');
      await overlayOpen(element);

      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
      await fixture.whenStable();

      expect(component.value()).toBe('banana');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.isFocused()).toBe(true);
    });

    it('Escape closes the list without picking, and focus stays on the combobox', async () => {
      const { component, element, select } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(activeLabel(element)).toBe('Apple');

      await overlayOpen(element);
      await userEvent.keyboard('{Escape}');

      await expect.poll(() => select.isOpen()).toBe(false);
      expect(component.value()).toBeNull();
      expect(await select.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('Tab picks the focused option, closes the list and moves focus on', async () => {
      const { fixture, component, element, select } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeLabel(element)).toBe('Banana');
      await overlayOpen(element);

      await userEvent.tab();
      await fixture.whenStable();

      expect(component.value()).toBe('banana');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(document.activeElement).toBe(byId(element, 'after'));
      await expect.poll(() => element.querySelector('[role="listbox"]')).toBeNull();
    });

    it('Tab with no focused option closes the list and moves focus on', async () => {
      const { component, element, select } = await focusFirst();
      await userEvent.keyboard('{ArrowDown}');
      expect(await select.isOpen()).toBe(true);
      await overlayOpen(element);

      await userEvent.tab();

      expect(component.value()).toBeNull();
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('typing letters opens the list and moves to the option that starts with them', async () => {
      const { fixture, component, element, select } = await focusFirst();

      await userEvent.keyboard('e');
      expect(await select.isOpen()).toBe(true);
      await expect.poll(() => activeLabel(element)).toBe('Elderberry');

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => select.isOpen()).toBe(false);
      await userEvent.keyboard('da');
      await expect.poll(() => activeLabel(element)).toBe('Date');
      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(component.value()).toBe('date');
      await expect.poll(() => select.isOpen()).toBe(false);
    });

    it('does nothing on a disabled select', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const disabled = (await allHarnessesOf(fixture))(1);
      const host = element.querySelectorAll<HTMLElement>('wj-select')[1];

      const combobox = host?.querySelector<HTMLElement>('[role="combobox"]');
      expect(combobox?.getAttribute('tabindex')).toBe('-1');
      combobox?.focus();
      await userEvent.keyboard('{ArrowDown}{Enter} a');

      expect(await disabled.isOpen()).toBe(false);
      expect(await disabled.getValueText()).toBe('');
    });
  });
});
