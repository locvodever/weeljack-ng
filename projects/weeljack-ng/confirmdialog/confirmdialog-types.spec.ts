import type { ConfirmDialogPassThrough } from '@openng/optimus-ui/types/confirmdialog';
import type { WjConfirmDialogPt } from 'weeljack-ng/confirmdialog';

/**
 * The seam's type-level spec (09 Q5): each `Wj*` type of the confirm dialog stays tied to the
 * Optimus type it feeds. The checks run in `typecheck`; a drift in Optimus's types turns this file
 * red there. The runtime assertion only keeps the file a spec.
 */
describe('WjConfirmDialog types', () => {
  it('keeps the pass-through equal to Optimus', () => {
    expectTypeOf<WjConfirmDialogPt>().toEqualTypeOf<ConfirmDialogPassThrough>();
    const pt: ConfirmDialogPassThrough = null satisfies WjConfirmDialogPt;
    expect(pt).toBeNull();
  });
});
