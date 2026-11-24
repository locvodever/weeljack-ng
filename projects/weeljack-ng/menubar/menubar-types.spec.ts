import type { MenubarItemTemplateContext, MenubarPassThrough } from '@openng/optimus-ui/menubar';
import type { WjMenuItem } from 'weeljack-ng';
import type { WjMenubarItemContext, WjMenubarPt } from 'weeljack-ng/menubar';

/**
 * The seam's type-level spec (09 Q3, Q5). The checks run in `typecheck` (`ngc` over the spec
 * project); a drift in Optimus's types turns this file red there. The runtime assertion only keeps
 * the file a spec. The shared item checks live in `menu-types.spec.ts`.
 */
describe('WjMenubar types', () => {
  it('keeps WjMenubarPt equal to Optimus’s pass-through', () => {
    expectTypeOf<WjMenubarPt>().toEqualTypeOf<MenubarPassThrough>();
    expect(true).toBe(true);
  });

  it('types the slot context: the app’s item, and whether it is on the bar', () => {
    expectTypeOf<WjMenubarItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expectTypeOf<WjMenubarItemContext['root']>().toEqualTypeOf<boolean>();
    expectTypeOf<keyof WjMenubarItemContext>().toEqualTypeOf<keyof MenubarItemTemplateContext>();
    expect(true).toBe(true);
  });
});
