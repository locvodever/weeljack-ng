import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The image under the divider of a `wj-imagecompare`: put one element, usually an `img` with its
 * own `alt`, in an `<ng-template wjImageCompareLeft>` inside the component. Both slots are
 * required, and a template inside an `@if` that is false when the component renders leaves one
 * missing. Import the directive: an un-imported `wjImageCompareLeft` is a missing slot.
 */
@Directive({ selector: 'ng-template[wjImageCompareLeft]' })
export class WjImageCompareLeftSlot {
  /** The template the component renders as the image that fills the box. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(
    directive: WjImageCompareLeftSlot,
    context: unknown,
  ): context is void {
    return directive instanceof WjImageCompareLeftSlot && context === undefined;
  }
}

/**
 * The image painted from the start edge to the divider of a `wj-imagecompare`: put one element,
 * usually an `img` with its own `alt`, in an `<ng-template wjImageCompareRight>` inside the
 * component. The template must render a single root element, which the divider clips. Both slots
 * are required. Import the directive: an un-imported `wjImageCompareRight` is a missing slot.
 */
@Directive({ selector: 'ng-template[wjImageCompareRight]' })
export class WjImageCompareRightSlot {
  /** The template the component renders as the image the divider clips. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(
    directive: WjImageCompareRightSlot,
    context: unknown,
  ): context is void {
    return directive instanceof WjImageCompareRightSlot && context === undefined;
  }
}
