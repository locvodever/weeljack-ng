import type { HarnessLoader } from '@angular/cdk/testing';
import { WjMessageHarness } from 'weeljack-ng/message/testing';

/** Reads how the "Upload failed" message is announced: `alert` or `status`. */
export async function readUploadRole(loader: HarnessLoader): Promise<'alert' | 'status'> {
  const message = await loader.getHarness(WjMessageHarness.with({ text: /^Upload failed/ }));
  return message.getRole();
}

/** Closes the closable "Filters remembered" message and says whether it is hidden yet. */
export async function closeFilters(loader: HarnessLoader): Promise<boolean> {
  const message = await loader.getHarness(WjMessageHarness.with({ text: /^Filters remembered/ }));
  await message.close();
  // Hidden once the leave motion has ended (at once under reduced motion): poll it, don't read it once.
  return message.isClosed();
}
