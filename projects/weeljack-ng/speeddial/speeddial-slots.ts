import { Directive, TemplateRef, inject } from '@angular/core';
import type { WjSpeedDialItemContext } from './speeddial-types';

/**
 * The icon of each action of a `wj-speeddial`: put an `<ng-template wjSpeedDialItem let-item>` inside
 * it and the dial draws a round button for every item with your template inside. `let-item` is your
 * own item object. Draw a decorative icon only (an inline SVG, `aria-hidden`, 16 px, in
 * `currentColor`): the button is named by the item's `label`, which is never drawn. Add no link or
 * button of your own. Give the slot when the dial is created, and import the directive: an
 * un-imported `wjSpeedDialItem` silently drops its template and every action is empty.
 */
@Directive({ selector: 'ng-template[wjSpeedDialItem]' })
export class WjSpeedDialItemSlot {
  /** The template a `wj-speeddial` renders in each action. */
  readonly template = inject<TemplateRef<WjSpeedDialItemContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjSpeedDialItemContext}. */
  static ngTemplateContextGuard(
    directive: WjSpeedDialItemSlot,
    context: unknown,
  ): context is WjSpeedDialItemContext {
    return typeof context === 'object';
  }
}
