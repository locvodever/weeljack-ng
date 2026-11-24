import type { SelectItem } from '@openng/optimus-ui/api';
import type { WjOption } from 'weeljack-ng';

/**
 * The seam's type-level spec (09 Q5) for the shared option: `WjOption<T>` stays assignable to
 * Optimus's `SelectItem<T>` and keeps `T` through its `value`. The checks run in `typecheck` (`ngc`
 * over the spec project). The Optimus `options` inputs it feeds are typed `any[]`, so this is what
 * catches a drift. The runtime assertions only keep the file a spec.
 */
describe('WjOption', () => {
  it('assigns to Optimus’s SelectItem<T>', () => {
    expectTypeOf<WjOption<number>>().toExtend<SelectItem<number>>();
    expectTypeOf<WjOption<{ id: string }>>().toExtend<SelectItem<{ id: string }>>();

    const options: SelectItem<string>[] = [
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two', disabled: true },
    ] satisfies WjOption<string>[];

    expect(options).toHaveLength(2);
  });

  it('keeps the value type through the option', () => {
    const option: WjOption<Date> = { label: 'Today', value: new Date(0) };

    expectTypeOf(option.value).toEqualTypeOf<Date>();
    expectTypeOf<WjOption<string>['label']>().toEqualTypeOf<string>();
    expectTypeOf<WjOption<string>['disabled']>().toEqualTypeOf<boolean | undefined>();
    expect(option.value.getTime()).toBe(0);
  });

  it('keeps an object value three levels deep', () => {
    interface Plan {
      id: number;
      tags: { name: string }[];
    }
    const option: WjOption<Plan> = { label: 'Team', value: { id: 2, tags: [{ name: 'a' }] } };

    expectTypeOf(option.value.tags[0]?.name).toEqualTypeOf<string | undefined>();
    expect(option.value.tags[0]?.name).toBe('a');
  });
});
