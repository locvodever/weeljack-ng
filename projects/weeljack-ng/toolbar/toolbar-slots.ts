import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The start section of a `wj-toolbar`, at the inline start after any default content: put your
 * controls in an `<ng-template wjToolbarStart>` inside the toolbar. The section exists only while
 * this template is given. Import the directive: an un-imported `wjToolbarStart` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjToolbarStart]' })
export class WjToolbarStartSlot {
  /** The template the toolbar renders in its start section. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjToolbarStartSlot, context: unknown): context is void {
    return directive instanceof WjToolbarStartSlot && context === undefined;
  }
}

/**
 * The center section of a `wj-toolbar`, centred in the free space between its neighbours: put your
 * controls in an `<ng-template wjToolbarCenter>` inside the toolbar. The section exists only while
 * this template is given. Import the directive: an un-imported `wjToolbarCenter` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjToolbarCenter]' })
export class WjToolbarCenterSlot {
  /** The template the toolbar renders in its center section. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjToolbarCenterSlot, context: unknown): context is void {
    return directive instanceof WjToolbarCenterSlot && context === undefined;
  }
}

/**
 * The end section of a `wj-toolbar`, at the inline end even when it is the only section: put your
 * controls in an `<ng-template wjToolbarEnd>` inside the toolbar. The section exists only while
 * this template is given. Import the directive: an un-imported `wjToolbarEnd` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjToolbarEnd]' })
export class WjToolbarEndSlot {
  /** The template the toolbar renders in its end section. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjToolbarEndSlot, context: unknown): context is void {
    return directive instanceof WjToolbarEndSlot && context === undefined;
  }
}
