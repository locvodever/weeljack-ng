import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import type { WjTreeNodeContext } from './tree-types';

/**
 * What every node of a `wj-tree` shows, instead of its `label`: put an `<ng-template wjTreeNode>`
 * inside the tree, and `let-node` is your own node. The template renders inside Optimus's label
 * span, after the toggle and the checkbox, and the treeitem's accessible name stays the node's
 * `label`: keep it equal to the start of what the template shows. Give the template at creation:
 * Optimus reads it once. Import the directive: an un-imported `wjTreeNode` silently drops its
 * template.
 *
 * `[wjTreeNodeOf]` only types the template: bind it to your nodes (`[wjTreeNodeOf]="folders()"`)
 * so `let-node` has your node type. It is never read, and without it `T` is `unknown`.
 */
@Directive({ selector: 'ng-template[wjTreeNode]' })
export class WjTreeNodeSlot<T = unknown> {
  /** The template a `wj-tree` renders for each node. */
  readonly template = inject<TemplateRef<WjTreeNodeContext<T>>>(TemplateRef);
  /** Your nodes, bound only so the template type-checker infers the data type `T`. */
  readonly wjTreeNodeOf = input<readonly WjTreeNode<T>[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTreeNodeContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTreeNodeSlot<T>,
    context: unknown,
  ): context is WjTreeNodeContext<T> {
    return typeof context === 'object';
  }
}

/**
 * What a `wj-tree` shows instead of its empty message when it has no nodes. The slot has no
 * context. Import the directive: an un-imported `wjTreeEmpty` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjTreeEmpty]' })
export class WjTreeEmptySlot {
  /** The template the tree renders in place of its empty message. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjTreeEmptySlot, context: unknown): context is void {
    return directive instanceof WjTreeEmptySlot && context === undefined;
  }
}
