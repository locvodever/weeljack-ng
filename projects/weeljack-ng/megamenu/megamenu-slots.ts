import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjMegaMenuItemContext } from './megamenu-types';

/**
 * The content of each root item and each entry of a `wj-megamenu`: put an `<ng-template
 * wjMegaMenuItem let-item>` inside it and the menu renders it for every one, in place of its own
 * label and mark. `let-item` is your own item object. Group headers stay the menu's own text.
 * Draw the item's `label` as visible text (the menu names the item from it) and add no link or
 * button of your own: the menu wraps the template in the item's link. Import the directive: an
 * un-imported `wjMegaMenuItem` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMegaMenuItem]' })
export class WjMegaMenuItemSlot {
  /** The template a `wj-megamenu` renders for each item. */
  readonly template = inject<TemplateRef<WjMegaMenuItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjMegaMenuItemContext}. */
  static ngTemplateContextGuard(
    directive: WjMegaMenuItemSlot,
    context: unknown,
  ): context is WjMegaMenuItemContext {
    return typeof context === 'object';
  }
}

/**
 * What a `wj-megamenu` shows before its items: a brand or a title. Put an `<ng-template
 * wjMegaMenuStart>` inside it. Kept in both layouts. Import the directive: an un-imported
 * `wjMegaMenuStart` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMegaMenuStart]' })
export class WjMegaMenuStartSlot {
  /** The template a `wj-megamenu` renders at the start of the bar. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * What a `wj-megamenu` shows after its items, at the inline end: compact controls. Put an
 * `<ng-template wjMegaMenuEnd>` inside it. Kept in both layouts. Import the directive: an
 * un-imported `wjMegaMenuEnd` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMegaMenuEnd]' })
export class WjMegaMenuEndSlot {
  /** The template a `wj-megamenu` renders at the end of the bar. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}
