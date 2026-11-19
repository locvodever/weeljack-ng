import type { HarnessLoader } from '@angular/cdk/testing';
import { WjRatingHarness } from 'weeljack-ng/rating/testing';

/** Rates the first empty rating 4 stars, and returns the value it then holds. */
export async function rateFour(loader: HarnessLoader): Promise<number | null> {
  const rating = await loader.getHarness(WjRatingHarness.with({ value: null }));
  await rating.rate(4);
  return rating.getValue();
}
