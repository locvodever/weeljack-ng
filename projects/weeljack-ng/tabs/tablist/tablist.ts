import { Component, computed, contentChildren, input } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjTab } from '../tab/tab';
import type { WjTabListPt } from '../tabs-types';

/**
 * The row of tabs of a `wj-tabs`: its `wj-tab` children, in order. It names the tab list. A part
 * renders nothing itself: `wj-tabs` reads its inputs and draws the strip.
 */
@Component({
  selector: 'wj-tablist',
  template: '<ng-content select="wj-tab" />',
  host: { hidden: '' },
})
export class WjTabList {
  /** Accessible name of the tab list, as a string. Set on the `role="tablist"` element. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the tab list. Set on the `role="tablist"` element. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the tab list's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTabListPt>();
  /** The `wj-tab` children, in declaration order. @docs-private */
  readonly tabs = contentChildren(WjTab);
  /** `pt` plus the name routed to the tab list element (Optimus gives it none). @docs-private */
  readonly routedPt = computed<WjTabListPt>(() =>
    _mergePartAttributes(this.pt(), 'tabList', {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-tablist');
    _checkAriaOnHost('wj-tablist', 'Use the ariaLabel or ariaLabelledBy input instead');
  }
}
