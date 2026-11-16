import type { PasswordPassThrough } from '@openng/optimus-ui/types/password';
import type { WjPasswordPt, WjPasswordSize } from 'weeljack-ng/password';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjPassword types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjPasswordPt>().toEqualTypeOf<PasswordPassThrough>();
    expectTypeOf<WjPasswordSize>().toEqualTypeOf<'small' | 'large'>();

    const pt: WjPasswordPt = { pcInputText: { root: { 'aria-invalid': 'true' } } };
    expect(pt).toEqual({ pcInputText: { root: { 'aria-invalid': 'true' } } });
  });
});
