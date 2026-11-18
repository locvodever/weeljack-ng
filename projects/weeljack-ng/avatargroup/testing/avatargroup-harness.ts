import { ComponentHarness } from '@angular/cdk/testing';
import { WjAvatarHarness, type WjAvatarHarnessFilters } from 'weeljack-ng/avatar/testing';

/**
 * Test harness for `wj-avatargroup`. It hands back the avatars inside the group as
 * `WjAvatarHarness`es, so a spec reads each one the way it reads a lone avatar.
 */
export class WjAvatarGroupHarness extends ComponentHarness {
  static hostSelector = 'wj-avatargroup';

  /** The avatars in the group, in order, narrowed by `filters` (for example by `label`). */
  getAvatars(filters: WjAvatarHarnessFilters = {}): Promise<WjAvatarHarness[]> {
    return this.locatorForAll(WjAvatarHarness.with(filters))();
  }

  /** How many avatars the group holds (those matching `filters`, when given). */
  async getAvatarCount(filters: WjAvatarHarnessFilters = {}): Promise<number> {
    return (await this.getAvatars(filters)).length;
  }
}
