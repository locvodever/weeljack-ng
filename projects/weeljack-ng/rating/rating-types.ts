import type { RatingPassThrough } from '@openng/optimus-ui/types/rating';

/**
 * Pass-through for `wj-rating`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjRatingPt = RatingPassThrough;
