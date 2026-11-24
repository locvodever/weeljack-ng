import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-listbox` with {@link WjListboxHarness.with}. */
export interface WjListboxHarnessFilters extends BaseHarnessFilters {
  /** The list's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The label of the picked option (an empty string while none is picked), string or RegExp. */
  selectedLabel?: string | RegExp;
}

/**
 * Test harness for `wj-listbox`. Describes the list as a user meets it: its rows, the picked one,
 * and its ARIA state. It never names an Optimus class. Optimus renders no `listbox` element for an
 * empty list, only the message, so every method that reads the list's own state (`isDisabled`,
 * `isRequired`, `isInvalid`, `getAriaAttributes`, `focus`, `blur`, `isFocused`) needs at least one
 * option; `getOptionLabels` and `getEmptyMessage` work either way.
 */
export class WjListboxHarness extends ComponentHarness {
  static hostSelector = 'wj-listbox';

  private readonly list = this.locatorFor('[role="listbox"]');
  private readonly options = this.locatorForAll('[role="option"]');
  private readonly empty = this.locatorForOptional('[data-pc-section="emptymessage"]');
  private readonly entry = this.locatorForOptional(
    '[data-pc-section="hiddenfirstfocusableelement"]',
  );

  /** Finds the lists that match `options`. */
  static with(options: WjListboxHarnessFilters = {}): HarnessPredicate<WjListboxHarness> {
    return new HarnessPredicate(WjListboxHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('selectedLabel', options.selectedLabel, async (harness, selectedLabel) =>
        HarnessPredicate.stringMatches((await harness.getSelectedLabel()) ?? '', selectedLabel),
      );
  }

  /** The labels of the options, in order. Empty for an empty list. */
  async getOptionLabels(): Promise<string[]> {
    return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
  }

  /** The text of the empty message, `null` while the list has options. */
  async getEmptyMessage(): Promise<string | null> {
    const message = await this.empty();
    return message === null ? null : (await message.text()).trim();
  }

  /** Picks the option with exactly this label by clicking it. Throws when there is none. */
  async selectOption(label: string): Promise<void> {
    await (await this.find(label)).click();
  }

  /** The label of the picked option, `null` while none is picked. */
  async getSelectedLabel(): Promise<string | null> {
    for (const option of await this.options()) {
      if ((await option.getAttribute('aria-selected')) === 'true') {
        return (await option.text()).trim();
      }
    }
    return null;
  }

  /** Whether the option with this label is shown but cannot be picked. Throws when there is none. */
  async isOptionDisabled(label: string): Promise<boolean> {
    return (await (await this.find(label)).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the list cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.list()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the list is required (`aria-required="true"`). */
  async isRequired(): Promise<boolean> {
    return (await (await this.list()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the list shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.list()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * The `id` of the element a `wj-field` focuses when its label is clicked, or an empty string when
   * it has none (outside a field without `inputId`, and while the list is disabled).
   */
  async getId(): Promise<string> {
    return (await (await this.entry())?.getAttribute('id')) ?? '';
  }

  /** The ARIA name and description attributes as set on the list, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const list = await this.list();
    return {
      label: await list.getAttribute('aria-label'),
      labelledBy: await list.getAttribute('aria-labelledby'),
      describedBy: await list.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus to the list. Does not pick anything. */
  async focus(): Promise<void> {
    await (await this.list()).focus();
  }

  /** Removes focus from the list. */
  async blur(): Promise<void> {
    await (await this.list()).blur();
  }

  /** Whether the list has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.list()).isFocused();
  }

  private async find(label: string): Promise<TestElement> {
    for (const option of await this.options()) {
      if ((await option.text()).trim() === label) {
        return option;
      }
    }
    throw new Error(`wj-listbox has no option labelled "${label}".`);
  }
}
