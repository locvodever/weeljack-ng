import { ComponentHarness } from '@angular/cdk/testing';

/** Test harness for `wj-scrolltop`. Describes the button as a reader meets it. */
export class WjScrollTopHarness extends ComponentHarness {
  static hostSelector = 'wj-scrolltop';

  private readonly button = this.locatorForOptional('button');

  /** Whether the button is on screen: the window is past `threshold`. */
  async isShown(): Promise<boolean> {
    return (await this.button()) !== null;
  }

  /** The accessible name of the button, or `''` while it is not shown. */
  async getLabel(): Promise<string> {
    return (await (await this.button())?.getAttribute('aria-label')) ?? '';
  }

  /** Presses the button, which scrolls the window to the top. Does nothing while it is not shown. */
  async activate(): Promise<void> {
    await (await this.button())?.click();
  }
}
