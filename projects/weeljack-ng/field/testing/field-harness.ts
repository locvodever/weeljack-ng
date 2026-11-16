import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-field` with {@link WjFieldHarness.with}. */
export interface WjFieldHarnessFilters extends BaseHarnessFilters {
  /** The label text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for `wj-field`. Reach the control inside it with the inherited `getHarness` and
 * `getAllHarnesses`, for example `field.getHarness(WjInputTextHarness)`.
 */
export class WjFieldHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-field';

  private readonly labelElement = this.locatorFor('.wj-field-label');
  private readonly hintElement = this.locatorForOptional('.wj-field-hint');
  private readonly errorElement = this.locatorForOptional('.wj-field-error');
  private readonly inlineBox = this.locatorForOptional('.wj-field-inline');

  /** Finds the fields whose label matches `options.label`. */
  static with(options: WjFieldHarnessFilters = {}): HarnessPredicate<WjFieldHarness> {
    return new HarnessPredicate(WjFieldHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The label text. */
  async getLabel(): Promise<string> {
    return (await (await this.labelElement()).text()).trim();
  }

  /** The hint text, or `null` when the field shows no hint. */
  async getHint(): Promise<string | null> {
    return (await (await this.hintElement())?.text())?.trim() ?? null;
  }

  /** The error text, or `null` when the field shows none (including an error with no message). */
  async getError(): Promise<string | null> {
    return (await (await this.errorElement())?.text())?.trim() ?? null;
  }

  /** Whether the field is a group: zero or several registered controls, so `role="group"`. */
  async isGroup(): Promise<boolean> {
    return (await (await this.host()).getAttribute('role')) === 'group';
  }

  /** Whether the field lays its label beside the control: the one control is an on/off control. */
  async isInline(): Promise<boolean> {
    return (await this.inlineBox()) !== null;
  }
}
