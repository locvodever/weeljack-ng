import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-iftalabel` with {@link WjIftaLabelHarness.with}. */
export interface WjIftaLabelHarnessFilters extends BaseHarnessFilters {
  /** The label text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for `wj-iftalabel`. Reach the control inside it with the inherited `getHarness`
 * and `getAllHarnesses`, for example `iftaLabel.getHarness(WjInputTextHarness)`.
 */
export class WjIftaLabelHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-iftalabel';

  private readonly labelElement = this.locatorFor('label');

  /** Finds the ifta labels whose label text matches `options.label`. */
  static with(options: WjIftaLabelHarnessFilters = {}): HarnessPredicate<WjIftaLabelHarness> {
    return new HarnessPredicate(WjIftaLabelHarness, options).addOption(
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
