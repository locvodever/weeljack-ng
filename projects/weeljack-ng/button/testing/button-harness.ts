import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-button` with {@link WjButtonHarness.with}. */
export interface WjButtonHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** Test harness for `wj-button`. Describes the button as a user meets it, not how it is built. */
export class WjButtonHarness extends ComponentHarness {
  static hostSelector = 'wj-button';

  private readonly control = this.locatorFor('button');

  /** Finds the buttons whose visible text matches `options.label`. */
  static with(options: WjButtonHarnessFilters = {}): HarnessPredicate<WjButtonHarness> {
    return new HarnessPredicate(WjButtonHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible text: the `label` plus any projected text, trimmed. */
  async getLabel(): Promise<string> {
    return (await (await this.control()).text()).trim();
  }

  /** Whether the button cannot be activated: `disabled`, or `loading` (a loading button is inert). */
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }

  /** Whether the button is in its loading state. */
  async isLoading(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-busy')) === 'true';
  }

  /** Clicks the button. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.control()).click(modifiers);
  }

  /** Moves focus to the button. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Removes focus from the button. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the button has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }

  /** The ARIA name and description attributes as set on the focusable element, `null` when absent. */
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
}
