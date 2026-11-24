import { Component, contentChildren, input } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import { WjTabPanel } from '../tabpanel/tabpanel';
import type { WjTabPanelsPt } from '../tabs-types';

/**
 * The panels of a `wj-tabs`: its `wj-tabpanel` children, in order. A part renders nothing itself:
 * `wj-tabs` reads its `pt` and draws the panels.
 */
@Component({
  selector: 'wj-tabpanels',
  template: '<ng-content select="wj-tabpanel" />',
  host: { hidden: '' },
})
export class WjTabPanels {
  /**
   * Pass-through for the panels' parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTabPanelsPt>();
  /** The `wj-tabpanel` children, in declaration order. @docs-private */
  readonly panels = contentChildren(WjTabPanel);

  constructor() {
    _checkWeeljackSetup('wj-tabpanels');
    _checkAriaOnHost('wj-tabpanels', 'Remove it: each panel is named by its tab');
  }
}
