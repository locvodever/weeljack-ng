import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-tree` with {@link WjTreeHarness.with}. */
export interface WjTreeHarnessFilters extends BaseHarnessFilters {
  /**
   * The tree's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at. A tree with no nodes has no list to carry a name,
   * so it matches the name `''` only.
   */
  name?: string | RegExp;
}

/** Criteria for finding a node of a `wj-tree` with {@link WjTreeNodeHarness.with}. */
export interface WjTreeNodeHarnessFilters extends BaseHarnessFilters {
  /** The node's own text, not its children's: a string for an exact match, or a RegExp. */
  text?: string | RegExp;
  /** The node's level: 1 for a root node, 2 for its children. */
  level?: number;
}

/**
 * Test harness for one node of a `wj-tree`, the way a user meets it: its text, its level, whether
 * it opens, and whether it is selected or checked. Read the state from the node's ARIA.
 */
export class WjTreeNodeHarness extends ComponentHarness {
  static hostSelector = '[role="treeitem"]';

  private readonly content = this.locatorFor('[data-pc-section="nodecontent"]');
  private readonly toggle = this.locatorFor('[data-pc-section="nodetogglebutton"]');
  private readonly partial = this.locatorForOptional(
    ':scope > [data-pc-section="nodecontent"] [data-p-partialchecked="true"]',
  );

  /** Finds the nodes whose text and level match `options`. */
  static with(options: WjTreeNodeHarnessFilters = {}): HarnessPredicate<WjTreeNodeHarness> {
    return new HarnessPredicate(WjTreeNodeHarness, options)
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getText(), text),
      )
      .addOption(
        'level',
        options.level,
        async (harness, level) => (await harness.getLevel()) === level,
      );
  }

  /** The node's own text: what its row shows, without its children. */
  async getText(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** The node's level: 1 for a root node, 2 for its children. */
  async getLevel(): Promise<number> {
    return Number(await (await this.host()).getAttribute('aria-level'));
  }

  /** Whether the node has a toggle: it has children, or is marked `leaf: false`. */
  async isExpandable(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) !== null;
  }

  /** Whether the node shows its children. */
  async isExpanded(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the node with a click on its toggle. Does nothing for an open node or a leaf. */
  async expand(): Promise<void> {
    if ((await this.isExpandable()) && !(await this.isExpanded())) {
      await (await this.toggle()).click();
    }
  }

  /** Closes the node with a click on its toggle. Does nothing for a closed node or a leaf. */
  async collapse(): Promise<void> {
    if (await this.isExpanded()) {
      await (await this.toggle()).click();
    }
  }

  /**
   * Clicks the node's row: selects it, or deselects it when it is selected; in `checkbox` mode,
   * checks it or unchecks it.
   */
  async select(): Promise<void> {
    await (await this.content()).click();
  }

  /** Whether the node is selected, in `single` or `multiple` mode. */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the node is checked, in `checkbox` mode. A partly checked node is not. */
  async isChecked(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-checked')) === 'true';
  }

  /**
   * Whether the node is partly checked, in `checkbox` mode: some of its children are checked.
   * Optimus draws the mark but gives the treeitem no `aria-checked="mixed"`, so this reads the
   * checkbox.
   */
  async isPartiallyChecked(): Promise<boolean> {
    return (await this.partial()) !== null;
  }

  /** Puts keyboard focus on the node. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Whether the node has keyboard focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}

/**
 * Test harness for `wj-tree`. Describes the tree as a user meets it: the nodes on screen, in
 * order, and whether it is empty or loading. It never names an Optimus class.
 */
export class WjTreeHarness extends ComponentHarness {
  static hostSelector = 'wj-tree';

  private readonly list = this.locatorForOptional('[role="tree"]');
  private readonly nodes = this.locatorForAll(WjTreeNodeHarness);
  private readonly empty = this.locatorForOptional('[data-pc-section="emptymessage"]');
  private readonly mask = this.locatorForOptional('[data-pc-section="mask"]');

  /** Finds the trees whose name matches `options.name`. */
  static with(options: WjTreeHarnessFilters = {}): HarnessPredicate<WjTreeHarness> {
    return new HarnessPredicate(WjTreeHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /**
   * The tree's name: its `aria-label`, else the text of the element its `aria-labelledby` points
   * at, else an empty string.
   */
  async getName(): Promise<string> {
    const list = await this.list();
    if (list === null) {
      return '';
    }
    const label = await list.getAttribute('aria-label');
    if (label !== null) {
      return label;
    }
    const labelledBy = await list.getAttribute('aria-labelledby');
    if (labelledBy === null) {
      return '';
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(`#${labelledBy}`)();
    return named === null ? '' : named.text();
  }

  /** The nodes on screen, in order: a collapsed node's children are not among them. */
  async getNodes(filter: WjTreeNodeHarnessFilters = {}): Promise<WjTreeNodeHarness[]> {
    return this.locatorForAll(WjTreeNodeHarness.with(filter))();
  }

  /** The text of each node on screen, in order. */
  async getNodeTexts(): Promise<string[]> {
    const texts: string[] = [];
    for (const node of await this.nodes()) {
      texts.push(await node.getText());
    }
    return texts;
  }

  /** Whether the tree has no node on screen. */
  async isEmpty(): Promise<boolean> {
    return (await this.nodes()).length === 0;
  }

  /** The text of the empty message, or `null` while the tree has nodes or is loading. */
  async getEmptyText(): Promise<string | null> {
    const empty = await this.empty();
    return empty === null ? null : (await empty.text()).trim();
  }

  /** Whether the tree shows its loading mask. */
  async isLoading(): Promise<boolean> {
    return (await this.mask()) !== null;
  }
}
