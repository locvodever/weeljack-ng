import type { TagPassThrough } from '@openng/optimus-ui/tag';

/** Colour role of a `wj-tag`. Left unset, the tag takes the primary (ink) look. */
export type WjTagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

/**
 * Pass-through for `wj-tag`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTagPt = TagPassThrough;
