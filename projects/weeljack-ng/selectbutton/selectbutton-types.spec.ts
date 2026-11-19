import type { SelectButton } from '@openng/optimus-ui/selectbutton';
import type { SelectButtonPassThrough } from '@openng/optimus-ui/types/selectbutton';
import type { WjOption } from 'weeljack-ng';
import type {
  WjSelectButton,
  WjSelectButtonPt,
  WjSelectButtonSize,
} from 'weeljack-ng/selectbutton';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */

/** The values of an option list: `T` survives the walk through the options. */
function values<T>(options: WjOption<T>[]): T[] {
  return options.map((option) => option.value);
}

describe('WjSelectButton types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjSelectButtonPt>().toEqualTypeOf<SelectButtonPassThrough>();
  });

  it('keeps the size alias equal to Optimus’s size input', () => {
    expectTypeOf<WjSelectButtonSize>().toEqualTypeOf<
      NonNullable<ReturnType<SelectButton['size']>>
    >();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjOption<number>[]>().toExtend<NonNullable<SelectButton['options']>>();
    expectTypeOf<WjOption<{ id: string }>[]>().toExtend<NonNullable<SelectButton['options']>>();
    expectTypeOf<WjSelectButtonSize | undefined>().toExtend<ReturnType<SelectButton['size']>>();
  });

  it('keeps the value type through the model and the options', () => {
    expectTypeOf(values<number>([{ label: 'One', value: 1 }])).toEqualTypeOf<number[]>();
    expectTypeOf(values<{ id: string }>([{ label: 'One', value: { id: 'one' } }])).toEqualTypeOf<
      { id: string }[]
    >();
    expect(values([{ label: 'One', value: 1 }])).toEqual([1]);
    expect(values([{ label: 'One', value: { id: 'one' } }])).toEqual([{ id: 'one' }]);
  });

  it('types the model as the value or null, and the options as the shared option type', () => {
    expectTypeOf<ReturnType<WjSelectButton<number>['value']>>().toEqualTypeOf<number | null>();
    expectTypeOf<ReturnType<WjSelectButton<number>['options']>>().toEqualTypeOf<
      WjOption<number>[]
    >();
  });

  it('types allowEmpty as a boolean, which Optimus’s own input takes', () => {
    expectTypeOf<ReturnType<WjSelectButton<number>['allowEmpty']>>().toEqualTypeOf<boolean>();
    expectTypeOf<boolean>().toExtend<SelectButton['allowEmpty']>();
  });
});
