/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, inject, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { FilterService, OverlayService } from '@openng/optimus-ui/api';
import { CascadeSelect, CascadeSelectSub } from '@openng/optimus-ui/cascadeselect';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import * as cascadeselectApi from 'weeljack-ng/cascadeselect';
import {
  WjCascadeSelect,
  type WjCascadeSelectOption,
  type WjCascadeSelectPt,
  type WjCascadeSelectSize,
} from 'weeljack-ng/cascadeselect';
import { WjCascadeSelectHarness } from 'weeljack-ng/cascadeselect/testing';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import { expectNoAxeViolations } from '../spec-support/axe';

/*
 * Optimus 2.0.2 ships its partial declarations unlinked into this spec run: Vitest's dependency
 * bundle hands them to the JIT, and `CascadeSelectSub`'s factory reads `CascadeSelect` (declared
 * after it) when the class is defined, so it captures `undefined` and no level below the first can
 * ever open ("token must be defined"). An app build runs the Angular linker, which emits the lazy
 * form below. This restates that one factory, so the specs run what an app runs.
 */
Reflect.set(
  CascadeSelectSub,
  'ɵfac',
  (type?: new (parent: CascadeSelect) => CascadeSelectSub) =>
    new (type ?? CascadeSelectSub)(inject(CascadeSelect)),
);

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';
/** The viewport the run starts with (414 px wide): narrower than Optimus's 960 px breakpoint. */
const VIEWPORT = { width: window.innerWidth, height: window.innerHeight };

/**
 * Parks the pointer in the viewport's bottom-right corner before a read that a hover would change.
 * The pointer is page-wide in browser mode, so an earlier test can leave it over the control or a
 * row, and Optimus opens the group under it (`focusOnHover`).
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

type Tree = WjCascadeSelectOption<string>[];

/**
 * Three levels: a group of groups of leaves, a group at every level with a disabled row (a leaf at
 * the first and third level, a group at the second), and leaves at the first level.
 */
const TREE: Tree = [
  {
    label: 'Australia',
    children: [
      {
        label: 'New South Wales',
        children: [
          { label: 'Sydney', value: 'sydney' },
          { label: 'Newcastle', value: 'newcastle' },
        ],
      },
      {
        label: 'Victoria',
        children: [
          { label: 'Melbourne', value: 'melbourne' },
          { label: 'Geelong', value: 'geelong', disabled: true },
        ],
      },
      { label: 'Tasmania', disabled: true, children: [{ label: 'Hobart', value: 'hobart' }] },
    ],
  },
  {
    label: 'Canada',
    children: [
      {
        label: 'Ontario',
        children: [
          { label: 'Toronto', value: 'toronto' },
          { label: 'Ottawa', value: 'ottawa' },
        ],
      },
      {
        label: 'Quebec',
        children: [
          { label: 'Montreal', value: 'montreal' },
          { label: 'Quebec City', value: 'quebec-city' },
        ],
      },
    ],
  },
  { label: 'Antarctica', value: 'antarctica', disabled: true },
  { label: 'Anywhere', value: 'anywhere' },
];

/** Four levels: the depth the wrapper counts is the tree's, not a constant. */
const DEEP: Tree = [
  {
    label: 'A',
    children: [{ label: 'B', children: [{ label: 'C', children: [{ label: 'D', value: 'd' }] }] }],
  },
  { label: 'E', value: 'e' },
];

/** No groups at all. */
const FLAT: Tree = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
];

/** A consumer's template: one bare cascade select, or the same one inside a field. */
@Component({
  selector: 'wj-cascadeselect-host',
  imports: [WjField, WjCascadeSelect],
  template: `
    @if (inField()) {
      <wj-field label="City" [hint]="hint()" [error]="error()">
        <wj-cascadeselect
          [value]="value()"
          (valueChange)="pick($event)"
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
      <wj-cascadeselect
        ariaLabel="City"
        [value]="value()"
        (valueChange)="pick($event)"
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
  readonly options = signal<Tree>(TREE);
  readonly pt = signal<WjCascadeSelectPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjCascadeSelectSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>('Select a city');
  /** Every value the control reported, in order. */
  readonly emitted: (string | null)[] = [];

  pick(value: string | null): void {
    this.emitted.push(value);
    this.value.set(value);
  }
}

/** The four ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-cascadeselect-aria-host',
  imports: [WjCascadeSelect],
  template: `
    <wj-cascadeselect
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('City');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-cascadeselect-aria-on-host-host',
  imports: [WjCascadeSelect],
  template: `<wj-cascadeselect aria-label="City" />`,
})
class AriaOnHostHost {}

/** A field around a cascade select with its own `inputId`, `ariaLabelledBy` and description. */
@Component({
  selector: 'wj-cascadeselect-own-ids-host',
  imports: [WjCascadeSelect, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-cascadeselect ariaLabel="Plain" inputId="plain" ariaDescribedBy="note" />
    <wj-field label="City" hint="Hint" error="Error">
      <wj-cascadeselect inputId="mine" ariaLabelledBy="namer" ariaDescribedBy="note" />
    </wj-field>
  `,
})
class OwnIdsHost {}

/** Two controls inside one field: `wj-field` becomes a group, and each keeps its own id. */
@Component({
  selector: 'wj-cascadeselect-pair-host',
  imports: [WjCascadeSelect, WjField],
  template: `
    <wj-field label="Route">
      <wj-cascadeselect ariaLabel="From" [options]="options" />
      <wj-cascadeselect ariaLabel="To" [options]="options" />
    </wj-field>
  `,
})
class PairHost {
  readonly options = TREE;
}

/** `ngModel` inside a field, with a leaf's value written in. */
@Component({
  selector: 'wj-cascadeselect-ngmodel-host',
  imports: [WjField, WjCascadeSelect, FormsModule],
  template: `
    <wj-field label="City">
      <wj-cascadeselect [(ngModel)]="value" [options]="options" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly options = TREE;
  readonly value = signal<string | null>('melbourne');
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-cascadeselect-reactive-host',
  imports: [WjField, WjCascadeSelect, ReactiveFormsModule],
  template: `
    <wj-field label="City">
      <wj-cascadeselect [formControl]="control" [options]="options" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly options = TREE;
  readonly control = new FormControl<string | null>('melbourne');
  /** Every value the control announced, in order. */
  readonly announced: (string | null)[] = [];

  constructor() {
    this.control.valueChanges.subscribe((value) => {
      this.announced.push(value);
    });
  }
}

interface Trip {
  city: string | null;
  bare: string | null;
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-cascadeselect-signal-host',
  imports: [WjField, WjCascadeSelect, FormField],
  template: `
    <wj-field label="City">
      <wj-cascadeselect [formField]="model.city" [options]="options" />
    </wj-field>
    <wj-cascadeselect ariaLabel="Bare" [formField]="model.bare" [options]="options" />
  `,
})
class SignalHost {
  readonly options = TREE;
  readonly value = signal<Trip>({ city: 'melbourne', bare: null });
  readonly model = form(this.value, (path) => {
    required(path.bare, { message: 'Pick one.' });
  });
}

/** The leaf's value is an object: `T` survives the model and the tree. */
interface Plan {
  id: number;
  name: string;
}

const COMPANY: Plan = { id: 3, name: 'company' };

const PLANS: WjCascadeSelectOption<Plan>[] = [
  {
    label: 'Paid',
    children: [
      { label: 'Team', value: { id: 2, name: 'team' } },
      { label: 'Company', value: COMPANY },
    ],
  },
  { label: 'Free', value: { id: 1, name: 'free' } },
];

@Component({
  selector: 'wj-cascadeselect-object-host',
  imports: [WjCascadeSelect],
  template: `<wj-cascadeselect ariaLabel="Plan" [(value)]="plan" [options]="options" />`,
})
class ObjectHost {
  readonly options = PLANS;
  readonly plan = signal<Plan | null>({ id: 2, name: 'team' });
}

/** Two controls and two native buttons for the keyboard specs; the second control is disabled. */
@Component({
  selector: 'wj-cascadeselect-keyboard-host',
  imports: [WjCascadeSelect],
  template: `
    <button type="button" id="before">Before</button>
    <wj-cascadeselect
      ariaLabel="City"
      placeholder="Select a city"
      [(value)]="value"
      [options]="options"
    />
    <wj-cascadeselect ariaLabel="Disabled" disabled [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly options = TREE;
  readonly value = signal<string | null>(null);
}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
}

/** The fixture currently on screen, so `afterEach` can close a list a spec left open. */
let current: Rendered<unknown> | undefined;

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
  const rendered = { fixture, component: fixture.componentInstance, element };
  current = rendered;
  return rendered;
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

const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-cascadeselect', HTMLElement);

const hostOf = (element: HTMLElement): HTMLElement =>
  find(element, 'wj-cascadeselect', HTMLElement);

const inputOf = (element: HTMLElement): HTMLInputElement =>
  find(element, '[role="combobox"]', HTMLInputElement);

const labelOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="label"]', HTMLElement);

const treeOf = (element: HTMLElement): HTMLElement => find(element, '[role="tree"]', HTMLElement);

/** A row's own label: the text of its content, which leaves out the level it opens. */
const rowLabel = (row: Element): string => (row.firstElementChild?.textContent ?? '').trim();

/** The row (`treeitem`) with this label, at any level. */
function rowOf(element: HTMLElement, label: string): HTMLElement {
  for (const row of element.querySelectorAll<HTMLElement>('[role="treeitem"]')) {
    if (rowLabel(row) === label) {
      return row;
    }
  }
  throw new Error(`no row labelled ${label}`);
}

const rowsAt = (element: HTMLElement, level: number): HTMLElement[] =>
  Array.from(
    element.querySelectorAll<HTMLElement>(`[role="treeitem"][aria-level="${String(level)}"]`),
  );

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjCascadeSelectHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjCascadeSelectHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjCascadeSelectHarness> {
  const all =
    await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjCascadeSelectHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-cascadeselect at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/**
 * Waits until the overlay is fully open: shown, with its enter over. Optimus keeps `p-motion`
 * hidden (`display: none`) while closed, and shows it and starts the enter in the same frame, so a
 * shown `p-motion` with no motion class left means the enter has ended.
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
 * Opens the list with the harness, waits for it, then opens each group of `groups` in turn and
 * waits for its level. The pointer is parked away first: Optimus opens the group under it.
 */
async function openAt(
  fixture: ComponentFixture<unknown>,
  element: HTMLElement,
  groups: string[] = [],
): Promise<WjCascadeSelectHarness> {
  withMotion();
  await pointerAway();
  const select = await harnessOf(fixture);
  await select.open();
  await expect.poll(() => select.isOpen()).toBe(true);
  await overlayOpen(element);
  for (const [index, label] of groups.entries()) {
    await select.openGroup(label, index + 1);
    await expect.poll(() => select.getOptionLabels(index + 2)).not.toEqual([]);
  }
  return select;
}

/**
 * Closes an open list and waits for its leave to end, so nothing is left open at teardown. An
 * Escape sent while the enter is still running is swallowed, so the enter ends first.
 */
async function closeList(select: WjCascadeSelectHarness, element: HTMLElement): Promise<void> {
  if (await select.isOpen()) {
    await overlayOpen(element);
  }
  await select.close();
  await expect.poll(() => select.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
}

/** The row the combobox points at with `aria-activedescendant`, as `label@level`, or `null`. */
function activeRow(element: HTMLElement): string | null {
  const id = inputOf(element).getAttribute('aria-activedescendant');
  const row = id === null ? null : element.querySelector(`[id="${id}"]`);
  return row === null ? null : `${rowLabel(row)}@${row.getAttribute('aria-level') ?? ''}`;
}

/** The labels of the group rows that say they are open, in document order. */
const openGroups = (element: HTMLElement): string[] =>
  Array.from(element.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).map(rowLabel);

/** Reduces motion for this window only: Optimus's motion runner reads `window.matchMedia`. */
const realMatchMedia = window.matchMedia.bind(window);
function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? reduce : value;
          },
        })
      : list;
  });
}

/** What `--wj-text-muted-color` computes to, measured on a throwaway element. */
function mutedColor(): string {
  const probe = document.createElement('span');
  probe.style.color = 'var(--wj-text-muted-color)';
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const STATES: [string, (host: Host) => void][] = [
  ['closed with the placeholder', () => undefined],
  [
    'closed with a value',
    (host) => {
      host.value.set('melbourne');
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set('melbourne');
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
      host.value.set('melbourne');
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.value.set('melbourne');
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.hint.set('We deliver to these cities only.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.error.set('Choose a pickup city.');
    },
  ],
];

describe('WjCascadeSelect', () => {
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
    try {
      // A list left open would reach the next spec: close it and wait for the leave.
      if (current !== undefined) {
        const selects = await TestbedHarnessEnvironment.loader(current.fixture).getAllHarnesses(
          WjCascadeSelectHarness,
        );
        for (const select of selects) {
          if (await select.isOpen()) {
            await closeList(select, current.element);
          }
        }
      }
    } finally {
      current = undefined;
      document.getElementById('wj-spec-no-motion')?.remove();
      ROOT.classList.remove('wj-dark');
      document.body.style.backgroundColor = '';
      document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
        style.remove();
      });
      Reflect.deleteProperty(window, 'wjInjected');
      await page.viewport(VIEWPORT.width, VIEWPORT.height);
    }
  });

  describe('inputs and outputs', () => {
    it('value is two-way: a written leaf shows its label, picking writes it back, null clears', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.getText()).toBe('Select a city');

      component.value.set('melbourne');
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Melbourne');
      expect(component.emitted).toEqual([]);

      await openAt(fixture, element);
      await select.selectOption(['Canada', 'Ontario', 'Toronto']);
      await fixture.whenStable();
      expect(component.value()).toBe('toronto');
      expect(component.emitted).toEqual(['toronto']);
      await expect.poll(() => select.getText()).toBe('Toronto');
      await expect.poll(() => select.isOpen()).toBe(false);

      component.value.set(null);
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Select a city');
    });

    it('keeps a value written before the first render, and tells nobody it changed', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('melbourne');
      });
      const select = await harnessOf(fixture);

      await expect.poll(() => select.getText()).toBe('Melbourne');
      await fixture.whenStable();
      expect(component.value()).toBe('melbourne');
      expect(component.emitted).toEqual([]);
    });

    it('keeps the value when the options are replaced, writes it back into Optimus, and tells nobody', async () => {
      const { fixture, component } = await render((host) => {
        host.value.set('melbourne');
      });
      const select = await harnessOf(fixture);
      await expect.poll(() => select.getText()).toBe('Melbourne');

      component.options.set([...TREE]);
      await fixture.whenStable();

      await expect.poll(() => select.getText()).toBe('Melbourne');
      expect(component.value()).toBe('melbourne');
      expect(component.emitted).toEqual([]);

      component.options.set(FLAT);
      await fixture.whenStable();
      expect(component.value()).toBe('melbourne');
      expect(component.emitted).toEqual([]);
    });

    it('counts the levels from the tree: a flat list, and four levels deep', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set(FLAT);
      });
      const select = await openAt(fixture, element);
      expect(await select.getOptionLabels()).toEqual(['One', 'Two']);
      await select.selectOption(['Two']);
      await fixture.whenStable();
      expect(component.value()).toBe('two');

      component.options.set(DEEP);
      await fixture.whenStable();
      await openAt(fixture, element, ['A', 'B', 'C']);
      expect(await select.getOptionLabels(4)).toEqual(['D']);
      await select.selectOption(['A', 'B', 'C', 'D']);
      await fixture.whenStable();
      expect(component.value()).toBe('d');
      await expect.poll(() => select.getText()).toBe('D');
    });

    it('keeps the value type of an object leaf and compares it deeply', async () => {
      const { fixture, component, element } = await renderAs(ObjectHost);
      const select = await harnessOf(fixture);
      await expect.poll(() => select.getText()).toBe('Team');

      await openAt(fixture, element);
      await select.selectOption(['Paid', 'Company']);
      await fixture.whenStable();
      expect(component.plan()).toBe(COMPANY);

      component.plan.set({ id: 1, name: 'free' });
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Free');
    });

    it('placeholder shows while none is picked', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);

      expect(await select.getText()).toBe('Select a city');
      expect(inputOf(element).getAttribute('placeholder')).toBe('Select a city');
    });

    it('shows nothing when there is neither a pick nor a placeholder', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set(undefined);
      });

      expect(await (await harnessOf(fixture)).getText()).toBe('');
    });

    it('Gap: a changed placeholder reaches the shown text only with the next change of the value', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);

      component.placeholder.set('Pick one');
      await fixture.whenStable();
      expect(inputOf(element).getAttribute('placeholder')).toBe('Pick one');
      // Optimus computes the shown text from a plain input, so nothing tells it to compute again.
      expect(await select.getText()).toBe('Select a city');

      component.value.set('melbourne');
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Melbourne');
      component.value.set(null);
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Pick one');
    });

    it('shows the placeholder, keeps the value, and still opens, when no leaf has the value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('nowhere');
      });
      const select = await harnessOf(fixture);
      expect(await select.getText()).toBe('Select a city');
      expect(component.value()).toBe('nowhere');

      await openAt(fixture, element);
      expect(await select.getOptionLabels()).toEqual([
        'Australia',
        'Canada',
        'Antarctica',
        'Anywhere',
      ]);
      expect(openGroups(element)).toEqual([]);
      expect(component.value()).toBe('nowhere');
      expect(component.emitted).toEqual([]);

      component.value.set('melbourne');
      await fixture.whenStable();
      await expect.poll(() => select.getText()).toBe('Melbourne');

      await closeList(select, element);
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
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await select.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true, and a disabled control does not open on a click', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const disabled = (await allHarnessesOf(fixture))(1);
      expect(await disabled.isDisabled()).toBe(true);

      const host = element.querySelectorAll<HTMLElement>('wj-cascadeselect')[1];
      expect(host).toBeDefined();
      await userEvent.click(host ?? element);

      expect(await disabled.isOpen()).toBe(false);
      expect(await disabled.isFocused()).toBe(false);
    });

    it('opens as an empty panel when there are no options, and adds no empty row', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([]);
      });
      const select = await openAt(fixture, element);

      expect(await select.getOptionLabels()).toEqual([]);
      expect(treeOf(element).children).toHaveLength(0);
      expect(treeOf(element).textContent.trim()).toBe('');

      await closeList(select, element);
    });
  });

  describe('pass-through', () => {
    const OBJECT_PT: WjCascadeSelectPt = {
      root: { 'data-root': 'a' },
      hiddenInputWrapper: { 'data-wrapper': 'b' },
      hiddenInput: { 'data-input': 'c', 'aria-invalid': 'false' },
      label: { 'data-label': 'd' },
      dropdown: { 'data-dropdown': 'e' },
      overlay: { 'data-overlay': 'f' },
      listContainer: { 'data-container': 'g' },
      list: { 'data-list': 'h' },
      optionList: { 'data-optionlist': 'i' },
      option: { 'data-option': 'j' },
      optionContent: { 'data-content': 'k' },
      optionText: { 'data-text': 'l' },
      groupIcon: { 'data-groupicon': 'm' },
    };
    const NAMES = [
      'data-root',
      'data-wrapper',
      'data-input',
      'data-label',
      'data-dropdown',
      'data-overlay',
      'data-container',
      'data-list',
      'data-optionlist',
      'data-option',
      'data-content',
      'data-text',
      'data-groupicon',
    ] as const;

    /** How many elements carry each marker attribute. */
    const counts = (element: HTMLElement): Record<string, number> =>
      Object.fromEntries(NAMES.map((name) => [name, element.querySelectorAll(`[${name}]`).length]));

    it('reaches the root parts and the first level, and the routed attributes win', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
        host.invalid.set(true);
      });
      expect(counts(element)).toMatchObject({
        'data-root': 1,
        'data-wrapper': 1,
        'data-input': 1,
        'data-label': 1,
        'data-dropdown': 1,
        'data-overlay': 0,
      });
      expect(inputOf(element).getAttribute('data-input')).toBe('c');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      const select = await openAt(fixture, element, ['Australia']);
      // The first level: the overlay, its list and container, its four rows' parts (a group icon is
      // a span and an svg), and the list of the level the open group holds, which it renders.
      expect(counts(element)).toEqual({
        'data-root': 1,
        'data-wrapper': 1,
        'data-input': 1,
        'data-label': 1,
        'data-dropdown': 1,
        'data-overlay': 1,
        'data-container': 1,
        'data-list': 1,
        'data-optionlist': 1,
        'data-option': 4,
        'data-content': 4,
        'data-text': 4,
        'data-groupicon': 4,
      });

      await closeList(select, element);
    });

    it('Gap: Optimus gives the rows below the first level no pt, so none of these parts land there', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
      });
      const select = await openAt(fixture, element, ['Australia', 'New South Wales']);

      for (const level of [2, 3]) {
        const rows = rowsAt(element, level);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          expect(row.hasAttribute('data-option')).toBe(false);
          expect(row.querySelector('[data-text]')).toBeNull();
          expect(row.querySelector('[data-content]')).toBeNull();
        }
      }
      // The list of level 3 is rendered by level 2, which has no pt either.
      expect(element.querySelectorAll('[data-optionlist]')).toHaveLength(1);

      await closeList(select, element);
    });

    it('keeps reaching every part after the list closes and reopens, and after value, disabled, invalid and pt change', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set(OBJECT_PT);
      });
      const select = await openAt(fixture, element, ['Canada']);
      expect(element.querySelectorAll('[data-option]')).toHaveLength(4);
      await closeList(select, element);
      expect(element.querySelectorAll('[data-option]')).toHaveLength(0);
      expect(counts(element)['data-root']).toBe(1);

      await openAt(fixture, element);
      expect(element.querySelectorAll('[data-option]')).toHaveLength(4);
      expect(element.querySelectorAll('[data-list]')).toHaveLength(1);
      await closeList(select, element);

      component.value.set('melbourne');
      component.invalid.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      expect(counts(element)).toMatchObject({ 'data-root': 1, 'data-input': 1, 'data-label': 1 });
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      component.disabled.set(false);
      component.pt.set({
        root: { 'data-root': 'changed' },
        hiddenInput: { 'data-input': 'changed' },
        option: { 'data-option': 'changed' },
      });
      await fixture.whenStable();
      expect(rootOf(element).getAttribute('data-root')).toBe('changed');
      expect(inputOf(element).getAttribute('data-input')).toBe('changed');
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      await openAt(fixture, element);
      expect(rowsAt(element, 1).every((row) => row.getAttribute('data-option') === 'changed')).toBe(
        true,
      );

      component.pt.set({ option: { 'data-option': 'again' } });
      await fixture.whenStable();
      expect(rowsAt(element, 1).every((row) => row.getAttribute('data-option') === 'again')).toBe(
        true,
      );
      await closeList(select, element);
    });

    it('takes the function form, whole and per part, calling the whole one once with the root', async () => {
      const whole = vi.fn((context: unknown) => ({
        root: { 'data-root': 'fn' },
        // The function gets the root's instance, as Optimus gives it.
        hiddenInput: {
          'data-input': Reflect.get(Object(context), 'instance') === undefined ? 'none' : 'fn',
        },
        list: () => ({ 'data-list': 'fn' }),
        option: () => ({ 'data-option': 'fn' }),
      }));
      const { fixture, element } = await render((host) => {
        host.pt.set(whole);
      });
      expect(rootOf(element).getAttribute('data-root')).toBe('fn');
      expect(inputOf(element).getAttribute('data-input')).toBe('fn');

      const select = await openAt(fixture, element, ['Australia']);
      expect(treeOf(element).getAttribute('data-list')).toBe('fn');
      expect(rowsAt(element, 1).every((row) => row.getAttribute('data-option') === 'fn')).toBe(
        true,
      );

      const calls = whole.mock.calls as unknown[][];
      expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) {
        expect(Reflect.get(Object(call[0]), 'instance')).not.toBeUndefined();
      }

      await closeList(select, element);
    });

    it('keeps a string pt as a class list, on the parts the wrapper also routes into', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ hiddenInput: 'consumer-input', option: 'consumer-row' });
        host.invalid.set(true);
      });
      expect(inputOf(element).classList.contains('consumer-input')).toBe(true);
      expect(inputOf(element).getAttribute('aria-invalid')).toBe('true');

      const select = await openAt(fixture, element);
      expect(rowOf(element, 'Anywhere').classList.contains('consumer-row')).toBe(true);
      expect(rowOf(element, 'Antarctica').getAttribute('aria-disabled')).toBe('true');
      expect(rowOf(element, 'Australia').getAttribute('aria-expanded')).toBe('false');

      await closeList(select, element);
    });

    it('keeps a consumer attribute on an option, and the routed ones win over the same names, clearing included', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ option: { 'data-option': 'mine', 'aria-disabled': 'false' } });
      });
      const select = await openAt(fixture, element);

      expect(rowOf(element, 'Anywhere').getAttribute('data-option')).toBe('mine');
      // The routed attribute wins over the consumer's own on the same name, even to clear it.
      expect(rowOf(element, 'Antarctica').getAttribute('aria-disabled')).toBe('true');
      expect(rowOf(element, 'Anywhere').hasAttribute('aria-disabled')).toBe(false);

      await closeList(select, element);
    });
  });

  describe('box', () => {
    it('is an inline-flex host with the Optimus root stretched to its width', async () => {
      const { element } = await render();
      hostOf(element).style.inlineSize = '320px';

      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(rootOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('steps the height 36 / 44 / 52 px with size, on the host and the root', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('melbourne');
      });
      const heights = (): number[] =>
        [hostOf(element), rootOf(element)].map((box) => box.getBoundingClientRect().height);
      expect(heights()).toEqual([44, 44]);

      component.size.set('small');
      await fixture.whenStable();
      expect(heights()).toEqual([36, 36]);

      component.size.set('large');
      await fixture.whenStable();
      expect(heights()).toEqual([52, 52]);
    });

    it('gets the label line-height 1.5 from the root layer styles, not from the entry', async () => {
      const { element } = await render((host) => {
        host.value.set('melbourne');
      });
      const style = getComputedStyle(labelOf(element));

      expect(parseFloat(style.lineHeight)).toBe(parseFloat(style.fontSize) * 1.5);
    });

    it('shows a long picked text on one line with an ellipsis', async () => {
      const { element } = await render((host) => {
        host.options.set([{ label: 'A very long city name that cannot fit', value: 'long' }]);
        host.value.set('long');
      });
      hostOf(element).style.inlineSize = '120px';
      const label = labelOf(element);
      const style = getComputedStyle(label);

      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(style.textOverflow).toBe('ellipsis');
      expect(style.whiteSpace).toBe('nowrap');
      expect(rootOf(element).getBoundingClientRect().height).toBe(44);
    });

    it('keeps the control and every row at least 24 by 24 px', async () => {
      const { fixture, element } = await render();
      const control = rootOf(element).getBoundingClientRect();
      expect(Math.min(control.width, control.height)).toBeGreaterThanOrEqual(24);

      const select = await openAt(fixture, element, ['Australia', 'New South Wales']);
      const rows = [1, 2, 3].flatMap((level) => rowsAt(element, level));
      expect(rows.length).toBeGreaterThan(8);
      for (const row of rows) {
        const box = (row.firstElementChild ?? row).getBoundingClientRect();
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }

      await closeList(select, element);
    });

    it('draws the chevron and the group icon in the muted text colour', async () => {
      const { fixture, element } = await render();
      const muted = mutedColor();
      expect(
        getComputedStyle(find(element, '[data-pc-section="dropdownicon"]', SVGElement)).color,
      ).toBe(muted);

      const select = await openAt(fixture, element);
      const icon = find(rowOf(element, 'Canada'), '[data-pc-section="groupicon"]', HTMLElement);
      expect(getComputedStyle(icon).color).toBe(muted);

      await closeList(select, element);
    });
  });

  describe('the list', () => {
    it('opens inside the host, and Optimus services stay root internals', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element);

      expect(hostOf(element).contains(treeOf(element))).toBe(true);
      const host = fixture.debugElement.query((node) => node.name === 'wj-cascadeselect');
      expect(host.injector.get(FilterService)).toBe(TestBed.inject(FilterService));
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(cascadeselectApi)).toEqual(['WjCascadeSelect']);

      await closeList(select, element);
    });

    it('opens with a motion by default, and without one under reduced motion', async () => {
      const motions = async (reduce: boolean): Promise<number> => {
        reduceMotion(reduce);
        const { fixture, element } = await render();
        // Count what starts on the overlay itself: the enter. A colour transition on the control
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
          await openAt(fixture, element);
        } finally {
          document.removeEventListener('animationstart', count, true);
          document.removeEventListener('transitionrun', count, true);
        }
        const select = await harnessOf(fixture);
        await closeList(select, element);
        current = undefined;
        TestBed.resetTestingModule();
        return started;
      };

      expect(await motions(false)).toBeGreaterThan(0);
      expect(await motions(true)).toBe(0);
    });

    it('a group opens its level when it is clicked, and is not a value', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element);
      expect(await select.getOptionLabels(1)).toEqual([
        'Australia',
        'Canada',
        'Antarctica',
        'Anywhere',
      ]);
      expect(await select.getOptionLabels(2)).toEqual([]);

      await select.openGroup('Australia');
      await expect
        .poll(() => select.getOptionLabels(2))
        .toEqual(['New South Wales', 'Victoria', 'Tasmania']);
      await select.openGroup('Victoria', 2);
      await expect.poll(() => select.getOptionLabels(3)).toEqual(['Melbourne', 'Geelong']);
      expect(component.value()).toBeNull();
      expect(await select.getText()).toBe('Select a city');

      await closeList(select, element);
    });

    it('picking a leaf with the mouse writes it, closes the list and keeps focus on the combobox', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element, ['Canada', 'Quebec']);

      await userEvent.click(
        find(rowOf(element, 'Montreal'), '[data-pc-section="optioncontent"]', HTMLElement),
      );
      await fixture.whenStable();

      expect(component.value()).toBe('montreal');
      await expect.poll(() => select.getText()).toBe('Montreal');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
    });

    it('opens on the path to the picked leaf, and reads that leaf as selected', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set('melbourne');
      });
      const select = await openAt(fixture, element);

      await expect.poll(() => openGroups(element)).toEqual(['Australia', 'Victoria']);
      expect(rowOf(element, 'Melbourne').getAttribute('aria-selected')).toBe('true');
      expect(rowOf(element, 'Geelong').getAttribute('aria-selected')).toBe('false');
      expect(rowOf(element, 'Anywhere').getAttribute('aria-selected')).toBe('false');
      expect(rowOf(element, 'Australia').hasAttribute('aria-selected')).toBe(false);

      await closeList(select, element);
    });

    it('stays inside its level count: only an open group holds the next level', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element, ['Australia']);
      expect(rowsAt(element, 2)).toHaveLength(3);
      expect(rowsAt(element, 3)).toHaveLength(0);

      await select.openGroup('Canada');
      await expect.poll(() => select.getOptionLabels(2)).toEqual(['Ontario', 'Quebec']);
      expect(openGroups(element)).toEqual(['Canada']);

      await closeList(select, element);
    });

    it('names the tree from the English translation by default, and from a vi override', async () => {
      const english = await render();
      const first = await openAt(english.fixture, english.element);
      expect(treeOf(english.element).getAttribute('aria-label')).toBe('Option List');
      await closeList(first, english.element);
      current = undefined;
      TestBed.resetTestingModule();

      const { fixture, element } = await renderAs(Host, () => undefined, 'light', {
        translation: viLocale,
      });
      const select = await openAt(fixture, element);
      expect(treeOf(element).getAttribute('aria-label')).toBe(viLocale.aria?.listLabel);

      await closeList(select, element);
    });

    it('opens a level beside its parent on a wide screen, and stacks it under the group on a narrow one', async () => {
      const levelBox = async (width: number): Promise<{ list: DOMRect; row: DOMRect }> => {
        await page.viewport(width, 800);
        const { fixture, element } = await render();
        const select = await openAt(fixture, element, ['Australia']);
        const row = find(
          rowOf(element, 'Australia'),
          '[data-pc-section="optioncontent"]',
          HTMLElement,
        );
        const list = find(rowOf(element, 'Australia'), '[role="group"]', HTMLElement);
        const boxes = { list: list.getBoundingClientRect(), row: row.getBoundingClientRect() };
        await closeList(select, element);
        current = undefined;
        TestBed.resetTestingModule();
        return boxes;
      };

      const wide = await levelBox(1280);
      expect(wide.list.left).toBeGreaterThanOrEqual(wide.row.right - 2);
      expect(Math.abs(wide.list.top - wide.row.top)).toBeLessThan(16);

      const narrow = await levelBox(VIEWPORT.width);
      expect(narrow.list.top).toBeGreaterThanOrEqual(narrow.row.bottom - 2);
      expect(narrow.list.left).toBeGreaterThanOrEqual(narrow.row.left);
    });

    it('a disabled option is shown, announced as unavailable, dimmed and out of a mouse’s reach, at every level', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element, ['Australia', 'Victoria']);

      for (const label of ['Antarctica', 'Tasmania', 'Geelong']) {
        const row = rowOf(element, label);
        expect(row.getAttribute('aria-disabled')).toBe('true');
        expect(row.classList.contains('p-disabled')).toBe(true);
        // Optimus's disabled row takes no pointer events, so a mouse cannot pick or open it.
        const content = find(row, '[data-pc-section="optioncontent"]', HTMLElement);
        expect(getComputedStyle(content).pointerEvents).toBe('none');
      }
      for (const label of ['Australia', 'Canada', 'Anywhere', 'Victoria', 'Melbourne']) {
        const row = rowOf(element, label);
        expect(row.hasAttribute('aria-disabled')).toBe(false);
        expect(row.classList.contains('p-disabled')).toBe(false);
      }

      await select.selectOption(['Australia', 'Victoria', 'Melbourne']);
      expect(component.value()).toBe('melbourne');
    });

    it('a disabled leaf below the first level cannot be picked by a click', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element, ['Australia', 'Victoria']);

      await userEvent.click(
        find(rowOf(element, 'Geelong'), '[data-pc-section="optioncontent"]', HTMLElement),
        { force: true },
      );

      expect(component.value()).toBeNull();
      expect(await select.isOpen()).toBe(true);
      await closeList(select, element);
    });

    it('names every row from its content: none carries an aria-label of its own text', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element, ['Australia', 'Victoria']);

      const rows = element.querySelectorAll('[role="treeitem"]');
      expect(rows.length).toBeGreaterThan(8);
      for (const row of rows) {
        expect(row.hasAttribute('aria-label')).toBe(false);
      }

      await closeList(select, element);
    });

    it('a group says whether its level is open, at every level, and a leaf says nothing', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element, ['Australia', 'Victoria']);

      for (const label of ['Australia', 'Victoria']) {
        expect(rowOf(element, label).getAttribute('aria-expanded')).toBe('true');
      }
      for (const label of ['Canada', 'New South Wales', 'Tasmania']) {
        expect(rowOf(element, label).getAttribute('aria-expanded')).toBe('false');
      }
      for (const label of ['Anywhere', 'Antarctica', 'Melbourne', 'Geelong']) {
        expect(rowOf(element, label).hasAttribute('aria-expanded')).toBe(false);
      }

      await select.openGroup('New South Wales', 2);
      await expect
        .poll(() => rowOf(element, 'Victoria').getAttribute('aria-expanded'))
        .toBe('false');
      expect(rowOf(element, 'New South Wales').getAttribute('aria-expanded')).toBe('true');

      await closeList(select, element);
    });

    it('keeps the two attributes right when the tree changes under a closed list', async () => {
      const { fixture, component, element } = await render();
      const first = await openAt(fixture, element, ['Australia', 'Victoria']);
      expect(rowOf(element, 'Geelong').getAttribute('aria-disabled')).toBe('true');
      await closeList(first, element);

      component.options.set([
        {
          label: 'Australia',
          children: [
            { label: 'Victoria', children: [{ label: 'Geelong', value: 'geelong' }] },
            { label: 'Tasmania', disabled: true, children: [{ label: 'Hobart', value: 'hobart' }] },
          ],
        },
      ]);
      await fixture.whenStable();
      const select = await openAt(fixture, element, ['Australia', 'Victoria']);

      expect(rowOf(element, 'Geelong').hasAttribute('aria-disabled')).toBe(false);
      expect(rowOf(element, 'Geelong').classList.contains('p-disabled')).toBe(false);
      expect(rowOf(element, 'Tasmania').getAttribute('aria-disabled')).toBe('true');
      expect(rowOf(element, 'Tasmania').getAttribute('aria-expanded')).toBe('false');
      expect(rowOf(element, 'Victoria').getAttribute('aria-expanded')).toBe('true');

      await closeList(select, element);
    });
  });

  describe('the model round trip', () => {
    it('keeps the open levels and the focus when the app writes a new value while the list is open', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element, ['Australia', 'Victoria']);
      const input = inputOf(element);
      input.focus();

      component.value.set('sydney');
      await fixture.whenStable();

      await expect.poll(() => select.getText()).toBe('Sydney');
      expect(openGroups(element)).toEqual(['Australia', 'Victoria']);
      expect(await select.getOptionLabels(3)).toEqual(['Melbourne', 'Geelong']);
      expect(await select.isOpen()).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(component.emitted).toEqual([]);

      await closeList(select, element);
    });

    it('reports a pick once, and the next list opens on the picked leaf with its levels intact', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element, ['Canada', 'Quebec']);

      await select.selectOption(['Canada', 'Quebec', 'Quebec City']);
      await fixture.whenStable();
      await expect.poll(() => select.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
      expect(component.emitted).toEqual(['quebec-city']);

      await openAt(fixture, element);
      await expect.poll(() => openGroups(element)).toEqual(['Canada', 'Quebec']);
      await expect.poll(() => activeRow(element)).toBe('Quebec City@3');
      expect(component.emitted).toEqual(['quebec-city']);
      expect(await select.getText()).toBe('Quebec City');

      await closeList(select, element);
    });

    it('keeps the path while the model follows navigation by keyboard, and a pick by Enter reports once', async () => {
      const { fixture, component, element } = await render();
      withMotion();
      await pointerAway();
      const select = await harnessOf(fixture);
      await select.focus();

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => select.isOpen()).toBe(true);
      await overlayOpen(element);
      await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}{ArrowRight}');
      await expect.poll(() => activeRow(element)).toBe('Melbourne@3');
      expect(openGroups(element)).toEqual(['Australia', 'Victoria']);
      expect(component.emitted).toEqual([]);

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => component.value()).toBe('melbourne');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(component.emitted).toEqual(['melbourne']);
      expect(await select.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the leaf in, and the picked leaf out', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const select = await harnessOf(fixture);
        await expect.poll(() => select.getText()).toBe('Melbourne');

        await openAt(fixture, element);
        await select.selectOption(['Canada', 'Ontario', 'Ottawa']);
        await fixture.whenStable();
        expect(component.value()).toBe('ottawa');

        component.value.set('sydney');
        await fixture.whenStable();
        await fixture.whenStable();
        await expect.poll(() => select.getText()).toBe('Sydney');
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
      it('shows an initial reactive value with no change announced, then writes in and out', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        await expect.poll(() => select.getText()).toBe('Melbourne');
        await fixture.whenStable();
        expect(component.control.value).toBe('melbourne');
        expect(component.announced).toEqual([]);
        expect(component.control.dirty).toBe(false);

        await openAt(fixture, element);
        await select.selectOption(['Canada', 'Quebec', 'Montreal']);
        expect(component.control.value).toBe('montreal');
        expect(component.control.dirty).toBe(true);
        expect(component.announced).toEqual(['montreal']);

        component.control.setValue('sydney');
        await expect.poll(() => select.getText()).toBe('Sydney');
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

      it('does not mark the control dirty for a value the form wrote, and shows the placeholder for null', async () => {
        const { fixture, component } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        await expect.poll(() => select.getText()).toBe('Melbourne');

        component.control.setValue('sydney');
        expect(component.control.dirty).toBe(false);

        component.control.setValue(null);
        await expect.poll(() => select.getText()).toBe('');
        expect(component.announced).toEqual(['sydney', null]);
      });
    });

    describe('[formField]', () => {
      it('writes the leaf in, and the picked leaf out', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const city = (await allHarnessesOf(fixture))(0);
        await expect.poll(() => city.getText()).toBe('Melbourne');

        await openAt(fixture, element);
        await city.selectOption(['Canada', 'Ontario', 'Toronto']);
        await fixture.whenStable();
        expect(component.value().city).toBe('toronto');

        component.model.city().value.set('sydney');
        await fixture.whenStable();
        await expect.poll(() => city.getText()).toBe('Sydney');
      });

      it('marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const city = (await allHarnessesOf(fixture))(0);
        expect(component.model.city().touched()).toBe(false);

        await city.focus();
        await city.blur();

        expect(component.model.city().touched()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        withMotion();
        await pointerAway();
        await bare.selectOption(['Anywhere']);
        await fixture.whenStable();
        expect(component.value().bare).toBe('anywhere');
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component, element } = await render();
      const select = await openAt(fixture, element);

      await select.selectOption(['Anywhere']);
      expect(component.value()).toBe('anywhere');

      await select.focus();
      await select.blur();
      expect(await select.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id and is named by the field label through <label for>', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
      });
      const select = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLLabelElement);

      expect(await select.getId()).toMatch(/^wj-cascadeselect-\d+$/);
      expect(label.htmlFor).toBe(await select.getId());
      expect(inputOf(element).labels).toHaveLength(1);
      expect((await select.getAriaAttributes()).labelledBy).toBeNull();
      expect(await field.getLabel()).toBe('City');
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

      expect(hostOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
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

    it('registers two controls as a group, each with its own generated id', async () => {
      const { fixture } = await renderAs(PairHost);
      const all = await allHarnessesOf(fixture);
      const field = await fieldOf(fixture);

      expect(await field.isGroup()).toBe(true);
      expect(await all(0).getId()).toMatch(/^wj-cascadeselect-\d+$/);
      expect(await all(1).getId()).toMatch(/^wj-cascadeselect-\d+$/);
      expect(await all(0).getId()).not.toBe(await all(1).getId());
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

      component.error.set('Choose a pickup city.');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(false);
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
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
      expect(aria.label).toBe('City');
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
      expect(inputOf(element).hasAttribute('aria-invalid')).toBe(false);
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
        label: 'City',
        labelledBy: 'namer',
        describedBy: 'describer',
      });
    });

    it('marks the combobox as opening a tree, expanded only while the list is open', async () => {
      const { fixture, element } = await render();
      const input = inputOf(element);
      expect(input.getAttribute('aria-haspopup')).toBe('tree');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.hasAttribute('aria-controls')).toBe(false);

      const select = await openAt(fixture, element);
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.hasAttribute('aria-controls')).toBe(true);

      await closeList(select, element);
    });

    it('Gap: aria-controls names an id that no element carries', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element);
      const controls = inputOf(element).getAttribute('aria-controls');

      expect(controls).not.toBeNull();
      expect(element.querySelector(`[id="${controls ?? ''}"]`)).toBeNull();

      await closeList(select, element);
    });

    it('gives the tree its name, and every row its level, set size and position', async () => {
      const { fixture, element } = await render();
      const select = await openAt(fixture, element, ['Australia']);

      expect(treeOf(element).getAttribute('aria-label')).toBe('Option List');
      const victoria = rowOf(element, 'Victoria');
      expect(victoria.getAttribute('aria-level')).toBe('2');
      expect(victoria.getAttribute('aria-setsize')).toBe('3');
      expect(victoria.getAttribute('aria-posinset')).toBe('2');
      expect(rowOf(element, 'Anywhere').getAttribute('aria-posinset')).toBe('4');

      await closeList(select, element);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-cascadeselect: aria-label is set on the host, where it is not forwarded to the ' +
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
        'WJ0001: wj-cascadeselect: provideWeeljack() is missing from the application providers. ' +
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

      expect(await select.getText()).toBe(PAYLOAD);
      expect(inputOf(element).getAttribute('placeholder')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload on a label at every level as text only, in the list and once picked', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set([
          {
            label: `1 ${PAYLOAD}`,
            children: [
              {
                label: `2 ${PAYLOAD}`,
                children: [{ label: `3 ${PAYLOAD}`, value: 'payload' }],
              },
            ],
          },
        ]);
      });
      const select = await openAt(fixture, element, [`1 ${PAYLOAD}`, `2 ${PAYLOAD}`]);

      for (const level of [1, 2, 3]) {
        expect(await select.getOptionLabels(level)).toEqual([`${String(level)} ${PAYLOAD}`]);
      }
      expect(element.querySelector('img')).toBeNull();

      await select.selectOption([`1 ${PAYLOAD}`, `2 ${PAYLOAD}`, `3 ${PAYLOAD}`]);
      await fixture.whenStable();
      expect(component.value()).toBe('payload');
      await expect.poll(() => select.getText()).toBe(`3 ${PAYLOAD}`);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the text it shows', async () => {
      const { fixture } = await render((host) => {
        host.value.set('melbourne');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const withText = async (text: string): Promise<number> =>
        (await loader.getAllHarnesses(WjCascadeSelectHarness.with({ text }))).length;

      await expect.poll(() => withText('Melbourne')).toBe(1);
      expect(await withText('Sydney')).toBe(0);
      expect(
        await loader.getAllHarnesses(WjCascadeSelectHarness.with({ ariaLabel: /^Ci/ })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjCascadeSelectHarness.with({ ariaLabel: 'Other' })),
      ).toHaveLength(0);
    });

    it('opens, reads the labels of each level, opens a group by label, picks by path, and closes', async () => {
      withMotion();
      await pointerAway();
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.isOpen()).toBe(false);
      expect(await select.getOptionLabels()).toEqual([]);

      await select.open();
      await expect.poll(() => select.isOpen()).toBe(true);
      await overlayOpen(element);
      expect(await select.getOptionLabels()).toEqual([
        'Australia',
        'Canada',
        'Antarctica',
        'Anywhere',
      ]);

      await select.openGroup('Canada');
      await expect.poll(() => select.getOptionLabels(2)).toEqual(['Ontario', 'Quebec']);
      await select.openGroup('Ontario', 2);
      await expect.poll(() => select.getOptionLabels(3)).toEqual(['Toronto', 'Ottawa']);

      await select.selectOption(['Canada', 'Ontario', 'Ottawa']);
      await fixture.whenStable();
      expect(component.value()).toBe('ottawa');
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.getText()).toBe('Ottawa');
    });

    it('opens the list itself to open a group or pick a leaf, and refuses an unknown label or a leaf as a group', async () => {
      withMotion();
      await pointerAway();
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);

      await select.openGroup('Australia');
      await expect.poll(() => select.isOpen()).toBe(true);
      await overlayOpen(element);
      await expect(select.openGroup('Anywhere')).rejects.toThrow('is not a group');
      await expect(select.openGroup('Nowhere')).rejects.toThrow('no row labelled');
      await expect(select.selectOption(['Australia', 'Nowhere'])).rejects.toThrow(
        'no row labelled',
      );
      await expect(select.selectOption([])).rejects.toThrow('at least one label');

      await closeList(select, element);
    });

    it('reads the state: disabled, required, invalid, the id and the focus', async () => {
      const { fixture, component } = await render((host) => {
        host.inField.set(true);
        host.required.set(true);
        host.error.set('Error');
      });
      const select = await harnessOf(fixture);

      expect(await select.isRequired()).toBe(true);
      expect(await select.isInvalid()).toBe(true);
      expect(await select.getId()).toMatch(/^wj-cascadeselect-\d+$/);
      expect(await select.isFocused()).toBe(false);

      await select.focus();
      expect(await select.isFocused()).toBe(true);
      await select.blur();
      expect(await select.isFocused()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await select.isDisabled()).toBe(true);
    });

    it('reads an empty string for the text when there is neither a pick nor a placeholder', async () => {
      const { fixture } = await render((host) => {
        host.placeholder.set(undefined);
      });
      const select = await harnessOf(fixture);

      expect(await select.getText()).toBe('');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
      });

      it('has no axe violations open at the first level, with nothing picked', async () => {
        const { fixture, element } = await render(() => undefined, scheme);
        const select = await openAt(fixture, element);

        await expectNoAxeViolations(hostOf(element));
        await closeList(select, element);
      });

      it('has no axe violations open with a group expanded, with a disabled option at each level, and a picked leaf', async () => {
        const { fixture, element } = await render((host) => {
          host.value.set('sydney');
        }, scheme);
        const select = await openAt(fixture, element, ['Australia', 'Victoria']);

        await expectNoAxeViolations(hostOf(element));
        await closeList(select, element);
      });

      it('has no axe violations open with a group expanded, beside its parent, at 960 px and wider', async () => {
        await page.viewport(1280, 800);
        const { fixture, element } = await render(() => undefined, scheme);
        const select = await openAt(fixture, element, ['Australia', 'New South Wales']);
        expect(
          getComputedStyle(find(rowOf(element, 'Australia'), '[role="group"]', HTMLElement))
            .position,
        ).toBe('absolute');

        await expectNoAxeViolations(hostOf(element));
        await closeList(select, element);
      });

      it('has no axe violations open in a field, with an error', async () => {
        const { fixture, element } = await render((host) => {
          host.inField.set(true);
          host.error.set('Choose a pickup city.');
        }, scheme);
        const select = await openAt(fixture, element, ['Canada']);

        await expectNoAxeViolations(element.querySelector('wj-field') ?? hostOf(element));
        await closeList(select, element);
      });
    });
  });

  describe('keyboard', () => {
    beforeEach(async () => {
      // The spec-wide `transition: none !important` would also stop the overlay's own motion from
      // ever ending, and the motion is part of what these specs wait for. The pointer is parked
      // away, because Optimus opens the group under it (`focusOnHover`).
      withMotion();
      await pointerAway();
    });

    /** Renders the keyboard host and focuses the first control by Tab from the button before it. */
    async function focusFirst(): Promise<
      Rendered<KeyboardHost> & { select: WjCascadeSelectHarness }
    > {
      const rendered = await renderAs(KeyboardHost);
      const select = (await allHarnessesOf(rendered.fixture))(0);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      expect(await select.isFocused()).toBe(true);
      return { ...rendered, select };
    }

    type Keyed = Rendered<KeyboardHost> & { select: WjCascadeSelectHarness };

    /** Sends one key and waits for the row the combobox points at to be `expected`. */
    async function press(keyed: Keyed, key: string, expected: string | null): Promise<void> {
      await userEvent.keyboard(key);
      await expect.poll(() => activeRow(keyed.element)).toBe(expected);
    }

    /** Opens with ArrowDown and waits for the list: nothing is focused in it yet. */
    async function openByKey(keyed: Keyed): Promise<void> {
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      expect(activeRow(keyed.element)).toBeNull();
    }

    it('Tab goes to the combobox, skips a disabled control, and moves on', async () => {
      const { element, select } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await select.isFocused()).toBe(true);
    });

    it('Down opens the list with no row focused, then focuses the first row, which opens its level', async () => {
      const keyed = await focusFirst();
      expect(await keyed.select.isOpen()).toBe(false);

      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      expect(openGroups(keyed.element)).toEqual(['Australia']);
      expect(await keyed.select.getOptionLabels(2)).toEqual([
        'New South Wales',
        'Victoria',
        'Tasmania',
      ]);

      await closeList(keyed.select, keyed.element);
    });

    it('Up opens a closed list the same way as Down', async () => {
      const keyed = await focusFirst();

      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);

      expect(activeRow(keyed.element)).toBeNull();
      await closeList(keyed.select, keyed.element);
    });

    it('Right enters the open group’s level, and Left goes back to the group and closes the level', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');

      await press(keyed, '{ArrowRight}', 'New South Wales@2');
      expect(openGroups(keyed.element)).toEqual(['Australia', 'New South Wales']);
      await press(keyed, '{ArrowDown}', 'Victoria@2');
      await press(keyed, '{ArrowRight}', 'Melbourne@3');
      expect(await keyed.select.getOptionLabels(3)).toEqual(['Melbourne', 'Geelong']);

      await press(keyed, '{ArrowLeft}', 'Victoria@2');
      expect(await keyed.select.getOptionLabels(3)).toEqual([]);
      await press(keyed, '{ArrowLeft}', 'Australia@1');
      expect(await keyed.select.getOptionLabels(2)).toEqual([]);
      await press(keyed, '{ArrowLeft}', 'Australia@1');
      expect(await keyed.select.isOpen()).toBe(true);

      await closeList(keyed.select, keyed.element);
    });

    it('Down and Up move through a level, skipping a disabled row and stopping at the ends', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      await press(keyed, '{ArrowDown}', 'Canada@1');
      await press(keyed, '{ArrowDown}', 'Anywhere@1');
      await press(keyed, '{ArrowDown}', 'Anywhere@1');
      await press(keyed, '{ArrowUp}', 'Canada@1');
      await press(keyed, '{ArrowUp}', 'Australia@1');
      await press(keyed, '{ArrowUp}', 'Australia@1');

      await press(keyed, '{ArrowRight}', 'New South Wales@2');
      await press(keyed, '{ArrowDown}', 'Victoria@2');
      await press(keyed, '{ArrowDown}', 'Victoria@2');
      await press(keyed, '{ArrowRight}', 'Melbourne@3');
      await press(keyed, '{ArrowDown}', 'Melbourne@3');
      await press(keyed, '{ArrowUp}', 'Melbourne@3');
      expect(await keyed.select.isOpen()).toBe(true);

      await closeList(keyed.select, keyed.element);
    });

    it('Enter picks the focused leaf, closes the list and keeps focus on the combobox', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      await press(keyed, '{ArrowDown}', 'Canada@1');
      await press(keyed, '{ArrowDown}', 'Anywhere@1');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => keyed.component.value()).toBe('anywhere');
      await expect.poll(() => keyed.select.isOpen()).toBe(false);
      expect(await keyed.select.getText()).toBe('Anywhere');
      expect(await keyed.select.isFocused()).toBe(true);
      await expect.poll(() => keyed.element.querySelector('[role="tree"]')).toBeNull();
    });

    it('Enter and Space on a group open or close its level, and pick nothing', async () => {
      const keyed = await focusFirst();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      expect(openGroups(keyed.element)).toEqual(['Australia']);

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => openGroups(keyed.element)).toEqual([]);
      await userEvent.keyboard(' ');
      await expect.poll(() => openGroups(keyed.element)).toEqual(['Australia']);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => openGroups(keyed.element)).toEqual([]);
      expect(keyed.component.value()).toBeNull();
      expect(await keyed.select.isOpen()).toBe(true);

      await closeList(keyed.select, keyed.element);
    });

    it('Home focuses the first row of the level and End the last, and on a leaf End also picks it', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await press(keyed, '{Home}', 'Australia@1');
      expect(openGroups(keyed.element)).toEqual(['Australia']);
      expect(keyed.component.value()).toBeNull();

      await press(keyed, '{End}', 'Anywhere@1');
      await expect.poll(() => keyed.component.value()).toBe('anywhere');
      expect(await keyed.select.getText()).toBe('Anywhere');
      expect(await keyed.select.isOpen()).toBe(true);

      await closeList(keyed.select, keyed.element);
    });

    it('Home on a first row that is a leaf picks it as End does, and the list stays open', async () => {
      const { fixture, component, element } = await render((host) => {
        host.options.set(FLAT);
      });
      const select = await harnessOf(fixture);
      await select.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => select.isOpen()).toBe(true);
      await overlayOpen(element);

      await userEvent.keyboard('{Home}');

      await expect.poll(() => component.value()).toBe('one');
      expect(await select.isOpen()).toBe(true);
      await closeList(select, element);
    });

    it('Alt+Up closes the list without picking the focused leaf', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      await press(keyed, '{ArrowDown}', 'Canada@1');
      await press(keyed, '{ArrowDown}', 'Anywhere@1');

      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');

      await expect.poll(() => keyed.select.isOpen()).toBe(false);
      expect(keyed.component.value()).toBeNull();
      await expect.poll(() => keyed.element.querySelector('[role="tree"]')).toBeNull();
    });

    it('PageDown and PageUp do nothing', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      await press(keyed, '{ArrowDown}', 'Canada@1');

      await userEvent.keyboard('{PageDown}');
      await userEvent.keyboard('{PageUp}');

      expect(activeRow(keyed.element)).toBe('Canada@1');
      expect(await keyed.select.isOpen()).toBe(true);
      expect(keyed.component.value()).toBeNull();
      await closeList(keyed.select, keyed.element);
    });

    it('a printable key focuses the first row of the level that starts with the typed letters', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await press(keyed, 'c', 'Canada@1');

      await closeList(keyed.select, keyed.element);
    });

    it('typed letters skip a disabled row', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await press(keyed, 'an', 'Anywhere@1');
      await closeList(keyed.select, keyed.element);
    });

    it('a key that matches no row focuses the first row', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);

      await press(keyed, 'z', 'Australia@1');

      await closeList(keyed.select, keyed.element);
    });

    it('Escape closes the list without picking, keeps focus on the combobox, and keeps the value', async () => {
      const keyed = await focusFirst();
      keyed.component.value.set('melbourne');
      await keyed.fixture.whenStable();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);
      await userEvent.keyboard('{ArrowDown}');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => keyed.select.isOpen()).toBe(false);
      expect(keyed.component.value()).toBe('melbourne');
      expect(await keyed.select.isFocused()).toBe(true);
      await expect.poll(() => keyed.element.querySelector('[role="tree"]')).toBeNull();
    });

    it('Tab closes the list without picking the focused row, and moves focus on', async () => {
      const keyed = await focusFirst();
      await openByKey(keyed);
      await press(keyed, '{ArrowDown}', 'Australia@1');
      await press(keyed, '{ArrowRight}', 'New South Wales@2');
      await press(keyed, '{ArrowDown}', 'Victoria@2');

      await userEvent.tab();

      expect(document.activeElement).toBe(byId(keyed.element, 'after'));
      await expect.poll(() => keyed.select.isOpen()).toBe(false);
      expect(keyed.component.value()).toBeNull();
      await expect.poll(() => keyed.element.querySelector('[role="tree"]')).toBeNull();
    });

    it('Backspace does nothing: there is no clear icon, so the value stays', async () => {
      const keyed = await focusFirst();
      keyed.component.value.set('anywhere');
      await keyed.fixture.whenStable();
      await expect.poll(() => keyed.select.getText()).toBe('Anywhere');

      await userEvent.keyboard('{Backspace}');

      expect(keyed.component.value()).toBe('anywhere');
      expect(await keyed.select.getText()).toBe('Anywhere');
      expect(await keyed.select.isOpen()).toBe(false);
    });

    it('opens on the picked leaf with its path open', async () => {
      const keyed = await focusFirst();
      keyed.component.value.set('melbourne');
      await keyed.fixture.whenStable();

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => keyed.select.isOpen()).toBe(true);
      await overlayOpen(keyed.element);

      await expect.poll(() => activeRow(keyed.element)).toBe('Melbourne@3');
      expect(openGroups(keyed.element)).toEqual(['Australia', 'Victoria']);
      await closeList(keyed.select, keyed.element);
    });

    it('does nothing on a disabled control', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const disabled = (await allHarnessesOf(fixture))(1);
      const host = element.querySelectorAll<HTMLElement>('wj-cascadeselect')[1];

      const input = host?.querySelector<HTMLElement>('[role="combobox"]');
      expect(input?.getAttribute('tabindex')).toBe('-1');
      input?.focus();
      await userEvent.keyboard('{ArrowDown}{Enter}a');

      expect(await disabled.isOpen()).toBe(false);
      expect(await disabled.getText()).toBe('');
    });
  });
});
