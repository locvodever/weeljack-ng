import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjDialogHarness } from 'weeljack-ng/dialog/testing';

/** Confirms the "Delete this file?" dialog in the fixture `loader` was made from. */
export async function confirmDelete(loader: HarnessLoader): Promise<string | null> {
  const dialog = await loader.getHarness(WjDialogHarness.with({ title: 'Delete this file?' }));
  const closeLabel = await dialog.getCloseLabel();

  // The body and the footer are inside the dialog, so its harness reaches the buttons.
  const remove = await dialog.getHarness(WjButtonHarness.with({ label: 'Delete' }));
  await remove.click();
  return closeLabel;
}

/** Presses Escape in the open dialog, as a user does, and says whether it closed. */
export async function dismiss(loader: HarnessLoader): Promise<boolean> {
  const dialog = await loader.getHarness(WjDialogHarness);
  await dialog.closeWithEscape();
  return !(await dialog.isOpen());
}
