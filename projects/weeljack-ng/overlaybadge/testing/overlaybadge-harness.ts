import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-overlaybadge` with {@link WjOverlayBadgeHarness.with}. */
export interface WjOverlayBadgeHarnessFilters extends BaseHarnessFilters {
  /** The badge's visible text, as a string for an exact match or a RegExp. */
  value?: string | RegExp;
}

/**
 * Test harness for `wj-overlaybadge`. It is a container: the wrapped control is inside it, so
 * `getHarness(WjButtonHarness.with({ label: 'Inbox' }))` on this harness reaches the button the
 * badge sits on. The badge is read from Optimus's `data-pc-name` hook, never from a class name.
 */
export class WjOverlayBadgeHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-overlaybadge';

  private readonly badge = this.locatorFor('p-badge[data-pc-name="pcbadge"]');

  /** Finds the overlay badges whose badge text matches `options.value`. */
  static with(options: WjOverlayBadgeHarnessFilters = {}): HarnessPredicate<WjOverlayBadgeHarness> {
    return new HarnessPredicate(WjOverlayBadgeHarness, options).addOption(
      'value',
      options.value,
      (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value),
    );
  }

  /** The badge's visible text, trimmed; `''` for a dot. */
  async getValue(): Promise<string> {
    return (await (await this.badge()).text()).trim();
  }

  /** Whether the badge is the 8 px dot: it has no value to show. */
  async isDot(): Promise<boolean> {
    return (await this.getValue()) === '';
  }
}
