import type { TreeSelectPassThrough } from '@openng/optimus-ui/types/treeselect';

/** Height step of a `wj-treeselect`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjTreeSelectSize = 'small' | 'large';

/**
 * Pass-through for `wj-treeselect`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTreeSelectPt = TreeSelectPassThrough;
