import type { HarnessLoader } from '@angular/cdk/testing';
import { WjAvatarGroupHarness } from 'weeljack-ng/avatargroup/testing';

/** Reads the name of each avatar in the group in the fixture `loader` was made from, in order. */
export async function readGroupNames(loader: HarnessLoader): Promise<(string | null)[]> {
  const group = await loader.getHarness(WjAvatarGroupHarness);
  // Each avatar comes back as a `WjAvatarHarness`: the label, the photo, the name, the size.
  const avatars = await group.getAvatars();
  return Promise.all(avatars.map((avatar) => avatar.getAriaLabel()));
}
