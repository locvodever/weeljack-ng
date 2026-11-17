import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjTableCellContext, WjTableHeaderCellContext } from './table-types';

/**
 * The cell of a `wj-column`: put an `<ng-template wjTableCell>` inside the column to render its
 * cells yourself, instead of the `field` value as text. The template renders inside the `td` the
 * table writes, never as a row. Import the directive: an un-imported `wjTableCell` silently drops
 * its template.
 *
 * `[wjTableCellOf]` only types the template: bind it to your rows (`[wjTableCellOf]="orders"`) so
 * `let-order` has your row type. It is never read, and without it the row is `unknown`.
 */
@Directive({ selector: 'ng-template[wjTableCell]' })
export class WjTableCellSlot<T = unknown> {
  /** The template a `wj-column` renders in each of its cells. */
  readonly template = inject<TemplateRef<WjTableCellContext<T>>>(TemplateRef);
  /** Your rows, bound only so the template type-checker infers the row type `T`. */
  readonly wjTableCellOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTableCellContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTableCellSlot<T>,
    context: unknown,
  ): context is WjTableCellContext<T> {
    return directive instanceof WjTableCellSlot && typeof context === 'object';
  }
}

/**
 * The header cell of a `wj-column`: put an `<ng-template wjTableHeaderCell>` inside the column to
 * render its header yourself, instead of the `header` text. It renders inside the header's title
 * box; the sort icon stays outside it. Import the directive: an un-imported `wjTableHeaderCell`
 * silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTableHeaderCell]' })
export class WjTableHeaderCellSlot {
  /** The template a `wj-column` renders in its header. */
  readonly template = inject<TemplateRef<WjTableHeaderCellContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjTableHeaderCellContext}. */
  static ngTemplateContextGuard(
    directive: WjTableHeaderCellSlot,
    context: unknown,
  ): context is WjTableHeaderCellContext {
    return directive instanceof WjTableHeaderCellSlot && typeof context === 'object';
  }
}
