import type { Badge } from '@openng/optimus-ui/badge';
import type { BadgePassThrough } from '@openng/optimus-ui/types/badge';
import type { WjBadgePt, WjBadgeSeverity, WjBadgeSize } from 'weeljack-ng/badge';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjBadge types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjBadgeSeverity>().toExtend<NonNullable<ReturnType<Badge['severity']>>>();
    expectTypeOf<WjBadgeSize>().toExtend<NonNullable<ReturnType<Badge['badgeSize']>>>();
    expectTypeOf<WjBadgePt>().toEqualTypeOf<BadgePassThrough>();

    const size: ReturnType<Badge['badgeSize']> = 'small' satisfies WjBadgeSize;
    expect(size).toBe('small');
  });
});
