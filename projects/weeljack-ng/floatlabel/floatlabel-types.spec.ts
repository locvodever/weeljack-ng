import type { FloatLabel } from '@openng/optimus-ui/floatlabel';
import type { FloatLabelPassThrough } from '@openng/optimus-ui/types/floatlabel';
import type { WjFloatLabelPt, WjFloatLabelVariant } from 'weeljack-ng/floatlabel';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjFloatLabel types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjFloatLabelVariant>().toExtend<FloatLabel['variant']>();
    expectTypeOf<WjFloatLabelPt>().toEqualTypeOf<FloatLabelPassThrough>();

    const variant: FloatLabel['variant'] = 'over' satisfies WjFloatLabelVariant;
    expect(variant).toBe('over');
  });
});
