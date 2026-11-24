import type { HarnessLoader } from '@angular/cdk/testing';
import { WjToggleSwitchHarness } from 'weeljack-ng/toggleswitch/testing';

/** Turns on the switch named "Show prices with tax" and returns whether it is now on. */
export async function showPricesWithTax(loader: HarnessLoader): Promise<boolean> {
  const tax = await loader.getHarness(
    WjToggleSwitchHarness.with({ ariaLabel: 'Show prices with tax' }),
  );
  await tax.check();
  return tax.isChecked();
}
