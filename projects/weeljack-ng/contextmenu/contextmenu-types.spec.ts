import type { ContextMenuPassThrough } from '@openng/optimus-ui/contextmenu';
import type { WjMenuItem } from 'weeljack-ng';
import type { WjContextMenuItemContext, WjContextMenuPt } from 'weeljack-ng/contextmenu';

/**
 * The seam's type-level spec (09 Q3, Q5). The checks run in `typecheck` (`ngc` over the spec
 * project); a drift in Optimus's types turns this file red there. The runtime assertion only keeps
 * the file a spec. The shared item checks live in `menu-types.spec.ts`.
 */
describe('WjContextMenu types', () => {
  it('keeps WjContextMenuPt equal to Optimus’s pass-through', () => {
    expectTypeOf<WjContextMenuPt>().toEqualTypeOf<ContextMenuPassThrough>();
    expect(true).toBe(true);
  });

  it('types the slot context: the app’s item and nothing else', () => {
    expectTypeOf<WjContextMenuItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expectTypeOf<keyof WjContextMenuItemContext>().toEqualTypeOf<'$implicit'>();
    expect(true).toBe(true);
  });
});
