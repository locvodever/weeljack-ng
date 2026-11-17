import { NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, contentChild, input, model, output } from '@angular/core';
import { DataView } from '@openng/optimus-ui/dataview';
import type { WjPageEvent, WjPaginatorPosition } from 'weeljack-ng';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import {
  WjDataViewEmptySlot,
  WjDataViewFooterSlot,
  WjDataViewHeaderSlot,
  WjDataViewItemSlot,
} from './dataview-slots';
import type { WjDataViewLayout, WjDataViewPt } from './dataview-types';

/*
 * Notes on the template, which is one line on purpose: a partially compiled template ships as text,
 * inside the size budget, and this entry sits at its limit.
 * - `#list` holds the list the view writes and `#grid` renders it again, so one `ul` serves both
 *   layouts: Optimus hands each the items of the current page, and renders only the one that
 *   matches `layout`. An empty page writes no `ul`.
 * - `index` is the item's place in the whole list: `first` plus its place on the page. A lazy view
 *   is given only its page, so there it is the place in the full list too.
 * - A band's template is declared only for a slot the app gave: Optimus draws a band for any
 *   template it finds.
 * - `value` is copied as it comes in, and `sortField` is never bound, so Optimus has nothing to
 *   sort and the app's array is never touched.
 */

/**
 * Items in a list or a grid over Optimus's `p-dataview`: give it `value` and a `wjDataViewItem`
 * template, and it writes the list itself, one `li` per item of the current page. `layout` switches
 * between one column and a grid, which fills its container with tracks of at least
 * `--wj-dataview-grid-item-min-width`. Your array is never changed.
 *
 * Name the list with `ariaLabel`, or point `ariaLabelledBy` at a visible heading. For a page
 * report or page links, turn `paginator` off and place a `wj-paginator` beside the view.
 */
@Component({
  selector: 'wj-dataview',
  imports: [DataView, NgTemplateOutlet],
  // prettier-ignore
  template: `<p-dataview [value]="value()" [layout]="layout()" [paginator]="paginator()" [first]="first()" [rows]="rows() ?? 10" [totalRecords]="totalRecords()" [rowsPerPageOptions]="rowsPerPageOptions()" [paginatorPosition]="paginatorPosition()" [lazy]="lazy()" [loading]="loading()" [pt]="pt()" (onPage)="first.set($event.first); rows.set($event.rows); pageChange.emit($event)" (onLazyLoad)="lazyLoad.emit($event)"><ng-template #list let-items>@if (items.length) {<ul role="list" [class]="layout()" [attr.aria-label]="ariaLabel()" [attr.aria-labelledby]="ariaLabelledBy()">@for (item of items; track item?.[dataKey()] ?? item) {<li>@if (itemSlot(); as s) {<ng-container *ngTemplateOutlet="s.template; context: { $implicit: item, index: (paginator() ? first() : 0) + $index, layout: layout() }" />}</li>}</ul>}</ng-template><ng-template #grid let-items><ng-container *ngTemplateOutlet="list; context: { $implicit: items }" /></ng-template>@if (headerSlot(); as s) {<ng-template #header><ng-container *ngTemplateOutlet="s.template" /></ng-template>}@if (footerSlot(); as s) {<ng-template #footer><ng-container *ngTemplateOutlet="s.template" /></ng-template>}@if (emptySlot(); as s) {<ng-template #emptymessage><ng-container *ngTemplateOutlet="s.template" /></ng-template>}</p-dataview>`,
  styleUrl: './dataview.css',
})
export class WjDataView<T = unknown> {
  /**
   * The items. Optimus can sort the array it is given in place, so the view keeps a copy: your
   * array keeps its order and its reference (FR-9).
   */
  readonly value = input<T[], readonly T[]>([], { transform: (items) => [...items] });
  /** One column, or a grid. */
  readonly layout = input<WjDataViewLayout>('list');
  /** The field that identifies an item, which keeps its DOM when the items change. Empty: by identity. */
  readonly dataKey = input('');
  /** Shows a pager and splits the items into pages. */
  readonly paginator = input(false, { transform: booleanAttribute });
  /** Index of the first item of the current page. Two-way: `[(first)]`. */
  readonly first = model(0);
  /** Items per page; 10 until one is given. Two-way: `[(rows)]`. */
  readonly rows = model<number>();
  /** Number of items in all pages. Defaults to the length of `value`, unless `lazy`. */
  readonly totalRecords = input(0);
  /** The page sizes the pager offers, as a select. */
  readonly rowsPerPageOptions = input<number[]>();
  /** Where the pager sits: above, below or both. */
  readonly paginatorPosition = input<WjPaginatorPosition>('bottom');
  /** The view does not page `value` itself: the app loads each page. */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Shows that items are loading, with a mask over the list. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible name of the list. Set on the `ul`, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the `ul`, not on the host. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the view's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjDataViewPt>();
  /** Emits when the user moves to another page or picks another page size. */
  readonly pageChange = output<WjPageEvent>();
  /** Emits when a `lazy` view needs items: on init, and on every page. */
  readonly lazyLoad = output<WjPageEvent>();

  protected readonly itemSlot = contentChild(WjDataViewItemSlot);
  protected readonly headerSlot = contentChild(WjDataViewHeaderSlot);
  protected readonly footerSlot = contentChild(WjDataViewFooterSlot);
  protected readonly emptySlot = contentChild(WjDataViewEmptySlot);

  constructor() {
    _checkWeeljackSetup('wj-dataview');
    _checkAriaOnHost('wj-dataview', 'Use ariaLabel or ariaLabelledBy instead');
  }
}
