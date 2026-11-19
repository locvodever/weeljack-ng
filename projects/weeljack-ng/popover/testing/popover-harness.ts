import {
  ContentContainerComponentHarness,
  TestKey,
  type HarnessLoader,
} from '@angular/cdk/testing';

/** The panel renders in `document.body`, so it is found from the document root. */
const PANEL = '[role="dialog"][data-wj-popover]';

/**
 * Test harness for `wj-popover`. Describes the popover as a user meets it. The panel is in
 * `document.body`, so everything inside it (`getHarness(WjButtonHarness.with({ label: 'Save' }))`)
 * is found from the document root. A closed popover renders nothing, so everything but
 * {@link isOpen} throws until it opens. With one open popover on the page, the panel it finds is
 * that host's.
 */
export class WjPopoverHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-popover';

  /** The harnesses the app put inside the panel are looked up in the panel, not in the host. */
  protected override async getRootHarnessLoader(): Promise<HarnessLoader> {
    return this.documentRootLocatorFactory().harnessLoaderFor(PANEL);
  }

  private readonly panel = this.documentRootLocatorFactory().locatorFor(PANEL);
  private readonly maybePanel = this.documentRootLocatorFactory().locatorForOptional(PANEL);

  /** Whether the panel is on the page. A popover that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybePanel()) !== null;
  }

  /**
   * The panel's accessible name: `ariaLabel`, else the text of the element `ariaLabelledBy`
   * points to, `null` while nothing names it.
   */
  async getName(): Promise<string | null> {
    const panel = await this.panel();
    const label = await panel.getAttribute('aria-label');
    if (label) {
      return label;
    }
    const id = await panel.getAttribute('aria-labelledby');
    if (!id) {
      return null;
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(
      `#${CSS.escape(id)}`,
    )();
    return (await named?.text())?.trim() ?? null;
  }

  /** The element's role: `dialog`. */
  async getRole(): Promise<string | null> {
    return (await this.panel()).getAttribute('role');
  }

  /** Presses Escape: the popover closes. */
  async close(): Promise<void> {
    await (await this.panel()).sendKeys(TestKey.ESCAPE);
  }

  /** Clicks outside the panel, on the page: the popover closes. */
  async closeByClickingOutside(): Promise<void> {
    await this.documentRootLocatorFactory().rootElement.click(0, 0);
  }
}
