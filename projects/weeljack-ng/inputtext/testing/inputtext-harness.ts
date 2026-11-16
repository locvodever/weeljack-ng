import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding an `input[wjInputText]` with {@link WjInputTextHarness.with}. */
export interface WjInputTextHarnessFilters extends BaseHarnessFilters {
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/** Test harness for `input[wjInputText]`. Describes the input as a user meets it. */
export class WjInputTextHarness extends ComponentHarness {
  static hostSelector = 'input[wjInputText]';

  /** Finds the inputs whose `placeholder` matches `options.placeholder`. */
  static with(options: WjInputTextHarnessFilters = {}): HarnessPredicate<WjInputTextHarness> {
    return new HarnessPredicate(WjInputTextHarness, options).addOption(
      'placeholder',
      options.placeholder,
      async (harness, placeholder) =>
        HarnessPredicate.stringMatches(await harness.getPlaceholder(), placeholder),
    );
  }

  /** The current value. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Replaces the value the way typing does: clears it, then types `value`. */
  async setValue(value: string): Promise<void> {
    const host = await this.host();
    await host.clear();
    if (value !== '') {
      await host.sendKeys(value);
    }
  }

  /** Whether the input cannot be edited or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether the input is required. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /** Whether the input shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id`, or an empty string when the input has none. */
  async getId(): Promise<string> {
    return (await (await this.host()).getAttribute('id')) ?? '';
  }

  /** The `placeholder`, or `null` when the input has none. */
  async getPlaceholder(): Promise<string | null> {
    return (await this.host()).getAttribute('placeholder');
  }

  /** The ARIA name and description attributes as set on the input, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const host = await this.host();
    return {
      label: await host.getAttribute('aria-label'),
      labelledBy: await host.getAttribute('aria-labelledby'),
      describedBy: await host.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus to the input. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Removes focus from the input. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
