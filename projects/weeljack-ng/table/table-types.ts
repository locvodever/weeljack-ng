import type { TablePassThrough } from '@openng/optimus-ui/table';

/** Row density of a `wj-table`: 48 px rows by default, 36 px `small`, 56 px `large`. */
export type WjTableSize = 'small' | 'large';

/** How many rows a `wj-table` lets the user select: one, or any number with a checkbox column. */
export type WjTableSelectionMode = 'single' | 'multiple';

/** How many rows may be expanded at once. */
export type WjTableRowExpandMode = 'single' | 'multiple';

/** Where a `wj-table` puts its column filters: a row under the headers, or a menu per column. */
export type WjTableFilterDisplay = 'row' | 'menu';

/**
 * Pass-through for `wj-table`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTablePt = TablePassThrough;

/**
 * What a `wjTableCell` template sees for each row of its column. `let-row` is the row, and
 * `let-value="value"` is the column's field resolved on it (`undefined` without a `field`).
 * `T` is the row type: give the slot `[wjTableCellOf]` to have it inferred from your rows.
 */
export interface WjTableCellContext<T = unknown> {
  /** The row. */
  $implicit: T;
  /** The column's `field` resolved on the row; dotted paths work. */
  value: unknown;
  /** The column's `field`. */
  field: string | undefined;
  /** Index of the row in `value`, not in the current page. */
  rowIndex: number;
}

/** What a `wjTableHeaderCell` template sees: the column's `header` text and `field`. */
export interface WjTableHeaderCellContext {
  /** The column's `header` text. */
  $implicit: string | undefined;
  /** The column's `field`. */
  field: string | undefined;
}

/**
 * What a `wjTableRowExpansion` template sees for an expanded row: `let-row` is the row. `T` is the
 * row type: give the slot `[wjTableRowExpansionOf]` to have it inferred from your rows.
 */
export interface WjTableRowExpansionContext<T = unknown> {
  /** The row. */
  $implicit: T;
  /** Index of the row in `value`, not in the current page. */
  rowIndex: number;
}

/**
 * What a `wjTableGroupHeader` template sees for the first row of each group: `let-row` is that row
 * and `let-group="group"` is its `groupRowsBy` value.
 */
export interface WjTableGroupHeaderContext<T = unknown> {
  /** The first row of the group. */
  $implicit: T;
  /** The `groupRowsBy` field resolved on the row. */
  group: unknown;
  /** Index of the row in `value`, not in the current page. */
  rowIndex: number;
}

/** A row that was expanded or collapsed. */
export interface WjTableRowToggleEvent<T = unknown> {
  /** The row. */
  row: T;
}

/** A row that entered edit mode, was saved or was cancelled. */
export interface WjTableRowEditEvent<T = unknown> {
  /** The row object: the editors wrote into it, so on cancel restore your own copy. */
  row: T;
  /** Index of the row in `value`, not in the current page. */
  index: number;
}
