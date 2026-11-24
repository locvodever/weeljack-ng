import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSliderHarness } from 'weeljack-ng/slider/testing';

/** Raises the slider labelled "Volume" by three steps and a page, and returns the value it shows. */
export async function raiseVolume(loader: HarnessLoader): Promise<number> {
  const slider = await loader.getHarness(WjSliderHarness.with({ ariaLabel: 'Volume' }));
  await slider.stepUp(3);
  await slider.pageUp();
  return slider.getValue();
}
