import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjInplaceContentContext } from './inplace-types';

/**
 * What a `wj-inplace` shows until it is activated: put it in an `<ng-template wjInplaceDisplay>`
 * inside the component. The display is a button, named by this content or by `ariaLabel` /
 * `ariaLabelledBy`. Required. Import the directive: an un-imported `wjInplaceDisplay` silently
 * drops its template.
 */
@Directive({ selector: 'ng-template[wjInplaceDisplay]' })
export class WjInplaceDisplaySlot {
  /** The template the component renders as its display. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a `let-` variable in the template fails type-checking (the guard narrows to `object`, which has no `$implicit`). */
  static ngTemplateContextGuard(
    directive: WjInplaceDisplaySlot,
    context: unknown,
  ): context is object {
    return directive instanceof WjInplaceDisplaySlot && typeof context === 'object';
  }
}

/**
 * What a `wj-inplace` shows while it is active: put it in an `<ng-template wjInplaceContent>`
 * inside the component. `let-close="close"` is the function that switches back to the display
 * and returns focus to it. Required. Import the directive: an un-imported `wjInplaceContent`
 * silently drops its template.
 */
@Directive({ selector: 'ng-template[wjInplaceContent]' })
export class WjInplaceContentSlot {
  /** The template the component renders as its content. */
  readonly template = inject<TemplateRef<WjInplaceContentContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjInplaceContentContext}. */
  static ngTemplateContextGuard(
    directive: WjInplaceContentSlot,
    context: unknown,
  ): context is WjInplaceContentContext {
    return directive instanceof WjInplaceContentSlot && typeof context === 'object';
  }
}
