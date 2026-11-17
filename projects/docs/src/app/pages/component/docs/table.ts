import { TableBasicExample } from '../../../examples/table/basic';
import { TableCustomCellsExample } from '../../../examples/table/custom-cells';
import { TablePagingExample } from '../../../examples/table/paging';
import { TableSortingExample } from '../../../examples/table/sorting';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';
const droppedIcon = 'Icon slots are not exposed (02 Q6).';
const useAPaginator =
  'Use a `wj-paginator` beside the table, with `paginator` off and `[(first)]` and `[(rows)]` bound on both.';

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
    'A data table: give it rows, declare its columns, and it renders, sorts and pages them. `wj-table` takes `value` and reads its `wj-column` children; it writes every header, row and cell itself, so there is no raw-row template. A `wjTableCell` or `wjTableHeaderCell` template inside a column customises what that column shows. Your array is never changed: the table sorts a copy. The table has no visible title of its own, so give it a name with `ariaLabel`, or point `ariaLabelledBy` at a heading.',
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
        "Turn `paginator` on to show a pager under the rows: `rows` is the page size (10 when you give none), `first` is the index of the first row of the page, and both are two-way. `rowsPerPageOptions` adds a select for the page size, `paginatorPosition` moves the pager to `top` or `both` (`WjPaginatorPosition`, imported `from 'weeljack-ng'`), and `totalRecords` sets the row count when it is not the length of `value`. `pageChange` emits a `WjPageEvent` (`{ first, rows }`, imported `from 'weeljack-ng'`) after `first` and `rows` have been written. This table has 23 rows, five to a page. For a page report or page links, turn `paginator` off and put a `wj-paginator` beside the table.",
      sourceKey: 'table/paging',
      component: TablePagingExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTableHarness` from `weeljack-ng/table/testing`. `getHeaderTexts()`, `getRows()` and `getCellTexts()` read the table as a user meets it, `sortBy(header)` and `getSortOrder(header)` drive and read a column, and `getCurrentPage()`, `goToNextPage()`, `goToPreviousPage()` and `goToPage(page)` drive the pager. `WjTableHarness.with({ caption })` finds a table by its name: its `ariaLabel`, or the text its `ariaLabelledBy` points at. Rows and cells have their own harnesses, `WjTableRowHarness` and `WjTableCellHarness`. Nothing here names an Optimus class.',
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
    'Optimus gap: a table wider than its container scrolls sideways inside the host and never scrolls the page, but it has no focusable cell inside that container, so not every browser lets the keyboard scroll it. A `scrollable` mode that makes the container a tab stop arrives with the table’s features.',
    'Motion gap: the rows-per-page list is an Optimus overlay that takes no per-instance motion option, and `provideWeeljack` sets no global overlay motion, so its open and close are not switched off under reduced motion. The table adds no animation of its own.',
    'Long headers and cell text wrap at spaces and never truncate; an unbroken value widens its column, and the table’s own container scrolls inside the host.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'Colours, radius, cell padding and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, and Optimus’s table fills its width. Cells are 12 px by 16 px (`small` 6 px by 8 px, `large` 16 px by 20 px) and each header is a row of its title and the sort icon, 8 px apart. The widths of columns are your CSS. For anything else, `pt` reaches the parts of the Optimus table underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-table`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-label`, `aria-labelledby` and `aria-describedby` on the `table` part are set by the component from the matching inputs, and win over a `pt` value of the same name.',
  parts: [
    { part: 'host', description: 'The Optimus `p-table` element.' },
    { part: 'root', description: 'The root of the table, the element that carries its look.' },
    {
      part: 'header',
      description: 'The band above the table. Used by the caption in a later release.',
    },
    { part: 'tableContainer', description: 'The container around the table: it scrolls sideways.' },
    { part: 'table', description: 'The `table` element. Takes the routed ARIA attributes.' },
    { part: 'thead', description: 'The header row group.' },
    { part: 'tbody', description: 'The body row group.' },
    { part: 'tfoot', description: 'The footer row group, present only when the table has one.' },
    {
      part: 'footer',
      description: 'The band below the table. Used by the summary in a later release.',
    },
    { part: 'mask', description: 'The overlay shown over the table while it is loading.' },
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
      note: 'The column model (02 Q7). `frozen` arrives with the table’s features.',
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
      'Not needed. Row identity comes from `dataKey`, which arrives with the table’s features.',
    ),
  ],
};
