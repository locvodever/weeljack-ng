import type { Dock } from '@openng/optimus-ui/dock';
import type { DockPassThrough } from '@openng/optimus-ui/types/dock';
import type { WjMenuItem } from 'weeljack-ng';
import type { WjDockItemContext, WjDockPosition, WjDockPt } from 'weeljack-ng/dock';

/**
 * The seam's type-level spec (09 Q5): `WjDockPt` stays Optimus's pass-through type and the position
 * stays inside what Optimus accepts. The checks run in `typecheck` (`ngc` over the spec project); a
 * drift in Optimus's types turns this file red there. The runtime assertion only keeps the file a
 * spec.
 */
describe('WjDock types', () => {
  it('keeps WjDockPt equal to Optimus’s DockPassThrough', () => {
    expectTypeOf<WjDockPt>().toEqualTypeOf<DockPassThrough>();
    expect(true).toBe(true);
  });

  it('keeps WjDockPosition inside what Optimus’s position accepts', () => {
    expectTypeOf<WjDockPosition>().toExtend<Dock['position']>();
    expectTypeOf<WjDockPosition>().toEqualTypeOf<'bottom' | 'top' | 'left' | 'right'>();
    expect(true).toBe(true);
  });

  it('gives the item slot the app’s own item type', () => {
    expectTypeOf<WjDockItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expect(true).toBe(true);
  });
});
