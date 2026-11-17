import type { MegaMenuItem, MenuItem } from '@openng/optimus-ui/api';

/**
 * The structure every menu-model wrapper's item type has (FR-2): `WjMenuItem` fits it, and a
 * type-level spec keeps it so. `T` is the app's item type, so `items` and the command's `item`
 * come back as the app's own objects. `private` may not import `weeljack-ng`, not even a type
 * (the root imports `private`, and ng-packagr refuses the cycle), so the shape is written out.
 *
 * @docs-private
 */
export interface _MenuItemShape<T> {
  label?: string;
  command?: (event: { originalEvent: Event; item: T }) => void;
  items?: T[];
  disabled?: boolean;
  visible?: boolean;
  separator?: boolean;
  expanded?: boolean;
  url?: string;
  target?: string;
  routerLink?: string | unknown[];
  queryParams?: Record<string, unknown>;
  fragment?: string;
}

/**
 * The structure a megamenu item has (FR-5, FR-33): a root item is a menu item whose `items` are
 * columns of groups, each group (`I`, an item of the {@link _MenuItemShape} kind) holding its
 * entries. `T` is the app's root item type, so its command's `item` is the app's own object.
 *
 * @docs-private
 */
export interface _MegaMenuItemShape<T, I> extends Omit<_MenuItemShape<T>, 'items'> {
  items?: I[][];
}

/**
 * What {@link _toOptimusMenuModel} returns: the Optimus items to bind (`M`), and the way back from
 * one of them to the app's item.
 *
 * @docs-private
 */
export interface _OptimusMenuModel<T, M extends MenuItem | MegaMenuItem = MenuItem> {
  /** The copies to bind to Optimus's `model`. */
  readonly items: M[];
  /** The app's item behind a copy, at any depth; `undefined` for an object that is not one. */
  source(copy: MenuItem): T | undefined;
}

/** The fields of an Optimus item the copy writes: a menu item and a megamenu root item share them. */
type Fields = Pick<
  MenuItem,
  | 'label'
  | 'disabled'
  | 'visible'
  | 'separator'
  | 'expanded'
  | 'url'
  | 'target'
  | 'routerLink'
  | 'queryParams'
  | 'fragment'
  | 'command'
>;

/** Where a copy is registered against the app's item it came from. */
interface Sources<T> {
  set: (copy: MenuItem, item: T) => unknown;
}

/**
 * The allow-listed fields that are present, field by field (no spread, no `undefined` written), and
 * `command` as the only function, because Optimus calls every function-valued item field. A
 * disabled item gets none: Optimus runs a command on any click that reaches the item, and a screen
 * reader's click does.
 */
function fill<S extends Omit<_MenuItemShape<S>, 'items'>>(out: Fields, item: S): void {
  if (item.label !== undefined) out.label = item.label;
  if (item.disabled !== undefined) out.disabled = item.disabled;
  if (item.visible !== undefined) out.visible = item.visible;
  if (item.separator !== undefined) out.separator = item.separator;
  if (item.expanded !== undefined) out.expanded = item.expanded;
  if (item.url !== undefined) out.url = item.url;
  if (item.target !== undefined) out.target = item.target;
  if (item.routerLink !== undefined) out.routerLink = item.routerLink;
  if (item.queryParams !== undefined) out.queryParams = item.queryParams;
  if (item.fragment !== undefined) out.fragment = item.fragment;
  const { command } = item;
  if (command !== undefined && !item.disabled) {
    out.command = ({ originalEvent }) => {
      if (originalEvent !== undefined) command({ originalEvent, item });
    };
  }
}

/** One item as an Optimus `MenuItem`, with `escape: true` as the literal, its children too. */
function copy<T extends _MenuItemShape<T>>(item: T, sources: Sources<T>): MenuItem {
  const out: MenuItem = { escape: true };
  fill(out, item);
  if (item.items !== undefined) out.items = item.items.map((child) => copy(child, sources));
  sources.set(out, item);
  return out;
}

/**
 * Turns the app's menu items into Optimus items (FR-5, 19 Q8). It is the only library code that
 * writes `escape`: every copy, at every level, gets the literal `true`, so a label renders as text.
 * A field the type does not list, such as `escape: false` or `styleClass` on a wider object, is
 * never copied. A command is wrapped to call the app's with `{ originalEvent, item }`, `item`
 * being the app's own object. The app's objects are never changed: Optimus writes to the copies.
 *
 * @docs-private
 */
export function _toOptimusMenuModel<T extends _MenuItemShape<T>>(
  items: readonly T[],
): _OptimusMenuModel<T> {
  const sources = new WeakMap<MenuItem, T>();
  return { items: items.map((item) => copy(item, sources)), source: (c) => sources.get(c) };
}

/**
 * The megamenu's mapper (FR-5, FR-33): the root items are copied like any item, with `escape: true`
 * as well (MegaMenu reads `escape` from a root item through its index signature, and a missing
 * value renders HTML), and their `items` go through columns and groups, every group and entry
 * through the same copy. `source` finds the app's item at either level.
 *
 * @docs-private
 */
export function _toOptimusMegaMenuModel<
  T extends _MegaMenuItemShape<T, I>,
  I extends _MenuItemShape<I>,
>(items: readonly T[]): _OptimusMenuModel<T | I, MegaMenuItem> {
  const sources = new WeakMap<MenuItem | MegaMenuItem, T | I>();
  const roots = items.map((item) => {
    const out: MegaMenuItem = { escape: true };
    fill(out, item);
    if (item.items !== undefined) {
      out.items = item.items.map((column) => column.map((group) => copy(group, sources)));
    }
    sources.set(out, item);
    return out;
  });
  return { items: roots, source: (c) => sources.get(c) };
}
