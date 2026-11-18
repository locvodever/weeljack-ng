import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjContextMenuItemContext } from './contextmenu-types';

/**
 * The content of each item of a `wj-contextmenu`: put an `<ng-template wjContextMenuItem let-item>`
 * inside it and the menu renders it for every item, at every level, in place of its own label and
 * submenu mark. `let-item` is your own item object: draw an indicator of your own on an item that
 * has `items`. Draw the item's `label` as visible text (the menu names the item from it) and add no
 * link or button of your own: the menu wraps the template in the item's link. Import the directive:
 * an un-imported `wjContextMenuItem` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjContextMenuItem]' })
export class WjContextMenuItemSlot {
  /** The template a `wj-contextmenu` renders for each item. */
  readonly template = inject<TemplateRef<WjContextMenuItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjContextMenuItemContext}. */
  static ngTemplateContextGuard(
    directive: WjContextMenuItemSlot,
    context: unknown,
  ): context is WjContextMenuItemContext {
    return typeof context === 'object';
  }
}
