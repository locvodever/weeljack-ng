import type { AutoComplete } from '@openng/optimus-ui/autocomplete';
import type { AutoCompletePassThrough } from '@openng/optimus-ui/types/autocomplete';
import type { WjOption } from 'weeljack-ng';
import type { WjAutoCompletePt, WjAutoCompleteSize } from 'weeljack-ng/autocomplete';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjAutoComplete types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjOption<string>[]>().toExtend<AutoComplete<WjOption<string>>['suggestions']>();
    expectTypeOf<WjOption<{ id: string }>[]>().toExtend<
      AutoComplete<WjOption<{ id: string }>>['suggestions']
    >();
    expectTypeOf<WjAutoCompleteSize>().toExtend<NonNullable<ReturnType<AutoComplete['size']>>>();
    expectTypeOf<WjAutoCompletePt>().toEqualTypeOf<AutoCompletePassThrough>();

    const suggestions: AutoComplete<WjOption<number>>['suggestions'] = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2, disabled: true },
    ] satisfies WjOption<number>[];
    expect(suggestions).toHaveLength(2);
  });

  it('keeps the value type through the option', () => {
    const option: WjOption<Date> = { label: 'Today', value: new Date(0) };

    expectTypeOf(option.value).toEqualTypeOf<Date>();
    expect(option.value.getTime()).toBe(0);
  });
});
