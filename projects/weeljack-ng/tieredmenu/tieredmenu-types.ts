import type { TieredMenuPassThrough } from '@openng/optimus-ui/tieredmenu';
import type { WjMenuItem } from 'weeljack-ng';

/**
 * Pass-through for `wj-tieredmenu`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTieredMenuPt = TieredMenuPassThrough;

/** What a `wjTieredMenuItem` template sees for each item. */
export interface WjTieredMenuItemContext {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
  /** Whether the item opens a submenu: draw your own indicator when it does. */
  hasSubmenu: boolean;
}
