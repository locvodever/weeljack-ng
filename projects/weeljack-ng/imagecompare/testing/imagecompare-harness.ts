import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-imagecompare` with {@link WjImageCompareHarness.with}. */
export interface WjImageCompareHarnessFilters extends BaseHarnessFilters {
  /** The slider's accessible name (the `ariaLabel` input), as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-imagecompare`. Describes the slider as a user meets it: where the divider
 * is, moving it, focusing it, and the ARIA attributes that name it. They are read from the range
 * input, never the host.
 */
export class WjImageCompareHarness extends ComponentHarness {
  static hostSelector = 'wj-imagecompare';

  private readonly slider = this.locatorFor('input[type="range"]');

  /** Finds the comparisons whose slider is named by `options.ariaLabel`. */
  static with(options: WjImageCompareHarnessFilters = {}): HarnessPredicate<WjImageCompareHarness> {
    return new HarnessPredicate(WjImageCompareHarness, options).addOption(
      'ariaLabel',
      options.ariaLabel,
      async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches(await harness.getAriaLabel(), ariaLabel),
    );
  }

  /** Where the divider is, from 0 (the left image's edge) to 100. */
  async getPosition(): Promise<number> {
    return Number(await (await this.slider()).getProperty<string>('value'));
  }

  /** Moves the divider to `position`, as the user dragging it would; the slider clamps it to 0–100. */
  async setPosition(position: number): Promise<void> {
    const slider = await this.slider();
    await slider.setInputValue(String(position));
    await slider.dispatchEvent('input');
  }

  /** Moves focus to the slider. */
  async focus(): Promise<void> {
    await (await this.slider()).focus();
  }

  /** Whether the slider has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.slider()).isFocused();
  }

  /** The slider's `aria-label`; `null` when unset. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.slider()).getAttribute('aria-label');
  }

  /** The slider's `aria-labelledby`; `null` when unset. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.slider()).getAttribute('aria-labelledby');
  }

  /** The slider's `aria-describedby`; `null` when unset. */
  async getAriaDescribedBy(): Promise<string | null> {
    return (await this.slider()).getAttribute('aria-describedby');
  }
}
