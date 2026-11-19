/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
} from '@angular/forms';
import {
  FormField,
  disabled as disabledRule,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { OverlayService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTreeNode, type WjTreeSelectionMode } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import * as treeselectApi from 'weeljack-ng/treeselect';
import { WjTreeSelect, type WjTreeSelectPt, type WjTreeSelectSize } from 'weeljack-ng/treeselect';
import { WjTreeSelectHarness } from 'weeljack-ng/treeselect/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** `--wj-form-field-invalid-border-color` in the light scheme. */
const INVALID_BORDER = 'rgb(220, 38, 38)';

/** Freezes the value and everything reachable from it: an app's immutable state, or a probe. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Three levels: Engineering > Platform > Infrastructure, Tooling; Design; Operations. */
function makeDepartments(): WjTreeNode[] {
  return [
    {
      key: 'eng',
      label: 'Engineering',
      children: [
        {
          key: 'platform',
          label: 'Platform',
          children: [
            { key: 'infra', label: 'Infrastructure' },
            { key: 'tooling', label: 'Tooling' },
          ],
        },
        { key: 'mobile', label: 'Mobile' },
        { key: 'data', label: 'Data' },
      ],
    },
    {
      key: 'design',
      label: 'Design',
      children: [
        { key: 'research', label: 'Research' },
        { key: 'visual', label: 'Visual' },
      ],
    },
    {
      key: 'ops',
      label: 'Operations',
      children: [
        { key: 'finance', label: 'Finance' },
        { key: 'people', label: 'People' },
      ],
    },
  ];
}

/** Deep-frozen, so any write by Optimus to the app's own nodes is a `TypeError`. */
const DEPARTMENTS = deepFreeze(makeDepartments());

const flatten = (nodes: readonly WjTreeNode[]): WjTreeNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);

/** The app's own node with this key, found in `nodes` at any depth. */
function dept(key: string, nodes: readonly WjTreeNode[] = DEPARTMENTS): WjTreeNode {
  const found = flatten(nodes).find((node) => node.key === key);
  if (found === undefined) {
    throw new Error(`no department ${key}`);
  }
  return found;
}

/** Parks the pointer in the viewport's bottom-right corner before a border or colour read. */
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

/** A consumer's template: one bare tree select, or the same inside a field. */
@Component({
  selector: 'wj-treeselect-host',
  imports: [WjField, WjTreeSelect],
  template: `
    @if (inField()) {
      <wj-field label="Department" [hint]="hint()" [error]="error()">
        <wj-treeselect
          [(value)]="value"
          [options]="options()"
          [selectionMode]="mode()"
          [pt]="pt()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [required]="required()"
          [size]="size()"
          [placeholder]="placeholder()"
        />
      </wj-field>
    } @else {
      <wj-treeselect
        ariaLabel="Department"
        [(value)]="value"
        [options]="options()"
        [selectionMode]="mode()"
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
  readonly value = signal<WjTreeNode[]>([]);
  readonly options = signal<WjTreeNode[]>(DEPARTMENTS);
  readonly mode = signal<WjTreeSelectionMode>('single');
  readonly pt = signal<WjTreeSelectPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly size = signal<WjTreeSelectSize | undefined>(undefined);
  readonly placeholder = signal<string | undefined>(undefined);
}

/** The ARIA string inputs, bound from signals. */
@Component({
  selector: 'wj-treeselect-aria-host',
  imports: [WjTreeSelect],
  template: `
    <wj-treeselect
      [options]="options"
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
    />
  `,
})
class AriaHost {
  readonly options = DEPARTMENTS;
  readonly inputId = signal<string | undefined>('mine');
  readonly ariaLabel = signal<string | undefined>('Department');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-treeselect-aria-on-host-host',
  imports: [WjTreeSelect],
  template: `<wj-treeselect aria-label="Department" [options]="options" />`,
})
class AriaOnHostHost {
  readonly options = DEPARTMENTS;
}

/** A bare tree select, for the missing-provider check. */
@Component({
  selector: 'wj-treeselect-bare-host',
  imports: [WjTreeSelect],
  template: `<wj-treeselect ariaLabel="Department" [options]="options" />`,
})
class BareHost {
  readonly options = DEPARTMENTS;
}

/** A field around a tree select with its own `inputId`, `ariaLabelledBy` and description. */
@Component({
  selector: 'wj-treeselect-own-ids-host',
  imports: [WjTreeSelect, WjField],
  template: `
    <p id="note">Note</p>
    <p id="namer">Namer</p>
    <wj-treeselect ariaLabel="Plain" inputId="plain" ariaDescribedBy="note" [options]="options" />
    <wj-field label="Department" hint="Hint" error="Error">
      <wj-treeselect
        inputId="mine"
        ariaLabelledBy="namer"
        ariaDescribedBy="note"
        [options]="options"
      />
    </wj-field>
  `,
})
class OwnIdsHost {
  readonly options = DEPARTMENTS;
}

/** `ngModel` inside a field. */
@Component({
  selector: 'wj-treeselect-ngmodel-host',
  imports: [WjField, WjTreeSelect, FormsModule],
  template: `
    <wj-field label="Department">
      <wj-treeselect [(ngModel)]="value" [options]="options" [disabled]="disabled()" />
    </wj-field>
  `,
})
class NgModelHost {
  readonly model = viewChild.required(NgModel);
  readonly options = DEPARTMENTS;
  readonly value = signal<WjTreeNode[]>([dept('mobile')]);
  readonly disabled = signal(false);
}

/** A reactive `FormControl` with an initial value, written before the inner control exists. */
@Component({
  selector: 'wj-treeselect-reactive-host',
  imports: [WjField, WjTreeSelect, ReactiveFormsModule],
  template: `
    <wj-field label="Department">
      <wj-treeselect [formControl]="control" [options]="options" />
    </wj-field>
  `,
})
class ReactiveHost {
  readonly options = DEPARTMENTS;
  readonly control = new FormControl<WjTreeNode[] | null>(
    [dept('mobile')],
    (control: AbstractControl) => Validators.required(control),
  );
}

/** Signal forms with `[formField]` inside a field, and a second one outside any field. */
@Component({
  selector: 'wj-treeselect-signal-host',
  imports: [WjField, WjTreeSelect, FormField],
  template: `
    <wj-field label="Department">
      <wj-treeselect [formField]="model.dept" [options]="options" />
    </wj-field>
    <wj-treeselect ariaLabel="Bare" [formField]="model.bare" [options]="options" />
  `,
})
class SignalHost {
  /** Not frozen: signal forms write an identity mark into every item of an array value. */
  readonly options = makeDepartments();
  readonly off = signal(false);
  readonly value = signal<{ dept: WjTreeNode[]; bare: WjTreeNode[] }>({
    dept: [dept('mobile', this.options)],
    bare: [],
  });
  readonly model = form(this.value, (path) => {
    // `required` does not read an empty array as empty in signal forms; `minLength` does.
    required(path.bare);
    minLength(path.bare, 1, { message: 'Pick one.' });
    disabledRule(path.dept, { when: () => this.off() });
  });
}

/** Two tree selects and two native buttons for the keyboard specs; the second is disabled. */
@Component({
  selector: 'wj-treeselect-keyboard-host',
  imports: [WjTreeSelect],
  template: `
    <button type="button" id="before">Before</button>
    <wj-treeselect
      ariaLabel="Department"
      placeholder="Pick a department"
      [selectionMode]="mode()"
      [(value)]="value"
      [options]="options"
    />
    <wj-treeselect ariaLabel="Disabled" disabled [options]="options" />
    <button type="button" id="after">After</button>
  `,
})
class KeyboardHost {
  readonly options = DEPARTMENTS;
  readonly mode = signal<WjTreeSelectionMode>('single');
  readonly value = signal<WjTreeNode[]>([]);
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

const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-treeselect', HTMLElement);

const comboboxOf = (element: HTMLElement): HTMLElement =>
  find(element, '[role="combobox"]', HTMLElement);

const treeOf = (element: HTMLElement): HTMLElement => find(element, '[role="tree"]', HTMLElement);

const labelOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="label"]', HTMLElement);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

const itemOf = (element: HTMLElement, key: string): HTMLElement =>
  find(element, `[role="treeitem"][data-id="${key}"]`, HTMLElement);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjTreeSelectHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjTreeSelectHarness);

/** The controls of the fixture, in document order, each addressed by index. */
async function allHarnessesOf(
  fixture: ComponentFixture<unknown>,
): Promise<(index: number) => WjTreeSelectHarness> {
  const all = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjTreeSelectHarness);
  return (index) => {
    const found = all[index];
    if (found === undefined) {
      throw new Error(`no wj-treeselect at index ${String(index)}`);
    }
    return found;
  };
}

const fieldOf = (fixture: ComponentFixture<unknown>): Promise<WjFieldHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

/**
 * Waits until the overlay is fully open: shown, its enter over, and Optimus's before-enter step
 * done, which moves focus into the panel. A shown `p-motion` with no motion class left is not
 * enough on its own: it can be true a frame before the enter starts, and a pick in that frame is
 * undone by the overlay's own late show.
 */
async function overlayOpen(element: HTMLElement): Promise<void> {
  const open = (): boolean => {
    const motion = element.querySelector<HTMLElement>('p-motion');
    const focus = document.activeElement;
    return (
      motion !== null &&
      motion.style.display !== 'none' &&
      motion.className === 'p-motion' &&
      focus !== null &&
      element.contains(focus) &&
      focus.getAttribute('role') !== 'combobox'
    );
  };
  await expect.poll(open).toBe(true);
}

/**
 * Opens the panel as a user does and waits for its enter to end. The spec-wide `transition: none`
 * would also stop the overlay's own motion from ever ending, so it goes first.
 */
async function openPanel(select: WjTreeSelectHarness, element: HTMLElement): Promise<void> {
  document.getElementById('wj-spec-no-motion')?.remove();
  await select.open();
  await overlayOpen(element);
}

/** The nth tree select of a fixture's element: where its own panel opens. */
function nth(element: HTMLElement, index: number): HTMLElement {
  const found = element.querySelectorAll<HTMLElement>('wj-treeselect')[index];
  if (found === undefined) {
    throw new Error(`no wj-treeselect at index ${String(index)}`);
  }
  return found;
}

/**
 * Opens the panel, waits for its enter to end (Optimus undoes a pick made before that), picks the
 * node, and waits for a single-mode panel to close again.
 */
async function pick(
  select: WjTreeSelectHarness,
  element: HTMLElement,
  text: string,
): Promise<void> {
  await openPanel(select, element);
  await select.selectNode(text);
  await expect.poll(() => select.isOpen()).toBe(false);
}

/** Closes an open panel and waits for its leave to end, so nothing is left open at teardown. */
async function closePanel(select: WjTreeSelectHarness, element: HTMLElement): Promise<void> {
  await select.close();
  await expect.poll(() => select.isOpen()).toBe(false);
  await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
}

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner reads
 * `window.matchMedia`. A CDP emulation would change the whole shared browser page, and with it
 * every spec file running beside this one.
 */
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

/** Records every class list `p-motion` showed while it runs; call the result to stop and read. */
function recordMotion(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('p-motion')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen].filter((name) => /enter-active|leave-active/.test(name));
  };
}

const resolvedColour = (value: string): string => {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

const mutedColour = (): string =>
  resolvedColour(
    getComputedStyle(document.documentElement).getPropertyValue('--wj-text-muted-color').trim(),
  );

/** The labels of a value, in order. */
const labels = (nodes: readonly WjTreeNode[]): (string | undefined)[] =>
  nodes.map((node) => node.label);

/** Partly checked marks in the open panel. */
const partials = (element: HTMLElement): number =>
  element.querySelectorAll('[data-p-partialchecked="true"]').length;

/** The text a combobox is named by: the elements its `aria-labelledby` points at, in order. */
function nameFrom(element: HTMLElement): string {
  return (comboboxOf(element).getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .map((id) => byId(element, id).textContent.trim())
    .join(' ');
}

const STATES: [string, (host: Host) => void][] = [
  [
    'closed with the placeholder',
    (host) => {
      host.placeholder.set('Select a department');
    },
  ],
  [
    'closed with a value',
    (host) => {
      host.value.set([dept('mobile')]);
    },
  ],
  [
    'multiple values shown',
    (host) => {
      host.mode.set('multiple');
      host.value.set([dept('mobile'), dept('data'), dept('visual')]);
    },
  ],
  [
    'disabled',
    (host) => {
      host.value.set([dept('mobile')]);
      host.disabled.set(true);
    },
  ],
  [
    'invalid',
    (host) => {
      host.placeholder.set('Select a department');
      host.invalid.set(true);
    },
  ],
  [
    'small',
    (host) => {
      host.value.set([dept('mobile')]);
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.value.set([dept('mobile')]);
      host.size.set('large');
    },
  ],
  [
    'in a field with a hint',
    (host) => {
      host.inField.set(true);
      host.placeholder.set('Select a department');
      host.hint.set('Where the request is sent.');
    },
  ],
  [
    'in a field with an error',
    (host) => {
      host.inField.set(true);
      host.placeholder.set('Select a department');
      host.error.set('Choose a department.');
    },
  ],
];

describe('WjTreeSelect', () => {
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
    // A spec closes its own panel; this only keeps one that failed from leaking into the next.
    for (const open of document.querySelectorAll('[role="combobox"][aria-expanded="true"]')) {
      open.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
    }
    await expect.poll(() => document.querySelector('[role="tree"]')).toBeNull();
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('value is two-way, an array of the app’s own nodes, and at most one in single mode', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);

      component.value.set([dept('mobile')]);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Mobile');

      await pick(select, element, 'Data');
      await fixture.whenStable();
      expect(component.value()).toHaveLength(1);
      expect(component.value()[0]).toBe(dept('data'));
      expect(await select.getValueText()).toBe('Data');
      await expect.poll(() => select.isOpen()).toBe(false);
      await expect.poll(() => document.querySelector('[role="tree"]')).toBeNull();

      component.value.set([]);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('');
    });

    it('shows a value the app set only by key, matched to the options', async () => {
      const { fixture } = await render((host) => {
        host.value.set([{ key: 'visual', label: 'Visual' }]);
      });

      expect(await (await harnessOf(fixture)).getValueText()).toBe('Visual');
    });

    it('opens the path to the picked node, and never writes to the app’s frozen nodes', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set([dept('infra')]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(await select.getNodeTexts()).toEqual([
        'Engineering',
        'Platform',
        'Infrastructure',
        'Tooling',
        'Mobile',
        'Data',
        'Design',
        'Operations',
      ]);
      expect(itemOf(element, 'infra').getAttribute('aria-selected')).toBe('true');
      for (const key of ['eng', 'platform', 'infra']) {
        const node = dept(key);
        expect(Object.isFrozen(node)).toBe(true);
        expect('parent' in node).toBe(false);
        expect('partialSelected' in node).toBe(false);
        expect(node.expanded).toBeUndefined();
      }

      await closePanel(select, element);
    });

    it('multiple mode keeps the picked nodes in an array and the panel open', async () => {
      const { fixture, component, element } = await render((host) => {
        host.mode.set('multiple');
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      await select.selectNode('Design');
      await select.expandNode('Engineering');
      await select.selectNode('Mobile');
      await fixture.whenStable();

      expect(await select.isOpen()).toBe(true);
      expect(component.value()).toHaveLength(2);
      expect(component.value()[0]).toBe(dept('design'));
      expect(component.value()[1]).toBe(dept('mobile'));
      expect(await select.getValueText()).toBe('Design, Mobile');

      await select.selectNode('Design');
      await fixture.whenStable();
      expect(component.value()).toEqual([dept('mobile')]);

      await closePanel(select, element);
    });

    it('checkbox mode picks a parent with all its children, and shows partly checked parents', async () => {
      const { fixture, component, element } = await render((host) => {
        host.mode.set('checkbox');
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      await select.expandNode('Design');
      await select.checkNode('Visual');
      await fixture.whenStable();
      expect(labels(component.value())).toEqual(['Visual']);
      expect(partials(element)).toBe(1);
      expect(itemOf(element, 'visual').getAttribute('aria-checked')).toBe('true');

      await select.checkNode('Design');
      await fixture.whenStable();
      expect(labels(component.value()).sort()).toEqual(['Design', 'Research', 'Visual']);
      expect(partials(element)).toBe(0);
      for (const node of component.value()) {
        expect(node).toBe(dept(node.key ?? ''));
      }
      expect(await select.getValueText()).toContain('Design');

      await closePanel(select, element);
    });

    it('a form write drops the partly checked marks Optimus drew, and keeps the checked nodes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.mode.set('checkbox');
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);
      await select.expandNode('Design');
      await select.checkNode('Visual');
      await fixture.whenStable();
      expect(partials(element)).toBe(1);
      await closePanel(select, element);

      component.value.set([...component.value()]);
      await fixture.whenStable();
      await openPanel(select, element);

      expect(partials(element)).toBe(0);
      expect(itemOf(element, 'visual').getAttribute('aria-checked')).toBe('true');

      await closePanel(select, element);
    });

    it('rewrites the value into the copies of a new options array', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set([dept('mobile')]);
      });
      const select = await harnessOf(fixture);
      expect(await select.getValueText()).toBe('Mobile');

      const next = deepFreeze(makeDepartments());
      component.options.set(next);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Mobile');

      await openPanel(select, element);
      expect(itemOf(element, 'mobile').getAttribute('aria-selected')).toBe('true');
      await select.selectNode('Data');
      await fixture.whenStable();
      expect(component.value()[0]).toBe(dept('data', next));
      // A single-mode pick closes the panel. The harness's `open()` skips its click while
      // `aria-expanded` is still true, so the reopen below waits for that close to end.
      await expect.poll(() => select.isOpen()).toBe(false);
      await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();

      component.options.set([{ key: 'solo', label: 'Solo' }]);
      await fixture.whenStable();
      await openPanel(select, element);
      expect(await select.getNodeTexts()).toEqual(['Solo']);

      await closePanel(select, element);
    });

    it('placeholder shows while nothing is picked and follows the bound value', async () => {
      const { fixture, component } = await render((host) => {
        host.placeholder.set('Select a department');
      });
      const select = await harnessOf(fixture);
      expect(await select.getValueText()).toBe('Select a department');

      component.value.set([dept('design')]);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe('Design');

      component.value.set([]);
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
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await select.isDisabled()).toBe(true);
    });

    it('reads a bare disabled attribute as true', async () => {
      const { fixture } = await renderAs(KeyboardHost);

      expect(await (await allHarnessesOf(fixture))(1).isDisabled()).toBe(true);
    });

    it('pt reaches the host, root, label and panel parts, and the routed attributes win over it', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'a' },
          label: { 'data-probe': 'yes', id: 'consumer-id' },
          hiddenInput: { 'data-input': 'b', 'aria-invalid': 'false' },
          panel: { 'data-panel': 'c' },
          pcTree: { root: { 'data-tree': 'd' } },
        });
        host.invalid.set(true);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(labelOf(element).getAttribute('data-probe')).toBe('yes');
      expect(labelOf(element).id).toMatch(/^wj-treeselect-value-\d+$/);
      expect(comboboxOf(element).getAttribute('data-input')).toBe('b');
      expect(comboboxOf(element).getAttribute('aria-invalid')).toBe('true');
      expect(find(element, '[data-panel="c"]', HTMLElement)).toBeDefined();
      expect(find(element, '[data-tree="d"]', HTMLElement)).toBeDefined();

      await closePanel(select, element);
    });

    it('lands a pcTree node part on the first level of nodes only: Optimus hands the nodes below no pt', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ pcTree: { node: { 'data-probe': 'node' } } });
        host.value.set([dept('infra')]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      // Pins an Optimus defect (treeselect.mjs:1048, tree.mjs:722): the nodes below level 1 get no
      // pt. The docs page lists it; a fix upstream flips the second line and this spec with it.
      expect(itemOf(element, 'eng').getAttribute('data-probe')).toBe('node');
      expect(itemOf(element, 'platform').hasAttribute('data-probe')).toBe(false);
      expect(itemOf(element, 'infra').hasAttribute('data-probe')).toBe(false);

      await closePanel(select, element);
    });

    it('keeps a consumer pt of any form on the parts the wrapper also routes into', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ dropdown: 'consumer-chevron', hiddenInput: () => ({ 'data-fn': 'y' }) });
      });

      expect(find(element, '.consumer-chevron', HTMLElement).getAttribute('aria-hidden')).toBe(
        'true',
      );
      expect(comboboxOf(element).getAttribute('data-fn')).toBe('y');
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('hides the chevron’s English-only "treeselect trigger" button from assistive tech', async () => {
      const { element } = await render();
      const chevron = find(element, '.p-treeselect-dropdown', HTMLElement);

      expect(chevron.getAttribute('aria-hidden')).toBe('true');
      expect(chevron.hasAttribute('tabindex')).toBe(false);
    });

    it('is an inline-flex host with the Optimus root stretched to its width', async () => {
      const { element } = await render();
      const host = find(element, 'wj-treeselect', HTMLElement);
      host.style.inlineSize = '320px';

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(rootOf(element).getBoundingClientRect().width).toBe(320);
    });

    it('steps the height 36 / 44 / 52 px with size, and follows the bound value', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set([dept('mobile')]);
      });
      const height = (): number => rootOf(element).getBoundingClientRect().height;
      expect(height()).toBe(44);
      expect(find(element, 'wj-treeselect', HTMLElement).getBoundingClientRect().height).toBe(44);

      component.size.set('small');
      await fixture.whenStable();
      expect(height()).toBe(36);

      component.size.set('large');
      await fixture.whenStable();
      expect(height()).toBe(52);
    });

    it('gets the label text line-height 1.5 from the root layer styles, not from the entry', async () => {
      const { element } = await render((host) => {
        host.value.set([dept('mobile')]);
      });
      const style = getComputedStyle(labelOf(element));

      expect(parseFloat(style.lineHeight)).toBe(parseFloat(style.fontSize) * 1.5);
    });

    it('draws the chevron in the muted text colour', async () => {
      const { element } = await render();

      expect(getComputedStyle(find(element, '.p-treeselect-dropdown', HTMLElement)).color).toBe(
        mutedColour(),
      );
    });

    it('truncates a long value with an ellipsis, and keeps it whole for assistive tech', async () => {
      const long = 'A very long department name that cannot fit into a narrow control';
      const { fixture, element } = await render((host) => {
        host.options.set([{ key: 'long', label: long }]);
        host.value.set([{ key: 'long', label: long }]);
      });
      find(element, 'wj-treeselect', HTMLElement).style.inlineSize = '140px';
      const label = labelOf(element);

      expect(rootOf(element).getBoundingClientRect().width).toBe(140);
      expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(await (await harnessOf(fixture)).getValueText()).toBe(long);
    });
  });

  describe('the panel', () => {
    it('opens inside the host, and Optimus services stay root internals', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(find(element, 'wj-treeselect', HTMLElement).contains(treeOf(element))).toBe(true);
      const host = fixture.debugElement.query((node) => node.name === 'wj-treeselect');
      expect(host.injector.get(OverlayService)).toBe(TestBed.inject(OverlayService));
      expect(Object.keys(treeselectApi)).toEqual(['WjTreeSelect']);

      await closePanel(select, element);
    });

    it('is at least as wide as the control, and its tree scrolls past 400 px', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set(
          deepFreeze(
            Array.from({ length: 30 }, (_, index) => ({
              key: `n${String(index)}`,
              label: `Department ${String(index)}`,
            })),
          ),
        );
      });
      find(element, 'wj-treeselect', HTMLElement).style.inlineSize = '320px';
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      const container = find(element, '[data-pc-section="treecontainer"]', HTMLElement);
      expect(
        find(element, '[data-pc-section="panel"]', HTMLElement).getBoundingClientRect().width,
      ).toBeGreaterThanOrEqual(320);
      expect(container.getBoundingClientRect().height).toBeLessThanOrEqual(400);
      expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);

      await closePanel(select, element);
    });

    it('shows the translation’s empty message, muted and padded, as the only row of an empty panel', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      const message = find(element, '[data-pc-section="emptymessage"]', HTMLElement);
      const padding = document.createElement('span');
      padding.style.padding = 'var(--wj-treeselect-empty-message-padding)';
      element.append(padding);
      expect(message.textContent.trim()).toBe('No available options');
      expect(await select.getNodeTexts()).toEqual([]);
      expect(getComputedStyle(message).color).toBe(mutedColour());
      expect(getComputedStyle(message).paddingTop).toBe(getComputedStyle(padding).paddingTop);
      expect(getComputedStyle(message).paddingLeft).toBe(getComputedStyle(padding).paddingLeft);
      expect(parseFloat(getComputedStyle(message).paddingLeft)).toBeGreaterThan(4);
      padding.remove();

      await closePanel(select, element);
    });

    it('takes the empty message from a vi override', async () => {
      const { fixture, element } = await renderAs(
        Host,
        (host) => {
          host.options.set([]);
        },
        'light',
        { translation: viLocale },
      );
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(
        find(element, '[data-pc-section="emptymessage"]', HTMLElement).textContent.trim(),
      ).toBe(viLocale.emptyMessage);

      await closePanel(select, element);
    });

    it('opens with a motion by default, and without one under reduced motion', async () => {
      const motions = async (reduce: boolean): Promise<string[]> => {
        reduceMotion(reduce);
        const { fixture, element } = await render();
        const select = await harnessOf(fixture);
        const read = recordMotion();
        await openPanel(select, element);
        await closePanel(select, element);
        const seen = read();
        TestBed.resetTestingModule();
        return seen;
      };

      expect((await motions(false)).length).toBeGreaterThan(0);
      expect(await motions(true)).toEqual([]);
    });

    it('picking a node with the mouse closes the panel and keeps focus on the combobox', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      await userEvent.click(
        find(itemOf(element, 'design'), '[data-pc-section="nodecontent"]', HTMLElement),
      );
      await fixture.whenStable();

      expect(component.value()).toEqual([dept('design')]);
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(await select.isFocused()).toBe(true);
      await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
    });

    it('draws the focus ring of a picked, focused node in the highlight colour, inside the fill', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set([dept('mobile')]);
      });
      const select = await harnessOf(fixture);
      await select.focus();
      await userEvent.keyboard('{Enter}');
      await overlayOpen(element);
      await expect.poll(() => document.activeElement).toBe(itemOf(element, 'mobile'));

      const content = find(
        itemOf(element, 'mobile'),
        '[data-pc-section="nodecontent"]',
        HTMLElement,
      );
      expect(getComputedStyle(content).outlineOffset).toBe('-3px');
      expect(getComputedStyle(content).outlineColor).toBe(
        resolvedColour('var(--wj-highlight-color)'),
      );

      await closePanel(select, element);
    });

    it('says a closed branch can open at every depth: aria-expanded is false, not missing', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set([dept('infra')]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(itemOf(element, 'design').getAttribute('aria-expanded')).toBe('false');
      expect(itemOf(element, 'eng').getAttribute('aria-expanded')).toBe('true');
      await select.expandNode('Design');
      expect(itemOf(element, 'design').getAttribute('aria-expanded')).toBe('true');
      expect(itemOf(element, 'visual').hasAttribute('aria-expanded')).toBe(false);

      await closePanel(select, element);
    });

    it('hides the panel tree’s toggles and node checkboxes at every depth, and names nodes from content', async () => {
      const { fixture, element } = await render((host) => {
        host.mode.set('checkbox');
        host.value.set([dept('infra')]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      const toggles = element.querySelectorAll('[data-pc-section="nodetogglebutton"]');
      const boxes = element.querySelectorAll('[data-pc-section="nodecontent"] > p-checkbox');
      expect(toggles.length).toBeGreaterThanOrEqual(3);
      expect(boxes.length).toBeGreaterThanOrEqual(3);
      for (const part of [...toggles, ...boxes]) {
        expect(part.getAttribute('aria-hidden')).toBe('true');
      }
      for (const item of element.querySelectorAll('[role="treeitem"]')) {
        expect(item.hasAttribute('aria-label')).toBe(false);
      }

      await select.expandNode('Design');
      for (const item of element.querySelectorAll('[role="treeitem"]')) {
        expect(item.hasAttribute('aria-label')).toBe(false);
      }

      await closePanel(select, element);
    });

    it('lists the set size, which Optimus still gets wrong inside the panel’s tree', async () => {
      const { fixture, element } = await render((host) => {
        host.value.set([dept('infra')]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      // The set size is Optimus's own child count of the node, not the number of siblings.
      expect(itemOf(element, 'infra').getAttribute('aria-setsize')).not.toBe('2');
      expect(itemOf(element, 'infra').hasAttribute('aria-expanded')).toBe(false);

      await closePanel(select, element);
    });
  });

  describe('the forms APIs, inside a real field', () => {
    describe('ngModel', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component, element } = await renderAs(NgModelHost);
        const select = await harnessOf(fixture);
        expect(await select.getValueText()).toBe('Mobile');

        await pick(select, element, 'Data');
        await fixture.whenStable();
        expect(component.value()).toEqual([dept('data')]);
        expect(component.value()[0]).toBe(dept('data'));

        component.value.set([dept('people')]);
        await fixture.whenStable();
        await fixture.whenStable();
        expect(await select.getValueText()).toBe('People');
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
        const { fixture, component, element } = await renderAs(ReactiveHost);
        const select = await harnessOf(fixture);
        expect(await select.getValueText()).toBe('Mobile');

        await pick(select, element, 'Data');
        expect(component.control.value).toEqual([dept('data')]);
        expect(component.control.value?.[0]).toBe(dept('data'));
        expect(component.control.dirty).toBe(true);

        component.control.setValue([dept('people')]);
        expect(await select.getValueText()).toBe('People');
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

        component.control.setValue([dept('people')]);

        expect(component.control.dirty).toBe(false);
      });

      it('turns a null reset into an empty array, which required treats as empty', async () => {
        const { fixture, component, element } = await renderAs(ReactiveHost);
        expect(component.control.valid).toBe(true);

        component.control.setValue(null);
        await fixture.whenStable();

        expect(await (await harnessOf(fixture)).getValueText()).toBe('');
        expect(component.control.valid).toBe(false);

        const select = await harnessOf(fixture);
        await pick(select, element, 'Design');
        expect(component.control.valid).toBe(true);

        // Picking the picked node again unpicks it, and leaves the panel open.
        await openPanel(select, element);
        await select.selectNode('Design');
        await fixture.whenStable();
        expect(component.control.value).toEqual([]);
        expect(component.control.valid).toBe(false);

        await closePanel(select, element);
      });
    });

    describe('[formField]', () => {
      it('writes the value in, and the picked value out', async () => {
        const { fixture, component, element } = await renderAs(SignalHost);
        const department = (await allHarnessesOf(fixture))(0);
        expect(await department.getValueText()).toBe('Mobile');

        await pick(department, nth(element, 0), 'Data');
        await fixture.whenStable();
        expect(component.value().dept[0]).toBe(dept('data', component.options));

        component.model.dept().value.set([dept('people', component.options)]);
        await fixture.whenStable();
        expect(await department.getValueText()).toBe('People');
      });

      it('disables the control and marks the field touched on blur', async () => {
        const { fixture, component } = await renderAs(SignalHost);
        const department = (await allHarnessesOf(fixture))(0);
        expect(component.model.dept().touched()).toBe(false);

        await department.focus();
        await department.blur();
        expect(component.model.dept().touched()).toBe(true);

        component.off.set(true);
        await fixture.whenStable();
        expect(await department.isDisabled()).toBe(true);
      });

      it('pushes the form’s invalid and required state onto a control outside a field', async () => {
        const { fixture, element } = await renderAs(SignalHost);
        const bare = (await allHarnessesOf(fixture))(1);

        expect(await bare.isRequired()).toBe(true);
        expect(await bare.isInvalid()).toBe(true);

        await pick(bare, nth(element, 1), 'Design');
        await fixture.whenStable();
        expect(await bare.isInvalid()).toBe(false);
      });
    });

    it('works with plain [(value)] and no forms module', async () => {
      const { fixture, component, element } = await render();
      const select = await harnessOf(fixture);

      await pick(select, element, 'Design');
      expect(component.value()).toEqual([dept('design')]);

      await select.focus();
      await select.blur();
      expect(await select.isFocused()).toBe(false);
    });
  });

  describe('inside a field', () => {
    it('gets a generated id and is named by the field label, then the value it shows', async () => {
      const { fixture, element } = await render((host) => {
        host.inField.set(true);
        host.value.set([dept('mobile')]);
      });
      const select = await harnessOf(fixture);
      const field = await fieldOf(fixture);
      const label = find(element, '.wj-field-label', HTMLElement);

      expect(await select.getId()).toMatch(/^wj-treeselect-\d+$/);
      expect(label.tagName).toBe('SPAN');
      expect(label.hasAttribute('for')).toBe(false);
      expect(await select.getAriaLabelledBy()).toBe(`${label.id} ${labelOf(element).id}`);
      expect(nameFrom(element)).toBe('Department Mobile');
      expect(await field.getLabel()).toBe('Department');
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
    });

    it('reads "label, value" while the value changes, and the placeholder before one', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.placeholder.set('Select a department');
      });
      expect(nameFrom(element)).toBe('Department Select a department');

      component.value.set([dept('design')]);
      await fixture.whenStable();
      expect(nameFrom(element)).toBe('Department Design');
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

      expect(find(element, 'wj-treeselect', HTMLElement).getBoundingClientRect().width).toBe(
        fieldBox.width,
      );
      expect(rootOf(element).getBoundingClientRect().width).toBe(fieldBox.width);
    });

    it('adopts its own inputId, lets a consumer ariaLabelledBy win, and merges ariaDescribedBy first', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const inField = (await allHarnessesOf(fixture))(1);
      const field = await fieldOf(fixture);

      expect(await inField.getId()).toBe('mine');
      expect(await inField.getAriaLabelledBy()).toMatch(/^namer wj-treeselect-value-\d+$/);
      expect(await inField.getAriaDescribedBy()).toMatch(
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
      expect(await select.getAriaDescribedBy()).toMatch(/^wj-field-hint-\d+$/);

      component.error.set('Error');
      await fixture.whenStable();
      expect(await select.getAriaDescribedBy()).toMatch(/^wj-field-hint-\d+ wj-field-error-\d+$/);

      component.hint.set('');
      component.error.set('');
      await fixture.whenStable();
      expect(await select.getAriaDescribedBy()).toBeNull();
    });

    it('is invalid exactly while the field shows an error, and clears aria-invalid after', async () => {
      const { fixture, component, element } = await render((host) => {
        host.inField.set(true);
        host.invalid.set(true);
      });
      const select = await harnessOf(fixture);
      expect(await select.isInvalid()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderTopColor).not.toBe(INVALID_BORDER);

      component.error.set('Choose a department.');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);
      await pointerAway();
      expect(getComputedStyle(rootOf(element)).borderTopColor).toBe(INVALID_BORDER);

      component.error.set('');
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(false);
      expect(comboboxOf(element).hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('outside a field', () => {
    it('writes no id, no aria-labelledby and no aria-describedby of its own', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);

      expect(await select.getId()).toBe('');
      expect(await select.getAriaLabelledBy()).toBeNull();
      expect(await select.getAriaDescribedBy()).toBeNull();
      expect(await select.getAriaLabel()).toBe('Department');
      expect(comboboxOf(element).hasAttribute('aria-invalid')).toBe(false);
    });

    it('keeps the consumer’s inputId and ariaDescribedBy', async () => {
      const { fixture } = await renderAs(OwnIdsHost);
      const plain = (await allHarnessesOf(fixture))(0);

      expect(await plain.getId()).toBe('plain');
      expect(await plain.getAriaDescribedBy()).toBe('note');
      expect(await plain.getAriaLabelledBy()).toBeNull();
    });

    it('follows its own invalid input for aria-invalid, and clears it again', async () => {
      const { fixture, component } = await render();
      const select = await harnessOf(fixture);

      component.invalid.set(true);
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(true);

      component.invalid.set(false);
      await fixture.whenStable();
      expect(await select.isInvalid()).toBe(false);
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
      expect(await select.getAriaLabel()).toBe('Department');
      expect(await select.getAriaLabelledBy()).toMatch(/^namer wj-treeselect-value-\d+$/);
      expect(await select.getAriaDescribedBy()).toBe('describer');
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-treeselect: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-treeselect: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
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

      expect(await select.getAriaLabel()).toBe(PAYLOAD);
      expect(await select.getAriaLabelledBy()).toMatch(/wj-treeselect-value-\d+$/);
      expect((await select.getAriaLabelledBy())?.startsWith(PAYLOAD)).toBe(true);
      expect(await select.getAriaDescribedBy()).toBe(PAYLOAD);
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

    it('renders an HTML payload on node labels, in the panel and once picked, as text only', async () => {
      const { fixture, element } = await render((host) => {
        host.options.set([{ key: 'p', label: PAYLOAD }]);
      });
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(await select.getNodeTexts()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();

      await select.selectNode(PAYLOAD);
      await fixture.whenStable();
      expect(await select.getValueText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('harness', () => {
    it('is found by aria-label and by the text it shows', async () => {
      const { fixture } = await render((host) => {
        host.value.set([dept('mobile')]);
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const byLabel = await loader.getAllHarnesses(WjTreeSelectHarness.with({ ariaLabel: /^Dep/ }));
      const byText = await loader.getAllHarnesses(
        WjTreeSelectHarness.with({ valueText: 'Mobile' }),
      );
      const none = await loader.getAllHarnesses(WjTreeSelectHarness.with({ valueText: 'Data' }));

      expect(byLabel).toHaveLength(1);
      expect(byText).toHaveLength(1);
      expect(none).toHaveLength(0);
    });

    it('opens, closes and reports the panel state', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);
      expect(await select.isOpen()).toBe(false);

      await openPanel(select, element);
      expect(await select.isOpen()).toBe(true);
      await select.open();
      expect(await select.isOpen()).toBe(true);

      await closePanel(select, element);
      expect(await select.isOpen()).toBe(false);
    });

    it('reads the visible nodes, expands a node, and refuses an unknown label', async () => {
      const { fixture, element } = await render();
      const select = await harnessOf(fixture);
      await openPanel(select, element);

      expect(await select.getNodeTexts()).toEqual(['Engineering', 'Design', 'Operations']);
      await select.expandNode('Operations');
      expect(await select.getNodeTexts()).toEqual([
        'Engineering',
        'Design',
        'Operations',
        'Finance',
        'People',
      ]);
      await select.expandNode('Finance');
      await expect(select.selectNode('Zucchini')).rejects.toThrow('no node labelled');

      await closePanel(select, element);
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
          element.querySelector('wj-field') ?? find(element, 'wj-treeselect', HTMLElement),
        );
      });

      it('has no axe violations open in single mode, with a nested value', async () => {
        const { fixture, element } = await render((host) => {
          host.value.set([dept('infra')]);
        }, scheme);
        const select = await harnessOf(fixture);
        await openPanel(select, element);

        await expectNoAxeViolations(find(element, 'wj-treeselect', HTMLElement));
        await closePanel(select, element);
      });

      it('has no axe violations open in multiple mode', async () => {
        const { fixture, element } = await render((host) => {
          host.mode.set('multiple');
          host.value.set([dept('mobile'), dept('visual')]);
        }, scheme);
        const select = await harnessOf(fixture);
        await openPanel(select, element);
        await select.expandNode('Operations');

        await expectNoAxeViolations(find(element, 'wj-treeselect', HTMLElement));
        await closePanel(select, element);
      });

      it('has no axe violations open in checkbox mode with a parent partly checked', async () => {
        const { fixture, element } = await render((host) => {
          host.mode.set('checkbox');
        }, scheme);
        const select = await harnessOf(fixture);
        await openPanel(select, element);
        await select.expandNode('Engineering');
        await select.expandNode('Platform');
        await select.checkNode('Infrastructure');
        expect(partials(element)).toBe(2);

        await expectNoAxeViolations(find(element, 'wj-treeselect', HTMLElement));
        await closePanel(select, element);
      });

      it('has no axe violations open and empty, and open inside a field with an error', async () => {
        const { fixture, element } = await render((host) => {
          host.inField.set(true);
          host.error.set('Choose a department.');
          host.options.set([]);
        }, scheme);
        const select = await harnessOf(fixture);
        await openPanel(select, element);

        await expectNoAxeViolations(find(element, 'wj-field', HTMLElement));
        await closePanel(select, element);
      });
    });
  });

  describe('keyboard', () => {
    /** Renders the keyboard host and focuses the first control by Tab from the button before it. */
    async function focusFirst(
      setup: (host: KeyboardHost) => void = () => undefined,
    ): Promise<Rendered<KeyboardHost> & { select: WjTreeSelectHarness }> {
      const rendered = await renderAs(KeyboardHost, setup);
      document.getElementById('wj-spec-no-motion')?.remove();
      const select = (await allHarnessesOf(rendered.fixture))(0);
      byId(rendered.element, 'before').focus();
      await userEvent.tab();
      expect(await select.isFocused()).toBe(true);
      return { ...rendered, select };
    }

    const focusedKey = (): string | null => document.activeElement?.getAttribute('data-id') ?? null;

    it('Tab goes to the combobox, skips a disabled control, and moves on', async () => {
      const { element, select } = await focusFirst();

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await select.isFocused()).toBe(true);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])(
      'opens the panel with %j and puts focus on its first node',
      async (key) => {
        const { element, select } = await focusFirst();

        await userEvent.keyboard(key);
        await overlayOpen(element);

        expect(await select.isOpen()).toBe(true);
        await expect.poll(focusedKey).toBe('eng');

        await closePanel(select, element);
      },
    );

    it('moves between the visible nodes with the arrow keys, opening and closing a branch', async () => {
      const { element, select } = await focusFirst();
      await userEvent.keyboard('{Enter}');
      await overlayOpen(element);
      await expect.poll(focusedKey).toBe('eng');

      await userEvent.keyboard('{ArrowDown}');
      expect(focusedKey()).toBe('design');
      await userEvent.keyboard('{ArrowUp}');
      expect(focusedKey()).toBe('eng');

      // Optimus opens a branch after a 1 ms timer: poll for it.
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => itemOf(element, 'eng').getAttribute('aria-expanded')).toBe('true');
      // It also moves focus to the first child, after the same timer.
      await expect.poll(focusedKey).toBe('platform');
      await userEvent.keyboard('{ArrowDown}');
      expect(focusedKey()).toBe('mobile');
      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(focusedKey).toBe('eng');
      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(() => itemOf(element, 'eng').getAttribute('aria-expanded')).toBe('false');

      await closePanel(select, element);
    });

    it('Enter picks the focused node in single mode, closes the panel and returns focus', async () => {
      const { fixture, element, select } = await focusFirst();
      await userEvent.keyboard('{Enter}');
      await overlayOpen(element);
      await expect.poll(focusedKey).toBe('eng');
      await userEvent.keyboard('{ArrowDown}');

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();

      await expect.poll(() => select.isOpen()).toBe(false);
      await expect.poll(() => select.isFocused()).toBe(true);
      expect(await select.getValueText()).toBe('Design');
      expect(fixture.componentInstance.value()).toEqual([dept('design')]);
    });

    it('Space picks the focused node and keeps the panel open in multiple mode', async () => {
      const { fixture, element, select } = await focusFirst((host) => {
        host.mode.set('multiple');
      });
      await userEvent.keyboard('{Enter}');
      await overlayOpen(element);
      await expect.poll(focusedKey).toBe('eng');

      await userEvent.keyboard(' ');
      await fixture.whenStable();

      expect(await select.isOpen()).toBe(true);
      expect(fixture.componentInstance.value()).toEqual([dept('eng')]);
      expect(itemOf(element, 'eng').getAttribute('aria-selected')).toBe('true');

      await closePanel(select, element);
    });

    it('Escape closes the panel without picking, and focus returns to the combobox', async () => {
      const { fixture, element, select } = await focusFirst();
      await userEvent.keyboard('{Enter}');
      await overlayOpen(element);
      await expect.poll(focusedKey).toBe('eng');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => select.isOpen()).toBe(false);
      await expect.poll(() => select.isFocused()).toBe(true);
      expect(fixture.componentInstance.value()).toEqual([]);
      await expect.poll(() => element.querySelector('[role="tree"]')).toBeNull();
    });

    it('Tab inside the open panel cycles between the tree and the combobox, and never loses focus', async () => {
      const { element, select } = await focusFirst();
      await userEvent.keyboard('{Enter}');
      await overlayOpen(element);
      await expect.poll(focusedKey).toBe('eng');

      await userEvent.tab();
      expect(await select.isFocused()).toBe(true);
      await userEvent.tab();
      expect(focusedKey()).toBe('eng');
      await userEvent.tab({ shift: true });
      expect(await select.isFocused()).toBe(true);
      expect(await select.isOpen()).toBe(true);

      await closePanel(select, element);
    });

    it('does nothing on a disabled control', async () => {
      const { fixture, element } = await renderAs(KeyboardHost);
      const disabled = (await allHarnessesOf(fixture))(1);

      await userEvent.click(find(element, 'wj-treeselect[disabled]', HTMLElement));

      expect(await disabled.isOpen()).toBe(false);
      expect(await disabled.isFocused()).toBe(false);
    });
  });
});
