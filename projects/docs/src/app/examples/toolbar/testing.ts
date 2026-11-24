import type { HarnessLoader } from '@angular/cdk/testing';
import { WjToolbarHarness } from 'weeljack-ng/toolbar/testing';

/** Reads the end section and the accessible name of the toolbar in the fixture `loader` was made from. */
export async function readToolbar(
  loader: HarnessLoader,
): Promise<{ end: string | null; name: string | null }> {
  const toolbar = await loader.getHarness(WjToolbarHarness);
  return { end: await toolbar.getEndText(), name: await toolbar.getAriaLabel() };
}
