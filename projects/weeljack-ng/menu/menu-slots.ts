import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjMenuItemContext } from './menu-types';

/**
 * The content of each item of a `wj-menu`: put an `<ng-template wjMenuItem let-item>` inside it and
 * the menu renders it for every item, in place of its own label. `let-item` is your own item
 * object. Draw the item's `label` as visible text (the menu names the item from it), optionally
 * with an icon beside it, and add no link or button of your own: the menu wraps the template in
 * the item's link. Import the directive: an un-imported `wjMenuItem` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMenuItem]' })
export class WjMenuItemSlot {
  /** The template a `wj-menu` renders for each item. */
  readonly template = inject<TemplateRef<WjMenuItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjMenuItemContext}. */
  static ngTemplateContextGuard(
    directive: WjMenuItemSlot,
    context: unknown,
  ): context is WjMenuItemContext {
    return typeof context === 'object';
  }
}
