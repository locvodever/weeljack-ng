import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a tab with {@link WjTabHarness.with}. */
export interface WjTabHarnessFilters extends BaseHarnessFilters {
  /** The tab's label, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for one tab of a `wj-tabs`. Describes the tab as a user meets it, and reads its
 * state from ARIA, not from Optimus's classes. A tab's own `wj-tab` host renders nothing, so this
 * finds the tab the `wj-tabs` drew.
 */
export class WjTabHarness extends ComponentHarness {
  static hostSelector = '[data-wj-part="tab"]';

  /** Finds the tabs whose label matches `options.label`. */
  static with(options: WjTabHarnessFilters = {}): HarnessPredicate<WjTabHarness> {
    return new HarnessPredicate(WjTabHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible text of the tab, trimmed. */
  async getLabel(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the tab is the active one. */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the tab is disabled: it cannot be activated and takes no focus. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the tab, which makes it the active one. */
  async select(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.host()).click(modifiers);
  }

  /** Moves focus to the tab. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Whether the tab has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}

/** Test harness for `wj-tabs`: its tabs, the active one and the panel on show. */
export class WjTabsHarness extends ComponentHarness {
  static hostSelector = 'wj-tabs';

  private readonly tabList = this.locatorFor('[role="tablist"]');
  private readonly shownPanel = this.locatorForOptional('[role="tabpanel"]:not([hidden])');

  /** The tabs, in order, optionally only those whose label matches. */
  async getTabs(filters: WjTabHarnessFilters = {}): Promise<WjTabHarness[]> {
    return this.locatorForAll(WjTabHarness.with(filters))();
  }

  /** The active tab, or `null` when no tab matches `value`. */
  async getSelectedTab(): Promise<WjTabHarness | null> {
    return this.locatorForOptional(WjTabHarness.with({ selector: '[aria-selected="true"]' }))();
  }

  /** The label of every tab, in order. */
  async getTabLabels(): Promise<string[]> {
    return Promise.all((await this.getTabs()).map((tab) => tab.getLabel()));
  }

  /** The text of the panel on show, trimmed, or `null` when none shows. */
  async getSelectedPanelText(): Promise<string | null> {
    const panel = await this.shownPanel();
    return panel ? (await panel.text()).trim() : null;
  }

  /** The `aria-label` of the tab list, or `null` when it has none. */
  async getTabListAriaLabel(): Promise<string | null> {
    return (await this.tabList()).getAttribute('aria-label');
  }

  /** The `aria-labelledby` of the tab list, or `null` when it has none. */
  async getTabListAriaLabelledBy(): Promise<string | null> {
    return (await this.tabList()).getAttribute('aria-labelledby');
  }
}
