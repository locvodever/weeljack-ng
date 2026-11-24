import type { Slider } from '@openng/optimus-ui/slider';
import type { SliderPassThrough } from '@openng/optimus-ui/types/slider';
import type { WjSliderOrientation, WjSliderPt } from 'weeljack-ng/slider';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */
describe('WjSlider types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjSliderPt>().toEqualTypeOf<SliderPassThrough>();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjSliderPt>().toExtend<ReturnType<Slider['pt']>>();
    expectTypeOf<WjSliderOrientation>().toExtend<Slider['orientation']>();
    expectTypeOf<number>().toExtend<Slider['min']>();
    expectTypeOf<number>().toExtend<Slider['max']>();
    expectTypeOf<number>().toExtend<NonNullable<Slider['step']>>();
    expect(true).toBe(true);
  });
});
