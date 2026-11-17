import type { TieredMenuPassThrough } from '@openng/optimus-ui/tieredmenu';
import type { WjMenuItem } from 'weeljack-ng';
import type { WjTieredMenuItemContext, WjTieredMenuPt } from 'weeljack-ng/tieredmenu';

/**
 * The seam's type-level spec (09 Q3, Q5). The checks run in `typecheck` (`ngc` over the spec
 * project); a drift in Optimus's types turns this file red there. The runtime assertion only keeps
 * the file a spec. The shared item checks live in `menu-types.spec.ts`.
 */
describe('WjTieredMenu types', () => {
  it('keeps WjTieredMenuPt equal to Optimus’s pass-through', () => {
    expectTypeOf<WjTieredMenuPt>().toEqualTypeOf<TieredMenuPassThrough>();
    expect(true).toBe(true);
  });

  it('types the slot context: the app’s item, and whether it has a submenu', () => {
    expectTypeOf<WjTieredMenuItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expectTypeOf<WjTieredMenuItemContext['hasSubmenu']>().toEqualTypeOf<boolean>();
    expect(true).toBe(true);
  });
});
