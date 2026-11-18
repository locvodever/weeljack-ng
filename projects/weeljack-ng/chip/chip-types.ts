import type { ChipPassThrough } from '@openng/optimus-ui/chip';

/**
 * Pass-through for `wj-chip`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjChipPt = ChipPassThrough;
