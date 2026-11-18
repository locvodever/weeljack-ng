import { Component, TemplateRef, booleanAttribute, input, viewChild } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjTabPt, WjTabsValue } from '../tabs-types';

// A part is a declaration (PRD FR-3): `<ng-content />` sits inside an `ng-template`, so the
// projected label moves to the one place `wj-tabs` stamps the template. The host is projected only
// so it reaches the prerendered HTML (check:ssr), and `hidden` keeps it out of the layout.

/**
 * One tab of a `wj-tablist`: its content is the tab's label. Keep it to text and decorative icons
 * (`aria-hidden="true"`). A part renders nothing itself: `wj-tabs` reads its inputs and draws the
 * tab.
 */
@Component({
  selector: 'wj-tab',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjTab {
  /** Identifies the tab, and pairs it with the `wj-tabpanel` of the same value. Unique. */
  readonly value = input.required<WjTabsValue>();
  /** Makes the tab inert: it cannot be activated, takes no focus and is skipped by the keys. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the tab's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTabPt>();
  /** The projected label, as a template `wj-tabs` stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    _checkWeeljackSetup('wj-tab');
    _checkAriaOnHost('wj-tab', 'Remove it: the tab is named by its own text');
  }
}
