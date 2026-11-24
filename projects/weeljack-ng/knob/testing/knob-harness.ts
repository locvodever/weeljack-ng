import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-knob` with {@link WjKnobHarness.with}. */
export interface WjKnobHarnessFilters extends BaseHarnessFilters {
  /** The knob's `ariaLabel`, as text or a pattern. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-knob`. Describes the knob as a user meets it: its value, range and shown
 * text, the keys that move it (a step, a page, the ends), its disabled, read-only and invalid
 * states, the dial's id and ARIA attributes, and focus. It never names an Optimus class.
 */
export class WjKnobHarness extends ComponentHarness {
  static hostSelector = 'wj-knob';

  private readonly dial = this.locatorFor('[role="slider"]');
  private readonly shown = this.locatorForOptional('svg text');

  /** Finds the knobs that match `options`. */
  static with(options: WjKnobHarnessFilters = {}): HarnessPredicate<WjKnobHarness> {
    return new HarnessPredicate(WjKnobHarness, options).addOption(
      'ariaLabel',
      options.ariaLabel,
      async (harness, label) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, label),
    );
  }

  /** The value shown: `min` while the knob holds `null`. */
  async getValue(): Promise<number> {
    return this.numberAttribute('aria-valuenow');
  }

  /** The lowest value. */
  async getMin(): Promise<number> {
    return this.numberAttribute('aria-valuemin');
  }

  /** The highest value. */
  async getMax(): Promise<number> {
    return this.numberAttribute('aria-valuemax');
  }

  /** The text in the middle of the dial, with the value template applied. `null` when hidden. */
  async getShownText(): Promise<string | null> {
    const text = await this.shown();
    return text ? (await text.text()).trim() : null;
  }

  /** Presses Arrow Up `times` times, each adding one `step`. */
  async stepUp(times = 1): Promise<void> {
    await this.press(times, TestKey.UP_ARROW);
  }

  /** Presses Arrow Down `times` times, each taking one `step`. */
  async stepDown(times = 1): Promise<void> {
    await this.press(times, TestKey.DOWN_ARROW);
  }

  /** Presses Page Up `times` times, each adding ten steps. */
  async pageUp(times = 1): Promise<void> {
    await this.press(times, TestKey.PAGE_UP);
  }

  /** Presses Page Down `times` times, each taking ten steps. */
  async pageDown(times = 1): Promise<void> {
    await this.press(times, TestKey.PAGE_DOWN);
  }

  /** Presses Home: the lowest value. */
  async toMin(): Promise<void> {
    await this.press(1, TestKey.HOME);
  }

  /** Presses End: the highest value. */
  async toMax(): Promise<void> {
    await this.press(1, TestKey.END);
  }

  /** Whether the knob cannot be changed or focused by Tab (`aria-disabled="true"`). */
  async isDisabled(): Promise<boolean> {
    return (await (await this.dial()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the knob shows its value but cannot be changed (`aria-readonly="true"`). */
  async isReadonly(): Promise<boolean> {
    return (await (await this.dial()).getAttribute('aria-readonly')) === 'true';
  }

  /** Whether the dial is marked invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.dial()).getAttribute('aria-invalid')) === 'true';
  }

  /** The dial's id, an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.dial()).getProperty<string>('id')) || '';
  }

  /** The ARIA name and description attributes as set on the dial, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const dial = await this.dial();
    return {
      label: await dial.getAttribute('aria-label'),
      labelledBy: await dial.getAttribute('aria-labelledby'),
      describedBy: await dial.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus onto the dial. */
  async focus(): Promise<void> {
    await (await this.dial()).focus();
  }

  /** Removes focus from the dial. */
  async blur(): Promise<void> {
    await (await this.dial()).blur();
  }

  /** Whether the dial has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.dial()).isFocused();
  }

  private async press(times: number, key: TestKey): Promise<void> {
    const dial = await this.dial();
    for (let index = 0; index < times; index += 1) {
      await dial.sendKeys(key);
    }
  }

  private async numberAttribute(name: string): Promise<number> {
    return Number(await (await this.dial()).getAttribute(name));
  }
}
