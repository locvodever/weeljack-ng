import type { InputNumberPassThrough } from '@openng/optimus-ui/types/inputnumber';
import type { InputNumber } from '@openng/optimus-ui/inputnumber';
import type {
  WjInputNumberMode,
  WjInputNumberPt,
  WjInputNumberSize,
} from 'weeljack-ng/inputnumber';

/** What a signal input hands out when it is read. */
type Read<S> = S extends () => infer T ? T : never;

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjInputNumber types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjInputNumberPt>().toEqualTypeOf<InputNumberPassThrough>();
    expectTypeOf<WjInputNumberSize>().toEqualTypeOf<'small' | 'large'>();
    expectTypeOf<WjInputNumberSize>().toExtend<NonNullable<Read<InputNumber['size']>>>();
    expectTypeOf<WjInputNumberMode>().toEqualTypeOf<'decimal' | 'currency'>();

    const pt: WjInputNumberPt = {
      pcInputText: { root: { 'aria-invalid': 'true' } },
      incrementButton: { 'data-probe': 'up' },
    };
    expect(pt).toEqual({
      pcInputText: { root: { 'aria-invalid': 'true' } },
      incrementButton: { 'data-probe': 'up' },
    });
  });
});
