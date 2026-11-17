import type { Drawer, DrawerPassThrough } from '@openng/optimus-ui/drawer';
import type { WjDrawerPosition, WjDrawerPt } from 'weeljack-ng/drawer';

/**
 * The seam's type-level spec (09 Q5): `WjDrawerPt` stays the Optimus pass-through type, and every
 * `WjDrawerPosition` is a value Drawer's `position` input accepts. The check runs in `typecheck`
 * (`ngc` over the spec project); a drift in Optimus's types turns this file red there. The runtime
 * assertion only keeps the file a spec.
 */
describe('WjDrawer types', () => {
  it('keeps WjDrawerPt equal to the Optimus pass-through type', () => {
    expectTypeOf<WjDrawerPt>().toEqualTypeOf<DrawerPassThrough>();

    const pt: WjDrawerPt = { root: { class: 'x' } };
    expect(pt.root).toEqual({ class: 'x' });
  });

  it('keeps WjDrawerPosition assignable to the value type of the position input', () => {
    expectTypeOf<WjDrawerPosition>().toExtend<ReturnType<Drawer['position']>>();

    const positions: WjDrawerPosition[] = ['left', 'right', 'top', 'bottom'];
    expect(positions).toHaveLength(4);
  });
});
