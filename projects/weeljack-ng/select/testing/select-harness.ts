import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-select` with {@link WjSelectHarness.with}. */
export interface WjSelectHarnessFilters extends BaseHarnessFilters {
  /** The combobox's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The text the closed select shows (the picked label or the placeholder), string or RegExp. */
  valueText?: string | RegExp;
}

/** Test harness for `wj-select`. Describes the select as a user meets it. */
export class WjSelectHarness extends ComponentHarness {
  static hostSelector = 'wj-select';

  private readonly control = this.locatorFor('[role="combobox"]');
  private readonly options = this.locatorForAll('[role="option"][aria-selected]');
  private readonly empty = this.locatorForOptional('[role="option"]:not([aria-selected])');

  /** Finds the selects that match `options`. */
  static with(options: WjSelectHarnessFilters = {}): HarnessPredicate<WjSelectHarness> {
    return new HarnessPredicate(WjSelectHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('valueText', options.valueText, async (harness, valueText) =>
        HarnessPredicate.stringMatches(await harness.getValueText(), valueText),
      );
  }

  /** The text the closed select shows: the picked option's label, else the placeholder. */
  async getValueText(): Promise<string> {
    return (await (await this.control()).text()).replaceAll('\u00a0', '').trim();
  }

  /** Whether the list is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the list with a click, as a user does. Does nothing when it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.control()).click();
    }
  }

  /** Closes the list with Escape, as a user does. Focus stays on the select. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.control()).sendKeys(TestKey.ESCAPE);
    }
  }

  /** The labels of the options, in order. Opens the list to read them, and leaves it as it was. */
  async getOptionLabels(): Promise<string[]> {
    const wasOpen = await this.isOpen();
    await this.open();
    const labels = await Promise.all((await this.options()).map((option) => option.text()));
    if (!wasOpen) {
      await this.close();
    }
    return labels;
  }

  /** The text of the empty message the open list shows, `null` while the list has options. */
  async getEmptyMessage(): Promise<string | null> {
    await this.open();
    return (await this.empty())?.text() ?? null;
  }

  /** Picks the option with exactly this label by clicking it. Throws when there is none. */
  async selectOption(label: string): Promise<void> {
    await this.open();
    for (const option of await this.options()) {
      if ((await option.text()) === label) {
        await option.click();
        return;
      }
    }
    throw new Error(`wj-select has no option labelled "${label}".`);
  }

  /** Whether the control cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the control is required. */
  async isRequired(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the control shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id` of the combobox, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.control()).getAttribute('id')) ?? '';
  }

  /**
   * The ARIA name and description attributes as set on the combobox, `null` when absent. Without an
   * `ariaLabel` Optimus fills `label` with the text the select shows.
   */
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

  /** Moves focus to the combobox. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Removes focus from the combobox. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the combobox has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }
}
