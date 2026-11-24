import type { TreeTablePassThrough } from '@openng/optimus-ui/types/treetable';
import type { WjTreeNode } from 'weeljack-ng';

/**
 * Pass-through for `wj-treetable`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTreeTablePt = TreeTablePassThrough;

/**
 * What a `wjTreeTableCell` template sees for each row of its column. `let-node` is your own node,
 * never a copy, and `let-value="value"` is the column's field resolved on its `data` (`undefined`
 * without a `field`). `T` is the type of the node's `data`: give the slot `[wjTreeTableCellOf]`
 * to have it inferred from your nodes.
 */
export interface WjTreeTableCellContext<T = unknown> {
  /** The row's node: the object you gave in `value`. */
  $implicit: WjTreeNode<T>;
  /** The column's `field` resolved on the node's `data`; dotted paths work. */
  value: unknown;
  /** The column's `field`. */
  field: string | undefined;
}

/** What a `wjTreeTableHeaderCell` template sees: the column's `header` text and `field`. */
export interface WjTreeTableHeaderCellContext {
  /** The column's `header` text. */
  $implicit: string | undefined;
  /** The column's `field`. */
  field: string | undefined;
}
