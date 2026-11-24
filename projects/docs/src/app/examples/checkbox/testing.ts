import type { HarnessLoader } from '@angular/cdk/testing';
import { WjCheckboxHarness } from 'weeljack-ng/checkbox/testing';

/** Checks the box named "Accept the terms" and returns whether it is now checked. */
export async function acceptTerms(loader: HarnessLoader): Promise<boolean> {
  const terms = await loader.getHarness(WjCheckboxHarness.with({ ariaLabel: 'Accept the terms' }));
  await terms.check();
  return terms.isChecked();
}
