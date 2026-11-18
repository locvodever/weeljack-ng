import type { BadgePassThrough } from '@openng/optimus-ui/types/badge';

/** Colour role of a `wj-badge`. Left unset, the badge takes the primary (ink) look. */
export type WjBadgeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

/** Size step of a `wj-badge`: `small` is 20 px tall, `large` 28 px, the default 24 px. */
export type WjBadgeSize = 'small' | 'large';

/**
 * Pass-through for `wj-badge`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjBadgePt = BadgePassThrough;
