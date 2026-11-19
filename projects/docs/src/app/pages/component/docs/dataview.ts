import { DataViewEmptyExample } from '../../../examples/dataview/empty';
import { DataViewGridExample } from '../../../examples/dataview/grid';
import { DataViewListExample } from '../../../examples/dataview/list';
import { DataViewPagingExample } from '../../../examples/dataview/paging';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';
const useAPaginator =
  'Use a `wj-paginator` beside the view: turn the view’s `paginator` off, give the view the current page from a `computed` slice, and bind `[(first)]` and `[(rows)]` on the `wj-paginator` only. See the paginator page’s “Beside a table” example, which works the same for a data view.';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'dataview',
  title: 'Data view',
  purpose:
    'Items in a list or a grid. Give `wj-dataview` its `value` and a `wjDataViewItem` template and it writes the list itself: a `ul` with `role="list"` and one `li` per item of the current page. `layout` switches between one column and a grid that fills its container. The look of an item is your template: the view adds no padding, border or fill. Your array is never changed: the view works on a copy. Name the list with `ariaLabel`, or point `ariaLabelledBy` at a heading.',
  examples: [
    {
      title: 'List',
      description:
        'Six products in the default `list` layout: one column, items edge to edge with no gap. The item template is a typed slot: `[wjDataViewItemOf]` types `let-product` from your items, and the context carries the item, `index` (its place in the whole list: `first` plus its place on the page) and `layout`. Here the name (weight 600) sits over a muted category, the price is at the end, each item has 16 px of block padding, and `index` draws a top border on every item after the first. Padding and dividers are the template’s, never the view’s.',
      sourceKey: 'dataview/list',
      component: DataViewListExample,
    },
    {
      title: 'Grid with a layout switch',
      description:
        'Set `layout` to `grid` and the items lie in equal tracks that fill the container, each at least `--wj-dataview-grid-item-min-width` (16rem) wide with a 16 px gap; the items of a row stretch to the tallest one. A container narrower than one track keeps a single column instead of overflowing. The `wjDataViewHeader` slot holds the switch: a `wj-field` with a `wj-toggleswitch` bound to the app’s own `layout`. Switching re-flows at once, with no animation, and the focus stays on the switch. The cards are the template’s: a 12 px radius and 16 px of padding, with `block-size: 100%` so they fill their track.',
      sourceKey: 'dataview/grid',
      component: DataViewGridExample,
    },
    {
      title: 'Paging',
      description:
        "Turn `paginator` on to show a pager and split the items into pages: `rows` is the page size (10 when you give none), `first` is the index of the first item of the page, and both are two-way. `rowsPerPageOptions` adds a select for the page size, `paginatorPosition` moves the pager to `top` or `both` (`WjPaginatorPosition`, imported `from 'weeljack-ng'`), and `totalRecords` sets the item count when the view is `lazy`. `pageChange` emits a `WjPageEvent` (`{ first, rows }`, imported `from 'weeljack-ng'`) after `first` and `rows` have been written. This view has 24 products in a grid, six to a page. For a page report or page links, turn `paginator` off and put a `wj-paginator` beside the view: Optimus slices the items only while its own `paginator` is on, so give the view the current page from a `computed` slice of `first` and `rows`, bound on the `wj-paginator` only. The paginator page’s “Beside a table” example shows it, and it works the same for a data view.",
      sourceKey: 'dataview/paging',
      component: DataViewPagingExample,
    },
    {
      title: 'Empty',
      description:
        'With no items the view writes no list at all, so nothing announces “list, 0 items”. It shows Optimus’s empty box with the translation’s `emptyMessage`, or the content of a `wjDataViewEmpty` template, as here. The header and footer stay. Set `lazy` and `loading` while a server answers: Optimus’s mask shows over the items, and the empty message waits until loading ends.',
      sourceKey: 'dataview/empty',
      component: DataViewEmptyExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjDataViewHarness` from `weeljack-ng/dataview/testing` to read a view and page it without touching its DOM. `getItemTexts()` returns the items of the current page, `getLayout()`, `isEmpty()`, `getEmptyText()` and `isLoading()` read its state, and `goToNextPage()`, `goToPreviousPage()`, `goToPage()` and `getCurrentPage()` drive its pager. Find a view by `with({ name })`, the name of its list: an empty view has no list, so find it with `getAllHarnesses()` and `isEmpty()`.',
      sourceKey: 'dataview/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus through the focusable content of each item in order, then through the pager’s buttons and its rows-per-page select. The view has no keys and no tab stop of its own.',
    },
    {
      key: 'Enter, Space on a pager button',
      effect: 'Moves to that page, or the first, previous, next or last one.',
    },
    {
      key: 'Enter, Space or ArrowDown on the rows-per-page select',
      effect: 'Opens its list.',
    },
    {
      key: 'ArrowUp, ArrowDown in the open list',
      effect: 'Moves between the page sizes.',
    },
    { key: 'Enter in the open list', effect: 'Picks the page size and closes the list.' },
    { key: 'Escape in the open list', effect: 'Closes the list with focus back on the select.' },
  ],
  aria: [
    'The view writes its own list: a `ul` with `role="list"`, set explicitly so list semantics survive `list-style: none`, and one `li` per item. Name it: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading. Both land on the `ul`, not on the `wj-dataview` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML.',
    'An empty view renders no `ul`, so a screen reader does not announce an empty list; the empty message is plain text in Optimus’s box. Because that means an empty view has no named list, say what is missing in the message (“No products match.”).',
    'Items are your markup: give an item interactive content only if it needs it, and name it. The view adds no role to an item beyond the `li`. A layout switch in the header slot needs its own accessible name; changing `layout` moves no focus.',
    'While the view is `loading`, Optimus shows its mask and spinner over the items; the view adds no `aria-busy`, so announce the wait in your own status text if it matters.',
    'The pager is Optimus’s own, not a `wj-paginator`: its button names come from the translation, and it has no page report and no name of its own (use a `wj-paginator` for those). Optimus gap: with `paginator` on, Optimus 2.0.2 leaves its “First Page” button in the Tab order on the first page, where it is dimmed and does nothing. Tab past it.',
    'Motion gap, fixed: under reduced motion the rows-per-page list opens and closes without animating.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host and Optimus’s element are blocks. The view writes the list (`ul`, no bullets, margin or padding) and one `li` per item at `min-inline-size: 0`, so long item content wraps instead of widening the list. It adds no padding, border, divider, fill or radius to an item: the `--wj-*` variables are there for your template to use. In `list` layout the items stack with no gap; in `grid` layout they sit in `repeat(auto-fill, …)` tracks of `--wj-dataview-grid-item-min-width` or more (never wider than the container) 16 px apart. For anything else, `pt` reaches the parts of the Optimus data view underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-dataview`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'host', description: 'The Optimus `p-dataview` element.' },
    { part: 'root', description: 'The root element of the Optimus data view.' },
    { part: 'loading', description: 'The container of the mask shown while `loading`.' },
    { part: 'loadingOverlay', description: 'The mask over the items while `loading`.' },
    { part: 'loadingIcon', description: 'The spinner in the mask.' },
    { part: 'header', description: 'The band above the items: the `wjDataViewHeader` slot.' },
    { part: 'content', description: 'The container of the list the view writes.' },
    {
      part: 'emptyMessage',
      description: 'The box shown when there are no items: the translation or `wjDataViewEmpty`.',
    },
    { part: 'footer', description: 'The band below the items: the `wjDataViewFooter` slot.' },
    {
      part: 'pcPaginator',
      description: 'The pager. Takes the pass-through of a paginator.',
    },
  ],
  customProperties: [
    {
      name: '--wj-dataview-grid-item-min-width',
      defaultValue: '16rem',
      description:
        'The least width of a grid track, so the grid fits as many tracks as the container holds. Used by the `grid` layout only; a container narrower than this keeps one column.',
    },
  ],
  mapping: [
    {
      optimus: 'value, layout, lazy, loading',
      weeljack: 'same',
      status: 'kept',
      note: '`value` is a `readonly T[]`, never sorted or changed. `layout` is `WjDataViewLayout` (`list` or `grid`). `T` is inferred for the item template from `[wjDataViewItemOf]`.',
    },
    {
      optimus: 'list, grid templates',
      weeljack: 'wjDataViewItem',
      status: 'renamed',
      note: 'One per-item slot; the wrapper writes the `ul` and the loop. Its context is `WjDataViewItemContext`: `$implicit`, `index` and `layout`.',
    },
    {
      optimus: 'header, footer, emptymessage templates; p-header, p-footer',
      weeljack: 'wjDataViewHeader, wjDataViewFooter, wjDataViewEmpty',
      status: 'renamed',
      note: 'Typed slots with no context (02 Q6). The duplicate content selectors are dropped. The wrapper declares an Optimus template only for a slot you give.',
    },
    {
      optimus: 'paginator, rows, first, totalRecords, rowsPerPageOptions, paginatorPosition',
      weeljack: 'paginator, rows, first, totalRecords, rowsPerPageOptions, paginatorPosition',
      status: 'kept',
      note: '`first` and `rows` are two-way `model()`s (02 Q2); `rows` is 10 until one is given. `paginatorPosition` is `WjPaginatorPosition` from `weeljack-ng`.',
    },
    {
      optimus: 'onPage, onLazyLoad',
      weeljack: 'pageChange, lazyLoad',
      status: 'renamed',
      note: 'Emit `WjPageEvent` (`{ first, rows }`) from `weeljack-ng`.',
    },
    {
      optimus: 'trackBy',
      weeljack: 'dataKey',
      status: 'renamed',
      note: 'A field name, as on the table: the key an item’s DOM is kept by. Identity when unset.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'added',
      note: 'On the list the wrapper writes, which carries `role="list"`.',
    },
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjDataViewPt`.' },
    dropped(
      'onChangeLayout',
      'It only echoes a change to the `layout` input. You set `layout`, so you know.',
    ),
    dropped(
      'sortField, sortOrder, onSort, filterBy, filterLocale, filter()',
      'Deferred: sort or filter `value` with a `computed()` and hand the view the result.',
    ),
    dropped('emptyMessage', 'The `wjDataViewEmpty` slot, or the translation’s `emptyMessage`.'),
    dropped(
      'pageLinks, alwaysShowPaginator, currentPageReportTemplate, showCurrentPageReport, showJumpToPageDropdown, showFirstLastIcon, showPageLinks, paginatorDropdownAppendTo, paginatorDropdownScrollHeight, paginatorleft, paginatorright, paginatordropdownitem',
      useAPaginator,
    ),
    dropped(
      'lazyLoadOnInit, loadingIcon, loadingicon, listicon, gridicon',
      'The view always asks for its first page when `lazy`; icons are not exposed (02 Q6).',
    ),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'styleClass, gridStyleClass, paginatorStyleClass',
      `${droppedAlways} Use the host’s \`class\` and \`style\`, \`pt\` and the custom property.`,
    ),
  ],
};
