import type { ToggleButtonPassThrough } from '@openng/optimus-ui/types/togglebutton';

/** Height step of a `wj-togglebutton`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjToggleButtonSize = 'small' | 'large';

/**
 * Pass-through for `wj-togglebutton`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjToggleButtonPt = ToggleButtonPassThrough;
