import type { FieldsetPassThrough } from '@openng/optimus-ui/fieldset';
import type { WjFieldsetPt } from 'weeljack-ng/fieldset';

/**
 * The seam's type-level spec (09 Q5): `WjFieldsetPt` is exactly the Optimus pass-through, so a drift
 * in Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project). The
 * runtime assertion only keeps the file a spec.
 */
describe('WjFieldset types', () => {
  it('keeps WjFieldsetPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjFieldsetPt>().toEqualTypeOf<FieldsetPassThrough>();

    const pt: WjFieldsetPt = { toggleButton: { 'aria-describedby': 'hint' } };
    expect(pt).toBeDefined();
  });
});
