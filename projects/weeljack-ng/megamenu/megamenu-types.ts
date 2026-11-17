import type { MegaMenuPassThrough } from '@openng/optimus-ui/megamenu';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';

/**
 * Pass-through for `wj-megamenu`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjMegaMenuPt = MegaMenuPassThrough;

/** How the root items are laid out: across a bar, or stacked in a column. */
export type WjMegaMenuOrientation = 'horizontal' | 'vertical';

/**
 * One root item of a `wj-megamenu`: a command or link on its own, or a parent whose `items` open as
 * a wide panel. The panel is a list of columns, each column a list of groups, and each group is a
 * {@link WjMenuItem} whose `label` is the group's header and whose `items` are its entries. Fields
 * not listed are dropped silently, and labels render as text, never as HTML.
 */
export interface WjMegaMenuItem extends Omit<WjMenuItem, 'items' | 'command'> {
  /** Runs when the user activates the item. A disabled item runs none. */
  command?: (event: WjMenuItemCommandEvent<WjMegaMenuItem>) => void;
  /** Columns; each column lists groups; each group's `items` are its entries. */
  items?: WjMenuItem[][];
}

/** What a `wjMegaMenuItem` template sees for each root item and each entry. */
export interface WjMegaMenuItemContext {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMegaMenuItem | WjMenuItem;
}
