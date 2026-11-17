import type { DialogPassThrough } from '@openng/optimus-ui/dialog';
import type { WjDialogPt } from 'weeljack-ng/dialog';

/**
 * The seam's type-level spec (09 Q5): `WjDialogPt` stays the Optimus pass-through type. The check
 * runs in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file
 * red there. The runtime assertion only keeps the file a spec.
 */
describe('WjDialog types', () => {
  it('keeps WjDialogPt equal to the Optimus pass-through type', () => {
    expectTypeOf<WjDialogPt>().toEqualTypeOf<DialogPassThrough>();

    const pt: WjDialogPt = { root: { class: 'x' } };
    expect(pt.root).toEqual({ class: 'x' });
  });
});
