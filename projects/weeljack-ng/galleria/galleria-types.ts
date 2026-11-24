import type { GalleriaPassThrough } from '@openng/optimus-ui/types/galleria';

/**
 * Pass-through for `wj-galleria`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjGalleriaPt = GalleriaPassThrough;

/** Where the thumbnail strip sits: below the item or above it. */
export type WjGalleriaThumbnailsPosition = 'bottom' | 'top';

/** How many thumbnails show while the window is at most `breakpoint` wide. */
export interface WjGalleriaResponsiveOption {
  /** The widest window the option applies to, as a CSS length such as `'1024px'`. */
  breakpoint: string;
  /** Thumbnails shown at once. */
  numVisible: number;
}

/**
 * What a `wjGalleriaItem` template sees. `let-photo` is the item shown. `T` is the item type: give
 * the slot `[wjGalleriaItemOf]` to have it inferred from your items.
 */
export interface WjGalleriaItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
}

/** What a `wjGalleriaThumbnail` template sees for each thumbnail. `let-photo` is its item. */
export interface WjGalleriaThumbnailContext<T = unknown> {
  /** The item. */
  $implicit: T;
}

/** What a `wjGalleriaCaption` template sees. `let-photo` is the item shown. */
export interface WjGalleriaCaptionContext<T = unknown> {
  /** The item. */
  $implicit: T;
}
