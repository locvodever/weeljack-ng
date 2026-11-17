import type { TablePassThrough } from '@openng/optimus-ui/table';

/** Row density of a `wj-table`: 48 px rows by default, 36 px `small`, 56 px `large`. */
export type WjTableSize = 'small' | 'large';

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
