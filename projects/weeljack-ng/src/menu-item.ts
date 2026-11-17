/*
 * The public types shared by every menu-model entry (01 Q2): `weeljack-ng/menu` and its siblings
 * take `WjMenuItem` objects, and the wrappers hand a `WjMenuItemCommandEvent` to each command. They
 * live in the root because an entry never imports another entry (13 Q3). Type-only: nothing in this
 * file reaches the root entry's bundle.
 */

/**
 * One entry of a menu, as plain data. It is a subset of what Optimus's menu item takes: a field
 * not listed here (`icon`, `style`, `styleClass`, `escape`, a tooltip, ...) is not part of the API,
 * and is dropped silently when the wrapper passes the item on. Labels render as text, never as
 * HTML. To change a menu, pass a new array: the wrappers read the array they were given, they do
 * not watch it, and they never change your objects.
 */
export interface WjMenuItem {
  /** The text of the item. Rendered as text, never as HTML. */
  label?: string;
  /** Runs when the user activates the item with a click, Enter or Space. A disabled item runs none. */
  command?: (event: WjMenuItemCommandEvent) => void;
  /** Children: the entries of a group, or the items of a submenu, depending on the menu. */
  items?: WjMenuItem[];
  /** Makes the item inert: it is skipped by the arrow keys and runs nothing. */
  disabled?: boolean;
  /** `false` leaves the item out. */
  visible?: boolean;
  /** Draws a separator line instead of an item. */
  separator?: boolean;
  /** Whether a parent starts open, for the menus that expand in place. */
  expanded?: boolean;
  /** A plain link. Angular's URL sanitizer still applies to it. */
  url?: string;
  /** Where a `url` opens, such as `_blank`. */
  target?: string;
  /** A router link: a path or a commands array. */
  routerLink?: string | unknown[];
  /** Query parameters of a `routerLink`. */
  queryParams?: Record<string, unknown>;
  /** The fragment of a `routerLink`. */
  fragment?: string;
}

/**
 * What a menu item's `command` receives. `I` is the item type of the menu: `WjMenuItem` by default.
 */
export interface WjMenuItemCommandEvent<I = WjMenuItem> {
  /** The click or key event that ran the command. */
  originalEvent: Event;
  /** Your own item object: the same reference you put in the model. */
  item: I;
}
