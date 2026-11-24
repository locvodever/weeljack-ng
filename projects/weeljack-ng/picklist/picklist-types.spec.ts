import type { PickList, PickListPassThrough } from '@openng/optimus-ui/picklist';
import type {
  WjPickList,
  WjPickListEmptyContext,
  WjPickListItemContext,
  WjPickListName,
  WjPickListPt,
} from 'weeljack-ng/picklist';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and `WjPickListPt` is Optimus's own pass-through type. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjPickList types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjPickListPt>().toEqualTypeOf<PickListPassThrough>();
    expectTypeOf<ReturnType<WjPickList['source']>>().toExtend<ReturnType<PickList['source']>>();
    expectTypeOf<ReturnType<WjPickList['target']>>().toExtend<ReturnType<PickList['target']>>();
    expectTypeOf<ReturnType<WjPickList['scrollHeight']>>().toExtend<PickList['scrollHeight']>();
    expectTypeOf<ReturnType<WjPickList['dataKey']>>().toExtend<PickList['dataKey']>();
    expectTypeOf<ReturnType<WjPickList['sourceHeader']>>().toExtend<PickList['sourceHeader']>();
    expectTypeOf<ReturnType<WjPickList['sourceAriaLabel']>>().toExtend<
      PickList['sourceAriaLabel']
    >();
    expectTypeOf<ReturnType<WjPickList['filterBy']>>().toExtend<PickList['filterBy']>();
    expectTypeOf<ReturnType<WjPickList['ariaSourceFilterLabel']>>().toExtend<
      PickList['ariaSourceFilterLabel']
    >();
    expectTypeOf<ReturnType<WjPickList['ariaTargetFilterLabel']>>().toExtend<
      PickList['ariaTargetFilterLabel']
    >();
    expectTypeOf<ReturnType<WjPickList['showSourceControls']>>().toExtend<
      PickList['showSourceControls']
    >();
    expectTypeOf<ReturnType<WjPickList['showTargetControls']>>().toExtend<
      PickList['showTargetControls']
    >();

    const list: WjPickListName = 'target' satisfies WjPickListName;
    expect(list).toBe('target');
  });

  it('types the filter inputs as optional strings', () => {
    expectTypeOf<ReturnType<WjPickList['filterBy']>>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ReturnType<WjPickList['ariaSourceFilterLabel']>>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<ReturnType<WjPickList['ariaTargetFilterLabel']>>().toEqualTypeOf<
      string | undefined
    >();
  });

  it('names the two lists', () => {
    expectTypeOf<WjPickListName>().toEqualTypeOf<'source' | 'target'>();
    expectTypeOf<WjPickListEmptyContext['list']>().toEqualTypeOf<WjPickListName>();
  });

  it('types the item context by the item type', () => {
    expectTypeOf<WjPickListItemContext<{ id: number }>['$implicit']>().toEqualTypeOf<{
      id: number;
    }>();
    expectTypeOf<WjPickListItemContext['$implicit']>().toBeUnknown();
    expectTypeOf<WjPickListItemContext['index']>().toBeNumber();
    expectTypeOf<WjPickListItemContext['selected']>().toBeBoolean();
    expectTypeOf<WjPickListItemContext['disabled']>().toBeBoolean();
  });
});
