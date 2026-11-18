import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-panel` with {@link WjPanelHarness.with}. */
export interface WjPanelHarnessFilters extends BaseHarnessFilters {
  /** The header text (the `header` input), as a string for an exact match or a RegExp. */
  headerText?: string | RegExp;
}

/**
 * Test harness for `wj-panel`. Describes the panel as a user meets it, and reads its state from
 * ARIA and Optimus's `data-pc-*` section hooks, never from a class name.
 */
export class WjPanelHarness extends ComponentHarness {
  static hostSelector = 'wj-panel';

  private readonly title = this.locatorForOptional('[data-pc-section="title"]');
  private readonly toggleButton = this.locatorForOptional('[data-pc-name="pctogglebutton"]');
  private readonly region = this.locatorFor('[role="region"]');
  private readonly content = this.locatorFor('[data-pc-section="content"]');
  private readonly footer = this.locatorForOptional('[data-pc-section="footer"]');

  /** Finds the panels whose header text matches `options.headerText`. */
  static with(options: WjPanelHarnessFilters = {}): HarnessPredicate<WjPanelHarness> {
    return new HarnessPredicate(WjPanelHarness, options).addOption(
      'headerText',
      options.headerText,
      (harness, headerText) => HarnessPredicate.stringMatches(harness.getHeaderText(), headerText),
    );
  }

  /** The text of the `header` input, trimmed; empty when the panel has none. */
  async getHeaderText(): Promise<string> {
    return ((await (await this.title())?.text()) ?? '').trim();
  }

  /** Whether the panel has a toggle button. */
  async isToggleable(): Promise<boolean> {
    return (await this.toggleButton()) !== null;
  }

  /** Whether the content is collapsed. A panel with no toggle is never collapsed. */
  async isCollapsed(): Promise<boolean> {
    const toggle = await this.toggleButton();
    return toggle !== null && (await (await this.region()).getAttribute('aria-hidden')) === 'true';
  }

  /** Clicks the toggle button, which collapses an open panel and opens a collapsed one. */
  async toggle(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.requireToggle()).click(modifiers);
  }

  /** Moves focus to the toggle button. */
  async focus(): Promise<void> {
    await (await this.requireToggle()).focus();
  }

  /** Whether the toggle button has focus. */
  async isFocused(): Promise<boolean> {
    return (await (await this.toggleButton())?.isFocused()) ?? false;
  }

  /** The text of the content, trimmed, whether the panel is collapsed or not. */
  async getContentText(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** The text of the footer, trimmed; `null` when the panel has no footer. */
  async getFooterText(): Promise<string | null> {
    const footer = await this.footer();
    return footer === null ? null : (await footer.text()).trim();
  }

  private async requireToggle(): Promise<TestElement> {
    const toggle = await this.toggleButton();
    if (toggle === null) {
      throw new Error('This wj-panel is not toggleable, so it has no toggle button');
    }
    return toggle;
  }
}
