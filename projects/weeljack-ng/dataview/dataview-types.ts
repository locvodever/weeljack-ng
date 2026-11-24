import type { DataViewPassThrough } from '@openng/optimus-ui/dataview';

/**
 * Pass-through for `wj-dataview`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjDataViewPt = DataViewPassThrough;

/** How a `wj-dataview` lays its items out: one column, or a grid of equal tracks. */
export type WjDataViewLayout = 'list' | 'grid';

/**
 * What a `wjDataViewItem` template sees for each item of the current page. `let-item` is the item.
 * `T` is the item type: give the slot `[wjDataViewItemOf]` to have it inferred from your items.
 */
export interface WjDataViewItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
  /** Index of the item in the whole list: `first` plus its place on the page. */
  index: number;
  /** The layout the item is shown in. */
  layout: WjDataViewLayout;
}
