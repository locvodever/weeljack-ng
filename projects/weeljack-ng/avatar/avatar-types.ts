import type { AvatarPassThrough } from '@openng/optimus-ui/avatar';

/** Size of a `wj-avatar`: 32 px by default (unset), 48 px `large`, 64 px `xlarge`. */
export type WjAvatarSize = 'large' | 'xlarge';

/** Shape of a `wj-avatar`: a rounded `square` (the default) or a `circle`. */
export type WjAvatarShape = 'square' | 'circle';

/**
 * Pass-through for `wj-avatar`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjAvatarPt = AvatarPassThrough;
