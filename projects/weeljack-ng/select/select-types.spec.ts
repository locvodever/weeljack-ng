import type { Select } from '@openng/optimus-ui/select';
import type { SelectPassThrough } from '@openng/optimus-ui/types/select';
import type { WjSelectOption, WjSelectPt, WjSelectSize } from 'weeljack-ng/select';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjSelect types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjSelectOption<number>[]>().toExtend<NonNullable<Select['options']>>();
    expectTypeOf<WjSelectOption<{ id: string }>[]>().toExtend<NonNullable<Select['options']>>();
    expectTypeOf<WjSelectSize>().toExtend<NonNullable<ReturnType<Select['size']>>>();
    expectTypeOf<WjSelectPt>().toEqualTypeOf<SelectPassThrough>();

    const options: Select['options'] = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2, disabled: true },
    ] satisfies WjSelectOption<number>[];
    expect(options).toHaveLength(2);
  });

  it('keeps the value type through the option', () => {
    const option: WjSelectOption<Date> = { label: 'Today', value: new Date(0) };

    expectTypeOf(option.value).toEqualTypeOf<Date>();
    expectTypeOf<WjSelectOption<string>['disabled']>().toEqualTypeOf<boolean | undefined>();
    expect(option.value.getTime()).toBe(0);
  });
});
