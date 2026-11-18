import type { InputTextPassThrough } from '@openng/optimus-ui/types/inputtext';

/** Height step of an `input[wjInputMask]`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjInputMaskSize = 'small' | 'large';

/**
 * Pass-through for `input[wjInputMask]`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this directive's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjInputMaskPt = InputTextPassThrough;
