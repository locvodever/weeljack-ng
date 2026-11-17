import { Component, booleanAttribute, computed, contentChild, input } from '@angular/core';
import type { WjColumnFilterType, WjFrozenAlign } from 'weeljack-ng';
import { WjTableCellEditorSlot, WjTableCellSlot, WjTableHeaderCellSlot } from '../table-slots';

/**
 * A column of a `wj-table`: declare it as a child (`<wj-column field="name" header="Name" />`)
 * and the table renders its header and one cell per row. A column renders nothing itself: the
 * table reads its inputs and its `wjTableCell`, `wjTableHeaderCell` and `wjTableCellEditor`
 * templates. Columns appear in the order declared and follow an `@if` or `@for` around them.
 */
@Component({
  selector: 'wj-column',
  template: '',
  // The host is projected into the table only so it reaches the prerendered HTML (check:ssr).
  styles: '@layer wj { :host { display: none; } }',
})
export class WjColumn {
  /** The row property this column shows. Dotted paths work (`customer.name`). */
  readonly field = input<string>();
  /** The header text. Rendered as text, never as HTML. */
  readonly header = input<string>();
  /** Lets the user sort the table by `field` with a click, Enter or Space on the header. */
  readonly sortable = input(false, { transform: booleanAttribute });
  /** Keeps the column in view while the table scrolls sideways. Turns the table's `scrollable` on. */
  readonly frozen = input(false, { transform: booleanAttribute });
  /** The side a frozen column sticks to. */
  readonly alignFrozen = input<WjFrozenAlign>('left');
  /** Makes the column filterable, with a filter that edits this kind of value. */
  readonly filterType = input<WjColumnFilterType>();

  /** The column's `wjTableCell` template, if any. @docs-private */
  readonly cell = contentChild(WjTableCellSlot);
  /** The column's `wjTableCellEditor` template, if any. @docs-private */
  readonly editor = contentChild(WjTableCellEditorSlot);
  /** The column's `wjTableHeaderCell` template, if any. @docs-private */
  readonly headerCell = contentChild(WjTableHeaderCellSlot);
  /** The field the table sorts by through this column; `undefined` when it is not sortable. @docs-private */
  readonly sortKey = computed(() => {
    const field = this.field();
    return this.sortable() && field ? field : undefined;
  });
}
