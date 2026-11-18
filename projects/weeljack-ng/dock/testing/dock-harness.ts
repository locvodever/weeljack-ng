import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-dock` with {@link WjDockHarness.with}. */
export interface WjDockHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/** Criteria for finding a dock item with {@link WjDockItemHarness.with}. */
export interface WjDockItemHarnessFilters extends BaseHarnessFilters {
  /** The item's name (its `label`), as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** The edge a dock lies along, as `wj-dock`'s `position` names it. */
type DockPosition = 'bottom' | 'top' | 'left' | 'right';

const POSITION = /\bp-dock-(bottom|top|left|right)\b/;

function isPosition(value: string | undefined): value is DockPosition {
  return value === 'bottom' || value === 'top' || value === 'left' || value === 'right';
}

/**
 * One item of a dock, as a user meets it: a tile named by its `label`, which is never drawn. Found
 * through {@link WjDockHarness.getItems}.
 */
export class WjDockItemHarness extends ComponentHarness {
  static hostSelector = '[role="menuitem"]';

  private readonly content = this.locatorFor('[data-pc-section="itemcontent"]');

  /** Finds the items whose name matches `options.label`. */
  static with(options: WjDockItemHarnessFilters = {}): HarnessPredicate<WjDockItemHarness> {
    return new HarnessPredicate(WjDockItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The item's name: its `label`, as an accessible name, or an empty string. */
  async getLabel(): Promise<string> {
    return (await (await this.host()).getAttribute('aria-label')) ?? '';
  }

  /** Whether the item is inert: it is skipped by the arrow keys and runs nothing. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the keyboard has moved onto the item: the list's active item. */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-p-focused')) === 'true';
  }

  /** Clicks the tile. A disabled item runs nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.content()).click(modifiers);
  }
}

/**
 * Test harness for `wj-dock`. Describes the dock as a user meets it: its name, the edge it lies
 * along, and its items. The dock is created in the browser after the first render, so read it
 * once the fixture is stable.
 */
export class WjDockHarness extends ComponentHarness {
  static hostSelector = 'wj-dock';

  private readonly list = this.locatorFor('[role="menu"]');
  private readonly root = this.locatorFor('[data-pc-name="dock"]');

  /** Finds the docks whose name matches `options.name`. */
  static with(options: WjDockHarnessFilters = {}): HarnessPredicate<WjDockHarness> {
    return new HarnessPredicate(WjDockHarness, options).addOption(
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

  /** The edge the dock lies along: `bottom`, `top`, `left` or `right`. */
  async getPosition(): Promise<DockPosition> {
    const position = POSITION.exec((await (await this.root()).getAttribute('class')) ?? '')?.[1];
    if (!isPosition(position)) {
      throw new Error('wj-dock: the dock has no position');
    }
    return position;
  }

  /** The items, in order, that match `filters`. Items with `visible: false` are not drawn. */
  async getItems(filters: WjDockItemHarnessFilters = {}): Promise<WjDockItemHarness[]> {
    return this.locatorForAll(WjDockItemHarness.with(filters))();
  }

  /** The name of each item, in order. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** The name of the item the keyboard is on, or `null` while the list has no active item. */
  async getActiveItemLabel(): Promise<string | null> {
    for (const item of await this.getItems()) {
      if (await item.isActive()) {
        return item.getLabel();
      }
    }
    return null;
  }

  /** Clicks the first item named `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-dock: no item with the label ${String(label)}`);
    }
    await item.click();
  }

  /** Moves focus to the list, as Tab does. */
  async focus(): Promise<void> {
    await (await this.list()).focus();
  }

  /** Whether the list has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.list()).isFocused();
  }
}
