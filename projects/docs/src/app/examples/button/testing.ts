import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';

/** Clicks the button labelled "Save" in the fixture `loader` was made from. */
export async function clickSave(loader: HarnessLoader): Promise<void> {
  const save = await loader.getHarness(WjButtonHarness.with({ label: 'Save' }));
  await save.click();
}
