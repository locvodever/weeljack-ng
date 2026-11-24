import type { Listbox } from '@openng/optimus-ui/listbox';
import type { ListBoxPassThrough } from '@openng/optimus-ui/types/listbox';
import type { WjOption } from 'weeljack-ng';
import type { WjListbox, WjListboxPt } from 'weeljack-ng/listbox';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */

/** The values of an option list: `T` survives the walk through the options. */
function values<T>(options: WjOption<T>[]): T[] {
  return options.map((option) => option.value);
}

describe('WjListbox types', () => {
  it('keeps the pass-through type equal to the Optimus one', () => {
    expectTypeOf<WjListboxPt>().toEqualTypeOf<ListBoxPassThrough>();
  });

  it('has no size alias, because Optimus’s listbox has no size input', () => {
    expectTypeOf<Listbox>().not.toHaveProperty('size');
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjOption<number>[]>().toExtend<Listbox['options']>();
    expectTypeOf<WjOption<{ id: string }>[]>().toExtend<Listbox['options']>();
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
    expectTypeOf<ReturnType<WjListbox<number>['value']>>().toEqualTypeOf<number | null>();
    expectTypeOf<ReturnType<WjListbox<number>['options']>>().toEqualTypeOf<WjOption<number>[]>();
  });
});
