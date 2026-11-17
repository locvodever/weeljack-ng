import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjScrollerItemContext, WjScrollerLoaderContext } from './scroller-types';

/**
 * The item of a `wj-scroller`: put an `<ng-template wjScrollerItem>` inside it and the scroller
 * renders it for each item in view. Write one element per item, at `itemSize` along the axis. An
 * item of a list should carry list semantics in that markup. Import the directive: an un-imported
 * `wjScrollerItem` silently drops its template.
 *
 * `[wjScrollerItemOf]` only types the template: bind it to your items (`[wjScrollerItemOf]="rows"`)
 * so `let-row` has your item type. It is never read, and without it the item is `unknown`.
 */
@Directive({ selector: 'ng-template[wjScrollerItem]' })
export class WjScrollerItemSlot<T = unknown> {
  /** The template a `wj-scroller` renders for each item. */
  readonly template = inject<TemplateRef<WjScrollerItemContext<T>>>(TemplateRef);
  /** Your items, bound only so the template type-checker infers the item type `T`. */
  readonly wjScrollerItemOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjScrollerItemContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjScrollerItemSlot<T>,
    context: unknown,
  ): context is WjScrollerItemContext<T> {
    return typeof context === 'object';
  }
}

/**
 * The placeholder of a `wj-scroller` that is `lazy` and `loading`: its presence turns the loader
 * on, and the scroller renders the template once per placeholder, one for each item that fits the
 * viewport. Write one element at `itemSize`. Import the directive: an un-imported
 * `wjScrollerLoader` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjScrollerLoader]' })
export class WjScrollerLoaderSlot {
  /** The template a `wj-scroller` renders for each placeholder. */
  readonly template = inject<TemplateRef<WjScrollerLoaderContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjScrollerLoaderContext}. */
  static ngTemplateContextGuard(
    directive: WjScrollerLoaderSlot,
    context: unknown,
  ): context is WjScrollerLoaderContext {
    return typeof context === 'object';
  }
}
