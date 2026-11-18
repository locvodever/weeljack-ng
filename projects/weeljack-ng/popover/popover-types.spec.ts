import type { PopoverPassThrough } from '@openng/optimus-ui/types/popover';
import type { WjPopoverPt } from 'weeljack-ng/popover';

/**
 * The seam's type-level spec (09 Q5): each `Wj*` type of the popover stays tied to the Optimus
 * type it feeds. The checks run in `typecheck`; a drift in Optimus's types turns this file red
 * there. The runtime assertion only keeps the file a spec.
 */
describe('WjPopover types', () => {
  it('keeps the pass-through equal to Optimus', () => {
    expectTypeOf<WjPopoverPt>().toEqualTypeOf<PopoverPassThrough>();
    const pt: PopoverPassThrough = null satisfies WjPopoverPt;
    expect(pt).toBeNull();
  });
});
