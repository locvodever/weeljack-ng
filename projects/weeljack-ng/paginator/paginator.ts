import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { Paginator, type PaginatorState } from '@openng/optimus-ui/paginator';
import type { WjPageEvent } from 'weeljack-ng';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import type { WjPaginatorPt } from './paginator-types';

/**
 * A pager over Optimus's `p-paginator`: first, previous, page and next buttons, an optional
 * rows-per-page select and an optional report such as "1–10 of 120". It pages nothing itself: bind
 * `[(first)]` and `[(rows)]` to your data, or to a `wj-table` or `wj-dataview` whose own pager is off.
 * Its root is a `navigation` landmark: give it `ariaLabel` or `ariaLabelledBy`.
 */
@Component({
  selector: 'wj-paginator',
  imports: [Paginator],
  templateUrl: './paginator.html',
  styleUrl: './paginator.css',
})
export class WjPaginator {
  /** Number of records in all pages. */
  readonly totalRecords = input(0, { transform: numberAttribute });
  /** Index of the first record of the current page. Two-way: `[(first)]`. */
  readonly first = model(0);
  /** Records per page. Two-way: `[(rows)]`. */
  readonly rows = model(10);
  /** The page sizes to offer, as a select. Without it there is no select. */
  readonly rowsPerPageOptions = input<number[]>();
  /** Number of page buttons shown. */
  readonly pageLinkSize = input(5, { transform: numberAttribute });
  /** Shows the pager even when there is a single page; when off, a single page renders nothing. */
  readonly alwaysShow = input(true, { transform: booleanAttribute });
  /** Shows the buttons to the first and the last page. */
  readonly showFirstLastIcon = input(true, { transform: booleanAttribute });
  /** Shows the page buttons. */
  readonly showPageLinks = input(true, { transform: booleanAttribute });
  /** Shows the current page report. */
  readonly showCurrentPageReport = input(false, { transform: booleanAttribute });
  /**
   * Template of the report: `{currentPage}`, `{totalPages}`, `{rows}`, `{first}`, `{last}` and
   * `{totalRecords}` are replaced. Rendered as text, never as HTML. The English default is not
   * translated: set your own wording.
   */
  readonly currentPageReportTemplate = input('{currentPage} of {totalPages}');
  /** Accessible name of the pager's `navigation` landmark. Set on the root, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the landmark. Set on the root, not on the host. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the pager's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjPaginatorPt>();
  /** Emits when the user moves to another page or picks another page size. */
  readonly pageChange = output<WjPageEvent>();

  /** `pt` forwarded as given, plus the role and the ARIA name this wrapper routes to the root. */
  protected readonly partAttributes = computed<WjPaginatorPt>(() => {
    const rows = this.rows();
    const pages = rows > 0 ? Math.ceil(this.totalRecords() / rows) : 0;
    return _mergePartAttributes(this.pt(), 'root', {
      role: 'navigation',
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      // What the harness reads: Optimus renders neither the page count nor, without links, the page.
      'data-wj-pages': pages,
      'data-wj-page': pages > 0 ? Math.floor(this.first() / rows) + 1 : 0,
    });
  });

  constructor() {
    _checkWeeljackSetup('wj-paginator');
    _checkAriaOnHost('wj-paginator', 'Use the ariaLabel or ariaLabelledBy input instead');
  }

  protected paged(state: PaginatorState): void {
    const first = state.first ?? this.first();
    const rows = state.rows ?? this.rows();
    this.first.set(first);
    this.rows.set(rows);
    this.pageChange.emit({ first, rows });
  }
}
