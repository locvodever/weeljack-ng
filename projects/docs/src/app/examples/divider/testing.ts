import type { HarnessLoader } from '@angular/cdk/testing';
import { WjDividerHarness } from 'weeljack-ng/divider/testing';

/** Returns the orientation and the text of the first divider under `loader`. */
export async function describeDivider(loader: HarnessLoader): Promise<string> {
  const divider = await loader.getHarness(WjDividerHarness);
  return `${await divider.getOrientation()}: ${await divider.getContentText()}`;
}
