import type { ScrollTopPassThrough } from '@openng/optimus-ui/types/scrolltop';

/** How a press scrolls the window to the top: `smooth` glides, `auto` jumps. */
export type WjScrollTopBehavior = 'smooth' | 'auto';

/**
 * Pass-through for `wj-scrolltop`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjScrollTopPt = ScrollTopPassThrough;
