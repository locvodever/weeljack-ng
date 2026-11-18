import { Component, computed, contentChildren, input } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjStep } from '../step/step';
import type { WjStepListPt } from '../stepper-types';

/**
 * The row of steps of a `wj-stepper`: its `wj-step` children, in order. It is the tab list. A part
 * renders nothing itself: `wj-stepper` reads its `pt` and draws the row.
 */
@Component({
  selector: 'wj-step-list',
  template: '<ng-content select="wj-step" />',
  host: { hidden: '' },
})
export class WjStepList {
  /**
   * Pass-through for the step list's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjStepListPt>();
  /** The `wj-step` children, in declaration order. @docs-private */
  readonly steps = contentChildren(WjStep);
  /** `pt` plus `role="tablist"`, moved here from the stepper's root, which holds the panels too. @docs-private */
  readonly routedPt = computed<WjStepListPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { role: 'tablist' }),
  );

  constructor() {
    _checkWeeljackSetup('wj-step-list');
    _checkAriaOnHost('wj-step-list', 'Remove it: each step is named by its own text');
  }
}
