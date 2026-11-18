import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjFluidHarness } from 'weeljack-ng/fluid/testing';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';

/** Types a name into the input inside the fluid, presses Save, and returns what was typed. */
export async function saveName(loader: HarnessLoader, name: string): Promise<string> {
  const fluid = await loader.getHarness(WjFluidHarness);
  const input = await fluid.getHarness(WjInputTextHarness);
  await input.setValue(name);
  await (await fluid.getHarness(WjButtonHarness.with({ label: 'Save' }))).click();
  return input.getValue();
}
