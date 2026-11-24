import type { InputIconPassThrough } from '@openng/optimus-ui/types/inputicon';
import type { WjInputIconPt } from 'weeljack-ng/inputicon';

/**
 * The seam's type-level spec (09 Q5): `WjInputIconPt` stays Optimus's pass-through type. The check
 * runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjInputIcon types', () => {
  it('keeps the pass-through type equal to the Optimus type it feeds', () => {
    expectTypeOf<WjInputIconPt>().toEqualTypeOf<InputIconPassThrough>();
    const pt: WjInputIconPt = { root: 'probe' };
    expect(pt).toEqual({ root: 'probe' });
  });
});
