import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjCarouselItemContext } from './carousel-types';

/**
 * The content of each slide of a `wj-carousel`: put an `<ng-template wjCarouselItem>` inside it and
 * the carousel renders it for every item of `value`. Without one the slides are empty. Import the
 * directive: an un-imported `wjCarouselItem` silently drops its template.
 *
 * `[wjCarouselItemOf]` only types the template: bind it to your items
 * (`[wjCarouselItemOf]="products"`) so `let-product` has your item type. It is never read, and
 * without it the item is `unknown`.
 */
@Directive({ selector: 'ng-template[wjCarouselItem]' })
export class WjCarouselItemSlot<T = unknown> {
  /** The template a `wj-carousel` renders for each slide. */
  readonly template = inject<TemplateRef<WjCarouselItemContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjCarouselItemOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjCarouselItemContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjCarouselItemSlot<T>,
    context: unknown,
  ): context is WjCarouselItemContext<T> {
    return typeof context === 'object';
  }
}
