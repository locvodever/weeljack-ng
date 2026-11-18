import type { MenubarPassThrough } from '@openng/optimus-ui/menubar';
import type { WjMenuItem } from 'weeljack-ng';

/**
 * Pass-through for `wj-menubar`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjMenubarPt = MenubarPassThrough;

/** What a `wjMenubarItem` template sees for each item. */
export interface WjMenubarItemContext {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
  /** Whether the item is on the bar itself, not in a dropdown: draw a root parent's mark from it. */
  root: boolean;
}
