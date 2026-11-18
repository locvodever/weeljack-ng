import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjDockItemContext } from './dock-types';

/**
 * The icon of each item of a `wj-dock`: put an `<ng-template wjDockItem let-item>` inside it and
 * the dock renders it in every tile. `let-item` is your own item object. Draw a decorative icon
 * only (an inline SVG, `aria-hidden`, about 24 px, in `currentColor`): the tile is named by the
 * item's `label`, which is never drawn, and the link around the template is hidden from assistive
 * technology. Add no link or button of your own. Give the slot when the dock is created, and import
 * the directive: an un-imported `wjDockItem` silently drops its template and every tile is empty.
 */
@Directive({ selector: 'ng-template[wjDockItem]' })
export class WjDockItemSlot {
  /** The template a `wj-dock` renders in each tile. */
  readonly template = inject<TemplateRef<WjDockItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjDockItemContext}. */
  static ngTemplateContextGuard(
    directive: WjDockItemSlot,
    context: unknown,
  ): context is WjDockItemContext {
    return typeof context === 'object';
  }
}
