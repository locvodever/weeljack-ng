import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-tag` with {@link WjTagHarness.with}. */
export interface WjTagHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  value?: string | RegExp;
}

/** Test harness for `wj-tag`. Describes the tag as a user meets it, not how it is built. */
export class WjTagHarness extends ComponentHarness {
  static hostSelector = 'wj-tag';

  /** Finds the tags whose visible text matches `options.value`. */
  static with(options: WjTagHarnessFilters = {}): HarnessPredicate<WjTagHarness> {
    return new HarnessPredicate(WjTagHarness, options).addOption(
      'value',
      options.value,
      (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value),
    );
  }

  /** The visible text: the `value` plus any projected text, trimmed. */
  async getValue(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }
}
