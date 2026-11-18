import { Component, TemplateRef, computed, input, viewChild } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import type { WjTabPanelPt, WjTabsValue } from '../tabs-types';

/**
 * The panel of one tab, shown while its tab is active: its content is the panel's content. A part
 * renders nothing itself: `wj-tabs` reads its inputs and draws the panel. Hidden panels stay in
 * the page, out of the Tab order.
 */
@Component({
  selector: 'wj-tabpanel',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjTabPanel {
  /** Pairs the panel with the `wj-tab` of the same value. Unique within the tabs. */
  readonly value = input.required<WjTabsValue>();
  /**
   * Pass-through for the panel's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTabPanelPt>();
  /** The projected content, as a template `wj-tabs` stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);
  /** `pt` plus `tabindex="0"`: a panel whose content is not focusable is a Tab stop. @docs-private */
  readonly routedPt = computed<WjTabPanelPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { tabindex: '0' }),
  );

  constructor() {
    _checkWeeljackSetup('wj-tabpanel');
    _checkAriaOnHost('wj-tabpanel', 'Remove it: the panel is named by its tab');
  }
}
