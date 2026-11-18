import type { HarnessLoader } from '@angular/cdk/testing';
import { WjProgressSpinnerHarness } from 'weeljack-ng/progressspinner/testing';

/** Reads how the first spinner in the fixture `loader` was made from is named, and whether it is busy. */
export async function readSpinner(
  loader: HarnessLoader,
): Promise<{ name: string | null; labelledBy: string | null; busy: boolean }> {
  const spinner = await loader.getHarness(WjProgressSpinnerHarness);
  const { label, labelledBy } = await spinner.getAriaAttributes();
  return { name: label, labelledBy, busy: await spinner.isBusy() };
}
