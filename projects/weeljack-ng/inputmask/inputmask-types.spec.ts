import type { InputText } from '@openng/optimus-ui/inputtext';
import type { InputTextPassThrough } from '@openng/optimus-ui/types/inputtext';
import type { WjInputMaskPt, WjInputMaskSize } from 'weeljack-ng/inputmask';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjInputMask types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjInputMaskSize>().toExtend<NonNullable<InputText['pSize']>>();
    expectTypeOf<WjInputMaskPt>().toEqualTypeOf<InputTextPassThrough>();

    const size: InputText['pSize'] = 'small' satisfies WjInputMaskSize;
    expect(size).toBe('small');
  });
});
