import type { HarnessLoader } from '@angular/cdk/testing';
import { WjStepperHarness } from 'weeljack-ng/stepper/testing';

/** Opens the step titled "Preferences" in the fixture `loader` was made from, and reads its panel. */
export async function readPreferences(loader: HarnessLoader): Promise<string | null> {
  const stepper = await loader.getHarness(WjStepperHarness);
  const [preferences] = await stepper.getSteps({ title: 'Preferences' });
  await preferences?.select();
  return stepper.getActivePanelText();
}
