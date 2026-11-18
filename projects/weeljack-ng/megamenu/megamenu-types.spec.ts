import type { MegaMenuItem, MenuItem } from '@openng/optimus-ui/api';
import type { MegaMenu, MegaMenuPassThrough } from '@openng/optimus-ui/megamenu';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import type {
  WjMegaMenuItem,
  WjMegaMenuItemContext,
  WjMegaMenuOrientation,
  WjMegaMenuPt,
} from 'weeljack-ng/megamenu';
import {
  _toOptimusMegaMenuModel,
  type _MegaMenuItemShape,
  type _OptimusMenuModel,
} from 'weeljack-ng/private';

/**
 * The seam's type-level spec (09 Q3, Q5). The checks run in `typecheck` (`ngc` over the spec
 * project); a drift in Optimus's types turns this file red there. The runtime assertion only keeps
 * the file a spec. The shared item checks live in `menu-types.spec.ts`.
 */
describe('WjMegaMenu types', () => {
  it('keeps WjMegaMenuItem assignable to Optimus’s MegaMenuItem and to the mapper’s shape', () => {
    expectTypeOf<WjMegaMenuItem>().toExtend<MegaMenuItem>();
    expectTypeOf<WjMegaMenuItem>().toExtend<_MegaMenuItemShape<WjMegaMenuItem, WjMenuItem>>();
    expectTypeOf<WjMenuItem>().toExtend<MenuItem>();
    expect(true).toBe(true);
  });

  it('maps WjMegaMenuItem[] to MegaMenuItem[], with the app’s item behind either level', () => {
    const items: WjMegaMenuItem[] = [{ label: 'A', items: [[{ label: 'G', items: [] }]] }];
    const model = _toOptimusMegaMenuModel<WjMegaMenuItem, WjMenuItem>(items);

    expectTypeOf(model).toEqualTypeOf<
      _OptimusMenuModel<WjMegaMenuItem | WjMenuItem, MegaMenuItem>
    >();
    expectTypeOf(model.items).toEqualTypeOf<MegaMenuItem[]>();
    expectTypeOf<(typeof model)['source']>().returns.toEqualTypeOf<
      WjMegaMenuItem | WjMenuItem | undefined
    >();
    expect(model.items).toHaveLength(1);
  });

  it('has columns of groups, no string index, and none of the fields the mapper drops', () => {
    expectTypeOf<WjMegaMenuItem['items']>().toEqualTypeOf<WjMenuItem[][] | undefined>();
    expectTypeOf<string extends keyof WjMegaMenuItem ? true : false>().toEqualTypeOf<false>();
    expectTypeOf<keyof WjMegaMenuItem & 'escape'>().toEqualTypeOf<never>();
    expectTypeOf<keyof WjMegaMenuItem & 'styleClass'>().toEqualTypeOf<never>();
    expectTypeOf<keyof WjMegaMenuItem & 'icon'>().toEqualTypeOf<never>();
    expect(true).toBe(true);
  });

  it('narrows a root command’s event to the root item type', () => {
    expectTypeOf<NonNullable<WjMegaMenuItem['command']>>()
      .parameter(0)
      .toEqualTypeOf<WjMenuItemCommandEvent<WjMegaMenuItem>>();
    expect(true).toBe(true);
  });

  it('keeps the orientation inside what Optimus takes, and WjMegaMenuPt equal to its pass-through', () => {
    expectTypeOf<WjMegaMenuOrientation>().toExtend<MegaMenu['orientation']>();
    expectTypeOf<WjMegaMenuOrientation>().toEqualTypeOf<'horizontal' | 'vertical'>();
    expectTypeOf<WjMegaMenuPt>().toEqualTypeOf<MegaMenuPassThrough>();
    expect(true).toBe(true);
  });

  it('types the slot context: the app’s own root item or entry', () => {
    expectTypeOf<WjMegaMenuItemContext['$implicit']>().toEqualTypeOf<WjMegaMenuItem | WjMenuItem>();
    expect(true).toBe(true);
  });
});
