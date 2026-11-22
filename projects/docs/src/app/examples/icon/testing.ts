import type { HarnessLoader } from '@angular/cdk/testing';
import { WjIconHarness } from 'weeljack-ng/icon/testing';

/** The accessible name of the icon called `triangle-exclamation-point`, or `null` if decorative. */
export async function warningLabel(loader: HarnessLoader): Promise<string | null> {
  const icon = await loader.getHarness(WjIconHarness.with({ name: 'triangle-exclamation-point' }));
  return icon.getLabel();
}
