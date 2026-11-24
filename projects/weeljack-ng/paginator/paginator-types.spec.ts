import type { Paginator, PaginatorPassThrough, PaginatorState } from '@openng/optimus-ui/paginator';
import type { WjPageEvent } from 'weeljack-ng';
import type { WjPaginator, WjPaginatorPt } from 'weeljack-ng/paginator';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and `WjPaginatorPt` is Optimus's own pass-through type. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjPaginator types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjPaginatorPt>().toEqualTypeOf<PaginatorPassThrough>();
    expectTypeOf<ReturnType<WjPaginator['rowsPerPageOptions']>>().toExtend<
      Paginator['rowsPerPageOptions']
    >();
    expectTypeOf<ReturnType<WjPaginator['currentPageReportTemplate']>>().toExtend<
      Paginator['currentPageReportTemplate']
    >();
    expectTypeOf<WjPageEvent>().toExtend<Required<Pick<PaginatorState, 'first' | 'rows'>>>();

    const state: PaginatorState = { first: 10, rows: 10 } satisfies Partial<WjPageEvent>;
    expect(state.first).toBe(10);
  });
});
