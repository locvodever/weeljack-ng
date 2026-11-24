import type { MultiSelect } from '@openng/optimus-ui/multiselect';
import type {
  MultiSelectPassThrough,
  MultiSelectPassThroughOptions,
} from '@openng/optimus-ui/types/multiselect';
import type { WjOption } from 'weeljack-ng';
import type { WjMultiSelect, WjMultiSelectPt, WjMultiSelectSize } from 'weeljack-ng/multiselect';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */

/** The values of an option list: `T` survives the walk through the options. */
function values<T>(options: WjOption<T>[]): T[] {
  return options.map((option) => option.value);
}

describe('WjMultiSelect types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjMultiSelectPt>().toEqualTypeOf<MultiSelectPassThrough>();
  });

  it('keeps the size alias equal to Optimus’s size input', () => {
    expectTypeOf<WjMultiSelectSize>().toEqualTypeOf<NonNullable<ReturnType<MultiSelect['size']>>>();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjOption<number>[]>().toExtend<NonNullable<MultiSelect['options']>>();
    expectTypeOf<WjOption<{ id: string }>[]>().toExtend<NonNullable<MultiSelect['options']>>();
    expectTypeOf<WjMultiSelectSize | undefined>().toExtend<ReturnType<MultiSelect['size']>>();
  });

  it('keeps the value type through the model and the options', () => {
    expectTypeOf(values<number>([{ label: 'One', value: 1 }])).toEqualTypeOf<number[]>();
    expectTypeOf(values<{ id: string }>([{ label: 'One', value: { id: 'one' } }])).toEqualTypeOf<
      { id: string }[]
    >();
    expect(values([{ label: 'One', value: 1 }])).toEqual([1]);
    expect(values([{ label: 'One', value: { id: 'one' } }])).toEqual([{ id: 'one' }]);
  });

  it('types the model as an array of the value, and the options as the shared option type', () => {
    expectTypeOf<ReturnType<WjMultiSelect<number>['value']>>().toEqualTypeOf<number[]>();
    expectTypeOf<ReturnType<WjMultiSelect<number>['options']>>().toEqualTypeOf<
      WjOption<number>[]
    >();
  });

  it('Gap: Optimus’s pt type does not declare hiddenInput, which its template reads', () => {
    expectTypeOf<MultiSelectPassThroughOptions>().not.toHaveProperty('hiddenInput');
  });
});
