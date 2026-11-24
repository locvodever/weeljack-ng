import type { ColorPicker } from '@openng/optimus-ui/colorpicker';
import type { ColorPickerPassThrough } from '@openng/optimus-ui/types/colorpicker';
import type { WjColorPickerPt } from 'weeljack-ng/colorpicker';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */
describe('WjColorPicker types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjColorPickerPt>().toEqualTypeOf<ColorPickerPassThrough>();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjColorPickerPt>().toExtend<ReturnType<ColorPicker['pt']>>();
    expectTypeOf<string | undefined>().toExtend<ColorPicker['inputId']>();
    expect(true).toBe(true);
  });
});
