import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjPageEvent, type WjSortOrder } from 'weeljack-ng';
import {
  WjColumn,
  WjTable,
  WjTableCellSlot,
  WjTableHeaderCellSlot,
  type WjTablePt,
  type WjTableSize,
} from 'weeljack-ng/table';
import { WjTableHarness } from 'weeljack-ng/table/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

interface Order {
  id: number;
  customer: string;
  total: number;
  address: { city: string };
}

const ORDERS: Order[] = [
  { id: 1003, customer: 'Mia Tran', total: 120, address: { city: 'Hanoi' } },
  { id: 1001, customer: 'Noah Pham', total: 45, address: { city: 'Hue' } },
  { id: 1005, customer: 'Ada Nguyen', total: 300, address: { city: 'Da Nang' } },
  { id: 1002, customer: 'Zoe Le', total: 8, address: { city: 'Can Tho' } },
  { id: 1004, customer: 'Ivy Vo', total: 77, address: { city: 'Hai Phong' } },
];

function manyOrders(count: number): Order[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: 2000 + index,
    customer: `Customer ${String(index + 1).padStart(2, '0')}`,
    total: index + 1,
    address: { city: `City ${String(index + 1)}` },
  }));
}

/** A consumer's template: a table with typed slots, columns that come and go, and every input. */
@Component({
  selector: 'wj-table-host',
  imports: [WjTable, WjColumn, WjTableCellSlot, WjTableHeaderCellSlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Recent orders</p>
    <div [style.width]="width()">
      <wj-table
        [value]="rows()"
        [(sortField)]="sortField"
        [(sortOrder)]="sortOrder"
        [paginator]="paginator()"
        [(first)]="first"
        [(rows)]="pageSize"
        [totalRecords]="totalRecords()"
        [rowsPerPageOptions]="rowsPerPageOptions()"
        [paginatorPosition]="paginatorPosition()"
        [size]="size()"
        [showGridlines]="showGridlines()"
        [stripedRows]="stripedRows()"
        [rowHover]="rowHover()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (pageChange)="pages.update((all) => [...all, $event])"
      >
        <wj-column field="id" header="Order" sortable />
        <wj-column field="customer" [header]="customerHeader()" sortable />
        @if (totals()) {
          <wj-column field="total" header="Total">
            <ng-template
              wjTableCell
              [wjTableCellOf]="rows()"
              let-order
              let-value="value"
              let-field="field"
              let-index="rowIndex"
            >
              <span class="total" [attr.data-index]="index" [attr.data-field]="field">
                {{ order.customer }}={{ value }}
              </span>
            </ng-template>
            <ng-template wjTableHeaderCell let-header let-field="field">
              <span class="head">{{ header }}/{{ field }}</span>
            </ng-template>
          </wj-column>
        }
        @if (city()) {
          <wj-column field="address.city" header="City" />
        }
      </wj-table>
    </div>
    <button type="button" id="after">After</button>
    <p id="hint">Hint</p>
  `,
})
class Host {
  readonly rows = signal<readonly Order[]>(ORDERS);
  readonly sortField = signal<string | undefined>(undefined);
  readonly sortOrder = signal<WjSortOrder>(1);
  readonly paginator = signal(false);
  readonly first = signal(0);
  readonly pageSize = signal<number | undefined>(undefined);
  readonly totalRecords = signal(0);
  readonly rowsPerPageOptions = signal<number[] | undefined>(undefined);
  readonly paginatorPosition = signal<'top' | 'bottom' | 'both'>('bottom');
  readonly size = signal<WjTableSize | undefined>(undefined);
  readonly showGridlines = signal(false);
  readonly stripedRows = signal(false);
  readonly rowHover = signal(false);
  readonly ariaLabel = signal<string | undefined>('Orders');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTablePt>(undefined);
  readonly customerHeader = signal<string | undefined>('Customer');
  readonly totals = signal(true);
  readonly city = signal(false);
  readonly width = signal<string | undefined>(undefined);
  readonly pages = signal<WjPageEvent[]>([]);
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-table-aria-host',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table [value]="rows" aria-label="Orders"><wj-column field="id" header="Order" /></wj-table>
  `,
})
class AriaOnHostHost {
  protected readonly rows = ORDERS;
}

/** A consumer who uses the routed inputs only. */
@Component({
  selector: 'wj-table-routed-host',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table [value]="rows" ariaLabel="Orders"><wj-column field="id" header="Order" /></wj-table>
  `,
})
class RoutedHost {
  protected readonly rows = ORDERS;
}

/** A slot without `[wjTableCellOf]`: the row is `unknown`, so it is narrowed before use. */
@Component({
  selector: 'wj-table-untyped-host',
  imports: [WjTable, WjColumn, WjTableCellSlot],
  template: `
    <wj-table [value]="rows" ariaLabel="Orders">
      <wj-column field="id" header="Order">
        <ng-template wjTableCell let-row>
          <span class="untyped">{{ describe(row) }}</span>
        </ng-template>
      </wj-column>
    </wj-table>
  `,
})
class UntypedHost {
  protected readonly rows = ORDERS;

  protected describe(row: unknown): string {
    return typeof row === 'object' && row !== null && 'customer' in row
      ? String(row.customer)
      : 'unknown';
  }
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
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const table = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTableHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  const element = fixture.nativeElement as HTMLElement;
  expect(getComputedStyle(part(element, 'th')).fontWeight).toBe('600');
  return { fixture, host: fixture.componentInstance, table, element };
}

/** The first element matching `selector` inside `element`. */
function part(element: ParentNode, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The element at `index`, which must exist. */
function nth(list: HTMLElement[], index: number): HTMLElement {
  const found = list[index];
  if (found === undefined) {
    throw new Error(`no element at index ${String(index)}`);
  }
  return found;
}

function parts(element: ParentNode, selector: string): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>(selector));
}

const tableOf = (element: HTMLElement): HTMLElement => part(element, 'wj-table table');

const headerOf = (element: HTMLElement, text: string): HTMLElement => {
  const found = parts(element, 'th').find((header) => header.textContent.trim().startsWith(text));
  if (found === undefined) {
    throw new Error(`no header ${text}`);
  }
  return found;
};

/** Optimus marks the overlay motion with classes on `p-motion`: wait until the enter is over. */
async function overlayOpen(): Promise<void> {
  const motion = (): string | undefined => document.querySelector('p-motion')?.className;
  await expect.poll(motion).toContain('-enter-');
  await expect.poll(motion).toBe('p-motion');
}

/** The rows-per-page select's combobox. */
const rowsSelect = (element: HTMLElement): HTMLElement =>
  part(element, '.p-paginator-rpp-dropdown [role="combobox"]');

/** Closes the rows-per-page select if it is open, and waits for its leave to end. */
async function closeRowsSelect(element: HTMLElement): Promise<void> {
  const combobox = element.querySelector<HTMLElement>(
    '.p-paginator-rpp-dropdown [role="combobox"]',
  );
  if (combobox === null) {
    return;
  }
  if (combobox.getAttribute('aria-expanded') === 'true') {
    combobox.focus();
    await userEvent.keyboard('{Escape}');
  }
  await expect.poll(() => combobox.getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull();
}

describe('WjTable', () => {
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
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  /** Registers the rows-per-page select to be closed before teardown. */
  function watchRowsSelect(element: HTMLElement): void {
    closeAtTeardown = () => closeRowsSelect(element);
  }

  describe('columns and cells', () => {
    it('writes a header per column and a row per value, showing the field as text', async () => {
      const { table } = await render();

      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'Total/total']);
      expect(await table.getCellTexts()).toEqual(
        ORDERS.map((order) => [
          String(order.id),
          order.customer,
          `${order.customer}=${String(order.total)}`,
        ]),
      );
    });

    it('resolves a dotted field path, and leaves a missing value empty', async () => {
      const { table } = await render('light', (host) => {
        host.city.set(true);
        host.rows.set([
          ...ORDERS.slice(0, 2),
          // A row without the nested object: the cell is empty, never "undefined".
          { id: 1, customer: 'No city', total: 1 } as Order,
        ]);
      });

      const cells = await table.getCellTexts();
      expect(cells.map((row) => row[3])).toEqual(['Hanoi', 'Hue', '']);
    });

    it('follows columns that come and go, in declaration order', async () => {
      const { fixture, host, table } = await render();
      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'Total/total']);

      host.city.set(true);
      await fixture.whenStable();
      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'Total/total', 'City']);

      host.totals.set(false);
      await fixture.whenStable();
      expect(await table.getHeaderTexts()).toEqual(['Order', 'Customer', 'City']);
      expect((await table.getCellTexts())[0]).toEqual(['1003', 'Mia Tran', 'Hanoi']);
    });

    it('follows value as it changes', async () => {
      const { fixture, host, table } = await render();

      host.rows.set(ORDERS.slice(0, 2));
      await fixture.whenStable();

      expect(await table.getCellTexts()).toHaveLength(2);
    });

    it('renders the header text from the header input', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.customerHeader.set('Buyer');
      });
      expect(await table.getHeaderTexts()).toContain('Buyer');

      host.customerHeader.set('Client');
      await fixture.whenStable();
      expect(await table.getHeaderTexts()).toContain('Client');
    });

    it('projects each wj-column into the host, hidden, so it reaches the prerendered page', async () => {
      const { element } = await render();

      const columns = parts(element, 'wj-table > wj-column');
      expect(columns).toHaveLength(3);
      expect(columns.every((column) => getComputedStyle(column).display === 'none')).toBe(true);
    });
  });

  describe('slots', () => {
    it('wjTableCell renders in each cell with the typed row, value, field and row index', async () => {
      const { element, table } = await render();

      const cells = parts(element, 'td .total');
      expect(cells.map((cell) => cell.textContent.trim())).toEqual(
        ORDERS.map((order) => `${order.customer}=${String(order.total)}`),
      );
      expect(cells.map((cell) => cell.getAttribute('data-index'))).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
      ]);
      expect(cells.every((cell) => cell.getAttribute('data-field') === 'total')).toBe(true);
      expect(cells.every((cell) => cell.closest('td') !== null)).toBe(true);
      expect(await table.getRows()).toHaveLength(5);
    });

    it('wjTableCell reports the index in value, not in the page', async () => {
      const { element } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
        host.first.set(10);
      });

      expect(parts(element, 'td .total').map((cell) => cell.getAttribute('data-index'))).toEqual(
        Array.from({ length: 10 }, (_unused, index) => String(index + 10)),
      );
    });

    it('wjTableHeaderCell renders in the header title box, with the header text and field', async () => {
      const { element } = await render();

      const head = part(element, 'th .head');
      expect(head.textContent).toBe('Total/total');
      expect(head.closest('.p-datatable-column-title')).not.toBeNull();
    });

    it('a slot without wjTableCellOf still renders, with the row as unknown', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(UntypedHost);
      await fixture.whenStable();

      expect(
        parts(fixture.nativeElement as HTMLElement, '.untyped').map((cell) => cell.textContent),
      ).toEqual(ORDERS.map((order) => order.customer));
    });
  });

  describe('sorting', () => {
    it('sortable makes the header a tab stop that names its order in aria-sort', async () => {
      const { element, table } = await render();

      expect(headerOf(element, 'Order').getAttribute('tabindex')).toBe('0');
      expect(headerOf(element, 'Customer').getAttribute('tabindex')).toBe('0');
      expect(headerOf(element, 'Total').hasAttribute('tabindex')).toBe(false);
      expect(await table.getSortOrder('Order')).toBe('none');
      expect(headerOf(element, 'Total').hasAttribute('aria-sort')).toBe(false);
      expect(parts(element, 'th p-sortIcon, th p-sorticon')).toHaveLength(2);
    });

    it('sortField and sortOrder sort the rows, and follow the models', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.sortField.set('customer');
      });
      expect((await table.getCellTexts()).map((row) => row[1])).toEqual([
        'Ada Nguyen',
        'Ivy Vo',
        'Mia Tran',
        'Noah Pham',
        'Zoe Le',
      ]);
      expect(await table.getSortOrder('Customer')).toBe('ascending');

      host.sortOrder.set(-1);
      await fixture.whenStable();
      expect((await table.getCellTexts()).map((row) => row[1])[0]).toBe('Zoe Le');
      expect(await table.getSortOrder('Customer')).toBe('descending');

      host.sortField.set('id');
      host.sortOrder.set(1);
      await fixture.whenStable();
      expect((await table.getCellTexts()).map((row) => row[0])).toEqual([
        '1001',
        '1002',
        '1003',
        '1004',
        '1005',
      ]);
    });

    it('a click on a header sorts, toggles the order, and writes both models back', async () => {
      const { host, table } = await render();

      await table.sortBy('Customer');
      expect(host.sortField()).toBe('customer');
      expect(host.sortOrder()).toBe(1);
      expect(await table.getSortOrder('Customer')).toBe('ascending');
      expect((await table.getCellTexts())[0]?.[1]).toBe('Ada Nguyen');

      await table.sortBy('Customer');
      expect(host.sortOrder()).toBe(-1);
      expect(await table.getSortOrder('Customer')).toBe('descending');
      expect((await table.getCellTexts())[0]?.[1]).toBe('Zoe Le');

      await table.sortBy('Order');
      expect(host.sortField()).toBe('id');
      expect(host.sortOrder()).toBe(1);
      expect(await table.getSortOrder('Customer')).toBe('none');
      expect((await table.getCellTexts())[0]?.[0]).toBe('1001');
    });

    it('never changes the array the app bound: it keeps its reference and its order', async () => {
      const bound = [...ORDERS];
      const { fixture, host, table } = await render('light', (initial) => {
        initial.rows.set(bound);
      });
      const before = bound.map((order) => order.id);

      await table.sortBy('Order');
      await table.sortBy('Order');
      await table.sortBy('Customer');
      host.sortField.set('total');
      host.sortOrder.set(-1);
      await fixture.whenStable();

      expect(host.rows()).toBe(bound);
      expect(bound.map((order) => order.id)).toEqual(before);
      expect((await table.getCellTexts())[0]?.[0]).toBe('1005');
    });

    it('does not sort a column that is not sortable', async () => {
      const { host, element, table } = await render();
      const before = await table.getCellTexts();

      headerOf(element, 'Total').click();

      expect(host.sortField()).toBeUndefined();
      expect(await table.getCellTexts()).toEqual(before);
    });
  });

  describe('paging', () => {
    it('paginator splits the rows into pages of ten by default', async () => {
      const { table } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
      });

      expect(await table.getRows()).toHaveLength(10);
      expect(await table.getCurrentPage()).toBe(1);
      expect((await table.getCellTexts())[0]?.[1]).toBe('Customer 01');
    });

    it('shows no pager and every row without paginator', async () => {
      const { element, table } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
      });

      expect(await table.getRows()).toHaveLength(23);
      expect(element.querySelector('.p-paginator')).toBeNull();
      expect(await table.getCurrentPage()).toBe(0);
    });

    it('rows sets the page size, and first the page, both two-way', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.rows.set(manyOrders(23));
        initial.paginator.set(true);
        initial.pageSize.set(5);
      });
      expect(await table.getRows()).toHaveLength(5);

      host.first.set(10);
      await fixture.whenStable();
      expect(await table.getCurrentPage()).toBe(3);
      expect((await table.getCellTexts())[0]?.[1]).toBe('Customer 11');

      await table.goToNextPage();
      expect(host.first()).toBe(15);
      expect(await table.getCurrentPage()).toBe(4);

      await table.goToPage(1);
      expect(host.first()).toBe(0);
    });

    it('pageChange emits a WjPageEvent for each move, after first and rows are written', async () => {
      const { host, table } = await render('light', (initial) => {
        initial.rows.set(manyOrders(23));
        initial.paginator.set(true);
        initial.pageSize.set(5);
      });

      await table.goToNextPage();
      await table.goToPage(3);
      await table.goToPreviousPage();

      expect(host.pages()).toEqual([
        { first: 5, rows: 5 },
        { first: 10, rows: 5 },
        { first: 5, rows: 5 },
      ]);
    });

    it('rowsPerPageOptions offers a select that changes the page size and emits it', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.rows.set(manyOrders(23));
        initial.paginator.set(true);
        initial.rowsPerPageOptions.set([5, 10, 20]);
      });
      watchRowsSelect(element);
      expect(await table.getRows()).toHaveLength(10);

      rowsSelect(element).click();
      await overlayOpen();
      const option = parts(document, '[role="option"]').find(
        (item) => item.textContent.trim() === '20',
      );
      option?.click();
      await expect.poll(() => host.pageSize()).toBe(20);

      expect(await table.getRows()).toHaveLength(20);
      expect(host.pages().at(-1)).toEqual({ first: 0, rows: 20 });
      await closeRowsSelect(element);
    });

    it('totalRecords sets the number of pages the pager offers', async () => {
      const { table, element } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
      });
      expect(parts(element, '.p-paginator-page')).toHaveLength(3);
      expect(await table.getCurrentPage()).toBe(1);
      TestBed.resetTestingModule();

      const wide = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
        host.totalRecords.set(100);
      });
      expect(parts(wide.element, '.p-paginator-page').length).toBeGreaterThan(3);
    });

    it.each([
      ['top', 1],
      ['bottom', 1],
      ['both', 2],
    ] as const)('paginatorPosition %s draws %s pager(s)', async (position, count) => {
      const { element } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
        host.paginatorPosition.set(position);
      });

      const pagers = parts(element, '.p-paginator');
      expect(pagers).toHaveLength(count);
      const table = tableOf(element);
      if (position === 'top') {
        expect(pagers[0]?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          table.getBoundingClientRect().top,
        );
      }
      if (position === 'bottom') {
        expect(pagers[0]?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
          table.getBoundingClientRect().bottom,
        );
      }
    });
  });

  describe('look', () => {
    it.each([
      [undefined, '12px', '16px'],
      ['small', '6px', '8px'],
      ['large', '16px', '20px'],
    ] as const)('size %s sets the cell padding to %s %s', async (size, block, inline) => {
      const { element } = await render('light', (host) => {
        host.size.set(size);
      });

      const style = getComputedStyle(part(element, 'tbody td'));
      expect([style.paddingTop, style.paddingLeft]).toEqual([block, inline]);
    });

    it('size steps the row height: small, then default, then large', async () => {
      const heights: number[] = [];
      for (const size of ['small', undefined, 'large'] as const) {
        const { element } = await render('light', (host) => {
          host.size.set(size);
        });
        heights.push(part(element, 'tbody tr').getBoundingClientRect().height);
        TestBed.resetTestingModule();
      }

      const [small = 0, normal = 0, large = 0] = heights;
      expect(small).toBeLessThan(normal);
      expect(normal).toBeLessThan(large);
      // The cell padding steps by 12 px (small), 24 px (default) and 32 px (large) per row.
      expect([normal - small, large - normal]).toEqual([12, 8]);
    });

    it('showGridlines draws a border between cells, and there is none without it', async () => {
      const inlineBorders = (element: HTMLElement): number => {
        const style = getComputedStyle(nth(parts(element, 'tbody td'), 1));
        return parseFloat(style.borderInlineStartWidth) + parseFloat(style.borderInlineEndWidth);
      };
      const plain = await render();
      expect(inlineBorders(plain.element)).toBe(0);
      TestBed.resetTestingModule();

      const gridded = await render('light', (host) => {
        host.showGridlines.set(true);
      });
      expect(inlineBorders(gridded.element)).toBeGreaterThan(0);
    });

    it('stripedRows fills every other row differently', async () => {
      const { element } = await render('light', (host) => {
        host.stripedRows.set(true);
      });
      const rows = parts(element, 'tbody tr');
      const first = nth(rows, 0);
      const second = nth(rows, 1);
      expect(getComputedStyle(first).backgroundColor).not.toBe(
        getComputedStyle(second).backgroundColor,
      );
    });

    it('rowHover highlights the row under the pointer', async () => {
      const { element } = await render('light', (host) => {
        host.rowHover.set(true);
      });
      const rows = parts(element, 'tbody tr');
      const row = nth(rows, 0);
      const other = nth(rows, 1);
      const resting = getComputedStyle(row).backgroundColor;

      await userEvent.hover(row);

      await expect.poll(() => getComputedStyle(row).backgroundColor).not.toBe(resting);
      expect(getComputedStyle(other).backgroundColor).toBe(resting);
    });
  });

  describe('layout', () => {
    it('is a block that carries no box of its own', async () => {
      const { element } = await render();
      const host = part(element, 'wj-table');
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(style.paddingTop).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(host.getBoundingClientRect().width).toBe(
        part(element, 'wj-table').parentElement?.getBoundingClientRect().width,
      );
    });

    it('wraps long text at spaces and grows the row instead of truncating', async () => {
      const long = 'A customer name that is much longer than the room the layout gives it';
      const { element } = await render('light', (host) => {
        host.width.set('260px');
        host.rows.set([{ ...ORDERS[0], customer: long } as Order]);
        host.customerHeader.set('A header that is much longer than the room it has');
      });
      const cell = nth(parts(element, 'tbody td'), 1);
      const header = headerOf(element, 'A header');

      expect(part(element, 'tbody tr').getBoundingClientRect().height).toBeGreaterThan(48);
      expect(getComputedStyle(cell).textOverflow).not.toBe('ellipsis');
      expect(cell.textContent.trim()).toBe(long);
      expect(header.textContent.trim()).toContain('much longer than the room it has');
      expect(header.getBoundingClientRect().height).toBeGreaterThan(48);
    });

    it('widens a column for an unbroken value and scrolls inside the host, never the page', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('260px');
        host.rows.set([{ ...ORDERS[0], customer: 'x'.repeat(120) } as Order]);
      });
      const host = part(element, 'wj-table');
      const container = part(element, '.p-datatable-table-container');

      expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
      expect(getComputedStyle(container).overflowX).toBe('auto');
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
      expect(ROOT.scrollWidth).toBeLessThanOrEqual(ROOT.clientWidth);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, as an object, with the routed ARIA kept on the table part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ table: { 'data-probe': 'table' }, thead: { 'data-probe': 'thead' } });
        host.ariaDescribedBy.set('hint');
      });

      const table = tableOf(element);
      expect(table.getAttribute('data-probe')).toBe('table');
      expect(part(element, 'thead').getAttribute('data-probe')).toBe('thead');
      expect(table.getAttribute('aria-label')).toBe('Orders');
      expect(table.getAttribute('aria-describedby')).toBe('hint');
    });

    it('reaches the inner parts, as a function with a function part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ table: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(tableOf(element).getAttribute('data-probe')).toBe('fn');
      expect(tableOf(element).getAttribute('aria-label')).toBe('Orders');
    });

    it('lets the routed ARIA attribute win over a pt value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ table: { 'aria-label': 'From pt' } });
      });

      expect(tableOf(element).getAttribute('aria-label')).toBe('Orders');
    });

    it('keeps a pt aria-label when no ariaLabel input is routed', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
        host.pt.set({ table: { 'aria-label': 'From pt' } });
      });

      expect(tableOf(element).getAttribute('aria-label')).toBe('From pt');
    });
  });

  describe('ARIA', () => {
    it('routes ariaLabel, ariaLabelledBy and ariaDescribedBy to the table element', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Orders');
        host.ariaLabelledBy.set('name');
        host.ariaDescribedBy.set('hint');
      });

      const table = tableOf(element);
      expect(table.getAttribute('aria-label')).toBe('Orders');
      expect(table.getAttribute('aria-labelledby')).toBe('name');
      expect(table.getAttribute('aria-describedby')).toBe('hint');
      const host = part(element, 'wj-table');
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('removes a routed attribute when its input is cleared', async () => {
      const { fixture, host, element } = await render('light', (initial) => {
        initial.ariaDescribedBy.set('hint');
      });
      expect(tableOf(element).getAttribute('aria-describedby')).toBe('hint');

      host.ariaDescribedBy.set(undefined);
      await fixture.whenStable();

      expect(tableOf(element).hasAttribute('aria-describedby')).toBe(false);
    });

    it('names the table through the harness: by its label, else by what it points at', async () => {
      const { fixture, host, table } = await render();
      expect(await table.getName()).toBe('Orders');

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();
      expect(await table.getName()).toBe('Recent orders');

      const loader = TestbedHarnessEnvironment.loader(fixture);
      expect(
        await loader.getAllHarnesses(WjTableHarness.with({ caption: /^Recent/ })),
      ).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjTableHarness.with({ caption: 'Orders' }))).toHaveLength(
        0,
      );
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('table')?.hasAttribute('aria-label'),
      ).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-table: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-table: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders the header as text', async () => {
      const { element, table } = await render('light', (host) => {
        host.customerHeader.set(PAYLOAD);
      });

      expect(await table.getHeaderTexts()).toContain(PAYLOAD);
      expect(element.querySelector('wj-table img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders a row value in the default cell as text', async () => {
      const { element, table } = await render('light', (host) => {
        host.rows.set([{ ...ORDERS[0], customer: PAYLOAD } as Order]);
      });

      expect((await table.getCellTexts())[0]?.[1]).toBe(PAYLOAD);
      expect(element.querySelector('wj-table img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders a row value inside a slot as text', async () => {
      const { element } = await render('light', (host) => {
        host.rows.set([{ ...ORDERS[0], customer: PAYLOAD } as Order]);
      });

      expect(part(element, 'td .total').textContent).toContain(PAYLOAD);
      expect(element.querySelector('wj-table img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      const table = tableOf(element);
      expect(table.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(table.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(table.getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(element.querySelector('wj-table img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('accessibility', () => {
    const STATES: [string, (host: Host) => void][] = [
      ['default', () => undefined],
      [
        'sorted ascending',
        (host) => {
          host.sortField.set('customer');
        },
      ],
      [
        'sorted descending',
        (host) => {
          host.sortField.set('customer');
          host.sortOrder.set(-1);
        },
      ],
      [
        'paginated',
        (host) => {
          host.rows.set(manyOrders(23));
          host.paginator.set(true);
          host.pageSize.set(5);
          host.rowsPerPageOptions.set([5, 10, 20]);
        },
      ],
      [
        'size small',
        (host) => {
          host.size.set('small');
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);
        watchRowsSelect(element);

        await expectNoAxeViolations(element);
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches each sortable header and the page buttons, Shift+Tab goes back', async () => {
      const { element } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
      });
      part(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(headerOf(element, 'Order'));
      await userEvent.tab();
      expect(document.activeElement).toBe(headerOf(element, 'Customer'));
      // Optimus 2.0.2 leaves its "First Page" button in the Tab order on the first page, where it
      // does nothing, so the first page link is one or two Tabs on.
      const [first, second] = parts(element, '.p-paginator-page');
      for (let step = 0; step < 3 && document.activeElement !== first; step++) {
        await userEvent.tab();
      }
      expect(document.activeElement).toBe(first);
      await userEvent.tab();
      expect(document.activeElement).toBe(second);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(first);
    });

    it('Enter and Space on a sortable header toggle its sort', async () => {
      const { host, table } = await render();
      headerOf(document.body, 'Customer').focus();

      await userEvent.keyboard('{Enter}');
      expect(await table.getSortOrder('Customer')).toBe('ascending');
      expect(host.sortOrder()).toBe(1);

      await userEvent.keyboard(' ');
      expect(await table.getSortOrder('Customer')).toBe('descending');
      expect(host.sortOrder()).toBe(-1);
      expect((await table.getCellTexts())[0]?.[1]).toBe('Zoe Le');
    });

    it('Enter and Space on a page button change the page', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.rows.set(manyOrders(23));
        initial.paginator.set(true);
        initial.pageSize.set(5);
      });

      part(element, '.p-paginator-next').focus();
      await userEvent.keyboard('{Enter}');
      expect(await table.getCurrentPage()).toBe(2);

      parts(element, '.p-paginator-page')
        .find((link) => link.textContent.trim() === '4')
        ?.focus();
      await userEvent.keyboard(' ');
      expect(await table.getCurrentPage()).toBe(4);
      expect(host.first()).toBe(15);
    });

    it('opens the rows-per-page select with ArrowDown, moves with the arrows, Enter picks', async () => {
      const { element, host } = await render('light', (initial) => {
        initial.rows.set(manyOrders(23));
        initial.paginator.set(true);
        initial.rowsPerPageOptions.set([5, 10, 20]);
      });
      watchRowsSelect(element);
      rowsSelect(element).focus();

      await userEvent.keyboard('{ArrowDown}');
      await overlayOpen();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');

      await expect.poll(() => host.pageSize()).toBe(20);
      await closeRowsSelect(element);
    });

    it('opens the rows-per-page select with Enter and Space, and Escape closes it', async () => {
      const { element } = await render('light', (host) => {
        host.rows.set(manyOrders(23));
        host.paginator.set(true);
        host.rowsPerPageOptions.set([5, 10, 20]);
      });
      watchRowsSelect(element);
      const combobox = rowsSelect(element);
      combobox.focus();

      await userEvent.keyboard('{Enter}');
      await overlayOpen();
      expect(combobox.getAttribute('aria-expanded')).toBe('true');
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => combobox.getAttribute('aria-expanded')).toBe('false');
      await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull();

      await userEvent.keyboard(' ');
      await overlayOpen();
      expect(combobox.getAttribute('aria-expanded')).toBe('true');
      await closeRowsSelect(element);
      expect(document.activeElement).toBe(combobox);
    });
  });
});
