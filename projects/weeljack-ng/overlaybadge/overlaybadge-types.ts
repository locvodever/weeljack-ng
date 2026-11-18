import type { OverlayBadgePassThrough } from '@openng/optimus-ui/types/overlaybadge';

/** Colour role of a `wj-overlaybadge`. Left unset, the badge takes the primary (ink) look. */
export type WjOverlayBadgeSeverity =
  'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

/** Size step of the badge: `small` is 20 px tall, `large` 28 px, the default 24 px. */
export type WjOverlayBadgeSize = 'small' | 'large';

/**
 * Pass-through for `wj-overlaybadge`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjOverlayBadgePt = OverlayBadgePassThrough;
