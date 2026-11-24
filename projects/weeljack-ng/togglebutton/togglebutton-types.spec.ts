import type { ToggleButton } from '@openng/optimus-ui/togglebutton';
import type { ToggleButtonPassThrough } from '@openng/optimus-ui/types/togglebutton';
import type { WjToggleButtonPt, WjToggleButtonSize } from 'weeljack-ng/togglebutton';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */
describe('WjToggleButton types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjToggleButtonPt>().toEqualTypeOf<ToggleButtonPassThrough>();
  });

  it('keeps the size within Optimus’s size', () => {
    expectTypeOf<WjToggleButtonSize>().toExtend<ToggleButton['size']>();
    const sizes: WjToggleButtonSize[] = ['small', 'large'];
    expect(sizes).toHaveLength(2);
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjToggleButtonPt>().toExtend<ReturnType<ToggleButton['pt']>>();
    expectTypeOf<string>().toExtend<ToggleButton['onLabel']>();
    expectTypeOf<string>().toExtend<ToggleButton['offLabel']>();
    expectTypeOf<string | undefined>().toExtend<ToggleButton['ariaLabel']>();
    expectTypeOf<string | undefined>().toExtend<ToggleButton['ariaLabelledBy']>();
  });
});
