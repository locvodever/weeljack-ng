import type { SkeletonPassThrough } from '@openng/optimus-ui/types/skeleton';

/** Outline of a `wj-skeleton`: a rectangle with the content radius, or a circle. */
export type WjSkeletonShape = 'rectangle' | 'circle';

/**
 * Pass-through for `wj-skeleton`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSkeletonPt = SkeletonPassThrough;
