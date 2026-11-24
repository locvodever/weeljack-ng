import type { AvatarGroupPassThrough } from '@openng/optimus-ui/types/avatargroup';
import type { WjAvatarGroupPt } from 'weeljack-ng/avatargroup';

/**
 * The seam's type-level spec (09 Q5): `WjAvatarGroupPt` stays the Optimus pass-through type it
 * feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in Optimus's types
 * turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjAvatarGroup types', () => {
  it('keeps the pass-through type equal to the Optimus type it feeds', () => {
    expectTypeOf<WjAvatarGroupPt>().toEqualTypeOf<AvatarGroupPassThrough>();

    const pt: WjAvatarGroupPt = { root: { 'data-probe': 'a' }, host: { 'data-probe': 'b' } };
    expect(Object.keys(pt)).toEqual(['root', 'host']);
  });
});
