import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-colorpicker` with {@link WjColorPickerHarness.with}. */
export interface WjColorPickerHarnessFilters extends BaseHarnessFilters {
  /** The swatch's `ariaLabel`, as text or a pattern. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-colorpicker`. Describes the picker as a user meets it: the colour it holds,
 * opening and closing the panel, the keys that move saturation, brightness and hue, its disabled
 * and invalid states, the swatch's id and ARIA attributes, and focus. It never names an Optimus
 * class: the panel's two sliders are found by their ARIA.
 */
export class WjColorPickerHarness extends ComponentHarness {
  static hostSelector = 'wj-colorpicker';

  private readonly swatch = this.locatorFor('input');
  private readonly area = this.locatorFor('[role="slider"][aria-valuetext]');
  private readonly hue = this.locatorFor('[role="slider"][aria-orientation="vertical"]');

  /** Finds the pickers that match `options`. */
  static with(options: WjColorPickerHarnessFilters = {}): HarnessPredicate<WjColorPickerHarness> {
    return new HarnessPredicate(WjColorPickerHarness, options).addOption(
      'ariaLabel',
      options.ariaLabel,
      async (harness, label) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, label),
    );
  }

  /** The colour as `#rrggbb`, `null` while none is set. */
  async getValue(): Promise<string | null> {
    return (await this.host()).getAttribute('data-value');
  }

  /**
   * The colour the swatch shows, as `#rrggbb`. While the value is `null` this is Optimus's red,
   * not `null`: read {@link getValue} for the model.
   */
  async getSwatchColor(): Promise<string> {
    const rgb = /(\d+), (\d+), (\d+)/.exec(
      await (await this.swatch()).getCssValue('background-color'),
    );
    return `#${(rgb ?? [])
      .slice(1, 4)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  /** Opens the panel, and waits until its sliders are there. Does nothing while it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.swatch()).click();
    }
    await this.area();
  }

  /** Closes the panel with Escape, which returns focus to the swatch. Does nothing while closed. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.area()).sendKeys(TestKey.ESCAPE);
    }
  }

  /** Whether the panel is open: the swatch's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.swatch()).getAttribute('aria-expanded')) === 'true';
  }

  /** The saturation, 0 to 100, read from the panel's area. Opens the panel. */
  async getSaturation(): Promise<number> {
    await this.open();
    return Number(await (await this.area()).getAttribute('aria-valuenow'));
  }

  /** The area's spoken value, such as "Saturation 99%, brightness 100%". Opens the panel. */
  async getAreaValueText(): Promise<string> {
    await this.open();
    return (await (await this.area()).getAttribute('aria-valuetext')) ?? '';
  }

  /** The hue, 0 to 360, read from the panel's strip. Opens the panel. */
  async getHue(): Promise<number> {
    await this.open();
    return Number(await (await this.hue()).getAttribute('aria-valuenow'));
  }

  /** Moves saturation by `steps` with Arrow Right (up) or Arrow Left (down). Opens the panel. */
  async stepSaturation(steps: number): Promise<void> {
    await this.press(this.area, steps, TestKey.RIGHT_ARROW, TestKey.LEFT_ARROW);
  }

  /** Moves brightness by `steps` with Arrow Up (up) or Arrow Down (down). Opens the panel. */
  async stepBrightness(steps: number): Promise<void> {
    await this.press(this.area, steps, TestKey.UP_ARROW, TestKey.DOWN_ARROW);
  }

  /** Moves hue by `steps` with Arrow Up (up) or Arrow Down (down). Opens the panel. */
  async stepHue(steps: number): Promise<void> {
    await this.press(this.hue, steps, TestKey.UP_ARROW, TestKey.DOWN_ARROW);
  }

  /** Whether the swatch cannot be used (`disabled`). */
  async isDisabled(): Promise<boolean> {
    return (await this.swatch()).getProperty<boolean>('disabled');
  }

  /** Whether the swatch is marked invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.swatch()).getAttribute('aria-invalid')) === 'true';
  }

  /** The swatch's id, an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.swatch()).getProperty<string>('id')) || '';
  }

  /** The ARIA name and description attributes as set on the swatch, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const swatch = await this.swatch();
    return {
      label: await swatch.getAttribute('aria-label'),
      labelledBy: await swatch.getAttribute('aria-labelledby'),
      describedBy: await swatch.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus onto the swatch. */
  async focus(): Promise<void> {
    await (await this.swatch()).focus();
  }

  /** Removes focus from the swatch. */
  async blur(): Promise<void> {
    await (await this.swatch()).blur();
  }

  /** Whether the swatch has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.swatch()).isFocused();
  }

  private async press(
    part: () => Promise<{ sendKeys(...keys: TestKey[]): Promise<void>; focus(): Promise<void> }>,
    steps: number,
    up: TestKey,
    down: TestKey,
  ): Promise<void> {
    await this.open();
    const slider = await part();
    await slider.focus();
    for (let index = 0; index < Math.abs(steps); index += 1) {
      await slider.sendKeys(steps > 0 ? up : down);
    }
  }
}
