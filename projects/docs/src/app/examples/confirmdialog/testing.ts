import type { HarnessLoader } from '@angular/cdk/testing';
import { WjConfirmDialogHarness } from 'weeljack-ng/confirmdialog/testing';

/**
 * Reads the question the open confirm dialog asks, accepts it, and returns the question. The
 * fixture `loader` was made from holds the app shell with its one `wj-confirmdialog`.
 */
export async function acceptQuestion(loader: HarnessLoader): Promise<string> {
  const dialog = await loader.getHarness(WjConfirmDialogHarness);
  const message = await dialog.getMessage();
  await dialog.accept();
  return message;
}
