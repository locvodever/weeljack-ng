import type { ProgressSpinner } from '@openng/optimus-ui/progressspinner';
import type { ProgressSpinnerPassThrough } from '@openng/optimus-ui/types/progressspinner';
import type { WjProgressSpinner, WjProgressSpinnerPt } from 'weeljack-ng/progressspinner';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjProgressSpinner types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjProgressSpinnerPt>().toEqualTypeOf<ProgressSpinnerPassThrough>();
    expectTypeOf<ReturnType<WjProgressSpinner['ariaLabel']>>().toExtend<
      ProgressSpinner['ariaLabel']
    >();

    const label: ProgressSpinner['ariaLabel'] = 'Loading' satisfies ReturnType<
      WjProgressSpinner['ariaLabel']
    >;
    expect(label).toBe('Loading');
  });
});
