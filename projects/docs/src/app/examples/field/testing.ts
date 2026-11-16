import type { HarnessLoader } from '@angular/cdk/testing';
import { WjFieldHarness } from 'weeljack-ng/field/testing';

/** The error text of the field labelled "Delivery speed", or `null` while it shows none. */
export async function deliverySpeedError(loader: HarnessLoader): Promise<string | null> {
  const field = await loader.getHarness(WjFieldHarness.with({ label: 'Delivery speed' }));
  return field.getError();
}
