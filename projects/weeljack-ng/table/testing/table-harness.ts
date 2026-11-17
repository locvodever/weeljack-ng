import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** The sort state of a column header. */
export type WjTableSortOrder = 'ascending' | 'descending' | 'none';

/** Criteria for finding a `wj-table` with {@link WjTableHarness.with}. */
export interface WjTableHarnessFilters extends BaseHarnessFilters {
  /**
   * The table's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at, which is usually the caption.
   */
  caption?: string | RegExp;
}

/** Criteria for finding a cell with {@link WjTableRowHarness.getCells}. */
export interface WjTableCellHarnessFilters extends BaseHarnessFilters {
  /** The cell's text, as a string for an exact match or a RegExp. */
  text?: string | RegExp;
}

/** Test harness for one cell of a `wj-table`. */
export class WjTableCellHarness extends ComponentHarness {
  static hostSelector = 'wj-table td';

  /** Finds the cells whose text matches `options.text`. */
  static with(options: WjTableCellHarnessFilters = {}): HarnessPredicate<WjTableCellHarness> {
    return new HarnessPredicate(WjTableCellHarness, options).addOption(
      'text',
      options.text,
      (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** The visible text of the cell, trimmed. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness for one row of a `wj-table`. */
export class WjTableRowHarness extends ComponentHarness {
  static hostSelector = 'wj-table tr[data-wj-row]';

  /** The cells of the row, in column order. */
  async getCells(filter: WjTableCellHarnessFilters = {}): Promise<WjTableCellHarness[]> {
    return this.locatorForAll(WjTableCellHarness.with(filter))();
  }

  /** The text of each cell of the row, in column order. */
  async getCellTexts(): Promise<string[]> {
    const cells = await this.getCells();
    return Promise.all(cells.map((cell) => cell.getText()));
  }
}

/**
 * Test harness for `wj-table`. Describes the table as a user meets it: header texts, rows and
 * cells, the sort state of a column, and the current page. It never names an Optimus class.
 */
export class WjTableHarness extends ComponentHarness {
  static hostSelector = 'wj-table';

  private readonly table = this.locatorFor('table');
  private readonly headers = this.locatorForAll('thead th');
  private readonly pageLinks = this.locatorForAll('.p-paginator-page');
  private readonly currentPageLink = this.locatorForOptional(
    '.p-paginator-page[aria-current="page"]',
  );
  private readonly previousButton = this.locatorForOptional('.p-paginator-prev');
  private readonly nextButton = this.locatorForOptional('.p-paginator-next');

  /** Finds the tables whose name matches `options.caption`. */
  static with(options: WjTableHarnessFilters = {}): HarnessPredicate<WjTableHarness> {
    return new HarnessPredicate(WjTableHarness, options).addOption(
      'caption',
      options.caption,
      async (harness, caption) => HarnessPredicate.stringMatches(await harness.getName(), caption),
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
    return Promise.all((await this.headers()).map((header) => header.text()));
  }

  /** The rows of the current page, in order. */
  async getRows(): Promise<WjTableRowHarness[]> {
    return this.locatorForAll(WjTableRowHarness)();
  }

  /** The text of every cell of the current page: one array per row, one string per column. */
  async getCellTexts(): Promise<string[][]> {
    const rows = await this.getRows();
    return Promise.all(rows.map((row) => row.getCellTexts()));
  }

  /** Clicks the header whose text is `header`, which sorts by that column. */
  async sortBy(header: string | RegExp): Promise<void> {
    await (await this.headerOf(header)).click();
  }

  /** The sort state of the column whose header text is `header`. */
  async getSortOrder(header: string | RegExp): Promise<WjTableSortOrder> {
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
          `wj-table cannot move to page ${String(page)} from page ${String(current)}`,
        );
      }
      current = moved;
    }
  }

  private async headerOf(header: string | RegExp) {
    for (const candidate of await this.headers()) {
      if (await HarnessPredicate.stringMatches(candidate.text(), header)) {
        return candidate;
      }
    }
    throw new Error(`wj-table has no column header matching ${String(header)}`);
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
      return Promise.reject(new Error(`wj-table has no ${name} page button: is it paginated?`));
    }
    return Promise.resolve(button);
  }
}
