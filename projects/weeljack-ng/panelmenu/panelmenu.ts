import { NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, computed, contentChild, input } from '@angular/core';
import type { MenuItem } from '@openng/optimus-ui/api';
import { PanelMenu } from '@openng/optimus-ui/panelmenu';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
} from 'weeljack-ng/private';
import { WjPanelMenuItemSlot } from './panelmenu-slots';
import type { WjPanelMenuPt } from './panelmenu-types';

/**
 * Optimus 2.0.2 renders the label of a nested item that has a `routerLink` as HTML, whatever
 * `escape` says, so the router fields are taken off every copy: no item of this menu routes (the
 * docs page says so). The copies are the mapper's own, never the app's objects.
 */
function unrouted(items: MenuItem[]): void {
  for (const item of items) {
    delete item.routerLink;
    delete item.queryParams;
    delete item.fragment;
    if (item.items !== undefined) unrouted(item.items);
  }
}

/**
 * Optimus gives a part function the item's state as `context` (it types only `instance`): whether
 * this item is disabled.
 */
function isDisabled(options: unknown): boolean {
  return (
    typeof options === 'object' &&
    options !== null &&
    'context' in options &&
    typeof options.context === 'object' &&
    options.context !== null &&
    'disabled' in options.context &&
    options.context.disabled === true
  );
}

/**
 * Collapsible panels of nested links, for side navigation, over Optimus's `p-panelmenu`. Describe
 * it as `WjMenuItem` objects in `model`: each root item is a panel whose `items` are a tree, and
 * `expanded` opens a panel or a nested parent at first render. Single by default: opening a panel
 * closes the open one. It has no accessible name of its own and no ARIA inputs: wrap it in your
 * own `<nav aria-label="...">`. Expansion lives on copies of your items and resets when you pass a
 * new array. `routerLink` is not supported: run a `command` with your router, or give a `url`.
 * With no items, nothing renders.
 */
@Component({
  selector: 'wj-panelmenu',
  imports: [PanelMenu, NgTemplateOutlet],
  templateUrl: './panelmenu.html',
  styleUrl: './panelmenu.css',
})
export class WjPanelMenu {
  /**
   * The items. Replace the array to change the menu: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** Lets several panels stay open at once. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the menu's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjPanelMenuPt>();

  protected readonly itemSlot = contentChild(WjPanelMenuItemSlot);
  protected readonly motion = _OVERLAY_MOTION;

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() => {
    const mapped = _toOptimusMenuModel(this.model());
    unrouted(mapped.items);
    return mapped;
  });

  /**
   * `pt` forwarded as given, plus what Optimus 2.0.2 does not do itself. A separator is `role=
   * "separator"` inside a `role="tree"`, which ARIA does not allow there (axe `aria-required-
   * children`), so it is made presentational: it is only a rule. And a disabled nested item has no
   * `aria-disabled`, so a screen reader would not know it is inert: it is set on the `li`.
   */
  protected readonly partAttributes = computed<WjPanelMenuPt>(() => {
    const own = _mergePartAttributes(this.pt(), 'separator', { role: 'none' });
    return (context) => {
      const pt = own(context);
      const { item } = pt;
      return {
        ...pt,
        item: (options) => {
          const given = typeof item === 'function' ? item(options) : item;
          const attributes = typeof given === 'string' ? { class: given } : given;
          return isDisabled(options)
            ? { ...attributes, 'aria-disabled': 'true' }
            : (attributes ?? {});
        },
      };
    };
  });

  constructor() {
    _checkWeeljackSetup('wj-panelmenu');
    _checkAriaOnHost('wj-panelmenu', 'Wrap the menu in your own <nav aria-label="..."> instead');
  }
}
