import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjTieredMenuItemContext } from './tieredmenu-types';

/**
 * The content of each item of a `wj-tieredmenu`: put an `<ng-template wjTieredMenuItem let-item
 * let-hasSubmenu="hasSubmenu">` inside it and the menu renders it for every item, at every level,
 * in place of its own label and submenu mark. `let-item` is your own item object and `hasSubmenu`
 * says whether the item opens a submenu: draw your own indicator from it. Draw the item's `label` as
 * visible text (the menu names the item from it) and add no link or button of your own: the menu
 * wraps the template in the item's link. Import the directive: an un-imported `wjTieredMenuItem`
 * silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTieredMenuItem]' })
export class WjTieredMenuItemSlot {
  /** The template a `wj-tieredmenu` renders for each item. */
  readonly template = inject<TemplateRef<WjTieredMenuItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjTieredMenuItemContext}. */
  static ngTemplateContextGuard(
    directive: WjTieredMenuItemSlot,
    context: unknown,
  ): context is WjTieredMenuItemContext {
    return typeof context === 'object';
  }
}
