import type { CascadeSelect } from '@openng/optimus-ui/cascadeselect';
import type { CascadeSelectPassThrough } from '@openng/optimus-ui/types/cascadeselect';
import type { WjOption } from 'weeljack-ng';
import type {
  WjCascadeSelectGroup,
  WjCascadeSelectOption,
  WjCascadeSelectPt,
  WjCascadeSelectSize,
} from 'weeljack-ng/cascadeselect';

/**
 * The seam's type-level spec (09 Q5). The checks run in `typecheck` (`ngc` over the spec project);
 * a drift in Optimus's types turns this file red there. The runtime assertions only keep the file a
 * spec.
 */

/** Every leaf value of a tree, in order: `T` survives the walk down any number of levels. */
function leaves<T>(options: WjCascadeSelectOption<T>[]): T[] {
  return options.flatMap((option) =>
    'children' in option ? leaves(option.children) : [option.value],
  );
}

describe('WjCascadeSelect types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjCascadeSelectSize>().toExtend<NonNullable<ReturnType<CascadeSelect['size']>>>();
    expectTypeOf<WjCascadeSelectPt>().toEqualTypeOf<CascadeSelectPassThrough>();
    expectTypeOf<WjOption<string>>().toExtend<WjCascadeSelectOption<string>>();
    expectTypeOf<WjCascadeSelectGroup<string>>().toExtend<WjCascadeSelectOption<string>>();
  });

  it('pins Optimus 2.0.2’s mistyped inputs, which is why the wrapper casts the tree once', () => {
    // An Optimus fix turns these red: the cast in `WjCascadeSelect` goes in that certification.
    expectTypeOf<CascadeSelect['options']>().toEqualTypeOf<string[] | string | undefined>();
    expectTypeOf<CascadeSelect['optionGroupChildren']>().toEqualTypeOf<
      string[] | string | undefined | null
    >();
    expectTypeOf<WjCascadeSelectOption<string>[]>().not.toExtend<CascadeSelect['options']>();
  });

  it('keeps the value type through a three-level tree', () => {
    const tree: WjCascadeSelectOption<number>[] = [
      {
        label: 'Australia',
        children: [
          {
            label: 'Victoria',
            children: [
              { label: 'Melbourne', value: 1 },
              { label: 'Geelong', value: 2, disabled: true },
            ],
          },
        ],
      },
      { label: 'Anywhere', value: 3 },
    ];

    expectTypeOf(leaves(tree)).toEqualTypeOf<number[]>();
    expect(leaves(tree)).toEqual([1, 2, 3]);
  });

  it('keeps an object value type through the tree', () => {
    const tree: WjCascadeSelectOption<{ id: string }>[] = [
      { label: 'Group', children: [{ label: 'One', value: { id: 'one' } }] },
    ];

    expectTypeOf(leaves(tree)).toEqualTypeOf<{ id: string }[]>();
    expect(leaves(tree)).toEqual([{ id: 'one' }]);
  });

  it('tells a group from a leaf by its children, and a group has no value', () => {
    const group: WjCascadeSelectGroup<string> = { label: 'Group', children: [] };

    expectTypeOf(group).not.toHaveProperty('value');
    expectTypeOf<WjCascadeSelectGroup<string>['children']>().toEqualTypeOf<
      WjCascadeSelectOption<string>[]
    >();
    expect(group.children).toEqual([]);
  });
});
