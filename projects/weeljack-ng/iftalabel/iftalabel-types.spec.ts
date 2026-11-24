import type { IftaLabelPassThrough } from '@openng/optimus-ui/types/iftalabel';
import type { WjIftaLabelPt } from 'weeljack-ng/iftalabel';

/**
 * The seam's type-level spec (09 Q5): `WjIftaLabelPt` stays Optimus's pass-through type. The check
 * runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjIftaLabel types', () => {
  it('keeps the pass-through type equal to the Optimus type it feeds', () => {
    expectTypeOf<WjIftaLabelPt>().toEqualTypeOf<IftaLabelPassThrough>();

    const pt: WjIftaLabelPt = { root: 'probe' };
    expect(pt).toEqual({ root: 'probe' });
  });
});
