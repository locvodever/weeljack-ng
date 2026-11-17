import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-megamenu` with {@link WjMegaMenuHarness.with}. */
export interface WjMegaMenuHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/** Criteria for finding a menu item with {@link WjMegaMenuItemHarness.with}. */
export interface WjMegaMenuItemHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Optimus renders every panel's items and hides the closed ones, so an item counts only when no
 * ancestor of it is a closed parent.
 */
const ON_THE_PAGE = ':not([aria-expanded="false"] *)';

/**
 * One item of a megamenu, as a user meets it: a root item, or an entry of an open panel. Found
 * through {@link WjMegaMenuHarness.getItems}. Group headers and separators are not items.
 */
export class WjMegaMenuItemHarness extends ComponentHarness {
  static hostSelector = '[role="menuitem"]';

  private readonly content = this.locatorFor('[data-pc-section="itemcontent"]');
  private readonly groups = this.locatorForAll('[role="presentation"]');
  private readonly entries = this.locatorForAll(
    '[data-pc-section="overlay"] [data-pc-section="itemcontent"]',
  );

  /** Finds the items whose visible text matches `options.label`. */
  static with(options: WjMegaMenuItemHarnessFilters = {}): HarnessPredicate<WjMegaMenuItemHarness> {
    return new HarnessPredicate(WjMegaMenuItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /**
   * The visible text of the item, trimmed: its `label`, or the text of its slot. The text of the
   * items in its panel is not part of it.
   */
  async getLabel(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** Whether the item is inert: it is skipped by the arrow keys and runs nothing. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the keyboard has moved onto the item: the list's active item. */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-p-focused')) === 'true';
  }

  /** Whether the item opens a panel. */
  async hasSubmenu(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) !== null;
  }

  /** Whether the item's panel is open. `false` for an item without one. */
  async isSubmenuOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the item's panel, as a click on it does. Its items are then found by `getItems()`. */
  async openSubmenu(): Promise<void> {
    if (!(await this.hasSubmenu())) {
      throw new Error('wj-megamenu: the item has no panel');
    }
    if (!(await this.isSubmenuOpen())) {
      await this.click();
    }
  }

  /** The group headers of the item's panel, column by column, in order. */
  async getGroupLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const group of await this.groups()) {
      labels.push((await group.text()).trim());
    }
    return labels;
  }

  /** The visible text of the entries of the item's panel, column by column, in order. */
  async getEntryLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const entry of await this.entries()) {
      labels.push((await entry.text()).trim());
    }
    return labels;
  }

  /** Clicks the item: it runs its command, or opens its panel. A disabled item does nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.content()).click(modifiers);
  }
}

/**
 * Test harness for `wj-megamenu`. Describes the menu as a user meets it: its name, its root items,
 * the group headers and entries of an open panel, separators and, on a narrow screen, the
 * Navigation button. The items of a panel are on the page only while it is open: open it with
 * {@link WjMegaMenuItemHarness.openSubmenu} first. On a narrow screen the list is hidden until
 * {@link toggleMobileMenu} opens it.
 */
export class WjMegaMenuHarness extends ComponentHarness {
  static hostSelector = 'wj-megamenu';

  private readonly list = this.locatorFor('[data-pc-section="rootlist"]');
  private readonly mobileButton = this.locatorForOptional('[data-pc-section="button"]');

  /** Finds the menus whose name matches `options.name`. */
  static with(options: WjMegaMenuHarnessFilters = {}): HarnessPredicate<WjMegaMenuHarness> {
    return new HarnessPredicate(WjMegaMenuHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /** The text of the element with `id`, anywhere in the document, or `null`. */
  private async textOfId(id: string): Promise<string | null> {
    const element = await this.documentRootLocatorFactory().locatorForOptional(
      `#${CSS.escape(id)}`,
    )();
    return (await element?.text())?.trim() ?? null;
  }

  /**
   * The list's name: its `aria-label`, else the text of the element its `aria-labelledby` points
   * at, else an empty string.
   */
  async getName(): Promise<string> {
    const { label, labelledBy } = await this.getAriaAttributes();
    if (label !== null) {
      return label;
    }
    return (labelledBy === null ? null : await this.textOfId(labelledBy)) ?? '';
  }

  /** The ARIA name and description attributes as set on the root list, `null` when absent. */
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

  /** `'horizontal'` or `'vertical'`: how the root items are laid out. */
  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    return (await (await this.list()).getAttribute('aria-orientation')) === 'vertical'
      ? 'vertical'
      : 'horizontal';
  }

  /**
   * The items on the page, in order, that match `filters`: the root items, then the entries of every
   * panel that is open, each after its parent.
   */
  async getItems(filters: WjMegaMenuItemHarnessFilters = {}): Promise<WjMegaMenuItemHarness[]> {
    return this.locatorForAll(WjMegaMenuItemHarness.with({ ...filters, selector: ON_THE_PAGE }))();
  }

  /** The visible text of each item on the page, in order, as {@link getItems} lists them. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** The group headers of the open panels, in order. */
  async getGroupLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const group of await this.locatorForAll(`[role="presentation"]${ON_THE_PAGE}`)()) {
      labels.push((await group.text()).trim());
    }
    return labels;
  }

  /** How many separators the menu draws, in every level on the page. */
  async getSeparatorCount(): Promise<number> {
    return (await this.locatorForAll(`[role="separator"]${ON_THE_PAGE}`)()).length;
  }

  /** Whether a panel is open: some root item has its panel showing. */
  async isPanelOpen(): Promise<boolean> {
    return (await this.locatorForAll('[role="menuitem"][aria-expanded="true"]')()).length > 0;
  }

  /** Clicks the first item whose visible text is `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-megamenu: no item with the label ${String(label)}`);
    }
    await item.click();
  }

  /** Moves focus to the root list, as Tab does. */
  async focus(): Promise<void> {
    await (await this.list()).focus();
  }

  /** Whether the root list has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.list()).isFocused();
  }

  /**
   * The Navigation button's accessible name, from the translation (`translation.aria.navigation`),
   * or `null` when the menu has no button: it has no items.
   */
  async getMobileButtonName(): Promise<string | null> {
    return (await (await this.mobileButton())?.getAttribute('aria-label')) ?? null;
  }

  /** Whether the narrow layout's list is open. `false` while the menu has no button. */
  async isMobileMenuOpen(): Promise<boolean> {
    return (await (await this.mobileButton())?.getAttribute('aria-expanded')) === 'true';
  }

  /** Clicks the Navigation button, which opens a closed list and closes an open one. */
  async toggleMobileMenu(): Promise<void> {
    const button = await this.mobileButton();
    if (button === null) {
      throw new Error('wj-megamenu: the menu has no Navigation button: it has no items');
    }
    await button.click();
  }
}
