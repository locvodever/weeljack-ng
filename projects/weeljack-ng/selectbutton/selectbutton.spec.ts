/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledRule, form, required } from '@angular/forms/signals';
import { FilterService, OverlayService } from '@openng/optimus-ui/api';
import { SelectButton } from '@openng/optimus-ui/selectbutton';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import * as selectbuttonApi from 'weeljack-ng/selectbutton';
import {
  WjSelectButton,
  type WjSelectButtonPt,
  type WjSelectButtonSize,
} from 'weeljack-ng/selectbutton';
import { WjSelectButtonHarness } from 'weeljack-ng/selectbutton/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/** The toggle button's colours as the preset sets them (`wjAlwaysOn.components.togglebutton`). */
const LOOK = {
  light: {
    unpicked: 'rgb(82, 82, 91)', // surface.600
    hover: 'rgb(63, 63, 70)', // surface.700
    track: 'rgb(244, 244, 245)', // surface.100
  },
  dark: {
    unpicked: 'rgb(161, 161, 170)', // surface.400
    hover: 'rgb(212, 212, 216)', // surface.300
    track: 'rgb(9, 9, 11)', // surface.950
  },
  pill: 'rgb(113, 113, 122)', // surface.500, both schemes
  picked: 'rgb(255, 255, 255)', // surface.0, both schemes
};

/**
 * Parks the pointer in the viewport's bottom-right corner before a colour read. The pointer is
 * page-wide in browser mode, so an earlier test can leave it over a button, and Optimus's hover
 * colour outranks the resting one. The host renders only the group, so a throwaway fixed target
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

/** Three views; the first host option sets use them. */
const VIEWS: WjOption<string>[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

/** The same, with the middle one disabled, so keyboard navigation has something to skip. */
const VIEWS_WITH_GAP: WjOption<string>[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week', disabled: true },
  { label: 'Month', value: 'month' },
];

/** A consumer's template: one bare group, or the same group inside a field. */
@Component({
  selector: 'wj-selectbutton-host',
  imports: [WjField, WjSelectButton],
  template: `
    @if (inField()) {
      <wj-field label="View" [hint]="hint()" [error]="error()">
        <wj-selectbutton
          [(value)]="value"
          [options]="options()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [allowEmpty]="allowEmpty()"
          [size]="size()"
        />
      </wj-field>
    } @else {
      <wj-selectbutton
        ariaLabel="View"
        [(value)]="value"
        [options]="options()"
        [pt]="pt()"
        [invalid]="invalid()"
        [disabled]="disabled()"
        [required]="required()"
        [allowEmpty]="allowEmpty()"
        [size]="size()"
      />
    }
  `,
})
class Host {
  readonly inField = signal(false);
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal<string | null>(null);
  readonly options = signal<WjOption<string>[]>(VIEWS);
  readonly pt = signal<WjSelectButtonPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly allowEmpty = signal(true);
  readonly size = signal<WjSelectButtonSize | undefined>(undefined);
}

/** The ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-selectbutton-aria-host',
  imports: [WjSelectButton],
  template: `
    <wj-selectbutton
      [options]="options"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly options = VIEWS;
  readonly ariaLabel = signal<string | undefined>('View');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-selectbutton-aria-on-host-host',
  imports: [WjSelectButton],
  template: `<wj-selectbutton aria-label="View" [options]="options" />`,
})
class AriaOnHostHost {
  readonly options = VIEWS;
}

/** A field around a group with its own `ariaLabelledBy` and description, and a bare one. */
@Component({
  selector: 'wj-selectbutton-own-ids-host',
  imports: [WjSelectButton, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-selectbutton ariaLabel="Plain" ariaDescribedBy="note" [options]="options" />
    <wj-field label="View" hint="Hint" error="Error">
      <wj-selectbutton ariaLabelledBy="namer" ariaDescribedBy="note" [options]="options" />
    </wj-field>
  `,
})
class OwnIdsHost {
  readonly options = VIEWS;
}

/** `ngModel` inside a field, with a button either side for the focus-path specs. */
@Component({
  selector: 'wj-selectbutton-ngmodel-host',
  imports: [WjField, WjSelectButton, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="View">
      <wj-selectbutton [(ngModel)]="value" [options]="options" [disabled]="disabled()" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly options = VIEWS;
  readonly value = signal<string | null>('week');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-selectbutton-reactive-host',
  imports: [WjField, WjSelectButton, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="View">
      <wj-selectbutton [formControl]="control" [options]="options" />
    </wj-field>
    <button type="button" id="after">After</button>
  `,
})
class ReactiveHost {
  readonly options = VIEWS;
  readonly control = new FormControl<string | null>('week');
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-selectbutton-signal-host',
  imports: [WjField, WjSelectButton, FormField],
  template: `
    <button type="button" id="before">Before</button>
    <wj-field label="View">
      <wj-selectbutton [formField]="model.view" [options]="options" />
    </wj-field>
    <wj-selectbutton ariaLabel="Bare" [formField]="model.bare" [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class SignalHost {
  readonly options = VIEWS;
  readonly off = signal(false);
  readonly value = signal<{ view: string | null; bare: string | null }>({
    view: 'week',
    bare: null,
  });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Pick one.' });
    disabledRule(path.view, { when: () => this.off() });
  });
}

/** The option's value is an object: `T` survives model and options, and equality is deep. */
interface Plan {
  id: number;
  name: string;
}

@Component({
  selector: 'wj-selectbutton-object-host',
  imports: [WjSelectButton],
  template: `<wj-selectbutton ariaLabel="Plan" [(value)]="plan" [options]="options" />`,
})
class ObjectHost {
  readonly options: WjOption<Plan>[] = [
    { label: 'Free', value: { id: 1, name: 'free' } },
    { label: 'Team', value: { id: 2, name: 'team' } },
  ];
  readonly plan = signal<Plan | null>({ id: 2, name: 'team' });
}

/** The two-way model and the native events a consumer listens to on the host. */
@Component({
  selector: 'wj-selectbutton-events-host',
  imports: [WjSelectButton],
  template: `
    <wj-selectbutton
      ariaLabel="View"
      [value]="value()"
      [options]="options"
      (valueChange)="value.set($event); note('valueChange')"
      (focusin)="note('focusin')"
      (focusout)="note('focusout')"
      (click)="note('click')"
    />
  `,
})
class EventsHost {
  readonly options = VIEWS;
  readonly value = signal<string | null>(null);
  readonly log: string[] = [];
  note(name: string): void {
    this.log.push(name);
  }
}

/** Two groups and two buttons for the keyboard specs; the first has a disabled option. */
@Component({
  selector: 'wj-selectbutton-keyboard-host',
  imports: [WjSelectButton],
  template: `
    <button type="button" id="before">Before</button>
    <wj-selectbutton
      ariaLabel="View"
      [(value)]="value"
      [options]="options"
      [allowEmpty]="allowEmpty()"
    />
    <wj-selectbutton ariaLabel="Disabled" disabled [options]="plain" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly options = VIEWS_WITH_GAP;
  readonly plain = VIEWS;
  readonly value = signal<string | null>(null);
  readonly allowEmpty = signal(true);
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
  expect(getComputedStyle(groupOf(element)).borderTopLeftRadius).toBe('8px');
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

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-selectbutton', HTMLElement);

const groupOf = (element: HTMLElement): HTMLElement => find(element, '[role="group"]', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const buttonsOf = (element: ParentNode): HTMLElement[] => [
  ...element.querySelectorAll<HTMLElement>('[role="button"]:not(#before):not(#after)'),
];

const buttonOf = (element: ParentNode, label: string): HTMLElement => {
  const found = buttonsOf(element).find((button) => button.textContent.trim() === label);
  if (found === undefined) {
    throw new Error(`no button labelled ${label}`);
  }
  return found;
};

/** The pill (the content box) of a toggle button. */
const pillOf = (button: HTMLElement): HTMLElement =>
  find(button, '[data-pc-section="content"]', HTMLElement);

/** The text of a toggle button. */
const labelOf = (button: HTMLElement): HTMLElement =>
  find(button, '[data-pc-section="label"]', HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjSelectButtonHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjSelectButtonHarness);

/** The groups of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjSelectButtonHarness> {
  const all =
    await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjSelectButtonHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-selectbutton at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/** Focuses the button `id` and Tabs once, the way a keyboard user arrives. */
async function tabFrom(element: HTMLElement, id: string): Promise<void> {
  byId(element, id).focus();
  await userEvent.tab();
}

/** Every routed attribute of an in-field group, as the field and the wrapper put it there. */
function expectRouted(element: HTMLElement, disabled: readonly string[] = []): void {
  const group = groupOf(element);
  const label = find(element, '.wj-field-label', HTMLElement);
  expect(group.getAttribute('aria-labelledby')).toBe(label.id);
  expect(group.getAttribute('aria-describedby')).toMatch(/^wj-field-hint-\d+ wj-field-error-\d+$/);
  expect(group.getAttribute('aria-invalid')).toBe('true');
  for (const button of buttonsOf(element)) {
    const off = disabled.includes(button.textContent.trim());
    expect(button.getAttribute('aria-disabled')).toBe(off ? 'true' : null);
    expect(button.getAttribute('tabindex')).toBe(off ? '-1' : '0');
  }
}

const STATES: [string, (host: Host) => void][] = [
  ['nothing picked', () => undefined],
  [
    'one picked',
    (host) => {
      host.value.set('week');
    },
  ],
  [
    'with a disabled option',
    (host) => {
      host.options.set(VIEWS_WITH_GAP);
      host.value.set('day');
    },
  ],
  [
    'with the picked option disabled',
    (host) => {
      host.options.set(VIEWS_WITH_GAP);
      host.value.set('week');
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set('week');
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
    'disabled and invalid',
    (host) => {
      host.value.set('week');
      host.disabled.set(true);
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.value.set('week');
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.value.set('week');
      host.size.set('large');
    },
  ],
  [
    'allowEmpty off',
    (host) => {
      host.value.set('week');
      host.allowEmpty.set(false);
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('Switch any time.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Choose a view.');
    },
  ],
];

describe('WjSelectButton', () => {
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

  describe('inputs', () => {
    it('value is two-way: the group follows it, and picking writes it back', async () => {
      const { fixture, component } = await render();
      const group = await harnessOf(fixture);
      expect(await group.getSelectedLabel()).toBeNull();

      component.value.set('week');
      await fixture.whenStable();
      expect(await group.getSelectedLabel()).toBe('Week');

      await group.selectOption('Month');
      expect(component.value()).toBe('month');
      expect(await group.getSelectedLabel()).toBe('Month');
    });

    it('options lists the labels in order and follows the bound list', async () => {
      const { fixture, component } = await render();
      const group = await harnessOf(fixture);
      expect(await group.getOptionLabels()).toEqual(['Day', 'Week', 'Month']);

      component.options.set([...VIEWS, { label: 'Year', value: 'year' }]);
      await fixture.whenStable();
      expect(await group.getOptionLabels()).toEqual(['Day', 'Week', 'Month', 'Year']);
    });

    it('keeps the value type of an object option and compares it deeply', async () => {
      const { fixture, component } = await renderAs(ObjectHost);
      const group = await harnessOf(fixture);
      expect(await group.getSelectedLabel()).toBe('Team');

      await group.selectOption('Free');
      expect(component.plan()).toEqual({ id: 1, name: 'free' });
    });

    it('a disabled option is shown and cannot be picked, says so and is out of the Tab order', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set(VIEWS_WITH_GAP);
      });
      const group = await harnessOf(fixture);

      expect(await group.isOptionDisabled('Week')).toBe(true);
      expect(await group.isOptionDisabled('Day')).toBe(false);
      expect(buttonOf(element, 'Week').getAttribute('tabindex')).toBe('-1');
      expect(buttonOf(element, 'Day').getAttribute('tabindex')).toBe('0');
      await group.selectOption('Week');
      expect(component.value()).toBeNull();
      expect(await group.getSelectedLabel()).toBeNull();
    });

    it('picking the picked option again unpicks it, and the value becomes null, while allowEmpty is on', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('week');
      });
      const group = await harnessOf(fixture);

      await group.selectOption('Week');

      expect(component.value()).toBeNull();
      expect(await group.getSelectedLabel()).toBeNull();
    });

    it('keeps the pick with allowEmpty off, however often the picked button is pressed', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('week');
        host.allowEmpty.set(false);
      });
      const group = await harnessOf(fixture);

      await group.selectOption('Week');
      await fixture.whenStable();
      expect(component.value()).toBe('week');
      expect(await group.getSelectedLabel()).toBe('Week');
      expect(buttonOf(element, 'Week').getAttribute('aria-pressed')).toBe('true');

      await group.selectOption('Day');
      expect(component.value()).toBe('day');
      await group.selectOption('Day');
      await group.selectOption('Day');
      expect(component.value()).toBe('day');
      expect(await group.getSelectedLabel()).toBe('Day');
    });

    it('reads a bare disabled attribute as true, and an allowEmpty written as false', async () => {
      const { element } = await renderAs(KeyboardHost, (host) => {
        host.allowEmpty.set(false);
      });
      const [first, second] = element.querySelectorAll('wj-selectbutton');

      expect(second?.querySelector('[role="group"]')?.getAttribute('aria-disabled')).toBe('true');
      expect(first?.querySelector('[role="group"]')?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('a disabled group ignores a click, marks the group and every button disabled, and keeps its pick', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('week');
        host.disabled.set(true);
      });
      const group = await harnessOf(fixture);

      await group.selectOption('Day');
      expect(component.value()).toBe('week');
      expect(await group.isDisabled()).toBe(true);
      expect(await group.getSelectedLabel()).toBe('Week');
      for (const button of buttonsOf(element)) {
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.getAttribute('tabindex')).toBe('-1');
      }

      component.disabled.set(false);
      await fixture.whenStable();
      expect(await group.isDisabled()).toBe(false);
      expect(groupOf(element).hasAttribute('aria-disabled')).toBe(false);
      for (const button of buttonsOf(element)) {
        expect(button.hasAttribute('aria-disabled')).toBe(false);
        expect(button.getAttribute('tabindex')).toBe('0');
      }
    });

    it('required does not reach the group: a group cannot carry aria-required', async () => {
      const { element } = await render((host) => {
        host.required.set(true);
      });

      expect(groupOf(element).hasAttribute('aria-required')).toBe(false);
    });

    it('invalid shows the group outline and aria-invalid, and clears them again', async () => {
      const { fixture, component, element } = await render();
      const group = await harnessOf(fixture);
      expect(getComputedStyle(groupOf(element)).outlineStyle).toBe('none');

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await group.isInvalid()).toBe(true);
      const outline = getComputedStyle(groupOf(element));
      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBe('1px');
      expect(outline.outlineColor).toBe(INVALID_BORDER);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(groupOf(element).hasAttribute('aria-invalid')).toBe(false);
      expect(getComputedStyle(groupOf(element)).outlineStyle).toBe('none');
    });

    it('is an inline-flex host that sizes to its buttons, and keeps every button at least 24px', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const buttons = buttonsOf(element);

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().width).toBe(
        groupOf(element).getBoundingClientRect().width,
      );
      for (const button of buttons) {
        const box = button.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('heights', () => {
    it.each<[WjSelectButtonSize | undefined, number]>([
      [undefined, 44],
      ['small', 36],
      ['large', 52],
    ])('is %s: every button and the group are %s px tall', async (size, height) => {
      const { element } = await render((host) => {
        host.value.set('week');
        host.size.set(size);
      });

      for (const button of buttonsOf(element)) {
        expect(button.getBoundingClientRect().height).toBe(height);
      }
      expect(groupOf(element).getBoundingClientRect().height).toBe(height);
    });

    it('follows size when it changes', async () => {
      const { fixture, component, element } = await render();

      component.size.set('large');
      await fixture.whenStable();
      expect(buttonOf(element, 'Day').getBoundingClientRect().height).toBe(52);

      component.size.set(undefined);
      await fixture.whenStable();
      expect(buttonOf(element, 'Day').getBoundingClientRect().height).toBe(44);
    });
  });

  describe('the toggle button tokens', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      const look = LOOK[scheme];

      it('draws an unpicked button in the unpicked text colour on the track, with no pill', async () => {
        await pointerAway();
        const { element } = await render((host) => {
          host.value.set('week');
        }, scheme);
        const day = buttonOf(element, 'Day');

        expect(getComputedStyle(day).color).toBe(look.unpicked);
        expect(getComputedStyle(labelOf(day)).color).toBe(look.unpicked);
        expect(getComputedStyle(day).backgroundColor).toBe(look.track);
        expect(getComputedStyle(pillOf(day)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      });

      it('draws the picked button as a mid-grey pill with white text, on the same track', async () => {
        await pointerAway();
        const { element } = await render((host) => {
          host.value.set('week');
        }, scheme);
        const week = buttonOf(element, 'Week');

        expect(getComputedStyle(pillOf(week)).backgroundColor).toBe(LOOK.pill);
        expect(getComputedStyle(labelOf(week)).color).toBe(LOOK.picked);
        expect(getComputedStyle(week).backgroundColor).toBe(look.track);
      });

      it('darkens the unpicked text on hover, and puts it back', async () => {
        const { element } = await render((host) => {
          host.value.set('week');
        }, scheme);
        const day = buttonOf(element, 'Day');

        await userEvent.hover(day);
        await expect.poll(() => getComputedStyle(day).color).toBe(look.hover);
        expect(getComputedStyle(buttonOf(element, 'Week')).color).toBe(LOOK.picked);

        await pointerAway();
        await expect.poll(() => getComputedStyle(day).color).toBe(look.unpicked);
      });

      it('keeps a disabled button readable: the picked pill stays, and Optimus dims the button', async () => {
        await pointerAway();
        const { element } = await render((host) => {
          host.value.set('week');
          host.disabled.set(true);
        }, scheme);
        const week = buttonOf(element, 'Week');
        const day = buttonOf(element, 'Day');

        expect(getComputedStyle(pillOf(week)).backgroundColor).toBe(LOOK.pill);
        expect(getComputedStyle(labelOf(week)).color).toBe(LOOK.picked);
        expect(getComputedStyle(day).color).toBe(look.unpicked);
        expect(getComputedStyle(day).opacity).toBe('0.6');
        expect(getComputedStyle(week).opacity).toBe('0.6');
      });
    });

    it('Gap: Aura’s disabled fill and text never apply, because its rule uses :disabled and a toggle button is a span', async () => {
      await pointerAway();
      const { element } = await render((host) => {
        host.disabled.set(true);
      });

      // The disabled track and text colours would be zinc.200 and zinc.500.
      expect(getComputedStyle(buttonOf(element, 'Day')).backgroundColor).toBe(LOOK.light.track);
      expect(getComputedStyle(buttonOf(element, 'Day')).color).toBe(LOOK.light.unpicked);
    });
  });

  describe('Optimus behaviours the wrapper depends on', () => {
    it('writes the model into Optimus once per change: its writeValue reads no signal the bridge would track', async () => {
      const write = vi.spyOn(SelectButton.prototype, 'writeValue');
      const { fixture, component, element } = await render();
      const group = await harnessOf(fixture);
      const first = write.mock.calls.length;
      expect(first).toBeGreaterThan(0);

      // A focus move, a hover, new options, a new pt, a size change, an invalid flip and a disabled
      // flip change signals Optimus reads in its own render; none may re-run the bridge's effect.
      await group.focusOption('Week');
      await userEvent.hover(buttonOf(element, 'Month'));
      await pointerAway();
      component.options.set([...VIEWS]);
      component.pt.set({ root: { 'data-root': 'x' } });
      component.size.set('small');
      component.invalid.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      component.disabled.set(false);
      await fixture.whenStable();
      expect(write).toHaveBeenCalledTimes(first);

      await group.selectOption('Month');
      await fixture.whenStable();
      expect(write).toHaveBeenCalledTimes(first + 1);
    });

    it('keeps a form’s initial value through the first binding of the options', async () => {
      const { fixture, component } = await renderAs(ReactiveHost);
      const group = await harnessOf(fixture);

      expect(await group.getSelectedLabel()).toBe('Week');
      expect(component.control.value).toBe('week');
    });

    it('keeps the value when options change, and picks again when its option comes back', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('week');
      });
      const group = await harnessOf(fixture);
      expect(await group.getSelectedLabel()).toBe('Week');

      component.options.set([{ label: 'Year', value: 'year' }]);
      await fixture.whenStable();
      expect(component.value()).toBe('week');
      expect(await group.getSelectedLabel()).toBeNull();

      component.options.set([...VIEWS]);
      await fixture.whenStable();
      expect(component.value()).toBe('week');
      expect(await group.getSelectedLabel()).toBe('Week');
    });

    it('renders a value that no option has without throwing, picks nothing and keeps the value', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('year');
      });
      const group = await harnessOf(fixture);

      expect(await group.getOptionLabels()).toHaveLength(3);
      expect(await group.getSelectedLabel()).toBeNull();
      expect(component.value()).toBe('year');

      await group.selectOption('Day');
      await fixture.whenStable();
      expect(component.value()).toBe('day');
    });

    it.each(['click', 'Enter'])(
      'keeps focus and the picked pill through the echo write after a pick by %s',
      async (how) => {
        await pointerAway();
        const { fixture, component, element } = await render();
        const month = buttonOf(element, 'Month');

        if (how === 'click') {
          await userEvent.click(month);
        } else {
          month.focus();
          await userEvent.keyboard('{Enter}');
        }
        await fixture.whenStable();

        expect(component.value()).toBe('month');
        expect(document.activeElement).toBe(month);
        expect(month.getAttribute('aria-pressed')).toBe('true');
        expect(getComputedStyle(pillOf(month)).backgroundColor).toBe(LOOK.pill);
        expect(buttonOf(element, 'Day').getAttribute('aria-pressed')).toBe('false');
      },
    );
  });

  describe('pt of every form', () => {
    const forms: [string, WjSelectButtonPt][] = [
      [
        'an object',
        {
          root: { 'data-root': 'x' },
          pcToggleButton: {
            root: { 'data-toggle': 'x' },
            content: { 'data-content': 'x' },
            label: { 'data-label': 'x' },
          },
        },
      ],
      [
        'a function',
        () => ({
          root: { 'data-root': 'x' },
          pcToggleButton: {
            root: { 'data-toggle': 'x' },
            content: { 'data-content': 'x' },
            label: { 'data-label': 'x' },
          },
        }),
      ],
      [
        'per-part functions',
        {
          root: () => ({ 'data-root': 'x' }),
          pcToggleButton: () => ({
            root: () => ({ 'data-toggle': 'x' }),
            content: () => ({ 'data-content': 'x' }),
            label: () => ({ 'data-label': 'x' }),
          }),
        },
      ],
    ];

    it.each(forms)(
      'lands the consumer’s parts on the group and every toggle button, and the routed attributes with them, through every state change: %s',
      async (_name, pt) => {
        const { fixture, component, element } = await render((host) => {
          host.inField.set(true);
          host.hint.set('Hint');
          host.error.set('Error');
          host.options.set(VIEWS_WITH_GAP);
          host.pt.set(pt);
        });
        const group = await harnessOf(fixture);
        const expectAll = (disabled: readonly string[]): void => {
          expect(groupOf(element).getAttribute('data-root')).toBe('x');
          const buttons = buttonsOf(element);
          expect(buttons.length).toBeGreaterThan(0);
          for (const button of buttons) {
            expect(button.getAttribute('data-toggle')).toBe('x');
            expect(pillOf(button).getAttribute('data-content')).toBe('x');
            expect(labelOf(button).getAttribute('data-label')).toBe('x');
          }
          expectRouted(element, disabled);
        };
        expectAll(['Week']);

        await group.selectOption('Day');
        await group.selectOption('Month');
        expectAll(['Week']);

        component.options.set([...VIEWS_WITH_GAP, { label: 'Year', value: 'year' }]);
        await fixture.whenStable();
        expectAll(['Week']);

        component.options.set([
          { label: 'Day', value: 'day', disabled: true },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
          { label: 'Year', value: 'year' },
        ]);
        await fixture.whenStable();
        expectAll(['Day']);

        component.value.set('week');
        await fixture.whenStable();
        expectAll(['Day']);

        component.disabled.set(true);
        await fixture.whenStable();
        expectAll(['Day', 'Week', 'Month', 'Year']);
        component.disabled.set(false);
        await fixture.whenStable();
        expectAll(['Day']);

        component.error.set('');
        await fixture.whenStable();
        expect(groupOf(element).hasAttribute('aria-invalid')).toBe(false);
        component.error.set('Error again');
        await fixture.whenStable();
        expectAll(['Day']);

        component.pt.set({
          root: { 'data-root': 'x' },
          pcToggleButton: {
            root: { 'data-toggle': 'x' },
            content: { 'data-content': 'x' },
            label: { 'data-label': 'x' },
          },
        });
        await fixture.whenStable();
        expectAll(['Day']);
      },
    );

    it('keeps a consumer pt string as a class on a toggle button, and lets the routed attributes win over its own', async () => {
      const { element } = await render((host) => {
        host.options.set(VIEWS_WITH_GAP);
        host.pt.set({ pcToggleButton: { root: 'consumer-toggle' } });
      });

      expect(element.querySelectorAll('[role="button"].consumer-toggle')).toHaveLength(3);
      expect(buttonOf(element, 'Week').getAttribute('aria-disabled')).toBe('true');
      expect(buttonOf(element, 'Week').getAttribute('tabindex')).toBe('-1');
    });

    it('lets the routed aria-disabled and tabindex win over the consumer’s on the same toggle button', async () => {
      const { element } = await render((host) => {
        host.options.set(VIEWS_WITH_GAP);
        host.pt.set({ pcToggleButton: { root: { 'aria-disabled': 'false', tabindex: '5' } } });
      });

      expect(buttonOf(element, 'Week').getAttribute('aria-disabled')).toBe('true');
      expect(buttonOf(element, 'Week').getAttribute('tabindex')).toBe('-1');
      expect(buttonOf(element, 'Day').getAttribute('tabindex')).toBe('0');
    });

    it('lets the routed group attributes win over the consumer’s', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
        host.error.set('Error');
        host.pt.set({ root: { 'aria-invalid': 'false', 'aria-describedby': 'mine' } });
      });

      expect(groupOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(groupOf(element).getAttribute('aria-describedby')).toMatch(/^wj-field-error-\d+$/);
    });
  });

  describe('the selectbutton', () => {
    it('keeps Optimus services as root internals and exports only the wrapper', async () => {
      const { fixture } = await render();
      const host = fixture.debugElement.query((node) => node.name === 'wj-selectbutton');

      expect(host.injector.get(FilterService)).toBe(TestBed.inject(FilterService));
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(selectbuttonApi)).toEqual(['WjSelectButton']);
    });

    it('renders the group with no option as an empty group', async () => {
      const { fixture } = await render((host) => {
        host.options.set([]);
      });
      const group = await harnessOf(fixture);

      expect(await group.getOptionLabels()).toEqual([]);
      expect(await group.getSelectedLabel()).toBeNull();
      expect(await group.isDisabled()).toBe(false);
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const group = await harnessOf(fixture);
        expect(await group.getSelectedLabel()).toBe('Week');

        await group.selectOption('Month');
        await fixture.whenStable();
        expect(component.value()).toBe('month');

        component.value.set('day');
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await group.getSelectedLabel()).toBe('Day');
      });

      it('disables the group, and marks the model touched when focus leaves it', async () => {
        const { fixture, component } = await renderAs(NgModelHost);
        const group = await harnessOf(fixture);
        expect(component.model().touched).toBe(false);

        await group.focusOption('Day');
        await group.blur();
        expect(component.model().touched).toBe(true);

        component.disabled.set(true);
        await fixture.whenStable();
        expect(await group.isDisabled()).toBe(true);
      });

      it('does not mark the model touched while focus moves between the buttons, only when it leaves', async () => {
        const { component, element } = await renderAs(NgModelHost);

        await tabFrom(element, 'before');
        expect(document.activeElement).toBe(buttonOf(element, 'Day'));
        await userEvent.tab();
        expect(document.activeElement).toBe(buttonOf(element, 'Week'));
        await userEvent.click(buttonOf(element, 'Month'));
        expect(component.model().touched).toBe(false);

        await userEvent.tab();
        expect(document.activeElement).toBe(byId(element, 'after'));
        expect(component.model().touched).toBe(true);
      });
    });

    describe('FormControl', () => {
      it('shows an initial reactive value, then writes in and out', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const group = await harnessOf(fixture);
        expect(await group.getSelectedLabel()).toBe('Week');

        await group.selectOption('Month');
        expect(component.control.value).toBe('month');
        expect(component.control.dirty).toBe(true);

        component.control.setValue('day');
        expect(await group.getSelectedLabel()).toBe('Day');
      });

      it('disables the control, and marks it touched when focus leaves the group', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const group = await harnessOf(fixture);
        expect(component.control.touched).toBe(false);

        await group.focusOption('Day');
        await group.blur();
        expect(component.control.touched).toBe(true);

        component.control.disable();
        expect(await group.isDisabled()).toBe(true);

        component.control.enable();
        expect(await group.isDisabled()).toBe(false);
      });

      it('does not mark the control touched while focus moves between the buttons, only when it leaves', async () => {
        const { component, element } = await renderAs(ReactiveHost);

        await tabFrom(element, 'before');
        await userEvent.keyboard('{Enter}');
        await userEvent.tab();
        await userEvent.click(buttonOf(element, 'Month'));
        expect(component.control.touched).toBe(false);

        await userEvent.tab({ shift: true });
        await userEvent.tab({ shift: true });
        await userEvent.tab({ shift: true });
        expect(document.activeElement).toBe(byId(element, 'before'));
        expect(component.control.touched).toBe(true);
      });

      it('does not mark the control dirty for a value the form wrote', async () => {
        const { component } = await renderAs(ReactiveHost);

        component.control.setValue('day');

        expect(component.control.dirty).toBe(false);
      });

      it('shows nothing picked for a null value', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);

        component.control.setValue(null);

        expect(await (await harnessOf(fixture)).getSelectedLabel()).toBeNull();
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const view = (await allHarnessesOf(fixture))(0);
        expect(await view.getSelectedLabel()).toBe('Week');

        await view.selectOption('Month');
        await fixture.whenStable();
        expect(component.value().view).toBe('month');

        component.model.view().value.set('day');
        await fixture.whenStable();
        expect(await view.getSelectedLabel()).toBe('Day');
      });

      it('disables the control, and marks the field touched when focus leaves the group', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const view = (await allHarnessesOf(fixture))(0);
        expect(component.model.view().touched()).toBe(false);

        await view.focusOption('Day');
        await view.blur();
        expect(component.model.view().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await view.isDisabled()).toBe(true);
      });

      it('does not mark the field touched while focus moves between the buttons, only when it leaves', async () => {
        const { component, element } = await renderAs(SignalHost);

        await tabFrom(element, 'before');
        await userEvent.tab();
        await userEvent.click(buttonOf(element, 'Month'));
        expect(component.model.view().touched()).toBe(false);

        await userEvent.tab();
        expect(component.model.view().touched()).toBe(true);
      });

      it('pushes the form’s invalid state onto a group outside a field', async () => {
        const { fixture } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isInvalid()).toBe(true);

        await bare.selectOption('Day');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component } = await render();
      const group = await harnessOf(fixture);

      await group.selectOption('Week');
      expect(component.value()).toBe('week');

      await group.focusOption('Day');
      expect(await group.isFocused()).toBe(true);
      await group.blur();
      expect(await group.isFocused()).toBe(false);
    });

    it('reports valueChange, and the native focusin, focusout and click of the host', async () => {
      const { fixture, component, element } = await renderAs(EventsHost);
      const group = await harnessOf(fixture);

      await userEvent.click(buttonOf(element, 'Week'));
      expect(component.value()).toBe('week');
      expect(component.log).toContain('valueChange');
      expect(component.log).toContain('click');
      expect(component.log).toContain('focusin');

      await group.blur();
      expect(component.log).toContain('focusout');
    });
  });

  describe('inside a field', () => {
    it('is named by the field label through aria-labelledby, and routes no id', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const group = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLElement);

      expect(label.tagName).toBe('SPAN');
      expect(label.hasAttribute('for')).toBe(false);
      expect((await group.getAriaAttributes()).labelledBy).toBe(label.id);
      expect(hostOf(element).hasAttribute('id')).toBe(false);
      expect(groupOf(element).hasAttribute('id')).toBe(false);
      expect(await field.getLabel()).toBe('View');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('does nothing when the field label is clicked: no element takes focus for the group', async () => {
      const { component, element } = await render((host) => {
        host.inField.set(true);
      });
      const before = document.activeElement;

      await userEvent.click(find(element, '.wj-field-label', HTMLElement));

      expect(document.activeElement).toBe(before);
      expect(buttonsOf(element).includes(document.activeElement as HTMLElement)).toBe(false);
      expect(component.value()).toBeNull();
    });

    it('sits at the start of the field, sized to its buttons, and leaves the rest of the row empty', async () => {
      const { element } = await render((host) => {
        host.inField.set(true);
      });
      const field = find(element, 'wj-field', HTMLElement).getBoundingClientRect();
      const group = groupOf(element).getBoundingClientRect();
      const last = buttonsOf(element).at(-1)?.getBoundingClientRect();

      // The field stretches the host across its row; the group inside stays at the start.
      expect(group.left).toBe(field.left);
      expect(group.width).toBeLessThan(field.width);
      expect(last?.right).toBe(group.right);
    });

    it('lets a consumer ariaLabelledBy win, and merges ariaDescribedBy first', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);
      const field = await fieldOf(fixture);

      expect((await inField.getAriaAttributes()).labelledBy).toBe('namer');
      expect((await inField.getAriaAttributes()).describedBy).toMatch(
        /^note wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await field.getHint()).toBe('Hint');
      expect(await field.getError()).toBe('Error');
    });

    it('describes the group with the hint, then the error, and clears both when they go', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.hint.set('Hint');
      });
      const group = await harnessOf(fixture);
      expect((await group.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect((await group.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect((await group.getAriaAttributes()).describedBy).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const group = await harnessOf(fixture);
      expect(await group.isInvalid()).toBe(false);
      expect(getComputedStyle(groupOf(element)).outlineStyle).toBe('none');

      component.error.set('Choose a view.');
      await fixture.whenStable();
      expect(await group.isInvalid()).toBe(true);
      expect(getComputedStyle(groupOf(element)).outlineColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await group.isInvalid()).toBe(false);
      expect(groupOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture } = await render();
      const group = await harnessOf(fixture);
      const aria = await group.getAriaAttributes();

      expect(aria.labelledBy).toBeNull();
      expect(aria.describedBy).toBeNull();
      expect(aria.label).toBe('View');
    });

    it('keeps the consumer’s ariaDescribedBy', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect((await plain.getAriaAttributes()).describedBy).toBe('note');
    });
  });

  describe('ARIA routing', () => {
    it('sets ariaLabel, ariaLabelledBy and ariaDescribedBy on the group', async () => {
      const { fixture, component } = await renderAs(AriaHost);
      component.ariaLabelledBy.set('namer');
      component.ariaDescribedBy.set('describer');
      await fixture.whenStable();
      const group = await harnessOf(fixture);

      expect(await group.getAriaAttributes()).toEqual({
        label: 'View',
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
        'WJ0003: wj-selectbutton: aria-label is set on the host, where it is not forwarded to the ' +
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
      component.ariaLabel.set(PAYLOAD);
      component.ariaLabelledBy.set(PAYLOAD);
      component.ariaDescribedBy.set(PAYLOAD);
      await fixture.whenStable();
      const group = await harnessOf(fixture);

      expect(await group.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload on option labels, in the group and once picked, as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([{ label: PAYLOAD, value: 'payload' }]);
      });
      const group = await harnessOf(fixture);

      expect(await group.getOptionLabels()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();

      await group.selectOption(PAYLOAD);
      await fixture.whenStable();
      expect(await group.getSelectedLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the label it holds', async () => {
      const { fixture } = await render((host) => {
        host.value.set('week');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(
        WjSelectButtonHarness.with({ ariaLabel: /^Vie/ }),
      );
      const byPicked = await loader.getAllHarnesses(
        WjSelectButtonHarness.with({ selectedLabel: 'Week' }),
      );
      const none = await loader.getAllHarnesses(
        WjSelectButtonHarness.with({ selectedLabel: 'Day' }),
      );

      expect(byLabel).toHaveLength(1);
      expect(byPicked).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('refuses an unknown label', async () => {
      const { fixture } = await render();
      const group = await harnessOf(fixture);

      await expect(group.selectOption('Year')).rejects.toThrow('no option labelled');
      await expect(group.isOptionDisabled('Year')).rejects.toThrow('no option labelled');
      await expect(group.focusOption('Year')).rejects.toThrow('no option labelled');
    });

    it('reads the focus state and the group’s own ARIA state', async () => {
      const { fixture, component } = await render((host) => {
        host.options.set(VIEWS_WITH_GAP);
      });
      const group = await harnessOf(fixture);
      expect(await group.isFocused()).toBe(false);

      await group.focusOption('Month');
      expect(await group.isFocused()).toBe(true);
      await group.blur();
      expect(await group.isFocused()).toBe(false);

      expect(await group.isDisabled()).toBe(false);
      expect(await group.isInvalid()).toBe(false);
      component.disabled.set(true);
      component.invalid.set(true);
      await fixture.whenStable();
      expect(await group.isDisabled()).toBe(true);
      expect(await group.isInvalid()).toBe(true);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        await pointerAway();
        const { element } = await render(setup, scheme);

        await expectNoAxeViolations(
          element.querySelector('wj-field') ?? find(element, 'wj-selectbutton', HTMLElement),
        );
      });

      it('has no axe violations with a button focused by keyboard, picked or not', async () => {
        await pointerAway();
        const { element } = await renderAs(
          KeyboardHost,
          (host) => {
            host.value.set('day');
          },
          scheme,
        );
        await tabFrom(element, 'before');
        await expect.poll(() => document.activeElement).toBe(buttonOf(element, 'Day'));
        await expectNoAxeViolations(hostOf(element));

        await userEvent.tab();
        await expect.poll(() => document.activeElement).toBe(buttonOf(element, 'Month'));
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      // A hover colour would otherwise follow a pointer another spec left behind.
      return pointerAway();
    });

    /** Renders the keyboard host and Tabs into the first group from the button before it. */
    async function focusFirst(): Promise<Rendered<KeyboardHost>> {
      const rendered = await renderAs(KeyboardHost);
      await tabFrom(rendered.element, 'before');
      await expect.poll(() => document.activeElement).toBe(buttonOf(rendered.element, 'Day'));
      return rendered;
    }

    it('Tab visits each enabled button in turn, skips a disabled option, and leaves the group', async () => {
      const { element } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(element, 'Month'));

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('Shift+Tab walks back through the enabled buttons, and leaves the group', async () => {
      const { element } = await focusFirst();
      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(element, 'Month'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(buttonOf(element, 'Day'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(byId(element, 'before'));
    });

    it('skips a disabled group on Tab and on Shift+Tab', async () => {
      const { element } = await renderAs(KeyboardHost);
      byId(element, 'after').focus();

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(buttonOf(element, 'Month'));

      const second = element.querySelectorAll('wj-selectbutton')[1];
      for (const button of buttonsOf(second ?? element)) {
        expect(button.getAttribute('tabindex')).toBe('-1');
      }
    });

    it('Enter picks the focused button, Enter again unpicks it, and focus stays on it', async () => {
      const { fixture, component, element } = await focusFirst();

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(component.value()).toBe('day');
      expect(buttonOf(element, 'Day').getAttribute('aria-pressed')).toBe('true');
      expect(document.activeElement).toBe(buttonOf(element, 'Day'));

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();
      expect(component.value()).toBeNull();
      expect(document.activeElement).toBe(buttonOf(element, 'Day'));
    });

    it('Space picks the focused button and does not scroll the page', async () => {
      const { fixture, component, element } = await focusFirst();
      const scrolled = window.scrollY;

      await userEvent.tab();
      await userEvent.keyboard(' ');
      await fixture.whenStable();

      expect(component.value()).toBe('month');
      expect(document.activeElement).toBe(buttonOf(element, 'Month'));
      expect(window.scrollY).toBe(scrolled);
    });

    it('Enter on the picked button keeps the pick while allowEmpty is off', async () => {
      const { fixture, component, element } = await renderAs(KeyboardHost, (host) => {
        host.value.set('day');
        host.allowEmpty.set(false);
      });
      await tabFrom(element, 'before');

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();

      expect(component.value()).toBe('day');
      expect(buttonOf(element, 'Day').getAttribute('aria-pressed')).toBe('true');
    });

    it('Gap: the arrow keys, Home, End and Escape do nothing', async () => {
      const { component, element } = await focusFirst();

      await userEvent.keyboard('{ArrowRight}{ArrowDown}{ArrowLeft}{ArrowUp}{Home}{End}{Escape}');

      expect(document.activeElement).toBe(buttonOf(element, 'Day'));
      expect(component.value()).toBeNull();
    });

    it('does nothing on a disabled group, and a disabled button takes no Enter or Space', async () => {
      const { fixture, component, element } = await renderAs(KeyboardHost);
      const disabled = buttonOf(element.querySelectorAll('wj-selectbutton')[1] ?? element, 'Day');
      disabled.focus();

      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await fixture.whenStable();

      expect(disabled.getAttribute('aria-pressed')).toBe('false');
      expect(component.value()).toBeNull();
    });
  });
});
