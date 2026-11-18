import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, input } from '@angular/core';
import { MegaMenu } from '@openng/optimus-ui/megamenu';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMegaMenuModel,
} from 'weeljack-ng/private';
import { WjMegaMenuEndSlot, WjMegaMenuItemSlot, WjMegaMenuStartSlot } from './megamenu-slots';
import type { WjMegaMenuItem, WjMegaMenuOrientation, WjMegaMenuPt } from './megamenu-types';

/**
 * A navigation bar whose items open wide panels of grouped links in columns, over Optimus's
 * `p-megamenu`. Describe it as `WjMegaMenuItem` objects in `model`: a root item with `items` opens
 * a panel of columns, each column a list of groups with a header and their entries. Below a 960 px
 * viewport the bar collapses to a Navigation button that drops the list. The list is a
 * `role="menubar"`: give it `ariaLabel` or `ariaLabelledBy`. The bar keeps its start and end
 * slots, and its height, with no items. Keep a panel to at most three columns.
 */
@Component({
  selector: 'wj-megamenu',
  imports: [MegaMenu, NgTemplateOutlet],
  templateUrl: './megamenu.html',
  styleUrl: './megamenu.css',
})
export class WjMegaMenu {
  /**
   * The items. Replace the array to change the menu: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMegaMenuItem[]>([]);
  /** `'horizontal'` lays the root items across a bar, `'vertical'` stacks them in a column. */
  readonly orientation = input<WjMegaMenuOrientation>('horizontal');
  /** Accessible name of the list. Set on the root list, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the root list. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the list. Set on the root list. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the menu's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjMegaMenuPt>();

  protected readonly itemSlot = contentChild(WjMegaMenuItemSlot);
  protected readonly startSlot = contentChild(WjMegaMenuStartSlot);
  protected readonly endSlot = contentChild(WjMegaMenuEndSlot);

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() =>
    _toOptimusMegaMenuModel<WjMegaMenuItem, WjMenuItem>(this.model()),
  );

  /**
   * `pt` forwarded as given, plus what Optimus 2.0.2 does not do itself. It declares `ariaLabel`
   * and `ariaLabelledBy` but never renders them, so all three ARIA attributes are routed onto the
   * root list. And it puts `aria-level` on every `role="menuitem"`, which ARIA does not allow
   * there (axe `aria-allowed-attr`), so that attribute is cleared on every item.
   */
  protected readonly partAttributes = computed<WjMegaMenuPt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'rootList', {
        'aria-label': this.ariaLabel(),
        'aria-labelledby': this.ariaLabelledBy(),
        'aria-describedby': this.ariaDescribedBy(),
      }),
      'item',
      { 'aria-level': undefined },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-megamenu');
    _checkAriaOnHost('wj-megamenu');
  }
}
