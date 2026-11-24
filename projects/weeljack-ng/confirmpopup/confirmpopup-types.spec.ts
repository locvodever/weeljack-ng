import type { ConfirmPopupPassThrough } from '@openng/optimus-ui/types/confirmpopup';
import type { WjConfirmPopupPt } from 'weeljack-ng/confirmpopup';

/**
 * The seam's type-level spec (09 Q5): each `Wj*` type of the confirm popup stays tied to the
 * Optimus type it feeds. The checks run in `typecheck`; a drift in Optimus's types turns this file
 * red there. The runtime assertion only keeps the file a spec.
 */
describe('WjConfirmPopup types', () => {
  it('keeps the pass-through equal to Optimus', () => {
    expectTypeOf<WjConfirmPopupPt>().toEqualTypeOf<ConfirmPopupPassThrough>();
    const pt: ConfirmPopupPassThrough = null satisfies WjConfirmPopupPt;
    expect(pt).toBeNull();
  });
});
