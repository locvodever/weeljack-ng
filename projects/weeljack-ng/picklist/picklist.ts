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
import { PickList } from '@openng/optimus-ui/picklist';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjPickListEmptySlot, WjPickListItemSlot } from './picklist-slots';
import type { WjPickListPt } from './picklist-types';

/*
 * Notes on the template, which is one line on purpose: a partially compiled template ships as text,
 * inside the size budget.
 * - Optimus splices the arrays it is given in place and never writes its own `source` / `target`
 *   models, so it is handed copies (`from`, `to`), and a move or reorder, which Optimus announces
 *   through its `on…` events, writes new arrays to the models: copies of the arrays Optimus holds
 *   at that moment (read from `pl`, not from `from` / `to`, which are already a step ahead after
 *   an earlier write), so the app's arrays keep their reference and order (FR-9). A transfer
 *   writes both arrays, a reorder only its own.
 * - Optimus stacks the buttons between the lists below 960 px only when `responsive` is on, so it is.
 * - The item template is declared only for a slot the app gave, and serves both lists. The empty
 *   template is always declared, for both lists: the app's slot, else the translation's
 *   text, because Optimus renders an empty list blank. With no filters there is no "filtered" case.
 * - With an item template the option's own `aria-label` (the item's name field) is cleared, so the
 *   option is named by its content, as axe's label-content-name-mismatch requires.
 * - Dropped for size (21): the filters and the show-controls switches, so Optimus renders no filter.
 */

/** The translation's text for `key`, or an empty string when it has none. */
function message(optimus: Optimus, key: string): string {
  const text: unknown = optimus.getTranslation(key);
  return typeof text === 'string' ? text : '';
}

/** The translation's `aria` name for `key`, or `undefined` when it has none. */
function ariaName(optimus: Optimus, key: string): string | undefined {
  const aria: unknown = optimus.getTranslation('aria');
  const name: unknown =
    typeof aria === 'object' && aria !== null ? Reflect.get(aria, key) : undefined;
  return typeof name === 'string' ? name : undefined;
}

/**
 * Two lists, with buttons that move items from one to the other, over Optimus's `p-picklist`. Give
 * it `source` and `target` as `[(source)]` and `[(target)]`: each move writes new arrays, and
 * your arrays are never changed. Select items, then use the transfer buttons; `dragdrop` adds
 * dragging as an extra. Name the lists with `sourceAriaLabel` and `targetAriaLabel`.
 */
@Component({
  selector: 'wj-picklist',
  imports: [PickList, NgTemplateOutlet],
  // prettier-ignore
  template: `<p-picklist #pl [source]="from()" [target]="to()" [sourceHeader]="sourceHeader()" [targetHeader]="targetHeader()" [dataKey]="dataKey()" [sourceAriaLabel]="sourceAriaLabel()" [targetAriaLabel]="targetAriaLabel()" [dragdrop]="dragdrop()" [stripedRows]="stripedRows()" [disabled]="disabled()" [scrollHeight]="scrollHeight()" [responsive]="true" [pt]="partAttributes()" (onMoveToTarget)="both(pl)" (onMoveAllToTarget)="both(pl)" (onMoveToSource)="both(pl)" (onMoveAllToSource)="both(pl)" (onSourceReorder)="source.set(pl.source().slice())" (onTargetReorder)="target.set(pl.target().slice())">@if (itemSlot(); as s) {<ng-template #item let-item let-selected="selected" let-index="index" let-disabled="disabled"><ng-container *ngTemplateOutlet="s.template; context: { $implicit: item, index, selected, disabled }" /></ng-template>}<ng-template #none let-list="list">@if (emptySlot(); as s) {<ng-container *ngTemplateOutlet="s.template; context: { list }" />} @else { {{ empty }} }</ng-template><ng-template #emptymessagesource><ng-container *ngTemplateOutlet="none; context: { list: 'source' }" /></ng-template><ng-template #emptymessagetarget><ng-container *ngTemplateOutlet="none; context: { list: 'target' }" /></ng-template></p-picklist>`,
  styleUrl: './picklist.css',
})
export class WjPickList<T = unknown> {
  /** The items of the first list. Two-way: `[(source)]`. Every move writes a new array. */
  readonly source = model<T[]>([]);
  /** The items of the second list. Two-way: `[(target)]`. Every move writes a new array. */
  readonly target = model<T[]>([]);
  /** Text above the source list. */
  readonly sourceHeader = input<string>();
  /** Text above the target list. */
  readonly targetHeader = input<string>();
  /** The field shown for an item when there is no item template. `name` when unset. */
  readonly dataKey = input<string>();
  /** Accessible name of the source list. Set on the listbox, not on the host. */
  readonly sourceAriaLabel = input<string>();
  /** Accessible name of the target list. Set on the listbox, not on the host. */
  readonly targetAriaLabel = input<string>();
  /** Lets the user drag items to reorder them and between the lists. The buttons stay the keyboard path. */
  readonly dragdrop = input(false, { transform: booleanAttribute });
  /** Alternating row fills. */
  readonly stripedRows = input(false, { transform: booleanAttribute });
  /** Disables both lists and every button. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Height of each list, past which it scrolls. A CSS length. */
  readonly scrollHeight = input('14rem');
  /**
   * Pass-through for the parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjPickListPt>();

  protected readonly itemSlot = contentChild(WjPickListItemSlot);
  protected readonly emptySlot = contentChild(WjPickListEmptySlot);

  /** The copies Optimus works on. */
  protected readonly from = computed(() => this.source().slice());
  protected readonly to = computed(() => this.target().slice());
  /** The translation's text for an empty list, which Optimus would render blank. */
  private readonly bottom = ariaName(inject(Optimus), 'moveBottom');
  protected readonly empty = message(inject(Optimus), 'emptyMessage');
  /**
   * `pt` forwarded as given, plus what this wrapper routes: the translation's "Move Bottom" name,
   * which Optimus replaces with "Move Down", and, with an item template, a cleared option name.
   */
  protected readonly partAttributes = computed<WjPickListPt>(() => {
    const named = ['pcSourceMoveBottomButton.root', 'pcTargetMoveBottomButton.root'].reduce(
      (pt, part) => _mergePartAttributes(pt, part, { 'aria-label': this.bottom }),
      this.pt(),
    );
    return this.itemSlot()
      ? _mergePartAttributes(named, 'pcListbox.option', { 'aria-label': undefined })
      : named;
  });

  /** A transfer moved items out of one list and into the other. */
  protected both(pick: PickList): void {
    // type-escape: Optimus types its source and target models as any[]; they hold this component's T
    this.source.set(pick.source().slice() as T[]);
    // type-escape: Optimus types its source and target models as any[]; they hold this component's T
    this.target.set(pick.target().slice() as T[]);
  }

  constructor() {
    _checkWeeljackSetup('wj-picklist');
    _checkAriaOnHost('wj-picklist', 'Use sourceAriaLabel and targetAriaLabel instead');
  }
}
