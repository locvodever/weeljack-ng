import type { HarnessLoader } from '@angular/cdk/testing';
import { WjInputMaskHarness } from 'weeljack-ng/inputmask/testing';

/**
 * Types `digits` into the input whose placeholder is "(555) 555-0123", and returns the masked text.
 * Focus first and wait for the mask to show: Optimus places the caret from a timer after focus.
 */
export async function typePhone(loader: HarnessLoader, digits: string): Promise<string> {
  const input = await loader.getHarness(WjInputMaskHarness.with({ placeholder: '(555) 555-0123' }));
  await input.focus();
  await input.typeText(digits);
  return input.getValue();
}
