import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-floatlabel` with {@link WjFloatLabelHarness.with}. */
export interface WjFloatLabelHarnessFilters extends BaseHarnessFilters {
  /** The label text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for `wj-floatlabel`. Reach the control inside it with the inherited `getHarness`
 * and `getAllHarnesses`, for example `floatLabel.getHarness(WjInputTextHarness)`.
 */
export class WjFloatLabelHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-floatlabel';

  private readonly labelElement = this.locatorFor('label');

  /** Finds the float labels whose label text matches `options.label`. */
  static with(options: WjFloatLabelHarnessFilters = {}): HarnessPredicate<WjFloatLabelHarness> {
    return new HarnessPredicate(WjFloatLabelHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The label text, from the `label` element you projected. */
  async getLabel(): Promise<string> {
    return (await (await this.labelElement()).text()).trim();
  }

  /** The id the label points at with `for`, or `null` for a label that names its control otherwise. */
  async getLabelTarget(): Promise<string | null> {
    return (await this.labelElement()).getAttribute('for');
  }
}
