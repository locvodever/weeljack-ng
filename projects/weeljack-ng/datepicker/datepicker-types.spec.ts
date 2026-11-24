import type { DatePicker } from '@openng/optimus-ui/datepicker';
import type { DatePickerPassThrough } from '@openng/optimus-ui/types/datepicker';
import type { WjDatePickerPt, WjDatePickerSize } from 'weeljack-ng/datepicker';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjDatePicker types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjDatePickerPt>().toEqualTypeOf<DatePickerPassThrough>();
    expectTypeOf<WjDatePickerSize>().toEqualTypeOf<'small' | 'large'>();
    expectTypeOf<WjDatePickerSize>().toExtend<NonNullable<ReturnType<DatePicker['size']>>>();
    expectTypeOf<Date[]>().toExtend<DatePicker['disabledDates']>();
    expectTypeOf<number[]>().toExtend<DatePicker['disabledDays']>();
    expectTypeOf<Date>().toExtend<NonNullable<DatePicker['minDate']>>();
    expectTypeOf<Date>().toExtend<NonNullable<DatePicker['maxDate']>>();

    const pt: WjDatePickerPt = {
      pcInputText: { root: { 'aria-invalid': 'true' } },
      pcPrevButton: { root: { 'data-probe': 'prev' } },
      day: { 'data-probe': 'day' },
    };
    expect(pt).toEqual({
      pcInputText: { root: { 'aria-invalid': 'true' } },
      pcPrevButton: { root: { 'data-probe': 'prev' } },
      day: { 'data-probe': 'day' },
    });
  });
});
