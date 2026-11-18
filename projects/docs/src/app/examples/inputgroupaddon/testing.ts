import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjInputGroupAddonHarness } from 'weeljack-ng/inputgroupaddon/testing';

/** Finds the addon that holds "Subscribe", clicks its button, and returns the addon's text. */
export async function subscribe(loader: HarnessLoader): Promise<string> {
  const addon = await loader.getHarness(WjInputGroupAddonHarness.with({ text: 'Subscribe' }));
  const button = await addon.getHarness(WjButtonHarness);
  await button.click();
  return addon.getText();
}
