import type { ScrollTop } from '@openng/optimus-ui/scrolltop';
import type { ScrollTopPassThrough } from '@openng/optimus-ui/types/scrolltop';
import type { WjScrollTopBehavior, WjScrollTopPt } from 'weeljack-ng/scrolltop';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjScrollTop types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjScrollTopBehavior>().toExtend<NonNullable<ScrollTop['behavior']>>();
    expectTypeOf<NonNullable<ScrollTop['behavior']>>().toExtend<WjScrollTopBehavior>();
    expectTypeOf<WjScrollTopPt>().toEqualTypeOf<ScrollTopPassThrough>();
    const behavior: ScrollTop['behavior'] = 'auto' satisfies WjScrollTopBehavior;
    expect(behavior).toBe('auto');
  });
});
