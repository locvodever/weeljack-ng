import type { ScrollPanelPassThrough } from '@openng/optimus-ui/types/scrollpanel';
import type { WjScrollPanelPt } from 'weeljack-ng/scrollpanel';

/**
 * The seam's type-level spec (09 Q5): `WjScrollPanelPt` is exactly the Optimus pass-through, so a
 * drift in Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project).
 * The runtime assertion only keeps the file a spec.
 */
describe('WjScrollPanel types', () => {
  it('keeps WjScrollPanelPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjScrollPanelPt>().toEqualTypeOf<ScrollPanelPassThrough>();

    const pt: WjScrollPanelPt = {
      content: { 'data-probe': 'content' },
      barY: () => ({ 'data-probe': 'bar' }),
    };
    expect(pt).toBeDefined();
  });
});
