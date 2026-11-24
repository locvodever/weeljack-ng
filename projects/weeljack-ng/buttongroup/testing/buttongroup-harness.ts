import { ComponentHarness } from '@angular/cdk/testing';
import { WjButtonHarness, type WjButtonHarnessFilters } from 'weeljack-ng/button/testing';

/**
 * Test harness for `wj-buttongroup`. It hands back the buttons inside the group as
 * `WjButtonHarness`es, so a spec drives each one the way it drives a lone button, and reads the
 * group's name.
 */
export class WjButtonGroupHarness extends ComponentHarness {
  static hostSelector = 'wj-buttongroup';

  private readonly group = this.locatorFor('[role="group"]');

  /** The buttons in the group, in order, narrowed by `filters` (for example by `label`). */
  getButtons(filters: WjButtonHarnessFilters = {}): Promise<WjButtonHarness[]> {
    return this.locatorForAll(WjButtonHarness.with(filters))();
  }

  /** The group's `aria-label`, or `null` when it has none. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.group()).getAttribute('aria-label');
  }

  /** The id list in the group's `aria-labelledby`, or `null` when it has none. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.group()).getAttribute('aria-labelledby');
  }
}
