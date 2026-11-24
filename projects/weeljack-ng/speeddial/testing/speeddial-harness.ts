import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-speeddial` with {@link WjSpeedDialHarness.with}. */
export interface WjSpeedDialHarnessFilters extends BaseHarnessFilters {
  /**
   * The toggle's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/** Criteria for finding a speed-dial action with {@link WjSpeedDialItemHarness.with}. */
export interface WjSpeedDialItemHarnessFilters extends BaseHarnessFilters {
  /** The action's name (its `label`), as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * One action of a speed dial, as a user meets it: a round button named by its `label`, which is
 * never drawn. Found through {@link WjSpeedDialHarness.getItems}. An action is out of reach while
 * the dial is closed, so open the dial before clicking it.
 */
export class WjSpeedDialItemHarness extends ComponentHarness {
  static hostSelector = '[role="menuitem"][data-pc-section="item"]';

  private readonly button = this.locatorFor('button');

  /** Finds the actions whose name matches `options.label`. */
  static with(
    options: WjSpeedDialItemHarnessFilters = {},
  ): HarnessPredicate<WjSpeedDialItemHarness> {
    return new HarnessPredicate(WjSpeedDialItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The action's name: its `label`, as an accessible name, or an empty string. */
  async getLabel(): Promise<string> {
    return (await (await this.button()).getAttribute('aria-label')) ?? '';
  }

  /** Whether the action is disabled: it runs nothing, though the arrow keys still land on it. */
  async isDisabled(): Promise<boolean> {
    return (await this.button()).getProperty<boolean>('disabled');
  }

  /** Whether the keyboard has moved onto the action: the list's active item. */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-p-active')) === 'true';
  }

  /** Clicks the action: it runs its command and closes the dial. A disabled action runs nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.button()).click(modifiers);
  }
}

/**
 * Test harness for `wj-speeddial`. Describes the dial as a user meets it: the toggle, whether the
 * actions are open, and the actions by name.
 */
export class WjSpeedDialHarness extends ComponentHarness {
  static hostSelector = 'wj-speeddial';

  private readonly toggleButton = this.locatorFor('button[aria-haspopup]');

  /** Finds the dials whose name matches `options.name`. */
  static with(options: WjSpeedDialHarnessFilters = {}): HarnessPredicate<WjSpeedDialHarness> {
    return new HarnessPredicate(WjSpeedDialHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /** The toggle's name: its `aria-label`, else the text of its `aria-labelledby` element, else ''. */
  async getName(): Promise<string> {
    const toggle = await this.toggleButton();
    const labelledBy = await toggle.getAttribute('aria-labelledby');
    if (labelledBy !== null) {
      const element = await this.documentRootLocatorFactory().locatorForOptional(
        `#${CSS.escape(labelledBy)}`,
      )();
      const text = (await element?.text())?.trim();
      if (text) {
        return text;
      }
    }
    return (await toggle.getAttribute('aria-label')) ?? '';
  }

  /** Whether the actions are open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.toggleButton()).getAttribute('aria-expanded')) === 'true';
  }

  /** Clicks the toggle: opens a closed dial and closes an open one. */
  async toggle(): Promise<void> {
    await (await this.toggleButton()).click();
  }

  /** Opens the dial, when it is closed. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await this.toggle();
    }
  }

  /** Closes the dial, when it is open. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await this.toggle();
    }
  }

  /** Whether the whole dial is disabled, so the actions cannot open. */
  async isDisabled(): Promise<boolean> {
    return (await this.toggleButton()).getProperty<boolean>('disabled');
  }

  /** The actions, in order, that match `filters`. Items with `visible: false` are not drawn. */
  async getItems(filters: WjSpeedDialItemHarnessFilters = {}): Promise<WjSpeedDialItemHarness[]> {
    return this.locatorForAll(WjSpeedDialItemHarness.with(filters))();
  }

  /** The name of each action, in order. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** Opens the dial and clicks the first action named `label`; throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-speeddial: no action with the label ${String(label)}`);
    }
    await this.open();
    await item.click();
  }

  /** Moves focus to the toggle, as Tab does. */
  async focusToggle(): Promise<void> {
    await (await this.toggleButton()).focus();
  }
}
