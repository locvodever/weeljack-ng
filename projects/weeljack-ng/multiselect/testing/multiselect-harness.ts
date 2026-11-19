import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-multiselect` with {@link WjMultiSelectHarness.with}. */
export interface WjMultiSelectHarnessFilters extends BaseHarnessFilters {
  /** The combobox's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /**
   * The text the closed control shows (the picked labels, the count, or the placeholder; an empty
   * string when there is none of these), string or RegExp.
   */
  text?: string | RegExp;
}

/**
 * Test harness for `wj-multiselect`. Describes the control as a user meets it: the text it shows,
 * the options of its list and which are picked, the toggle-all checkbox, and its ARIA state. It
 * never names an Optimus class. Methods that pick open the list first and leave it open; the ones
 * that only read it (`getOptionLabels`, `isOptionDisabled`) never open anything, so they see an
 * empty list while it is closed.
 */
export class WjMultiSelectHarness extends ComponentHarness {
  static hostSelector = 'wj-multiselect';

  private readonly control = this.locatorFor('[role="combobox"]');
  private readonly label = this.locatorFor('[data-pc-section="label"]');
  /** Rows that carry `aria-selected`: the empty message is a `role="option"` row without it. */
  private readonly options = this.locatorForAll('[role="listbox"] [role="option"][aria-selected]');
  private readonly toggleAllBox = this.locatorForOptional(
    '[data-pc-section="header"] input[type="checkbox"]',
  );

  /** Finds the multi selects that match `options`. */
  static with(options: WjMultiSelectHarnessFilters = {}): HarnessPredicate<WjMultiSelectHarness> {
    return new HarnessPredicate(WjMultiSelectHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getText(), text),
      );
  }

  /**
   * The text the closed control shows: the placeholder while nothing is picked, then up to three
   * labels separated by commas, then the translation's count ("4 items selected"). An empty string
   * when there is no placeholder and nothing is picked (Optimus keeps a hidden placeholder text
   * there).
   */
  async getText(): Promise<string> {
    const label = await this.label();
    return (await label.getCssValue('visibility')) === 'hidden' ? '' : (await label.text()).trim();
  }

  /** Whether the list is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the list with a click, as a user does. Does nothing when it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.label()).click();
    }
  }

  /** Closes the list with Escape, as a user does. Focus stays on the control. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.control()).sendKeys(TestKey.ESCAPE);
    }
  }

  /** The labels of the options, in order. Empty while the list is closed. */
  async getOptionLabels(): Promise<string[]> {
    return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
  }

  /**
   * The labels of the picked options, in option order (not pick order). Opens the list, because
   * that is where the picks show.
   */
  async getSelectedLabels(): Promise<string[]> {
    await this.open();
    const picked: string[] = [];
    for (const option of await this.options()) {
      if ((await option.getAttribute('aria-selected')) === 'true') {
        picked.push((await option.text()).trim());
      }
    }
    return picked;
  }

  /**
   * Picks the option with exactly this label if it is not picked, unpicks it if it is, by clicking
   * it. Opens the list and leaves it open. Throws when there is no such option.
   */
  async toggleOption(label: string): Promise<void> {
    await this.open();
    await (await this.find(label)).click();
  }

  /** Whether the option with exactly this label is unavailable (disabled). Does not open the list. */
  async isOptionDisabled(label: string): Promise<boolean> {
    return (await (await this.find(label)).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Clicks the toggle-all checkbox: it picks every option, or unpicks them all when every one is
   * already picked. Opens the list and leaves it open.
   */
  async toggleAll(): Promise<void> {
    await this.open();
    const box = await this.toggleAllBox();
    if (box === null) {
      throw new Error('wj-multiselect has no toggle-all checkbox.');
    }
    await box.click();
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

  /** The `id` of the combobox, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.control()).getAttribute('id')) ?? '';
  }

  /** The ARIA name and description attributes as set on the combobox, `null` when absent. */
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

  /** Moves focus to the combobox. Does not open the list. */
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

  /** The option with exactly this label. */
  private async find(label: string): Promise<TestElement> {
    const options = await this.options();
    const labels = await this.getOptionLabels();
    const option = options[labels.indexOf(label)];
    if (option === undefined) {
      throw new Error(`wj-multiselect has no option labelled "${label}".`);
    }
    return option;
  }
}
