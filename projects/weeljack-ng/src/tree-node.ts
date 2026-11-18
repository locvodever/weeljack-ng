/**
 * One node of a tree: the shape `wj-tree`, `wj-treetable`, `wj-treeselect` and
 * `wj-organizationchart` take. Optional fields can be added later without a break.
 */
export interface WjTreeNode<T = unknown> {
  /**
   * Unique id of the node in its tree. With it, a node keeps its expanded state, keyboard focus and
   * selection when the app sets a new `value`.
   */
  key?: string;
  /** The node's text and its accessible name. Rendered as text, never as HTML. */
  label?: string;
  /** The app's own payload: a tree-table row's cells, or whatever a slot shows. */
  data?: T;
  /**
   * The child nodes. A mutable array type, so it assigns to Optimus's `TreeNode[]`; no wrapper ever
   * writes it.
   */
  children?: WjTreeNode<T>[];
  /**
   * Whether the node shows its children. `wj-tree` and `wj-treetable` read it as the starting
   * state; an `expandedKeys` entry for the node's `key` wins over it.
   */
  expanded?: boolean;
  /**
   * `false` shows a toggle on a node that has no children yet, so the app can load them on
   * `nodeExpand`.
   */
  leaf?: boolean;
  /** `false` keeps the node from being selected or checked. */
  selectable?: boolean;
}

/**
 * How a tree entry selects: one node, any number by click, or any number by checkbox with the
 * parent-child propagation Optimus applies.
 */
export type WjTreeSelectionMode = 'single' | 'multiple' | 'checkbox';
