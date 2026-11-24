import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  booleanAttribute,
  computed,
  contentChild,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { Scroller } from '@openng/optimus-ui/scroller';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjScrollerItemSlot, WjScrollerLoaderSlot } from './scroller-slots';
import type { WjScrollerOrientation, WjScrollerPt, WjScrollerRange } from './scroller-types';

/**
 * A virtual scroller over Optimus's `p-scroller`: it renders only the items in view, so a list of
 * thousands stays light. Give it `items`, an `itemSize` in px and a `scrollHeight`, and put a
 * `wjScrollerItem` template inside it. Every item must be exactly `itemSize` along the axis.
 * Its root is a focusable `region`: give it `ariaLabel` or `ariaLabelledBy`.
 */
@Component({
  selector: 'wj-scroller',
  imports: [Scroller, NgTemplateOutlet],
  templateUrl: './scroller.html',
  styleUrl: './scroller.css',
})
export class WjScroller<T = unknown> {
  /** The items to show. Never changed: the scroller only reads it. */
  readonly items = input<T[]>();
  /** The height of an item, or its width when `orientation` is `'horizontal'`, in px. */
  readonly itemSize = input.required({ transform: numberAttribute });
  /** Height of the viewport, a CSS length. Without it the viewport has no height. */
  readonly scrollHeight = input<string>();
  /** Width of the viewport, a CSS length. Used when `orientation` is `'horizontal'`. */
  readonly scrollWidth = input<string>();
  /** The axis to scroll along. */
  readonly orientation = input<WjScrollerOrientation>('vertical');
  /** The items load as the user scrolls: `lazyLoad` asks for them, and `loading` shows the wait. */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Shows that a `lazy` scroller is loading: the loader slot in place of the items. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible name of the region. Set on the scrolling element, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the region. Set on the scrolling element, not on the host. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the scroller's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjScrollerPt>();
  /** Emits the range to load when a `lazy` scroller reaches items it has not asked for. */
  readonly lazyLoad = output<WjScrollerRange>();
  /** Emits the range of rendered items whenever it changes while the user scrolls. */
  readonly scrollIndexChange = output<WjScrollerRange>();

  protected readonly itemSlot = contentChild(WjScrollerItemSlot);
  protected readonly loaderSlot = contentChild(WjScrollerLoaderSlot);
  private readonly scroller = viewChild.required(Scroller);

  /** `pt` forwarded as given, plus the role, name and busy state this wrapper routes to the root. */
  protected readonly partAttributes = computed<WjScrollerPt>(() =>
    _mergePartAttributes(this.pt(), 'root', {
      role: 'region',
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-busy': this.lazy() && this.loading() ? 'true' : undefined,
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-scroller');
    _checkAriaOnHost('wj-scroller', 'Use the ariaLabel or ariaLabelledBy input instead');
  }

  /** Scrolls the item at `index` into view, at the start of the viewport. */
  scrollToIndex(index: number, behavior?: ScrollBehavior): void {
    this.scroller().scrollToIndex(index, behavior);
  }
}
