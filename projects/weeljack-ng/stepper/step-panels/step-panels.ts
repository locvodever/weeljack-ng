import { Component, contentChildren, input } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import { WjStepPanel } from '../step-panel/step-panel';
import type { WjStepPanelsPt } from '../stepper-types';

/**
 * The panels of a `wj-stepper`: its `wj-step-panel` children, in order. A part renders nothing
 * itself: `wj-stepper` reads its `pt` and draws the panels.
 */
@Component({
  selector: 'wj-step-panels',
  template: '<ng-content select="wj-step-panel" />',
  host: { hidden: '' },
})
export class WjStepPanels {
  /**
   * Pass-through for the panels' parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjStepPanelsPt>();
  /** The `wj-step-panel` children, in declaration order. @docs-private */
  readonly panels = contentChildren(WjStepPanel);

  constructor() {
    _checkWeeljackSetup('wj-step-panels');
    _checkAriaOnHost('wj-step-panels', 'Remove it: each panel is tied to its step');
  }
}
