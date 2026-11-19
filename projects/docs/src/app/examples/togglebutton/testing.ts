import type { HarnessLoader } from '@angular/cdk/testing';
import { WjToggleButtonHarness } from 'weeljack-ng/togglebutton/testing';

/** Turns on the button that now reads "No", and returns the text it then shows. */
export async function turnOn(loader: HarnessLoader): Promise<string> {
  const toggle = await loader.getHarness(WjToggleButtonHarness.with({ text: 'No' }));
  await toggle.check();
  return toggle.getText();
}
