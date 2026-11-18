import type { InputOtpPassThrough } from '@openng/optimus-ui/types/inputotp';

/** Size step of a `wj-inputotp`: 40 × 44 px inputs by default, 32 × 36 px `small`, 48 × 52 px `large`. */
export type WjInputOtpSize = 'small' | 'large';

/**
 * Pass-through for `wj-inputotp`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to them
 * ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjInputOtpPt = InputOtpPassThrough;
