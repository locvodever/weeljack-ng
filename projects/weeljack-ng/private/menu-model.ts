import type { MenuItem } from '@openng/optimus-ui/api';

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
 * What {@link _toOptimusMenuModel} returns: the Optimus items to bind, and the way back from one
 * of them to the app's item.
 *
 * @docs-private
 */
export interface _OptimusMenuModel<T> {
  /** The copies to bind to Optimus's `model`. */
  readonly items: MenuItem[];
  /** The app's item behind a copy, at any depth; `undefined` for an object that is not one. */
  source(copy: MenuItem): T | undefined;
}

/**
 * One item as an Optimus `MenuItem`: the allow-listed fields that are present, field by field (no
 * spread, no `undefined` written), `escape: true` as the literal, and `command` as the only
 * function, because Optimus calls every function-valued item field.
 */
function copy<T extends _MenuItemShape<T>>(item: T, sources: WeakMap<MenuItem, T>): MenuItem {
  const out: MenuItem = { escape: true };
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
  if (item.items !== undefined) out.items = item.items.map((child) => copy(child, sources));
  const { command } = item;
  if (command !== undefined) {
    out.command = ({ originalEvent }) => {
      if (originalEvent !== undefined) command({ originalEvent, item });
    };
  }
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
