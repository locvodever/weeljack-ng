import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSpeedDialHarness } from 'weeljack-ng/speeddial/testing';

/** Reads the dial named "Actions" and runs its "Share" action in the fixture `loader` was made from. */
export async function share(loader: HarnessLoader): Promise<string[]> {
  const dial = await loader.getHarness(WjSpeedDialHarness.with({ name: 'Actions' }));
  const names = await dial.getItemLabels(); // ["Edit", "Share", "Download", …]
  // An action is found by its name, which is never drawn. A disabled action runs nothing.
  const [download] = await dial.getItems({ label: 'Download' });
  const canDownload = download !== undefined && !(await download.isDisabled());

  // `clickItem` opens the dial first, as a user must: a closed dial's actions are out of reach.
  await dial.clickItem('Share');
  return canDownload ? names : names.filter((name) => name !== 'Download');
}
