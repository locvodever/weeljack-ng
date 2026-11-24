import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding an `input[wjInputMask]` with {@link WjInputMaskHarness.with}. */
export interface WjInputMaskHarnessFilters extends BaseHarnessFilters {
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/** Test harness for `input[wjInputMask]`. Describes the input as a user meets it. */
export class WjInputMaskHarness extends ComponentHarness {
  static hostSelector = 'input[wjInputMask]';

  /** Finds the inputs whose `placeholder` matches `options.placeholder`. */
  static with(options: WjInputMaskHarnessFilters = {}): HarnessPredicate<WjInputMaskHarness> {
    return new HarnessPredicate(WjInputMaskHarness, options).addOption(
      'placeholder',
      options.placeholder,
      async (harness, placeholder) =>
        HarnessPredicate.stringMatches(await harness.getPlaceholder(), placeholder),
    );
  }

  /** The text shown: literals and slot characters included while the mask is incomplete. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /**
   * Types `text` at the caret one key at a time, so the mask fills the next slot and skips
   * literals. Focus the input first and wait for the mask to show (`getValue()`): Optimus places
   * the caret from a timer after focus. CDK's `sendKeys` cannot be used here, because it sets the
   * whole text up front and sends key events Optimus reads as the wrong characters.
   */
  async typeText(text: string): Promise<void> {
    const host = await this.host();
    for (const character of text) {
      const code = character.charCodeAt(0);
      await host.dispatchEvent('keypress', { which: code, keyCode: code });
    }
  }

  /**
   * Empties the input and the form value, as a form reset does. Optimus re-reads the cleared text
   * on the next focus or blur, so blur and refocus the input before typing again.
   */
  async clear(): Promise<void> {
    await (await this.host()).clear();
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

  /** Moves focus to the input. The mask then shows its literals and slot characters. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Removes focus from the input. An incomplete value then clears, unless `autoClear` is off. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
