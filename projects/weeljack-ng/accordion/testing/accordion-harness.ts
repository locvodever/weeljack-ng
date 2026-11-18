import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a panel with {@link WjAccordionPanelHarness.with}. */
export interface WjAccordionPanelHarnessFilters extends BaseHarnessFilters {
  /** The header's text, as a string for an exact match or a RegExp. */
  headerText?: string | RegExp;
}

/**
 * Test harness for one panel of a `wj-accordion`. Describes the panel as a user meets it, and reads
 * its state from ARIA, not from Optimus's classes. A panel's own `wj-accordion-panel` host renders
 * nothing, so this finds the panel the accordion drew.
 */
export class WjAccordionPanelHarness extends ComponentHarness {
  static hostSelector = '[data-wj-part="accordion-panel"]';

  private readonly header = this.locatorFor('[data-wj-part="accordion-header"]');
  private readonly content = this.locatorFor('[data-wj-part="accordion-content"]');

  /** Finds the panels whose header text matches `options.headerText`. */
  static with(
    options: WjAccordionPanelHarnessFilters = {},
  ): HarnessPredicate<WjAccordionPanelHarness> {
    return new HarnessPredicate(WjAccordionPanelHarness, options).addOption(
      'headerText',
      options.headerText,
      (harness, headerText) => HarnessPredicate.stringMatches(harness.getHeaderText(), headerText),
    );
  }

  /** The visible text of the header, trimmed. */
  async getHeaderText(): Promise<string> {
    return (await (await this.header()).text()).trim();
  }

  /** The text of the content, trimmed, whether the panel is open or not. */
  async getContentText(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** Whether the panel is open. */
  async isExpanded(): Promise<boolean> {
    return (await (await this.header()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the panel is disabled: it cannot open and takes no focus. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.header()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the header, which opens a closed panel and closes an open one. */
  async toggle(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.header()).click(modifiers);
  }

  /** Moves focus to the header. */
  async focus(): Promise<void> {
    await (await this.header()).focus();
  }

  /** Whether the header has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.header()).isFocused();
  }
}

/** Test harness for `wj-accordion`: its panels, and which of them are open. */
export class WjAccordionHarness extends ComponentHarness {
  static hostSelector = 'wj-accordion';

  /** The panels, in order, optionally only those whose header text matches. */
  async getPanels(
    filters: WjAccordionPanelHarnessFilters = {},
  ): Promise<WjAccordionPanelHarness[]> {
    return this.locatorForAll(WjAccordionPanelHarness.with(filters))();
  }

  /** The open panels, in order. */
  async getExpandedPanels(): Promise<WjAccordionPanelHarness[]> {
    const panels = await this.getPanels();
    const expanded = await Promise.all(panels.map((panel) => panel.isExpanded()));
    return panels.filter((_panel, index) => expanded[index]);
  }

  /** The header text of every panel, in order. */
  async getHeaderTexts(): Promise<string[]> {
    return Promise.all((await this.getPanels()).map((panel) => panel.getHeaderText()));
  }
}
