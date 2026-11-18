import { Component, booleanAttribute, computed, contentChild, input } from '@angular/core';
import { WjTreeTableCellSlot, WjTreeTableHeaderCellSlot } from '../treetable-slots';

/**
 * A column of a `wj-treetable`: declare it as a child
 * (`<wj-treetable-column field="name" header="Name" />`) and the tree table renders its header and
 * one cell per row. The first column also holds each row's toggle and, in `checkbox` mode, its
 * checkbox. A column renders nothing itself: the tree table reads its inputs and its
 * `wjTreeTableCell` and `wjTreeTableHeaderCell` templates. Columns appear in the order declared
 * and follow an `@if` or `@for` around them.
 */
@Component({
  selector: 'wj-treetable-column',
  template: '',
  // The host is projected into the tree table only so it reaches the prerendered HTML (check:ssr).
  host: { hidden: '' },
})
export class WjTreeTableColumn {
  /** The property of each node's `data` this column shows. Dotted paths work (`owner.name`). */
  readonly field = input<string>();
  /** The header text. Rendered as text, never as HTML. */
  readonly header = input<string>();
  /** Lets the user sort the table by `field` with a click or Enter on the header. */
  readonly sortable = input(false, { transform: booleanAttribute });

  /** The column's `wjTreeTableCell` template, if any. @docs-private */
  readonly cell = contentChild(WjTreeTableCellSlot);
  /** The column's `wjTreeTableHeaderCell` template, if any. @docs-private */
  readonly headerCell = contentChild(WjTreeTableHeaderCellSlot);
  /** The field the tree table sorts by through this column; `undefined` when it is not sortable. @docs-private */
  readonly sortKey = computed(() => {
    const field = this.field();
    return this.sortable() && field ? field : undefined;
  });
}
