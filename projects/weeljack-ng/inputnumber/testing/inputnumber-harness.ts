import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-inputnumber` with {@link WjInputNumberHarness.with}. */
export interface WjInputNumberHarnessFilters extends BaseHarnessFilters {
  /** The `input`'s `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/** Test harness for `wj-inputnumber`. Describes the control as a user meets it. */
export class WjInputNumberHarness extends ComponentHarness {
  static hostSelector = 'wj-inputnumber';

  private readonly control = this.locatorFor('input');
  private readonly buttons = this.locatorForAll('button');

  /** Finds the controls that match `options`. */
  static with(options: WjInputNumberHarnessFilters = {}): HarnessPredicate<WjInputNumberHarness> {
    return new HarnessPredicate(WjInputNumberHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('placeholder', options.placeholder, async (harness, placeholder) =>
        HarnessPredicate.stringMatches(await harness.getPlaceholder(), placeholder),
      );
  }

  /** The text shown, formatted: prefix, suffix, separators and currency symbol included. */
  async getText(): Promise<string> {
    return (await this.control()).getProperty<string>('value');
  }

  /** The number, read from `aria-valuenow`: `null` while the box is empty. */
  async getValue(): Promise<number | null> {
    const now = await (await this.control()).getAttribute('aria-valuenow');
    return now === null || now === '' ? null : Number(now);
  }

  /**
   * Types `text` at the caret one key at a time, as a user does: digits, the minus sign and the
   * decimal separator of the locale. CDK's `sendKeys` cannot be used, because it sets the whole
   * text up front. The number is committed on blur, Enter or Tab: call {@link commit} or
   * {@link blur} before reading {@link getText}.
   */
  async typeText(text: string): Promise<void> {
    const control = await this.control();
    for (const character of text) {
      const code = character.charCodeAt(0);
      await control.dispatchEvent('keypress', { which: code, keyCode: code });
    }
  }

  /**
   * Empties the box and the number: focuses the input, clears its text and presses Enter, which
   * makes Optimus read the empty text as `null`. The input keeps focus.
   */
  async clear(): Promise<void> {
    const control = await this.control();
    await control.clear();
    await control.sendKeys(TestKey.ENTER);
  }

  /** Presses Enter, which commits the typed text and formats it. */
  async commit(): Promise<void> {
    await (await this.control()).sendKeys(TestKey.ENTER);
  }

  /** Presses ArrowUp, which raises the number by `step`. */
  async increment(): Promise<void> {
    await (await this.control()).sendKeys(TestKey.UP_ARROW);
  }

  /** Presses ArrowDown, which lowers the number by `step`. */
  async decrement(): Promise<void> {
    await (await this.control()).sendKeys(TestKey.DOWN_ARROW);
  }

  /** The lowest value (`aria-valuemin`), `null` when there is none. */
  async getMin(): Promise<number | null> {
    return this.numberAttribute('aria-valuemin');
  }

  /** The highest value (`aria-valuemax`), `null` when there is none. */
  async getMax(): Promise<number | null> {
    return this.numberAttribute('aria-valuemax');
  }

  /** Whether the minus and plus buttons show. */
  async hasSpinButtons(): Promise<boolean> {
    return (await this.buttons()).length > 0;
  }

  /** Whether the control cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }

  /** Whether the control is required. */
  async isRequired(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('required');
  }

  /** Whether the control shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id` of the `input`, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.control()).getAttribute('id')) ?? '';
  }

  /** The `placeholder`, `null` when absent. */
  async getPlaceholder(): Promise<string | null> {
    return (await this.control()).getAttribute('placeholder');
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

  /** Moves focus to the input. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Removes focus from the input, which commits and formats what was typed. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }

  private async numberAttribute(name: string): Promise<number | null> {
    const attribute = await (await this.control()).getAttribute(name);
    return attribute === null || attribute === '' ? null : Number(attribute);
  }
}
