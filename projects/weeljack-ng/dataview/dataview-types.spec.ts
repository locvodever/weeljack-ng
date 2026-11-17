import type { DataView, DataViewPassThrough } from '@openng/optimus-ui/dataview';
import type { WjPageEvent } from 'weeljack-ng';
import type {
  WjDataView,
  WjDataViewItemContext,
  WjDataViewLayout,
  WjDataViewPt,
} from 'weeljack-ng/dataview';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and `WjDataViewPt` is Optimus's own pass-through type. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjDataView types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjDataViewLayout>().toExtend<DataView['layout']>();
    expectTypeOf<DataView['layout']>().toExtend<WjDataViewLayout>();
    expectTypeOf<WjDataViewPt>().toEqualTypeOf<DataViewPassThrough>();
    expectTypeOf<ReturnType<WjDataView['paginatorPosition']>>().toExtend<
      DataView['paginatorPosition']
    >();
    expectTypeOf<ReturnType<WjDataView['rowsPerPageOptions']>>().toExtend<
      DataView['rowsPerPageOptions']
    >();
    expectTypeOf<WjPageEvent>().toExtend<{ first: number; rows: number }>();

    const layout: DataView['layout'] = 'grid' satisfies WjDataViewLayout;
    expect(layout).toBe('grid');
  });

  it('types the item context by the item type', () => {
    expectTypeOf<WjDataViewItemContext<{ id: number }>['$implicit']>().toEqualTypeOf<{
      id: number;
    }>();
    expectTypeOf<WjDataViewItemContext['$implicit']>().toBeUnknown();
    expectTypeOf<WjDataViewItemContext['index']>().toBeNumber();
    expectTypeOf<WjDataViewItemContext['layout']>().toEqualTypeOf<WjDataViewLayout>();
  });
});
