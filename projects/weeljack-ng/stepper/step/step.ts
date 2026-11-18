import { Component, TemplateRef, booleanAttribute, input, viewChild } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjStepPt, WjStepperValue } from '../stepper-types';

// A part is a declaration (PRD FR-3): `<ng-content />` sits inside an `ng-template`, so the
// projected title moves to the one place `wj-stepper` stamps the template. The host is projected
// only so it reaches the prerendered HTML (check:ssr), and `hidden` keeps it out of the layout.

/**
 * One step of a `wj-step-list`: its content is the step's title. Keep it to a word or two of text.
 * A part renders nothing itself: `wj-stepper` reads its inputs and draws the step.
 */
@Component({
  selector: 'wj-step',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjStep {
  /** Identifies the step and pairs it with the `wj-step-panel` of the same value. Unique. */
  readonly value = input.required<WjStepperValue>();
  /** Makes the step inert: it cannot be activated and takes no focus. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the step's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjStepPt>();
  /** The projected title, as a template `wj-stepper` stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    _checkWeeljackSetup('wj-step');
    _checkAriaOnHost('wj-step', 'Remove it: the step is named by its own text');
  }
}
