import type { IconFieldPassThrough } from '@openng/optimus-ui/types/iconfield';
import type { WjIconFieldPt } from 'weeljack-ng/iconfield';

/**
 * The seam's type-level spec (09 Q5): `WjIconFieldPt` stays Optimus's pass-through type. The check
 * runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjIconField types', () => {
  it('keeps the pass-through type equal to the Optimus type it feeds', () => {
    expectTypeOf<WjIconFieldPt>().toEqualTypeOf<IconFieldPassThrough>();

    const pt: WjIconFieldPt = { root: 'probe' };
    expect(pt).toEqual({ root: 'probe' });
  });
});
