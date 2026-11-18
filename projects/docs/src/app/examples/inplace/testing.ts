import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjInplaceHarness } from 'weeljack-ng/inplace/testing';

/** Opens the inplace showing "Mara Ellis", saves from its editor, and tells whether it closed. */
export async function saveDisplayName(loader: HarnessLoader): Promise<boolean> {
  const inplace = await loader.getHarness(WjInplaceHarness.with({ displayText: 'Mara Ellis' }));
  await inplace.activate();
  const save = await inplace.getHarness(WjButtonHarness.with({ label: 'Save' }));
  await save.click();
  return !(await inplace.isActive());
}
