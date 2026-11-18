import type { GalleriaPassThrough } from '@openng/optimus-ui/types/galleria';

/**
 * Pass-through for `wj-galleria`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjGalleriaPt = GalleriaPassThrough;

/**
 * What a `wjGalleriaItem` template sees. `let-photo` is the item shown. `T` is the item type: give
 * the slot `[wjGalleriaItemOf]` to have it inferred from your items.
 */
export interface WjGalleriaItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
}

/** What a `wjGalleriaCaption` template sees. `let-photo` is the item shown. */
export interface WjGalleriaCaptionContext<T = unknown> {
  /** The item. */
  $implicit: T;
}
