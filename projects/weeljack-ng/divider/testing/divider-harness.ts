import { ComponentHarness } from '@angular/cdk/testing';
import type { WjDividerOrientation } from 'weeljack-ng/divider';

/**
 * Test harness for `wj-divider`. Describes the divider as a user meets it: the direction of its
 * line and the text in it. The orientation comes from `aria-orientation` on the `separator`
 * element, never from a class name.
 */
export class WjDividerHarness extends ComponentHarness {
  static hostSelector = 'wj-divider';

  private readonly separator = this.locatorFor('[role="separator"]');

  /** The direction the line runs: `'horizontal'` or `'vertical'`. */
  async getOrientation(): Promise<WjDividerOrientation> {
    const value = await (await this.separator()).getAttribute('aria-orientation');
    return value === 'vertical' ? 'vertical' : 'horizontal';
  }

  /** The text of the content, trimmed; empty when the divider has none. */
  async getContentText(): Promise<string> {
    return (await (await this.separator()).text()).trim();
  }
}
