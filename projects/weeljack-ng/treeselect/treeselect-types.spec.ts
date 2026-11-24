import type { TreeSelect, TreeSelectPassThrough } from '@openng/optimus-ui/treeselect';
import type { WjTreeNode, WjTreeSelectionMode } from 'weeljack-ng';
import type { WjTreeSelect, WjTreeSelectPt, WjTreeSelectSize } from 'weeljack-ng/treeselect';

interface Department {
  headcount: number;
}

/**
 * The seam's type-level spec (09 Q5): `WjTreeSelectPt` is Optimus's own pass-through type, every
 * input-direction type stays a subset of the Optimus type it feeds, and the value is an array of
 * the app's own node type. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertions only keep the file a spec.
 */
describe('WjTreeSelect types', () => {
  it('keeps WjTreeSelectPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjTreeSelectPt>().toEqualTypeOf<TreeSelectPassThrough>();

    const pt: WjTreeSelectPt = {
      root: { 'data-probe': 'x' },
      hiddenInput: { 'aria-invalid': 'x' },
    };
    expect(pt).toBeDefined();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjTreeSelectSize>().toExtend<NonNullable<ReturnType<TreeSelect['size']>>>();
    expectTypeOf<WjTreeSelectionMode>().toExtend<NonNullable<TreeSelect['selectionMode']>>();
    expectTypeOf<ReturnType<WjTreeSelect<Department>['options']>>().toExtend<
      NonNullable<TreeSelect['options']>
    >();
    expect(true).toBe(true);
  });

  it('holds the picked nodes as an array of the app’s own node type', () => {
    expectTypeOf<ReturnType<WjTreeSelect['value']>>().toEqualTypeOf<WjTreeNode[]>();
    expectTypeOf<ReturnType<WjTreeSelect<Department>['value']>>().toEqualTypeOf<
      WjTreeNode<Department>[]
    >();
    expectTypeOf<ReturnType<WjTreeSelect<Department>['options']>>().toEqualTypeOf<
      WjTreeNode<Department>[]
    >();
    expectTypeOf<ReturnType<WjTreeSelect['selectionMode']>>().toEqualTypeOf<WjTreeSelectionMode>();
    expect(true).toBe(true);
  });
});
