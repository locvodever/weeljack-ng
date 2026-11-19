import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-selectbutton` with {@link WjSelectButtonHarness.with}. */
export interface WjSelectButtonHarnessFilters extends BaseHarnessFilters {
  /** The group's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The label of the picked option (an empty string while none is picked), string or RegExp. */
  selectedLabel?: string | RegExp;
}

/**
 * Test harness for `wj-selectbutton`. Describes the group as a user meets it: its buttons, the
 * picked one, and its ARIA state. It never names an Optimus class. The group element exists with no
 * options too, so every method works without them.
 */
export class WjSelectButtonHarness extends ComponentHarness {
  static hostSelector = 'wj-selectbutton';

  private readonly group = this.locatorFor('[role="group"]');
  private readonly buttons = this.locatorForAll('[role="button"]');

  /** Finds the groups that match `options`. */
  static with(options: WjSelectButtonHarnessFilters = {}): HarnessPredicate<WjSelectButtonHarness> {
    return new HarnessPredicate(WjSelectButtonHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('selectedLabel', options.selectedLabel, async (harness, selectedLabel) =>
        HarnessPredicate.stringMatches((await harness.getSelectedLabel()) ?? '', selectedLabel),
      );
  }

  /** The labels of the buttons, in order. */
  async getOptionLabels(): Promise<string[]> {
    return Promise.all((await this.buttons()).map(async (button) => (await button.text()).trim()));
  }

  /** Picks the option with exactly this label by clicking its button. Throws when there is none. */
  async selectOption(label: string): Promise<void> {
    await (await this.find(label)).click();
  }

  /** The label of the picked option, `null` while none is picked. */
  async getSelectedLabel(): Promise<string | null> {
    for (const button of await this.buttons()) {
      if ((await button.getAttribute('aria-pressed')) === 'true') {
        return (await button.text()).trim();
      }
    }
    return null;
  }

  /** Whether the option with this label is shown but cannot be picked. Throws when there is none. */
  async isOptionDisabled(label: string): Promise<boolean> {
    return (await (await this.find(label)).getAttribute('aria-disabled')) === 'true';
  }

  /** Moves focus to the button with this label. Does not pick anything. Throws when there is none. */
  async focusOption(label: string): Promise<void> {
    await (await this.find(label)).focus();
  }

  /** Whether the whole group cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.group()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the group shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.group()).getAttribute('aria-invalid')) === 'true';
  }

  /** The ARIA name and description attributes as set on the group, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const group = await this.group();
    return {
      label: await group.getAttribute('aria-label'),
      labelledBy: await group.getAttribute('aria-labelledby'),
      describedBy: await group.getAttribute('aria-describedby'),
    };
  }

  /** Removes focus from the button of the group that has it, if any. */
  async blur(): Promise<void> {
    for (const button of await this.buttons()) {
      if (await button.isFocused()) {
        await button.blur();
      }
    }
  }

  /** Whether one of the group's buttons has focus. */
  async isFocused(): Promise<boolean> {
    for (const button of await this.buttons()) {
      if (await button.isFocused()) {
        return true;
      }
    }
    return false;
  }

  private async find(label: string): Promise<TestElement> {
    for (const button of await this.buttons()) {
      if ((await button.text()).trim() === label) {
        return button;
      }
    }
    throw new Error(`wj-selectbutton has no option labelled "${label}".`);
  }
}
