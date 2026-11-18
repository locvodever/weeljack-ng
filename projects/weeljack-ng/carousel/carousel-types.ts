import type { CarouselPassThrough } from '@openng/optimus-ui/types/carousel';

/**
 * Pass-through for `wj-carousel`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjCarouselPt = CarouselPassThrough;

/** How many slides show and scroll while the window is at most `breakpoint` wide. */
export interface WjCarouselResponsiveOption {
  /** The widest window the option applies to, as a CSS length such as `'1024px'`. */
  breakpoint: string;
  /** Slides shown at once. */
  numVisible: number;
  /** Slides a page change moves. */
  numScroll: number;
}

/**
 * What a `wjCarouselItem` template sees for each slide. `let-product` is the item. `T` is the item
 * type: give the slot `[wjCarouselItemOf]` to have it inferred from your items.
 */
export interface WjCarouselItemContext<T = unknown> {
  /** The item. */
  $implicit: T;
}
