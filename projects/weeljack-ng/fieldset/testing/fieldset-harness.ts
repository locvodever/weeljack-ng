import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-fieldset` with {@link WjFieldsetHarness.with}. */
export interface WjFieldsetHarnessFilters extends BaseHarnessFilters {
  /** The legend text (the `legend` input), as a string for an exact match or a RegExp. */
  legend?: string | RegExp;
}

/**
 * Test harness for `wj-fieldset`. Describes the group as a user meets it, and reads its state from
 * ARIA and Optimus's `data-pc-*` section hooks, never from a class name.
 */
export class WjFieldsetHarness extends ComponentHarness {
  static hostSelector = 'wj-fieldset';

  private readonly legendElement = this.locatorFor('legend');
  private readonly toggleButton = this.locatorForOptional('legend button');
  private readonly region = this.locatorFor('[role="region"]');
  private readonly content = this.locatorFor('[data-pc-section="content"]');

  /** Finds the fieldsets whose legend matches `options.legend`. */
  static with(options: WjFieldsetHarnessFilters = {}): HarnessPredicate<WjFieldsetHarness> {
    return new HarnessPredicate(WjFieldsetHarness, options).addOption(
      'legend',
      options.legend,
      (harness, legend) => HarnessPredicate.stringMatches(harness.getLegend(), legend),
    );
  }

  /** The text of the `legend` input, trimmed. */
  async getLegend(): Promise<string> {
    return (await (await this.legendElement()).text()).trim();
  }

  /** Whether the fieldset has a toggle button. */
  async isToggleable(): Promise<boolean> {
    return (await this.toggleButton()) !== null;
  }

  /** Whether the content is collapsed. A fieldset with no toggle is never collapsed. */
  async isCollapsed(): Promise<boolean> {
    const toggle = await this.toggleButton();
    return toggle !== null && (await (await this.region()).getAttribute('aria-hidden')) === 'true';
  }

  /** Clicks the toggle button, which collapses an open fieldset and opens a collapsed one. */
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

  /** The text of the content, trimmed, whether the fieldset is collapsed or not. */
  async getContentText(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  private async requireToggle(): Promise<TestElement> {
    const toggle = await this.toggleButton();
    if (toggle === null) {
      throw new Error('This wj-fieldset is not toggleable, so it has no toggle button');
    }
    return toggle;
  }
}
