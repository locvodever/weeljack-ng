import type { InputGroupAddonPassThrough } from '@openng/optimus-ui/types/inputgroupaddon';
import type { WjInputGroupAddonPt } from 'weeljack-ng/inputgroupaddon';

/**
 * The seam's type-level spec (09 Q5): `WjInputGroupAddonPt` stays Optimus's pass-through type. The
 * check runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this
 * file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjInputGroupAddon types', () => {
  it('keeps the pass-through type equal to the Optimus type it feeds', () => {
    expectTypeOf<WjInputGroupAddonPt>().toEqualTypeOf<InputGroupAddonPassThrough>();

    const pt: WjInputGroupAddonPt = { root: 'probe' };
    expect(pt).toEqual({ root: 'probe' });
  });
});
