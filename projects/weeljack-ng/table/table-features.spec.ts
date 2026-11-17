/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import {
  provideWeeljack,
  type WjColumnFilterType,
  type WjFilters,
  type WjLazyLoadEvent,
  type WjSortOrder,
} from 'weeljack-ng';
import { WjInputText } from 'weeljack-ng/inputtext';
import {
  WjColumn,
  WjTable,
  WjTableCaptionSlot,
  WjTableCellEditorSlot,
  WjTableEmptySlot,
  WjTableGroupHeaderSlot,
  WjTableLoadingSlot,
  WjTableRowExpansionSlot,
  WjTableSummarySlot,
  type WjTableFilterDisplay,
  type WjTablePt,
  type WjTableRowEditEvent,
  type WjTableRowExpandMode,
  type WjTableRowToggleEvent,
  type WjTableSelectionMode,
} from 'weeljack-ng/table';
import { WjTableHarness } from 'weeljack-ng/table/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

interface Order {
  id: number;
  customer: string;
  status: string;
  total: number;
}

const ORDERS: [Order, Order, Order, Order, Order] = [
  { id: 1001, customer: 'Mia Tran', status: 'Pending', total: 120 },
  { id: 1002, customer: 'Noah Pham', status: 'Shipped', total: 45 },
  { id: 1003, customer: 'Ada Nguyen', status: 'Pending', total: 300 },
  { id: 1004, customer: 'Zoe Le', status: 'Delivered', total: 8 },
  { id: 1005, customer: 'Ivy Vo', status: 'Shipped', total: 77 },
];

/** Fresh copies: the editors write into the row objects, so no spec may share them. */
const orders = (): Order[] => ORDERS.map((order) => ({ ...order }));

function manyOrders(count: number): Order[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: 2000 + index,
    customer: `Customer ${String(index + 1).padStart(2, '0')}`,
    status: 'Pending',
    total: index + 1,
  }));
}

/** A consumer's template: one table with every feature switched on by a signal. */
@Component({
  selector: 'wj-table-features-host',
  imports: [
    WjTable,
    WjColumn,
    WjTableCellEditorSlot,
    WjTableRowExpansionSlot,
    WjTableGroupHeaderSlot,
    WjTableEmptySlot,
    WjTableLoadingSlot,
    WjTableCaptionSlot,
    WjTableSummarySlot,
    WjInputText,
    FormsModule,
  ],
  template: `
    <button type="button" id="before">Before</button>
    <wj-table
      [value]="rows()"
      [(sortField)]="sortField"
      [(sortOrder)]="sortOrder"
      [paginator]="paginator()"
      [(first)]="first"
      [totalRecords]="totalRecords()"
      [selectionMode]="selectionMode()"
      [(selection)]="selection"
      [dataKey]="dataKey()"
      [(expandedRowKeys)]="expandedKeys"
      [rowExpandMode]="expandMode()"
      [(editingRowKeys)]="editingKeys"
      [groupRowsBy]="groupRowsBy()"
      [scrollable]="scrollable()"
      [scrollHeight]="scrollHeight()"
      [filterDisplay]="filterDisplay()"
      [(filters)]="filters"
      [globalFilterFields]="globalFields()"
      [lazy]="lazy()"
      [loading]="loading()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [pt]="pt()"
      (rowExpand)="log('expand', $event)"
      (rowCollapse)="log('collapse', $event)"
      (rowEditInit)="editInit($event)"
      (rowEditSave)="log('save', $event)"
      (rowEditCancel)="editCancel($event)"
      (lazyLoad)="lazyEvents.update((all) => [...all, $event])"
    >
      <wj-column
        field="id"
        header="Order"
        sortable
        [frozen]="frozenId()"
        [filterType]="idFilter()"
      />
      <wj-column field="customer" header="Customer" sortable [filterType]="customerFilter()">
        @if (editable()) {
          <ng-template wjTableCellEditor [wjTableCellEditorOf]="rows()" let-order>
            @if (textEditor()) {
              <span>{{ order.customer }}</span>
            } @else {
              <input wjInputText required aria-label="Customer" [(ngModel)]="order.customer" />
            }
          </ng-template>
        }
      </wj-column>
      <wj-column field="status" header="Status" [filterType]="statusFilter()" />
      <wj-column
        field="total"
        header="Total"
        [frozen]="frozenTotal()"
        alignFrozen="right"
        [filterType]="totalFilter()"
      />
      @if (expandable()) {
        <ng-template
          wjTableRowExpansion
          [wjTableRowExpansionOf]="rows()"
          let-order
          let-i="rowIndex"
        >
          <p class="details">Order {{ order.id }} for {{ order.customer }} (row {{ i }})</p>
        </ng-template>
      }
      @if (groupSlot()) {
        <ng-template
          wjTableGroupHeader
          [wjTableGroupHeaderOf]="rows()"
          let-order
          let-group="group"
          let-i="rowIndex"
        >
          <span class="group">{{ group }}|{{ order.customer }}|{{ i }}</span>
        </ng-template>
      }
      @if (emptySlot()) {
        <ng-template wjTableEmpty><span class="none">Nothing here</span></ng-template>
      }
      @if (loadingSlot()) {
        <ng-template wjTableLoading><span class="busy">Loading orders</span></ng-template>
      }
      @if (captionSlot()) {
        <ng-template wjTableCaption>
          <span id="caption-title">Recent orders</span>
          <span class="count">{{ rows().length }} orders</span>
        </ng-template>
      }
      @if (summarySlot()) {
        <ng-template wjTableSummary>Sum of {{ rows().length }} orders</ng-template>
      }
    </wj-table>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly table = viewChild.required<WjTable<Order>>(WjTable);

  readonly rows = signal<readonly Order[]>(orders());
  readonly sortField = signal<string | undefined>(undefined);
  readonly sortOrder = signal<WjSortOrder>(1);
  readonly paginator = signal(false);
  readonly first = signal(0);
  readonly totalRecords = signal(0);
  readonly selectionMode = signal<WjTableSelectionMode | undefined>(undefined);
  readonly selection = signal<Order[]>([]);
  readonly dataKey = signal<string | undefined>('id');
  readonly expandedKeys = signal<Record<string, boolean>>({});
  readonly expandMode = signal<WjTableRowExpandMode>('multiple');
  readonly editingKeys = signal<Record<string, boolean>>({});
  readonly groupRowsBy = signal<string | undefined>(undefined);
  readonly scrollable = signal(false);
  readonly scrollHeight = signal<string | undefined>(undefined);
  readonly filterDisplay = signal<WjTableFilterDisplay>('row');
  readonly filters = signal<WjFilters>({});
  readonly globalFields = signal<string[] | undefined>(['customer', 'status']);
  readonly lazy = signal(false);
  readonly loading = signal(false);
  readonly ariaLabel = signal<string | undefined>('Orders');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTablePt>(undefined);
  readonly frozenId = signal(false);
  readonly frozenTotal = signal(false);
  readonly idFilter = signal<WjColumnFilterType | undefined>(undefined);
  readonly customerFilter = signal<WjColumnFilterType | undefined>(undefined);
  readonly totalFilter = signal<WjColumnFilterType | undefined>(undefined);
  readonly statusFilter = signal<WjColumnFilterType | undefined>(undefined);
  readonly editable = signal(false);
  readonly textEditor = signal(false);
  readonly expandable = signal(false);
  readonly groupSlot = signal(false);
  readonly emptySlot = signal(false);
  readonly loadingSlot = signal(false);
  readonly captionSlot = signal(false);
  readonly summarySlot = signal(false);

  readonly events = signal<string[]>([]);
  readonly lazyEvents = signal<WjLazyLoadEvent[]>([]);
  private backup: Order | undefined;

  protected log(
    name: string,
    event: WjTableRowToggleEvent<Order> | WjTableRowEditEvent<Order>,
  ): void {
    this.events.update((all) => [...all, `${name}:${String(event.row.id)}`]);
  }

  protected editInit(event: WjTableRowEditEvent<Order>): void {
    // The editors write into the row, so keep a copy to restore on cancel.
    this.backup = { ...event.row };
    this.events.update((all) => [...all, `init:${String(event.row.id)}@${String(event.index)}`]);
  }

  protected editCancel(event: WjTableRowEditEvent<Order>): void {
    if (this.backup !== undefined) {
      Object.assign(event.row, this.backup);
    }
    this.log('cancel', event);
  }
}

/** A consumer who gives a row expansion but no `dataKey`. */
@Component({
  selector: 'wj-table-no-key-host',
  imports: [WjTable, WjColumn, WjTableRowExpansionSlot],
  template: `
    <wj-table [value]="rows" ariaLabel="Orders">
      <wj-column field="id" header="Order" />
      <ng-template wjTableRowExpansion>Details</ng-template>
    </wj-table>
  `,
})
class NoKeyHost {
  protected readonly rows = ORDERS;
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  table: WjTableHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
  translation: Parameters<typeof provideWeeljack>[0] extends infer O
    ? O extends { translation?: infer T }
      ? T
      : never
    : never = {},
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const table = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTableHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  const element = fixture.nativeElement as HTMLElement;
  expect(getComputedStyle(part(element, 'th')).fontWeight).toBe('600');
  return { fixture, host: fixture.componentInstance, table, element };
}

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

function nth(list: HTMLElement[], index: number): HTMLElement {
  const found = list[index];
  if (found === undefined) {
    throw new Error(`no element at index ${String(index)}`);
  }
  return found;
}

/** The data rows (not group headers, expansions or the empty row), in order. */
const dataRows = (element: ParentNode): HTMLElement[] => parts(element, 'tr[data-wj-row]');

/** The id of each data row, read from its first data cell. */
const ids = async (table: WjTableHarness): Promise<string[]> =>
  (await table.getCellTexts()).map((row) => row[0] ?? '');

const toggleOf = (row: HTMLElement): HTMLElement => part(row, 'button[aria-expanded]');

/** Optimus marks the overlay motion with classes on `p-motion`: wait until the enter is over. */
async function menuOpen(): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector('.p-datatable-filter-overlay')).not.toBeNull();
  const overlay = part(document, '.p-datatable-filter-overlay');
  await expect.poll(() => overlay.getAnimations().length).toBe(0);
  return overlay;
}

/** Closes an open filter menu with Escape and waits until it is gone, so teardown finds nothing. */
async function closeMenu(): Promise<void> {
  if (document.querySelector('.p-datatable-filter-overlay') !== null) {
    await userEvent.keyboard('{Escape}');
  }
  await expect.poll(() => document.querySelector('.p-datatable-filter-overlay')).toBeNull();
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

describe('WjTable features', () => {
  let warn: MockInstance<typeof console.warn>;
  let closeAtTeardown: (() => Promise<void>) | undefined;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    closeAtTeardown = undefined;
  });

  afterEach(async () => {
    await closeAtTeardown?.();
    await emulateReducedMotion(false);
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('selection', () => {
    it('single: a click selects the row, replaces the selection, and a second click clears it', async () => {
      const { host, table } = await render('light', (initial) => {
        initial.selectionMode.set('single');
      });

      await table.selectRow(1);
      expect(host.selection()).toEqual([ORDERS[1]]);
      expect(await table.getSelectedRowIndexes()).toEqual([1]);

      await table.selectRow(3);
      expect(host.selection()).toEqual([ORDERS[3]]);
      expect(await table.getSelectedRowIndexes()).toEqual([3]);

      await table.selectRow(3);
      expect(host.selection()).toEqual([]);
      expect(await table.getSelectedRowIndexes()).toEqual([]);
    });

    it('multiple: writes a checkbox column, and the header checkbox selects every row', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.selectionMode.set('multiple');
      });
      expect(parts(element, 'tbody p-tablecheckbox')).toHaveLength(5);
      // The header has the select-all checkbox, and the data headers are unchanged.
      expect(parts(element, 'thead p-tableheadercheckbox')).toHaveLength(1);
      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'Status', 'Total']);

      await table.selectRow(0);
      await table.selectRow(2);
      expect(host.selection()).toEqual([ORDERS[0], ORDERS[2]]);
      expect(await table.getSelectedRowIndexes()).toEqual([0, 2]);

      await table.toggleAllRows();
      expect(host.selection()).toHaveLength(5);
      expect(await table.getSelectedRowIndexes()).toEqual([0, 1, 2, 3, 4]);

      await table.toggleAllRows();
      expect(host.selection()).toEqual([]);
    });

    it('follows the selection model, and names each checkbox from the translation', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.selectionMode.set('multiple');
      });
      host.selection.set([ORDERS[3], ORDERS[4]]);
      await fixture.whenStable();

      expect(await table.getSelectedRowIndexes()).toEqual([3, 4]);
      const labels = parts(element, 'tbody p-tablecheckbox input').map((box) =>
        box.getAttribute('aria-label'),
      );
      expect(labels).toEqual([
        'Row Unselected',
        'Row Unselected',
        'Row Unselected',
        'Row Selected',
        'Row Selected',
      ]);
      const select = part(element, 'thead p-tableheadercheckbox input');
      expect(select.getAttribute('aria-label')).toBe('All items unselected');

      await table.toggleAllRows();
      expect(select.getAttribute('aria-label')).toBe('All items selected');
    });

    it('names the checkboxes from a changed translation', async () => {
      const { element } = await render(
        'light',
        (initial) => {
          initial.selectionMode.set('multiple');
        },
        { aria: { unselectRow: 'Not picked', unselectAll: 'None picked' } },
      );

      expect(part(element, 'tbody p-tablecheckbox input').getAttribute('aria-label')).toBe(
        'Not picked',
      );
      expect(part(element, 'thead p-tableheadercheckbox input').getAttribute('aria-label')).toBe(
        'None picked',
      );
    });

    it('single mode shows the first row of the model, and a row set from code is selected', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.selectionMode.set('single');
      });

      host.selection.set([ORDERS[2], ORDERS[4]]);
      await fixture.whenStable();

      expect(await table.getSelectedRowIndexes()).toEqual([2]);
    });

    it('never changes the arrays and rows the app bound: a selection comes back as a new array', async () => {
      const initial = [ORDERS[0]];
      const rows = orders();
      const { host, table } = await render('light', (setup) => {
        setup.selectionMode.set('multiple');
        setup.rows.set(rows);
        setup.selection.set(initial);
      });
      const before = rows.map((row) => ({ ...row }));

      await table.selectRow(2);

      expect(initial).toEqual([ORDERS[0]]);
      expect(host.selection()).not.toBe(initial);
      expect(host.selection()).toHaveLength(2);
      expect(rows).toEqual(before);
    });

    it('lists as Optimus gaps how rows take the tab stop: every row, then the clicked one', async () => {
      const { element, table } = await render('light', (initial) => {
        initial.selectionMode.set('single');
      });
      const stops = (): (string | null)[] =>
        parts(element, 'tr[data-wj-row]').map((row) => row.getAttribute('tabindex'));

      // Nothing selected: every row is a tab stop.
      expect(stops()).toEqual(['0', '0', '0', '0', '0']);

      // A click makes the clicked row the one stop.
      await table.selectRow(1);
      expect(stops()).toEqual(['-1', '0', '-1', '-1', '-1']);
    });

    it('lists as an Optimus gap that a selection set from code leaves no row a tab stop', async () => {
      const { element } = await render('light', (initial) => {
        initial.selectionMode.set('single');
        initial.selection.set([ORDERS[1]]);
      });

      expect(parts(element, 'tr[data-wj-row]').map((row) => row.getAttribute('tabindex'))).toEqual([
        '-1',
        '-1',
        '-1',
        '-1',
        '-1',
      ]);
    });

    it('selects by dataKey: a row with the same key and other content stays selected', async () => {
      const { fixture, host, table } = await render('light', (setup) => {
        setup.selectionMode.set('single');
        setup.selection.set([{ ...ORDERS[1] }]);
      });
      expect(await table.getSelectedRowIndexes()).toEqual([1]);

      host.rows.set(orders().reverse());
      await fixture.whenStable();

      expect(await table.getSelectedRowIndexes()).toEqual([3]);
    });
  });

  describe('row expansion', () => {
    it('writes a toggle per row named from aria.expandRow, with the state in aria-expanded', async () => {
      const { element, table } = await render('light', (host) => {
        host.expandable.set(true);
      });

      const toggles = parts(element, 'tbody button[aria-expanded]');
      expect(toggles).toHaveLength(5);
      expect(toggles.every((toggle) => toggle.getAttribute('aria-expanded') === 'false')).toBe(
        true,
      );
      expect(toggles.every((toggle) => toggle.getAttribute('aria-label') === 'Row Expanded')).toBe(
        true,
      );

      await table.toggleRowExpansion(0);
      const open = nth(parts(element, 'tbody button[aria-expanded]'), 0);
      expect(open.getAttribute('aria-expanded')).toBe('true');
      // The name does not change with the state.
      expect(open.getAttribute('aria-label')).toBe('Row Expanded');
    });

    it('renders the slot in a full-width row under the row, with the typed row and index', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.expandable.set(true);
        initial.selectionMode.set('multiple');
      });

      await table.toggleRowExpansion(2);

      expect(await table.isRowExpanded(2)).toBe(true);
      expect(await table.isRowExpanded(1)).toBe(false);
      expect(await table.getExpansionText(2)).toBe('Order 1003 for Ada Nguyen (row 2)');
      expect(await table.getExpansionText(1)).toBe('');
      const expansion = part(element, 'tr.p-datatable-row-expansion');
      // Checkbox, toggle and the four data columns.
      expect(part(expansion, 'td').getAttribute('colspan')).toBe('6');
      // The expansion is not a row: harnesses and counts see five.
      expect(expansion.hasAttribute('data-wj-row')).toBe(false);
      expect(dataRows(element)).toHaveLength(5);
      expect(host.expandedKeys()).toEqual({ '1003': true });
    });

    it('emits rowExpand and rowCollapse with the row, and writes expandedRowKeys back as a new value', async () => {
      const initial: Record<string, boolean> = { '1001': true };
      const { host, table } = await render('light', (setup) => {
        setup.expandable.set(true);
        setup.expandedKeys.set(initial);
      });
      expect(await table.isRowExpanded(0)).toBe(true);

      await table.toggleRowExpansion(1);
      await table.toggleRowExpansion(0);

      expect(host.events()).toEqual(['expand:1002', 'collapse:1001']);
      expect(host.expandedKeys()).toEqual({ '1002': true });
      // FR-9: the map the app bound is not written into.
      expect(initial).toEqual({ '1001': true });
      expect(host.expandedKeys()).not.toBe(initial);
    });

    it('rowExpandMode single keeps one row open, and follows a map set from code', async () => {
      const { fixture, host, table } = await render('light', (setup) => {
        setup.expandable.set(true);
        setup.expandMode.set('single');
      });

      await table.toggleRowExpansion(0);
      await table.toggleRowExpansion(1);
      expect(host.expandedKeys()).toEqual({ '1002': true });
      expect(await table.isRowExpanded(0)).toBe(false);

      host.expandedKeys.set({ '1005': true });
      await fixture.whenStable();
      expect(await table.isRowExpanded(4)).toBe(true);
      expect(await table.isRowExpanded(1)).toBe(false);
    });

    it('gives the toggle Optimus’s 28 px round button with a 16 px glyph', async () => {
      const { element } = await render('light', (host) => {
        host.expandable.set(true);
      });

      const toggle = toggleOf(nth(dataRows(element), 0));
      const box = toggle.getBoundingClientRect();
      expect(box.width).toBe(28);
      expect(box.height).toBe(28);
      expect(toggle.querySelector('svg')?.getBoundingClientRect().width).toBe(16);
    });

    it('does not select a row when its toggle is pressed', async () => {
      const { host, table } = await render('light', (setup) => {
        setup.expandable.set(true);
        setup.selectionMode.set('single');
      });

      await table.toggleRowExpansion(0);

      expect(host.selection()).toEqual([]);
    });
  });

  describe('row editing', () => {
    const edit = (host: Host): void => {
      host.editable.set(true);
    };

    it('writes an Edit button per row, named from aria.editRow, in a trailing actions column', async () => {
      const { element, table } = await render('light', edit);

      const buttons = parts(element, 'tbody .p-datatable-row-editor-init');
      expect(buttons).toHaveLength(5);
      expect(buttons.every((button) => button.getAttribute('aria-label') === 'Edit Row')).toBe(
        true,
      );
      expect(nth(dataRows(element), 0).lastElementChild?.contains(nth(buttons, 0))).toBe(true);
      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'Status', 'Total']);
    });

    it('Edit shows the editors, then Cancel before Save, in a column that does not grow', async () => {
      const { element, host, table } = await render('light', edit);
      // The last cell of an unedited row: its width is the actions column's.
      const actionsWidth = (): number =>
        nth(parts(nth(dataRows(element), 0), 'td'), 4).getBoundingClientRect().width;
      const before = actionsWidth();

      await table.editRow(1);

      expect(host.events()).toEqual(['init:1002@1']);
      expect(host.editingKeys()).toEqual({ '1002': true });
      const row = nth(dataRows(element), 1);
      expect(part(row, 'input').getAttribute('aria-label')).toBe('Customer');
      const names = parts(row, '.wj-table-actions button').map((button) =>
        button.getAttribute('aria-label'),
      );
      expect(names).toEqual(['Cancel Edit', 'Save Edit']);
      // The actions column reserves room for both buttons, so it does not grow.
      expect(actionsWidth()).toBe(before);
      // Optimus 28 px round buttons.
      for (const button of parts(row, '.wj-table-actions button')) {
        expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
        expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      }
    });

    it('Save leaves edit mode with the typed value, emits rowEditSave and writes the keys as a new value', async () => {
      const initial: Record<string, boolean> = {};
      const { element, host, table } = await render('light', (setup) => {
        edit(setup);
        setup.editingKeys.set(initial);
      });

      await table.editRow(0);
      const input = part(nth(dataRows(element), 0), 'input');
      await userEvent.fill(input, 'Mia Edited');
      await table.saveRowEdit(0);

      expect(host.events()).toEqual(['init:1001@0', 'save:1001']);
      expect(host.editingKeys()).toEqual({});
      expect(initial).toEqual({});
      expect(host.editingKeys()).not.toBe(initial);
      expect((await table.getCellTexts())[0]?.[1]).toBe('Mia Edited');
      expect(host.rows()[0]?.customer).toBe('Mia Edited');
    });

    it('Cancel emits rowEditCancel, where the app restores its copy of the row', async () => {
      const { element, host, table } = await render('light', edit);

      await table.editRow(0);
      await userEvent.fill(part(nth(dataRows(element), 0), 'input'), 'Typed over');
      await table.cancelRowEdit(0);

      expect(host.events()).toEqual(['init:1001@0', 'cancel:1001']);
      expect(host.editingKeys()).toEqual({});
      expect((await table.getCellTexts())[0]?.[1]).toBe('Mia Tran');
    });

    it('keeps the row in edit mode and says nothing when an editor is invalid', async () => {
      const { element, host, table } = await render('light', edit);

      await table.editRow(0);
      await userEvent.fill(part(nth(dataRows(element), 0), 'input'), '');
      await table.saveRowEdit(0);

      expect(host.events()).toEqual(['init:1001@0']);
      expect(host.editingKeys()).toEqual({ '1001': true });
      expect(parts(nth(dataRows(element), 0), '.wj-table-actions button')).toHaveLength(2);
    });

    it('follows editingRowKeys set from code', async () => {
      const { element, fixture, host } = await render('light', edit);

      host.editingKeys.set({ '1003': true, '1004': true });
      await fixture.whenStable();

      expect(parts(element, 'tbody input')).toHaveLength(2);
      expect(host.events()).toEqual([]);
    });

    it('moves focus to the first editor on Edit, and back to Edit on Save and on Cancel', async () => {
      const { element, table } = await render('light', edit);

      await table.editRow(2);
      const row = nth(dataRows(element), 2);
      await expect.poll(() => document.activeElement).toBe(part(row, 'input'));

      await table.saveRowEdit(2);
      await expect
        .poll(() => document.activeElement)
        .toBe(part(row, '.p-datatable-row-editor-init'));

      await table.editRow(2);
      await expect.poll(() => document.activeElement).toBe(part(row, 'input'));
      await table.cancelRowEdit(2);
      await expect
        .poll(() => document.activeElement)
        .toBe(part(row, '.p-datatable-row-editor-init'));
    });

    it('focuses Save when the row has no focusable editor', async () => {
      const { element, table } = await render('light', (host) => {
        edit(host);
        host.textEditor.set(true);
      });

      await table.editRow(0);

      const row = nth(dataRows(element), 0);
      await expect
        .poll(() => document.activeElement)
        .toBe(part(row, '.p-datatable-row-editor-save'));
    });
  });

  describe('WJ0050', () => {
    const MESSAGE =
      /^WJ0050: wj-table: a row expansion or cell editor slot is present but dataKey is not set, so every row shares one key and expanding or editing one row does it for all of them\. Set the dataKey input to a field that is unique per row, for example dataKey="id"\. Find more at https:\/\/locvodever\.github\.io\/weeljack-ng\/errors\/WJ0050$/;
    const wj0050 = (): unknown[] =>
      warn.mock.calls
        .map((call): unknown => call[0])
        .filter((message) => String(message).includes('WJ0050'));

    it('warns once, in the 21 Q8 shape, for a row expansion without dataKey', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(NoKeyHost);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(wj0050()).toHaveLength(1);
      expect(String(wj0050()[0])).toMatch(MESSAGE);
    });

    it('warns once per application for a cell editor and an expansion without dataKey', async () => {
      await render('light', (host) => {
        host.editable.set(true);
        host.expandable.set(true);
        host.dataKey.set(undefined);
      });
      TestBed.resetTestingModule();
      await render('light', (host) => {
        host.editable.set(true);
        host.dataKey.set(undefined);
      });

      // One warning for the application, then one more for the second application.
      expect(wj0050()).toHaveLength(2);
    });

    it('stays silent when dataKey is set, and when no slot needs it', async () => {
      await render('light', (host) => {
        host.editable.set(true);
        host.expandable.set(true);
      });
      TestBed.resetTestingModule();
      await render('light', (host) => {
        host.dataKey.set(undefined);
      });

      expect(wj0050()).toHaveLength(0);
    });
  });

  describe('grouping', () => {
    const group = (host: Host): void => {
      host.groupRowsBy.set('status');
    };

    it('sorts by the field and opens each group with a header row spanning every column', async () => {
      const { element, host, table } = await render('light', group);

      expect(await table.getGroupHeaderTexts()).toEqual(['Delivered', 'Pending', 'Shipped']);
      expect(await ids(table)).toEqual(['1004', '1001', '1003', '1002', '1005']);
      const header = part(element, 'tr.p-datatable-row-group-header');
      expect(part(header, 'td').getAttribute('colspan')).toBe('4');
      expect(header.hasAttribute('data-wj-row')).toBe(false);
      expect(dataRows(element)).toHaveLength(5);
      expect(getComputedStyle(part(header, 'td')).fontWeight).toBe('600');
      // Grouping is not a sort the user asked for.
      expect(host.sortField()).toBeUndefined();
    });

    it('renders wjTableGroupHeader with the first row, the group and its index', async () => {
      const { element } = await render('light', (host) => {
        group(host);
        host.groupSlot.set(true);
      });

      expect(
        parts(element, 'tr.p-datatable-row-group-header .group').map((el) => el.textContent),
      ).toEqual(['Delivered|Zoe Le|0', 'Pending|Mia Tran|1', 'Shipped|Noah Pham|3']);
    });

    it('a sort on another column keeps the groups and writes the sort back', async () => {
      const { host, table } = await render('light', group);

      await table.sortBy('Customer');

      expect(host.sortField()).toBe('customer');
      expect(host.sortOrder()).toBe(1);
      expect(await ids(table)).toEqual(['1004', '1003', '1001', '1005', '1002']);
      expect(await table.getGroupHeaderTexts()).toEqual(['Delivered', 'Pending', 'Shipped']);
    });

    it('lists as an Optimus gap that row expansion and grouping do not combine', async () => {
      const { element, table } = await render('light', (host) => {
        group(host);
        host.expandable.set(true);
      });

      // Optimus writes each group header after the first row of its group, and expands by group.
      const kinds = parts(element, 'tbody > tr').map((row) =>
        row.classList.contains('p-datatable-row-group-header') ? 'group' : 'row',
      );
      expect(kinds.slice(0, 3)).toEqual(['row', 'group', 'row']);
      await table.toggleRowExpansion(0);
      expect(await table.isRowExpanded(0)).toBe(true);
    });

    it('never changes the array the app bound', async () => {
      const rows = orders();
      await render('light', (host) => {
        group(host);
        host.rows.set(rows);
      });

      expect(rows).toEqual(ORDERS);
    });
  });

  describe('frozen columns and scrolling', () => {
    const frozen = (host: Host): void => {
      host.frozenId.set(true);
      host.frozenTotal.set(true);
      host.selectionMode.set('multiple');
      host.expandable.set(true);
      host.editable.set(true);
      host.scrollHeight.set('12rem');
    };

    it('a frozen column turns scrolling on and sticks to its side', async () => {
      const { element } = await render('light', frozen);

      expect(part(element, 'p-table').classList).toContain('p-datatable-scrollable');
      const first = nth(dataRows(element), 0);
      const cells = parts(first, 'td');
      // Checkbox, toggle, Order, Customer, Status, Total, actions.
      expect(cells).toHaveLength(7);
      expect(cells.map((cell) => cell.classList.contains('p-datatable-frozen-column'))).toEqual([
        true,
        true,
        true,
        false,
        false,
        true,
        true,
      ]);
      expect(getComputedStyle(nth(cells, 2)).position).toBe('sticky');
      expect(getComputedStyle(nth(cells, 3)).position).not.toBe('sticky');
      await expect.poll(() => nth(cells, 6).style.right).toBe('0px');
      await expect.poll(() => parseFloat(nth(cells, 2).style.left)).toBeGreaterThan(0);
    });

    it('a frozen data column also freezes its utility columns, on the same side', async () => {
      const { element } = await render('light', (host) => {
        host.frozenTotal.set(true);
        host.selectionMode.set('multiple');
        host.editable.set(true);
      });

      const cells = parts(nth(dataRows(element), 0), 'td');
      // Only a right-frozen column: the checkbox stays free, the actions column is frozen.
      expect(cells.map((cell) => cell.classList.contains('p-datatable-frozen-column'))).toEqual([
        false,
        false,
        false,
        false,
        true,
        true,
      ]);
    });

    it('makes the scrolling container a named region and a tab stop', async () => {
      const { element } = await render('light', frozen);

      const container = part(element, '.p-datatable-table-container');
      expect(container.getAttribute('tabindex')).toBe('0');
      expect(container.getAttribute('role')).toBe('region');
      expect(container.getAttribute('aria-label')).toBe('Orders');
      container.focus();
      expect(document.activeElement).toBe(container);
      expect(getComputedStyle(container).maxHeight).toBe(`${String(12 * 16)}px`);
    });

    it('leaves a table that does not scroll without a tab stop', async () => {
      const { element } = await render();

      const container = part(element, '.p-datatable-table-container');
      expect(container.hasAttribute('tabindex')).toBe(false);
      expect(container.hasAttribute('role')).toBe(false);
    });

    it('scrollable and scrollHeight scroll a table with no frozen column', async () => {
      const { element } = await render('light', (host) => {
        host.scrollable.set(true);
        host.scrollHeight.set('8rem');
      });

      const container = part(element, '.p-datatable-table-container');
      expect(container.getAttribute('tabindex')).toBe('0');
      expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);
    });
  });

  describe('filters', () => {
    const textFilter = (host: Host): void => {
      host.customerFilter.set('text');
    };

    it('writes a filter row with an input named by its column, and filters as the user types', async () => {
      const { element, host, table } = await render('light', textFilter);

      const input = part(element, 'thead tr:nth-child(2) input');
      expect(input.getAttribute('aria-label')).toBe('Customer');
      await table.filterColumn('Customer', 'Mi');

      expect(await ids(table)).toEqual(['1001']);
      expect(host.filters()).toEqual({ customer: { value: 'Mi', matchMode: 'startsWith' } });
    });

    it('filtering does not move the data headers, and the filter row is not a header', async () => {
      const { element, table } = await render('light', (host) => {
        textFilter(host);
        host.totalFilter.set('numeric');
        host.selectionMode.set('multiple');
      });

      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'Status', 'Total']);
      expect(parts(element, 'thead tr')).toHaveLength(2);
    });

    it('starts from the filters the app gives, and writes a new object back without touching its own', async () => {
      const initial: WjFilters = { customer: { value: 'a', matchMode: 'contains' } };
      const rule = initial['customer'];
      const { host, table } = await render('light', (setup) => {
        textFilter(setup);
        setup.filters.set(initial);
      });
      expect(await ids(table)).toEqual(['1001', '1002', '1003']);

      await table.filterColumn('Customer', 'Zzz');

      expect(await ids(table)).toEqual([]);
      expect(host.filters()).not.toBe(initial);
      expect(initial).toEqual({ customer: { value: 'a', matchMode: 'contains' } });
      expect(initial['customer']).toBe(rule);
    });

    it('applies filters the app sets from code, and a reset leaves the filter inputs working', async () => {
      const { element, host, table } = await render('light', textFilter);

      host.filters.set({ customer: { value: 'Noah', matchMode: 'startsWith' } });
      await expect.poll(() => ids(table)).toEqual(['1002']);
      expect(part(element, 'thead tr:nth-child(2) input')).toHaveProperty('value', 'Noah');

      host.filters.set({});
      await expect.poll(() => ids(table)).toHaveLength(5);
      expect(part(element, 'thead tr:nth-child(2) input')).toHaveProperty('value', '');

      await table.filterColumn('Customer', 'Ivy');
      expect(await ids(table)).toEqual(['1005']);
      expect(host.filters()).toEqual({ customer: { value: 'Ivy', matchMode: 'startsWith' } });
    });

    it('filterGlobal() searches globalFilterFields, and writes the global rule to filters', async () => {
      const { host, table } = await render();

      host.table().filterGlobal('ship');
      await expect.poll(() => table.getCellTexts().then((rows) => rows.length)).toBe(2);

      expect(await ids(table)).toEqual(['1002', '1005']);
      expect(host.filters()['global']).toEqual({ value: 'ship', matchMode: 'contains' });
    });

    it('filterGlobal() takes a match mode', async () => {
      const { host, table } = await render();

      host.table().filterGlobal('Zoe Le', 'equals');
      await expect.poll(() => table.getCellTexts().then((rows) => rows.length)).toBe(1);

      expect(await ids(table)).toEqual(['1004']);
    });

    it('clear() resets the sort, the filters and the page, and restores the row order', async () => {
      const { host, table } = await render('light', (setup) => {
        textFilter(setup);
        setup.paginator.set(true);
        setup.rows.set(manyOrders(23));
      });
      await table.sortBy('Order');
      await table.sortBy('Order');
      expect(host.sortOrder()).toBe(-1);
      await table.goToNextPage();
      expect(host.first()).toBe(10);
      await table.filterColumn('Customer', 'Customer 0');
      expect(Object.keys(host.filters())).toEqual(['customer']);

      host.table().clear();
      await expect.poll(() => table.getCurrentPage()).toBe(1);

      expect(host.sortField()).toBeUndefined();
      expect(host.sortOrder()).toBe(1);
      expect(host.filters()).toEqual({});
      expect(host.first()).toBe(0);
      expect((await table.getCellTexts())[0]?.[0]).toBe('2000');
      expect(await table.getSortOrder('Order')).toBe('none');
    });

    it('menu display puts a filter button in the header, which opens a menu that filters on Apply', async () => {
      closeAtTeardown = closeMenu;
      const { element, host, table } = await render('light', (setup) => {
        textFilter(setup);
        setup.filterDisplay.set('menu');
      });

      expect(parts(element, 'thead tr')).toHaveLength(1);
      const button = part(element, 'thead .p-datatable-column-filter-button');
      expect(button.getAttribute('aria-label')).toBe('Show Filter Menu');

      await table.filterColumn('Customer', 'Noah');

      expect(await ids(table)).toEqual(['1002']);
      expect(host.filters()['customer']).toMatchObject([{ value: 'Noah' }]);
      await closeMenu();
    });

    it('never changes the rows array the app bound while filtering and sorting', async () => {
      const rows = orders();
      const { table } = await render('light', (host) => {
        textFilter(host);
        host.rows.set(rows);
      });

      await table.filterColumn('Customer', 'A');
      await table.sortBy('Customer');

      expect(rows).toEqual(ORDERS);
    });

    it('opens the menu with a motion by default, and without one under reduced motion', async () => {
      closeAtTeardown = closeMenu;
      document.getElementById('wj-spec-no-motion')?.remove();
      const animations = async (reduce: boolean): Promise<number> => {
        await emulateReducedMotion(reduce);
        const { element, fixture } = await render('light', (host) => {
          textFilter(host);
          host.filterDisplay.set('menu');
        });
        part(element, 'thead .p-datatable-column-filter-button').click();
        await expect
          .poll(() => document.querySelector('.p-datatable-filter-overlay'))
          .not.toBeNull();
        const count = document.getAnimations().length;
        await closeMenu();
        fixture.destroy();
        TestBed.resetTestingModule();
        return count;
      };

      expect(await animations(false)).toBeGreaterThan(0);
      expect(await animations(true)).toBe(0);
    });
  });

  describe('lazy loading', () => {
    const lazy = (host: Host): void => {
      host.lazy.set(true);
      host.paginator.set(true);
      host.totalRecords.set(120);
      host.customerFilter.set('text');
      host.rows.set(manyOrders(10));
    };

    it('asks for the first page when it starts, and never sorts or slices value itself', async () => {
      const { host, table } = await render('light', lazy);

      expect(host.lazyEvents()).toEqual([
        {
          first: 0,
          rows: 10,
          sortField: undefined,
          sortOrder: 1,
          filters: {},
          globalFilter: undefined,
        },
      ]);
      expect(await ids(table)).toHaveLength(10);
      expect(await table.getCurrentPage()).toBe(1);
    });

    it('asks once for each page, sort and filter', async () => {
      const { fixture, host, table } = await render('light', lazy);

      await table.goToNextPage();
      await fixture.whenStable();
      expect(host.lazyEvents()).toHaveLength(2);
      expect(host.lazyEvents()[1]).toMatchObject({ first: 10, rows: 10 });

      await table.sortBy('Customer');
      await fixture.whenStable();
      // The models are written back and make Optimus sort again: the app is not asked twice.
      expect(host.lazyEvents()).toHaveLength(3);
      // A sort goes back to the first page.
      expect(host.lazyEvents()[2]).toMatchObject({ first: 0, sortField: 'customer', sortOrder: 1 });

      await table.sortBy('Customer');
      await fixture.whenStable();
      expect(host.lazyEvents()).toHaveLength(4);
      expect(host.lazyEvents()[3]).toMatchObject({ sortField: 'customer', sortOrder: -1 });

      await table.sortBy('Order');
      await fixture.whenStable();
      expect(host.lazyEvents()).toHaveLength(5);
      expect(host.lazyEvents()[4]).toMatchObject({ sortField: 'id', sortOrder: 1 });

      await table.filterColumn('Customer', 'Customer 1');
      await fixture.whenStable();
      expect(host.lazyEvents()).toHaveLength(6);
      expect(host.lazyEvents()[5]).toMatchObject({
        first: 0,
        sortField: 'id',
        filters: { customer: { value: 'Customer 1', matchMode: 'startsWith' } },
      });
    });

    it('reports the pager from totalRecords, and leaves the rows in the order the app gave', async () => {
      const { table } = await render('light', lazy);

      expect(await ids(table)).toEqual(manyOrders(10).map((order) => String(order.id)));
      await table.sortBy('Customer');
      await table.sortBy('Customer');
      expect(await ids(table)).toEqual(manyOrders(10).map((order) => String(order.id)));
    });

    it('does not ask when the table is not lazy', async () => {
      const { host, table } = await render();

      await table.sortBy('Order');

      expect(host.lazyEvents()).toEqual([]);
    });
  });

  describe('empty, loading, caption and summary', () => {
    it('shows the translation’s emptyMessage in a full-width cell when there are no rows', async () => {
      const { element, table } = await render('light', (host) => {
        host.rows.set([]);
      });

      expect(await table.isEmpty()).toBe(true);
      expect(await table.getEmptyText()).toBe('No available options');
      const cell = part(element, 'tr.wj-table-empty td');
      expect(cell.getAttribute('colspan')).toBe('4');
      expect(part(element, 'tr.wj-table-empty').hasAttribute('data-wj-row')).toBe(false);
      expect(getComputedStyle(cell).color).not.toBe(getComputedStyle(part(element, 'th')).color);
    });

    it('follows a translation emptyMessage, and renders it as text', async () => {
      const { element, table } = await render(
        'light',
        (host) => {
          host.rows.set([]);
        },
        { emptyMessage: PAYLOAD },
      );

      expect(await table.getEmptyText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('wjTableEmpty replaces the default empty row, and a filter with no match shows it too', async () => {
      const { table } = await render('light', (host) => {
        host.rows.set([]);
        host.emptySlot.set(true);
      });

      expect(await table.getEmptyText()).toBe('Nothing here');
    });

    it('shows the empty row, blank, while an empty table is loading', async () => {
      const { element, table } = await render('light', (host) => {
        host.rows.set([]);
        host.loading.set(true);
      });

      expect(await table.isLoading()).toBe(true);
      expect(await table.getEmptyText()).toBe('');
      const row = part(element, 'tr.wj-table-empty');
      expect(row.textContent.trim()).toBe('');
      expect(row.getBoundingClientRect().height).toBeGreaterThan(20);
    });

    it('loading sets aria-busy on the table and shows Optimus’s mask over the rows', async () => {
      const { element, fixture, host, table } = await render('light', (setup) => {
        setup.loading.set(true);
      });

      expect(await table.isLoading()).toBe(true);
      expect(part(element, 'table').getAttribute('aria-busy')).toBe('true');
      expect(element.querySelector('.p-datatable-mask')).not.toBeNull();
      expect(await table.getCellTexts()).toHaveLength(5);

      host.loading.set(false);
      await fixture.whenStable();
      expect(await table.isLoading()).toBe(false);
      expect(part(element, 'table').hasAttribute('aria-busy')).toBe(false);
    });

    it('wjTableLoading replaces the rows with a full-width cell and shows no mask', async () => {
      const { element, fixture, host, table } = await render('light', (setup) => {
        setup.loading.set(true);
        setup.loadingSlot.set(true);
      });

      expect(await table.isLoading()).toBe(true);
      expect(element.querySelector('.p-datatable-mask')).toBeNull();
      expect(await table.getCellTexts()).toEqual([]);
      const cell = part(element, '.busy').closest('td');
      expect(cell?.getAttribute('colspan')).toBe('4');
      expect(cell?.closest('tr')?.hasAttribute('data-wj-row')).toBe(false);

      host.loading.set(false);
      await fixture.whenStable();
      expect(await table.getCellTexts()).toHaveLength(5);
      expect(element.querySelector('.busy')).toBeNull();
    });

    it('renders the caption above and the summary below the table', async () => {
      const { element, table } = await render('light', (host) => {
        host.captionSlot.set(true);
        host.summarySlot.set(true);
      });

      expect(await table.getCaptionText()).toBe('Recent orders5 orders');
      expect(await table.getSummaryText()).toBe('Sum of 5 orders');
      const caption = part(element, '.p-datatable-header');
      const summary = part(element, 'div.p-datatable-tfoot');
      const tableEl = part(element, 'table');
      expect(
        caption.compareDocumentPosition(tableEl) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        tableEl.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('names the table by a caption title through ariaLabelledBy, and the harness finds it by that', async () => {
      const { fixture } = await render('light', (host) => {
        host.captionSlot.set(true);
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption-title');
      });

      const named = await TestbedHarnessEnvironment.loader(fixture).getHarness(
        WjTableHarness.with({ caption: 'Recent orders' }),
      );
      expect(await named.getName()).toBe('Recent orders');
    });

    it('omits the bands without the slots', async () => {
      const { table } = await render();

      expect(await table.getCaptionText()).toBe('');
      expect(await table.getSummaryText()).toBe('');
    });
  });

  describe('pt and ARIA', () => {
    it('reaches the container part and keeps the routed role and tab stop on it', async () => {
      const { element } = await render('light', (host) => {
        host.scrollable.set(true);
        host.pt.set({ tableContainer: { 'data-extra': 'yes' } });
      });

      const container = part(element, '.p-datatable-table-container');
      expect(container.getAttribute('data-extra')).toBe('yes');
      expect(container.getAttribute('tabindex')).toBe('0');
    });

    it('routes ariaLabelledBy to the scrolling region as well as the table', async () => {
      const { element } = await render('light', (host) => {
        host.scrollable.set(true);
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('before');
      });

      expect(part(element, '.p-datatable-table-container').getAttribute('aria-labelledby')).toBe(
        'before',
      );
      expect(part(element, 'table').getAttribute('aria-labelledby')).toBe('before');
    });
  });

  describe('HTML payloads', () => {
    const inert = (element: HTMLElement): void => {
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('takes dataKey as a field name, never as markup', async () => {
      const { element, table } = await render('light', (host) => {
        host.dataKey.set(PAYLOAD);
        host.expandable.set(true);
        host.editable.set(true);
        host.selectionMode.set('single');
      });

      await table.selectRow(0);
      inert(element);
    });

    it('takes groupRowsBy as a field name, never as markup', async () => {
      const { element } = await render('light', (host) => {
        host.groupRowsBy.set(PAYLOAD);
      });

      inert(element);
    });

    it('renders a group value as text in the header, with and without the slot', async () => {
      const rows = orders();
      rows[0] = { ...ORDERS[0], status: PAYLOAD };
      const { element, fixture, host } = await render('light', (setup) => {
        setup.groupRowsBy.set('status');
        setup.rows.set(rows);
      });

      expect(
        parts(element, 'tr.p-datatable-row-group-header').map((row) => row.textContent.trim()),
      ).toContain(PAYLOAD);
      inert(element);

      host.groupSlot.set(true);
      await fixture.whenStable();
      expect(parts(element, '.group').some((el) => el.textContent.includes(PAYLOAD))).toBe(true);
      inert(element);
    });

    it('takes a globalFilterFields entry as a field name, and a payload typed into filterGlobal as text', async () => {
      const { element, host, table } = await render('light', (setup) => {
        setup.globalFields.set([PAYLOAD, 'customer']);
      });

      host.table().filterGlobal(PAYLOAD);
      await expect.poll(() => table.isEmpty()).toBe(true);

      inert(element);
      expect(host.filters()['global']).toMatchObject({ value: PAYLOAD });
    });

    it('treats a payload typed into a column filter as text', async () => {
      const { element, host, table } = await render('light', (setup) => {
        setup.customerFilter.set('text');
      });

      await table.filterColumn('Customer', PAYLOAD);

      expect(await table.isEmpty()).toBe(true);
      expect(host.filters()['customer']).toMatchObject({ value: PAYLOAD });
      expect(part(element, 'thead tr:nth-child(2) input')).toHaveProperty('value', PAYLOAD);
      inert(element);
    });

    it('renders row values inside the expansion and an editor as text', async () => {
      const rows = orders();
      rows[0] = { ...ORDERS[0], customer: PAYLOAD };
      const { element, table } = await render('light', (host) => {
        host.rows.set(rows);
        host.expandable.set(true);
        host.editable.set(true);
      });

      await table.toggleRowExpansion(0);
      await table.editRow(0);

      inert(element);
      expect(part(nth(dataRows(element), 0), 'input').closest('td')).not.toBeNull();
      expect(await table.getExpansionText(0)).toContain(PAYLOAD);
    });
  });

  describe('accessibility', () => {
    const STATES: [string, (host: Host) => void][] = [
      [
        'empty',
        (host) => {
          host.rows.set([]);
        },
      ],
      [
        'empty with a slot',
        (host) => {
          host.rows.set([]);
          host.emptySlot.set(true);
        },
      ],
      [
        'loading with the mask',
        (host) => {
          host.loading.set(true);
        },
      ],
      [
        'loading with a slot',
        (host) => {
          host.loading.set(true);
          host.loadingSlot.set(true);
        },
      ],
      [
        'single selection, a row selected',
        (host) => {
          host.selectionMode.set('single');
          host.selection.set([ORDERS[1]]);
        },
      ],
      [
        'multiple selection, rows selected',
        (host) => {
          host.selectionMode.set('multiple');
          host.selection.set([ORDERS[0], ORDERS[3]]);
        },
      ],
      [
        'a row expanded',
        (host) => {
          host.expandable.set(true);
          host.expandedKeys.set({ '1002': true });
        },
      ],
      [
        'a row in edit mode',
        (host) => {
          host.editable.set(true);
          host.editingKeys.set({ '1002': true });
        },
      ],
      [
        'grouped',
        (host) => {
          host.groupRowsBy.set('status');
        },
      ],
      [
        'grouped with a header slot',
        (host) => {
          host.groupRowsBy.set('status');
          host.groupSlot.set(true);
        },
      ],
      [
        'frozen columns with scrolling',
        (host) => {
          host.frozenId.set(true);
          host.frozenTotal.set(true);
          host.scrollHeight.set('10rem');
        },
      ],
      [
        'frozen, with every utility column',
        (host) => {
          host.frozenId.set(true);
          host.frozenTotal.set(true);
          host.selectionMode.set('multiple');
          host.expandable.set(true);
          host.editable.set(true);
        },
      ],
      [
        'the filter row',
        (host) => {
          host.customerFilter.set('text');
          host.totalFilter.set('numeric');
          host.idFilter.set('numeric');
        },
      ],
      [
        'the filter row, filtered',
        (host) => {
          host.customerFilter.set('text');
          host.filters.set({ customer: { value: 'a', matchMode: 'contains' } });
        },
      ],
      [
        'the filter menu buttons',
        (host) => {
          host.customerFilter.set('text');
          host.filterDisplay.set('menu');
        },
      ],
      [
        'caption and summary',
        (host) => {
          host.captionSlot.set(true);
          host.summarySlot.set(true);
          host.ariaLabel.set(undefined);
          host.ariaLabelledBy.set('caption-title');
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(element);
      });

      it('has no axe violations with the filter menu open', async () => {
        closeAtTeardown = closeMenu;
        const { element } = await render(scheme, (host) => {
          host.customerFilter.set('text');
          host.filterDisplay.set('menu');
        });
        part(element, 'thead .p-datatable-column-filter-button').click();
        await menuOpen();

        await expectNoAxeViolations(document.body);
      });

      it('has no axe violations with a numeric filter menu open', async () => {
        closeAtTeardown = closeMenu;
        const { element } = await render(scheme, (host) => {
          host.totalFilter.set('numeric');
          host.filterDisplay.set('menu');
        });
        part(element, 'thead .p-datatable-column-filter-button').click();
        await menuOpen();
        // The numeric input is named by its column, as the text input is.
        expect(
          part(document, '.p-datatable-filter-overlay p-inputnumber input').getAttribute(
            'aria-label',
          ),
        ).toBe('Total');

        await expectNoAxeViolations(document.body);
      });

      it('has no axe violations with the row filter match-mode menu open', async () => {
        closeAtTeardown = closeMenu;
        const { element } = await render(scheme, (host) => {
          host.customerFilter.set('text');
        });
        part(element, 'thead tr:nth-child(2) .p-datatable-column-filter-button').click();
        await menuOpen();

        await expectNoAxeViolations(document.body);
      });
    });
  });

  describe('keyboard', () => {
    const rowEl = (element: HTMLElement, index: number): HTMLElement =>
      nth(parts(element, 'tr[data-p-selectable-row]'), index);

    it('ArrowDown, ArrowUp, Home and End move between selectable rows', async () => {
      const { element } = await render('light', (host) => {
        host.selectionMode.set('single');
      });
      rowEl(element, 0).focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rowEl(element, 1));
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rowEl(element, 2));
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(rowEl(element, 1));
      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(rowEl(element, 4));
      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(rowEl(element, 0));
    });

    it('Space and Enter select the focused row', async () => {
      const { element, host } = await render('light', (setup) => {
        setup.selectionMode.set('single');
      });
      rowEl(element, 1).focus();

      await userEvent.keyboard(' ');
      expect(host.selection()).toEqual([ORDERS[1]]);

      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      expect(host.selection()).toEqual([ORDERS[2]]);
    });

    it('Ctrl+A selects every row in multiple mode', async () => {
      const { element, host, table } = await render('light', (setup) => {
        setup.selectionMode.set('multiple');
      });
      rowEl(element, 0).focus();

      await userEvent.keyboard('{Control>}a{/Control}');

      expect(host.selection()).toHaveLength(5);
      expect(await table.getSelectedRowIndexes()).toEqual([0, 1, 2, 3, 4]);
    });

    it('Space toggles a row checkbox and the select-all checkbox', async () => {
      const { element, host } = await render('light', (setup) => {
        setup.selectionMode.set('multiple');
      });

      part(element, 'tbody p-tablecheckbox input').focus();
      await userEvent.keyboard(' ');
      expect(host.selection()).toEqual([ORDERS[0]]);

      part(element, 'thead p-tableheadercheckbox input').focus();
      await userEvent.keyboard(' ');
      expect(host.selection()).toHaveLength(5);
      await userEvent.keyboard(' ');
      expect(host.selection()).toEqual([]);
    });

    it('Enter and Space on the expansion toggle expand and collapse the row', async () => {
      const { element, table } = await render('light', (host) => {
        host.expandable.set(true);
      });
      toggleOf(nth(dataRows(element), 1)).focus();

      await userEvent.keyboard('{Enter}');
      expect(await table.isRowExpanded(1)).toBe(true);
      await userEvent.keyboard(' ');
      expect(await table.isRowExpanded(1)).toBe(false);
    });

    it('Enter and Space on Edit, Save and Cancel drive the row edit', async () => {
      const { element, host, table } = await render('light', (setup) => {
        setup.editable.set(true);
      });
      const row = nth(dataRows(element), 0);
      part(row, '.p-datatable-row-editor-init').focus();

      await userEvent.keyboard('{Enter}');
      expect(host.editingKeys()).toEqual({ '1001': true });
      await expect.poll(() => document.activeElement).toBe(part(row, 'input'));

      part(row, '.p-datatable-row-editor-cancel').focus();
      await userEvent.keyboard(' ');
      expect(host.editingKeys()).toEqual({});
      await expect
        .poll(() => document.activeElement)
        .toBe(part(row, '.p-datatable-row-editor-init'));

      await userEvent.keyboard(' ');
      part(row, '.p-datatable-row-editor-save').focus();
      await userEvent.keyboard('{Enter}');
      expect(host.editingKeys()).toEqual({});
      expect(host.events().filter((event) => event.startsWith('save'))).toEqual(['save:1001']);
      expect(await table.isEmpty()).toBe(false);
    });

    it('Enter on the filter button opens the menu, and Escape closes it with focus on the button', async () => {
      closeAtTeardown = closeMenu;
      const { element } = await render('light', (host) => {
        host.customerFilter.set('text');
        host.filterDisplay.set('menu');
      });
      const button = part(element, 'thead .p-datatable-column-filter-button');
      button.focus();

      await userEvent.keyboard('{Enter}');
      await menuOpen();
      expect(button.closest('p-button')?.getAttribute('aria-expanded')).toBe('true');
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => document.querySelector('.p-datatable-filter-overlay')).toBeNull();
      expect(button.closest('p-button')?.getAttribute('aria-expanded')).toBe('false');
      await expect.poll(() => document.activeElement).toBe(button);
    });

    it('Space on the filter button of a column that is not sortable opens the menu', async () => {
      closeAtTeardown = closeMenu;
      const { element } = await render('light', (host) => {
        host.statusFilter.set('text');
        host.filterDisplay.set('menu');
      });
      const button = part(element, 'thead .p-datatable-column-filter-button');
      button.focus();

      await userEvent.keyboard(' ');
      await menuOpen();

      expect(button.closest('p-button')?.getAttribute('aria-expanded')).toBe('true');
      await closeMenu();
    });

    it('lists as an Optimus gap that Space on the filter button of a sortable column does nothing', async () => {
      const { element } = await render('light', (host) => {
        host.customerFilter.set('text');
        host.filterDisplay.set('menu');
      });
      part(element, 'thead .p-datatable-column-filter-button').focus();

      await userEvent.keyboard(' ');

      // The sortable header's Space handler prevents the button's own click.
      expect(document.querySelector('.p-datatable-filter-overlay')).toBeNull();
    });

    it('keeps focus on the filter button after the menu is applied', async () => {
      closeAtTeardown = closeMenu;
      const { element, table } = await render('light', (host) => {
        host.statusFilter.set('text');
        host.filterDisplay.set('menu');
      });

      await table.filterColumn('Status', 'Shipped');

      const button = part(element, 'thead .p-datatable-column-filter-button');
      await expect.poll(() => document.activeElement).toBe(button);
      expect(await ids(table)).toEqual(['1002', '1005']);
    });
  });
});
