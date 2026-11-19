import type { Knob } from '@openng/optimus-ui/knob';
import type { KnobPassThrough } from '@openng/optimus-ui/types/knob';
import type { WjKnobPt } from 'weeljack-ng/knob';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */
describe('WjKnob types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjKnobPt>().toEqualTypeOf<KnobPassThrough>();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjKnobPt>().toExtend<ReturnType<Knob['pt']>>();
    expectTypeOf<number>().toExtend<Knob['min']>();
    expectTypeOf<number>().toExtend<Knob['max']>();
    expectTypeOf<number>().toExtend<Knob['step']>();
    expectTypeOf<number>().toExtend<Knob['size']>();
    expectTypeOf<string>().toExtend<Knob['valueTemplate']>();
    expect(true).toBe(true);
  });
});
