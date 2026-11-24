import type { Tag, TagPassThrough } from '@openng/optimus-ui/tag';
import type { WjTagPt, WjTagSeverity } from 'weeljack-ng/tag';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjTag types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjTagSeverity>().toExtend<NonNullable<Tag['severity']>>();
    expectTypeOf<WjTagPt>().toEqualTypeOf<TagPassThrough>();

    const severity: Tag['severity'] = 'success' satisfies WjTagSeverity;
    expect(severity).toBe('success');
  });
});
