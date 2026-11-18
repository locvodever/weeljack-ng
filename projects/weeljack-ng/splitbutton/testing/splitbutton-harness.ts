import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-splitbutton` with {@link WjSplitButtonHarness.with}. */
export interface WjSplitButtonHarnessFilters extends BaseHarnessFilters {
  /** The main button's visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** Criteria for finding a menu item with {@link WjSplitButtonItemHarness.with}. */
export interface WjSplitButtonItemHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * One item of a split button's menu, as a user meets it, at any level that is on the page. Found
 * through {@link WjSplitButtonHarness.getItems}. Separators are not items.
 */
export class WjSplitButtonItemHarness extends ComponentHarness {
  static hostSelector = '[role="menuitem"]';

  private readonly content = this.locatorFor('[data-pc-section="itemcontent"]');

  /** Finds the items whose visible text matches `options.label`. */
  static with(
    options: WjSplitButtonItemHarnessFilters = {},
  ): HarnessPredicate<WjSplitButtonItemHarness> {
    return new HarnessPredicate(WjSplitButtonItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible text of the item, trimmed. The labels of its open submenu are not part of it. */
  async getLabel(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** Whether the item is inert: it is skipped by the arrow keys and runs nothing. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the item opens a submenu. */
  async hasSubmenu(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) !== null;
  }

  /** Opens the item's submenu, as a click on it does. Its items are then found by `getItems()`. */
  async openSubmenu(): Promise<void> {
    if (!(await this.hasSubmenu())) {
      throw new Error('wj-splitbutton: the item has no submenu');
    }
    if ((await (await this.host()).getAttribute('aria-expanded')) !== 'true') {
      await this.click();
    }
  }

  /** Clicks the item: it runs its command, or opens its submenu. A disabled item does nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.content()).click(modifiers);
  }
}

/**
 * Test harness for `wj-splitbutton`. Describes the control as a user meets it: the main button's
 * text, the menu button's name, and the popup's items. A closed popup renders nothing, so
 * {@link isMenuOpen} is the only safe reading of it until {@link openMenu} has run. The popup is
 * found in the document, wherever it renders. Items of a submenu are on the page only while it is
 * open: open it with {@link WjSplitButtonItemHarness.openSubmenu} first.
 */
export class WjSplitButtonHarness extends ComponentHarness {
  static hostSelector = 'wj-splitbutton';

  private readonly mainButton = this.locatorFor('button:not([aria-haspopup])');
  private readonly menuButton = this.locatorFor('button[aria-haspopup]');

  /** Finds the split buttons whose main button's text matches `options.label`. */
  static with(options: WjSplitButtonHarnessFilters = {}): HarnessPredicate<WjSplitButtonHarness> {
    return new HarnessPredicate(WjSplitButtonHarness, options).addOption(
      'label',
      options.label,
      async (harness, label) => HarnessPredicate.stringMatches(await harness.getLabel(), label),
    );
  }

  /** The popup is the element the menu button controls: `#<id>`, in the host or on `body`. */
  private async popupSelector(): Promise<string> {
    const id = await (await this.menuButton()).getAttribute('aria-controls');
    return `#${CSS.escape(id ?? '')}`;
  }

  /** The text of the main button, trimmed. */
  async getLabel(): Promise<string> {
    return (await (await this.mainButton()).text()).trim();
  }

  /** The menu button's accessible name: its `aria-label`, or an empty string. */
  async getMenuButtonName(): Promise<string> {
    return (await (await this.menuButton()).getAttribute('aria-label')) ?? '';
  }

  /** Whether the main button is inert, as `disabled` makes it. */
  async isDisabled(): Promise<boolean> {
    return (await this.mainButton()).getProperty<boolean>('disabled');
  }

  /** Whether the menu button is inert: `disabled`, or a menu with no items. */
  async isMenuButtonDisabled(): Promise<boolean> {
    return (await this.menuButton()).getProperty<boolean>('disabled');
  }

  /** Clicks the main button. */
  async clickButton(): Promise<void> {
    await (await this.mainButton()).click();
  }

  /** Whether the popup is open. */
  async isMenuOpen(): Promise<boolean> {
    return (await this.popupList()) !== null;
  }

  private async popupList(): Promise<unknown> {
    return this.documentRootLocatorFactory().locatorForOptional(
      `${await this.popupSelector()} [role="menu"]`,
    )();
  }

  /** Opens the popup, as a click on the menu button does, unless it is already open. */
  async openMenu(): Promise<void> {
    if (!(await this.isMenuOpen())) {
      await (await this.menuButton()).click();
    }
  }

  /** Closes the popup, as a click on the menu button does, unless it is already closed. */
  async closeMenu(): Promise<void> {
    if (await this.isMenuOpen()) {
      await (await this.menuButton()).click();
    }
  }

  /**
   * The items on the page, in order, that match `filters`: the top level, then the items of every
   * submenu that is open, each after its parent. None while the popup is closed.
   */
  async getItems(
    filters: WjSplitButtonItemHarnessFilters = {},
  ): Promise<WjSplitButtonItemHarness[]> {
    return this.documentRootLocatorFactory().locatorForAll(
      WjSplitButtonItemHarness.with({ ...filters, ancestor: await this.popupSelector() }),
    )();
  }

  /** The visible text of each item on the page, in order, as {@link getItems} lists them. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** Clicks the first item whose visible text is `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-splitbutton: no item with the label ${String(label)}`);
    }
    await item.click();
  }

  /** Moves focus to the main button. */
  async focusButton(): Promise<void> {
    await (await this.mainButton()).focus();
  }

  /** Moves focus to the menu button. */
  async focusMenuButton(): Promise<void> {
    await (await this.menuButton()).focus();
  }
}
