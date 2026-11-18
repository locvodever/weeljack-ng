import type { ChipPassThrough } from '@openng/optimus-ui/chip';
import type { WjChipPt } from 'weeljack-ng/chip';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjChip types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjChipPt>().toEqualTypeOf<ChipPassThrough>();

    const pt: ChipPassThrough = { root: { class: 'x' } } satisfies WjChipPt;
    expect(pt).toEqual({ root: { class: 'x' } });
  });
});
