import type { MenuPassThrough } from '@openng/optimus-ui/menu';
import type { WjMenuItem } from 'weeljack-ng';

/**
 * Pass-through for `wj-menu`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjMenuPt = MenuPassThrough;

/** What a `wjMenuItem` template sees for each item. */
export interface WjMenuItemContext {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
}
