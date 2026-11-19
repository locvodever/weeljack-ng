import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { PrimeTemplate } from '@openng/optimus-ui/api';
import { Tree } from '@openng/optimus-ui/tree';
import type { WjTreeNode, WjTreeSelectionMode } from 'weeljack-ng';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _copyTree,
  _mergePartAttributes,
  type _TreeCopy,
} from 'weeljack-ng/private';
import { WjTreeEmptySlot, WjTreeNodeSlot } from './tree-slots';
import type { WjTreePt } from './tree-types';

/*
 * Notes on the template (kept here: a partially compiled template ships as text, inside the size
 * budget):
 * - Optimus writes `parent`, `expanded`, `partialSelected` and `style` into every node it renders,
 *   so it gets copies (`_copyTree`), and everything it reports comes back through `original()` as
 *   the app's own node. The copies are rebuilt only for a new `value` or an app-set
 *   `expandedKeys`: a map this tree wrote itself, after a toggle, already shows on screen.
 * - Optimus tracks nodes by `trackBy`: by `key`, so a rebuild reuses the rendered nodes and focus
 *   stays where it was. A node with no key falls back to its identity.
 * - `TreeDragDropService` is never reached: Optimus injects it optionally and uses it only while
 *   `droppableNodes` is on, which is not exposed.
 * - The node slot is Optimus's `'default'` node template, declared only when given. Optimus reads
 *   its templates once, so give the slot at creation. The empty slot is a content query Optimus's
 *   OnPush view does not notice appearing later: an effect nudges it.
 * - `selectionChange` fires once per node Optimus propagates a check through, so the tree reports
 *   what Optimus holds once, after the click.
 * - A MutationObserver on the host keeps `fixNodes`' attributes on every node, however deep: `pt`
 *   cannot reach the nodes below the first level. It is browser-only (`afterNextRender`).
 */

/** Optimus's keyed tracking: the node's `key`, else the node. Bound to `trackBy`. */
function trackByKey(_index: number, node: WjTreeNode): unknown {
  return node.key ?? node;
}

/** Sets an attribute only when it differs, so the observer that calls this never loops. */
function put(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) !== value) {
    if (value === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }
}

/**
 * Optimus 2.0.2 hands a node's `pt` to its children as a signal it resolves once, so the parts of
 * a node below the first level get no `pt` at all, ours included. What a node must say to
 * assistive tech is therefore written on the DOM, for every level:
 * - the toggle and the checkbox are hidden: the treeitem already says expanded and checked;
 * - the set size is the number of siblings (Optimus sets the node's own child count);
 * - a node that can open says `aria-expanded="false"` while closed (Optimus leaves it off);
 * - no `aria-label`: an expanded treeitem contains its children, so a label of its own text is not
 *   part of its visible text (axe `label-content-name-mismatch`): it is named from its content;
 * - a node whose own checkbox is partly checked says `aria-checked="mixed"`. Optimus writes only
 *   `"true"` and `"false"`, and writes nothing when a partly checked node is unchecked, so a stale
 *   `"mixed"` is put back to `"false"` here.
 */
function fixNodes(host: HTMLElement): void {
  for (const node of host.querySelectorAll('[role="treeitem"]')) {
    put(node, 'aria-label', null);
    put(node, 'aria-setsize', String(node.parentElement?.parentElement?.childElementCount ?? 0));
    if (!node.hasAttribute('aria-expanded') && !node.classList.contains('p-tree-node-leaf')) {
      put(node, 'aria-expanded', 'false');
    }
    const mixed =
      node.querySelector(
        ':scope > [data-pc-section="nodecontent"] > [data-p-partialchecked="true"]',
      ) !== null;
    if (mixed || node.getAttribute('aria-checked') === 'mixed') {
      put(node, 'aria-checked', mixed ? 'mixed' : 'false');
    }
  }
  const hidden =
    '[data-pc-section="nodetogglebutton"], [data-pc-section="nodecontent"] > p-checkbox';
  for (const part of host.querySelectorAll(hidden)) {
    put(part, 'aria-hidden', 'true');
  }
}

/**
 * Shows hierarchical data as an expandable tree, over Optimus's `p-tree`, with optional single,
 * multiple or checkbox selection. Give it `value`, nodes of `WjTreeNode` from `weeljack-ng`: give
 * every node a `key`, so a node keeps its expansion, focus and selection when you set a new
 * `value`. `selection` and `expandedKeys` are two-way models that always hold your own nodes and
 * keys, in new arrays and maps: your tree is never written. Put a `wjTreeNode` template inside to
 * say what each node shows, and a `wjTreeEmpty` template for no nodes. The tree is a list: name it
 * with `ariaLabel` or `ariaLabelledBy`.
 */
@Component({
  selector: 'wj-tree',
  imports: [Tree, PrimeTemplate, NgTemplateOutlet],
  templateUrl: './tree.html',
  styleUrl: './tree.css',
  host: { '(keydown)': 'jump($event)' },
})
export class WjTree<T = unknown> {
  /** The nodes. Never changed: Optimus renders copies, and `key` carries state across a new array. */
  readonly value = input<WjTreeNode<T>[]>([]);
  /** How nodes are selected. Left unset, nothing is selectable. Set it at creation. */
  readonly selectionMode = input<WjTreeSelectionMode>();
  /** The selected nodes, always an array of your own nodes: at most one in `single` mode. Two-way. */
  readonly selection = model<WjTreeNode<T>[]>([]);
  /**
   * Which nodes are expanded, by `key`: an entry wins over the node's own `expanded`. Two-way: a
   * toggle sets a new map. A node with no `key` toggles on screen only.
   */
  readonly expandedKeys = model<Record<string, boolean>>({});
  /** Covers the tree with Optimus's mask and spinner, and sets `aria-busy` on the list. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible name of the list. Set on the `role="tree"` list, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the list, not on the host. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the list. Set on the list, not on the host. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the tree's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTreePt>();

  /** Fires with your own node when a node expands, from the pointer or the keyboard. */
  readonly nodeExpand = output<WjTreeNode<T>>();
  /** Fires with your own node when a node collapses, from the pointer or the keyboard. */
  readonly nodeCollapse = output<WjTreeNode<T>>();

  protected readonly nodeSlot = contentChild(WjTreeNodeSlot);
  protected readonly emptySlot = contentChild(WjTreeEmptySlot);
  protected readonly trackBy = trackByKey;

  private readonly inner = viewChild(Tree);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private built: { value: WjTreeNode<T>[]; copy: _TreeCopy<WjTreeNode<T>> } | undefined;
  private written: Record<string, boolean> | undefined;
  private reporting = false;

  /** The copies Optimus renders, rebuilt only as the notes above say. */
  protected readonly copy = computed(() => {
    const value = this.value();
    const keys = this.expandedKeys();
    const { built, written } = this;
    if (built?.value === value && keys === written) {
      return built.copy;
    }
    const copy = _copyTree(value, keys, built?.copy);
    this.built = { value, copy };
    return copy;
  });

  /** `selection` as Optimus wants it: the copies, one or `null` in `single` mode. */
  protected readonly picked = computed(() => {
    const nodes = this.selection().map(this.copy().copyOf);
    return this.selectionMode() === 'single' ? (nodes[0] ?? null) : nodes;
  });

  /**
   * `pt` forwarded as given, plus the list's description and busy state. Optimus hands its nodes
   * the Tree's `pt` input as a signal it calls once, so a function-form `pt` would never reach
   * them: the consumer's function is resolved here, with the Tree as its instance, and the Tree
   * gets an object. The routed values win over a consumer `pt` value of the same name.
   */
  protected readonly partAttributes = computed<WjTreePt>(() => {
    const merged = _mergePartAttributes(this.pt(), 'rootChildren', {
      'aria-describedby': this.ariaDescribedBy(),
      'aria-busy': this.loading() ? 'true' : undefined,
    });
    return merged({ instance: this.inner(), parent: { instance: undefined } });
  });

  constructor() {
    _checkWeeljackSetup('wj-tree');
    _checkAriaOnHost('wj-tree');

    effect(() => {
      this.emptySlot();
      this.inner()?.cd.markForCheck();
    });

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new MutationObserver(() => {
        fixNodes(this.host);
      });
      observer.observe(this.host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'aria-label',
          'aria-setsize',
          'aria-expanded',
          'aria-hidden',
          'aria-checked',
          'data-p-partialchecked',
        ],
      });
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
      fixNodes(this.host);
    });
  }

  /**
   * Home, End and a typed character move focus between the nodes on screen, and hand the one Tab
   * stop over as Optimus does. Nothing is selected or checked. Optimus ignores these keys, so they
   * reach the host; only a treeitem target counts. A space matches no label (labels are trimmed),
   * so it stays Optimus's.
   */
  protected jump(event: KeyboardEvent): void {
    const { key } = event;
    const items = [...this.host.querySelectorAll<HTMLElement>('[role="treeitem"]')];
    const from = items.find((item) => item === event.target);
    if (!from || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    let next: HTMLElement | undefined;
    if (key === 'Home') {
      next = items[0];
    } else if (key === 'End') {
      next = items.at(-1);
    } else if (key.length === 1) {
      next = [...items.slice(items.indexOf(from) + 1), ...items].find((item) =>
        item
          .querySelector('[data-pc-section="nodelabel"]')
          ?.textContent.trim()
          .toLowerCase()
          .startsWith(key.toLowerCase()),
      );
    }
    if (next) {
      event.preventDefault();
      from.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    }
  }

  /** Optimus's `selectionChange`, once per click: reports what Optimus holds, as your own nodes. */
  protected pick(): void {
    if (this.reporting) {
      return;
    }
    this.reporting = true;
    queueMicrotask(() => {
      this.reporting = false;
      const held = this.inner()?.selection();
      const nodes = Array.isArray(held) ? held : held ? [held] : [];
      this.selection.set(nodes.map(this.copy().original));
    });
  }

  /** Optimus's expand and collapse: the new `expandedKeys`, then the output, with your own node. */
  protected toggled(node: WjTreeNode<T>, open: boolean): void {
    const own = this.copy().original(node);
    const { key } = own;
    if (key !== undefined) {
      this.written = { ...this.expandedKeys(), [key]: open };
      this.expandedKeys.set(this.written);
    }
    (open ? this.nodeExpand : this.nodeCollapse).emit(own);
  }
}
