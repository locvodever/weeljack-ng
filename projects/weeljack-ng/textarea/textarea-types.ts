import type { TextareaPassThrough } from '@openng/optimus-ui/types/textarea';

/** Size step of a `textarea[wjTextarea]`'s padding and text, `small` or `large`. `rows` sets the height. */
export type WjTextareaSize = 'small' | 'large';

/**
 * Pass-through for `textarea[wjTextarea]`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this directive's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTextareaPt = TextareaPassThrough;
