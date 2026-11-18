import type { FluidPassThrough } from '@openng/optimus-ui/types/fluid';
import type { WjFluidPt } from 'weeljack-ng/fluid';

/**
 * The seam's type-level spec (09 Q5): `WjFluidPt` stays Optimus's pass-through type. The check
 * runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjFluid types', () => {
  it('keeps the pass-through type equal to the Optimus type it feeds', () => {
    expectTypeOf<WjFluidPt>().toEqualTypeOf<FluidPassThrough>();

    const pt: WjFluidPt = { root: 'probe' };
    expect(pt).toEqual({ root: 'probe' });
  });
});
