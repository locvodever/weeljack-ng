import type { SelectButtonPassThrough } from '@openng/optimus-ui/types/selectbutton';

/** Height step of a `wj-selectbutton`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjSelectButtonSize = 'small' | 'large';

/**
 * Pass-through for `wj-selectbutton`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSelectButtonPt = SelectButtonPassThrough;
