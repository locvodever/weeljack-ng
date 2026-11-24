import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjDataViewItemContext } from './dataview-types';

/**
 * The item of a `wj-dataview`: put an `<ng-template wjDataViewItem>` inside it and the view renders
 * it for each item of the current page, inside a `li` of the list it writes. The `li` carries no
 * padding, border or fill: the look of an item is your template. Import the directive: an
 * un-imported `wjDataViewItem` silently drops its template.
 *
 * `[wjDataViewItemOf]` only types the template: bind it to your items
 * (`[wjDataViewItemOf]="products"`) so `let-product` has your item type. It is never read, and
 * without it the item is `unknown`.
 */
@Directive({ selector: 'ng-template[wjDataViewItem]' })
export class WjDataViewItemSlot<T = unknown> {
  /** The template a `wj-dataview` renders for each item. */
  readonly template = inject<TemplateRef<WjDataViewItemContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjDataViewItemOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjDataViewItemContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjDataViewItemSlot<T>,
    context: unknown,
  ): context is WjDataViewItemContext<T> {
    return typeof context === 'object';
  }
}

/**
 * The band above the items of a `wj-dataview`, such as a title or a layout switch. Import the
 * directive: an un-imported `wjDataViewHeader` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjDataViewHeader]' })
export class WjDataViewHeaderSlot {
  /** The template a `wj-dataview` renders in its header band. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * The band below the items of a `wj-dataview`. Import the directive: an un-imported
 * `wjDataViewFooter` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjDataViewFooter]' })
export class WjDataViewFooterSlot {
  /** The template a `wj-dataview` renders in its footer band. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * What a `wj-dataview` shows when it has no items, in place of the translation's `emptyMessage`.
 * Import the directive: an un-imported `wjDataViewEmpty` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjDataViewEmpty]' })
export class WjDataViewEmptySlot {
  /** The template a `wj-dataview` renders when it is empty. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}
