import type { HarnessLoader } from '@angular/cdk/testing';
import { WjScrollerHarness } from 'weeljack-ng/scroller/testing';

/** Scrolls the scroller named "Ten thousand items" to its middle and returns the items now in view. */
export async function readTheMiddle(loader: HarnessLoader): Promise<string[]> {
  const scroller = await loader.getHarness(WjScrollerHarness.with({ name: 'Ten thousand items' }));
  await scroller.scrollToOffset(48 * 5000);
  // Only the window Optimus renders: the items in view and a few either side, not all 10,000.
  return scroller.getRenderedItemTexts(); // includes "Item 5,001"
}

/** Reads whether the lazy scroller is still waiting for its items. */
export async function isWaiting(loader: HarnessLoader): Promise<boolean> {
  const scroller = await loader.getHarness(WjScrollerHarness.with({ name: /as you scroll/ }));
  return scroller.isLoading();
}
