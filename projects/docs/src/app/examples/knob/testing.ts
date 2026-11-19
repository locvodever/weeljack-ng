import type { HarnessLoader } from '@angular/cdk/testing';
import { WjKnobHarness } from 'weeljack-ng/knob/testing';

/** Raises the knob labelled "Volume" by three steps and a page, and returns the text it shows. */
export async function raiseVolume(loader: HarnessLoader): Promise<string | null> {
  const knob = await loader.getHarness(WjKnobHarness.with({ ariaLabel: 'Volume' }));
  await knob.stepUp(3);
  await knob.pageUp();
  return knob.getShownText();
}
