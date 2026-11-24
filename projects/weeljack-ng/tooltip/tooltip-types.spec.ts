import type { Tooltip } from '@openng/optimus-ui/tooltip';
import type { TooltipPassThrough } from '@openng/optimus-ui/types/tooltip';
import type { WjTooltipPosition, WjTooltipPt } from 'weeljack-ng/tooltip';

/**
 * The seam's type-level spec (09 Q5): each `Wj*` type of the tooltip stays tied to the Optimus
 * type it feeds. The checks run in `typecheck`; a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjTooltip types', () => {
  it('keeps the position assignable to the composed input', () => {
    expectTypeOf<WjTooltipPosition>().toExtend<NonNullable<Tooltip['tooltipPosition']>>();
    const position: Tooltip['tooltipPosition'] = 'top' satisfies WjTooltipPosition;
    expect(position).toBe('top');
  });

  it('keeps the pass-through equal to Optimus', () => {
    expectTypeOf<WjTooltipPt>().toEqualTypeOf<TooltipPassThrough>();
    const pt: TooltipPassThrough = null satisfies WjTooltipPt;
    expect(pt).toBeNull();
  });
});
