import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The content of a `wj-splitbutton`'s main button: put an `<ng-template wjSplitButtonContent>`
 * inside it, such as a decorative icon beside the text, and the button renders it in place of its
 * `label`. The slot has no context. Draw the `label` as visible text: the button is named from
 * `ariaLabel`, or else from `label`, and the visible text should start that name. Give the slot at
 * creation: it is read once. Import the directive: an un-imported `wjSplitButtonContent` silently
 * drops its template.
 */
@Directive({ selector: 'ng-template[wjSplitButtonContent]' })
export class WjSplitButtonContentSlot {
  /** The template a `wj-splitbutton` renders inside its main button. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}
