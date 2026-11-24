import type { HarnessLoader } from '@angular/cdk/testing';
import { WjIftaLabelHarness } from 'weeljack-ng/iftalabel/testing';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';

/** Types an address into the control of the ifta label named "Email", and returns both. */
export async function typeEmail(loader: HarnessLoader, address: string): Promise<string> {
  const iftaLabel = await loader.getHarness(WjIftaLabelHarness.with({ label: 'Email' }));
  const input = await iftaLabel.getHarness(WjInputTextHarness);
  await input.setValue(address);
  return `${await iftaLabel.getLabel()}: ${await input.getValue()}`;
}
