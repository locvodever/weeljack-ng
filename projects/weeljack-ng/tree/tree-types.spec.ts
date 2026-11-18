import type { Tree, TreePassThrough } from '@openng/optimus-ui/tree';
import type { OutputEmitterRef } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import {
  WjTreeEmptySlot,
  WjTreeNodeSlot,
  type WjTree,
  type WjTreeNodeContext,
  type WjTreePt,
} from 'weeljack-ng/tree';

interface Folder {
  items: number;
}

/**
 * The seam's type-level spec (09 Q5): `WjTreePt` is Optimus's own pass-through type, every
 * input-direction type stays a subset of the Optimus type it feeds, and the outputs carry the
 * app's node. The checks run in `typecheck` (`ngc` over the spec project); a drift in Optimus's
 * types turns this file red there. The runtime assertions only keep the file a spec.
 */
describe('WjTree types', () => {
  it('keeps WjTreePt equal to the Optimus pass-through', () => {
    expectTypeOf<WjTreePt>().toEqualTypeOf<TreePassThrough>();

    const pt: WjTreePt = { node: { 'data-probe': 'x' }, nodeToggleButton: { tabindex: -1 } };
    expect(pt).toBeDefined();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<ReturnType<WjTree<Folder>['value']>>().toExtend<Tree['value']>();
    expectTypeOf<ReturnType<WjTree['selectionMode']>>().toExtend<Tree['selectionMode']>();
    expectTypeOf<ReturnType<WjTree['selection']>>().toEqualTypeOf<WjTreeNode[]>();
    expectTypeOf<ReturnType<WjTree<Folder>['selection']>>().toEqualTypeOf<WjTreeNode<Folder>[]>();
    expectTypeOf<ReturnType<WjTree['expandedKeys']>>().toEqualTypeOf<Record<string, boolean>>();
    expectTypeOf<ReturnType<WjTree['loading']>>().toEqualTypeOf<boolean>();
    expect(true).toBe(true);
  });

  it('emits the app’s own node, typed by the tree’s data type', () => {
    expectTypeOf<WjTree<Folder>['nodeExpand']>().toEqualTypeOf<
      OutputEmitterRef<WjTreeNode<Folder>>
    >();
    expectTypeOf<WjTree<Folder>['nodeCollapse']>().toEqualTypeOf<
      OutputEmitterRef<WjTreeNode<Folder>>
    >();
    expect(true).toBe(true);
  });

  it('types the node slot context from the nodes bound to its typing input', () => {
    expectTypeOf<WjTreeNodeContext<Folder>['$implicit']>().toEqualTypeOf<WjTreeNode<Folder>>();
    expectTypeOf<WjTreeNodeContext['$implicit']>().toEqualTypeOf<WjTreeNode>();
    expectTypeOf<WjTreeNodeSlot<Folder>['wjTreeNodeOf']>().not.toBeAny();
    expect(true).toBe(true);
  });

  it('gives both slots a context guard, which the type-checker reads in a template', () => {
    expectTypeOf(WjTreeNodeSlot).toHaveProperty('ngTemplateContextGuard');
    expectTypeOf(WjTreeEmptySlot).toHaveProperty('ngTemplateContextGuard');
    expect('ngTemplateContextGuard' in WjTreeNodeSlot).toBe(true);
    expect('ngTemplateContextGuard' in WjTreeEmptySlot).toBe(true);
  });
});
