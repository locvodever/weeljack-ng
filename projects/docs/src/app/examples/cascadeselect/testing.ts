import type { HarnessLoader } from '@angular/cdk/testing';
import { WjCascadeSelectHarness } from 'weeljack-ng/cascadeselect/testing';

/**
 * Picks Melbourne in the cascade select named "City", by its path of labels, and returns the text
 * the control then shows.
 */
export async function pickMelbourne(loader: HarnessLoader): Promise<string> {
  const city = await loader.getHarness(WjCascadeSelectHarness.with({ ariaLabel: 'City' }));
  // Opens the list and each group on the way, then clicks the leaf.
  await city.selectOption(['Australia', 'Victoria', 'Melbourne']);
  return city.getText();
}
