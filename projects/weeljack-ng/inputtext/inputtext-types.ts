import type { InputTextPassThrough } from '@openng/optimus-ui/types/inputtext';

/** Height step of an `input[wjInputText]`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjInputTextSize = 'small' | 'large';

/**
 * Pass-through for `input[wjInputText]`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this directive's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjInputTextPt = InputTextPassThrough;
