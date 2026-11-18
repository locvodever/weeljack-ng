import type { HarnessLoader } from '@angular/cdk/testing';
import { WjBlockUIHarness } from 'weeljack-ng/blockui/testing';

/**
 * Says whether the block UI in the fixture `loader` was made from is fully on: the mask is up,
 * the region is busy, and nothing in it can be reached by the keyboard.
 */
export async function isCovered(loader: HarnessLoader): Promise<boolean> {
  const block = await loader.getHarness(WjBlockUIHarness);
  return (await block.isBlocked()) && (await block.isBusy()) && (await block.isInert());
}

/** Reads the message on the mask, or an empty string once it has left. */
export async function maskMessage(loader: HarnessLoader): Promise<string> {
  const block = await loader.getHarness(WjBlockUIHarness);
  return (await block.isBlocked()) ? block.getMaskText() : '';
}
