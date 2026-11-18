import type { HarnessLoader } from '@angular/cdk/testing';
import { WjCarouselHarness } from 'weeljack-ng/carousel/testing';

/**
 * Pages the carousel named "Featured products" to its last page in the fixture `loader` was made
 * from, and returns the text of the slides on screen. Pages count from 0.
 */
export async function lastPage(loader: HarnessLoader): Promise<string[]> {
  const carousel = await loader.getHarness(
    WjCarouselHarness.with({ ariaLabel: 'Featured products' }),
  );
  await carousel.goToPage((await carousel.getPageCount()) - 1);
  return carousel.getVisibleItemTexts(); // the last product
}

/** Steps the same carousel forward and back with its buttons and reports the page it is on. */
export async function stepBack(loader: HarnessLoader): Promise<number> {
  const carousel = await loader.getHarness(
    WjCarouselHarness.with({ ariaLabel: 'Featured products' }),
  );
  await carousel.next();
  await carousel.previous();
  return carousel.getPage(); // 0 again
}
