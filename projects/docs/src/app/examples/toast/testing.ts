import type { HarnessLoader } from '@angular/cdk/testing';
import { WjToastHarness } from 'weeljack-ng/toast/testing';

/** Reads the summaries of the open error messages in the fixture `loader` was made from. */
export async function readErrors(loader: HarnessLoader): Promise<string[]> {
  const toast = await loader.getHarness(WjToastHarness);
  const errors = await toast.getMessages({ severity: 'error' });
  return Promise.all(errors.map((message) => message.getSummary()));
}
