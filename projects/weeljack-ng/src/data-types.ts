/*
 * Public types shared by two or more data entries (01 Q2): the column model and the paging
 * vocabulary of `weeljack-ng/table`, `weeljack-ng/paginator`, `weeljack-ng/dataview` and, later,
 * `weeljack-ng/treetable`. They live here because an entry never imports another entry (13 Q3).
 * Type-only: nothing in this file reaches the root entry's bundle.
 */

/** Sort direction: `1` ascending, `-1` descending. */
export type WjSortOrder = 1 | -1;

/** How a column filter compares a row's value with the filter's value. */
export type WjFilterMatchMode =
  | 'startsWith'
  | 'contains'
  | 'notContains'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between'
  | 'is'
  | 'isNot'
  | 'before'
  | 'after'
  | 'dateIs'
  | 'dateIsNot'
  | 'dateBefore'
  | 'dateAfter';

/** One filter rule of a column. */
export interface WjFilterMetadata {
  /** The value rows are compared with. */
  value?: unknown;
  /** How rows are compared with `value`. */
  matchMode?: WjFilterMatchMode;
  /** How this rule combines with the previous rule of the same column. */
  operator?: 'and' | 'or';
}

/** The filters of a table, by column field: one rule, or a list of rules. */
export type WjFilters = Record<string, WjFilterMetadata | WjFilterMetadata[]>;

/** The side a frozen column sticks to. */
export type WjFrozenAlign = 'left' | 'right';

/** The kind of value a column's filter edits. */
export type WjColumnFilterType = 'text' | 'numeric' | 'date' | 'boolean';

/** What a lazy table asks its app to load: the page, sort and filters it now shows. */
export interface WjLazyLoadEvent {
  /** Index of the first row of the requested page. */
  first: number;
  /** Rows per page, `undefined` when the table does not page. */
  rows: number | undefined;
  /** The field the rows are sorted by, `undefined` when unsorted. */
  sortField: string | undefined;
  /** The sort direction. */
  sortOrder: WjSortOrder;
  /** The active filters, by column field. */
  filters: WjFilters;
  /** The global filter text, `undefined` when none. */
  globalFilter: string | undefined;
}

/** The page a pager moved to. */
export interface WjPageEvent {
  /** Index of the first row of the page. */
  first: number;
  /** Rows per page. */
  rows: number;
}

/** Where a table or data view puts its pager: above, below or both. */
export type WjPaginatorPosition = 'top' | 'bottom' | 'both';
