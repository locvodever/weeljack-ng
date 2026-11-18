import type { InputOtp } from '@openng/optimus-ui/inputotp';
import type { InputOtpPassThrough } from '@openng/optimus-ui/types/inputotp';
import type { WjInputOtpPt, WjInputOtpSize } from 'weeljack-ng/inputotp';

/** What a signal input hands out when it is read. */
type Read<S> = S extends () => infer T ? T : never;

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjInputOtp types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjInputOtpPt>().toEqualTypeOf<InputOtpPassThrough>();
    expectTypeOf<WjInputOtpSize>().toEqualTypeOf<'small' | 'large'>();
    expectTypeOf<WjInputOtpSize>().toExtend<NonNullable<Read<InputOtp['size']>>>();

    const pt: WjInputOtpPt = {
      root: { 'data-probe': 'group' },
      pcInputText: { root: { 'aria-invalid': 'true' } },
    };
    expect(pt).toEqual({
      root: { 'data-probe': 'group' },
      pcInputText: { root: { 'aria-invalid': 'true' } },
    });
  });
});
