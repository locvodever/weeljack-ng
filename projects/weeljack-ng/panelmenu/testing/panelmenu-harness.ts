import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-panelmenu` with {@link WjPanelMenuHarness.with}. */
export type WjPanelMenuHarnessFilters = BaseHarnessFilters;

/** Criteria for finding a panel with {@link WjPanelMenuPanelHarness.with}. */
export interface WjPanelMenuPanelHarnessFilters extends BaseHarnessFilters {
  /** The header's visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** Criteria for finding a nested item with {@link WjPanelMenuItemHarness.with}. */
export interface WjPanelMenuItemHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Optimus renders every panel's tree and hides the closed ones (`aria-hidden`), so an item counts
 * only when no ancestor of it is hidden.
 */
const ON_THE_PAGE = ':not([aria-hidden="true"] *)';

/**
 * One nested item of a panel, as a user meets it, in an open panel. Found through
 * {@link WjPanelMenuPanelHarness.getItems}. Separators are not items.
 */
export class WjPanelMenuItemHarness extends ComponentHarness {
  static hostSelector = '[role="treeitem"]';

  private readonly content = this.locatorFor('[data-pc-section="itemcontent"]');

  /** Finds the items whose visible text matches `options.label`. */
  static with(
    options: WjPanelMenuItemHarnessFilters = {},
  ): HarnessPredicate<WjPanelMenuItemHarness> {
    return new HarnessPredicate(WjPanelMenuItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /**
   * The visible text of the item, trimmed: its `label`, or the text of its slot. The labels of the
   * items nested in it are not part of it.
   */
  async getLabel(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** Whether the item is inert: it is skipped by the arrow keys and runs nothing. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-p-disabled')) === 'true';
  }

  /** Whether the keyboard has moved onto the item: the tree's active item. */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-p-focused')) === 'true';
  }

  /** Whether the item is a parent with nested items. */
  async hasSubmenu(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) !== null;
  }

  /** Whether the item's nested items are shown. `false` for an item without any. */
  async isExpanded(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Clicks the item: it runs its command, or opens or closes its nested items. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.content()).click(modifiers);
  }
}

/**
 * One panel of a menu: its header, which opens and closes it, and the tree of items inside.
 * Found through {@link WjPanelMenuHarness.getPanels}.
 */
export class WjPanelMenuPanelHarness extends ComponentHarness {
  static hostSelector = '[data-pc-section="panel"]';

  private readonly header = this.locatorFor('[data-pc-section="header"]');

  /** Finds the panels whose header text matches `options.label`. */
  static with(
    options: WjPanelMenuPanelHarnessFilters = {},
  ): HarnessPredicate<WjPanelMenuPanelHarness> {
    return new HarnessPredicate(WjPanelMenuPanelHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible text of the header, trimmed: its `label`, or the text of its slot. */
  async getLabel(): Promise<string> {
    return (await (await this.header()).text()).trim();
  }

  /** Whether the panel is open. */
  async isExpanded(): Promise<boolean> {
    return (await (await this.header()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the panel is inert: it cannot be opened and runs nothing. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.header()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the header: the panel runs its command, then opens, or closes when it was open. */
  async toggle(): Promise<void> {
    await (await this.header()).click();
  }

  /** Moves focus to the header, as Tab does. */
  async focus(): Promise<void> {
    await (await this.header()).focus();
  }

  /** Whether the header has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.header()).isFocused();
  }

  /**
   * The items shown in the panel, in order, nested ones included, that match `filters`. A closed
   * panel, and the items inside a closed parent, show none.
   */
  async getItems(filters: WjPanelMenuItemHarnessFilters = {}): Promise<WjPanelMenuItemHarness[]> {
    const shown: WjPanelMenuItemHarness[] = [];
    for (const item of await this.locatorForAll(WjPanelMenuItemHarness.with(filters))()) {
      if (await (await item.host()).matchesSelector(ON_THE_PAGE)) {
        shown.push(item);
      }
    }
    return shown;
  }

  /** The visible text of each shown item, in order. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }
}

/**
 * Test harness for `wj-panelmenu`. Describes the menu as a user meets it: its panels (label,
 * whether open, toggle) and the items of the open ones. The menu has no accessible name of its
 * own: the app's `<nav aria-label>` names it. A menu with no items renders nothing.
 */
export class WjPanelMenuHarness extends ComponentHarness {
  static hostSelector = 'wj-panelmenu';

  /** Finds the menus that match `options`. */
  static with(options: WjPanelMenuHarnessFilters = {}): HarnessPredicate<WjPanelMenuHarness> {
    return new HarnessPredicate(WjPanelMenuHarness, options);
  }

  /** The panels, in order, that match `filters`. */
  async getPanels(
    filters: WjPanelMenuPanelHarnessFilters = {},
  ): Promise<WjPanelMenuPanelHarness[]> {
    return this.locatorForAll(WjPanelMenuPanelHarness.with(filters))();
  }

  /** The header text of each panel, in order. */
  async getPanelLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const panel of await this.getPanels()) {
      labels.push(await panel.getLabel());
    }
    return labels;
  }

  /** The items shown across every open panel, in order, that match `filters`. */
  async getItems(filters: WjPanelMenuItemHarnessFilters = {}): Promise<WjPanelMenuItemHarness[]> {
    const shown: WjPanelMenuItemHarness[] = [];
    for (const panel of await this.getPanels()) {
      shown.push(...(await panel.getItems(filters)));
    }
    return shown;
  }

  /** The visible text of each shown item, in order. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** Clicks the first shown item whose visible text is `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-panelmenu: no shown item with the label ${String(label)}`);
    }
    await item.click();
  }
}
