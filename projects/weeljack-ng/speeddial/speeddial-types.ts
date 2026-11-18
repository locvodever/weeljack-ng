import type { SpeedDialPassThrough } from '@openng/optimus-ui/types/speeddial';
import type { WjMenuItem } from 'weeljack-ng';

/**
 * The side the actions open toward. The four diagonals are for `quarter-circle` only. Directions
 * are physical: they are not mirrored in right-to-left pages.
 */
export type WjSpeedDialDirection =
  'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

/** How the actions are laid out: in a line, or around the toggle on a circle, half or quarter of one. */
export type WjSpeedDialType = 'linear' | 'circle' | 'semi-circle' | 'quarter-circle';

/**
 * Pass-through for `wj-speeddial`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSpeedDialPt = SpeedDialPassThrough;

/** What a `wjSpeedDialItem` template sees for each action. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjSpeedDialItemContext = {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
};
