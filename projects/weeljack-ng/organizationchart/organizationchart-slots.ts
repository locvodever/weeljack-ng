import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import type { WjOrganizationChartNodeContext } from './organizationchart-types';

/**
 * What every node of a `wj-organizationchart` shows, instead of its `label`: put an
 * `<ng-template wjOrganizationChartNode>` inside the chart, and `let-node` is your own node. The
 * template renders inside the node's box, before the toggle. Give the template at creation:
 * Optimus reads it once. Import the directive: an un-imported `wjOrganizationChartNode` silently
 * drops its template.
 *
 * `[wjOrganizationChartNodeOf]` only types the template: bind it to your nodes
 * (`[wjOrganizationChartNodeOf]="chart()"`) so `let-node` has your node type. It is never read, and
 * without it `T` is `unknown`.
 */
@Directive({ selector: 'ng-template[wjOrganizationChartNode]' })
export class WjOrganizationChartNodeSlot<T = unknown> {
  /** The template a `wj-organizationchart` renders for each node. */
  readonly template = inject<TemplateRef<WjOrganizationChartNodeContext<T>>>(TemplateRef);
  /** Your nodes, bound only so the template type-checker infers the data type `T`. */
  readonly wjOrganizationChartNodeOf = input<readonly WjTreeNode<T>[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjOrganizationChartNodeContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjOrganizationChartNodeSlot<T>,
    context: unknown,
  ): context is WjOrganizationChartNodeContext<T> {
    return typeof context === 'object';
  }
}
