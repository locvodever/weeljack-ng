import type { OrganizationChartPassThrough } from '@openng/optimus-ui/types/organizationchart';
import type { WjTreeNode } from 'weeljack-ng';

/**
 * What a `wjOrganizationChartNode` template gets: your own node, never a copy, as `let-node`. `T`
 * is the type of the node's `data`.
 */
export interface WjOrganizationChartNodeContext<T = unknown> {
  /** The node being rendered: the object you gave in `value`. */
  $implicit: WjTreeNode<T>;
}

/**
 * Pass-through for `wj-organizationchart`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjOrganizationChartPt = OrganizationChartPassThrough;
