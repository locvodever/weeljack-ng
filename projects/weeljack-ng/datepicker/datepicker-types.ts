import type { DatePickerPassThrough } from '@openng/optimus-ui/types/datepicker';

/** Height step of a `wj-datepicker` input: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjDatePickerSize = 'small' | 'large';

/**
 * Pass-through for `wj-datepicker`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjDatePickerPt = DatePickerPassThrough;
