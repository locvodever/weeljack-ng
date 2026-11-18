import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, input } from '@angular/core';
import { Menubar } from '@openng/optimus-ui/menubar';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
} from 'weeljack-ng/private';
import { WjMenubarEndSlot, WjMenubarItemSlot, WjMenubarStartSlot } from './menubar-slots';
import type { WjMenubarPt } from './menubar-types';

/**
 * A horizontal bar of commands and links over Optimus's `p-menubar`. Describe it as `WjMenuItem`
 * objects in `model`: the root items sit across the bar and their `items` open as dropdowns, a
 * `separator` item draws a line. Below a 960 px viewport the bar collapses to a Navigation button
 * that drops the list. The list is a `role="menubar"`: give it `ariaLabel` or `ariaLabelledBy`.
 * The bar keeps its start and end slots, and its height, with no items.
 */
@Component({
  selector: 'wj-menubar',
  imports: [Menubar, NgTemplateOutlet],
  templateUrl: './menubar.html',
  styleUrl: './menubar.css',
})
export class WjMenubar {
  /**
   * The items. Replace the array to change the bar: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** Accessible name of the list. Set on the `role="menubar"` element, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the `role="menubar"` element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the list. Set on the `role="menubar"` element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the bar's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjMenubarPt>();

  protected readonly itemSlot = contentChild(WjMenubarItemSlot);
  protected readonly startSlot = contentChild(WjMenubarStartSlot);
  protected readonly endSlot = contentChild(WjMenubarEndSlot);

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() => _toOptimusMenuModel(this.model()));

  /** `pt` forwarded as given, plus the description routed to the list. */
  protected readonly partAttributes = computed<WjMenubarPt>(() =>
    _mergePartAttributes(this.pt(), 'rootList', { 'aria-describedby': this.ariaDescribedBy() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-menubar');
    _checkAriaOnHost('wj-menubar');
  }
}
