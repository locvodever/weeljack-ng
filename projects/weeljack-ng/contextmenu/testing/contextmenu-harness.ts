import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-contextmenu` with {@link WjContextMenuHarness.with}. */
export interface WjContextMenuHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/** Criteria for finding a menu item with {@link WjContextMenuItemHarness.with}. */
export interface WjContextMenuItemHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** Where the open menu renders: a direct child of `body`, outside the host. */
const BODY_OVERLAY = 'body > [data-pc-section="root"]';

/**
 * One item of a context menu, as a user meets it, at any level that is on the page. Found through
 * {@link WjContextMenuHarness.getItems}. Separators are not items.
 */
export class WjContextMenuItemHarness extends ComponentHarness {
  static hostSelector = '[role="menuitem"]';

  private readonly content = this.locatorFor('[data-pc-section="itemcontent"]');

  /** Finds the items whose visible text matches `options.label`. */
  static with(
    options: WjContextMenuItemHarnessFilters = {},
  ): HarnessPredicate<WjContextMenuItemHarness> {
    return new HarnessPredicate(WjContextMenuItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /**
   * The visible text of the item, trimmed: its `label`, or the text of its slot. The labels of the
   * items in its open submenu are not part of it.
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

  /** Whether the item opens a submenu. */
  async hasSubmenu(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) !== null;
  }

  /** Whether the item's submenu is open. `false` for an item without one. */
  async isSubmenuOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the item's submenu, as a click on it does. Its items are then found by `getItems()`. */
  async openSubmenu(): Promise<void> {
    if (!(await this.hasSubmenu())) {
      throw new Error('wj-contextmenu: the item has no submenu');
    }
    if (!(await this.isSubmenuOpen())) {
      await this.click();
    }
  }

  /** Clicks the item: it runs its command, or opens its submenu. A disabled item does nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.content()).click(modifiers);
  }
}

/**
 * Test harness for `wj-contextmenu`. Describes the menu as a user meets it: its name, its items,
 * separators and whether it is open. A menu that is closed renders nothing, so {@link isOpen} is
 * the only reading that is safe then, and a closed menu has no name: find it without a `name`
 * filter. Items of a submenu are on the page only while it is open: open it with
 * {@link WjContextMenuItemHarness.openSubmenu} first. The open menu lives in `body`, and is found
 * in the document: with several open at once, the first one is read.
 */
export class WjContextMenuHarness extends ComponentHarness {
  static hostSelector = 'wj-contextmenu';

  private readonly list = this.locatorForOptional('[role="menu"]');
  private readonly bodyList = this.documentRootLocatorFactory().locatorForOptional(
    `${BODY_OVERLAY} [role="menu"]`,
  );

  /** Finds the menus whose name matches `options.name`. */
  static with(options: WjContextMenuHarnessFilters = {}): HarnessPredicate<WjContextMenuHarness> {
    return new HarnessPredicate(WjContextMenuHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /** The root `role="menu"` list: in the host before it moves, in the document once it is open. */
  private async requireList(): Promise<TestElement> {
    const list = (await this.list()) ?? (await this.bodyList());
    if (list === null) {
      throw new Error('wj-contextmenu: the menu is not rendered: it has no items, or it is closed');
    }
    return list;
  }

  /** The text of the element with `id`, anywhere in the document, or `null`. */
  private async textOfId(id: string): Promise<string | null> {
    const element = await this.documentRootLocatorFactory().locatorForOptional(
      `#${CSS.escape(id)}`,
    )();
    return (await element?.text())?.trim() ?? null;
  }

  /**
   * Whether the menu is open. A menu with no items, or one that was never opened, renders nothing
   * and is never open.
   */
  async isOpen(): Promise<boolean> {
    return ((await this.list()) ?? (await this.bodyList())) !== null;
  }

  /**
   * The list's name: its `aria-label`, else the text of the element its `aria-labelledby` points
   * at, else an empty string, which is also what a closed menu has.
   */
  async getName(): Promise<string> {
    if (!(await this.isOpen())) {
      return '';
    }
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
    const list = await this.requireList();
    return {
      label: await list.getAttribute('aria-label'),
      labelledBy: await list.getAttribute('aria-labelledby'),
      describedBy: await list.getAttribute('aria-describedby'),
    };
  }

  /**
   * The items on the page, in order, that match `filters`: the top level, then the items of every
   * submenu that is open, each after its parent.
   */
  async getItems(
    filters: WjContextMenuItemHarnessFilters = {},
  ): Promise<WjContextMenuItemHarness[]> {
    const inHost = await this.locatorForAll(WjContextMenuItemHarness.with(filters))();
    if (inHost.length > 0) {
      return inHost;
    }
    return this.documentRootLocatorFactory().locatorForAll(
      WjContextMenuItemHarness.with({ ...filters, ancestor: BODY_OVERLAY }),
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

  /** How many separators the menu draws, in every level on the page. */
  async getSeparatorCount(): Promise<number> {
    await this.requireList();
    const inHost = await this.locatorForAll('[role="separator"]')();
    if (inHost.length > 0) {
      return inHost.length;
    }
    const inBody = this.documentRootLocatorFactory().locatorForAll(
      `${BODY_OVERLAY} [role="separator"]`,
    );
    return (await inBody()).length;
  }

  /** Clicks the first item whose visible text is `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-contextmenu: no item with the label ${String(label)}`);
    }
    await item.click();
  }

  /** Moves focus to the root list, as Tab does. */
  async focus(): Promise<void> {
    await (await this.requireList()).focus();
  }

  /** Whether the root list has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.requireList()).isFocused();
  }
}
