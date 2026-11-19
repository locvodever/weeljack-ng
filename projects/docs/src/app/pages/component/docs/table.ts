import { TableBasicExample } from '../../../examples/table/basic';
import { TableCaptionAndSummaryExample } from '../../../examples/table/caption-and-summary';
import { TableCustomCellsExample } from '../../../examples/table/custom-cells';
import { TableEmptyAndLoadingExample } from '../../../examples/table/empty-and-loading';
import { TableFiltersExample } from '../../../examples/table/filters';
import { TableFrozenColumnsExample } from '../../../examples/table/frozen-columns';
import { TableGroupingExample } from '../../../examples/table/grouping';
import { TableLazyLoadingExample } from '../../../examples/table/lazy-loading';
import { TablePagingExample } from '../../../examples/table/paging';
import { TableRowEditingExample } from '../../../examples/table/row-editing';
import { TableRowExpansionExample } from '../../../examples/table/row-expansion';
import { TableSelectionExample } from '../../../examples/table/selection';
import { TableSortingExample } from '../../../examples/table/sorting';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';
const droppedIcon = 'Icon slots are not exposed (02 Q6).';
const useAPaginator =
  'Use a `wj-paginator` beside the table: turn the table’s `paginator` off, give the table the current page from a `computed` slice, and bind `[(first)]` and `[(rows)]` on the `wj-paginator` only. Sorting then covers the shown page only. See the paginator page’s “Beside a table” example.';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'table',
  title: 'Table',
  purpose:
    'A data table: give it rows, declare its columns, and it renders, sorts and pages them. `wj-table` takes `value` and reads its `wj-column` children; it writes every header, row and cell itself, so there is no raw-row template. A `wjTableCell` or `wjTableHeaderCell` template inside a column customises what that column shows. Selection, row expansion, row editing, grouping, frozen columns, column filters and lazy loading are inputs and slots of the same table. Your arrays and maps are never changed: the table works on copies. The table has no visible title of its own, so give it a name with `ariaLabel`, or point `ariaLabelledBy` at a heading.',
  examples: [
    {
      title: 'Basic',
      description:
        'Bind `value` and declare a `wj-column` per column: `field` is the row property (dotted paths such as `customer.name` work) and `header` is the header text. A cell shows the field value as text; a missing value is an empty cell. Columns appear in the order declared, and a column inside an `@if` comes and goes with it. This table is named by `ariaLabel`.',
      sourceKey: 'table/basic',
      component: TableBasicExample,
    },
    {
      title: 'Custom cells',
      description:
        'Put an `ng-template` marked `wjTableCell` inside a column to render its cells yourself, and `wjTableHeaderCell` to render its header (import `WjTableCellSlot` and `WjTableHeaderCellSlot`: an un-imported slot silently drops its template). The cell template sees `let-row` (the row), `let-value="value"`, `let-field="field"` and `let-i="rowIndex"`. Bind `[wjTableCellOf]` to your rows and `let-order` gets your row type, so `order.total` type-checks; without it the row is `unknown`. Status is a `wj-tag`, Total is a currency with tabular figures, and its header adds a muted "USD" after the title. The sort icon of a sortable column stays outside the header slot. A slot renders inside the cell the table writes, never as a row.',
      sourceKey: 'table/custom-cells',
      component: TableCustomCellsExample,
    },
    {
      title: 'Sorting',
      description:
        "Mark a column `sortable` (it needs a `field`) to sort by it: a click, Enter or Space on the header toggles ascending and descending, and the header carries `aria-sort`. `sortField` and `sortOrder` are two-way, so the app can start the table sorted and read the choice back; `sortOrder` is `1` or `-1` (`WjSortOrder`, imported `from 'weeljack-ng'`). This table starts on Date, newest first. The table sorts a copy of `value`, so the array you bound keeps its order.",
      sourceKey: 'table/sorting',
      component: TableSortingExample,
    },
    {
      title: 'Paging',
      description:
        "Turn `paginator` on to show a pager under the rows: `rows` is the page size (10 when you give none), `first` is the index of the first row of the page, and both are two-way. `rowsPerPageOptions` adds a select for the page size, `paginatorPosition` moves the pager to `top` or `both` (`WjPaginatorPosition`, imported `from 'weeljack-ng'`), and `totalRecords` sets the row count when it is not the length of `value`. `pageChange` emits a `WjPageEvent` (`{ first, rows }`, imported `from 'weeljack-ng'`) after `first` and `rows` have been written. This table has 23 rows, five to a page. For a page report or page links, turn `paginator` off and put a `wj-paginator` beside the table: the table does not slice its rows when its own pager is off, so give it the current page from a `computed` slice of `first` and `rows`, bound on the `wj-paginator` only (sorting then covers the shown page only). The paginator page’s “Beside a table” example shows it.",
      sourceKey: 'table/paging',
      component: TablePagingExample,
    },
    {
      title: 'Single and multiple selection',
      description:
        'Set `selectionMode` to `single` or `multiple`, give the rows a `dataKey`, and bind `[(selection)]`: it is always an array of your rows, and holds at most one in single mode. A click, or Space or Enter on a focused row, selects it, and a second click clears it. Multiple mode also writes a checkbox column with a select-all checkbox in the header, and Ctrl or ⌘ with A selects every row. The checkboxes are named from the translation. Rows compare by `dataKey`, so a selected row that comes back as a new object stays selected. The array you bind is never written into: each change comes back as a new array.',
      sourceKey: 'table/selection',
      component: TableSelectionExample,
    },
    {
      title: 'Row expansion',
      description:
        'Put an `ng-template` marked `wjTableRowExpansion` inside the table, with `[wjTableRowExpansionOf]` to type its row, and the table writes a toggle column and, under an expanded row, a full-width row holding that template. Rows need a `dataKey`, or `WJ0050` is logged in development. `[(expandedRowKeys)]` is a map of `dataKey` values to `true`, written back as a new object; `rowExpandMode` `single` keeps one row open, and `rowExpand` and `rowCollapse` emit `{ row }`. The toggle is a 28 px button named from `aria.expandRow`, with its state in `aria-expanded`. Row expansion and `groupRowsBy` do not combine (see Accessibility).',
      sourceKey: 'table/row-expansion',
      component: TableRowExpansionExample,
    },
    {
      title: 'Row editing',
      description:
        'Put an `ng-template` marked `wjTableCellEditor` inside a column, with `[wjTableCellEditorOf]` to type its row. Any editor makes the table write a trailing column: Edit puts the row in edit mode and moves focus to its first editor, and Cancel and Save, in that order, put it back and return focus to Edit. While a row is edited, its editor cells show the editor. The editors write into the row object as you type, so `rowEditCancel` is where you restore your own copy of the row: this example keeps one when `rowEditInit` fires and puts it back on cancel. Save is refused while an editor of the row is invalid (here, an empty customer). `rowEditInit`, `rowEditSave` and `rowEditCancel` emit `{ row, index }`, and `[(editingRowKeys)]` follows the rows in edit mode. Rows need a `dataKey`, as for expansion.',
      sourceKey: 'table/row-editing',
      component: TableRowEditingExample,
    },
    {
      title: 'Grouping',
      description:
        'Set `groupRowsBy` to a field and the table sorts by it, then opens each group with a header row spanning every column that shows the group value as text. An `ng-template` marked `wjTableGroupHeader` replaces that text: it sees the first row, `let-group="group"` and `let-i="rowIndex"`. Sorting by another column keeps the groups. A `lazy` table is not sorted by the table: sort by the field on your server.',
      sourceKey: 'table/grouping',
      component: TableGroupingExample,
    },
    {
      title: 'Frozen columns',
      description:
        "Mark a column `frozen` (and `alignFrozen` `right` for the other side; `WjFrozenAlign`, imported `from 'weeljack-ng'`) and it stays in view while the table scrolls sideways. A frozen column turns `scrollable` on, and `scrollHeight` is the height at which the rows start to scroll. A frozen data column also freezes the checkbox and toggle columns on its left, or the actions column on its right, so row controls never scroll away. The scrolling container is a named region and a tab stop, so the keyboard can scroll it. This table is 20rem tall and wider than its panel, so it scrolls both ways.",
      sourceKey: 'table/frozen-columns',
      component: TableFrozenColumnsExample,
    },
    {
      title: 'Filters',
      description:
        "Give a column a `filterType` (`text`, `numeric`, `date` or `boolean`; `WjColumnFilterType`, imported `from 'weeljack-ng'`) and it gets a filter. `filterDisplay` puts the filters in a row under the headers (the default: type, then press Enter) or in a menu per column (a button in the header, which opens a menu with Clear and Apply). The menu holds one rule per column. `[(filters)]` is the active filters by column field, `WjFilters` from `weeljack-ng`: a rule is `{ value, matchMode }` (`WjFilterMatchMode`), and a menu's is a list of rules. The table writes a new object on every change and applies one you set from code; the object you bound is never written into. `filterGlobal(value, matchMode)` searches the fields in `globalFilterFields`, here from a search box in the caption, and `clear()` resets the sort, the filters and the page. The filter menu is an overlay and takes the table's motion setting.",
      sourceKey: 'table/filters',
      component: TableFiltersExample,
    },
    {
      title: 'Lazy loading',
      description:
        "Set `lazy` when your server sorts, filters and pages the rows. The table then asks for a page instead of building it: `lazyLoad` emits a `WjLazyLoadEvent` (`{ first, rows, sortField, sortOrder, filters, globalFilter }`, imported `from 'weeljack-ng'`) when it starts and on every page, sort and filter, once each. You set `value` to that page, `totalRecords` to the number of rows in all pages, and `loading` while you wait: Optimus's mask shows over the rows and the table carries `aria-busy`. This example has 120 simulated orders behind a 400 ms delay.",
      sourceKey: 'table/lazy-loading',
      component: TableLazyLoadingExample,
    },
    {
      title: 'Empty and loading',
      description:
        'A table with no rows always writes an empty row, a full-width cell that shows the translation\'s `emptyMessage`; `wjTableEmpty` replaces it with your own content. While `loading`, `wjTableLoading` replaces the rows with a full-width cell, and the mask is not shown: the second table holds three `wj-skeleton` lines. An empty table that is loading keeps its empty row, blank, so nothing says "empty" before the rows arrive. Neither slot has a context.',
      sourceKey: 'table/empty-and-loading',
      component: TableEmptyAndLoadingExample,
    },
    {
      title: 'Caption and summary',
      description:
        '`wjTableCaption` and `wjTableSummary` render a band above and below the table. The caption is outside the `table` element, so it does not name it: give its title an `id` and point `ariaLabelledBy` at it, as here. Neither slot has a context.',
      sourceKey: 'table/caption-and-summary',
      component: TableCaptionAndSummaryExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTableHarness` from `weeljack-ng/table/testing`. `getHeaderTexts()`, `getRows()` and `getCellTexts()` read the table as a user meets it, `sortBy(header)` and `getSortOrder(header)` drive and read a column, and `getCurrentPage()`, `goToNextPage()`, `goToPreviousPage()` and `goToPage(page)` drive the pager. `selectRow(index)`, `getSelectedRowIndexes()` and `toggleAllRows()` drive selection; `toggleRowExpansion(index)`, `isRowExpanded(index)` and `getExpansionText(index)` row expansion; `editRow(index)`, `saveRowEdit(index)` and `cancelRowEdit(index)` row editing; and `filterColumn(header, text)` types a filter and applies it, in a row or a menu. `getGroupHeaderTexts()`, `isEmpty()`, `getEmptyText()`, `isLoading()`, `getCaptionText()` and `getSummaryText()` read the states. `getHeaderTexts()` and `getCellTexts()` list data columns only, never the checkbox, toggle or actions columns. `WjTableHarness.with({ caption })` finds a table by its name: its `ariaLabel`, or the text its `ariaLabelledBy` points at. Rows and cells have their own harnesses: `WjTableRowHarness` adds `isSelected()` and `isExpanded()`, and `WjTableCellHarness` reads one data cell. Nothing here names an Optimus class.',
      sourceKey: 'table/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to each sortable header, then to the pager’s buttons and the rows-per-page select, in reading order. A header that is not sortable is not a tab stop.',
    },
    {
      key: 'Enter, Space on a sortable header',
      effect: 'Sorts by that column, and toggles ascending and descending on the next press.',
    },
    {
      key: 'Enter, Space on a page button',
      effect: 'Moves to that page.',
    },
    {
      key: 'ArrowUp, ArrowDown, Home, End on a selectable row',
      effect: 'Moves focus to the previous or next row, or to the first or last row.',
    },
    {
      key: 'Space, Enter on a selectable row',
      effect: 'Selects the focused row, or clears it if it is selected.',
    },
    {
      key: 'Ctrl+A, ⌘+A in a table with multiple selection',
      effect: 'Selects every row.',
    },
    {
      key: 'Space on a row checkbox or the select-all checkbox',
      effect: 'Selects or clears that row, or every row.',
    },
    {
      key: 'Enter, Space on the expansion toggle',
      effect: 'Expands the row, or collapses it.',
    },
    {
      key: 'Enter, Space on Edit, Save and Cancel',
      effect:
        'Edit puts the row in edit mode and moves focus to its first editor. Save and Cancel leave it and move focus back to Edit.',
    },
    {
      key: 'Enter in a row filter',
      effect: 'Applies the filter.',
    },
    {
      key: 'Enter on a filter button',
      effect: 'Opens the filter menu, with focus on its first control.',
    },
    {
      key: 'Space on a filter button of a column that is not sortable',
      effect: 'Opens the filter menu.',
    },
    {
      key: 'Escape in the open filter menu',
      effect: 'Closes the menu and puts focus back on the filter button. Apply does the same.',
    },
    {
      key: 'Enter, Space or ArrowDown on the rows-per-page select',
      effect: 'Opens its list.',
    },
    {
      key: 'ArrowUp, ArrowDown, Enter, Escape in the open list',
      effect:
        'The arrows move between the page sizes, Enter picks one and Escape closes the list with focus back on the select.',
    },
  ],
  aria: [
    'The table has no visible title of its own, so it needs a name: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading; `ariaDescribedBy` points at a description. All three land on the `table` element, not on the `wj-table` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. They render as attribute text, never as HTML.',
    'The sorted column’s header carries `aria-sort="ascending"` or `"descending"`, and a sortable header is a tab stop. A header that is not sortable has neither. Headers, cell values and slot content render as text through interpolation, never as HTML.',
    'The pager’s buttons and the rows-per-page select are named from the translation (`aria.firstPageLabel`, `prevPageLabel`, `nextPageLabel`, `lastPageLabel`, `pageLabel` and `rowsPerPageLabel`): English by default, and the `vi` translation from `weeljack-ng/locale` fills them in Vietnamese. The current page link carries `aria-current="page"`.',
    'Optimus gap: with `paginator` on, Optimus 2.0.2 leaves its "First Page" button in the Tab order on the first page, where it is dimmed and does nothing. Tab past it.',
    'Optimus gap: a table wider than its container scrolls sideways inside the host and never scrolls the page, but it has no focusable cell inside that container, so not every browser lets the keyboard scroll it. Set `scrollable` (a frozen column sets it for you): the scrolling container becomes a region named like the table, and a tab stop.',
    'Selection: in multiple mode each row has a checkbox, and the header has a select-all checkbox; all are named from the translation (`aria.selectRow`, `unselectRow`, `selectAll` and `unselectAll`), by the rule Optimus uses: the "selected" wording while checked. Optimus gap: in single mode a selected row is shown by its fill only, and nothing tells a screen reader which row is selected, so use multiple mode where that matters.',
    'Optimus gap: in single or multiple mode every row is a tab stop until one is clicked or selected by key, then only that row is. A selection you set from code, with no click, leaves no row a tab stop, and the keyboard reaches the rows only through their checkboxes, toggles and buttons.',
    'Row expansion and editing: the toggle, Edit, Save and Cancel are 28 px buttons with no visible text, named from the translation (`aria.expandRow`, `editRow`, `saveEdit` and `cancelEdit`). The toggle’s name does not change: its state is `aria-expanded`. Edit moves focus to the first editor of the row (else to Save), and Save and Cancel move it back to Edit. An editor needs its own name, such as an `aria-label` of its column, because it has no header of its own.',
    'Translation gap: Optimus’s English defaults are status wording, not names: `aria.expandRow` is "Row Expanded", `selectRow` is "Row Selected" and `emptyMessage` is "No available options", which is list wording. An app fixes them with the `translation` option of `provideWeeljack`, or, for the empty row, with `wjTableEmpty`.',
    'Optimus gap: `groupRowsBy` and row expansion do not combine. Optimus expands a grouped table by group, and writes each group header after the first row of its group.',
    'Loading: `loading` sets `aria-busy="true"` on the table. With `wjTableLoading` the rows give way to that slot; without it the rows stay under Optimus’s mask, and a table with no rows keeps its empty row, blank, so no text says "empty" before the rows arrive.',
    'Filters: every filter is named by its column header (the `header` text, so give a filtered column one). The menu opens with focus on its first control, Escape or Apply closes it and focus returns to the filter button, and the menu is an overlay, so it is in the screen-reader pass. Optimus gaps: Optimus puts `aria-expanded` and `aria-haspopup` on the `p-button` element and not on the `button`, and it applies a row filter only on Enter, with no live feedback. Space on the filter button of a sortable column does nothing, because the sortable header handles that key first: use Enter.',
    'Caption: the caption band is outside the `table` element, so it does not name the table. Give its title an `id` and point `ariaLabelledBy` at it.',
    'Motion: the filter menu opens and closes with Optimus’s overlay motion, passed `safe: true`, so it follows the reduced-motion preference. The rows-per-page list follows it too (see the motion line below).',
    'Motion gap, fixed: under reduced motion the rows-per-page list opens and closes without animating.',
    'Long headers and cell text wrap at spaces and never truncate; an unbroken value widens its column, and the table’s own container scrolls inside the host.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'Colours, radius, cell padding and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, and Optimus’s table fills its width. Cells are 12 px by 16 px (`small` 6 px by 8 px, `large` 16 px by 20 px) and each header is a row of its title and the sort icon, 8 px apart. The toggle and the row buttons are 28 px round buttons that use Optimus’s row-toggle look, and the empty row is muted. The widths of columns are your CSS. For anything else, `pt` reaches the parts of the Optimus table underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-table`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-label`, `aria-labelledby` and `aria-describedby` on the `table` part are set by the component from the matching inputs, and win over a `pt` value of the same name.',
  parts: [
    { part: 'host', description: 'The Optimus `p-table` element.' },
    { part: 'root', description: 'The root of the table, the element that carries its look.' },
    {
      part: 'header',
      description: 'The band above the table, which holds the `wjTableCaption` slot.',
    },
    {
      part: 'tableContainer',
      description:
        'The container around the table: it scrolls sideways. When the table scrolls it takes the routed role, tab stop and name.',
    },
    { part: 'table', description: 'The `table` element. Takes the routed ARIA attributes.' },
    { part: 'thead', description: 'The header row group.' },
    { part: 'tbody', description: 'The body row group.' },
    { part: 'tfoot', description: 'The footer row group, present only when the table has one.' },
    {
      part: 'footer',
      description: 'The band below the table, which holds the `wjTableSummary` slot.',
    },
    {
      part: 'mask',
      description:
        'The overlay shown over the table while it is loading, unless `wjTableLoading` is used.',
    },
    { part: 'loadingIcon', description: 'The spinner in the loading overlay.' },
    {
      part: 'pcPaginator',
      description: 'The pager. Takes the pass-through of a paginator.',
    },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: '`WjTable<T>` infers `T` from it. Never sorted in place: the table sorts a copy (FR-9).',
    },
    {
      optimus: 'columns, frozenColumns',
      weeljack: '<wj-column> children',
      status: 'renamed',
      note: 'The column model (02 Q7). `frozen` and `alignFrozen` are inputs of the column.',
    },
    {
      optimus: '#header and #body templates, the row and column directives',
      weeljack: 'written by the wrapper',
      status: 'renamed',
      note: 'The table writes every header, row and cell, so there is no raw-row slot (02 Q7).',
    },
    {
      optimus: 'None',
      weeljack: 'wjTableCell, wjTableHeaderCell',
      status: 'added',
      note: 'Typed slots on `wj-column` (02 Q6). `[wjTableCellOf]` types the row.',
    },
    {
      optimus: 'sortField, sortOrder',
      weeljack: 'sortField, sortOrder',
      status: 'kept',
      note: 'Now two-way `model()`s. `sortOrder` is `WjSortOrder` (`1 | -1`) from `weeljack-ng`.',
    },
    {
      optimus: 'onSort',
      weeljack: 'sortFieldChange, sortOrderChange',
      status: 'renamed',
      note: 'Folded into the two models.',
    },
    {
      optimus: 'paginator, totalRecords, paginatorPosition',
      weeljack: 'paginator, totalRecords, paginatorPosition',
      status: 'kept',
      note: '`paginatorPosition` is `WjPaginatorPosition` (`top`, `bottom` or `both`) from `weeljack-ng`.',
    },
    {
      optimus: 'rowsPerPageOptions',
      weeljack: 'rowsPerPageOptions',
      status: 'kept',
      note: 'Narrowed to `number[]`.',
    },
    {
      optimus: 'first, rows, firstChange, rowsChange',
      weeljack: 'first, rows',
      status: 'kept',
      note: 'Two-way `model()`s (02 Q2). `rows` is 10 while `paginator` is on and none is given.',
    },
    {
      optimus: 'onPage',
      weeljack: 'pageChange',
      status: 'renamed',
      note: 'Emits `WjPageEvent` (`{ first, rows }`) from `weeljack-ng`.',
    },
    {
      optimus: 'size, showGridlines, stripedRows, rowHover',
      weeljack: 'size, showGridlines, stripedRows, rowHover',
      status: 'kept',
      note: '`size` is `WjTableSize` (`small` or `large`).',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Set on the `table` element (02 Q8).',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjTablePt`. Tracks Optimus.',
    },
    {
      optimus: 'selectionMode, dataKey',
      weeljack: 'selectionMode, dataKey',
      status: 'kept',
      note: 'Row expansion and row editing need a `dataKey`, or `WJ0050` is logged in development.',
    },
    {
      optimus: 'selection, selectionChange',
      weeljack: 'selection',
      status: 'renamed',
      note: 'A two-way `model<T[]>()`, always an array: single mode holds at most one row.',
    },
    dropped(
      'onRowSelect, onRowUnselect, onHeaderCheckboxToggle, selectAll, selectAllChange, selectionPageOnly, rowSelectable, compareSelectionBy, metaKeySelection',
      'The `selection` model covers them. Rows compare by `dataKey`, and `metaKeySelection` stays off: a click toggles.',
    ),
    {
      optimus: 'expandedRowKeys, rowExpandMode',
      weeljack: 'expandedRowKeys, rowExpandMode',
      status: 'kept',
      note: '`expandedRowKeys` is now two-way, and written back as a new object.',
    },
    {
      optimus: 'expandedrow template',
      weeljack: 'wjTableRowExpansion',
      status: 'renamed',
      note: 'A typed slot (02 Q6). `[wjTableRowExpansionOf]` types the row.',
    },
    {
      optimus: 'onRowExpand, onRowCollapse',
      weeljack: 'rowExpand, rowCollapse',
      status: 'renamed',
      note: 'Emit `{ row }`.',
    },
    dropped('editMode', 'Row editing only. Cell editing waits for a need.'),
    {
      optimus: 'editingRowKeys',
      weeljack: 'editingRowKeys',
      status: 'kept',
      note: 'Two-way, written back as a new object.',
    },
    {
      optimus: 'p-cellEditor input and output templates',
      weeljack: 'wjTableCellEditor, wjTableCell',
      status: 'renamed',
      note: 'Typed slots on `wj-column`. `[wjTableCellEditorOf]` types the row.',
    },
    {
      optimus: 'onEditInit, onEditComplete, onEditCancel',
      weeljack: 'rowEditInit, rowEditSave, rowEditCancel',
      status: 'renamed',
      note: 'Emitted by the Edit, Save and Cancel buttons the table writes. Each carries `{ row, index }`.',
    },
    {
      optimus: 'rowGroupMode, groupRowsBy, groupheader template',
      weeljack: 'groupRowsBy, wjTableGroupHeader',
      status: 'renamed',
      note: 'Subheader mode only. The slot sees the first row, the group and the index.',
    },
    dropped('groupRowsByOrder', 'Order the group field with `sortOrder`.'),
    {
      optimus: 'scrollable, scrollHeight',
      weeljack: 'scrollable, scrollHeight',
      status: 'kept',
      note: 'A frozen column turns `scrollable` on.',
    },
    {
      optimus: 'pFrozenColumn frozen, alignFrozen',
      weeljack: 'wj-column frozen, alignFrozen',
      status: 'renamed',
      note: 'On the column (02 Q7). `alignFrozen` is `WjFrozenAlign` from `weeljack-ng`.',
    },
    {
      optimus: 'filters, globalFilterFields, filterGlobal(), clear()',
      weeljack: 'filters, globalFilterFields, filterGlobal(), clear()',
      status: 'kept',
      note: '`filters` is a two-way `model<WjFilters>()` of the active filters. `filterGlobal` takes a `WjFilterMatchMode`.',
    },
    {
      optimus: 'onFilter',
      weeljack: 'filtersChange',
      status: 'renamed',
      note: 'Folded into the `filters` model.',
    },
    {
      optimus: 'p-columnFilter type, display',
      weeljack: 'wj-column filterType, table filterDisplay',
      status: 'renamed',
      note: 'One display for the whole table. `filterType` is `WjColumnFilterType` from `weeljack-ng`.',
    },
    dropped(
      'filterDelay, filterLocale, and the other p-columnFilter inputs and templates',
      'By need. A menu holds one rule per column; custom filter templates are deferred.',
    ),
    {
      optimus: 'lazy, loading, totalRecords',
      weeljack: 'lazy, loading, totalRecords',
      status: 'kept',
      note: '`loading` also sets `aria-busy` on the table.',
    },
    {
      optimus: 'onLazyLoad',
      weeljack: 'lazyLoad',
      status: 'renamed',
      note: 'Emits `WjLazyLoadEvent` from `weeljack-ng`, once for each page, sort and filter.',
    },
    dropped(
      'lazyLoadOnInit, showLoader',
      'The table always asks on init, and the `wjTableLoading` slot decides the loader.',
    ),
    {
      optimus: 'emptymessage, caption, summary templates',
      weeljack: 'wjTableEmpty, wjTableCaption, wjTableSummary',
      status: 'renamed',
      note: 'Typed slots with no context (02 Q6). The empty row always shows, with the translation’s `emptyMessage` by default.',
    },
    {
      optimus: 'None',
      weeljack: 'wjTableLoading',
      status: 'added',
      note: 'Body content in place of the rows while `loading`.',
    },
    dropped('reset()', 'Use `clear()`, which does the same.'),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'styleClass, tableStyle, tableStyleClass, paginatorStyleClass',
      `${droppedAlways} Use the host’s \`class\` and \`style\`, and \`pt\`.`,
    ),
    dropped(
      'pageLinks, alwaysShowPaginator, showCurrentPageReport, currentPageReportTemplate, showJumpToPageDropdown, showJumpToPageInput, showFirstLastIcon, showPageLinks, paginatorDropdownAppendTo, paginatorDropdownScrollHeight, paginatorLocale',
      useAPaginator,
    ),
    dropped('paginatorleft, paginatorright, paginatordropdownitem templates', useAPaginator),
    dropped(
      'sorticon, loadingicon, checkboxicon, headercheckboxicon, reorder-indicator and paginator icon templates, loadingIcon',
      droppedIcon,
    ),
    dropped(
      'responsiveLayout, breakpoint, rowTrackBy',
      'Not needed. Row identity comes from `dataKey`.',
    ),
  ],
};
