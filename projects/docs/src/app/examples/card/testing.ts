import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjCardHarness } from 'weeljack-ng/card/testing';

/** Clicks "Book" in the footer of the card titled "Lakeside cabin", and returns its subtitle. */
export async function bookTheCabin(loader: HarnessLoader): Promise<string> {
  const card = await loader.getHarness(WjCardHarness.with({ title: 'Lakeside cabin' }));
  const book = await card.getHarness(WjButtonHarness.with({ label: 'Book' }));
  await book.click();
  return card.getSubtitle();
}
