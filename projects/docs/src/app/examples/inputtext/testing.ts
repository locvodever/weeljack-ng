import type { HarnessLoader } from '@angular/cdk/testing';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';

/** Types `name` into the input whose placeholder is "Full name", and returns what it now holds. */
export async function typeName(loader: HarnessLoader, name: string): Promise<string> {
  const input = await loader.getHarness(WjInputTextHarness.with({ placeholder: 'Full name' }));
  await input.setValue(name);
  return input.getValue();
}
