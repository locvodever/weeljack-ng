import type { ProgressBarPassThrough } from '@openng/optimus-ui/types/progressbar';

/** How a `wj-progressbar` shows progress: a fill to `value` percent, or a sweep for work of unknown length. */
export type WjProgressBarMode = 'determinate' | 'indeterminate';

/**
 * Pass-through for `wj-progressbar`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjProgressBarPt = ProgressBarPassThrough;
