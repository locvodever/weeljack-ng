import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
} from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';
import { OrderList } from '@openng/optimus-ui/orderlist';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjOrderListEmptySlot, WjOrderListItemSlot } from './orderlist-slots';
import type { WjOrderListControlsPosition, WjOrderListPt } from './orderlist-types';

/*
 * Notes on the template, which is one line on purpose: a partially compiled template ships as text,
 * inside the size budget.
 * - Optimus splices the array it is given in place, and sorts its selection in place. It is handed
 *   copies (`items`, `picked`), and every reorder or selection change writes a new array to the
 *   model, so the app's arrays keep their reference and order (FR-9). After a reorder `items()` is
 *   the array Optimus changed, so the new model value is a copy of it.
 * - Optimus 2.0.2 never draws its `header` input, so the string goes in through the listbox's
 *   `#header` template, as text. `[header]` is bound anyway: its change marks Optimus's OnPush
 *   component dirty, so a header set or cleared later is drawn or removed.
 * - Optimus stacks the buttons above the list below 960 px only when `responsive` is on, so it is.
 * - A template is declared only for a slot the app gave. The one empty slot serves `#empty` and
 *   `#emptyfilter`. Optimus hands its listbox no `emptyMessage`, so with no slot an empty list would
 *   be blank: the translation's `emptyMessage` is written instead. Optimus falls back to `#empty`
 *   for a filter that matches nothing, so `#emptyfilter` is written too, with Optimus's own text.
 * - `ariaLabel` goes through Optimus's listbox input. Optimus has no input for `ariaLabelledBy` and
 *   never passes `ariaFilterLabel` on, so both are routed through `pt`. The filter input's
 *   `aria-owns` is cleared: it names the list's id, which does not exist while the list is empty.
 *   With an item template the
 *   option's own `aria-label` (the item's name field) is cleared, so the option is named by its
 *   content, as axe's label-content-name-mismatch requires.
 */

/** The translation's text for `key`, or an empty string when it has none. */
function message(optimus: Optimus, key: string): string {
  const text: unknown = optimus.getTranslation(key);
  return typeof text === 'string' ? text : '';
}

/**
 * A list whose order the user changes, over Optimus's `p-orderlist`. Give it `value` as
 * `[(value)]`: each move writes a new array, and your array is never changed. Select items, then
 * use the move buttons; `dragdrop` adds dragging as an extra. Name the list with `ariaLabel` or
 * `ariaLabelledBy`.
 */
@Component({
  selector: 'wj-orderlist',
  imports: [OrderList, NgTemplateOutlet],
  // prettier-ignore
  template: `<p-orderlist [value]="items()" [selection]="picked()" [header]="header()" [filterBy]="filterBy()" [filterPlaceholder]="filterPlaceholder()" [dragdrop]="dragdrop()" [controlsPosition]="controlsPosition()" [stripedRows]="stripedRows()" [disabled]="disabled()" [scrollHeight]="scrollHeight()" [dataKey]="dataKey()" [ariaLabel]="ariaLabel()" [responsive]="true" [pt]="partAttributes()" (selectionChange)="selection.set($event.slice())" (onReorder)="value.set(items().slice())">@if (header(); as h) {<ng-template #header>{{ h }}</ng-template>}@if (itemSlot(); as s) {<ng-template #item let-item let-selected="selected" let-index="index"><ng-container *ngTemplateOutlet="s.template; context: { $implicit: item, index, selected }" /></ng-template>}@if (emptySlot(); as s) {<ng-template #empty><ng-container *ngTemplateOutlet="s.template; context: { filtered: false }" /></ng-template><ng-template #emptyfilter><ng-container *ngTemplateOutlet="s.template; context: { filtered: true }" /></ng-template>} @else {<ng-template #empty>{{ messages.empty }}</ng-template><ng-template #emptyfilter>{{ messages.filtered }}</ng-template>}</p-orderlist>`,
  styleUrl: './orderlist.css',
})
export class WjOrderList<T = unknown> {
  /** The items in their order. Two-way: `[(value)]`. Every move writes a new array. */
  readonly value = model<T[]>([]);
  /** The selected items, the ones the move buttons move. Two-way: `[(selection)]`. */
  readonly selection = model<T[]>([]);
  /** Text above the list. */
  readonly header = input<string>();
  /** The field the filter searches. Setting it shows the filter input above the list. */
  readonly filterBy = input<string>();
  /** Placeholder of the filter input. */
  readonly filterPlaceholder = input<string>();
  /** Accessible name of the filter input. */
  readonly ariaFilterLabel = input<string>();
  /** Lets the user drag items to reorder them. The move buttons stay the keyboard path. */
  readonly dragdrop = input(false, { transform: booleanAttribute });
  /** Which side of the list the move buttons sit on. */
  readonly controlsPosition = input<WjOrderListControlsPosition>('left');
  /** Alternating row fills. */
  readonly stripedRows = input(false, { transform: booleanAttribute });
  /** Disables the list and its buttons. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Height of the list, past which it scrolls. A CSS length. */
  readonly scrollHeight = input('14rem');
  /** The field shown for an item when there is no item template. `name` when unset. */
  readonly dataKey = input<string>();
  /** Accessible name of the list. Set on the listbox, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the listbox, not on the host. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the list's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjOrderListPt>();

  protected readonly itemSlot = contentChild(WjOrderListItemSlot);
  protected readonly emptySlot = contentChild(WjOrderListEmptySlot);

  /** The copies Optimus works on. */
  protected readonly items = computed(() => this.value().slice());
  protected readonly picked = computed(() => this.selection().slice());
  protected readonly messages = this.readMessages();
  /** `pt` forwarded as given, plus the names this wrapper routes to the listbox parts. */
  protected readonly partAttributes = computed<WjOrderListPt>(() => {
    const named = _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'pcListbox.list', {
        'aria-labelledby': this.ariaLabelledBy(),
      }),
      'pcListbox.pcFilter.root',
      { 'aria-label': this.ariaFilterLabel(), 'aria-owns': undefined },
    );
    return this.itemSlot()
      ? _mergePartAttributes(named, 'pcListbox.option', { 'aria-label': undefined })
      : named;
  });

  private readMessages(): { empty: string; filtered: string } {
    const optimus = inject(Optimus);
    return {
      empty: message(optimus, 'emptyMessage'),
      filtered: message(optimus, 'emptySearchMessage') || message(optimus, 'emptyFilterMessage'),
    };
  }

  constructor() {
    _checkWeeljackSetup('wj-orderlist');
    _checkAriaOnHost('wj-orderlist', 'Use ariaLabel or ariaLabelledBy instead');
  }
}
