import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

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

/** Test harness for one data cell of a `wj-table`: never a checkbox, toggle or actions cell. */
export class WjTableCellHarness extends ComponentHarness {
  static hostSelector = 'wj-table td:not(.wj-fit)';

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

  /** The data cells of the row, in column order. */
  async getCells(filter: WjTableCellHarnessFilters = {}): Promise<WjTableCellHarness[]> {
    return this.locatorForAll(WjTableCellHarness.with(filter))();
  }

  /** The text of each data cell of the row, in column order. */
  async getCellTexts(): Promise<string[]> {
    const cells = await this.getCells();
    return Promise.all(cells.map((cell) => cell.getText()));
  }

  /** Whether the row is selected. */
  async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('p-datatable-row-selected');
  }

  /** Whether the row is expanded; `false` in a table without row expansion. */
  async isExpanded(): Promise<boolean> {
    const toggle = await this.locatorForOptional('button[aria-expanded]')();
    return toggle !== null && (await toggle.getAttribute('aria-expanded')) === 'true';
  }

  /** Selects the row as a user does: with its checkbox, else by clicking its first data cell. */
  async select(): Promise<void> {
    const checkbox = await this.locatorForOptional('p-tablecheckbox input')();
    const cell = (await this.getCells())[0];
    await (checkbox ?? (await cell?.host()) ?? (await this.host())).click();
  }

  /** Clicks the row's expansion toggle. */
  async toggleExpansion(): Promise<void> {
    await this.press('button[aria-expanded]', 'expansion toggle');
  }

  /** Clicks the row's Edit button. */
  async edit(): Promise<void> {
    await this.press('.p-datatable-row-editor-init', 'Edit button');
  }

  /** Clicks the Save button of a row in edit mode. */
  async save(): Promise<void> {
    await this.press('.p-datatable-row-editor-save', 'Save button');
  }

  /** Clicks the Cancel button of a row in edit mode. */
  async cancel(): Promise<void> {
    await this.press('.p-datatable-row-editor-cancel', 'Cancel button');
  }

  private async press(selector: string, name: string): Promise<void> {
    const button = await this.locatorForOptional(selector)();
    if (button === null) {
      throw new Error(`wj-table row has no ${name}`);
    }
    await button.click();
  }
}

/**
 * Test harness for `wj-table`. Describes the table as a user meets it: header texts, rows and
 * cells, the sort state of a column, the current page, and the table's features: selection, row
 * expansion, row editing, groups, filters and the empty, loading, caption and summary states. It
 * never names an Optimus class.
 */
export class WjTableHarness extends ComponentHarness {
  static hostSelector = 'wj-table';

  private readonly table = this.locatorFor('table');
  private readonly headers = this.locatorForAll('thead tr:first-child th:not(.wj-fit)');
  private readonly allHeaders = this.locatorForAll('thead tr:first-child th');
  private readonly pageLinks = this.locatorForAll('.p-paginator-page');
  private readonly currentPageLink = this.locatorForOptional(
    '.p-paginator-page[aria-current="page"]',
  );
  private readonly previousButton = this.locatorForOptional('.p-paginator-prev');
  private readonly nextButton = this.locatorForOptional('.p-paginator-next');
  private readonly rowsAndExpansions = this.locatorForAll(
    'tr[data-wj-row], tr.p-datatable-row-expansion',
  );
  private readonly groupHeaders = this.locatorForAll('tr.p-datatable-row-group-header');
  private readonly emptyRow = this.locatorForOptional('tr.wj-table-empty');
  private readonly caption = this.locatorForOptional('.p-datatable-header');
  private readonly summary = this.locatorForOptional('div.p-datatable-tfoot');
  private readonly selectAll = this.locatorForOptional('thead p-tableheadercheckbox input');

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

  /** The text of each data column header, in column order. */
  async getHeaderTexts(): Promise<string[]> {
    return Promise.all((await this.headers()).map((header) => header.text()));
  }

  /** The rows of the current page, in order. Group headers and expansions are not rows. */
  async getRows(): Promise<WjTableRowHarness[]> {
    return this.locatorForAll(WjTableRowHarness)();
  }

  /** The text of every data cell of the current page: one array per row, one string per column. */
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

  /** Selects the row at `index` of the current page, or unselects it if it is selected. */
  async selectRow(index: number): Promise<void> {
    await (await this.rowAt(index)).select();
  }

  /** The indexes, in the current page, of the selected rows. */
  async getSelectedRowIndexes(): Promise<number[]> {
    const selected = await Promise.all((await this.getRows()).map((row) => row.isSelected()));
    return selected.flatMap((isSelected, index) => (isSelected ? [index] : []));
  }

  /** Clicks the select-all checkbox of a table in `multiple` selection mode. */
  async toggleAllRows(): Promise<void> {
    const checkbox = await this.selectAll();
    if (checkbox === null) {
      throw new Error('wj-table has no select-all checkbox: is selectionMode "multiple"?');
    }
    await checkbox.click();
  }

  /** Expands the row at `index` if it is collapsed, and collapses it if it is expanded. */
  async toggleRowExpansion(index: number): Promise<void> {
    await (await this.rowAt(index)).toggleExpansion();
  }

  /** Whether the row at `index` is expanded. */
  async isRowExpanded(index: number): Promise<boolean> {
    return (await this.rowAt(index)).isExpanded();
  }

  /** The text of the expansion shown under the row at `index`; `''` when it is collapsed. */
  async getExpansionText(index: number): Promise<string> {
    const items = await this.rowsAndExpansions();
    let rowIndex = -1;
    for (const [position, item] of items.entries()) {
      if (await item.matchesSelector('[data-wj-row]')) {
        rowIndex++;
        const next = items[position + 1];
        if (
          rowIndex === index &&
          next !== undefined &&
          !(await next.matchesSelector('[data-wj-row]'))
        ) {
          return next.text();
        }
      }
    }
    return '';
  }

  /** Puts the row at `index` into edit mode with its Edit button. */
  async editRow(index: number): Promise<void> {
    await (await this.rowAt(index)).edit();
  }

  /** Saves the row at `index` with its Save button. */
  async saveRowEdit(index: number): Promise<void> {
    await (await this.rowAt(index)).save();
  }

  /** Cancels the edit of the row at `index` with its Cancel button. */
  async cancelRowEdit(index: number): Promise<void> {
    await (await this.rowAt(index)).cancel();
  }

  /**
   * Types `text` into the filter of the column whose header text is `header` and applies it, as a
   * user does: Enter in a row filter, and Apply in a `display="menu"` filter's menu.
   */
  async filterColumn(header: string | RegExp, text: string): Promise<void> {
    const position = await this.headerPosition(header);
    const inline = await this.locatorForOptional(
      `thead tr:nth-child(2) th:nth-child(${String(position)}) input`,
    )();
    if (inline !== null) {
      // Clearing an input that is empty already would apply the filter once more.
      if ((await inline.getProperty<string>('value')) !== '') {
        await inline.clear();
      }
      await inline.sendKeys(text, TestKey.ENTER);
    } else {
      const button = await this.locatorFor(
        `thead tr:first-child th:nth-child(${String(position)}) .p-datatable-column-filter-button`,
      )();
      await button.click();
      const overlay = this.documentRootLocatorFactory();
      const input = await overlay.locatorFor('.p-datatable-filter-overlay input')();
      await input.clear();
      await input.sendKeys(text);
      await (
        await overlay.locatorFor('.p-datatable-filter-buttonbar p-button:last-child button')()
      ).click();
    }
  }

  /** The text of each group header, in order. */
  async getGroupHeaderTexts(): Promise<string[]> {
    return Promise.all((await this.groupHeaders()).map((header) => header.text()));
  }

  /** Whether the table shows no rows. */
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

  private async rowAt(index: number): Promise<WjTableRowHarness> {
    const row = (await this.getRows())[index];
    if (row === undefined) {
      throw new Error(`wj-table has no row at index ${String(index)}`);
    }
    return row;
  }

  private async headerOf(header: string | RegExp) {
    for (const candidate of await this.headers()) {
      if (await HarnessPredicate.stringMatches(candidate.text(), header)) {
        return candidate;
      }
    }
    throw new Error(`wj-table has no column header matching ${String(header)}`);
  }

  /** The 1-based position of the header among all header cells, for `:nth-child`. */
  private async headerPosition(header: string | RegExp): Promise<number> {
    for (const [position, candidate] of (await this.allHeaders()).entries()) {
      if (await HarnessPredicate.stringMatches(candidate.text(), header)) {
        return position + 1;
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
