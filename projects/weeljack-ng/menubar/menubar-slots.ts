import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjMenubarItemContext } from './menubar-types';

/**
 * The content of each item of a `wj-menubar`: put an `<ng-template wjMenubarItem let-item
 * let-root="root">` inside it and the bar renders it for every item, on the bar and in its
 * dropdowns, in place of its own label and dropdown mark. `let-item` is your own item object and
 * `root` says whether the item is on the bar: draw your own indicator from it and from
 * `item.items`. Draw the item's `label` as visible text (the bar names the item from it) and add no
 * link or button of your own: the bar wraps the template in the item's link. Import the directive:
 * an un-imported `wjMenubarItem` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMenubarItem]' })
export class WjMenubarItemSlot {
  /** The template a `wj-menubar` renders for each item. */
  readonly template = inject<TemplateRef<WjMenubarItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjMenubarItemContext}. */
  static ngTemplateContextGuard(
    directive: WjMenubarItemSlot,
    context: unknown,
  ): context is WjMenubarItemContext {
    return typeof context === 'object';
  }
}

/**
 * What a `wj-menubar` shows before its items: a brand or a title. Put an `<ng-template
 * wjMenubarStart>` inside it. Kept in both layouts. Import the directive: an un-imported
 * `wjMenubarStart` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMenubarStart]' })
export class WjMenubarStartSlot {
  /** The template a `wj-menubar` renders at the start of the bar. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * What a `wj-menubar` shows after its items, at the inline end: compact controls. Put an
 * `<ng-template wjMenubarEnd>` inside it. Kept in both layouts. Import the directive: an
 * un-imported `wjMenubarEnd` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjMenubarEnd]' })
export class WjMenubarEndSlot {
  /** The template a `wj-menubar` renders at the end of the bar. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}
