import type { AutoCompletePassThrough } from '@openng/optimus-ui/types/autocomplete';

/** Height step of a `wj-autocomplete`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjAutoCompleteSize = 'small' | 'large';

/**
 * Pass-through for `wj-autocomplete`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjAutoCompletePt = AutoCompletePassThrough;
