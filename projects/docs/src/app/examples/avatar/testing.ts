import type { HarnessLoader } from '@angular/cdk/testing';
import { WjAvatarHarness } from 'weeljack-ng/avatar/testing';

/** Reads the name of the avatar showing the initials "AL" in the fixture `loader` was made from. */
export async function readAnaName(loader: HarnessLoader): Promise<string | null> {
  const avatar = await loader.getHarness(WjAvatarHarness.with({ label: 'AL' }));
  return avatar.getAriaLabel();
}
