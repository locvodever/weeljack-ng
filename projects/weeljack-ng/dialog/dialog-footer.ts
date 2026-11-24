import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The footer of a `wj-dialog`: put your actions in an `<ng-template wjDialogFooter>` inside the
 * dialog. They sit below the scrolling body, end-aligned, and the footer region exists only while
 * this template is given. Import the directive: an un-imported `wjDialogFooter` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjDialogFooter]' })
export class WjDialogFooterSlot {
  /** The template the dialog renders in its footer. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjDialogFooterSlot, context: unknown): context is void {
    return directive instanceof WjDialogFooterSlot && context === undefined;
  }
}
