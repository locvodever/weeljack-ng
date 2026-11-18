import type {
  StepListPassThrough,
  StepPanelPassThrough,
  StepPanelsPassThrough,
  StepPassThrough,
  StepperPassThrough,
} from '@openng/optimus-ui/types/stepper';

/**
 * The value of one `wj-step` and its `wj-step-panel`, and what the `wj-stepper` `value` holds.
 * Optimus shows it as the step's number, so values run 1, 2, 3 and so on. Unique.
 */
export type WjStepperValue = number;

/**
 * Pass-through for `wj-stepper`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjStepperPt = StepperPassThrough;

/**
 * Pass-through for `wj-step-list`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjStepListPt = StepListPassThrough;

/**
 * Pass-through for `wj-step`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjStepPt = StepPassThrough;

/**
 * Pass-through for `wj-step-panels`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjStepPanelsPt = StepPanelsPassThrough;

/**
 * Pass-through for `wj-step-panel`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjStepPanelPt = StepPanelPassThrough;
