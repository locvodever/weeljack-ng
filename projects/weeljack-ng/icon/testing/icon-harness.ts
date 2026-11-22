import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-icon` with {@link WjIconHarness.with}. */
export interface WjIconHarnessFilters extends BaseHarnessFilters {
  /** The icon's name (its `WjIconDef.name`), as a string for an exact match or a RegExp. */
  name?: string | RegExp;
}

/** Test harness for `wj-icon`. */
export class WjIconHarness extends ComponentHarness {
  static hostSelector = 'wj-icon';

  private readonly svg = this.locatorFor('svg');
  private readonly shapes = this.locatorForAll('svg > *');

  /** Finds the icons whose name matches `options.name`. */
  static with(options: WjIconHarnessFilters = {}): HarnessPredicate<WjIconHarness> {
    return new HarnessPredicate(WjIconHarness, options).addOption(
      'name',
      options.name,
      (harness, name) => HarnessPredicate.stringMatches(harness.getName(), name),
    );
  }

  /** The icon's name: the `data-icon` value. */
  async getName(): Promise<string> {
    return (await (await this.host()).getAttribute('data-icon')) ?? '';
  }

  /** The accessible name (`aria-label`), or `null` for a decorative icon. */
  async getLabel(): Promise<string | null> {
    return (await this.svg()).getAttribute('aria-label');
  }

  /** Whether the icon is decorative: hidden from assistive technology. */
  async isDecorative(): Promise<boolean> {
    return (await (await this.svg()).getAttribute('aria-hidden')) === 'true';
  }

  /** Whether the icon is spinning. */
  async isSpinning(): Promise<boolean> {
    return (await this.host()).hasClass('wj-icon-spin');
  }

  /** How many shapes the icon draws. */
  async getShapeCount(): Promise<number> {
    return (await this.shapes()).length;
  }
}
