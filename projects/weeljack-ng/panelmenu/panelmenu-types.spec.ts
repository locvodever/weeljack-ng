import type { MenuItem } from '@openng/optimus-ui/api';
import type {
  PanelMenuItemTemplateContext,
  PanelMenuPassThrough,
} from '@openng/optimus-ui/panelmenu';
import type { WjMenuItem } from 'weeljack-ng';
import type { WjPanelMenuItemContext, WjPanelMenuPt } from 'weeljack-ng/panelmenu';

/**
 * The seam's type-level spec (09 Q3, Q5). The checks run in `typecheck` (`ngc` over the spec
 * project); a drift in Optimus's types turns this file red there. The runtime assertion only keeps
 * the file a spec. The shared item checks live in `menu-types.spec.ts`.
 */
describe('WjPanelMenu types', () => {
  it('keeps WjPanelMenuPt equal to Optimus’s pass-through', () => {
    expectTypeOf<WjPanelMenuPt>().toEqualTypeOf<PanelMenuPassThrough>();
    expect(true).toBe(true);
  });

  it('types the slot context as the app’s item, in step with Optimus’s context', () => {
    expectTypeOf<WjPanelMenuItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expectTypeOf<keyof WjPanelMenuItemContext>().toEqualTypeOf<
      keyof PanelMenuItemTemplateContext
    >();
    expectTypeOf<WjMenuItem>().toExtend<MenuItem>();
    expect(true).toBe(true);
  });
});
