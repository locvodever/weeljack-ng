import type { InputIconPassThrough } from '@openng/optimus-ui/types/inputicon';

/**
 * Pass-through for `wj-inputicon`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
 * to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjInputIconPt = InputIconPassThrough;
