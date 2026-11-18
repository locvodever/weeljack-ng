import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-inputotp` with {@link WjInputOtpHarness.with}. */
export interface WjInputOtpHarnessFilters extends BaseHarnessFilters {
  /** The group's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** How many boxes the group has. */
  length?: number;
}

/** Test harness for `wj-inputotp`. Describes the control as a user meets it. */
export class WjInputOtpHarness extends ComponentHarness {
  static hostSelector = 'wj-inputotp';

  private readonly group = this.locatorFor('[role="group"]');
  private readonly boxes = this.locatorForAll('input');

  /** Finds the controls that match `options`. */
  static with(options: WjInputOtpHarnessFilters = {}): HarnessPredicate<WjInputOtpHarness> {
    return new HarnessPredicate(WjInputOtpHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getGroupAttributes()).label, ariaLabel),
      )
      .addOption(
        'length',
        options.length,
        async (harness, length) => (await harness.getLength()) === length,
      );
  }

  /** The characters in the boxes, joined: an empty string while every box is empty. */
  async getValue(): Promise<string> {
    const values = await Promise.all(
      (await this.boxes()).map((box) => box.getProperty<string>('value')),
    );
    return values.join('');
  }

  /**
   * Types `code` one character to a box, from the first, as a user does. Each box is focused,
   * emptied, and given its character. Characters beyond the last box are dropped.
   */
  async typeCode(code: string): Promise<void> {
    const boxes = await this.boxes();
    const characters = Array.from(code).slice(0, boxes.length);
    for (const [index, character] of characters.entries()) {
      const box = boxes[index];
      if (box === undefined) break;
      await box.focus();
      await box.clear();
      await box.sendKeys(character);
    }
  }

  /** Pastes `code` into the first box, which fills every box in turn. */
  async pasteCode(code: string): Promise<void> {
    const [first] = await this.boxes();
    await first?.dispatchEvent('paste', { clipboardData: { getData: () => code } });
  }

  /** Empties every box. */
  async clear(): Promise<void> {
    for (const box of await this.boxes()) {
      await box.clear();
    }
  }

  /** How many boxes there are. */
  async getLength(): Promise<number> {
    return (await this.boxes()).length;
  }

  /** The `aria-label` of every box, in order. */
  async getBoxNames(): Promise<(string | null)[]> {
    return Promise.all((await this.boxes()).map((box) => box.getAttribute('aria-label')));
  }

  /** The group's name and description attributes, `null` when absent. */
  async getGroupAttributes(): Promise<{ label: string | null; labelledBy: string | null }> {
    const group = await this.group();
    return {
      label: await group.getAttribute('aria-label'),
      labelledBy: await group.getAttribute('aria-labelledby'),
    };
  }

  /** The `aria-describedby` of the first box, `null` when absent. */
  async getDescribedBy(): Promise<string | null> {
    const [first] = await this.boxes();
    return (await first?.getAttribute('aria-describedby')) ?? null;
  }

  /** Whether every box is disabled. */
  async isDisabled(): Promise<boolean> {
    return this.every((box) => box.getProperty<boolean>('disabled'));
  }

  /** Whether every box is required. */
  async isRequired(): Promise<boolean> {
    return this.every((box) => box.getProperty<boolean>('required'));
  }

  /** Whether every box shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return this.every(async (box) => (await box.getAttribute('aria-invalid')) === 'true');
  }

  /** The `id` of the first box, or an empty string when it has none. */
  async getId(): Promise<string> {
    const [first] = await this.boxes();
    return (await first?.getAttribute('id')) ?? '';
  }

  /** Moves focus to the first box. */
  async focus(): Promise<void> {
    const [first] = await this.boxes();
    await first?.focus();
  }

  /** Removes focus from the box that has it. */
  async blur(): Promise<void> {
    for (const box of await this.boxes()) {
      if (await box.isFocused()) await box.blur();
    }
  }

  /** Whether any box has focus. */
  async isFocused(): Promise<boolean> {
    const flags = await Promise.all((await this.boxes()).map((box) => box.isFocused()));
    return flags.some(Boolean);
  }

  private async every(test: (box: TestElement) => Promise<boolean>): Promise<boolean> {
    const results = await Promise.all((await this.boxes()).map(test));
    return results.length > 0 && results.every(Boolean);
  }
}
