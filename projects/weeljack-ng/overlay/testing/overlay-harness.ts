import { ContentContainerComponentHarness, TestKey } from '@angular/cdk/testing';

const PANEL = '.p-overlay-content';

/**
 * Test harness for `wj-overlay`. Describes the overlay as a user meets it: whether the panel is
 * open, and closing it with Escape or a click outside. The panel renders inside the host, so
 * `getHarness(...)` finds the harnesses of whatever the app put in it. A closed overlay renders
 * nothing, so everything but {@link isOpen} throws until it opens.
 */
export class WjOverlayHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-overlay';

  private readonly panel = this.locatorFor(PANEL);
  private readonly maybePanel = this.locatorForOptional(PANEL);

  /** Whether the panel is on the page. An overlay that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybePanel()) !== null;
  }

  /** Presses Escape: the overlay closes. */
  async close(): Promise<void> {
    await (await this.panel()).sendKeys(TestKey.ESCAPE);
  }

  /** Clicks outside the panel, on the page: the overlay closes. */
  async closeByClickingOutside(): Promise<void> {
    await this.documentRootLocatorFactory().rootElement.click(0, 0);
  }
}
