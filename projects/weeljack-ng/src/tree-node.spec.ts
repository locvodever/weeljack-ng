import type { TreeNode } from '@openng/optimus-ui/api';
import type { Tree } from '@openng/optimus-ui/tree';
import type { TreeSelect } from '@openng/optimus-ui/treeselect';
import type { WjTreeNode, WjTreeSelectionMode } from 'weeljack-ng';

interface Folder {
  size: number;
}

/**
 * The seam's type-level spec (09 Q5) for the shared tree types: `WjTreeNode<T>` and Optimus's
 * `TreeNode<T>` assign to each other, and the selection mode is one Optimus's `Tree` and
 * `TreeSelect` both take. The checks run in `typecheck` (`ngc` over the spec project). The runtime
 * assertions only keep the file a spec.
 */
describe('tree types', () => {
  it('assigns WjTreeNode<T> to Optimus’s TreeNode<T>, and back', () => {
    expectTypeOf<WjTreeNode<Folder>>().toExtend<TreeNode<Folder>>();
    expectTypeOf<TreeNode<Folder>>().toExtend<WjTreeNode<Folder>>();
    expectTypeOf<WjTreeNode>().toExtend<TreeNode>();
    expectTypeOf<TreeNode>().toExtend<WjTreeNode>();

    const node: WjTreeNode<Folder> = { key: 'a', label: 'A', data: { size: 1 } };
    const optimus: TreeNode<Folder> = node;
    const back: WjTreeNode<Folder> = optimus;

    expect(back.data?.size).toBe(1);
  });

  it('keeps every field optional, so a node can be as small as a label', () => {
    const nodes: WjTreeNode[] = [{}, { label: 'Only a label' }, { leaf: false, selectable: false }];

    expect(nodes).toHaveLength(3);
  });

  it('feeds the selection mode to the Tree and the TreeSelect', () => {
    expectTypeOf<WjTreeSelectionMode>().toExtend<Tree['selectionMode']>();
    expectTypeOf<WjTreeSelectionMode>().toExtend<TreeSelect['selectionMode']>();
    expectTypeOf<WjTreeSelectionMode>().toEqualTypeOf<'single' | 'multiple' | 'checkbox'>();

    const mode: Tree['selectionMode'] = 'checkbox' satisfies WjTreeSelectionMode;

    expect(mode).toBe('checkbox');
  });

  it('keeps T three levels deep', () => {
    const tree: WjTreeNode<Folder> = {
      label: 'Root',
      data: { size: 1 },
      children: [
        {
          label: 'Child',
          data: { size: 2 },
          children: [{ label: 'Grandchild', data: { size: 3 } }],
        },
      ],
    };
    const grandchild = tree.children?.[0]?.children?.[0];

    expectTypeOf(grandchild?.data?.size).toEqualTypeOf<number | undefined>();
    expect(grandchild?.data?.size).toBe(3);
  });
});
