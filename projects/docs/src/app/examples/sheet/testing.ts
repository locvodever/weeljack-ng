import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjSheetHarness } from 'weeljack-ng/sheet/testing';

/** Saves the "Rename item" sheet in the fixture `loader` was made from, and names its mode. */
export async function saveRename(loader: HarnessLoader): Promise<'dialog' | 'drawer'> {
  const sheet = await loader.getHarness(WjSheetHarness.with({ title: 'Rename item' }));
  const mode = await sheet.getMode();

  // The body and the footer are inside the sheet, so its harness reaches the buttons.
  const save = await sheet.getHarness(WjButtonHarness.with({ label: 'Save' }));
  await save.click();
  return mode;
}

/** Clicks the backdrop of the open sheet, as a user does, and says whether it closed. */
export async function dismissWithBackdrop(loader: HarnessLoader): Promise<boolean> {
  const sheet = await loader.getHarness(WjSheetHarness);
  await sheet.clickBackdrop();
  // A drawer closes on its backdrop; a dialog never does.
  return !(await sheet.isOpen());
}
