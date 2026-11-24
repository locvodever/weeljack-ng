import type { InputNumberPassThrough } from '@openng/optimus-ui/types/inputnumber';

/** Height step of a `wj-inputnumber`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjInputNumberSize = 'small' | 'large';

/** How the number is shown: a plain `decimal`, or a `currency` amount that needs `currency`. */
export type WjInputNumberMode = 'decimal' | 'currency';

/**
 * Pass-through for `wj-inputnumber`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjInputNumberPt = InputNumberPassThrough;
