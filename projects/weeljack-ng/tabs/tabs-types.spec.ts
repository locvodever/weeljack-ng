import type { Tab, TabPanel, Tabs } from '@openng/optimus-ui/tabs';
import type {
  TabListPassThrough,
  TabPanelPassThrough,
  TabPanelsPassThrough,
  TabPassThrough,
  TabsPassThrough,
} from '@openng/optimus-ui/types/tabs';
import type {
  WjTabListPt,
  WjTabPanelPt,
  WjTabPanelsPt,
  WjTabPt,
  WjTabsPt,
  WjTabsValue,
} from 'weeljack-ng/tabs';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and every `Wj*Pt` is exactly the Optimus pass-through. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjTabs types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjTabsValue>().toExtend<ReturnType<Tabs['value']>>();
    expectTypeOf<WjTabsValue>().toExtend<ReturnType<Tab['value']>>();
    expectTypeOf<WjTabsValue>().toExtend<ReturnType<TabPanel['value']>>();
    expectTypeOf<WjTabsPt>().toEqualTypeOf<TabsPassThrough>();
    expectTypeOf<WjTabListPt>().toEqualTypeOf<TabListPassThrough>();
    expectTypeOf<WjTabPt>().toEqualTypeOf<TabPassThrough>();
    expectTypeOf<WjTabPanelsPt>().toEqualTypeOf<TabPanelsPassThrough>();
    expectTypeOf<WjTabPanelPt>().toEqualTypeOf<TabPanelPassThrough>();

    const value: ReturnType<Tabs['value']> = 'overview' satisfies WjTabsValue;
    expect(value).toBe('overview');
  });
});
