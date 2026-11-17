import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The footer of a `wj-drawer`: put your actions in an `<ng-template wjDrawerFooter>` inside the
 * drawer. They sit below the scrolling body, end-aligned, and the footer region exists only while
 * this template is given. Import the directive: an un-imported `wjDrawerFooter` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjDrawerFooter]' })
export class WjDrawerFooterSlot {
  /** The template the drawer renders in its footer. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjDrawerFooterSlot, context: unknown): context is void {
    return directive instanceof WjDrawerFooterSlot && context === undefined;
  }
}
