/**
 * The poll ceiling for a wait that ends only when the browser draws frames: an Optimus motion that
 * starts after `requestAnimationFrame`, the tooltip's fade (one opacity step per frame), a leave
 * that ends on `animationend`. A poll's default second is plenty on a quiet machine, but with
 * several browser test runs at once a page can go more than a second without a frame (the tooltip
 * fade was caught stopped at 0.396). This is a ceiling, not a wait: the poll still returns as soon
 * as its state is reached, as `scroller.spec.ts`'s `SCROLL` does for a smooth scroll.
 */
export const FRAMES: { readonly timeout: number } = { timeout: 5000 };
