import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-breadcrumb` with {@link WjBreadcrumbHarness.with}. */
export interface WjBreadcrumbHarnessFilters extends BaseHarnessFilters {
  /** The `nav` landmark's name, as a string for an exact match or a RegExp. */
  name?: string | RegExp;
}

/** Criteria for finding a trail item with {@link WjBreadcrumbItemHarness.with}. */
export interface WjBreadcrumbItemHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * One item of the trail, as a user meets it: a link, or the current page. Found through
 * {@link WjBreadcrumbHarness.getItems}. The home link is not an item: it has its own methods.
 */
export class WjBreadcrumbItemHarness extends ComponentHarness {
  static hostSelector = '[data-pc-section="item"]';

  private readonly link = this.locatorFor('a');

  /** Finds the items whose visible text matches `options.label`. */
  static with(
    options: WjBreadcrumbItemHarnessFilters = {},
  ): HarnessPredicate<WjBreadcrumbItemHarness> {
    return new HarnessPredicate(WjBreadcrumbItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible text of the item, trimmed. */
  async getLabel(): Promise<string> {
    return (await (await this.link()).text()).trim();
  }

  /** Where the item links to: its `href`, or `null` for an item that is not a link. */
  async getHref(): Promise<string | null> {
    return (await this.link()).getAttribute('href');
  }

  /** Whether the item is the current page: the last visible item of the trail. */
  async isCurrent(): Promise<boolean> {
    return (await (await this.link()).getAttribute('aria-current')) === 'page';
  }

  /** Whether the item is inert: it does nothing when clicked and is not a Tab stop by itself. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('p-disabled');
  }

  /** Clicks the item. A disabled item does nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.link()).click(modifiers);
  }

  /** Moves focus to the item's link. */
  async focus(): Promise<void> {
    await (await this.link()).focus();
  }

  /** Whether the item's link has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.link()).isFocused();
  }
}

/**
 * Test harness for `wj-breadcrumb`. Describes the trail as a user meets it: the landmark's name,
 * the home link and the items, one of which is the current page. A breadcrumb with no `home` and
 * no visible items renders nothing: it has no name, no home and no items.
 */
export class WjBreadcrumbHarness extends ComponentHarness {
  static hostSelector = 'wj-breadcrumb';

  private readonly nav = this.locatorForOptional('nav');
  private readonly homeLink = this.locatorForOptional('[data-pc-section="homeitem"] a');

  /** Finds the breadcrumbs whose landmark name matches `options.name`. */
  static with(options: WjBreadcrumbHarnessFilters = {}): HarnessPredicate<WjBreadcrumbHarness> {
    return new HarnessPredicate(WjBreadcrumbHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /** The `home` link, and a message that says what to check when there is none. */
  private async requireHome(): Promise<TestElement> {
    const link = await this.homeLink();
    if (link === null) {
      throw new Error('wj-breadcrumb: there is no home link: the home input is not set');
    }
    return link;
  }

  /** The name of the `nav` landmark: its `aria-label`, or an empty string when nothing renders. */
  async getName(): Promise<string> {
    return (await (await this.nav())?.getAttribute('aria-label')) ?? '';
  }

  /** The items of the trail, in order, that match `filters`. The home link is not included. */
  async getItems(filters: WjBreadcrumbItemHarnessFilters = {}): Promise<WjBreadcrumbItemHarness[]> {
    return this.locatorForAll(WjBreadcrumbItemHarness.with(filters))();
  }

  /** The visible text of each item, in order. */
  async getItemLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const item of await this.getItems()) {
      labels.push(await item.getLabel());
    }
    return labels;
  }

  /** The text of the current page: the last visible item, or `null` when there is none. */
  async getCurrentLabel(): Promise<string | null> {
    for (const item of await this.getItems()) {
      if (await item.isCurrent()) {
        return item.getLabel();
      }
    }
    return null;
  }

  /** Whether the breadcrumb draws a home link. */
  async hasHome(): Promise<boolean> {
    return (await this.homeLink()) !== null;
  }

  /**
   * The home link's name: its `aria-label`, else its visible text. Throws when there is no home
   * link.
   */
  async getHomeName(): Promise<string> {
    const link = await this.requireHome();
    return (await link.getAttribute('aria-label')) ?? (await link.text()).trim();
  }

  /** Clicks the home link. Throws when there is none. */
  async clickHome(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.requireHome()).click(modifiers);
  }

  /** Clicks the first item whose visible text is `label`, and throws when there is none. */
  async clickItem(label: string | RegExp): Promise<void> {
    const [item] = await this.getItems({ label });
    if (item === undefined) {
      throw new Error(`wj-breadcrumb: no item with the label ${String(label)}`);
    }
    await item.click();
  }
}
