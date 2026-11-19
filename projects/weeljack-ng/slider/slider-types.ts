import type { SliderPassThrough } from '@openng/optimus-ui/types/slider';

/** The direction a slider runs in. A vertical slider needs a height on its host. */
export type WjSliderOrientation = 'horizontal' | 'vertical';

/**
 * Pass-through for `wj-slider`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSliderPt = SliderPassThrough;
