import type { Rating } from '@openng/optimus-ui/rating';
import type { RatingPassThrough } from '@openng/optimus-ui/types/rating';
import type { WjRatingPt } from 'weeljack-ng/rating';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */
describe('WjRating types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjRatingPt>().toEqualTypeOf<RatingPassThrough>();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjRatingPt>().toExtend<ReturnType<Rating['pt']>>();
    expectTypeOf<number>().toExtend<Rating['stars']>();
    expectTypeOf<boolean>().toExtend<NonNullable<Rating['readonly']>>();
    expect(true).toBe(true);
  });
});
