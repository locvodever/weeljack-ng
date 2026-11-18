/**
 * What `_copyTree` needs of a node. `private` cannot import the root's `WjTreeNode` (the root
 * imports `private`, never the other way), so the helper is generic over this structural shape.
 */
interface TreeNodeLike<N> {
  key?: string;
  expanded?: boolean;
  leaf?: boolean;
  children?: N[];
}

/**
 * The copies of a tree that Optimus renders, and the way back to the app's own nodes.
 *
 * @docs-private
 */
export interface _TreeCopy<N> {
  /** The copies Optimus gets: every node shallow-copied, every `children` array new. */
  readonly nodes: N[];
  /** The app's node a copy was made from; any other object comes back as it is. */
  readonly original: (node: N) => N;
  /** The copy made from an app node, by identity, else by `key`; else the node itself. */
  readonly copyOf: (node: N) => N;
}

/**
 * Copies a tree for Optimus, which writes `parent`, `expanded`, `partialSelected` and `style` into
 * every node it renders: the app's nodes are never handed over.
 *
 * Each node is copied with `{ ...node }`, so its `data` is shared by reference. `children` is a new
 * array of copies, and a `leaf: false` node with none gets `children: []` (TreeTable opens a row
 * from the keyboard only when `children` is set). `expanded` is `expandedKeys[key]` when the map
 * has the node's key, else the node's own. The partial-check mark Optimus set on the `previous`
 * copy of the same node (by identity, else by `key`) is carried to the new copy, so a rebuild does
 * not lose it.
 *
 * @docs-private
 */
export function _copyTree<N extends TreeNodeLike<N>>(
  nodes: readonly N[] | null | undefined,
  expandedKeys?: Readonly<Record<string, boolean>>,
  previous?: _TreeCopy<N>,
): _TreeCopy<N> {
  const copies = new Map<N, N>();
  const originals = new Map<N, N>();
  const keyed = new Map<string, N>();

  const copy = (node: N): N => {
    const { key } = node;
    const open: unknown = key === undefined ? undefined : expandedKeys?.[key];
    const children = node.children ? node.children.map(copy) : node.leaf === false ? [] : undefined;
    const made: N = {
      ...node,
      ...(typeof open === 'boolean' && { expanded: open }),
      ...(children && { children }),
    };
    const old = previous?.copyOf(node);
    if (old !== node && Reflect.get(Object(old), 'partialSelected') === true) {
      Reflect.set(made, 'partialSelected', true);
    }
    copies.set(node, made);
    originals.set(made, node);
    if (key !== undefined) {
      keyed.set(key, made);
    }
    return made;
  };

  return {
    nodes: (nodes ?? []).map(copy),
    original: (node) => originals.get(node) ?? node,
    copyOf: (node) =>
      copies.get(node) ?? (node.key === undefined ? undefined : keyed.get(node.key)) ?? node,
  };
}
