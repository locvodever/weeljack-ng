import type { SplitterPassThrough } from '@openng/optimus-ui/types/splitter';

/**
 * Which way a `wj-splitter` lays its panels out: `horizontal` puts them side by side, `vertical`
 * stacks them.
 */
export type WjSplitterOrientation = 'horizontal' | 'vertical';

/** What `resizeEnd` carries once a resize is done. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjSplitterResizeEvent = {
  /** Each panel's share in percent, in panel order. */
  sizes: number[];
};

/**
 * Pass-through for `wj-splitter`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSplitterPt = SplitterPassThrough;
