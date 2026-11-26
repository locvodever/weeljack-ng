import type { DialogPassThrough } from '@openng/optimus-ui/dialog';
import type { DynamicDialogConfig } from '@openng/optimus-ui/dynamicdialog';
import type { WjDynamicDialogConfig, WjDynamicDialogPt } from 'weeljack-ng/dynamicdialog';

/**
 * The seam's type-level spec (09 Q5): the input-direction `Wj*` type stays a subset of the Optimus
 * type it feeds, and the pass-through stays Optimus's. The checks run in `typecheck` (`ngc` over
 * the spec project); a drift in Optimus's types turns this file red there. The runtime assertion
 * only keeps the file a spec.
 */
describe('WjDialogService types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjDynamicDialogConfig>().toExtend<DynamicDialogConfig>();
    expectTypeOf<WjDynamicDialogConfig<{ name: string }>>().toExtend<
      DynamicDialogConfig<{ name: string }>
    >();
    expectTypeOf<WjDynamicDialogPt>().toEqualTypeOf<DialogPassThrough>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-class-instance-assignment -- the literal is how apps fill Optimus's DynamicDialogConfig, an options bag with no constructor logic
    const config: DynamicDialogConfig = {
      header: 'a',
      closable: false,
    } satisfies WjDynamicDialogConfig;
    expect(config.header).toBe('a');
  });
});
