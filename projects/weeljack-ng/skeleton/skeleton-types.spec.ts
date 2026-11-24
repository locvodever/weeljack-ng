import type { Skeleton } from '@openng/optimus-ui/skeleton';
import type { SkeletonPassThrough } from '@openng/optimus-ui/types/skeleton';
import type { WjSkeletonPt, WjSkeletonShape } from 'weeljack-ng/skeleton';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjSkeleton types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjSkeletonShape>().toExtend<NonNullable<Skeleton['shape']>>();
    expectTypeOf<WjSkeletonPt>().toEqualTypeOf<SkeletonPassThrough>();
    const shape: Skeleton['shape'] = 'circle' satisfies WjSkeletonShape;
    expect(shape).toBe('circle');
  });
});
