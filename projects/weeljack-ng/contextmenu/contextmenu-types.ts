import type { ContextMenuPassThrough } from '@openng/optimus-ui/contextmenu';
import type { WjMenuItem } from 'weeljack-ng';

/**
 * Pass-through for `wj-contextmenu`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjContextMenuPt = ContextMenuPassThrough;

/** What a `wjContextMenuItem` template sees for each item. */
export interface WjContextMenuItemContext {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
}
