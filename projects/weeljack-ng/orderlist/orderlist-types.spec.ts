import type { OrderList, OrderListPassThrough } from '@openng/optimus-ui/orderlist';
import type {
  WjOrderList,
  WjOrderListControlsPosition,
  WjOrderListEmptyContext,
  WjOrderListItemContext,
  WjOrderListPt,
} from 'weeljack-ng/orderlist';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and `WjOrderListPt` is Optimus's own pass-through type. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjOrderList types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjOrderListControlsPosition>().toExtend<OrderList['controlsPosition']>();
    expectTypeOf<OrderList['controlsPosition']>().toExtend<WjOrderListControlsPosition>();
    expectTypeOf<WjOrderListPt>().toEqualTypeOf<OrderListPassThrough>();
    expectTypeOf<ReturnType<WjOrderList['value']>>().toExtend<OrderList['value']>();
    expectTypeOf<ReturnType<WjOrderList['selection']>>().toExtend<OrderList['selection']>();
    expectTypeOf<ReturnType<WjOrderList['scrollHeight']>>().toExtend<OrderList['scrollHeight']>();

    const position: OrderList['controlsPosition'] = 'right' satisfies WjOrderListControlsPosition;
    expect(position).toBe('right');
  });

  it('types the item context by the item type', () => {
    expectTypeOf<WjOrderListItemContext<{ id: number }>['$implicit']>().toEqualTypeOf<{
      id: number;
    }>();
    expectTypeOf<WjOrderListItemContext['$implicit']>().toBeUnknown();
    expectTypeOf<WjOrderListItemContext['index']>().toBeNumber();
    expectTypeOf<WjOrderListItemContext['selected']>().toBeBoolean();
  });

  it('types the empty context', () => {
    expectTypeOf<WjOrderListEmptyContext['filtered']>().toBeBoolean();
  });
});
