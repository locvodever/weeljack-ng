import type { PickListPassThrough } from '@openng/optimus-ui/picklist';

/**
 * Pass-through for `wj-picklist`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjPickListPt = PickListPassThrough;

/** Which of the two lists: the one the items start in, or the one they are moved to. */
export type WjPickListName = 'source' | 'target';

/**
 * What a `wjPickListItem` template sees for each item, in either list. `let-item` is the item.
 * `T` is the item type: give the slot `[wjPickListItemOf]` to have it inferred from your items.
 */
export interface WjPickListItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
  /** Index of the item in the list the user sees. */
  index: number;
  /** Whether the item is selected. */
  selected: boolean;
  /** Whether the item is disabled. */
  disabled: boolean;
}

/** What a `wjPickListEmpty` template sees. */
export interface WjPickListEmptyContext {
  /** The list that is empty. */
  list: WjPickListName;
}
