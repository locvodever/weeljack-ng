import type { OverlayPassThrough } from '@openng/optimus-ui/types/overlay';
import type { WjOverlayPt } from 'weeljack-ng/overlay';

/**
 * The seam's type-level spec (09 Q5): each `Wj*` type of the overlay stays tied to the Optimus
 * type it feeds. The checks run in `typecheck`; a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjOverlay types', () => {
  it('keeps the pass-through equal to Optimus', () => {
    expectTypeOf<WjOverlayPt>().toEqualTypeOf<OverlayPassThrough>();
    const pt: OverlayPassThrough = null satisfies WjOverlayPt;
    expect(pt).toBeNull();
  });
});
