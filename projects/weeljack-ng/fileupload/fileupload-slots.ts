import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * What a `wj-fileupload` in `advanced` mode shows in its content area while the queue is empty,
 * such as a drop-zone hint: put it in an `<ng-template wjFileUploadEmpty>` inside the component.
 * Import the directive: an un-imported `wjFileUploadEmpty` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjFileUploadEmpty]' })
export class WjFileUploadEmptySlot {
  /** The template the component renders while the queue is empty. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a `let-` variable in the template fails type-checking (the guard narrows to `object`, which has no `$implicit`). */
  static ngTemplateContextGuard(
    directive: WjFileUploadEmptySlot,
    context: unknown,
  ): context is object {
    return directive instanceof WjFileUploadEmptySlot && typeof context === 'object';
  }
}
