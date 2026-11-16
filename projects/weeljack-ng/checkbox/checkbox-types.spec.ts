import type { CheckboxPassThrough } from '@openng/optimus-ui/types/checkbox';
import type { WjCheckboxPt } from 'weeljack-ng/checkbox';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjCheckbox types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjCheckboxPt>().toEqualTypeOf<CheckboxPassThrough>();

    const pt: WjCheckboxPt = { input: { 'aria-invalid': 'true' } };
    expect(pt).toEqual({ input: { 'aria-invalid': 'true' } });
  });
});
