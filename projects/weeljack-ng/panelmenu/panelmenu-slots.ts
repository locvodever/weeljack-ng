import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjPanelMenuItemContext } from './panelmenu-types';

/**
 * The content of each panel header and nested item of a `wj-panelmenu`: put an `<ng-template
 * wjPanelMenuItem let-item>` inside it and the menu renders it for every one, in place of its own
 * chevron and label. `let-item` is your own item object. Draw the item's `label` as visible text
 * (the menu names the item from it) and add no link or button of your own: the menu wraps the
 * template in the item's link. The slot replaces the chevron, so draw your own indicator if you
 * want one. Import the directive: an un-imported `wjPanelMenuItem` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjPanelMenuItem]' })
export class WjPanelMenuItemSlot {
  /** The template a `wj-panelmenu` renders for each header and item. */
  readonly template = inject<TemplateRef<WjPanelMenuItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjPanelMenuItemContext}. */
  static ngTemplateContextGuard(
    directive: WjPanelMenuItemSlot,
    context: unknown,
  ): context is WjPanelMenuItemContext {
    return typeof context === 'object';
  }
}
