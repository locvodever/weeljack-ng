import type { ImagePassThrough } from '@openng/optimus-ui/image';

/** How the browser loads the image: `lazy` waits until it nears the viewport, `eager` loads at once. */
export type WjImageLoading = 'lazy' | 'eager';

/**
 * Pass-through for `wj-image`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjImagePt = ImagePassThrough;
