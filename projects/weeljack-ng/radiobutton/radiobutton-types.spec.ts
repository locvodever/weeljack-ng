import type { RadioButton } from '@openng/optimus-ui/radiobutton';
import type { RadioButtonPassThrough } from '@openng/optimus-ui/types/radiobutton';
import type { WjRadioButton, WjRadioButtonPt } from 'weeljack-ng/radiobutton';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */

/** The options of a group: `T` survives the walk through the model and the option. */
function pick<T>(options: T[], value: T | null): T | null {
  return options.find((option) => option === value) ?? null;
}

describe('WjRadioButton types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjRadioButtonPt>().toEqualTypeOf<RadioButtonPassThrough>();
  });

  it('types the model as the value or null, and the option as the value', () => {
    expectTypeOf<ReturnType<WjRadioButton<number>['value']>>().toEqualTypeOf<number | null>();
    expectTypeOf<ReturnType<WjRadioButton<number>['option']>>().toEqualTypeOf<number>();
    expectTypeOf<ReturnType<WjRadioButton<{ id: string }>['option']>>().toEqualTypeOf<{
      id: string;
    }>();
  });

  it('keeps the value type through the model and the option', () => {
    expectTypeOf(pick<number>([1, 2], 2)).toEqualTypeOf<number | null>();
    expectTypeOf(pick<{ id: string }>([{ id: 'one' }], null)).toEqualTypeOf<{
      id: string;
    } | null>();
    expect(pick([1, 2], 2)).toBe(2);
    expect(pick(['a'], null)).toBeNull();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjRadioButtonPt>().toExtend<ReturnType<RadioButton['pt']>>();
    expectTypeOf<string | undefined>().toExtend<ReturnType<RadioButton['name']>>();
    expectTypeOf<boolean>().toExtend<ReturnType<RadioButton['disabled']> | undefined>();
  });
});
