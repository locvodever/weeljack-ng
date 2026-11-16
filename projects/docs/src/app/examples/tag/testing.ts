import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTagHarness } from 'weeljack-ng/tag/testing';

/** Reads the text of the tag whose value is "Paid" in the fixture `loader` was made from. */
export async function readPaidTag(loader: HarnessLoader): Promise<string> {
  const tag = await loader.getHarness(WjTagHarness.with({ value: 'Paid' }));
  return tag.getValue();
}
