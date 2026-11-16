import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-password` with {@link WjPasswordHarness.with}. */
export interface WjPasswordHarnessFilters extends BaseHarnessFilters {
  /** The `input`'s `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/** Test harness for `wj-password`. Describes the control as a user meets it. */
export class WjPasswordHarness extends ComponentHarness {
  static hostSelector = 'wj-password';

  private readonly control = this.locatorFor('input');
  private readonly toggle = this.locatorForOptional('.wj-password-toggle');
  private readonly strength = this.locatorForOptional('.p-password-meter-text');

  /** Finds the controls that match `options`. */
  static with(options: WjPasswordHarnessFilters = {}): HarnessPredicate<WjPasswordHarness> {
    return new HarnessPredicate(WjPasswordHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('placeholder', options.placeholder, async (harness, placeholder) =>
        HarnessPredicate.stringMatches(await harness.getPlaceholder(), placeholder),
      );
  }

  /** The current text, masked or not. */
  async getValue(): Promise<string> {
    return (await this.control()).getProperty<string>('value');
  }

  /** Replaces the text the way typing does: clears it, then types `value`. */
  async setValue(value: string): Promise<void> {
    const control = await this.control();
    await control.clear();
    if (value !== '') {
      await control.sendKeys(value);
    }
  }

  /** Whether the text is masked (`type="password"`). */
  async isMasked(): Promise<boolean> {
    return (await (await this.control()).getAttribute('type')) === 'password';
  }

  /** Whether the control has a mask toggle button. */
  async hasToggle(): Promise<boolean> {
    return (await this.toggle()) !== null;
  }

  /** Presses the mask toggle button, as a user does. Throws when there is none. */
  async toggleMask(): Promise<void> {
    await (await this.requireToggle()).click();
  }

  /** The mask toggle's accessible name: "Show Password" while masked, "Hide Password" after. */
  async getToggleName(): Promise<string | null> {
    return (await this.requireToggle()).getAttribute('aria-label');
  }

  /** Whether the mask toggle is pressed, which is while the text shows. */
  async isTogglePressed(): Promise<boolean> {
    return (await (await this.requireToggle()).getAttribute('aria-pressed')) === 'true';
  }

  /** Whether the mask toggle has focus. */
  async isToggleFocused(): Promise<boolean> {
    return (await this.requireToggle()).isFocused();
  }

  /** The strength text of the open overlay, or `null` while the overlay is closed. */
  async getStrengthText(): Promise<string | null> {
    return (await this.strength())?.text() ?? null;
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

  /** Removes focus from the input. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }

  private async requireToggle(): Promise<NonNullable<Awaited<ReturnType<typeof this.toggle>>>> {
    const toggle = await this.toggle();
    if (toggle === null) {
      throw new Error('wj-password has no mask toggle: set toggleMask.');
    }
    return toggle;
  }
}
