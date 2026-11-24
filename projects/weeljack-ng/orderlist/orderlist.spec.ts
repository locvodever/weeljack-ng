import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjOrderList,
  WjOrderListEmptySlot,
  WjOrderListItemSlot,
  type WjOrderListControlsPosition,
  type WjOrderListPt,
} from 'weeljack-ng/orderlist';
import { WjOrderListHarness } from 'weeljack-ng/orderlist/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Task {
  name: string;
  owner: string;
}

const NAMES = [
  'Write the brief',
  'Review the plan',
  'Book the venue',
  'Send invites',
  'Order food',
];

function makeTasks(): Task[] {
  return NAMES.map((name, index) => ({ name, owner: `Owner ${String(index + 1)}` }));
}

interface Seen {
  index: string | undefined;
  selected: string | undefined;
}

/** A consumer's template: a list between two buttons, with every slot a consumer can give. */
@Component({
  selector: 'wj-orderlist-host',
  imports: [WjOrderList, WjOrderListItemSlot, WjOrderListEmptySlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Task priority</p>
    <div class="frame">
      <wj-orderlist
        [(value)]="tasks"
        [(selection)]="selected"
        [header]="header()"
        [filterBy]="filterBy()"
        [filterPlaceholder]="filterPlaceholder()"
        [ariaFilterLabel]="ariaFilterLabel()"
        [dragdrop]="dragdrop()"
        [controlsPosition]="controlsPosition()"
        [stripedRows]="stripedRows()"
        [disabled]="disabled()"
        [scrollHeight]="scrollHeight()"
        [dataKey]="dataKey()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
      >
        @if (withItem()) {
          <ng-template
            wjOrderListItem
            [wjOrderListItemOf]="tasks()"
            let-task
            let-i="index"
            let-s="selected"
          >
            <span class="item" [attr.data-index]="i" [attr.data-selected]="s"
              >{{ task.name
              }}<span class="owner" [class.picked]="s"> / {{ task.owner }}</span></span
            >
          </ng-template>
        }
        @if (withEmpty()) {
          <ng-template wjOrderListEmpty let-filtered="filtered">
            <span class="empty-text">{{ filtered ? 'No task matches.' : 'No tasks yet.' }}</span>
          </ng-template>
        }
      </wj-orderlist>
    </div>
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      color: var(--wj-text-color);
    }
    .frame {
      inline-size: 24rem;
    }
    button {
      min-block-size: 44px;
      min-inline-size: 44px;
    }
    .owner:not(.picked) {
      color: var(--wj-text-muted-color);
    }
  `,
})
class Host {
  readonly tasks = signal<Task[]>(makeTasks());
  readonly selected = signal<Task[]>([]);
  readonly header = signal<string | undefined>(undefined);
  readonly filterBy = signal<string | undefined>(undefined);
  readonly filterPlaceholder = signal<string | undefined>(undefined);
  readonly ariaFilterLabel = signal<string | undefined>(undefined);
  readonly dragdrop = signal(false);
  readonly controlsPosition = signal<WjOrderListControlsPosition>('left');
  readonly stripedRows = signal(false);
  readonly disabled = signal(false);
  readonly scrollHeight = signal('14rem');
  readonly dataKey = signal<string | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>('Task priority');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjOrderListPt | undefined>(undefined);
  readonly withItem = signal(false);
  readonly withEmpty = signal(false);
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-orderlist-aria-host',
  imports: [WjOrderList],
  template: `<wj-orderlist [value]="[]" aria-label="Tasks" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only. */
@Component({
  selector: 'wj-orderlist-routed-host',
  imports: [WjOrderList],
  template: `<wj-orderlist [value]="tasks" ariaLabel="Tasks" />`,
})
class RoutedHost {
  readonly tasks = makeTasks();
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  list: WjOrderListHarness;
  element: HTMLElement;
}

type Translation = NonNullable<Parameters<typeof provideWeeljack>[0]>['translation'];

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
  translation: Translation = {},
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const list = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjOrderListHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, 'p-orderlist')).display).toBe('flex');
  expect(getComputedStyle(part(element, 'p-orderlist')).fontFamily).not.toBe('');
  return { fixture, host: fixture.componentInstance, list, element };
}

/** The first element matching `selector` inside `element`. */
function part(element: ParentNode, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function parts(element: ParentNode, selector: string): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>(selector));
}

/** Drags `from` onto `to` with mouse events, in steps, as CDK's drag handling needs. */
async function drag(from: HTMLElement, to: HTMLElement): Promise<void> {
  const start = from.getBoundingClientRect();
  const end = to.getBoundingClientRect();
  const x = start.left + start.width / 2;
  const y0 = start.top + start.height / 2;
  const y1 = end.top + end.height / 2 + 4;
  const fire = (target: EventTarget, type: string, y: number): void => {
    target.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 1,
        detail: 1,
      }),
    );
  };
  fire(from, 'mousedown', y0);
  for (let step = 1; step <= 8; step++) {
    fire(document, 'mousemove', y0 + ((y1 - y0) * step) / 8);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
  fire(document, 'mouseup', y1);
}

/** The app's task at `index`. */
function taskAt(host: Host, index: number): Task {
  const task = host.tasks()[index];
  if (task === undefined) {
    throw new Error(`there is no task at ${String(index)}`);
  }
  return task;
}

/** The names of the app's tasks, in order. */
function names(tasks: readonly Task[]): string[] {
  return tasks.map((task) => task.name);
}

/** What each item template saw, in order. */
function seen(element: ParentNode): Seen[] {
  return parts(element, '.item').map((item) => ({
    index: item.dataset['index'],
    selected: item.dataset['selected'],
  }));
}

/** The move buttons, in Optimus's order: up, top, down, bottom. */
function buttons(element: ParentNode): HTMLButtonElement[] {
  return Array.from(element.querySelectorAll<HTMLButtonElement>('.p-orderlist-controls button'));
}

/** The documented states, each rendered and checked in both schemes. */
const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  [
    'with a header',
    (host) => {
      host.header.set('Priority');
    },
  ],
  [
    'with items selected',
    (host) => {
      host.header.set('Priority');
      host.selected.set([taskAt(host, 1), taskAt(host, 3)]);
    },
  ],
  [
    'with a filter',
    (host) => {
      host.filterBy.set('name');
      host.filterPlaceholder.set('Filter by name');
      host.ariaFilterLabel.set('Filter tasks');
    },
  ],
  [
    'striped',
    (host) => {
      host.stripedRows.set(true);
    },
  ],
  [
    'buttons on the right',
    (host) => {
      host.controlsPosition.set('right');
    },
  ],
  [
    'custom items',
    (host) => {
      host.withItem.set(true);
      host.selected.set([taskAt(host, 0)]);
    },
  ],
  [
    'with drag and drop',
    (host) => {
      host.dragdrop.set(true);
    },
  ],
  [
    'empty',
    (host) => {
      host.tasks.set([]);
    },
  ],
  [
    'empty, with the empty slot',
    (host) => {
      host.tasks.set([]);
      host.withEmpty.set(true);
    },
  ],
  [
    'disabled',
    (host) => {
      host.header.set('Priority');
      host.disabled.set(true);
    },
  ],
  [
    'named by a visible label',
    (host) => {
      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
    },
  ],
];

describe('WjOrderList', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

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
    await page.viewport(viewport.width, viewport.height);
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('items', () => {
    it('shows each task by its name, in order, as options of one listbox', async () => {
      const { element, list } = await render();

      expect(await list.getItemTexts()).toEqual(NAMES);
      expect(part(element, '[role="listbox"]').getAttribute('aria-multiselectable')).toBe('true');
      expect(part(element, 'wj-orderlist').style.display).toBe('');
      expect(getComputedStyle(part(element, 'wj-orderlist')).display).toBe('block');
    });

    it('shows the dataKey field instead of name when dataKey is set', async () => {
      const { list } = await render('light', (host) => {
        host.dataKey.set('owner');
      });

      expect(await list.getItemTexts()).toEqual(
        NAMES.map((_unused, i) => `Owner ${String(i + 1)}`),
      );
    });

    it('draws the header as text above the list, and none when it is unset', async () => {
      const { element, fixture, host } = await render('light', (h) => {
        h.header.set('Priority');
      });

      expect(part(element, '.p-listbox-header').textContent.trim()).toBe('Priority');

      host.header.set(undefined);
      await fixture.whenStable();
      expect(element.querySelector('.p-listbox-header')).toBeNull();
    });

    it('scrolls past scrollHeight, 14rem unless given', async () => {
      const { element, fixture, host } = await render();
      const container = part(element, '.p-listbox-list-container');

      expect(container.style.maxHeight).toBe('14rem');

      host.scrollHeight.set('6rem');
      await fixture.whenStable();
      expect(container.style.maxHeight).toBe('6rem');
    });

    it('puts the buttons on the left, and on the right with controlsPosition', async () => {
      await page.viewport(1280, 800);
      const { element, fixture, host } = await render();
      const root = part(element, 'p-orderlist');
      const controls = part(element, '.p-orderlist-controls');
      const listbox = part(element, 'p-listbox');

      expect(controls.getBoundingClientRect().right).toBeLessThanOrEqual(
        listbox.getBoundingClientRect().left,
      );

      host.controlsPosition.set('right');
      await fixture.whenStable();
      expect(root.classList.contains('p-orderlist-controls-right')).toBe(true);
      expect(controls.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        listbox.getBoundingClientRect().right,
      );
    });

    it('stripes the rows with stripedRows', async () => {
      const { element, fixture, host } = await render();
      expect(element.querySelector('.p-listbox-striped')).toBeNull();

      host.stripedRows.set(true);
      await fixture.whenStable();
      expect(element.querySelector('.p-listbox-striped')).not.toBeNull();
    });

    it('adds drag handles to the items with dragdrop', async () => {
      const { element, fixture, host } = await render();
      expect(parts(element, '.cdk-drag-disabled')).toHaveLength(NAMES.length);

      host.dragdrop.set(true);
      await fixture.whenStable();
      expect(parts(element, '.cdk-drag')).toHaveLength(NAMES.length);
      expect(element.querySelector('.cdk-drag-disabled')).toBeNull();
    });

    it('turns the list and its buttons off when disabled', async () => {
      const { element, fixture, host, list } = await render('light', (h) => {
        h.selected.set([taskAt(h, 1)]);
      });
      expect(await list.isDisabled()).toBe(false);
      expect(buttons(element).every((button) => !button.disabled)).toBe(true);

      host.disabled.set(true);
      await fixture.whenStable();
      expect(await list.isDisabled()).toBe(true);
      expect(buttons(element).every((button) => button.disabled)).toBe(true);
    });

    it('lays the buttons beside the list from 960 px, and stacks them above it below that', async () => {
      await page.viewport(1280, 800);
      const { element } = await render();
      const root = part(element, 'p-orderlist');
      const controls = part(element, '.p-orderlist-controls');
      expect(getComputedStyle(root).flexDirection).toBe('row');
      expect(getComputedStyle(controls).flexDirection).toBe('column');

      await page.viewport(800, 800);
      await expect.poll(() => getComputedStyle(root).flexDirection).toBe('column');
      expect(getComputedStyle(controls).flexDirection).toBe('row');
      expect(controls.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        part(element, 'p-listbox').getBoundingClientRect().top,
      );
    });
  });

  describe('selection', () => {
    it('writes the selected items to the selection model, as the app’s own objects', async () => {
      const { host, list } = await render();
      const tasks = host.tasks();

      await list.selectItem('Send invites');
      await list.selectItem(1);

      expect(host.selected()).toHaveLength(2);
      expect(host.selected()).toContain(tasks[3]);
      expect(host.selected()).toContain(tasks[1]);
      expect(await list.getSelectedItemTexts()).toEqual(['Review the plan', 'Send invites']);

      await list.selectItem('Send invites');
      expect(host.selected()).toEqual([tasks[1]]);
    });

    it('shows the items the app puts in the selection model', async () => {
      const { fixture, host, list } = await render();

      host.selected.set([taskAt(host, 0), taskAt(host, 2)]);
      await fixture.whenStable();

      expect(await list.getSelectedItemTexts()).toEqual(['Write the brief', 'Book the venue']);
    });

    it('keeps the move buttons off until something is selected', async () => {
      const { element, fixture, host } = await render();
      expect(buttons(element).every((button) => button.disabled)).toBe(true);

      host.selected.set([taskAt(host, 0)]);
      await fixture.whenStable();
      expect(buttons(element).every((button) => !button.disabled)).toBe(true);
    });

    it('never changes the array the app gave the selection', async () => {
      const { host, list } = await render('light', (h) => {
        h.selected.set([taskAt(h, 3), taskAt(h, 1)]);
      });
      const given = host.selected();
      Object.freeze(given);

      await list.moveUp();

      expect(given.map((task) => task.name)).toEqual(['Send invites', 'Review the plan']);
      expect(host.selected()).toBe(given);
    });
  });

  describe('moving', () => {
    it('moves the selected item up, top, down and bottom, and writes a new array each time', async () => {
      const { host, list } = await render();
      await list.selectItem('Book the venue');

      let before = host.tasks();
      await list.moveUp();
      expect(names(host.tasks())).toEqual([NAMES[0], NAMES[2], NAMES[1], NAMES[3], NAMES[4]]);
      expect(host.tasks()).not.toBe(before);
      expect(await list.getItemTexts()).toEqual(names(host.tasks()));

      before = host.tasks();
      await list.moveTop();
      expect(names(host.tasks())).toEqual([NAMES[2], NAMES[0], NAMES[1], NAMES[3], NAMES[4]]);
      expect(host.tasks()).not.toBe(before);

      before = host.tasks();
      await list.moveDown();
      expect(names(host.tasks())).toEqual([NAMES[0], NAMES[2], NAMES[1], NAMES[3], NAMES[4]]);
      expect(host.tasks()).not.toBe(before);

      before = host.tasks();
      await list.moveBottom();
      expect(names(host.tasks())).toEqual([NAMES[0], NAMES[1], NAMES[3], NAMES[4], NAMES[2]]);
      expect(host.tasks()).not.toBe(before);
      expect(await list.getItemTexts()).toEqual(names(host.tasks()));
      expect(await list.getSelectedItemTexts()).toEqual(['Book the venue']);
    });

    it('moves several selected items together, keeping their order', async () => {
      const { host, list } = await render();
      await list.selectItem('Review the plan');
      await list.selectItem('Send invites');

      await list.moveTop();

      expect(names(host.tasks()).slice(0, 2)).toEqual(['Review the plan', 'Send invites']);
      expect(names(host.tasks())).toHaveLength(NAMES.length);
    });

    it('follows a new array the app writes to value', async () => {
      const { fixture, host, list } = await render();

      host.tasks.set(makeTasks().reverse());
      await fixture.whenStable();

      expect(await list.getItemTexts()).toEqual([...NAMES].reverse());
    });

    it('does not change the app’s array: it keeps its reference, its order and its freeze (FR-9)', async () => {
      const original = makeTasks();
      Object.freeze(original);
      const { host, list } = await render('light', (h) => {
        h.tasks.set(original);
      });

      await list.selectItem('Order food');
      await list.moveTop();
      await list.moveDown();
      await list.moveBottom();
      await list.moveUp();

      expect(names(original)).toEqual(NAMES);
      expect(Object.isFrozen(original)).toBe(true);
      expect(host.tasks()).not.toBe(original);
      expect(names(host.tasks())).toEqual([NAMES[0], NAMES[1], NAMES[2], NAMES[4], NAMES[3]]);
    });

    it('keeps both of two moves made before change detection runs, and leaves the app’s array alone', async () => {
      const original = makeTasks();
      Object.freeze(original);
      const { element, host, list } = await render('light', (h) => {
        h.tasks.set(original);
      });
      await list.selectItem('Order food');
      const [moveUp] = buttons(element);
      if (moveUp === undefined) {
        throw new Error('the list has no move buttons');
      }

      // Two synchronous clicks: no change detection runs between them.
      moveUp.click();
      moveUp.click();

      expect(names(host.tasks())).toEqual([NAMES[0], NAMES[1], NAMES[4], NAMES[2], NAMES[3]]);
      expect(host.tasks()).not.toBe(original);
      expect(names(original)).toEqual(NAMES);
      expect(Object.isFrozen(original)).toBe(true);
      await expect.poll(() => list.getItemTexts()).toEqual(host.tasks().map((task) => task.name));
    });

    it('reorders by dragging with dragdrop, writing a new array and leaving the app’s one alone', async () => {
      const original = makeTasks();
      Object.freeze(original);
      const { element, host } = await render('light', (h) => {
        h.tasks.set(original);
        h.dragdrop.set(true);
      });
      const [first, , third] = parts(element, '[role="option"]');
      if (first === undefined || third === undefined) {
        throw new Error('the list has too few options');
      }

      await drag(first, third);

      await expect
        .poll(() => names(host.tasks()))
        .toEqual([NAMES[1], NAMES[2], NAMES[0], NAMES[3], NAMES[4]]);
      expect(host.tasks()).not.toBe(original);
      expect(names(original)).toEqual(NAMES);
    });

    it('labels the buttons from the translation, and follows a changed translation', async () => {
      const { element } = await render('light', undefined, {
        aria: { moveUp: 'Lên', moveTop: 'Lên đầu', moveDown: 'Xuống', moveBottom: 'Xuống cuối' },
      });

      expect(buttons(element).map((button) => button.getAttribute('aria-label'))).toEqual([
        'Lên',
        'Lên đầu',
        'Xuống',
        'Xuống cuối',
      ]);
    });

    it('names the buttons "Move Up", "Move Top", "Move Down" and "Move Bottom" by default', async () => {
      const { element } = await render();

      expect(buttons(element).map((button) => button.getAttribute('aria-label'))).toEqual([
        'Move Up',
        'Move Top',
        'Move Down',
        'Move Bottom',
      ]);
    });
  });

  describe('filter', () => {
    it('shows no filter input without filterBy', async () => {
      const { list } = await render();

      await expect(list.filter('a')).rejects.toThrow('no filter input');
    });

    it('shows the filter input with its placeholder and its name, and narrows the list', async () => {
      const { element, list } = await render('light', (host) => {
        host.filterBy.set('name');
        host.filterPlaceholder.set('Filter by name');
        host.ariaFilterLabel.set('Filter tasks');
      });
      const input = part(element, '.p-listbox-header input');
      expect(input.getAttribute('placeholder')).toBe('Filter by name');
      expect(input.getAttribute('aria-label')).toBe('Filter tasks');

      await list.filter('the');

      expect(await list.getItemTexts()).toEqual([
        'Write the brief',
        'Review the plan',
        'Book the venue',
      ]);
    });

    it('searches the field filterBy names', async () => {
      const { list } = await render('light', (host) => {
        host.filterBy.set('owner');
      });

      await list.filter('Owner 4');

      expect(await list.getItemTexts()).toEqual(['Send invites']);
    });

    it('moves an item of a filtered list in the whole list', async () => {
      const { host, list } = await render('light', (h) => {
        h.filterBy.set('name');
      });
      await list.filter('the');
      await list.selectItem('Book the venue');

      await list.moveUp();

      expect(names(host.tasks())).toEqual([NAMES[0], NAMES[2], NAMES[1], NAMES[3], NAMES[4]]);
    });
  });

  describe('slots', () => {
    it('renders wjOrderListItem for each item, with the item, its index and whether it is selected', async () => {
      const { element, fixture, host, list } = await render('light', (h) => {
        h.withItem.set(true);
      });

      expect(await list.getItemTexts()).toEqual(
        NAMES.map((name, i) => `${name} / Owner ${String(i + 1)}`),
      );
      expect(seen(element).map((s) => s.index)).toEqual(['0', '1', '2', '3', '4']);
      expect(seen(element).every((s) => s.selected === 'false')).toBe(true);

      host.selected.set([taskAt(host, 2)]);
      await fixture.whenStable();
      expect(seen(element).map((s) => s.selected)).toEqual([
        'false',
        'false',
        'true',
        'false',
        'false',
      ]);
    });

    it('names an option by its content with a custom item, not by Optimus’s label of the field', async () => {
      const { element, fixture, host } = await render('light', (h) => {
        h.withItem.set(true);
      });

      expect(parts(element, '[role="option"]').every((o) => !o.hasAttribute('aria-label'))).toBe(
        true,
      );

      host.pt.set({ pcListbox: { option: { 'data-option': 'yes' } } });
      await fixture.whenStable();
      expect(part(element, '[role="option"]').dataset['option']).toBe('yes');
    });

    it('names an option by the item’s field without a custom item', async () => {
      const { element } = await render();

      expect(parts(element, '[role="option"]').map((o) => o.getAttribute('aria-label'))).toEqual(
        NAMES,
      );
    });

    it('declares Optimus’s item template only when the slot is given', async () => {
      const { element } = await render();

      expect(element.querySelector('.item')).toBeNull();
      expect(parts(element, '[role="option"] > span').map((s) => s.textContent)).toEqual(NAMES);
    });

    it('shows the translation’s messages when there is no empty slot', async () => {
      const { element, fixture, host } = await render('light', (h) => {
        h.tasks.set([]);
        h.filterBy.set('name');
      });
      expect(part(element, '.p-listbox-empty-message').textContent.trim()).toBe(
        'No available options',
      );

      host.tasks.set(makeTasks());
      await fixture.whenStable();
      const list = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjOrderListHarness);
      await list.filter('zzz');
      expect(part(element, '.p-listbox-empty-message').textContent.trim()).toBe('No results found');
    });

    it('renders wjOrderListEmpty for no items and for a filter that matches none, with its context', async () => {
      const { element, fixture, host } = await render('light', (h) => {
        h.tasks.set([]);
        h.filterBy.set('name');
        h.withEmpty.set(true);
      });
      expect(part(element, '.empty-text').textContent).toBe('No tasks yet.');

      host.tasks.set(makeTasks());
      await fixture.whenStable();
      const list = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjOrderListHarness);
      await list.filter('zzz');
      expect(part(element, '.empty-text').textContent).toBe('No task matches.');
    });
  });

  describe('pt', () => {
    it('forwards a pt object to the parts', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          host: { 'data-host': 'yes' },
          root: { 'data-root': 'yes' },
          controls: { 'data-controls': 'yes' },
          pcMoveUpButton: { root: { 'data-up': 'yes' } },
          pcMoveTopButton: { root: { 'data-top': 'yes' } },
          pcMoveDownButton: { root: { 'data-down': 'yes' } },
          pcMoveBottomButton: { root: { 'data-bottom': 'yes' } },
          pcListbox: { root: { 'data-listbox': 'yes' } },
        });
      });

      expect(part(element, 'p-orderlist').dataset['host']).toBe('yes');
      expect(part(element, 'p-orderlist').dataset['root']).toBe('yes');
      expect(part(element, '.p-orderlist-controls').dataset['controls']).toBe('yes');
      expect(part(element, '[data-pc-name="pcmoveupbutton"]').dataset['up']).toBe('yes');
      expect(part(element, '[data-pc-name="pcmovetopbutton"]').dataset['top']).toBe('yes');
      expect(part(element, '[data-pc-name="pcmovedownbutton"]').dataset['down']).toBe('yes');
      expect(part(element, '[data-pc-name="pcmovebottombutton"]').dataset['bottom']).toBe('yes');
      expect(part(element, 'p-listbox').dataset['listbox']).toBe('yes');
    });

    it('forwards the function form, and keeps the routed label reference beside a pcListbox list part', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('name');
        host.pt.set(() => ({ pcListbox: { list: { 'data-list': 'yes' } } }));
      });

      const list = part(element, '[role="listbox"]');
      expect(list.dataset['list']).toBe('yes');
      expect(list.getAttribute('aria-labelledby')).toBe('name');
    });
  });

  describe('ARIA', () => {
    it('routes ariaLabel onto the listbox, and not onto the host', async () => {
      const { element } = await render();

      expect(part(element, '[role="listbox"]').getAttribute('aria-label')).toBe('Task priority');
      expect(part(element, 'wj-orderlist').hasAttribute('aria-label')).toBe(false);
      expect(part(element, 'wj-orderlist').hasAttribute('role')).toBe(false);
    });

    it('routes ariaLabelledBy onto the listbox, and drops it again', async () => {
      const { element, fixture, host, list } = await render();

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();
      const listbox = part(element, '[role="listbox"]');
      expect(listbox.getAttribute('aria-labelledby')).toBe('name');
      expect(listbox.hasAttribute('aria-label')).toBe(false);
      expect(await list.getName()).toBe('Task priority');

      host.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      expect(listbox.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('lets the harness find a list by its name', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjOrderListHarness.with({ name: 'Task priority' })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjOrderListHarness.with({ name: /^other/ })),
      ).toHaveLength(0);
    });

    it('warns WJ0003 once, with advice that names only the inputs it has, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-orderlist: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use ariaLabel or ariaLabelledBy instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('safety', () => {
    it('renders every string input as text, never as HTML', async () => {
      const { element } = await render('light', (host) => {
        host.header.set(PAYLOAD);
        host.filterBy.set('name');
        host.filterPlaceholder.set(PAYLOAD);
        host.ariaFilterLabel.set(PAYLOAD);
        host.dataKey.set(PAYLOAD);
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
      });

      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      expect(part(element, '.p-listbox-header').textContent.trim()).toBe(PAYLOAD);
      expect(part(element, '.p-listbox-header input').getAttribute('placeholder')).toBe(PAYLOAD);
      expect(part(element, '.p-listbox-header input').getAttribute('aria-label')).toBe(PAYLOAD);
      expect(part(element, '[role="listbox"]').getAttribute('aria-label')).toBe(PAYLOAD);
      expect(part(element, '[role="listbox"]').getAttribute('aria-labelledby')).toBe(PAYLOAD);
    });

    it('renders an item’s value as text, in the default item', async () => {
      const { element } = await render('light', (h) => {
        h.tasks.set([{ name: PAYLOAD, owner: PAYLOAD }]);
      });

      expect(element.querySelector('img')).toBeNull();
      expect(part(element, '[role="option"]').textContent.trim()).toBe(PAYLOAD);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an item’s value as text, in a custom item', async () => {
      const { element } = await render('light', (h) => {
        h.tasks.set([{ name: PAYLOAD, owner: PAYLOAD }]);
        h.withItem.set(true);
      });

      expect(element.querySelector('img')).toBeNull();
      expect(part(element, '.item').textContent).toBe(`${PAYLOAD} / ${PAYLOAD}`);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders the translation’s messages as text', async () => {
      const { element } = await render(
        'light',
        (host) => {
          host.tasks.set([]);
        },
        { emptyMessage: PAYLOAD },
      );

      expect(part(element, '.p-listbox-empty-message').textContent.trim()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });
  });

  describe('keyboard', () => {
    function focusedText(element: HTMLElement): string {
      const id = part(element, '[role="listbox"]').getAttribute('aria-activedescendant');
      if (id === null || id === '') {
        return '';
      }
      return (element.ownerDocument.getElementById(id)?.textContent ?? '').trim();
    }

    /** The accessible name of the focused element, or its role when it has none. */
    function focusedName(): string {
      const focused = document.activeElement;
      return focused?.getAttribute('aria-label') ?? focused?.getAttribute('role') ?? '';
    }

    /**
     * Tabs from the button before the list into the listbox (nothing is selected), with the pointer
     * parked on that button first. While the list has focus, Optimus moves its focused option to the
     * option under the pointer (`focusOnHover`), and Chrome sends a hover to whatever a layout change
     * puts under a resting pointer: a pointer an earlier spec file left over an option would
     * otherwise take the focus once the list has it.
     */
    async function enterList(element: HTMLElement): Promise<void> {
      const before = part(element, '#before');
      await userEvent.hover(before);
      await expect.poll(() => before.matches(':hover')).toBe(true);
      before.focus();
      await userEvent.keyboard('{Tab}');
      await expect.poll(() => document.activeElement).toBe(part(element, '[role="listbox"]'));
    }

    it('Tab reaches the listbox, with focus on its first item', async () => {
      const { element } = await render();

      await enterList(element);

      await expect.poll(() => focusedText(element)).toBe(NAMES[0]);
    });

    it('ArrowDown and ArrowUp move focus between the items', async () => {
      const { element } = await render();
      await enterList(element);

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => focusedText(element)).toBe(NAMES[1]);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => focusedText(element)).toBe(NAMES[2]);
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => focusedText(element)).toBe(NAMES[1]);
    });

    it('End goes to the last item and Home to the first', async () => {
      const { element } = await render();
      await enterList(element);

      await userEvent.keyboard('{End}');
      await expect.poll(() => focusedText(element)).toBe(NAMES[4]);
      await userEvent.keyboard('{Home}');
      await expect.poll(() => focusedText(element)).toBe(NAMES[0]);
    });

    it('Space and Enter toggle the focused item', async () => {
      const { element, host, list } = await render();
      await enterList(element);

      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard(' ');
      await expect.poll(() => list.getSelectedItemTexts()).toEqual([NAMES[1]]);
      expect(host.selected().map((task) => task.name)).toEqual([NAMES[1]]);

      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => list.getSelectedItemTexts()).toEqual([NAMES[1], NAMES[2]]);

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => list.getSelectedItemTexts()).toEqual([NAMES[1]]);
    });

    it('Tab visits the move buttons, which come before the list, only once something is selected', async () => {
      const { element } = await render('light', (host) => {
        host.selected.set([taskAt(host, 1)]);
      });
      part(element, '#before').focus();

      const stops: string[] = [];
      for (let i = 0; i < 5; i++) {
        await userEvent.keyboard('{Tab}');
        stops.push(focusedName());
      }

      expect(stops).toEqual(['Move Up', 'Move Top', 'Move Down', 'Move Bottom', 'Task priority']);
    });

    it('Enter and Space on a move button move the selection', async () => {
      const { element, host } = await render('light', (h) => {
        h.selected.set([taskAt(h, 2)]);
      });
      part(element, '#before').focus();
      await userEvent.keyboard('{Tab}');
      await expect.poll(focusedName).toBe('Move Up');

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => names(host.tasks()).indexOf(NAMES[2] ?? '')).toBe(1);

      await userEvent.keyboard('{Tab}{Tab}');
      await expect.poll(focusedName).toBe('Move Down');
      await userEvent.keyboard(' ');
      await expect.poll(() => names(host.tasks()).indexOf(NAMES[2] ?? '')).toBe(2);
    });

    it('has a filter input that takes focus, but is not a stop of the Tab sequence (Optimus gap)', async () => {
      const { element } = await render('light', (host) => {
        host.filterBy.set('name');
        host.ariaFilterLabel.set('Filter tasks');
      });
      const input = part(element, '.p-listbox-header input');
      part(element, '#before').focus();

      const stops: string[] = [];
      for (let i = 0; i < 3; i++) {
        await userEvent.keyboard('{Tab}');
        stops.push(document.activeElement === input ? 'filter' : focusedName());
      }
      expect(stops).not.toContain('filter');

      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s scheme', (scheme) => {
      it.each(STATES.filter(([name]) => name !== 'disabled'))(
        'has no axe violations: %s',
        async (_name, setup) => {
          const { element } = await render(scheme, setup);

          await expectNoAxeViolations(element);
        },
      );

      // WCAG 1.4.3 exempts inactive components, but the preset dims a disabled list with its own
      // `listbox.disabled.color`, and axe cannot tell the list is inactive (its options are not
      // natively disabled). Pin that this is the only finding: anything else still fails.
      it('has no axe violations in the disabled state, beyond the preset’s dimmed text', async () => {
        const { element, list } = await render(scheme, (host) => {
          host.header.set('Priority');
          host.disabled.set(true);
        });
        expect(await list.isDisabled()).toBe(true);

        const violations = await runAxe(element);

        expect(violations.filter((violation) => violation.id !== 'color-contrast')).toEqual([]);
      });

      it('has no axe violations with a filter applied', async () => {
        const { element, list } = await render(scheme, (host) => {
          host.filterBy.set('name');
          host.ariaFilterLabel.set('Filter tasks');
          host.header.set('Priority');
        });
        await list.filter('the');

        await expectNoAxeViolations(element);
      });

      it('has no axe violations with a filter that matches nothing', async () => {
        const { element, list } = await render(scheme, (host) => {
          host.filterBy.set('name');
          host.ariaFilterLabel.set('Filter tasks');
          host.withEmpty.set(true);
        });
        await list.filter('zzz');

        await expectNoAxeViolations(element);
      });
    });
  });
});
