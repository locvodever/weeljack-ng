import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-cascadeselect` with {@link WjCascadeSelectHarness.with}. */
export interface WjCascadeSelectHarnessFilters extends BaseHarnessFilters {
  /** The combobox's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /**
   * The text the closed control shows (the picked leaf's label or the placeholder; an empty string
   * when there is neither), string or RegExp.
   */
  text?: string | RegExp;
}

/**
 * Test harness for `wj-cascadeselect`. Describes the control as a user meets it: the text it shows,
 * the levels of its list and their rows, and its ARIA state. It never names an Optimus class.
 * Levels count from 1: level 1 is the list under the control, level 2 opens beside a group of
 * level 1, and so on.
 */
export class WjCascadeSelectHarness extends ComponentHarness {
  static hostSelector = 'wj-cascadeselect';

  private readonly control = this.locatorFor('[role="combobox"]');
  private readonly label = this.locatorFor('[data-pc-section="label"]');

  /** Finds the cascade selects that match `options`. */
  static with(
    options: WjCascadeSelectHarnessFilters = {},
  ): HarnessPredicate<WjCascadeSelectHarness> {
    return new HarnessPredicate(WjCascadeSelectHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getText(), text),
      );
  }

  /**
   * The text the closed control shows: the picked leaf's label, else the placeholder, else an
   * empty string (Optimus keeps a hidden placeholder text there).
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
      await (await this.control()).click();
    }
  }

  /** Closes the list with Escape, as a user does. Focus stays on the control. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.control()).sendKeys(TestKey.ESCAPE);
    }
  }

  /**
   * The labels of the rows of `level` (default 1), groups and leaves, in order. Empty while that
   * level is not open. Does not open anything.
   */
  async getOptionLabels(level = 1): Promise<string[]> {
    return Promise.all(
      (await this.contents(level)).map(async (content) => (await content.text()).trim()),
    );
  }

  /**
   * Opens the group with exactly this label at `level` (default 1) by clicking it, which opens the
   * list when it is closed. Throws when that level has no such row, or the row is a leaf.
   */
  async openGroup(label: string, level = 1): Promise<void> {
    if (level === 1) {
      await this.open();
    }
    const { row, content } = await this.find(label, level);
    const expanded = await row.getAttribute('aria-expanded');
    if (expanded === null) {
      throw new Error(`wj-cascadeselect row "${label}" at level ${String(level)} is not a group.`);
    }
    if (expanded !== 'true') {
      await content.click();
    }
  }

  /**
   * Picks a leaf by its path of labels, group by group (`['Australia', 'Victoria', 'Melbourne']`),
   * opening the list and each group on the way. Throws when a label is missing on its level.
   */
  async selectOption(path: string[]): Promise<void> {
    const leaf = path.at(-1);
    if (leaf === undefined) {
      throw new Error('wj-cascadeselect.selectOption needs a path of at least one label.');
    }
    for (const [index, label] of path.slice(0, -1).entries()) {
      await this.openGroup(label, index + 1);
    }
    await this.open();
    await (await this.find(leaf, path.length)).content.click();
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

  private rows(level: number): Promise<TestElement[]> {
    return this.locatorForAll(`[role="treeitem"][aria-level="${String(level)}"]`)();
  }

  /** The content of each row of `level`: what holds its text, and what a click lands on. */
  private contents(level: number): Promise<TestElement[]> {
    return this.locatorForAll(`[role="treeitem"][aria-level="${String(level)}"] > div`)();
  }

  /** The row with this label on `level`, and its content. */
  private async find(
    label: string,
    level: number,
  ): Promise<{ row: TestElement; content: TestElement }> {
    const index = (await this.getOptionLabels(level)).indexOf(label);
    const row = (await this.rows(level))[index];
    const content = (await this.contents(level))[index];
    if (row === undefined || content === undefined) {
      throw new Error(`wj-cascadeselect has no row labelled "${label}" at level ${String(level)}.`);
    }
    return { row, content };
  }
}
