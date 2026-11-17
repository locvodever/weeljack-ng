import type { VirtualScrollerPassThrough } from '@openng/optimus-ui/scroller';

/**
 * Pass-through for `wj-scroller`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjScrollerPt = VirtualScrollerPassThrough;

/** The axis a `wj-scroller` scrolls along. `'both'` waits for a need. */
export type WjScrollerOrientation = 'vertical' | 'horizontal';

/** The items a `wj-scroller` has in view or asks for: `first` is the index of the first one. */
export interface WjScrollerRange {
  first: number;
  last: number;
}

/**
 * What a `wjScrollerItem` template sees for each rendered item. `let-item` is the item. `T` is the
 * item type: give the slot `[wjScrollerItemOf]` to have it inferred from your items.
 */
export interface WjScrollerItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
  /** Index of the item in `items`, not among the rendered ones. */
  index: number;
  /** The number of items. */
  count: number;
  first: boolean;
  last: boolean;
  even: boolean;
  odd: boolean;
}

/** What a `wjScrollerLoader` template sees for each placeholder. */
export interface WjScrollerLoaderContext {
  /** Index of the placeholder among the ones shown. */
  index: number;
}
