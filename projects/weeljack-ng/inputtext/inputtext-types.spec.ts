import type { InputText } from '@openng/optimus-ui/inputtext';
import type { InputTextPassThrough } from '@openng/optimus-ui/types/inputtext';
import type { WjInputTextPt, WjInputTextSize } from 'weeljack-ng/inputtext';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjInputText types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjInputTextSize>().toExtend<NonNullable<InputText['pSize']>>();
    expectTypeOf<WjInputTextPt>().toEqualTypeOf<InputTextPassThrough>();

    const size: InputText['pSize'] = 'small' satisfies WjInputTextSize;
    expect(size).toBe('small');
  });
});
