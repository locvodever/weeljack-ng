import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-badge` with {@link WjBadgeHarness.with}. */
export interface WjBadgeHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  value?: string | RegExp;
}

/** Test harness for `wj-badge`. Describes the badge as a user meets it, not how it is built. */
export class WjBadgeHarness extends ComponentHarness {
  static hostSelector = 'wj-badge';

  /** Finds the badges whose visible text matches `options.value`. */
  static with(options: WjBadgeHarnessFilters = {}): HarnessPredicate<WjBadgeHarness> {
    return new HarnessPredicate(WjBadgeHarness, options).addOption(
      'value',
      options.value,
      (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value),
    );
  }

  /** The visible text, trimmed; `''` for a dot. */
  async getValue(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the badge is the 8 px dot: it has no value to show. */
  async isDot(): Promise<boolean> {
    return (await this.getValue()) === '';
  }
}
