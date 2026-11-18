import { ContentContainerComponentHarness } from '@angular/cdk/testing';
import { WjInputGroupAddonHarness } from 'weeljack-ng/inputgroupaddon/testing';

/**
 * Test harness for `wj-inputgroup`. Reach the controls inside it with the inherited `getHarness`
 * and `getAllHarnesses`, for example `group.getHarness(WjSelectHarness)` or
 * `group.getHarness(WjInputGroupAddonHarness.with({ text: '$' }))`, and ask how many addons it
 * holds and what they say.
 */
export class WjInputGroupHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-inputgroup';

  private readonly addons = this.locatorForAll(WjInputGroupAddonHarness);

  /** How many addons the group holds, before and after its controls. */
  async getAddonCount(): Promise<number> {
    return (await this.addons()).length;
  }

  /** The text of each addon, in order. */
  async getAddonTexts(): Promise<string[]> {
    return Promise.all((await this.addons()).map((addon) => addon.getText()));
  }
}
