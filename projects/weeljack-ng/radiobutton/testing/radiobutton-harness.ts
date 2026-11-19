import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-radiobutton` with {@link WjRadioButtonHarness.with}. */
export interface WjRadioButtonHarnessFilters extends BaseHarnessFilters {
  /** Only radio buttons in this state. */
  checked?: boolean;
  /** The group's `name`, as a string for an exact match or a RegExp. */
  name?: string | RegExp;
  /** The label text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** Test harness for `wj-radiobutton`. Describes the radio button as a user meets it. */
export class WjRadioButtonHarness extends ComponentHarness {
  static hostSelector = 'wj-radiobutton';

  private readonly control = this.locatorFor('input');

  /** Finds the radio buttons that match `options`. */
  static with(options: WjRadioButtonHarnessFilters = {}): HarnessPredicate<WjRadioButtonHarness> {
    return new HarnessPredicate(WjRadioButtonHarness, options)
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) === checked,
      )
      .addOption('name', options.name, async (harness, name) =>
        HarnessPredicate.stringMatches(await harness.getName(), name),
      )
      .addOption('label', options.label, async (harness, label) =>
        HarnessPredicate.stringMatches(await harness.getLabelText(), label),
      );
  }

  /** Whether the radio button is checked. */
  async isChecked(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('checked');
  }

  /** Checks the radio button with a click, as a user does. */
  async check(): Promise<void> {
    await (await this.control()).click();
  }

  /** Whether the radio button cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }

  /** Whether the radio button is required. */
  async isRequired(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('required');
  }

  /** Whether the radio button shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-invalid')) === 'true';
  }

  /** The group's `name`, or an empty string when the radio button has none. */
  async getName(): Promise<string> {
    return (await (await this.control()).getAttribute('name')) ?? '';
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

  /**
   * The text of the `<label>` elements of the `input` (a wrapping label or a `<label for>`),
   * joined with a space; else its `aria-label`; else an empty string. Reads the `input`'s `labels`
   * property, so it needs a browser DOM, as the unit-test environment gives.
   */
  async getLabelText(): Promise<string> {
    const control = await this.control();
    const labels = await control.getProperty<NodeListOf<HTMLLabelElement>>('labels');
    const text = Array.from(labels, (label) => label.textContent.trim())
      .filter((part) => part !== '')
      .join(' ');
    return text || ((await control.getAttribute('aria-label')) ?? '');
  }

  /** Moves focus to the radio button. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Removes focus from the radio button. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the radio button has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }
}
