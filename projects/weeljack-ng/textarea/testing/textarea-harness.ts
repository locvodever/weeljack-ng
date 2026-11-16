import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding an `textarea[wjTextarea]` with {@link WjTextareaHarness.with}. */
export interface WjTextareaHarnessFilters extends BaseHarnessFilters {
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/** Test harness for `textarea[wjTextarea]`. Describes the textarea as a user meets it. */
export class WjTextareaHarness extends ComponentHarness {
  static hostSelector = 'textarea[wjTextarea]';

  /** Finds the textareas whose `placeholder` matches `options.placeholder`. */
  static with(options: WjTextareaHarnessFilters = {}): HarnessPredicate<WjTextareaHarness> {
    return new HarnessPredicate(WjTextareaHarness, options).addOption(
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

  /** Whether the textarea cannot be edited or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether the textarea is required. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /** Whether the textarea shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id`, or an empty string when the textarea has none. */
  async getId(): Promise<string> {
    return (await (await this.host()).getAttribute('id')) ?? '';
  }

  /** The `placeholder`, or `null` when the textarea has none. */
  async getPlaceholder(): Promise<string | null> {
    return (await this.host()).getAttribute('placeholder');
  }

  /** The ARIA name and description attributes as set on the textarea, `null` when absent. */
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

  /** Moves focus to the textarea. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Removes focus from the textarea. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the textarea has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
