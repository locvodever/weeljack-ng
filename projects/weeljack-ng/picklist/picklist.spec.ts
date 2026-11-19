import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjPickList,
  WjPickListEmptySlot,
  WjPickListItemSlot,
  type WjPickListPt,
} from 'weeljack-ng/picklist';
import { WjPickListHarness } from 'weeljack-ng/picklist/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const TARGET_LIST = '.p-picklist-target-list-container .cdk-drop-list';

type Scheme = 'light' | 'dark';

interface Column {
  name: string;
  field: string;
}

const SOURCE_NAMES = ['Name', 'Email', 'Phone', 'City'];
const TARGET_NAMES = ['Country', 'Status'];

function makeColumns(names: readonly string[]): Column[] {
  return names.map((name) => ({ name, field: name.toLowerCase() }));
}

/** A consumer's template: a pick list between two buttons, with every slot a consumer can give. */
@Component({
  selector: 'wj-picklist-host',
  imports: [WjPickList, WjPickListItemSlot, WjPickListEmptySlot],
  template: `
    <button type="button" id="before">Before</button>
    <div class="frame">
      <wj-picklist
        [(source)]="source"
        [(target)]="target"
        [sourceHeader]="sourceHeader()"
        [targetHeader]="targetHeader()"
        [dataKey]="dataKey()"
        [sourceAriaLabel]="sourceAriaLabel()"
        [targetAriaLabel]="targetAriaLabel()"
        [dragdrop]="dragdrop()"
        [stripedRows]="stripedRows()"
        [showSourceControls]="showSourceControls()"
        [showTargetControls]="showTargetControls()"
        [disabled]="disabled()"
        [scrollHeight]="scrollHeight()"
        [pt]="pt()"
      >
        @if (withItem()) {
          <ng-template
            wjPickListItem
            [wjPickListItemOf]="source()"
            let-column
            let-i="index"
            let-s="selected"
            let-d="disabled"
          >
            <span
              class="item"
              [attr.data-index]="i"
              [attr.data-selected]="s"
              [attr.data-disabled]="d"
              >{{ column.name
              }}<span class="field" [class.picked]="s"> / {{ column.field }}</span></span
            >
          </ng-template>
        }
        @if (withEmpty()) {
          <ng-template wjPickListEmpty let-list="list">
            <span class="empty-text">Nothing in {{ list }}.</span>
          </ng-template>
        }
      </wj-picklist>
    </div>
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      color: var(--wj-text-color);
    }
    .frame {
      inline-size: 56rem;
    }
    button {
      min-block-size: 44px;
      min-inline-size: 44px;
    }
    .field:not(.picked) {
      color: var(--wj-text-muted-color);
    }
  `,
})
class Host {
  readonly source = signal<Column[]>(makeColumns(SOURCE_NAMES));
  readonly target = signal<Column[]>(makeColumns(TARGET_NAMES));
  readonly sourceHeader = signal<string | undefined>(undefined);
  readonly targetHeader = signal<string | undefined>(undefined);
  readonly dataKey = signal<string | undefined>(undefined);
  readonly sourceAriaLabel = signal<string | undefined>('Available columns');
  readonly targetAriaLabel = signal<string | undefined>('Visible columns');
  readonly dragdrop = signal(false);
  readonly stripedRows = signal(false);
  readonly showSourceControls = signal(true);
  readonly showTargetControls = signal(true);
  readonly disabled = signal(false);
  readonly scrollHeight = signal('14rem');
  readonly pt = signal<WjPickListPt | undefined>(undefined);
  readonly withItem = signal(false);
  readonly withEmpty = signal(false);
}

/** A consumer who writes `aria-label` on the host instead of using the inputs. */
@Component({
  selector: 'wj-picklist-aria-host',
  imports: [WjPickList],
  template: `<wj-picklist [source]="[]" [target]="[]" aria-label="Columns" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only. */
@Component({
  selector: 'wj-picklist-routed-host',
  imports: [WjPickList],
  template: `<wj-picklist [source]="[]" [target]="[]" sourceAriaLabel="A" targetAriaLabel="B" />`,
})
class RoutedHost {}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  list: WjPickListHarness;
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
  const list = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjPickListHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, '.p-picklist')).display).toBe('flex');
  expect(getComputedStyle(part(element, '.p-picklist')).fontFamily).not.toBe('');
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
  const x0 = start.left + start.width / 2;
  const y0 = start.top + start.height / 2;
  const x1 = end.left + end.width / 2;
  const y1 = end.top + end.height / 2 + 4;
  const fire = (target: EventTarget, type: string, x: number, y: number): void => {
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
  fire(from, 'mousedown', x0, y0);
  for (let step = 1; step <= 8; step++) {
    fire(document, 'mousemove', x0 + ((x1 - x0) * step) / 8, y0 + ((y1 - y0) * step) / 8);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
  fire(document, 'mouseup', x1, y1);
}

function names(columns: readonly Column[]): string[] {
  return columns.map((column) => column.name);
}

type Group = 'source-controls' | 'transfer-controls' | 'target-controls';

/** The buttons of a group, in Optimus's order. */
function buttons(element: ParentNode, group: Group): HTMLButtonElement[] {
  return Array.from(element.querySelectorAll<HTMLButtonElement>(`.p-picklist-${group} button`));
}

function labels(list: readonly HTMLButtonElement[]): (string | null)[] {
  return list.map((button) => button.getAttribute('aria-label'));
}

/** Every button, in the page order. */
function allButtons(element: ParentNode): HTMLButtonElement[] {
  return [
    ...buttons(element, 'source-controls'),
    ...buttons(element, 'transfer-controls'),
    ...buttons(element, 'target-controls'),
  ];
}

/** The two listboxes: the source, then the target. */
function listboxes(element: ParentNode): HTMLElement[] {
  return parts(element, '[role="listbox"]');
}

/** What each item template saw, in order. */
function seen(element: ParentNode, selector: string): Record<string, string | undefined>[] {
  return parts(element, selector).map((item) => Object.fromEntries(Object.entries(item.dataset)));
}

/** The documented states, each rendered and checked in both schemes. */
const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  [
    'with headers',
    (host) => {
      host.sourceHeader.set('Available columns');
      host.targetHeader.set('Visible columns');
    },
  ],
  [
    'with source items selected',
    (host) => {
      host.sourceHeader.set('Available columns');
      host.targetHeader.set('Visible columns');
    },
  ],
  [
    'striped',
    (host) => {
      host.stripedRows.set(true);
    },
  ],
  [
    'custom items',
    (host) => {
      host.withItem.set(true);
    },
  ],
  [
    'with drag and drop',
    (host) => {
      host.dragdrop.set(true);
    },
  ],
  [
    'source controls off',
    (host) => {
      host.showSourceControls.set(false);
    },
  ],
  [
    'both controls off',
    (host) => {
      host.showSourceControls.set(false);
      host.showTargetControls.set(false);
    },
  ],
  [
    'source empty',
    (host) => {
      host.source.set([]);
    },
  ],
  [
    'both lists empty',
    (host) => {
      host.source.set([]);
      host.target.set([]);
    },
  ],
  [
    'both lists empty, with the empty slot',
    (host) => {
      host.source.set([]);
      host.target.set([]);
      host.withEmpty.set(true);
    },
  ],
];

describe('WjPickList', () => {
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
    it('shows each list’s columns by their name, in order, as options of two listboxes', async () => {
      const { element, list } = await render();

      expect(await list.getSourceItemTexts()).toEqual(SOURCE_NAMES);
      expect(await list.getTargetItemTexts()).toEqual(TARGET_NAMES);
      expect(listboxes(element)).toHaveLength(2);
      expect(
        listboxes(element).every((box) => box.getAttribute('aria-multiselectable') === 'true'),
      ).toBe(true);
      expect(part(element, 'wj-picklist').style.display).toBe('');
      expect(getComputedStyle(part(element, 'wj-picklist')).display).toBe('block');
    });

    it('shows the dataKey field instead of name when dataKey is set', async () => {
      const { list } = await render('light', (host) => {
        host.dataKey.set('field');
      });

      expect(await list.getSourceItemTexts()).toEqual(SOURCE_NAMES.map((n) => n.toLowerCase()));
      expect(await list.getTargetItemTexts()).toEqual(TARGET_NAMES.map((n) => n.toLowerCase()));
    });

    it('draws each header as text above its list, and none when it is unset', async () => {
      const { element, fixture, host } = await render('light', (h) => {
        h.sourceHeader.set('Available columns');
        h.targetHeader.set('Visible columns');
      });

      expect(
        parts(element, '.p-listbox-header').map((header) => header.textContent.trim()),
      ).toEqual(['Available columns', 'Visible columns']);

      host.sourceHeader.set(undefined);
      host.targetHeader.set(undefined);
      await fixture.whenStable();
      expect(element.querySelector('.p-listbox-header')).toBeNull();
    });

    it('scrolls each list past scrollHeight, 14rem unless given', async () => {
      const { element, fixture, host } = await render();
      const containers = parts(element, '.p-listbox-list-container');

      expect(containers.map((c) => c.style.maxHeight)).toEqual(['14rem', '14rem']);

      host.scrollHeight.set('6rem');
      await fixture.whenStable();
      expect(containers.map((c) => c.style.maxHeight)).toEqual(['6rem', '6rem']);
    });

    it('shows the reorder buttons beside each list and the transfer buttons between them', async () => {
      await page.viewport(1400, 800);
      const { element } = await render();
      const [source, target] = listboxes(element);
      const transfer = part(element, '.p-picklist-transfer-controls').getBoundingClientRect();

      expect(buttons(element, 'source-controls')).toHaveLength(4);
      expect(buttons(element, 'transfer-controls')).toHaveLength(4);
      expect(buttons(element, 'target-controls')).toHaveLength(4);
      expect(transfer.left).toBeGreaterThanOrEqual(source?.getBoundingClientRect().right ?? 0);
      expect(transfer.right).toBeLessThanOrEqual(target?.getBoundingClientRect().left ?? 0);
    });

    it('stripes the rows with stripedRows', async () => {
      const { element, fixture, host } = await render();
      expect(element.querySelector('.p-listbox-striped')).toBeNull();

      host.stripedRows.set(true);
      await fixture.whenStable();
      expect(parts(element, '.p-listbox-striped')).toHaveLength(2);
    });

    it('adds drag handles to the items of both lists with dragdrop', async () => {
      const { element, fixture, host } = await render();
      expect(parts(element, '.cdk-drag-disabled')).toHaveLength(6);

      host.dragdrop.set(true);
      await fixture.whenStable();
      expect(parts(element, '.cdk-drag')).toHaveLength(6);
      expect(element.querySelector('.cdk-drag-disabled')).toBeNull();
    });

    it('turns both lists and every button off when disabled', async () => {
      const { element, fixture, host, list } = await render();
      expect(await list.isDisabled()).toBe(false);

      host.disabled.set(true);
      await fixture.whenStable();
      expect(await list.isDisabled()).toBe(true);
      expect(allButtons(element).every((button) => button.disabled)).toBe(true);
    });

    it('lays the lists side by side from 960 px, and stacks them below that', async () => {
      await page.viewport(1400, 800);
      const { element } = await render();
      const root = part(element, '.p-picklist');
      const transfer = part(element, '.p-picklist-transfer-controls');
      expect(getComputedStyle(root).flexDirection).toBe('row');
      expect(getComputedStyle(transfer).flexDirection).toBe('column');

      await page.viewport(800, 800);
      await expect.poll(() => getComputedStyle(root).flexDirection).toBe('column');
      expect(getComputedStyle(transfer).flexDirection).toBe('row');
      const [source, target] = listboxes(element);
      expect(source?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        transfer.getBoundingClientRect().top,
      );
      expect(transfer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        target?.getBoundingClientRect().top ?? 0,
      );
    });

    it('hides a list’s four reorder buttons with its show-controls input off, and never the transfer buttons', async () => {
      const { element, fixture, host } = await render();
      expect(labels(buttons(element, 'source-controls'))).toHaveLength(4);

      host.showSourceControls.set(false);
      await fixture.whenStable();
      expect(buttons(element, 'source-controls')).toHaveLength(0);
      expect(buttons(element, 'target-controls')).toHaveLength(4);
      expect(buttons(element, 'transfer-controls')).toHaveLength(4);

      host.showTargetControls.set(false);
      await fixture.whenStable();
      expect(buttons(element, 'source-controls')).toHaveLength(0);
      expect(buttons(element, 'target-controls')).toHaveLength(0);
      expect(buttons(element, 'transfer-controls')).toHaveLength(4);

      host.showSourceControls.set(true);
      host.showTargetControls.set(true);
      await fixture.whenStable();
      expect(buttons(element, 'source-controls')).toHaveLength(4);
      expect(buttons(element, 'target-controls')).toHaveLength(4);
    });

    it('still transfers with both reorder groups hidden', async () => {
      const { host, list } = await render('light', (h) => {
        h.showSourceControls.set(false);
        h.showTargetControls.set(false);
      });

      await list.selectSourceItem('Email');
      await list.moveToTarget();

      expect(names(host.source())).toEqual(['Name', 'Phone', 'City']);
      expect(names(host.target())).toEqual([...TARGET_NAMES, 'Email']);
    });

    it('renders no filter input, as it has no filter inputs', async () => {
      const { element } = await render();

      expect(element.querySelector('input')).toBeNull();
      expect(element.querySelector('[role="searchbox"]')).toBeNull();
    });
  });

  describe('transfer', () => {
    it('moves the selected source items to the target, and back, in each list’s order', async () => {
      const { host, list } = await render();

      await list.selectSourceItem('Email');
      await list.selectSourceItem('City');
      await list.moveToTarget();

      expect(await list.getSourceItemTexts()).toEqual(['Name', 'Phone']);
      expect(await list.getTargetItemTexts()).toEqual([...TARGET_NAMES, 'Email', 'City']);
      expect(names(host.source())).toEqual(['Name', 'Phone']);
      expect(names(host.target())).toEqual([...TARGET_NAMES, 'Email', 'City']);

      await list.selectTargetItem('Status');
      await list.moveToSource();

      expect(names(host.source())).toEqual(['Name', 'Phone', 'Status']);
      expect(names(host.target())).toEqual(['Country', 'Email', 'City']);
      expect(await list.getSourceItemTexts()).toEqual(names(host.source()));
      expect(await list.getTargetItemTexts()).toEqual(names(host.target()));
    });

    it('moves every item with the “all” buttons', async () => {
      const { host, list } = await render();

      await list.moveAllToTarget();
      expect(names(host.source())).toEqual([]);
      expect(names(host.target())).toEqual([...TARGET_NAMES, ...SOURCE_NAMES]);

      await list.moveAllToSource();
      expect(names(host.source())).toEqual([...TARGET_NAMES, ...SOURCE_NAMES]);
      expect(names(host.target())).toEqual([]);
    });

    it('writes new arrays to both models on every transfer (FR-9)', async () => {
      const { host, list } = await render();

      for (const move of [
        async () => {
          await list.selectSourceItem('Name');
          await list.moveToTarget();
        },
        () => list.moveAllToTarget(),
        async () => {
          await list.selectTargetItem('Name');
          await list.moveToSource();
        },
        () => list.moveAllToSource(),
      ]) {
        const [source, target] = [host.source(), host.target()];
        await move();
        expect(host.source()).not.toBe(source);
        expect(host.target()).not.toBe(target);
      }
    });

    it('never changes the arrays the app gave: they keep reference, order and freeze (FR-9)', async () => {
      const source = makeColumns(SOURCE_NAMES);
      Object.freeze(source);
      const target = makeColumns(TARGET_NAMES);
      Object.freeze(target);
      const { host, list } = await render('light', (h) => {
        h.source.set(source);
        h.target.set(target);
      });

      await list.selectSourceItem('Phone');
      await list.moveToTarget();
      await list.moveAllToSource();
      await list.selectSourceItem('Country');
      await list.moveToTarget();
      await list.moveAllToTarget();

      expect(names(source)).toEqual(SOURCE_NAMES);
      expect(names(target)).toEqual(TARGET_NAMES);
      expect(Object.isFrozen(source) && Object.isFrozen(target)).toBe(true);
      expect(host.source()).not.toBe(source);
      expect(host.target()).not.toBe(target);
    });

    it('follows new arrays the app writes to source and target', async () => {
      const { fixture, host, list } = await render();

      host.source.set(makeColumns(SOURCE_NAMES).reverse());
      host.target.set([]);
      await fixture.whenStable();

      expect(await list.getSourceItemTexts()).toEqual([...SOURCE_NAMES].reverse());
      expect(await list.getTargetItemTexts()).toEqual([]);
    });

    it('keeps the transfer buttons off until the matching list has a selection', async () => {
      const { element, list } = await render();
      const [toTarget, allToTarget, toSource, allToSource] = buttons(element, 'transfer-controls');
      expect([toTarget, toSource].map((b) => b?.disabled)).toEqual([true, true]);
      expect([allToTarget, allToSource].map((b) => b?.disabled)).toEqual([false, false]);

      expect(buttons(element, 'source-controls').every((b) => b.disabled)).toBe(true);
      expect(buttons(element, 'target-controls').every((b) => b.disabled)).toBe(true);

      await list.selectSourceItem(0);
      expect(toTarget?.disabled).toBe(false);
      expect(toSource?.disabled).toBe(true);
      expect(buttons(element, 'source-controls').every((b) => !b.disabled)).toBe(true);
      expect(buttons(element, 'target-controls').every((b) => b.disabled)).toBe(true);
    });

    it('has no filter to type into: the harness says so', async () => {
      const { list } = await render();

      await expect(list.filterSource('a')).rejects.toThrow('no source filter input');
      await expect(list.filterTarget('a')).rejects.toThrow('no target filter input');
    });

    it('transfers by dragging an item to the other list, writing new arrays', async () => {
      await page.viewport(1400, 900);
      const source = makeColumns(SOURCE_NAMES);
      Object.freeze(source);
      const target = makeColumns(TARGET_NAMES);
      Object.freeze(target);
      const { element, host } = await render('light', (h) => {
        h.source.set(source);
        h.target.set(target);
        h.dragdrop.set(true);
      });
      const [from] = parts(element, '.p-picklist-source-list-container [role="option"]');
      const onto = part(element, TARGET_LIST);
      if (from === undefined) {
        throw new Error('the list has no options');
      }

      await drag(from, onto);

      await expect.poll(() => names(host.target()).length).toBe(3);
      expect(names(host.source())).toEqual(['Email', 'Phone', 'City']);
      expect(names(host.target()).sort()).toEqual(['Country', 'Name', 'Status']);
      expect(names(source)).toEqual(SOURCE_NAMES);
      expect(names(target)).toEqual(TARGET_NAMES);
    });

    it('names the transfer buttons from the translation’s defaults', async () => {
      const { element } = await render();
      expect(labels(buttons(element, 'transfer-controls'))).toEqual([
        'Move to Target',
        'Move All to Target',
        'Move to Source',
        'Move All to Source',
      ]);
    });

    it('names the transfer buttons from a custom translation', async () => {
      const { element } = await render('light', undefined, {
        aria: {
          moveToTarget: 'Sang phải',
          moveAllToTarget: 'Tất cả sang phải',
          moveToSource: 'Sang trái',
          moveAllToSource: 'Tất cả sang trái',
        },
      });

      expect(labels(buttons(element, 'transfer-controls'))).toEqual([
        'Sang phải',
        'Tất cả sang phải',
        'Sang trái',
        'Tất cả sang trái',
      ]);
    });
  });

  describe('reorder', () => {
    it('moves the selected source item up, top, down and bottom, writing a new source only', async () => {
      const { element, host, list } = await render();
      const [up, top, down, bottom] = buttons(element, 'source-controls');
      await list.selectSourceItem('Phone');
      const target = host.target();

      let before = host.source();
      up?.click();
      await expect.poll(() => names(host.source())).toEqual(['Name', 'Phone', 'Email', 'City']);
      expect(host.source()).not.toBe(before);

      before = host.source();
      top?.click();
      await expect.poll(() => names(host.source())).toEqual(['Phone', 'Name', 'Email', 'City']);
      expect(host.source()).not.toBe(before);

      before = host.source();
      down?.click();
      await expect.poll(() => names(host.source())).toEqual(['Name', 'Phone', 'Email', 'City']);
      expect(host.source()).not.toBe(before);

      before = host.source();
      bottom?.click();
      await expect.poll(() => names(host.source())).toEqual(['Name', 'Email', 'City', 'Phone']);
      expect(host.source()).not.toBe(before);
      expect(await list.getSourceItemTexts()).toEqual(names(host.source()));
      expect(host.target()).toBe(target);
    });

    it('moves the selected target item with the target’s buttons, writing a new target only', async () => {
      const { element, host, list } = await render();
      const [up, top, down, bottom] = buttons(element, 'target-controls');
      await list.selectTargetItem('Status');
      const source = host.source();

      up?.click();
      await expect.poll(() => names(host.target())).toEqual(['Status', 'Country']);
      down?.click();
      await expect.poll(() => names(host.target())).toEqual(['Country', 'Status']);
      top?.click();
      await expect.poll(() => names(host.target())).toEqual(['Status', 'Country']);
      bottom?.click();
      await expect.poll(() => names(host.target())).toEqual(['Country', 'Status']);
      expect(host.source()).toBe(source);
    });

    it('does not change the app’s arrays when reordering (FR-9)', async () => {
      const source = makeColumns(SOURCE_NAMES);
      Object.freeze(source);
      const target = makeColumns(TARGET_NAMES);
      Object.freeze(target);
      const { element, host, list } = await render('light', (h) => {
        h.source.set(source);
        h.target.set(target);
      });
      await list.selectSourceItem('City');
      await list.selectTargetItem('Status');

      buttons(element, 'source-controls')[1]?.click();
      buttons(element, 'target-controls')[1]?.click();

      await expect.poll(() => names(host.source())[0]).toBe('City');
      await expect.poll(() => names(host.target())[0]).toBe('Status');
      expect(names(source)).toEqual(SOURCE_NAMES);
      expect(names(target)).toEqual(TARGET_NAMES);
    });

    it('reorders by dragging within a list, writing a new array and leaving the app’s one alone', async () => {
      const source = makeColumns(SOURCE_NAMES);
      Object.freeze(source);
      const { element, host } = await render('light', (h) => {
        h.source.set(source);
        h.dragdrop.set(true);
      });
      const [first, , third] = parts(element, '.p-picklist-source-list-container [role="option"]');
      if (first === undefined || third === undefined) {
        throw new Error('the list has too few options');
      }

      await drag(first, third);

      await expect.poll(() => names(host.source())).toEqual(['Email', 'Phone', 'Name', 'City']);
      expect(host.source()).not.toBe(source);
      expect(names(source)).toEqual(SOURCE_NAMES);
    });

    it('names the four reorder buttons of each list, Move Bottom included', async () => {
      const { element } = await render();
      const expected = ['Move Up', 'Move Top', 'Move Down', 'Move Bottom'];

      expect(labels(buttons(element, 'source-controls'))).toEqual(expected);
      expect(labels(buttons(element, 'target-controls'))).toEqual(expected);
    });

    it('names Move Bottom from the translation', async () => {
      const { element } = await render('light', undefined, {
        aria: { moveBottom: 'Xuống cuối' },
      });

      expect(labels(buttons(element, 'source-controls')).at(3)).toBe('Xuống cuối');
      expect(labels(buttons(element, 'target-controls')).at(3)).toBe('Xuống cuối');
    });
  });

  describe('slots', () => {
    it('renders wjPickListItem in both lists, with the item, its index, selection and disabled state', async () => {
      const { element, fixture, list } = await render('light', (h) => {
        h.withItem.set(true);
      });

      expect(await list.getSourceItemTexts()).toEqual(
        SOURCE_NAMES.map((n) => `${n} / ${n.toLowerCase()}`),
      );
      expect(await list.getTargetItemTexts()).toEqual(
        TARGET_NAMES.map((n) => `${n} / ${n.toLowerCase()}`),
      );
      const source = '.p-picklist-source-list-container .item';
      expect(seen(element, source).map((s) => s['index'])).toEqual(['0', '1', '2', '3']);
      expect(seen(element, source).every((s) => s['selected'] === 'false')).toBe(true);
      expect(seen(element, source).every((s) => s['disabled'] === 'false')).toBe(true);
      expect(
        seen(element, '.p-picklist-target-list-container .item').map((s) => s['index']),
      ).toEqual(['0', '1']);

      await list.selectSourceItem(/^Phone/);
      await fixture.whenStable();
      expect(seen(element, source).map((s) => s['selected'])).toEqual([
        'false',
        'false',
        'true',
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
      expect(parts(element, '[role="option"]').every((o) => o.dataset['option'] === 'yes')).toBe(
        true,
      );
    });

    it('names an option by the item’s field without a custom item', async () => {
      const { element } = await render();

      expect(parts(element, '[role="option"]').map((o) => o.getAttribute('aria-label'))).toEqual([
        ...SOURCE_NAMES,
        ...TARGET_NAMES,
      ]);
      expect(element.querySelector('.item')).toBeNull();
    });

    it('shows the translation’s emptyMessage in an empty list when there is no empty slot', async () => {
      const { element } = await render('light', (h) => {
        h.source.set([]);
        h.target.set([]);
      });

      expect(
        parts(element, '.p-listbox-empty-message').map((message) => message.textContent.trim()),
      ).toEqual(['No available options', 'No available options']);
    });

    it('shows a custom emptyMessage from the translation, in the list that is empty', async () => {
      const { element } = await render(
        'light',
        (h) => {
          h.target.set([]);
        },
        { emptyMessage: 'Nothing here' },
      );

      expect(
        parts(element, '.p-listbox-empty-message').map((message) => message.textContent.trim()),
      ).toEqual(['Nothing here']);
    });

    it('renders wjPickListEmpty in each empty list, with the list as its context', async () => {
      const { element, fixture, host } = await render('light', (h) => {
        h.source.set([]);
        h.withEmpty.set(true);
      });
      expect(parts(element, '.empty-text').map((e) => e.textContent)).toEqual([
        'Nothing in source.',
      ]);

      host.target.set([]);
      await fixture.whenStable();
      expect(parts(element, '.empty-text').map((e) => e.textContent)).toEqual([
        'Nothing in source.',
        'Nothing in target.',
      ]);
    });

    it('picks up an item slot added after creation, and drops one removed (unlike Optimus’s order list)', async () => {
      const { element, fixture, host } = await render();
      expect(element.querySelector('.item')).toBeNull();

      host.withItem.set(true);
      await fixture.whenStable();
      expect(parts(element, '.item')).toHaveLength(6);

      host.withItem.set(false);
      await fixture.whenStable();
      expect(element.querySelector('.item')).toBeNull();
      expect(parts(element, '[role="option"]').map((o) => o.textContent.trim())).toEqual([
        ...SOURCE_NAMES,
        ...TARGET_NAMES,
      ]);
    });
  });

  describe('pt', () => {
    it('forwards a pt object to the parts', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: { 'data-root': 'yes' },
          sourceControls: { 'data-source-controls': 'yes' },
          sourceListContainer: { 'data-source-list': 'yes' },
          transferControls: { 'data-transfer': 'yes' },
          targetListContainer: { 'data-target-list': 'yes' },
          targetControls: { 'data-target-controls': 'yes' },
          pcSourceMoveUpButton: { root: { 'data-source-up': 'yes' } },
          pcMoveToTargetButton: { root: { 'data-to-target': 'yes' } },
          pcMoveAllToSourceButton: { root: { 'data-all-to-source': 'yes' } },
          pcTargetMoveDownButton: { root: { 'data-target-down': 'yes' } },
          pcListbox: { root: { 'data-listbox': 'yes' } },
        });
      });

      expect(part(element, '.p-picklist').dataset['root']).toBe('yes');
      expect(part(element, '.p-picklist-source-controls').dataset['sourceControls']).toBe('yes');
      expect(part(element, '.p-picklist-source-list-container').dataset['sourceList']).toBe('yes');
      expect(part(element, '.p-picklist-transfer-controls').dataset['transfer']).toBe('yes');
      expect(part(element, '.p-picklist-target-list-container').dataset['targetList']).toBe('yes');
      expect(part(element, '.p-picklist-target-controls').dataset['targetControls']).toBe('yes');
      expect(part(element, '[data-source-up]').dataset['sourceUp']).toBe('yes');
      expect(part(element, '[data-to-target]').dataset['toTarget']).toBe('yes');
      expect(part(element, '[data-all-to-source]').dataset['allToSource']).toBe('yes');
      expect(part(element, '[data-target-down]').dataset['targetDown']).toBe('yes');
      expect(parts(element, 'p-listbox').every((box) => box.dataset['listbox'] === 'yes')).toBe(
        true,
      );
    });

    it('forwards the function form, and keeps the routed Move Bottom name beside a part of the same button', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({
          pcSourceMoveBottomButton: { root: { 'data-bottom': 'yes' } },
          pcListbox: { list: { 'data-list': 'yes' } },
        }));
      });

      const bottom = buttons(element, 'source-controls')[3];
      expect(bottom?.dataset['bottom']).toBe('yes');
      expect(bottom?.getAttribute('aria-label')).toBe('Move Bottom');
      expect(listboxes(element).every((box) => box.dataset['list'] === 'yes')).toBe(true);
    });
  });

  describe('ARIA', () => {
    it('routes sourceAriaLabel and targetAriaLabel onto their listboxes, and not onto the host', async () => {
      const { element } = await render();

      expect(listboxes(element).map((box) => box.getAttribute('aria-label'))).toEqual([
        'Available columns',
        'Visible columns',
      ]);
      expect(part(element, 'wj-picklist').hasAttribute('aria-label')).toBe(false);
      expect(part(element, 'wj-picklist').hasAttribute('role')).toBe(false);
    });

    it('follows a changed name, and drops it when unset', async () => {
      const { element, fixture, host } = await render();

      host.sourceAriaLabel.set('Hidden columns');
      host.targetAriaLabel.set(undefined);
      await fixture.whenStable();

      const [source, target] = listboxes(element);
      expect(source?.getAttribute('aria-label')).toBe('Hidden columns');
      expect(target?.hasAttribute('aria-label')).toBe(false);
    });

    it('warns WJ0003 once, with advice that names only the inputs it has, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-picklist: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use sourceAriaLabel and targetAriaLabel instead. ' +
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
        host.sourceHeader.set(PAYLOAD);
        host.targetHeader.set(PAYLOAD);
        host.dataKey.set(PAYLOAD);
        host.sourceAriaLabel.set(PAYLOAD);
        host.targetAriaLabel.set(PAYLOAD);
        host.scrollHeight.set(PAYLOAD);
      });

      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      expect(parts(element, '.p-listbox-header').map((h) => h.textContent.trim())).toEqual([
        PAYLOAD,
        PAYLOAD,
      ]);
      expect(listboxes(element).map((box) => box.getAttribute('aria-label'))).toEqual([
        PAYLOAD,
        PAYLOAD,
      ]);
    });

    it('renders an item’s value as text, in the default item', async () => {
      const { element } = await render('light', (h) => {
        h.source.set([{ name: PAYLOAD, field: PAYLOAD }]);
        h.target.set([{ name: PAYLOAD, field: PAYLOAD }]);
      });

      expect(element.querySelector('img')).toBeNull();
      expect(parts(element, '[role="option"]').map((o) => o.textContent.trim())).toEqual([
        PAYLOAD,
        PAYLOAD,
      ]);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an item’s value as text, in a custom item', async () => {
      const { element } = await render('light', (h) => {
        h.source.set([{ name: PAYLOAD, field: PAYLOAD }]);
        h.withItem.set(true);
      });

      expect(element.querySelector('img')).toBeNull();
      expect(part(element, '.item').textContent).toBe(`${PAYLOAD} / ${PAYLOAD}`);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders the translation’s texts as text', async () => {
      const { element } = await render(
        'light',
        (host) => {
          host.source.set([]);
        },
        { emptyMessage: PAYLOAD, aria: { moveBottom: PAYLOAD, moveToTarget: PAYLOAD } },
      );

      expect(part(element, '.p-listbox-empty-message').textContent.trim()).toBe(PAYLOAD);
      expect(buttons(element, 'source-controls')[3]?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(buttons(element, 'transfer-controls')[0]?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
    });
  });

  describe('keyboard', () => {
    const SOURCE_BOX = '.p-picklist-source-list-container [role="listbox"]';
    const TARGET_BOX = '.p-picklist-target-list-container [role="listbox"]';

    function focusedText(element: HTMLElement, box: string): string {
      const id = part(element, box).getAttribute('aria-activedescendant');
      if (id === null || id === '') {
        return '';
      }
      return (element.ownerDocument.getElementById(id)?.textContent ?? '').trim();
    }

    /** The accessible name of the focused element, or its role when it has none. */
    function focusedName(): string {
      const focused = document.activeElement;
      return (
        focused?.getAttribute('aria-label') ?? focused?.getAttribute('role') ?? focused?.id ?? ''
      );
    }

    /**
     * Focuses the list with the pointer parked on the Before button first. While a list has focus,
     * Optimus moves its focused option to the option under the pointer (`focusOnHover`), and Chrome
     * sends a hover to whatever a layout change puts under a resting pointer. A pointer an earlier
     * spec file left over an option would otherwise take the focus as soon as the list has it.
     */
    async function enter(element: HTMLElement, box: string): Promise<void> {
      const before = part(element, '#before');
      await userEvent.hover(before);
      await expect.poll(() => before.matches(':hover')).toBe(true);
      part(element, box).focus();
      await expect.poll(() => document.activeElement).toBe(part(element, box));
    }

    it.each([
      ['source', SOURCE_BOX, SOURCE_NAMES],
      ['target', TARGET_BOX, TARGET_NAMES],
    ])(
      'the %s list: arrows, Home and End move focus between its items',
      async (_name, box, items) => {
        const { element } = await render();
        await enter(element, box);

        await userEvent.keyboard('{ArrowDown}');
        await expect.poll(() => focusedText(element, box)).toBe(items[1]);
        await userEvent.keyboard('{ArrowUp}');
        await expect.poll(() => focusedText(element, box)).toBe(items[0]);
        await userEvent.keyboard('{End}');
        await expect.poll(() => focusedText(element, box)).toBe(items.at(-1));
        await userEvent.keyboard('{Home}');
        await expect.poll(() => focusedText(element, box)).toBe(items[0]);
      },
    );

    it('Space and Enter toggle the focused item of the source list', async () => {
      const { element, list } = await render();
      const toTarget = (): boolean | undefined =>
        buttons(element, 'transfer-controls')[0]?.disabled;
      await enter(element, SOURCE_BOX);

      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard(' ');
      await expect.poll(toTarget).toBe(false);
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{Enter}');
      await list.moveToTarget();

      expect(await list.getTargetItemTexts()).toEqual([...TARGET_NAMES, 'Email']);
      expect(await list.getSourceItemTexts()).toEqual(['Name', 'Phone', 'City']);
    });

    it('Space and Enter toggle the focused item of the target list', async () => {
      const { element, list } = await render();
      await enter(element, TARGET_BOX);

      await userEvent.keyboard(' ');
      await expect.poll(() => buttons(element, 'transfer-controls')[2]?.disabled).toBe(false);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => buttons(element, 'transfer-controls')[2]?.disabled).toBe(true);
      await userEvent.keyboard('{Enter}');
      await list.moveToSource();
      expect(await list.getSourceItemTexts()).toEqual([...SOURCE_NAMES, 'Country']);
    });

    it('Enter and Space on a transfer button move the selection, or everything', async () => {
      const { element, host } = await render();
      await userEvent.click(part(element, SOURCE_BOX).querySelector('[role="option"]') ?? element);
      const [toTarget, allToTarget] = buttons(element, 'transfer-controls');
      toTarget?.focus();
      await expect.poll(focusedName).toBe('Move to Target');

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => names(host.target())).toEqual([...TARGET_NAMES, 'Name']);

      allToTarget?.focus();
      await userEvent.keyboard(' ');
      await expect
        .poll(() => names(host.target()))
        .toEqual([...TARGET_NAMES, 'Name', 'Email', 'Phone', 'City']);

      const [, , toSource, allToSource] = buttons(element, 'transfer-controls');
      allToSource?.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => names(host.target())).toEqual([]);
      expect(toSource?.disabled).toBe(true);
    });

    it.each([
      ['source', 'source-controls', 'Phone', ['Name', 'Phone', 'Email', 'City']],
      ['target', 'target-controls', 'Status', ['Status', 'Country']],
    ] as const)(
      'Enter and Space on a %s reorder button move the selected item',
      async (side, group, item, afterUp) => {
        const { element, host, list } = await render();
        if (side === 'source') {
          await list.selectSourceItem(item);
        } else {
          await list.selectTargetItem(item);
        }
        const [up, , down] = buttons(element, group);
        up?.focus();
        await expect.poll(focusedName).toBe('Move Up');
        await userEvent.keyboard('{Enter}');
        const model = () => names(side === 'source' ? host.source() : host.target());
        await expect.poll(model).toEqual(afterUp);

        down?.focus();
        await userEvent.keyboard(' ');
        await expect.poll(model).toEqual(side === 'source' ? SOURCE_NAMES : TARGET_NAMES);
      },
    );

    async function tabStops(element: HTMLElement, count: number): Promise<string[]> {
      part(element, '#before').focus();
      const stops: string[] = [];
      for (let i = 0; i < count; i++) {
        await userEvent.keyboard('{Tab}');
        stops.push(focusedName());
      }
      return stops;
    }

    it('Tab visits the source list, the two “all” buttons, the target list, then leaves, with nothing selected', async () => {
      const { element } = await render();

      expect(await tabStops(element, 5)).toEqual([
        'Available columns',
        'Move All to Target',
        'Move All to Source',
        'Visible columns',
        'after',
      ]);
    });

    it('Tab visits every button, in the page order, once both lists have a selection', async () => {
      const { element, list } = await render();
      await list.selectSourceItem('Email');
      await list.selectTargetItem('Status');

      const stops = await tabStops(element, 16);
      expect(stops).toEqual([
        ...['Move Up', 'Move Top', 'Move Down', 'Move Bottom'],
        'Available columns',
        ...['Move to Target', 'Move All to Target', 'Move to Source', 'Move All to Source'],
        'Visible columns',
        ...['Move Up', 'Move Top', 'Move Down', 'Move Bottom'],
        'after',
        // Optimus leaves no hidden Tab stop after the lists (the order list has one): this is the
        // browser's own chrome, then the page again.
        '',
      ]);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s scheme', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (name, setup) => {
        const { element, list } = await render(scheme, setup);
        if (name === 'with source items selected') {
          await list.selectSourceItem('Email');
          await list.selectTargetItem('Status');
        }

        await expectNoAxeViolations(element);
      });

      // WCAG 1.4.3 exempts inactive components, but the preset dims a disabled list with its own
      // `listbox.disabled.color`, and axe cannot tell the list is inactive (its options are not
      // natively disabled). Pin that this is the only finding: anything else still fails.
      it('has no axe violations in the disabled state, beyond the preset’s dimmed text', async () => {
        const { element, list } = await render(scheme, (host) => {
          host.sourceHeader.set('Available columns');
          host.targetHeader.set('Visible columns');
          host.disabled.set(true);
        });
        expect(await list.isDisabled()).toBe(true);

        const violations = await runAxe(element);

        expect(violations.filter((violation) => violation.id !== 'color-contrast')).toEqual([]);
      });

      it('has no axe violations after a transfer', async () => {
        const { element, list } = await render(scheme);
        await list.selectSourceItem('Phone');
        await list.moveToTarget();
        await list.selectTargetItem('Status');

        await expectNoAxeViolations(element);
      });

      it('has no axe violations when stacked below 960 px', async () => {
        await page.viewport(800, 900);
        const { element } = await render(scheme);

        await expectNoAxeViolations(element);
      });
    });
  });
});
