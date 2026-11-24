import type { OutputEmitterRef } from '@angular/core';
import type { TreeTable, TreeTablePassThrough } from '@openng/optimus-ui/treetable';
import type { WjSortOrder, WjTreeNode } from 'weeljack-ng';
import {
  WjTreeTableCaptionSlot,
  WjTreeTableCellSlot,
  WjTreeTableEmptySlot,
  WjTreeTableHeaderCellSlot,
  WjTreeTableSummarySlot,
  type WjTreeTable,
  type WjTreeTableCellContext,
  type WjTreeTableHeaderCellContext,
  type WjTreeTablePt,
} from 'weeljack-ng/treetable';

interface File {
  size: number;
}

/**
 * The seam's type-level spec (09 Q5): `WjTreeTablePt` is Optimus's own pass-through type, every
 * input-direction type stays a subset of the Optimus type it feeds, and the outputs and slot
 * contexts carry the app's node. The checks run in `typecheck` (`ngc` over the spec project); a
 * drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */
describe('WjTreeTable types', () => {
  it('keeps WjTreeTablePt equal to the Optimus pass-through', () => {
    expectTypeOf<WjTreeTablePt>().toEqualTypeOf<TreeTablePassThrough>();

    const pt: WjTreeTablePt = { row: { 'data-probe': 'x' }, rowToggleButton: { tabindex: -1 } };
    expect(pt).toBeDefined();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjSortOrder>().toExtend<TreeTable['sortOrder']>();
    expectTypeOf<ReturnType<WjTreeTable<File>['value']>>().toExtend<TreeTable['value']>();
    expectTypeOf<ReturnType<WjTreeTable['selectionMode']>>().toExtend<TreeTable['selectionMode']>();
    expectTypeOf<ReturnType<WjTreeTable['rowsPerPageOptions']>>().toExtend<
      TreeTable['rowsPerPageOptions']
    >();
    expectTypeOf<ReturnType<WjTreeTable['sortOrder']>>().toEqualTypeOf<WjSortOrder>();
    expectTypeOf<ReturnType<WjTreeTable<File>['selection']>>().toEqualTypeOf<WjTreeNode<File>[]>();
    expectTypeOf<ReturnType<WjTreeTable['expandedKeys']>>().toEqualTypeOf<
      Record<string, boolean>
    >();
    expect(true).toBe(true);
  });

  it('emits the app’s own node, typed by the table’s data type', () => {
    expectTypeOf<WjTreeTable<File>['nodeExpand']>().toEqualTypeOf<
      OutputEmitterRef<WjTreeNode<File>>
    >();
    expectTypeOf<WjTreeTable<File>['nodeCollapse']>().toEqualTypeOf<
      OutputEmitterRef<WjTreeNode<File>>
    >();
    expect(true).toBe(true);
  });

  it('types the slot contexts from the nodes bound to the typing input', () => {
    expectTypeOf<WjTreeTableCellContext<File>['$implicit']>().toEqualTypeOf<WjTreeNode<File>>();
    expectTypeOf<WjTreeTableCellContext['$implicit']>().toEqualTypeOf<WjTreeNode>();
    expectTypeOf<WjTreeTableCellContext['value']>().toBeUnknown();
    expectTypeOf<WjTreeTableCellContext['field']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<WjTreeTableHeaderCellContext['$implicit']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<WjTreeTableCellSlot<File>['wjTreeTableCellOf']>().not.toBeAny();
    expect(true).toBe(true);
  });

  it('gives every slot a context guard, which the type-checker reads in a template', () => {
    for (const slot of [
      WjTreeTableCellSlot,
      WjTreeTableHeaderCellSlot,
      WjTreeTableEmptySlot,
      WjTreeTableCaptionSlot,
      WjTreeTableSummarySlot,
    ]) {
      expectTypeOf(slot).toHaveProperty('ngTemplateContextGuard');
      expect('ngTemplateContextGuard' in slot).toBe(true);
    }
  });
});
