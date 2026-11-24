import type { MeterGroup } from '@openng/optimus-ui/metergroup';
import type { MeterGroupPassThrough, MeterItem } from '@openng/optimus-ui/types/metergroup';
import type {
  WjMeterGroup,
  WjMeterGroupLabelPosition,
  WjMeterGroupPt,
  WjMeterItem,
} from 'weeljack-ng/metergroup';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjMeterGroup types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjMeterGroupPt>().toEqualTypeOf<MeterGroupPassThrough>();
    expectTypeOf<WjMeterItem>().toExtend<MeterItem>();
    expectTypeOf<WjMeterItem[]>().toExtend<MeterGroup['value']>();
    expectTypeOf<ReturnType<WjMeterGroup['value']>>().toExtend<MeterGroup['value']>();
    expectTypeOf<WjMeterGroupLabelPosition>().toExtend<MeterGroup['labelPosition']>();
    expectTypeOf<ReturnType<WjMeterGroup['labelPosition']>>().toExtend<
      MeterGroup['labelPosition']
    >();

    const position: MeterGroup['labelPosition'] = 'start' satisfies WjMeterGroupLabelPosition;
    expect(position).toBe('start');
  });
});
