import { Directive, TemplateRef, inject, input } from '@angular/core';
import type {
  WjTableCellContext,
  WjTableGroupHeaderContext,
  WjTableHeaderCellContext,
  WjTableRowExpansionContext,
} from './table-types';

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

/**
 * The editor of a `wj-column`: put an `<ng-template wjTableCellEditor>` inside the column and its
 * cells show it, instead of their usual content, while their row is in edit mode. Any editor makes
 * the table write a trailing column with the Edit, Save and Cancel buttons, and the rows need a
 * `dataKey`. Import the directive: an un-imported `wjTableCellEditor` silently drops its template.
 *
 * `[wjTableCellEditorOf]` only types the template: bind it to your rows.
 */
@Directive({ selector: 'ng-template[wjTableCellEditor]' })
export class WjTableCellEditorSlot<T = unknown> {
  /** The template a `wj-column` renders in its cells while the row is edited. */
  readonly template = inject<TemplateRef<WjTableCellContext<T>>>(TemplateRef);
  /** Your rows, bound only so the template type-checker infers the row type `T`. */
  readonly wjTableCellEditorOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTableCellContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTableCellEditorSlot<T>,
    context: unknown,
  ): context is WjTableCellContext<T> {
    return typeof context === 'object';
  }
}

/**
 * The content of an expanded row, a table-level slot: put an `<ng-template wjTableRowExpansion>`
 * inside the `wj-table`, and the table writes a leading toggle column and, below an expanded row,
 * a full-width row holding this template. The rows need a `dataKey`. Import the directive: an
 * un-imported `wjTableRowExpansion` silently drops its template.
 *
 * `[wjTableRowExpansionOf]` only types the template: bind it to your rows.
 */
@Directive({ selector: 'ng-template[wjTableRowExpansion]' })
export class WjTableRowExpansionSlot<T = unknown> {
  /** The template the table renders in an expanded row. */
  readonly template = inject<TemplateRef<WjTableRowExpansionContext<T>>>(TemplateRef);
  /** Your rows, bound only so the template type-checker infers the row type `T`. */
  readonly wjTableRowExpansionOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTableRowExpansionContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTableRowExpansionSlot<T>,
    context: unknown,
  ): context is WjTableRowExpansionContext<T> {
    return typeof context === 'object';
  }
}

/**
 * The header of a row group, a table-level slot used with `groupRowsBy`: put an
 * `<ng-template wjTableGroupHeader>` inside the `wj-table` to render each group's header
 * yourself, instead of the group value as text. Import the directive: an un-imported
 * `wjTableGroupHeader` silently drops its template.
 *
 * `[wjTableGroupHeaderOf]` only types the template: bind it to your rows.
 */
@Directive({ selector: 'ng-template[wjTableGroupHeader]' })
export class WjTableGroupHeaderSlot<T = unknown> {
  /** The template the table renders in each group header. */
  readonly template = inject<TemplateRef<WjTableGroupHeaderContext<T>>>(TemplateRef);
  /** Your rows, bound only so the template type-checker infers the row type `T`. */
  readonly wjTableGroupHeaderOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTableGroupHeaderContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTableGroupHeaderSlot<T>,
    context: unknown,
  ): context is WjTableGroupHeaderContext<T> {
    return typeof context === 'object';
  }
}

/**
 * What the table shows instead of its default empty row, a full-width cell, when it has no rows.
 * Import the directive: an un-imported `wjTableEmpty` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTableEmpty]' })
export class WjTableEmptySlot {
  /** The template the table renders in its empty row. */
  readonly template = inject(TemplateRef);

  /** The template has no context. */
  static ngTemplateContextGuard(directive: WjTableEmptySlot, context: unknown): context is object {
    return typeof context === 'object';
  }
}

/**
 * What the table shows in the body, in place of its rows, while it is `loading`. Without it
 * Optimus's mask and spinner show over the rows. Import the directive: an un-imported
 * `wjTableLoading` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTableLoading]' })
export class WjTableLoadingSlot {
  /** The template the table renders in its loading row. */
  readonly template = inject(TemplateRef);

  /** The template has no context. */
  static ngTemplateContextGuard(
    directive: WjTableLoadingSlot,
    context: unknown,
  ): context is object {
    return typeof context === 'object';
  }
}

/**
 * The band above the table. It sits outside the `table` element, so it does not name the table:
 * give its title an `id` and point the table's `ariaLabelledBy` at it. Import the directive: an
 * un-imported `wjTableCaption` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTableCaption]' })
export class WjTableCaptionSlot {
  /** The template the table renders above itself. */
  readonly template = inject(TemplateRef);

  /** The template has no context. */
  static ngTemplateContextGuard(
    directive: WjTableCaptionSlot,
    context: unknown,
  ): context is object {
    return typeof context === 'object';
  }
}

/**
 * The band below the table. Import the directive: an un-imported `wjTableSummary` silently drops
 * its template.
 */
@Directive({ selector: 'ng-template[wjTableSummary]' })
export class WjTableSummarySlot {
  /** The template the table renders below itself. */
  readonly template = inject(TemplateRef);

  /** The template has no context. */
  static ngTemplateContextGuard(
    directive: WjTableSummarySlot,
    context: unknown,
  ): context is object {
    return typeof context === 'object';
  }
}
