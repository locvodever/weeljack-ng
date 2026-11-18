import type { OverlayBadge } from '@openng/optimus-ui/overlaybadge';
import type { OverlayBadgePassThrough } from '@openng/optimus-ui/types/overlaybadge';
import type {
  WjOverlayBadgePt,
  WjOverlayBadgeSeverity,
  WjOverlayBadgeSize,
} from 'weeljack-ng/overlaybadge';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjOverlayBadge types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjOverlayBadgeSeverity>().toExtend<NonNullable<OverlayBadge['severity']>>();
    expectTypeOf<WjOverlayBadgeSize>().toExtend<NonNullable<OverlayBadge['badgeSize']>>();
    expectTypeOf<WjOverlayBadgePt>().toEqualTypeOf<OverlayBadgePassThrough>();

    const size: OverlayBadge['badgeSize'] = 'small' satisfies WjOverlayBadgeSize;
    expect(size).toBe('small');
  });
});
