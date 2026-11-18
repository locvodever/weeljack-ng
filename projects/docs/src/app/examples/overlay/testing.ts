import type { HarnessLoader } from '@angular/cdk/testing';
import { WjOverlayHarness } from 'weeljack-ng/overlay/testing';

/**
 * Reports whether the overlay in the fixture `loader` was made from is open. A closed overlay
 * renders nothing, so open it from its trigger first.
 */
export async function isOpen(loader: HarnessLoader): Promise<boolean> {
  const overlay = await loader.getHarness(WjOverlayHarness);
  return overlay.isOpen();
}

/** Presses Escape in the open overlay, as a user does, and says whether it closed. */
export async function dismiss(loader: HarnessLoader): Promise<boolean> {
  const overlay = await loader.getHarness(WjOverlayHarness);
  await overlay.close();
  return !(await overlay.isOpen());
}

/** Clicks outside the open overlay, on the page, and says whether it closed. */
export async function clickAway(loader: HarnessLoader): Promise<boolean> {
  const overlay = await loader.getHarness(WjOverlayHarness);
  await overlay.closeByClickingOutside();
  return !(await overlay.isOpen());
}
