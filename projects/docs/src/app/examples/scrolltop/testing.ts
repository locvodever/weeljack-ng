import type { HarnessLoader } from '@angular/cdk/testing';
import { WjScrollTopHarness } from 'weeljack-ng/scrolltop/testing';

/**
 * Reports whether the button is on screen and what it is called, then presses it. Scroll the
 * window past `threshold` first, and poll `isShown()`: the button appears after the scroll event.
 */
export async function readAndPress(
  loader: HarnessLoader,
): Promise<{ shown: boolean; label: string }> {
  const scrollTop = await loader.getHarness(WjScrollTopHarness);
  const state = { shown: await scrollTop.isShown(), label: await scrollTop.getLabel() };
  await scrollTop.activate();
  return state;
}
