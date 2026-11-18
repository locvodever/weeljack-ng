import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import type { TreeTableNode } from '@openng/optimus-ui/api';
import { Optimus } from '@openng/optimus-ui/config';
import {
  TreeTable,
  TreeTableModule,
  type TreeTablePaginatorState,
  type TreeTableSortEvent,
} from '@openng/optimus-ui/treetable';
import { ObjectUtils } from '@openng/optimus-ui/utils';
import type {
  WjPageEvent,
  WjPaginatorPosition,
  WjSortOrder,
  WjTreeNode,
  WjTreeSelectionMode,
} from 'weeljack-ng';
import {
  _WJ_EN,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _copyTree,
  _mergePartAttributes,
  type _TreeCopy,
} from 'weeljack-ng/private';
import { WjTreeTableColumn } from './column/column';
import {
  WjTreeTableCaptionSlot,
  WjTreeTableEmptySlot,
  WjTreeTableSummarySlot,
} from './treetable-slots';
import type { WjTreeTablePt } from './treetable-types';

/** The root nodes per page a paging tree table uses until the app or the user picks another. */
const DEFAULT_ROWS = 10;

/** One row Optimus serialises: the node and where it sits. */
interface RowNode {
  node: WjTreeNode;
}

/** Optimus's keyed row tracking: the node's `key`, else the node. Bound to `rowTrackBy`. */
function trackByKey(_index: number, row: RowNode): unknown {
  return row.node.key ?? row.node;
}

/**
 * Optimus leaves `aria-expanded` off a row whose node never had `expanded`, so a closed parent
 * would not say it can open. The copies are the wrapper's own: a closed parent gets `false`.
 */
function markClosed(nodes: WjTreeNode[]): void {
  for (const node of nodes) {
    if (node.children?.length || node.leaf === false) {
      node.expanded ??= false;
    }
    markClosed(node.children ?? []);
  }
}

/*
 * Notes on treetable.html, kept here because a partially compiled template ships as text, inside
 * the size budget:
 * - Every `ng-template` is declared inside `p-treeTable`, because an embedded view uses the
 *   injector of its declaration, and the row and cell directives (`ttRow`, `ttSelectableRow`,
 *   `ttSortableColumn`, `p-treeTableToggler`, `p-treeTableCheckbox`, ...) inject Optimus's
 *   TreeTable there. Their `pt` parts (`rowToggleButton`, `pcRowCheckbox`, `pcHeaderCheckbox`)
 *   resolve through the same TreeTable, so they reach every row, whatever its level.
 * - Optimus writes `parent`, `expanded`, `partialSelected`, `checked` and `selectionKeys` entries
 *   into the nodes it renders, and sorts `value` and every `children` array in place, so it gets
 *   copies (`_copyTree`) and everything it reports comes back through `original()` as the app's
 *   own node. The copies are rebuilt only for a new `value` or an app-set `expandedKeys`: a map
 *   this table wrote itself, after a toggle, already shows on screen. `checked` is not carried
 *   over: Optimus reads it only when `dataKey` is set, which is not bound.
 * - Selection uses Optimus's `selection` path, never `selectionKeys`. A row is selected when its
 *   `data` deep-equals a selected node's `data`: the copies share `data` with the app's nodes.
 * - A row gets `ttSelectableRow` in `single` and `multiple` mode only. In `checkbox` mode a click
 *   on the row would arm Optimus's "ignore the next selection input" flag with nothing to ignore,
 *   so the row handles Space itself (`toggleNodeWithCheckbox`, which the checkbox calls too).
 * - The first column holds the toggle (indented by level), then the checkbox, then the content.
 * - Empty message: Optimus renders the `#emptymessage` template in the body when there are no
 *   nodes; while `loading` it shows a blank row, so the table keeps its height under the mask.
 */

/**
 * A table whose rows form a tree, over Optimus's `p-treeTable`: declare its columns as
 * `wj-treetable-column` children and give it `value`, nodes of `WjTreeNode` from `weeljack-ng`
 * with their cells in `data`. It writes every row and cell itself, expands, sorts, pages and
 * selects them. Give every node a `key`, so a node keeps its expansion and focus when you set a new
 * `value`, and every row distinct `data`: a row is selected when its `data` equals a selected
 * node's. `selection` and `expandedKeys` are two-way models that always hold your own nodes and
 * keys, in new arrays and maps: your tree is never written. A `wjTreeTableCell` or
 * `wjTreeTableHeaderCell` template inside a column customises what a cell shows.
 *
 * The table needs a name, since it has no visible title of its own: set `ariaLabel`, or point
 * `ariaLabelledBy` at a visible heading.
 */
@Component({
  selector: 'wj-treetable',
  imports: [TreeTableModule, NgTemplateOutlet],
  templateUrl: './treetable.html',
  styleUrl: './treetable.css',
})
export class WjTreeTable<T = unknown> {
  /**
   * The nodes, with each row's cells in `data`. Never changed: Optimus renders and sorts copies,
   * and `key` carries state across a new array.
   */
  readonly value = input<WjTreeNode<T>[]>([]);
  /** The field the rows are sorted by, `undefined` when unsorted. Two-way: `[(sortField)]`. */
  readonly sortField = model<string>();
  /** The sort direction: `1` ascending, `-1` descending. Two-way: `[(sortOrder)]`. */
  readonly sortOrder = model<WjSortOrder>(1);
  /** Shows a pager and splits the root nodes into pages; a node's descendants stay with it. */
  readonly paginator = input(false, { transform: booleanAttribute });
  /** Index of the first root node of the current page. Two-way: `[(first)]`. */
  readonly first = model(0);
  /** Root nodes per page; 10 while the table pages and none is given. Two-way: `[(rows)]`. */
  readonly rows = model<number>();
  /** Number of root nodes in all pages. Optimus counts `value` itself, so it has no effect yet. */
  readonly totalRecords = input(0, { transform: numberAttribute });
  /** The page sizes the pager offers, as a select. */
  readonly rowsPerPageOptions = input<number[]>();
  /** Where the pager sits: above, below or both. */
  readonly paginatorPosition = input<WjPaginatorPosition>('bottom');
  /** Draws a border between every cell. */
  readonly showGridlines = input(false, { transform: booleanAttribute });
  /** Highlights the row under the pointer. */
  readonly rowHover = input(false, { transform: booleanAttribute });
  /** How rows are selected. Left unset, nothing is selectable. */
  readonly selectionMode = input<WjTreeSelectionMode>();
  /** The selected nodes, always an array of your own nodes: at most one in `single` mode. Two-way. */
  readonly selection = model<WjTreeNode<T>[]>([]);
  /**
   * Which nodes are expanded, by `key`: an entry wins over the node's own `expanded`. Two-way: a
   * toggle sets a new map. A node with no `key` toggles on screen only.
   */
  readonly expandedKeys = model<Record<string, boolean>>({});
  /** Covers the table with Optimus's mask and spinner, and sets `aria-busy` on the table. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible name when the table has no visible title. Set on the `table` element. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the table. Set on the `table` element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the table. Set on the `table` element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the table's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTreeTablePt>();

  /** Emits when the user moves to another page or picks another page size. */
  readonly pageChange = output<WjPageEvent>();
  /** Fires with your own node when a row expands, from the pointer or the keyboard. */
  readonly nodeExpand = output<WjTreeNode<T>>();
  /** Fires with your own node when a row collapses, from the pointer or the keyboard. */
  readonly nodeCollapse = output<WjTreeNode<T>>();

  /** The columns, in the order declared. */
  protected readonly columns = contentChildren(WjTreeTableColumn);
  protected readonly emptySlot = contentChild(WjTreeTableEmptySlot);
  protected readonly captionSlot = contentChild(WjTreeTableCaptionSlot);
  protected readonly summarySlot = contentChild(WjTreeTableSummarySlot);
  protected readonly trackBy = trackByKey;

  private readonly optimus = inject(Optimus);
  private readonly table = viewChild(TreeTable);
  private built: { value: WjTreeNode<T>[]; copy: _TreeCopy<WjTreeNode<T>> } | undefined;
  private written: Record<string, boolean> | undefined;

  protected readonly picks = computed(
    () => this.selectionMode() === 'single' || this.selectionMode() === 'multiple',
  );
  protected readonly checks = computed(() => this.selectionMode() === 'checkbox');
  protected readonly pageRows = computed(
    () => this.rows() ?? (this.paginator() ? DEFAULT_ROWS : undefined),
  );

  /** The copies Optimus renders, rebuilt only as the notes above say. */
  protected readonly copy = computed(() => {
    const value = this.value();
    const keys = this.expandedKeys();
    const { built, written } = this;
    if (built?.value === value && keys === written) {
      return built.copy;
    }
    const copy = _copyTree(value, keys, built?.copy);
    markClosed(copy.nodes);
    this.built = { value, copy };
    return copy;
  });

  /** `selection` as Optimus wants it: the copies, one or `null` in `single` mode. */
  protected readonly picked = computed(() => {
    const nodes = this.selection().map(this.copy().copyOf);
    return this.selectionMode() === 'single' ? (nodes[0] ?? null) : nodes;
  });

  /**
   * `pt` forwarded as given, plus the ARIA attributes this wrapper routes: the table's name, its
   * description and busy state, the hidden row toggle and the names of the two checkboxes.
   * Optimus names the checkboxes never, so they are named from the first render.
   */
  protected readonly partAttributes = computed<WjTreeTablePt>(() => {
    let merged = _mergePartAttributes(this.pt(), 'table', {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
      'aria-busy': this.loading() ? 'true' : undefined,
    });
    // The row toggle repeats what the row says (`aria-expanded`), and the keyboard reaches both.
    merged = _mergePartAttributes(merged, 'rowToggleButton', { 'aria-hidden': 'true' });
    // Optimus puts `tabindex="-1"` on the checkbox's host, so its input stays a Tab stop: the row's
    // Space key checks it instead.
    merged = _mergePartAttributes(merged, 'pcRowCheckbox.input', {
      'aria-label': this.label('selectRow'),
      tabindex: '-1',
    });
    return _mergePartAttributes(merged, 'pcHeaderCheckbox.input', {
      'aria-label': this.label('selectAll'),
    });
  });

  constructor() {
    _checkWeeljackSetup('wj-treetable');
    _checkAriaOnHost('wj-treetable');
    // Optimus pages only through its own pager, so a `first`, `rows` or `paginator` the app sets is
    // told to it.
    effect(() => {
      const first = this.first();
      const rows = this.pageRows();
      const paginator = this.paginator();
      const table = this.table();
      untracked(() => {
        if (
          table &&
          (table.first !== first || table.rows !== rows || table.paginator !== paginator)
        ) {
          table.first = first;
          table.rows = rows;
          table.paginator = paginator;
          table.updateSerializedValue();
          table.tableService.onUIUpdate(table.value);
        }
      });
    });
  }

  /** The value of `field` on `node`'s `data`, resolved the way Optimus's sort resolves it. */
  protected cellValue(node: WjTreeNode<T>, field: string | undefined): unknown {
    if (field === undefined) {
      return undefined;
    }
    const value: unknown = ObjectUtils.resolveFieldData(node.data, field);
    return value;
  }

  /** A label the wrapper writes: Optimus's translation, which `provideWeeljack` fills. */
  private label(key: keyof typeof _WJ_EN.aria): string {
    const label: unknown = Reflect.get(Object(this.optimus.getTranslation('aria')), key);
    return typeof label === 'string' ? label : _WJ_EN.aria[key];
  }

  protected emptyText(): string {
    const text: unknown = this.optimus.getTranslation('emptyMessage');
    return typeof text === 'string' ? text : _WJ_EN.emptyMessage;
  }

  /** Optimus's `onSort`: the sort it now has, written back to the models. */
  protected sorted(event: TreeTableSortEvent): void {
    this.sortField.set(event.field);
    this.sortOrder.set(event.order === -1 ? -1 : 1);
  }

  protected paged(event: TreeTablePaginatorState): void {
    const page: WjPageEvent = { first: event.first ?? 0, rows: event.rows ?? DEFAULT_ROWS };
    this.first.set(page.first);
    this.rows.set(page.rows);
    this.pageChange.emit(page);
  }

  /** Optimus's `selectionChange`: what Optimus now holds, as your own nodes. */
  protected pick(held: TreeTableNode | TreeTableNode[] | null): void {
    const nodes = Array.isArray(held) ? held : held ? [held] : [];
    this.selection.set(nodes.map(this.copy().original));
  }

  /** Optimus's expand and collapse: the new `expandedKeys`, then the output, with your own node. */
  protected toggled(node: WjTreeNode<T> | undefined, open: boolean): void {
    if (node === undefined) {
      return;
    }
    const own = this.copy().original(node);
    const { key } = own;
    if (key !== undefined) {
      this.written = { ...this.expandedKeys(), [key]: open };
      this.expandedKeys.set(this.written);
    }
    (open ? this.nodeExpand : this.nodeCollapse).emit(own);
  }

  /**
   * Space on a focused row, in `checkbox` mode: checks or unchecks it, as its checkbox does.
   * Optimus's own row has no key for it, and the checkbox is out of the Tab order.
   */
  protected space(event: Event, row: RowNode): void {
    if (this.checks() && event.target === event.currentTarget && row.node.selectable !== false) {
      event.preventDefault();
      this.table()?.toggleNodeWithCheckbox({ originalEvent: event, rowNode: row });
    }
  }
}
