import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjOrderListEmptyContext, WjOrderListItemContext } from './orderlist-types';

/**
 * The item of a `wj-orderlist`: put an `<ng-template wjOrderListItem>` inside it and the list
 * renders it for each item, inside Optimus's option. Without it the list shows each item's
 * `dataKey` field, else its `name`. Import the directive: an un-imported `wjOrderListItem`
 * silently drops its template.
 *
 * `[wjOrderListItemOf]` only types the template: bind it to your items
 * (`[wjOrderListItemOf]="tasks()"`) so `let-task` has your item type. It is never read, and
 * without it the item is `unknown`.
 */
@Directive({ selector: 'ng-template[wjOrderListItem]' })
export class WjOrderListItemSlot<T = unknown> {
  /** The template a `wj-orderlist` renders for each item. */
  readonly template = inject<TemplateRef<WjOrderListItemContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjOrderListItemOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjOrderListItemContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjOrderListItemSlot<T>,
    context: unknown,
  ): context is WjOrderListItemContext<T> {
    return typeof context === 'object';
  }
}

/**
 * What a `wj-orderlist` shows when it has no items, and when a filter matches none, in place of
 * the translation's `emptyMessage` and `emptyFilterMessage`. One template serves both: its
 * context says which. Import the directive: an un-imported `wjOrderListEmpty` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjOrderListEmpty]' })
export class WjOrderListEmptySlot {
  /** The template a `wj-orderlist` renders when it is empty. */
  readonly template = inject<TemplateRef<WjOrderListEmptyContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjOrderListEmptyContext}. */
  static ngTemplateContextGuard(
    directive: WjOrderListEmptySlot,
    context: unknown,
  ): context is WjOrderListEmptyContext {
    return typeof context === 'object';
  }
}
