import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-togglebutton` with {@link WjToggleButtonHarness.with}. */
export interface WjToggleButtonHarnessFilters extends BaseHarnessFilters {
  /** Whether the button is on. */
  checked?: boolean;
  /** The text the button shows now, as a string for an exact match or a RegExp. */
  text?: string | RegExp;
}

/**
 * Test harness for `wj-togglebutton`. Describes the button as a user meets it: on or off, the text
 * it shows, its disabled and invalid states and its ARIA attributes. It never names an Optimus
 * class.
 */
export class WjToggleButtonHarness extends ComponentHarness {
  static hostSelector = 'wj-togglebutton';

  private readonly button = this.locatorFor('[role="button"]');

  /** Finds the buttons that match `options`. */
  static with(options: WjToggleButtonHarnessFilters = {}): HarnessPredicate<WjToggleButtonHarness> {
    return new HarnessPredicate(WjToggleButtonHarness, options)
      .addOption('checked', options.checked, async (harness, checked) => {
        return (await harness.isChecked()) === checked;
      })
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getText(), text),
      );
  }

  /** Whether the button is on (`aria-pressed="true"`). */
  async isChecked(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-pressed')) === 'true';
  }

  /** Clicks the button, which flips it. */
  async toggle(): Promise<void> {
    await (await this.button()).click();
  }

  /** Turns the button on: clicks it only while it is off. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.toggle();
    }
  }

  /** Turns the button off: clicks it only while it is on. */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) {
      await this.toggle();
    }
  }

  /** The text the button shows now: its `onLabel` while on, its `offLabel` while off. */
  async getText(): Promise<string> {
    return (await (await this.button()).text()).trim();
  }

  /** Whether the button cannot be changed or focused (`aria-disabled="true"`). */
  async isDisabled(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the button shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-invalid')) === 'true';
  }

  /** The button's id, an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.button()).getProperty<string>('id')) || '';
  }

  /** The ARIA name and description attributes as set on the button, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const button = await this.button();
    return {
      label: await button.getAttribute('aria-label'),
      labelledBy: await button.getAttribute('aria-labelledby'),
      describedBy: await button.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus to the button. */
  async focus(): Promise<void> {
    await (await this.button()).focus();
  }

  /** Removes focus from the button. */
  async blur(): Promise<void> {
    await (await this.button()).blur();
  }

  /** Whether the button has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.button()).isFocused();
  }
}
