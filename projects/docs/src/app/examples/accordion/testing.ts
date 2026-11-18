import type { HarnessLoader } from '@angular/cdk/testing';
import { WjAccordionPanelHarness } from 'weeljack-ng/accordion/testing';

/** Opens the panel headed "Returns" in the fixture `loader` was made from, and reads its text. */
export async function readReturns(loader: HarnessLoader): Promise<string> {
  const returns = await loader.getHarness(WjAccordionPanelHarness.with({ headerText: 'Returns' }));
  await returns.toggle();
  return returns.getContentText();
}
