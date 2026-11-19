import type { MultiSelectPassThrough } from '@openng/optimus-ui/types/multiselect';

/** Height step of a `wj-multiselect`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjMultiSelectSize = 'small' | 'large';

/**
 * Pass-through for `wj-multiselect`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjMultiSelectPt = MultiSelectPassThrough;
