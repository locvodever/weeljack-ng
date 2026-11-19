import type { HarnessLoader } from '@angular/cdk/testing';
import { WjRadioButtonHarness } from 'weeljack-ng/radiobutton/testing';

/** Checks the radio labelled "Express" in the group named "basic-speed", and returns whether it is checked. */
export async function pickExpress(loader: HarnessLoader): Promise<boolean> {
  const express = await loader.getHarness(
    WjRadioButtonHarness.with({ name: 'basic-speed', label: 'Express' }),
  );
  await express.check();
  return express.isChecked();
}
