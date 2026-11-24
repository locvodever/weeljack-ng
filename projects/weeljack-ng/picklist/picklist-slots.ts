import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjPickListEmptyContext, WjPickListItemContext } from './picklist-types';

/**
 * The item of a `wj-picklist`: put an `<ng-template wjPickListItem>` inside it and both lists
 * render it for each item, inside Optimus's option. Without it the lists show each item's
 * `dataKey` field, else its `name`. Import the directive: an un-imported `wjPickListItem`
 * silently drops its template.
 *
 * `[wjPickListItemOf]` only types the template: bind it to your items
 * (`[wjPickListItemOf]="columns()"`) so `let-column` has your item type. It is never read, and
 * without it the item is `unknown`.
 */
@Directive({ selector: 'ng-template[wjPickListItem]' })
export class WjPickListItemSlot<T = unknown> {
  /** The template a `wj-picklist` renders for each item. */
  readonly template = inject<TemplateRef<WjPickListItemContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjPickListItemOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjPickListItemContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjPickListItemSlot<T>,
    context: unknown,
  ): context is WjPickListItemContext<T> {
    return typeof context === 'object';
  }
}

/**
 * What a `wj-picklist` shows in a list that has no items, in place of the translation's
 * `emptyMessage`. One template serves both lists: its context says which. Import the directive: an
 * un-imported `wjPickListEmpty` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjPickListEmpty]' })
export class WjPickListEmptySlot {
  /** The template a `wj-picklist` renders in an empty list. */
  readonly template = inject<TemplateRef<WjPickListEmptyContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjPickListEmptyContext}. */
  static ngTemplateContextGuard(
    directive: WjPickListEmptySlot,
    context: unknown,
  ): context is WjPickListEmptyContext {
    return typeof context === 'object';
  }
}
