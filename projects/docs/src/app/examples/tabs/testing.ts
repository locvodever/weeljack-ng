import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTabsHarness } from 'weeljack-ng/tabs/testing';

/** Opens the tab labelled "Specifications" in the fixture `loader` was made from, and reads its panel. */
export async function readSpecifications(loader: HarnessLoader): Promise<string | null> {
  const tabs = await loader.getHarness(WjTabsHarness);
  const [specifications] = await tabs.getTabs({ label: 'Specifications' });
  await specifications?.select();
  return tabs.getSelectedPanelText();
}
