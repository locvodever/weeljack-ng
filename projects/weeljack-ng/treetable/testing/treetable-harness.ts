import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** The sort state of a column header. */
export type WjTreeTableSortOrder = 'ascending' | 'descending' | 'none';

/** Criteria for finding a `wj-treetable` with {@link WjTreeTableHarness.with}. */
export interface WjTreeTableHarnessFilters extends BaseHarnessFilters {
  /**
   * The table's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at, which is usually the caption.
   */
  name?: string | RegExp;
}

/** Criteria for finding a row of a `wj-treetable` with {@link WjTreeTableHarness.getRows}. */
export interface WjTreeTableRowHarnessFilters extends BaseHarnessFilters {
  /** The text of the row's first cell, as a string for an exact match or a RegExp. */
  text?: string | RegExp;
  /** The row's level: 1 for a root node, 2 for its children. */
  level?: number;
}

/**
 * Test harness for one row of a `wj-treetable`, the way a user meets it: its cells, its level,
 * whether it opens, and whether it is selected or checked. State is read from the row's ARIA.
 */
export class WjTreeTableRowHarness extends ComponentHarness {
  static hostSelector = 'wj-treetable tr[data-wj-row]';

  private readonly toggler = this.locatorFor('[data-pc-section="rowtogglebutton"]');
  private readonly checkbox = this.locatorForOptional('p-treetablecheckbox input');
  private readonly partial = this.locatorForOptional(
    'p-treetablecheckbox svg[data-p-icon="minus"]',
  );

  /** Finds the rows whose first cell's text and level match `options`. */
  static with(options: WjTreeTableRowHarnessFilters = {}): HarnessPredicate<WjTreeTableRowHarness> {
    return new HarnessPredicate(WjTreeTableRowHarness, options)
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches((await harness.getCellTexts())[0] ?? '', text),
      )
      .addOption(
        'level',
        options.level,
        async (harness, level) => (await harness.getLevel()) === level,
      );
  }

  /** The text of each cell of the row, in column order. */
  async getCellTexts(): Promise<string[]> {
    const cells = await this.locatorForAll('td')();
    return Promise.all(cells.map((cell) => cell.text()));
  }

  /** The row's level: 1 for a root node, 2 for its children. */
  async getLevel(): Promise<number> {
    return Number(await (await this.host()).getAttribute('aria-level'));
  }

  /** Whether the row has a toggle: its node has children, or is marked `leaf: false`. */
  async isExpandable(): Promise<boolean> {
    return (await (await this.toggler()).getCssValue('visibility')) === 'visible';
  }

  /** Whether the row shows its children. */
  async isExpanded(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Clicks the row's toggle: opens a closed row and closes an open one. A leaf has no toggle. */
  async toggle(): Promise<void> {
    if (await this.isExpandable()) {
      await (await this.toggler()).click();
    }
  }

  /**
   * Selects the row as a user does: with its checkbox in `checkbox` mode, else by clicking its
   * first cell, which deselects a selected row in `single` mode and toggles it in `multiple`.
   */
  async select(): Promise<void> {
    const box = await this.checkbox();
    await (box ?? (await this.locatorFor('td')())).click();
  }

  /** Whether the row is selected, in `single` or `multiple` mode. */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Checks the row's checkbox when it is not checked: its descendants are checked with it. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.select();
    }
  }

  /** Whether the row's checkbox is checked, in `checkbox` mode. A partly checked row is not. */
  async isChecked(): Promise<boolean> {
    const box = await this.checkbox();
    return box !== null && (await box.getProperty<boolean>('checked'));
  }

  /** Whether the row is partly checked, in `checkbox` mode: some of its descendants are checked. */
  async isPartiallyChecked(): Promise<boolean> {
    return (await this.partial()) !== null;
  }
}

/**
 * Test harness for `wj-treetable`. Describes the table as a user meets it: header texts, the rows
 * on screen and their cells, the sort state of a column, the current page, selection, and the
 * empty, loading, caption and summary states. It never names an Optimus class.
 */
export class WjTreeTableHarness extends ComponentHarness {
  static hostSelector = 'wj-treetable';

  private readonly table = this.locatorFor('table');
  private readonly headers = this.locatorForAll('thead tr:first-child th');
  private readonly pageLinks = this.locatorForAll('.p-paginator-page');
  private readonly currentPageLink = this.locatorForOptional(
    '.p-paginator-page[aria-current="page"]',
  );
  private readonly previousButton = this.locatorForOptional('.p-paginator-prev');
  private readonly nextButton = this.locatorForOptional('.p-paginator-next');
  private readonly emptyRow = this.locatorForOptional('tr.wj-treetable-empty');
  private readonly caption = this.locatorForOptional('.p-treetable-header');
  private readonly summary = this.locatorForOptional('.p-treetable-footer');
  private readonly selectAll = this.locatorForOptional('thead p-treetableheadercheckbox input');

  /** Finds the tables whose name matches `options.name`. */
  static with(options: WjTreeTableHarnessFilters = {}): HarnessPredicate<WjTreeTableHarness> {
    return new HarnessPredicate(WjTreeTableHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /**
   * The table's name: its `aria-label`, else the text of the element its `aria-labelledby`
   * points at, else an empty string.
   */
  async getName(): Promise<string> {
    const table = await this.table();
    const label = await table.getAttribute('aria-label');
    if (label !== null) {
      return label;
    }
    const labelledBy = await table.getAttribute('aria-labelledby');
    if (labelledBy === null) {
      return '';
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(`#${labelledBy}`)();
    return named === null ? '' : named.text();
  }

  /** The text of each column header, in column order. */
  async getHeaderTexts(): Promise<string[]> {
    const headers = await this.headers();
    return Promise.all(headers.map((header) => header.text()));
  }

  /**
   * The rows on screen, in order: a collapsed row's children are not among them, and the rows
   * are those of the current page.
   */
  async getRows(filter: WjTreeTableRowHarnessFilters = {}): Promise<WjTreeTableRowHarness[]> {
    return this.locatorForAll(WjTreeTableRowHarness.with(filter))();
  }

  /** The text of every cell on screen: one array per row, one string per column. */
  async getCellTexts(): Promise<string[][]> {
    const rows = await this.getRows();
    return Promise.all(rows.map((row) => row.getCellTexts()));
  }

  /** Clicks the header whose text is `header`, which sorts by that column. */
  async sortBy(header: string | RegExp): Promise<void> {
    await (await this.headerOf(header)).click();
  }

  /** The sort state of the column whose header text is `header`. */
  async getSortOrder(header: string | RegExp): Promise<WjTreeTableSortOrder> {
    const value = await (await this.headerOf(header)).getAttribute('aria-sort');
    return value === 'ascending' || value === 'descending' ? value : 'none';
  }

  /** The current page, counted from 1; `0` when the table shows no pager or has no pages. */
  async getCurrentPage(): Promise<number> {
    const link = await this.currentPageLink();
    return link === null ? 0 : Number((await link.text()).trim());
  }

  /** Moves to the next page with the pager's next button. */
  async goToNextPage(): Promise<void> {
    await (await this.pagerButton(await this.nextButton(), 'next')).click();
  }

  /** Moves to the previous page with the pager's previous button. */
  async goToPreviousPage(): Promise<void> {
    await (await this.pagerButton(await this.previousButton(), 'previous')).click();
  }

  /** Moves to `page`, counted from 1, by its page link or, when that is not shown, by stepping. */
  async goToPage(page: number): Promise<void> {
    let current = await this.getCurrentPage();
    while (current !== page) {
      const link = await this.pageLinkFor(page);
      if (link !== undefined) {
        await link.click();
      } else if (current < page) {
        await this.goToNextPage();
      } else {
        await this.goToPreviousPage();
      }
      const moved = await this.getCurrentPage();
      if (moved === current) {
        throw new Error(
          `wj-treetable cannot move to page ${String(page)} from page ${String(current)}`,
        );
      }
      current = moved;
    }
  }

  /** Clicks the select-all checkbox of a table in `checkbox` selection mode. */
  async toggleAllRows(): Promise<void> {
    const checkbox = await this.selectAll();
    if (checkbox === null) {
      throw new Error('wj-treetable has no select-all checkbox: is selectionMode "checkbox"?');
    }
    await checkbox.click();
  }

  /** The indexes, among the rows on screen, of the selected rows. */
  async getSelectedRowIndexes(): Promise<number[]> {
    const selected = await Promise.all((await this.getRows()).map((row) => row.isSelected()));
    return selected.flatMap((isSelected, index) => (isSelected ? [index] : []));
  }

  /** Whether the table has no row on screen. */
  async isEmpty(): Promise<boolean> {
    return (await this.getRows()).length === 0;
  }

  /** The text of the empty row; `''` when there is none, or while the table is loading. */
  async getEmptyText(): Promise<string> {
    const row = await this.emptyRow();
    return row === null ? '' : row.text();
  }

  /** Whether the table is loading (`aria-busy`). */
  async isLoading(): Promise<boolean> {
    return (await (await this.table()).getAttribute('aria-busy')) === 'true';
  }

  /** The text of the band above the table; `''` when there is none. */
  async getCaptionText(): Promise<string> {
    const caption = await this.caption();
    return caption === null ? '' : caption.text();
  }

  /** The text of the band below the table; `''` when there is none. */
  async getSummaryText(): Promise<string> {
    const summary = await this.summary();
    return summary === null ? '' : summary.text();
  }

  private async headerOf(header: string | RegExp) {
    for (const candidate of await this.headers()) {
      if (await HarnessPredicate.stringMatches(candidate.text(), header)) {
        return candidate;
      }
    }
    throw new Error(`wj-treetable has no column header matching ${String(header)}`);
  }

  private async pageLinkFor(page: number) {
    for (const link of await this.pageLinks()) {
      if ((await link.text()).trim() === String(page)) {
        return link;
      }
    }
    return undefined;
  }

  private pagerButton<B>(button: B | null, name: string): Promise<B> {
    if (button === null) {
      return Promise.reject(new Error(`wj-treetable has no ${name} page button: is it paginated?`));
    }
    return Promise.resolve(button);
  }
}
