import type { Textarea } from '@openng/optimus-ui/textarea';
import type { TextareaPassThrough } from '@openng/optimus-ui/types/textarea';
import type { WjTextareaPt, WjTextareaSize } from 'weeljack-ng/textarea';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjTextarea types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjTextareaSize>().toExtend<NonNullable<Textarea['pSize']>>();
    expectTypeOf<WjTextareaPt>().toEqualTypeOf<TextareaPassThrough>();

    const size: Textarea['pSize'] = 'small' satisfies WjTextareaSize;
    expect(size).toBe('small');
  });
});
