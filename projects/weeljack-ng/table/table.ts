import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';
import { ObjectUtils } from '@openng/optimus-ui/utils';
import type { WjPageEvent, WjPaginatorPosition, WjSortOrder } from 'weeljack-ng';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjColumn } from './column/column';
import type { WjTablePt, WjTableSize } from './table-types';

/** The rows per page a paging table uses until the app or the user picks another. */
const DEFAULT_ROWS = 10;

/** What Optimus's `onSort` emits in single-sort mode. */
interface SortMeta {
  field: string;
  order: number;
}

function isSortMeta(value: unknown): value is SortMeta {
  return (
    typeof value === 'object' &&
    value !== null &&
    'field' in value &&
    typeof value.field === 'string' &&
    'order' in value &&
    typeof value.order === 'number'
  );
}

/**
 * A data table over Optimus's `p-table`: give it `value` (the rows) and declare its columns as
 * `wj-column` children; it writes every header, row and cell itself, sorts and pages them. A
 * `wjTableCell` or `wjTableHeaderCell` template inside a column customises what a cell shows.
 * Your array is never changed: the table sorts a copy.
 *
 * The table needs a name, since it has no visible title of its own: set `ariaLabel`, or point
 * `ariaLabelledBy` at a visible heading.
 */
@Component({
  selector: 'wj-table',
  imports: [TableModule, NgTemplateOutlet],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class WjTable<T = unknown> {
  /** The rows. The table sorts a copy, so this array keeps its order and its reference. */
  readonly value = input<readonly T[]>([]);
  /** The field the rows are sorted by, `undefined` when unsorted. Two-way: `[(sortField)]`. */
  readonly sortField = model<string>();
  /** The sort direction: `1` ascending, `-1` descending. Two-way: `[(sortOrder)]`. */
  readonly sortOrder = model<WjSortOrder>(1);
  /** Shows a pager and splits the rows into pages. */
  readonly paginator = input(false, { transform: booleanAttribute });
  /** Index of the first row of the current page. Two-way: `[(first)]`. */
  readonly first = model(0);
  /** Rows per page; 10 while the table pages and none is given. Two-way: `[(rows)]`. */
  readonly rows = model<number>();
  /** Number of rows in all pages. Defaults to the length of `value`. */
  readonly totalRecords = input(0, { transform: numberAttribute });
  /** The page sizes the pager offers, as a select. */
  readonly rowsPerPageOptions = input<number[]>();
  /** Where the pager sits: above, below or both. */
  readonly paginatorPosition = input<WjPaginatorPosition>('bottom');
  /** Row density. */
  readonly size = input<WjTableSize>();
  /** Draws a border between every cell. */
  readonly showGridlines = input(false, { transform: booleanAttribute });
  /** Gives every other row a different fill. */
  readonly stripedRows = input(false, { transform: booleanAttribute });
  /** Highlights the row under the pointer. */
  readonly rowHover = input(false, { transform: booleanAttribute });
  /** Accessible name when the table has no visible title. Set on the `table` element. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the table. Set on the `table` element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the table. Set on the `table` element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the table's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTablePt>();
  /** Emits when the user moves to another page or picks another page size. */
  readonly pageChange = output<WjPageEvent>();

  /** The columns, in the order declared. */
  protected readonly columns = contentChildren(WjColumn);

  /** Optimus sorts the array it is given in place, so it gets a copy (FR-9). */
  protected readonly data = computed(() => [...this.value()]);

  protected readonly pageRows = computed(
    () => this.rows() ?? (this.paginator() ? DEFAULT_ROWS : undefined),
  );

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the table. */
  protected readonly partAttributes = computed<WjTablePt>(() =>
    _mergePartAttributes(this.pt(), 'table', {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-table');
    _checkAriaOnHost('wj-table');
  }

  /** The value of `field` on `row`, resolved the way Optimus's sort resolves it. */
  protected cellValue(row: unknown, field: string | undefined): unknown {
    if (field === undefined) {
      return undefined;
    }
    const value: unknown = ObjectUtils.resolveFieldData(row, field);
    return value;
  }

  protected sorted(event: unknown): void {
    if (isSortMeta(event)) {
      this.sortField.set(event.field);
      this.sortOrder.set(event.order === -1 ? -1 : 1);
    }
  }

  protected paged(event: WjPageEvent): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.pageChange.emit({ first: event.first, rows: event.rows });
  }
}
