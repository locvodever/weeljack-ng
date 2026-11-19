import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-colorpicker` with {@link WjColorPickerHarness.with}. */
export interface WjColorPickerHarnessFilters extends BaseHarnessFilters {
  /** The swatch's `ariaLabel`, as text or a pattern. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-colorpicker`. Describes the picker as a user meets it: the colour it holds,
 * opening and closing the panel, its disabled and invalid states, the swatch's id and ARIA
 * attributes, and focus. It never names an Optimus class. The panel's area and hue strip answer
 * the pointer only in Optimus 2.0.2, so there is no key to step them with.
 */
export class WjColorPickerHarness extends ComponentHarness {
  static hostSelector = 'wj-colorpicker';

  private readonly swatch = this.locatorFor('input');

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

  /** Opens the panel with a click on the swatch. Does nothing while it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.swatch()).click();
    }
  }

  /** Closes the panel with a click on the swatch, which toggles it. Does nothing while closed. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.swatch()).click();
    }
  }

  /** Whether the panel is open: the swatch's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.swatch()).getAttribute('aria-expanded')) === 'true';
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
}
