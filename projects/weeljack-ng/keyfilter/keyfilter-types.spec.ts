import type { KeyFilter, KeyFilterPattern } from '@openng/optimus-ui/keyfilter';
import type { WjKeyFilterPattern } from 'weeljack-ng/keyfilter';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjKeyFilter types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjKeyFilterPattern>().toExtend<KeyFilterPattern>();
    expectTypeOf<RegExp | WjKeyFilterPattern>().toExtend<KeyFilter['pattern']>();

    const pattern: KeyFilter['pattern'] = 'pint' satisfies WjKeyFilterPattern;
    expect(pattern).toBe('pint');
  });
});
