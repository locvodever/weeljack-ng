import type { ProgressBar } from '@openng/optimus-ui/progressbar';
import type { ProgressBarPassThrough } from '@openng/optimus-ui/types/progressbar';
import type { WjProgressBar, WjProgressBarMode, WjProgressBarPt } from 'weeljack-ng/progressbar';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjProgressBar types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjProgressBarMode>().toExtend<ProgressBar['mode']>();
    expectTypeOf<WjProgressBarPt>().toEqualTypeOf<ProgressBarPassThrough>();
    expectTypeOf<ReturnType<WjProgressBar['value']>>().toExtend<ProgressBar['value']>();
    expectTypeOf<ReturnType<WjProgressBar['showValue']>>().toExtend<ProgressBar['showValue']>();

    const mode: ProgressBar['mode'] = 'indeterminate' satisfies WjProgressBarMode;
    expect(mode).toBe('indeterminate');
  });
});
