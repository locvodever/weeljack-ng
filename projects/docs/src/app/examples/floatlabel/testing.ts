import type { HarnessLoader } from '@angular/cdk/testing';
import { WjFloatLabelHarness } from 'weeljack-ng/floatlabel/testing';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';

/** Types an address into the control of the float label named "Email", and returns both. */
export async function typeEmail(loader: HarnessLoader, address: string): Promise<string> {
  const floatLabel = await loader.getHarness(WjFloatLabelHarness.with({ label: 'Email' }));
  const input = await floatLabel.getHarness(WjInputTextHarness);
  await input.setValue(address);
  return `${await floatLabel.getLabel()}: ${await input.getValue()}`;
}
