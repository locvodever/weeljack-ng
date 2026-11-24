import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a node of a `wj-organizationchart` with {@link WjOrganizationChartNodeHarness.with}. */
export interface WjOrganizationChartNodeHarnessFilters extends BaseHarnessFilters {
  /** The node's text: a string for an exact match, or a RegExp. */
  text?: string | RegExp;
}

/** Criteria for finding a `wj-organizationchart` with {@link WjOrganizationChartHarness.with}. */
export type WjOrganizationChartHarnessFilters = BaseHarnessFilters;

/**
 * Test harness for one node of a `wj-organizationchart`, the way a user meets it: its text, its
 * toggle, and whether the toggle says its branch is open. The state is read from the toggle's ARIA.
 */
export class WjOrganizationChartNodeHarness extends ComponentHarness {
  static hostSelector = '[data-wj-node]';

  private readonly toggleButton = this.locatorForOptional('[data-wj-toggle]');

  /** Finds the nodes whose text matches `options.text`. */
  static with(
    options: WjOrganizationChartNodeHarnessFilters = {},
  ): HarnessPredicate<WjOrganizationChartNodeHarness> {
    return new HarnessPredicate(WjOrganizationChartNodeHarness, options).addOption(
      'text',
      options.text,
      async (harness, text) => HarnessPredicate.stringMatches(await harness.getText(), text),
    );
  }

  /** The node's text: its label, or what its template shows. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the node has a toggle: the chart is `collapsible` and the node has children. */
  async isToggleable(): Promise<boolean> {
    return (await this.toggleButton()) !== null;
  }

  /** Whether the toggle says the branch is open (`aria-expanded`). `false` with no toggle. */
  async isExpanded(): Promise<boolean> {
    return (await (await this.toggleButton())?.getAttribute('aria-expanded')) === 'true';
  }

  /** Presses the toggle. Does nothing for a node with no toggle. */
  async toggle(): Promise<void> {
    await (await this.toggleButton())?.click();
  }

  /** The toggle's accessible name, or `null` for a node with no toggle. */
  async getToggleLabel(): Promise<string | null> {
    return (await this.toggleButton())?.getAttribute('aria-label') ?? null;
  }
}

/**
 * Test harness for `wj-organizationchart`. Describes the chart as a user meets it: the nodes on
 * screen, in document order. It never names an Optimus class.
 */
export class WjOrganizationChartHarness extends ComponentHarness {
  static hostSelector = 'wj-organizationchart';

  /** Finds the charts that match `options`. */
  static with(
    options: WjOrganizationChartHarnessFilters = {},
  ): HarnessPredicate<WjOrganizationChartHarness> {
    return new HarnessPredicate(WjOrganizationChartHarness, options);
  }

  /**
   * The nodes on screen, in document order: a collapsed branch keeps its space but is hidden, and
   * its nodes are not among them.
   */
  async getNodes(
    filter: WjOrganizationChartNodeHarnessFilters = {},
  ): Promise<WjOrganizationChartNodeHarness[]> {
    const nodes = await this.locatorForAll(WjOrganizationChartNodeHarness.with(filter))();
    const shown: WjOrganizationChartNodeHarness[] = [];
    for (const node of nodes) {
      if ((await (await node.host()).getCssValue('visibility')) !== 'hidden') {
        shown.push(node);
      }
    }
    return shown;
  }
}
