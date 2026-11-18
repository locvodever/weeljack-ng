import type { Avatar, AvatarPassThrough } from '@openng/optimus-ui/avatar';
import type { WjAvatarPt, WjAvatarShape, WjAvatarSize } from 'weeljack-ng/avatar';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjAvatar types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjAvatarSize>().toExtend<NonNullable<Avatar['size']>>();
    expectTypeOf<WjAvatarShape>().toExtend<NonNullable<Avatar['shape']>>();
    expectTypeOf<WjAvatarPt>().toEqualTypeOf<AvatarPassThrough>();

    const size: Avatar['size'] = 'large' satisfies WjAvatarSize;
    const shape: Avatar['shape'] = 'circle' satisfies WjAvatarShape;
    expect([size, shape]).toEqual(['large', 'circle']);
  });
});
