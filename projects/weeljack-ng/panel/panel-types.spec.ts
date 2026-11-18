import type { PanelPassThrough } from '@openng/optimus-ui/panel';
import type { WjPanelPt } from 'weeljack-ng/panel';

/**
 * The seam's type-level spec (09 Q5): `WjPanelPt` is exactly the Optimus pass-through, so a drift in
 * Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project). The
 * runtime assertion only keeps the file a spec.
 */
describe('WjPanel types', () => {
  it('keeps WjPanelPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjPanelPt>().toEqualTypeOf<PanelPassThrough>();

    const pt: WjPanelPt = { pcToggleButton: { root: { 'aria-label': 'Toggle' } } };
    expect(pt).toBeDefined();
  });
});
