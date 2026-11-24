import type { DockPassThrough } from '@openng/optimus-ui/types/dock';
import type { WjMenuItem } from 'weeljack-ng';

/** The edge of its container a `wj-dock` lies along. */
export type WjDockPosition = 'bottom' | 'top' | 'left' | 'right';

/**
 * Pass-through for `wj-dock`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjDockPt = DockPassThrough;

/** What a `wjDockItem` template sees for each item. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjDockItemContext = {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
};
