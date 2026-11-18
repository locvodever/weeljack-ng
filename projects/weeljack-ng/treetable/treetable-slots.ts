import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import type { WjTreeTableCellContext, WjTreeTableHeaderCellContext } from './treetable-types';

/**
 * The cell of a `wj-treetable-column`: put an `<ng-template wjTreeTableCell>` inside the column to
 * render its cells yourself, instead of the `field` value as text. The template renders inside the
 * `td` the tree table writes, after the toggle in the first column, never as a row. Import the
 * directive: an un-imported `wjTreeTableCell` silently drops its template.
 *
 * `[wjTreeTableCellOf]` only types the template: bind it to your nodes
 * (`[wjTreeTableCellOf]="files()"`) so `let-node` has your data type. It is never read, and
 * without it `T` is `unknown`.
 */
@Directive({ selector: 'ng-template[wjTreeTableCell]' })
export class WjTreeTableCellSlot<T = unknown> {
  /** The template a `wj-treetable-column` renders in each of its cells. */
  readonly template = inject<TemplateRef<WjTreeTableCellContext<T>>>(TemplateRef);
  /** Your nodes, bound only so the template type-checker infers the data type `T`. */
  readonly wjTreeTableCellOf = input<readonly WjTreeNode<T>[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTreeTableCellContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTreeTableCellSlot<T>,
    context: unknown,
  ): context is WjTreeTableCellContext<T> {
    return typeof context === 'object';
  }
}

/**
 * The header cell of a `wj-treetable-column`: put an `<ng-template wjTreeTableHeaderCell>` inside
 * the column to render its header yourself, instead of the `header` text. It renders inside the
 * header's title box; the sort icon stays outside it. Import the directive: an un-imported
 * `wjTreeTableHeaderCell` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTreeTableHeaderCell]' })
export class WjTreeTableHeaderCellSlot {
  /** The template a `wj-treetable-column` renders in its header. */
  readonly template = inject<TemplateRef<WjTreeTableHeaderCellContext>>(TemplateRef);

  /** Types `let-` variables in the template as {@link WjTreeTableHeaderCellContext}. */
  static ngTemplateContextGuard(
    directive: WjTreeTableHeaderCellSlot,
    context: unknown,
  ): context is WjTreeTableHeaderCellContext {
    return typeof context === 'object';
  }
}

/**
 * What a `wj-treetable` shows instead of its default empty row, a full-width cell, when it has no
 * nodes. The slot has no context. Import the directive: an un-imported `wjTreeTableEmpty`
 * silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTreeTableEmpty]' })
export class WjTreeTableEmptySlot {
  /** The template the tree table renders in its empty row. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(
    directive: WjTreeTableEmptySlot,
    context: unknown,
  ): context is void {
    return context === undefined;
  }
}

/**
 * The band above the tree table. It sits outside the `table` element, so it does not name the
 * table: give its title an `id` and point `ariaLabelledBy` at it. The slot has no context. Import
 * the directive: an un-imported `wjTreeTableCaption` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTreeTableCaption]' })
export class WjTreeTableCaptionSlot {
  /** The template the tree table renders above itself. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(
    directive: WjTreeTableCaptionSlot,
    context: unknown,
  ): context is void {
    return context === undefined;
  }
}

/**
 * The band below the tree table. The slot has no context. Import the directive: an un-imported
 * `wjTreeTableSummary` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTreeTableSummary]' })
export class WjTreeTableSummarySlot {
  /** The template the tree table renders below itself. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(
    directive: WjTreeTableSummarySlot,
    context: unknown,
  ): context is void {
    return context === undefined;
  }
}
