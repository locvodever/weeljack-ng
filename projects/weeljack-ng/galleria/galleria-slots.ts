import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjGalleriaCaptionContext, WjGalleriaItemContext } from './galleria-types';

/**
 * What a `wj-galleria` shows for the active item: put an `<ng-template wjGalleriaItem>` inside it.
 * Required. Give the image a descriptive `alt`. Import the directive: an un-imported
 * `wjGalleriaItem` silently drops its template.
 *
 * `[wjGalleriaItemOf]` only types the template: bind it to your items so `let-photo` has your item
 * type. It is never read.
 */
@Directive({ selector: 'ng-template[wjGalleriaItem]' })
export class WjGalleriaItemSlot<T = unknown> {
  /** The template a `wj-galleria` renders for the active item. */
  readonly template = inject<TemplateRef<WjGalleriaItemContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjGalleriaItemOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjGalleriaItemContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjGalleriaItemSlot<T>,
    context: unknown,
  ): context is WjGalleriaItemContext<T> {
    return typeof context === 'object';
  }
}

/**
 * An optional caption over the bottom of the active item. Keep it to a title and a line.
 *
 * `[wjGalleriaCaptionOf]` only types the template, like `wjGalleriaItemOf`.
 */
@Directive({ selector: 'ng-template[wjGalleriaCaption]' })
export class WjGalleriaCaptionSlot<T = unknown> {
  /** The template a `wj-galleria` renders as the active item's caption. */
  readonly template = inject<TemplateRef<WjGalleriaCaptionContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjGalleriaCaptionOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjGalleriaCaptionContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjGalleriaCaptionSlot<T>,
    context: unknown,
  ): context is WjGalleriaCaptionContext<T> {
    return typeof context === 'object';
  }
}
