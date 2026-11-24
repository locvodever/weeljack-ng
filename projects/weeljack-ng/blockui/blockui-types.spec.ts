import type { BlockUIPassThrough } from '@openng/optimus-ui/types/blockui';
import type { WjBlockUIPt } from 'weeljack-ng/blockui';

/**
 * The seam's type-level spec (09 Q5): each `Wj*` type of the block UI stays tied to the Optimus
 * type it feeds. The checks run in `typecheck`; a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjBlockUI types', () => {
  it('keeps the pass-through equal to Optimus', () => {
    expectTypeOf<WjBlockUIPt>().toEqualTypeOf<BlockUIPassThrough>();
    const pt: BlockUIPassThrough = null satisfies WjBlockUIPt;
    expect(pt).toBeNull();
  });
});
