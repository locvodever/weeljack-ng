import type { MenuItem } from '@openng/optimus-ui/api';
import type { MenuPassThrough } from '@openng/optimus-ui/menu';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import type { WjMenuItemContext, WjMenuPt } from 'weeljack-ng/menu';
import {
  _toOptimusMenuModel,
  type _MenuItemShape,
  type _OptimusMenuModel,
} from 'weeljack-ng/private';

/**
 * The seam's type-level spec (09 Q3, Q5), and the shared menu checks every menu-model entry relies
 * on. The checks run in `typecheck` (`ngc` over the spec project); a drift in Optimus's types
 * turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjMenuItem types', () => {
  it('keeps the item type assignable to Optimus’s MenuItem and to the mapper’s shape', () => {
    expectTypeOf<WjMenuItem>().toExtend<MenuItem>();
    expectTypeOf<WjMenuItem>().toExtend<_MenuItemShape<WjMenuItem>>();

    const items: WjMenuItem[] = [{ label: 'Open', items: [{ label: 'Recent' }] }];
    const model = _toOptimusMenuModel(items);
    expectTypeOf(model).toEqualTypeOf<_OptimusMenuModel<WjMenuItem>>();
    expectTypeOf(model.items).toEqualTypeOf<MenuItem[]>();
    expectTypeOf<_OptimusMenuModel<WjMenuItem>['source']>().returns.toEqualTypeOf<
      WjMenuItem | undefined
    >();
    expect(model.items).toHaveLength(1);
  });

  it('has no string index, and none of the fields the mapper drops', () => {
    expectTypeOf<string extends keyof WjMenuItem ? true : false>().toEqualTypeOf<false>();
    expectTypeOf<keyof WjMenuItem & 'escape'>().toEqualTypeOf<never>();
    expectTypeOf<keyof WjMenuItem & 'style'>().toEqualTypeOf<never>();
    expectTypeOf<keyof WjMenuItem & 'styleClass'>().toEqualTypeOf<never>();
    expectTypeOf<keyof WjMenuItem & 'tooltipOptions'>().toEqualTypeOf<never>();
    expectTypeOf<keyof WjMenuItem & 'icon'>().toEqualTypeOf<never>();
    expect(true).toBe(true);
  });

  it('narrows a command’s event to the app’s own item type', () => {
    expectTypeOf<WjMenuItemCommandEvent>().toEqualTypeOf<{
      originalEvent: Event;
      item: WjMenuItem;
    }>();
    expectTypeOf<NonNullable<WjMenuItem['command']>>()
      .parameter(0)
      .toEqualTypeOf<WjMenuItemCommandEvent>();
    expect(true).toBe(true);
  });
});

describe('WjMenu types', () => {
  it('keeps WjMenuPt equal to Optimus’s pass-through and the slot context to the item type', () => {
    expectTypeOf<WjMenuPt>().toEqualTypeOf<MenuPassThrough>();
    expectTypeOf<WjMenuItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expect(true).toBe(true);
  });
});
