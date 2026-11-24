import type { HarnessLoader } from '@angular/cdk/testing';
import { WjConfirmPopupHarness } from 'weeljack-ng/confirmpopup/testing';

/**
 * Reads the question the open confirm popup asks, accepts it, and returns the question. The
 * fixture `loader` was made from holds the app shell with its one `wj-confirmpopup`.
 */
export async function acceptQuestion(loader: HarnessLoader): Promise<string> {
  const popup = await loader.getHarness(WjConfirmPopupHarness);
  const message = await popup.getMessage();
  await popup.accept();
  return message;
}
