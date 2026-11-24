import type { Divider } from '@openng/optimus-ui/divider';
import type { DividerPassThrough } from '@openng/optimus-ui/types/divider';
import type { WjDividerAlign, WjDividerOrientation, WjDividerPt } from 'weeljack-ng/divider';

/**
 * The seam's type-level spec (09 Q5): `WjDividerPt` is exactly the Optimus pass-through, and the
 * two unions are the values Optimus accepts for `layout` and `align`, so a drift in Optimus's
 * values turns this file red in `typecheck` (`ngc` over the spec project). The runtime assertions
 * only keep the file a spec.
 */
describe('WjDivider types', () => {
  it('keeps WjDividerPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjDividerPt>().toEqualTypeOf<DividerPassThrough>();

    const pt: WjDividerPt = {
      root: { 'data-probe': 'root' },
      content: () => ({ 'data-probe': 'c' }),
    };
    expect(pt).toBeDefined();
  });

  it('keeps the orientation and alignment values assignable to what Optimus takes', () => {
    expectTypeOf<WjDividerOrientation>().toExtend<NonNullable<Divider['layout']>>();
    expectTypeOf<WjDividerAlign>().toExtend<NonNullable<Divider['align']>>();
    expectTypeOf<WjDividerOrientation>().toEqualTypeOf<'horizontal' | 'vertical'>();
    expectTypeOf<WjDividerAlign>().toEqualTypeOf<'left' | 'center' | 'right' | 'top' | 'bottom'>();

    expect(true).toBe(true);
  });
});
