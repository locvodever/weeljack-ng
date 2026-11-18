import type { ToolbarPassThrough } from '@openng/optimus-ui/toolbar';
import type { WjToolbarPt } from 'weeljack-ng/toolbar';

/**
 * The seam's type-level spec (09 Q5): `WjToolbarPt` is exactly the Optimus pass-through, so a drift
 * in Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project). The
 * runtime assertion only keeps the file a spec.
 */
describe('WjToolbar types', () => {
  it('keeps WjToolbarPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjToolbarPt>().toEqualTypeOf<ToolbarPassThrough>();

    const pt: WjToolbarPt = { root: { 'aria-label': 'Actions' }, end: { class: 'end' } };
    expect(pt).toBeDefined();
  });
});
