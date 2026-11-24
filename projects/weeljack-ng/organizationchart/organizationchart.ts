import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PrimeTemplate } from '@openng/optimus-ui/api';
import { OrganizationChart } from '@openng/optimus-ui/organizationchart';
import type { WjTreeNode } from 'weeljack-ng';
import {
  _ariaStrings,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _copyTree,
  type _TreeCopy,
} from 'weeljack-ng/private';
import { WjOrganizationChartNodeSlot } from './organizationchart-slots';
import type { WjOrganizationChartPt } from './organizationchart-types';

/*
 * Notes on the template (kept here: a partially compiled template ships as text, inside the size
 * budget):
 * - Optimus writes `expanded` into every node it renders, so it gets copies (`_copyTree`), and
 *   `onNodeExpand`/`onNodeCollapse` come back through `original()` as the app's own node. A toggle
 *   is remembered by `key` (`opened`) so a rebuild for a new `value` keeps it: the copies are
 *   rebuilt only for a new `value`, since the toggled copy already shows on screen.
 * - Optimus 2.0.2 hands each nested node table the `pt` of the table above it as a signal it calls
 *   once, so the root node gets the chart's `pt` and every node below it gets none, an object or
 *   a function alike. What a node must say is therefore written on the DOM, for every level, by an
 *   observer on the host (browser-only, `afterNextRender`, as `wj-tree` does): the `data-wj-node`
 *   hook, the toggle's role, name, state and hook, and `aria-hidden` on the connector rows. Node
 *   `n` on screen is node `n` of the copy in document order: Optimus renders every node, a
 *   collapsed branch included.
 * - A function-form `pt` is called once, with the chart as its instance, and Optimus gets the
 *   object: the root node would otherwise get the function itself.
 * - The node slot is Optimus's `'default'` node template, declared only when given. Optimus reads
 *   its templates once, so give the slot at creation.
 */

/** Sets an attribute only when it differs, so the observer that calls this never loops. */
function put(element: Element, name: string, value: string): void {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

/** A node and every node below it, in document order. */
function flatten<T>(node: WjTreeNode<T>): WjTreeNode<T>[] {
  return [node, ...(node.children ?? []).flatMap(flatten)];
}

const OWNED = ['role', 'aria-expanded', 'aria-label', 'aria-hidden', 'data-wj-node'];

/**
 * Shows a hierarchy, such as a team, as a tree of boxes joined by lines, over Optimus's
 * `p-organizationchart`. Give it `value`, one root node of `WjTreeNode` from `weeljack-ng` (Optimus
 * draws only the first): your nodes are never written, because Optimus renders copies. With
 * `collapsible`, each node that has children shows a toggle, a button named by the node's `label`.
 * Put a `wjOrganizationChartNode` template inside to say what each node shows.
 */
@Component({
  selector: 'wj-organizationchart',
  imports: [OrganizationChart, PrimeTemplate, NgTemplateOutlet],
  templateUrl: './organizationchart.html',
  styleUrl: './organizationchart.css',
})
export class WjOrganizationChart<T = unknown> {
  /** The chart's nodes: one root, with its `children` nested. Never changed. */
  readonly value = input<WjTreeNode<T>[]>([]);
  /** Shows an expand and collapse toggle on each node that has children, or `leaf: false`. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the chart's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjOrganizationChartPt>();

  /** Fires with your own node when a toggle expands it. */
  readonly nodeExpand = output<WjTreeNode<T>>();
  /** Fires with your own node when a toggle collapses it. */
  readonly nodeCollapse = output<WjTreeNode<T>>();

  protected readonly nodeSlot = contentChild(WjOrganizationChartNodeSlot);

  private readonly inner = viewChild(OrganizationChart);
  private readonly aria = _ariaStrings();
  private built: { value: WjTreeNode<T>[]; copy: _TreeCopy<WjTreeNode<T>> } | undefined;
  private opened: Record<string, boolean> = {};

  /** The copies Optimus renders, rebuilt for a new `value` only. */
  protected readonly copy = computed(() => {
    const value = this.value();
    if (this.built?.value !== value) {
      this.built = { value, copy: _copyTree(value, this.opened, this.built?.copy) };
    }
    return this.built.copy;
  });

  /** `pt` as an object: a function form is called here, once, for the chart (notes above). */
  protected readonly partAttributes = computed<WjOrganizationChartPt>(() => {
    const pt = this.pt();
    return typeof pt === 'function'
      ? pt({ instance: this.inner(), parent: { instance: undefined } })
      : pt;
  });

  constructor() {
    _checkWeeljackSetup('wj-organizationchart');
    _checkAriaOnHost('wj-organizationchart');

    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new MutationObserver(() => {
        this.fixNodes(host);
      });
      observer.observe(host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: OWNED,
      });
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
      this.fixNodes(host);
    });
  }

  /** Writes what every node must say on the DOM, whatever its level (notes above). */
  private fixNodes(host: HTMLElement): void {
    const [root] = this.copy().nodes;
    const nodes = root ? flatten(root) : [];
    host.querySelectorAll('[data-pc-section="node"]').forEach((box, index) => {
      put(box, 'data-wj-node', '');
      const toggle = box.querySelector('[data-pc-section="nodetogglebutton"]');
      const node = nodes[index];
      if (toggle && node) {
        const open = node.expanded === true;
        put(toggle, 'role', 'button');
        put(toggle, 'aria-expanded', String(open));
        put(toggle, 'aria-label', node.label ?? this.aria(open ? 'collapseLabel' : 'expandLabel'));
        put(toggle, 'data-wj-toggle', '');
      }
    });
    host.querySelectorAll('[data-pc-section="connectors"]').forEach((row) => {
      put(row, 'aria-hidden', 'true');
    });
  }

  /** Optimus's expand and collapse: remembered by `key`, then reported with your own node. */
  protected toggled(node: WjTreeNode<T>, open: boolean): void {
    const own = this.copy().original(node);
    if (own.key !== undefined) {
      this.opened = { ...this.opened, [own.key]: open };
    }
    (open ? this.nodeExpand : this.nodeCollapse).emit(own);
  }
}
