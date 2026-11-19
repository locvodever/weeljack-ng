import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-slider` with {@link WjSliderHarness.with}. */
export interface WjSliderHarnessFilters extends BaseHarnessFilters {
  /** The slider's `ariaLabel`, as text or a pattern. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-slider`. Describes the slider as a user meets it: its value and range, the
 * keys that move it (a step, a page, the ends), its disabled and invalid states, the handle's id and
 * ARIA attributes, and focus. It never names an Optimus class.
 */
export class WjSliderHarness extends ComponentHarness {
  static hostSelector = 'wj-slider';

  private readonly handle = this.locatorFor('[role="slider"]');

  /** Finds the sliders that match `options`. */
  static with(options: WjSliderHarnessFilters = {}): HarnessPredicate<WjSliderHarness> {
    return new HarnessPredicate(WjSliderHarness, options).addOption(
      'ariaLabel',
      options.ariaLabel,
      async (harness, label) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, label),
    );
  }

  /** The value shown: `min` while the slider holds `null`. */
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

  /** `'horizontal'` or `'vertical'`. */
  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    return (await (await this.handle()).getAttribute('aria-orientation')) === 'vertical'
      ? 'vertical'
      : 'horizontal';
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

  /** Whether the slider cannot be changed or focused (`aria-disabled="true"`). */
  async isDisabled(): Promise<boolean> {
    return (await (await this.handle()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the handle is marked invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.handle()).getAttribute('aria-invalid')) === 'true';
  }

  /** The handle's id, an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.handle()).getProperty<string>('id')) || '';
  }

  /** The ARIA name and description attributes as set on the handle, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const handle = await this.handle();
    return {
      label: await handle.getAttribute('aria-label'),
      labelledBy: await handle.getAttribute('aria-labelledby'),
      describedBy: await handle.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus onto the handle. */
  async focus(): Promise<void> {
    await (await this.handle()).focus();
  }

  /** Removes focus from the handle. */
  async blur(): Promise<void> {
    await (await this.handle()).blur();
  }

  /** Whether the handle has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.handle()).isFocused();
  }

  private async press(times: number, key: TestKey): Promise<void> {
    const handle = await this.handle();
    for (let index = 0; index < times; index += 1) {
      await handle.sendKeys(key);
    }
  }

  private async numberAttribute(name: string): Promise<number> {
    return Number(await (await this.handle()).getAttribute(name));
  }
}
