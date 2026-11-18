import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/**
 * Test harness for `wj-blockui`. Describes the block as a user meets it: whether it is blocked,
 * whether the region behind it is busy and out of reach of the keyboard, and what the mask says.
 * Optimus moves its mask out of the host, onto the target or the page, so everything is read from
 * the document root through the `data-wj-blockui` hook the host and the mask share.
 */
export class WjBlockUIHarness extends ComponentHarness {
  static hostSelector = 'wj-blockui';

  private readonly root = this.documentRootLocatorFactory();

  private async hook(): Promise<string> {
    return (await (await this.host()).getAttribute('data-wj-blockui')) ?? '';
  }

  private async selector(): Promise<string> {
    return `.p-blockui[data-wj-blockui="${await this.hook()}"]`;
  }

  private async mask(): Promise<TestElement> {
    return this.root.locatorFor(await this.selector())();
  }

  /** Whether the region is covered. Turns false as soon as the unblock starts. */
  async isBlocked(): Promise<boolean> {
    return (await (await this.mask()).getAttribute('aria-busy')) === 'true';
  }

  /** Whether the region (the target, or the page's body) says it is busy. */
  async isBusy(): Promise<boolean> {
    const busy = `[aria-busy="true"]:has(> ${await this.selector()})`;
    // The page's region is the root of the document locator, which its own search leaves out.
    return (
      (await this.root.rootElement.matchesSelector(busy)) ||
      (await this.root.locatorForOptional(busy)()) !== null
    );
  }

  /**
   * Whether everything in the region except the mask is out of reach of the keyboard. Only
   * meaningful while blocked: an unblocked mask has no region.
   */
  async isInert(): Promise<boolean> {
    const mask = await this.selector();
    return (
      (await this.root.locatorForOptional(`:has(> ${mask}) > :not(${mask}):not([inert])`)()) ===
      null
    );
  }

  /** The text on the mask: what the app projected into `wj-blockui`. */
  async getMaskText(): Promise<string> {
    return (await this.mask()).text();
  }
}
