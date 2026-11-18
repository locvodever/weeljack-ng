import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The region above a `wj-card`'s body, meant for media such as a picture: put it in an
 * `<ng-template wjCardHeader>` inside the card. The region clips to the card's top corners and
 * exists only while this template is given. Import the directive: an un-imported `wjCardHeader`
 * silently drops its template.
 */
@Directive({ selector: 'ng-template[wjCardHeader]' })
export class WjCardHeaderSlot {
  /** The template the card renders above its body. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a `let-` variable in the template fails type-checking (the guard narrows to `object`, which has no `$implicit`). */
  static ngTemplateContextGuard(directive: WjCardHeaderSlot, context: unknown): context is object {
    return directive instanceof WjCardHeaderSlot && typeof context === 'object';
  }
}

/**
 * The title of a `wj-card`, in place of the `header` text: put it in an
 * `<ng-template wjCardTitle>` inside the card. Put a heading of your page's level in it: the title
 * part is a `div`, not a heading. Import the directive: an un-imported `wjCardTitle` silently
 * drops its template.
 */
@Directive({ selector: 'ng-template[wjCardTitle]' })
export class WjCardTitleSlot {
  /** The template the card renders as its title. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a `let-` variable in the template fails type-checking (the guard narrows to `object`, which has no `$implicit`). */
  static ngTemplateContextGuard(directive: WjCardTitleSlot, context: unknown): context is object {
    return directive instanceof WjCardTitleSlot && typeof context === 'object';
  }
}

/**
 * The subtitle of a `wj-card`, in place of the `subheader` text: put it in an
 * `<ng-template wjCardSubtitle>` inside the card. Import the directive: an un-imported
 * `wjCardSubtitle` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjCardSubtitle]' })
export class WjCardSubtitleSlot {
  /** The template the card renders as its subtitle. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a `let-` variable in the template fails type-checking (the guard narrows to `object`, which has no `$implicit`). */
  static ngTemplateContextGuard(
    directive: WjCardSubtitleSlot,
    context: unknown,
  ): context is object {
    return directive instanceof WjCardSubtitleSlot && typeof context === 'object';
  }
}

/**
 * The footer of a `wj-card`, a row of actions under the content: put it in an
 * `<ng-template wjCardFooter>` inside the card. The footer exists only while this template is
 * given. Import the directive: an un-imported `wjCardFooter` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjCardFooter]' })
export class WjCardFooterSlot {
  /** The template the card renders in its footer. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a `let-` variable in the template fails type-checking (the guard narrows to `object`, which has no `$implicit`). */
  static ngTemplateContextGuard(directive: WjCardFooterSlot, context: unknown): context is object {
    return directive instanceof WjCardFooterSlot && typeof context === 'object';
  }
}
