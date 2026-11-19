import { TreeTableBasicExample } from '../../../examples/treetable/basic';
import { TreeTableCheckboxSelectionExample } from '../../../examples/treetable/checkbox-selection';
import { TreeTableCustomCellsExample } from '../../../examples/treetable/custom-cells';
import { TreeTableEmptyLoadingCaptionSummaryExample } from '../../../examples/treetable/empty-loading-caption-summary';
import { TreeTableLazyChildrenExample } from '../../../examples/treetable/lazy-children';
import { TreeTablePagingExample } from '../../../examples/treetable/paging';
import { TreeTableRowSelectionExample } from '../../../examples/treetable/row-selection';
import { TreeTableSortingExample } from '../../../examples/treetable/sorting';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';
const droppedIcon = 'Icon slots are not exposed (02 Q6).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'treetable',
  title: 'Tree table',
  optimusSelector: 'p-treeTable',
  purpose:
    "A table whose rows form a tree: declare its columns, give it nodes, and it renders, expands, sorts, pages and selects them. Declare the columns as `wj-treetable-column` children, and give `wj-treetable` its `value`: nodes of `WjTreeNode` (imported `from 'weeljack-ng'`) with each row's cells in `data`. A column's `field` is a property of that `data`, and dotted paths work. Give every node a `key`, so a row keeps its expansion and its keyboard focus when you set a new `value`, and give every row distinct `data`: a row is selected when its `data` equals a selected node's. `selection` and `expandedKeys` are two-way models that always hold your own nodes and keys, in new arrays and maps; your tree is never written, because Optimus renders and sorts copies of it. `selectionMode` takes `single`, `multiple` or `checkbox` (`WjTreeSelectionMode`), and `sortOrder` is a `WjSortOrder`; both come `from 'weeljack-ng'`, as does `WjPageEvent`. A `wjTreeTableCell` or `wjTreeTableHeaderCell` template inside a column customises what a cell shows. The table has no visible title of its own: name it with `ariaLabel`, or point `ariaLabelledBy` at a visible heading.",
  examples: [
    {
      title: 'Basic',
      description:
        'A file table with Name, Size and Type columns, named “Files”. `[(expandedKeys)]` is a map of node `key` to open or closed: Documents starts open, and every toggle, by pointer or by ArrowRight and ArrowLeft, writes a new map. The first column holds the toggle, indented by level, then the cell. Cells wrap, and are never cut; a table wider than its host scrolls inside itself, never the page.',
      sourceKey: 'treetable/basic',
      component: TreeTableBasicExample,
    },
    {
      title: 'Custom cells',
      description:
        'A `wjTreeTableCell` template inside a column renders that column’s cells, with your own node as `let-node` and the resolved field as `let-value="value"`: `[wjTreeTableCellOf]` types them from your nodes. Here Size uses `DecimalPipe` and tabular figures. A `wjTreeTableHeaderCell` template renders the header text, with the sort icon outside it: here a muted “KB”. Muted text is for a table whose rows take no hover or picked fill, so this example has no sorting and no `rowHover`: on those fills it falls under 4.5:1.',
      sourceKey: 'treetable/custom-cells',
      component: TreeTableCustomCellsExample,
    },
    {
      title: 'Sorting',
      description:
        'Mark a column `sortable`, and a click or Enter on its header sorts the table by its `field`, ascending first. `[(sortField)]` and `[(sortOrder)]` are two-way, so they start the sort and follow a click; `aria-sort` and the icon show it. Optimus sorts at every level, so children stay under their parent. The sorted header takes the highlight fill. Space on a header does nothing: Optimus listens to Enter only.',
      sourceKey: 'treetable/sorting',
      component: TreeTableSortingExample,
    },
    {
      title: 'Paging',
      description:
        '23 generated folders, two files each, five root nodes to a page, with `rowsPerPageOptions` of 5, 10 and 20. The pager pages the root nodes, and a node’s descendants stay on its page. `first` and `rows` are two-way models, and `pageChange` reports the new page as a `WjPageEvent`. For a richer pager, put a `wj-paginator` beside the table, as the paginator page shows.',
      sourceKey: 'treetable/paging',
      component: TreeTablePagingExample,
    },
    {
      title: 'Row selection',
      description:
        'Two tables, 24px apart, each with a state line. In `single` mode a click, Enter or Space picks a row and another click drops it; in `multiple` mode each row toggles on its own. `selection` is always an array of your own nodes, with at most one in `single` mode. The picked row takes the highlight fill, and its focus ring turns the highlight colour so it stays visible. A row is picked by its `data`, so give each row distinct `data`.',
      sourceKey: 'treetable/row-selection',
      component: TreeTableRowSelectionExample,
    },
    {
      title: 'Checkbox selection',
      description:
        'Checking a folder checks everything in it, and checking part of one marks it partly checked, with Optimus’s minus. `selection` lists every checked node, parents included, once per click. The header checkbox checks every row. Space on a focused row checks it, since the row checkboxes are not Tab stops. A checked row takes no fill, because the checkbox carries the state. A selection set from code checks the rows but draws no partial mark, so nothing is checked at rest here.',
      sourceKey: 'treetable/checkbox-selection',
      component: TreeTableCheckboxSelectionExample,
    },
    {
      title: 'Lazy children',
      description:
        'Three folders marked `leaf: false` show a toggle with no children, and open from the keyboard too. On `nodeExpand` the example sets the table-wide `loading`, waits about 400 ms for a simulated server, and sets a new `value` in which that folder has its files. The folder stays open and focused, because its node has a `key`: the wrapper wrote `expandedKeys`, and Optimus tracks the row by key. There is no per-row spinner in this version.',
      sourceKey: 'treetable/lazy-children',
      component: TreeTableLazyChildrenExample,
    },
    {
      title: 'Empty, loading, caption and summary',
      description:
        'Three tables, 24px apart. With no nodes the table shows the translation’s `emptyMessage` in a full-width muted row, or a `wjTreeTableEmpty` template instead: here “No files yet.”. `loading` covers the rows with Optimus’s mask and spinner and sets `aria-busy` on the table; a first load with no rows shows a blank row instead of the empty text. `wjTreeTableCaption` and `wjTreeTableSummary` render bands above and below. The caption does not name the table: its title gets an `id` and `ariaLabelledBy` points at it.',
      sourceKey: 'treetable/empty-loading-caption-summary',
      component: TreeTableEmptyLoadingCaptionSummaryExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTreeTableHarness` and `WjTreeTableRowHarness` from `weeljack-ng/treetable/testing` to drive a table without touching its DOM. `WjTreeTableHarness.with({ name })` finds a table by its name; `getHeaderTexts()`, `getRows({ text, level })`, `getCellTexts()`, `sortBy(header)`, `getSortOrder(header)`, `getCurrentPage()`, `goToNextPage()`, `goToPreviousPage()`, `goToPage(page)`, `toggleAllRows()`, `getSelectedRowIndexes()`, `isEmpty()`, `getEmptyText()`, `isLoading()`, `getCaptionText()` and `getSummaryText()` describe and drive it. A row harness reads `getCellTexts()`, `getLevel()`, `isExpandable()`, `isExpanded()`, `isSelected()`, `isChecked()` and `isPartiallyChecked()`, and acts with `toggle()`, `select()` and `check()`.',
      sourceKey: 'treetable/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Reaches each sortable header, then the rows, then the page buttons; with `selectionMode="checkbox"` the header checkbox comes first. The row toggles and the row checkboxes are not Tab stops. Until the first Tab inside the table every row is a Tab stop (Optimus sets `tabindex="0"` on all of them); after it only one is.',
    },
    {
      key: 'Enter',
      effect:
        'On a sortable header, sorts by that column and flips the order on the next press. On a row in `single` or `multiple` mode, selects it or drops it.',
    },
    { key: 'ArrowDown, ArrowUp', effect: 'Moves to the next or the previous visible row.' },
    {
      key: 'ArrowRight',
      effect:
        'Expands a collapsed row, and fires `nodeExpand`; focus moves to its first child a moment later. A row marked `leaf: false` opens too. On an open row it does nothing.',
    },
    {
      key: 'ArrowLeft',
      effect: 'Collapses an expanded row, and fires `nodeCollapse`.',
    },
    {
      key: 'Home, End',
      effect:
        'Moves to the first or the last row of the same level, counted over the whole table: End on a child of the first folder goes to the last child of the last open folder.',
    },
    {
      key: 'Space',
      effect:
        'On a row in `single` or `multiple` mode, selects it or drops it. In `checkbox` mode, checks or unchecks the focused row with its descendants. Does nothing on a row that is `selectable: false`. On a header it does nothing.',
    },
    {
      key: 'Enter, Space on a page button',
      effect:
        'Moves to that page. The rows-per-page select follows `wj-paginator`: ArrowDown, Enter or Space opens it, the arrows move, Enter picks and Escape closes it.',
    },
  ],
  aria: [
    'The table is `role="treegrid"`, and each row carries its level (`aria-level`) and, when it can open, `aria-expanded`. Name the table: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading, and `ariaDescribedBy` at a description. All three land on the `table` element, not on the `wj-treetable` host; `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML. While `loading`, `aria-busy="true"` is on the table.',
    'Fixed in the component, because Optimus 2.0.2 gets them wrong: a closed row that has children says `aria-expanded="false"` (Optimus leaves the attribute off until its first toggle, so a closed parent would not say it can open); the row toggle is hidden from assistive tech at every level, since the row already says what it does; and in `checkbox` mode every row checkbox is named, and out of the Tab order (Optimus puts `tabindex="-1"` on the checkbox’s host, so its input stayed a Tab stop), with Space on the row checking it instead. The header checkbox is named as well.',
    'Optimus’s own rows get no `pt` from the table, so `wj-treetable` hands its `pt` to every row, toggle, checkbox, header and sort icon itself. That is why `row`, `rowToggleButton`, `sortableColumn` and the checkboxes’ parts reach the rows of every level, unlike the nodes of `wj-tree`.',
    'Gap: the English names Optimus gives the checkboxes, “Row Selected” and “All items selected”, read as status rather than as names. Set `translation: { aria: { selectRow, selectAll } }` in `provideWeeljack`; no label is added here.',
    'Gap: every row is a Tab stop until the first Tab inside the table, as the keyboard table says.',
    'Gap: Space on a sortable header does nothing; use Enter.',
    'Gap: a row is selected when its `data` deep-equals a selected node’s `data`, which is how Optimus compares rows, so two rows with equal `data` select together, and a node with no `data` matches every other one. Give each row distinct `data`.',
    'Gap: a row marked `selectable: false` cannot be picked or checked directly, but checking all its children checks it, and checking a parent checks it, since Optimus propagates a check without asking.',
    'Gap: a selection set from code checks and selects the rows, but a parent’s partial mark is drawn only while Optimus propagates a click, so it is not redrawn for a selection you set. A new `value` keeps the marks it already drew.',
    'Gap: Optimus counts the root nodes of `value` itself, so `totalRecords` has no effect while the table is not lazy; it is accepted for the day lazy paging returns.',
    'Motion gap, fixed: under reduced motion the rows-per-page list opens and closes without animating. Gap: “First Page” stays a Tab stop on page 1, as on `wj-table`.',
    'Gap: the English `emptyMessage` reads “No available options”. Set `translation: { emptyMessage }` in `provideWeeljack`, or give a `wjTreeTableEmpty` template.',
    'The table scrolls sideways inside its host when its columns do not fit, and the page never does. The wrapper adds no Tab stop, since the rows are focusable. Expanding, collapsing, sorting and paging are instant, and the table adds no animation; the loading spinner stops under reduced motion.',
    'Give every node a `key`, unique in the tree: a node without one toggles on screen only, and loses its state on a new `value`. The caption does not name the table; point `ariaLabelledBy` at its title.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host is a block with no box of its own, and Optimus’s table, its rows, toggles and checkboxes come from the preset and the `--wj-*` variables that `provideWeeljack` emits. A picked row and a sorted header take the highlight fill, a checked row takes none, and the focus ring on the highlight fill turns the highlight colour so it stays visible. For anything else, `pt` reaches the parts of the Optimus tree table underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-treetable`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. The attributes set by the component on `table`, `rowToggleButton` and the two checkboxes win over a `pt` value of the same name.',
  parts: [
    { part: 'host', description: 'The Optimus `p-treeTable` element.' },
    { part: 'root', description: 'The table’s root element.' },
    { part: 'loading', description: 'The root while the table is loading.' },
    { part: 'mask', description: 'The loading mask over the table.' },
    { part: 'loadingIcon', description: 'The spinner in the loading mask.' },
    { part: 'header', description: 'The caption band above the table.' },
    { part: 'pcPaginator', description: 'The pager, and its parts.' },
    { part: 'wrapper', description: 'The element that scrolls the table sideways.' },
    {
      part: 'table',
      description: 'The `role="treegrid"` table. Takes the routed `aria-*` attributes.',
    },
    { part: 'thead', description: 'The header group.' },
    { part: 'tbody', description: 'The body group.' },
    { part: 'tfoot', description: 'The footer group.' },
    { part: 'footer', description: 'The summary band below the table.' },
    { part: 'sortableColumn', description: 'A sortable header cell.' },
    { part: 'sortableColumnIcon', description: 'The sort icon in a header.' },
    { part: 'row', description: 'One row, at any level.' },
    {
      part: 'rowToggleButton',
      description: 'The row toggle, hidden from assistive tech. Takes the routed `aria-hidden`.',
    },
    {
      part: 'pcRowCheckbox',
      description:
        'The checkbox of a row, in `checkbox` mode. Its `input` takes the routed name and `tabindex`.',
    },
    {
      part: 'pcHeaderCheckbox',
      description: 'The header checkbox. Its `input` takes the routed name.',
    },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'A `WjTreeNode<T>[]` (from `weeljack-ng`); `T` is inferred. Optimus gets copies, which it sorts in place, so your nodes are never written.',
    },
    {
      optimus: 'columns, frozenColumns',
      weeljack: 'wj-treetable-column children',
      status: 'renamed',
      note: 'The column model: `field`, `header` and `sortable` on each column.',
    },
    {
      optimus: 'header, body templates and the row and cell directives',
      weeljack: 'Written by the wrapper',
      status: 'renamed',
      note: 'The table writes every row and cell itself. There is no raw-row slot.',
    },
    {
      optimus: 'None',
      weeljack: 'wjTreeTableCell, wjTreeTableHeaderCell',
      status: 'added',
      note: 'Typed slots inside a column. Type `let-node` with `[wjTreeTableCellOf]`.',
    },
    {
      optimus: 'sortField, sortOrder',
      weeljack: 'sortField, sortOrder',
      status: 'kept',
      note: 'Two-way `model()`s; `sortOrder` is a `WjSortOrder`, `1` or `-1`.',
    },
    {
      optimus: 'onSort',
      weeljack: 'sortFieldChange, sortOrderChange',
      status: 'renamed',
      note: 'Folded into the models.',
    },
    dropped(
      'sortMode, multiSortMeta, defaultSortOrder, customSort, sortFunction, resetPageOnSort',
      'Single-column sort only, by need.',
    ),
    {
      optimus: 'paginator, totalRecords, paginatorPosition',
      weeljack: 'paginator, totalRecords, paginatorPosition',
      status: 'kept',
      note: 'Optimus counts the root nodes of `value` itself, so `totalRecords` has no effect while the table is not lazy.',
    },
    {
      optimus: 'rowsPerPageOptions',
      weeljack: 'rowsPerPageOptions',
      status: 'kept',
      note: 'Narrowed to `number[]`.',
    },
    {
      optimus: 'first, rows',
      weeljack: 'first, rows',
      status: 'kept',
      note: 'Two-way `model()`s. `rows` is 10 while the table pages and none is given.',
    },
    {
      optimus: 'onPage',
      weeljack: 'pageChange',
      status: 'renamed',
      note: 'Carries a `WjPageEvent` from `weeljack-ng`.',
    },
    dropped(
      'pageLinks, alwaysShowPaginator, showCurrentPageReport, currentPageReportTemplate, showJumpToPageDropdown, showFirstLastIcon, showPageLinks, paginatorDropdownAppendTo, paginatorLocale, paginator templates',
      'Put a `wj-paginator` beside the table, as the paginator page shows.',
    ),
    {
      optimus: 'selectionMode',
      weeljack: 'selectionMode',
      status: 'kept',
      note: '`single`, `multiple` or `checkbox` (`WjTreeSelectionMode`). Unset: no selection.',
    },
    {
      optimus: 'selection, selectionChange',
      weeljack: 'selection',
      status: 'renamed',
      note: 'A `model<WjTreeNode<T>[]>`: always an array of your own nodes, at most one in `single` mode.',
    },
    dropped(
      'selectionKeys, selectionKeysChange',
      'Optimus writes the map in place; `selection` covers it.',
    ),
    dropped(
      'onNodeSelect, onNodeUnselect, onHeaderCheckboxToggle, metaKeySelection, compareSelectionBy, dataKey',
      'The `selection` model covers them; a row matches its selection through its `data`.',
    ),
    {
      optimus: 'None',
      weeljack: 'expandedKeys',
      status: 'added',
      note: 'A `model<Record<string, boolean>>`: which rows are open, by `key`. A new map on every toggle.',
    },
    {
      optimus: 'onNodeExpand, onNodeCollapse',
      weeljack: 'nodeExpand, nodeCollapse',
      status: 'renamed',
      note: 'Outputs that carry your own node, from the pointer and from the keyboard.',
    },
    {
      optimus: 'emptymessage, caption, summary templates',
      weeljack: 'wjTreeTableEmpty, wjTreeTableCaption, wjTreeTableSummary',
      status: 'renamed',
      note: 'Typed slots with no context.',
    },
    {
      optimus: 'loading',
      weeljack: 'loading',
      status: 'kept',
      note: 'Optimus’s mask, plus `aria-busy="true"` on the table.',
    },
    dropped(
      'loadingIcon, showLoader, loader and loadingicon templates',
      'Mask only; ' + droppedIcon,
    ),
    {
      optimus: 'showGridlines, rowHover',
      weeljack: 'showGridlines, rowHover',
      status: 'kept',
      note: '',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'On the `treegrid` table, through `pt`.',
    },
    dropped(
      'filters, globalFilterFields, filterDelay, filterMode, filterLocale, onFilter, filter(), filterGlobal()',
      'Deferred: filtering returns as an additive minor.',
    ),
    dropped(
      'lazy, lazyLoadOnInit, onLazyLoad',
      'Deferred: server-side paging and sorting. Lazy children work without it, through `leaf: false` and `nodeExpand`.',
    ),
    dropped(
      'scrollable, scrollHeight, frozenWidth, frozenColumns, virtualScroll, virtualScrollItemSize, virtualScrollOptions, virtualScrollDelay, virtualRowHeight, scrollTo(), scrollToVirtualIndex(), resetScrollTop()',
      'By need. The table scrolls sideways inside its host instead. `virtualRowHeight` is deprecated.',
    ),
    dropped(
      'resizableColumns, columnResizeMode, onColResize, reorderableColumns, onColReorder',
      'Deferred: drag alone fails WCAG 2.5.7, and a single-pointer alternative comes with it.',
    ),
    dropped(
      'contextMenu, contextMenuSelection, contextMenuSelectionMode, onContextMenuSelect, ttContextMenuRow, ttSelectableRowDblClick',
      'Waits for `wj-contextmenu`; double click is pointer only.',
    ),
    dropped(
      'ttEditableColumn, p-treeTableCellEditor, onEditInit, onEditComplete, onEditCancel',
      'Deferred: cell editing returns as an additive minor.',
    ),
    dropped('reset()', 'Set `sortField` and `first` instead.'),
    dropped(
      'rowTrackBy',
      'Set inside the wrapper, by `key`, so a new `value` keeps the rendered rows.',
    ),
    dropped('autoLayout, colgroup, footer and every frozen* template', 'By need.'),
    dropped(
      'togglericon, checkboxicon, headercheckboxicon, sorticon, reorder-indicator templates',
      droppedIcon,
    ),
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjTreeTablePt`.' },
    dropped(
      'styleClass, tableStyle, tableStyleClass, paginatorStyleClass, dt, unstyled, ptOptions, p-treetable, p-tree-table',
      droppedAlways + ' The extra selectors are duplicates.',
    ),
  ],
};
