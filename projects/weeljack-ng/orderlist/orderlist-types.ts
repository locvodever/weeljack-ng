import type { OrderListPassThrough } from '@openng/optimus-ui/orderlist';

/**
 * Pass-through for `wj-orderlist`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjOrderListPt = OrderListPassThrough;

/** Which side of the list the move buttons sit on. */
export type WjOrderListControlsPosition = 'left' | 'right';

/**
 * What a `wjOrderListItem` template sees for each item. `let-item` is the item. `T` is the item
 * type: give the slot `[wjOrderListItemOf]` to have it inferred from your items.
 */
export interface WjOrderListItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
  /** Index of the item in the list the user sees: with a filter on, among the matches. */
  index: number;
  /** Whether the item is selected. */
  selected: boolean;
}

/** What a `wjOrderListEmpty` template sees. */
export interface WjOrderListEmptyContext {
  /** `true` when a filter emptied the list, `false` when there are no items at all. */
  filtered: boolean;
}
