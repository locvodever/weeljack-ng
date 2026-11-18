import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-datepicker` with {@link WjDatePickerHarness.with}. */
export interface WjDatePickerHarnessFilters extends BaseHarnessFilters {
  /** The text box's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/**
 * Test harness for `wj-datepicker`. Describes the control as a user meets it. The calendar is
 * read and driven in its day view, with the day, month and year cells found by Optimus's own
 * `data-date` and `data-pc-section` attributes, never by a class.
 *
 * Optimus drops a key pressed within about 20 ms of the calendar opening, and its enter motion
 * takes a moment: after {@link open}, wait until {@link isOpen} is true before pressing keys, and
 * after {@link close} wait for it to be false before the test ends.
 */
export class WjDatePickerHarness extends ComponentHarness {
  static hostSelector = 'wj-datepicker';

  private readonly control = this.locatorForOptional('input[role="combobox"]');
  private readonly button = this.locatorForOptional('button[aria-haspopup="dialog"]');
  private readonly panel = this.locatorForOptional('[role="dialog"], [role="group"]');
  private readonly days = this.locatorForAll('td > span[data-date]');
  private readonly month = this.locatorForOptional('[data-pc-section="selectmonth"]');
  private readonly year = this.locatorForOptional('[data-pc-section="selectyear"]');
  private readonly previous = this.locatorForOptional(
    '[data-pc-group-section="navigator"]:first-child > button',
  );
  private readonly next = this.locatorForOptional(
    '[data-pc-group-section="navigator"]:last-child > button',
  );

  /** Finds the date pickers that match `options`. */
  static with(options: WjDatePickerHarnessFilters = {}): HarnessPredicate<WjDatePickerHarness> {
    return new HarnessPredicate(WjDatePickerHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('placeholder', options.placeholder, async (harness, placeholder) =>
        HarnessPredicate.stringMatches(await harness.getPlaceholder(), placeholder),
      );
  }

  /** Whether this is an inline calendar, with no text box. */
  async isInline(): Promise<boolean> {
    return (await this.control()) === null;
  }

  /** Whether the calendar is showing: an inline one always is, a popup one while it is open. */
  async isOpen(): Promise<boolean> {
    const control = await this.control();
    if (control === null) {
      return true;
    }
    return (await control.getAttribute('aria-expanded')) === 'true';
  }

  /**
   * Opens the popup by focusing the text box, which is what Optimus opens it on. Does nothing for an
   * inline calendar or when it is open already.
   */
  async open(): Promise<void> {
    const control = await this.control();
    if (control !== null && !(await this.isOpen())) {
      await control.focus();
      await control.click();
    }
  }

  /** Closes the popup with Escape, as a user does. Focus stays on the text box. */
  async close(): Promise<void> {
    const control = await this.control();
    if (control !== null && (await this.isOpen())) {
      await control.sendKeys(TestKey.ESCAPE);
    }
  }

  /** Clicks the calendar button, which opens a closed popup and closes an open one. */
  async clickButton(): Promise<void> {
    const button = await this.button();
    if (button === null) {
      throw new Error('This date picker has no calendar button: set showIcon.');
    }
    await button.click();
  }

  /** The text shown in the text box, `''` for an inline calendar. */
  async getText(): Promise<string> {
    return (await (await this.control())?.getProperty<string>('value')) ?? '';
  }

  /**
   * Types a date into the text box one key at a time, after the text already there. The date is
   * read when Optimus gets a complete, pickable one.
   */
  async typeText(text: string): Promise<void> {
    const control = await this.requireControl();
    await control.sendKeys(text);
  }

  /** Empties the text box, which makes the value `null`. */
  async clear(): Promise<void> {
    const control = await this.requireControl();
    await control.focus();
    // Optimus reads an `input` event only after a key went down in the box.
    await control.dispatchEvent('keydown', { key: 'Backspace', keyCode: 8, which: 8 });
    await control.clear();
  }

  /** Picks the day `day` of the shown month by clicking it. Throws when it cannot be picked. */
  async selectDay(day: number): Promise<void> {
    const cell = await this.dayCell(day);
    if (await this.isDisabledCell(cell)) {
      throw new Error(`Day ${String(day)} of the shown month cannot be picked.`);
    }
    await cell.click();
  }

  /** Whether day `day` of the shown month cannot be picked: outside the limits, or switched off. */
  async isDayDisabled(day: number): Promise<boolean> {
    return this.isDisabledCell(await this.dayCell(day));
  }

  /** The month shown in the calendar header, as the translation names it. */
  async getMonth(): Promise<string> {
    return (await (await this.requirePart(this.month, 'month')).text()).trim();
  }

  /** The year shown in the calendar header. */
  async getYear(): Promise<number> {
    return Number((await (await this.requirePart(this.year, 'year')).text()).trim());
  }

  /** Shows the next month, by clicking the next button. */
  async nextMonth(): Promise<void> {
    await (await this.requirePart(this.next, 'next button')).click();
  }

  /** Shows the previous month, by clicking the previous button. */
  async previousMonth(): Promise<void> {
    await (await this.requirePart(this.previous, 'previous button')).click();
  }

  /** Whether the control cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    const control = await this.control();
    if (control !== null) {
      return control.getProperty<boolean>('disabled');
    }
    // Optimus makes a disabled calendar's panel (and so its days) ignore the pointer.
    return (await (await this.panel())?.getCssValue('pointer-events')) === 'none';
  }

  /** Whether the text box is required. */
  async isRequired(): Promise<boolean> {
    return (await (await this.control())?.getProperty<boolean>('required')) ?? false;
  }

  /** Whether the control shows the invalid state: `aria-invalid="true"` on the text box. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control())?.getAttribute('aria-invalid')) === 'true';
  }

  /** The `id` of the text box, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.control())?.getAttribute('id')) ?? '';
  }

  /** The `placeholder`, `null` when absent. */
  async getPlaceholder(): Promise<string | null> {
    return (await (await this.control())?.getAttribute('placeholder')) ?? null;
  }

  /**
   * The ARIA name and description attributes as set on the text box, or on the calendar for an
   * inline one, `null` when absent.
   */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const target = (await this.control()) ?? (await this.panel());
    return {
      label: (await target?.getAttribute('aria-label')) ?? null,
      labelledBy: (await target?.getAttribute('aria-labelledby')) ?? null,
      describedBy: (await target?.getAttribute('aria-describedby')) ?? null,
    };
  }

  /** Moves focus to the text box, which opens the popup. */
  async focus(): Promise<void> {
    await (await this.requireControl()).focus();
  }

  /** Removes focus from the text box. */
  async blur(): Promise<void> {
    await (await this.requireControl()).blur();
  }

  /** Whether the text box has focus. */
  async isFocused(): Promise<boolean> {
    return (await (await this.control())?.isFocused()) ?? false;
  }

  private async requireControl(): Promise<TestElement> {
    return this.requirePart(this.control, 'text box');
  }

  private async requirePart(
    part: () => Promise<TestElement | null>,
    name: string,
  ): Promise<TestElement> {
    const found = await part();
    if (found === null) {
      throw new Error(`The date picker has no ${name} to use: is the calendar open?`);
    }
    return found;
  }

  /** The cell of day `day` of the shown month: the 15th is always in it, and names its month. */
  private async dayCell(day: number): Promise<TestElement> {
    const cells = await this.days();
    const keys = await Promise.all(cells.map((cell) => cell.getAttribute('data-date')));
    const fifteenth = await Promise.all(cells.map((cell) => cell.text()));
    const anchor = keys[fifteenth.findIndex((text) => text.trim() === '15')];
    const month = anchor?.slice(0, anchor.lastIndexOf('-'));
    const wanted = `${month ?? ''}-${String(day)}`;
    const found = cells[keys.indexOf(wanted)];
    if (found === undefined) {
      throw new Error(`Day ${String(day)} is not in the shown month: is the calendar open?`);
    }
    return found;
  }

  private async isDisabledCell(cell: TestElement): Promise<boolean> {
    return (await cell.getCssValue('pointer-events')) === 'none';
  }
}
