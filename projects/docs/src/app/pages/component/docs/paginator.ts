import { PaginatorBasicExample } from '../../../examples/paginator/basic';
import { PaginatorBesideATableExample } from '../../../examples/paginator/beside-a-table';
import { PaginatorCurrentPageReportExample } from '../../../examples/paginator/current-page-report';
import { PaginatorRowsPerPageExample } from '../../../examples/paginator/rows-per-page';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'paginator',
  title: 'Paginator',
  purpose:
    'A pager: first, previous, page and next buttons, an optional page-size select and an optional report such as "1–10 of 120". It pages nothing itself: it writes `first` and `rows`.',
  examples: [
    {
      title: 'Basic',
      description:
        'Give it the number of records and bind `[(first)]`. `first` is the index of the first record of the page, so `first + 1` is the number a reader sees. `pageChange` emits `{ first, rows }` when the user moves, and not when your code sets `first`.',
      sourceKey: 'paginator/basic',
      component: PaginatorBasicExample,
    },
    {
      title: 'Rows per page',
      description:
        'Set `rowsPerPageOptions` to offer a select of page sizes, and bind `[(rows)]`. Picking a size keeps the page index and moves `first` to match.',
      sourceKey: 'paginator/rows-per-page',
      component: PaginatorRowsPerPageExample,
    },
    {
      title: 'Current page report',
      description:
        '`showCurrentPageReport` adds a report. `currentPageReportTemplate` fills in `{currentPage}`, `{totalPages}`, `{rows}`, `{first}`, `{last}` and `{totalRecords}`. It is your text, rendered as text, and the English default is not translated.',
      sourceKey: 'paginator/current-page-report',
      component: PaginatorCurrentPageReportExample,
    },
    {
      title: 'Beside a table',
      description:
        'A `wj-table`, or a `wj-dataview`, offers only the basics of paging. For the report, the page links or the first and last buttons, turn its `paginator` off and put a `wj-paginator` under it, bound with `[(first)]` and `[(rows)]` and given the same record count. With its pager off, the table shows every row it is given, so the app gives it the current page: the rows from `first` to `first + rows`. Sorting then covers that page only.',
      sourceKey: 'paginator/beside-a-table',
      component: PaginatorBesideATableExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjPaginatorHarness` from `weeljack-ng/paginator/testing` to move a pager and read its page, page count, page size and report without touching its DOM.',
      sourceKey: 'paginator/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus through the first, previous, page, next and last buttons and the rows-per-page select. A disabled button is skipped.',
    },
    {
      key: 'Enter, Space on a button',
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
    {
      key: 'Escape in the open list',
      effect: 'Closes the list with focus back on the select.',
    },
  ],
  aria: [
    'The pager is a `navigation` landmark. Name it: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading. Both land on the pager’s root element, which carries `role="navigation"`, not on the `wj-paginator` host. Give each pager on a page its own name, and say what it pages ("Orders pages"). `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML.',
    'The buttons and the select are named from the translation (`aria.firstPageLabel`, `prevPageLabel`, `nextPageLabel`, `lastPageLabel`, `pageLabel` and `rowsPerPageLabel`): English by default, and the `vi` translation from `weeljack-ng/locale` fills them in Vietnamese. The current page link carries `aria-current="page"`. A previous, next or last button with nowhere to go is disabled.',
    'Optimus gap: on the first page Optimus 2.0.2 dims its "First Page" button and does nothing on a click, but does not disable it, so it stays in the Tab order. Tab past it.',
    'Translation gap: the English default of `currentPageReportTemplate`, "{currentPage} of {totalPages}", is not part of the translation, so it stays English. Pass your own wording, in the language of the page.',
    'The rows-per-page list is an overlay, so it is part of the screen-reader pass.',
    'Motion gap, fixed: under reduced motion the rows-per-page list opens and closes without animating.',
    'With `alwaysShow` off and a single page, the pager renders nothing, and takes no room. With no records it shows no page buttons, and its previous, next and last buttons and the select are disabled.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, and Optimus’s pager fills its width: a centred row of 40 px round buttons, a 44 px page-size select and the muted report, wrapping onto more lines when it is narrow. For anything else, `pt` reaches the parts of the Optimus paginator underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-paginator`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `role`, `aria-label` and `aria-labelledby` on the `root` part are set by the component, and win over a `pt` value of the same name.',
  parts: [
    { part: 'host', description: 'The Optimus `p-paginator` element.' },
    {
      part: 'root',
      description:
        'The root of the pager, the same element as the host. Takes the routed role and ARIA attributes.',
    },
    { part: 'contentStart', description: 'The band at the start. Not used by `wj-paginator`.' },
    { part: 'current', description: 'The current page report.' },
    { part: 'first', description: 'The button to the first page.' },
    { part: 'prev', description: 'The button to the previous page.' },
    { part: 'pages', description: 'The group of page buttons.' },
    { part: 'page', description: 'One page button.' },
    { part: 'next', description: 'The button to the next page.' },
    { part: 'last', description: 'The button to the last page.' },
    { part: 'contentEnd', description: 'The band at the end. Not used by `wj-paginator`.' },
    {
      part: 'pcRowPerPageDropdown',
      description: 'The rows-per-page select. Takes the pass-through of a select.',
    },
  ],
  mapping: [
    {
      optimus:
        'totalRecords, pageLinkSize, alwaysShow, showFirstLastIcon, showPageLinks, showCurrentPageReport, currentPageReportTemplate',
      weeljack: 'same',
      status: 'kept',
      note: 'The report template renders as text.',
    },
    {
      optimus: 'first, rows',
      weeljack: 'first, rows',
      status: 'kept',
      note: 'Now two-way `model()`s: `[(first)]` and `[(rows)]`.',
    },
    {
      optimus: 'rowsPerPageOptions',
      weeljack: 'rowsPerPageOptions',
      status: 'kept',
      note: 'Narrowed to `number[]`.',
    },
    {
      optimus: 'onPageChange',
      weeljack: 'pageChange',
      status: 'renamed',
      note: "`WjPageEvent` (`first`, `rows`), imported `from 'weeljack-ng'`.",
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'added',
      note: 'On the root, which becomes `role="navigation"`.',
    },
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjPaginatorPt`.' },
    dropped(
      'showJumpToPageDropdown, showJumpToPageInput, jumpToPageItemTemplate',
      'By need: jump-to-page waits for a need.',
    ),
    dropped('templateLeft, templateRight', 'Content beside the pager is your layout.'),
    dropped(
      'dropdownAppendTo, appendTo, dropdownScrollHeight, dropdownItemTemplate, locale',
      droppedByNeed,
    ),
    dropped('changePage() and the other public methods', 'Set `first` instead.'),
    dropped('dt, unstyled, ptOptions, styleClass', droppedAlways),
    dropped('The icon templates', 'Icon slots are not exposed (02 Q6).'),
  ],
};
