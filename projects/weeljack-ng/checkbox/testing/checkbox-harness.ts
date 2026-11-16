import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-checkbox` with {@link WjCheckboxHarness.with}. */
export interface WjCheckboxHarnessFilters extends BaseHarnessFilters {
  /** Only checkboxes in this state. */
  checked?: boolean;
  /** The `input`'s `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
}

/** Test harness for `wj-checkbox`. Describes the checkbox as a user meets it. */
export class WjCheckboxHarness extends ComponentHarness {
  static hostSelector = 'wj-checkbox';

  private readonly control = this.locatorFor('input');

  /** Finds the checkboxes that match `options`. */
  static with(options: WjCheckboxHarnessFilters = {}): HarnessPredicate<WjCheckboxHarness> {
    return new HarnessPredicate(WjCheckboxHarness, options)
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) === checked,
      )
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      );
  }

  /** Whether the box is checked. */
  async isChecked(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('checked');
  }

  /** Checks the box, if it is not checked. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.toggle();
    }
  }

  /** Unchecks the box, if it is checked. */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) {
      await this.toggle();
    }
  }

  /** Clicks the box, as a user does. */
  async toggle(): Promise<void> {
    await (await this.control()).click();
  }

  /** Whether the checkbox cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }

  /** Whether the checkbox is required. */
  async isRequired(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('required');
  }

  /** Whether the checkbox shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id` of the `input`, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.control()).getAttribute('id')) ?? '';
  }

  /** The ARIA name and description attributes as set on the `input`, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const control = await this.control();
    return {
      label: await control.getAttribute('aria-label'),
      labelledBy: await control.getAttribute('aria-labelledby'),
      describedBy: await control.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus to the checkbox. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Removes focus from the checkbox. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the checkbox has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }
}
