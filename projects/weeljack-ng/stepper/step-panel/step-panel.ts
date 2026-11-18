import { Component, TemplateRef, input, viewChild } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjStepPanelPt, WjStepperValue } from '../stepper-types';

/**
 * The panel of one step, shown while its step is active: its content is the panel's content. A
 * part renders nothing itself: `wj-stepper` reads its inputs and draws the panel.
 */
@Component({
  selector: 'wj-step-panel',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjStepPanel {
  /** Pairs the panel with the `wj-step` of the same value. Unique within the stepper. */
  readonly value = input.required<WjStepperValue>();
  /**
   * Pass-through for the panel's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjStepPanelPt>();
  /** The projected content, as a template `wj-stepper` stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    _checkWeeljackSetup('wj-step-panel');
    _checkAriaOnHost('wj-step-panel', 'Remove it: the panel is tied to its step');
  }
}
