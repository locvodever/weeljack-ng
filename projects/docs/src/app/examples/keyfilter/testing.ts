import type { HarnessLoader } from '@angular/cdk/testing';
import { WjKeyFilterHarness } from 'weeljack-ng/keyfilter/testing';

/**
 * Types `text` into the input whose placeholder is "Quantity", and returns what it now holds: only
 * the characters the filter accepted.
 */
export async function typeQuantity(loader: HarnessLoader, text: string): Promise<string> {
  const input = await loader.getHarness(WjKeyFilterHarness.with({ placeholder: 'Quantity' }));
  await input.typeText(text);
  return input.getValue();
}
