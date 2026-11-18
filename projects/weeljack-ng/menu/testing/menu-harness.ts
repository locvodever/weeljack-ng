import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-menu` with {@link WjMenuHarness.with}. */
export interface WjMenuHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/** Criteria for finding a menu item with {@link WjMenuItemHarness.with}. */
export interface WjMenuItemHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** Where a popup with `appendTo="body"` renders: a direct child of `body`, outside the host. */
const BODY_OVERLAY = 'body > [data-pc-section="root"]';

/**
 * One item of a menu, as a user meets it. Found through {@link WjMenuHarness.getItems}. Group
 * headers and separators are not items.
 */
export class WjMenuItemHarness extends ComponentHarness {
  static hostSelector = '[role="menuitem"]';

  private readonly content = this.locatorFor('[data-pc-section="itemcontent"]');

  /** Finds the items whose visible text matches `options.label`. */
  static with(options: WjMenuItemHarnessFilters = {}): HarnessPredicate<WjMenuItemHarness> {
    return new HarnessPredicate(WjMenuItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible text of the item, trimmed: its `label`, or the text of its slot. */
  async getLabel(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the item is inert: it is skipped by the arrow keys and runs nothing. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the keyboard has moved onto the item: the list's active item. */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-p-focused')) === 'true';
  }

  /** Clicks the item. A disabled item runs nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.content()).click(modifiers);
  }
}

/**
 * Test harness for `wj-menu`. Describes the menu as a user meets it: its name, its items, group
 * headers and separators, and, for a popup, whether it is open. A popup that is closed renders
 * nothing, so {@link isOpen} is the only reading that is safe then. A popup with `appendTo="body"`
 * is found in the document: with several open at once, the first one is read.
 */
export class WjMenuHarness extends ComponentHarness {
  static hostSelector = 'wj-menu';

  private readonly list = this.locatorForOptional('[role="menu"]');
  private readonly bodyList = this.documentRootLocatorFactory().locatorForOptional(
    `${BODY_OVERLAY} [role="menu"]`,
  );

  /** Finds the menus whose name matches `options.name`. */
  static with(options: WjMenuHarnessFilters = {}): HarnessPredicate<WjMenuHarness> {
    return new HarnessPredicate(WjMenuHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /** The `role="menu"` list, in the host or, for a popup on `body`, in the document. */
  private async requireList(): Promise<TestElement> {
    const list = (await this.list()) ?? (await this.bodyList());
    if (list === null) {
      throw new Error('wj-menu: the menu is not rendered: it has no items, or a popup is closed');
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

  /** The elements inside the list that match `selector`, in order. */
  private async inList(selector: string): Promise<TestElement[]> {
    const id = await (await this.requireList()).getAttribute('id');
    if (id === null) {
      throw new Error('wj-menu: the list has no id');
    }
    return this.documentRootLocatorFactory().locatorForAll(`#${CSS.escape(id)} ${selector}`)();
  }

  /**
   * Whether the menu is on the page: an inline menu with items, or a popup that is open. A menu
   * with no items renders nothing and is never open.
   */
  async isOpen(): Promise<boolean> {
    return ((await this.list()) ?? (await this.bodyList())) !== null;
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

  /** The ARIA name and description attributes as set on the list, `null` when absent. */
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

  /** The items, in order, that match `filters`. Group headers and separators are not included. */
  async getItems(filters: WjMenuItemHarnessFilters = {}): Promise<WjMenuItemHarness[]> {
    const inHost = await this.locatorForAll(WjMenuItemHarness.with(filters))();
    if (inHost.length > 0) {
      return inHost;
    }
    return this.documentRootLocatorFactory().locatorForAll(
      WjMenuItemHarness.with({ ...filters, ancestor: BODY_OVERLAY }),
    )();
  }

  /** The visible text of each item, in order. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** The text of each group header, in order. Empty for a menu without groups. */
  async getGroupLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const header of await this.inList('[data-pc-section="submenulabel"]')) {
      labels.push((await header.text()).trim());
    }
    return labels;
  }

  /** How many separators the menu draws. */
  async getSeparatorCount(): Promise<number> {
    return (await this.inList('[role="separator"]')).length;
  }

  /** Clicks the first item whose visible text is `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-menu: no item with the label ${String(label)}`);
    }
    await item.click();
  }

  /** Moves focus to the list, as Tab does. */
  async focus(): Promise<void> {
    await (await this.requireList()).focus();
  }

  /** Whether the list has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.requireList()).isFocused();
  }
}
