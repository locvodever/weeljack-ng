import type { BreadcrumbPassThrough } from '@openng/optimus-ui/types/breadcrumb';
import type { WjBreadcrumbPt } from 'weeljack-ng/breadcrumb';

/**
 * The seam's type-level spec (09 Q5): `WjBreadcrumbPt` stays Optimus's pass-through type. The check
 * runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec. The item checks are
 * `menu-types.spec.ts`'s.
 */
describe('WjBreadcrumb types', () => {
  it('keeps WjBreadcrumbPt equal to Optimus’s BreadcrumbPassThrough', () => {
    expectTypeOf<WjBreadcrumbPt>().toEqualTypeOf<BreadcrumbPassThrough>();
    expect(true).toBe(true);
  });
});
