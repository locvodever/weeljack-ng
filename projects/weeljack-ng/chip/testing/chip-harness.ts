import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-chip` with {@link WjChipHarness.with}. */
export interface WjChipHarnessFilters extends BaseHarnessFilters {
  /** The visible label, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for `wj-chip`. Describes the chip as a user meets it: its label and photo, whether
 * it can be removed or is disabled, and its remove button.
 */
export class WjChipHarness extends ComponentHarness {
  static hostSelector = 'wj-chip';

  private readonly labelPart = this.locatorForOptional('[data-pc-section="label"]');
  private readonly photo = this.locatorForOptional('img');
  private readonly removeButton = this.locatorForOptional('button');

  /** Finds the chips whose visible label matches `options.label`. */
  static with(options: WjChipHarnessFilters = {}): HarnessPredicate<WjChipHarness> {
    return new HarnessPredicate(WjChipHarness, options).addOption(
      'label',
      options.label,
      async (harness, label) => HarnessPredicate.stringMatches(await harness.getLabel(), label),
    );
  }

  /** The visible label, trimmed; `null` when the chip shows none. */
  async getLabel(): Promise<string | null> {
    const label = await this.labelPart();
    return label ? (await label.text()).trim() : null;
  }

  /** The URL of the photo; `null` when the chip shows none. */
  async getImageUrl(): Promise<string | null> {
    const photo = await this.photo();
    return photo ? photo.getAttribute('src') : null;
  }

  /** The text alternative of the photo (`''` when decorative); `null` when the chip shows none. */
  async getAlt(): Promise<string | null> {
    const photo = await this.photo();
    return photo ? photo.getAttribute('alt') : null;
  }

  /** Whether the chip has a remove button. */
  async isRemovable(): Promise<boolean> {
    return (await this.removeButton()) !== null;
  }

  /** Whether the remove button is disabled; `false` when the chip is not removable. */
  async isDisabled(): Promise<boolean> {
    const button = await this.removeButton();
    return button ? button.getProperty<boolean>('disabled') : false;
  }

  /** Clicks the remove button. Throws when the chip is not removable. */
  async remove(): Promise<void> {
    await (await this.requireButton()).click();
  }

  /** Moves focus to the remove button. Throws when the chip is not removable. */
  async focusRemoveButton(): Promise<void> {
    await (await this.requireButton()).focus();
  }

  private async requireButton(): Promise<TestElement> {
    const button = await this.removeButton();
    if (!button) {
      throw new Error('wj-chip: the chip is not removable, so it has no remove button');
    }
    return button;
  }
}
