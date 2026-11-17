import type { ColumnFilter, Table, TablePassThrough } from '@openng/optimus-ui/table';
import type {
  WjTableCellContext,
  WjTableFilterDisplay,
  WjTableGroupHeaderContext,
  WjTableHeaderCellContext,
  WjTablePt,
  WjTableRowEditEvent,
  WjTableRowExpandMode,
  WjTableRowExpansionContext,
  WjTableRowToggleEvent,
  WjTableSelectionMode,
  WjTableSize,
} from 'weeljack-ng/table';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjTable types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjTableSize>().toExtend<NonNullable<Table['size']>>();
    expectTypeOf<WjTableSelectionMode>().toExtend<NonNullable<Table['selectionMode']>>();
    expectTypeOf<WjTableRowExpandMode>().toExtend<Table['rowExpandMode']>();
    expectTypeOf<WjTableFilterDisplay>().toExtend<NonNullable<ColumnFilter['display']>>();
    expectTypeOf<WjTablePt>().toEqualTypeOf<TablePassThrough>();

    const size: Table['size'] = 'small' satisfies WjTableSize;
    expect(size).toBe('small');
  });

  it('types the slot contexts by the row type', () => {
    expectTypeOf<WjTableCellContext<{ id: number }>['$implicit']>().toEqualTypeOf<{ id: number }>();
    expectTypeOf<WjTableCellContext['$implicit']>().toBeUnknown();
    expectTypeOf<WjTableCellContext['rowIndex']>().toBeNumber();
    expectTypeOf<WjTableHeaderCellContext['$implicit']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<WjTableRowExpansionContext<{ id: number }>>().toEqualTypeOf<{
      $implicit: { id: number };
      rowIndex: number;
    }>();
    expectTypeOf<WjTableGroupHeaderContext<{ id: number }>>().toEqualTypeOf<{
      $implicit: { id: number };
      group: unknown;
      rowIndex: number;
    }>();
  });

  it('types the events by the row type', () => {
    expectTypeOf<WjTableRowToggleEvent<{ id: number }>>().toEqualTypeOf<{ row: { id: number } }>();
    expectTypeOf<WjTableRowEditEvent<{ id: number }>>().toEqualTypeOf<{
      row: { id: number };
      index: number;
    }>();
    expectTypeOf<WjTableRowToggleEvent['row']>().toBeUnknown();
  });
});
