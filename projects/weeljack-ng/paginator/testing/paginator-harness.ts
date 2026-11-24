import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-paginator` with {@link WjPaginatorHarness.with}. */
export interface WjPaginatorHarnessFilters extends BaseHarnessFilters {
  /**
   * The pager's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/** Test harness for `wj-paginator`. Describes the pager as a user meets it: pages, sizes, report. */
export class WjPaginatorHarness extends ComponentHarness {
  static hostSelector = 'wj-paginator';

  private readonly root = this.locatorFor('p-paginator');
  private readonly pageLinks = this.locatorForAll('.p-paginator-page');
  private readonly firstButton = this.locatorForOptional('.p-paginator-first');
  private readonly previousButton = this.locatorForOptional('.p-paginator-prev');
  private readonly nextButton = this.locatorForOptional('.p-paginator-next');
  private readonly lastButton = this.locatorForOptional('.p-paginator-last');
  private readonly report = this.locatorForOptional('.p-paginator-current');
  private readonly sizeSelect = this.locatorForOptional(
    '.p-paginator-rpp-dropdown [role="combobox"]',
  );
  // The select's list is an overlay that Optimus appends outside the host.
  private readonly sizeOptions = this.documentRootLocatorFactory().locatorForAll(
    '[role="listbox"] [role="option"]',
  );

  /** Finds the pagers whose name matches `options.name`. */
  static with(options: WjPaginatorHarnessFilters = {}): HarnessPredicate<WjPaginatorHarness> {
    return new HarnessPredicate(WjPaginatorHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /**
   * The pager's name: its `aria-label`, else the text of the element its `aria-labelledby` points
   * at, else an empty string.
   */
  async getName(): Promise<string> {
    const root = await this.root();
    const label = await root.getAttribute('aria-label');
    if (label !== null) {
      return label;
    }
    const labelledBy = await root.getAttribute('aria-labelledby');
    if (labelledBy === null) {
      return '';
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(`#${labelledBy}`)();
    return named === null ? '' : named.text();
  }

  /** The current page, counted from 1; `0` when there are no records. */
  async getCurrentPage(): Promise<number> {
    return Number(await (await this.root()).getAttribute('data-wj-page'));
  }

  /** The number of pages; `0` when there are no records. */
  async getPageCount(): Promise<number> {
    return Number(await (await this.root()).getAttribute('data-wj-pages'));
  }

  /** Moves to the first page with the first-page button. Needs `showFirstLastIcon`. */
  async goToFirstPage(): Promise<void> {
    await (await this.pagerButton(await this.firstButton(), 'first')).click();
  }

  /** Moves to the previous page with the previous button. */
  async goToPreviousPage(): Promise<void> {
    await (await this.pagerButton(await this.previousButton(), 'previous')).click();
  }

  /** Moves to the next page with the next button. */
  async goToNextPage(): Promise<void> {
    await (await this.pagerButton(await this.nextButton(), 'next')).click();
  }

  /** Moves to the last page with the last-page button. Needs `showFirstLastIcon`. */
  async goToLastPage(): Promise<void> {
    await (await this.pagerButton(await this.lastButton(), 'last')).click();
  }

  /** Moves to `page`, counted from 1, by its page link or, when that is not shown, by stepping. */
  async goToPage(page: number): Promise<void> {
    const count = await this.getPageCount();
    if (!Number.isInteger(page) || page < 1 || page > count) {
      throw new Error(`wj-paginator has no page ${String(page)}: it has ${String(count)}`);
    }
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
          `wj-paginator cannot move to page ${String(page)} from page ${String(current)}`,
        );
      }
      current = moved;
    }
  }

  /** The page size the rows-per-page select shows. Needs `rowsPerPageOptions`. */
  async getRowsPerPage(): Promise<number> {
    const text = await (await this.sizeSelectOrThrow()).text();
    return Number(text.replaceAll(' ', '').trim());
  }

  /**
   * Picks `rows` in the rows-per-page select by clicking it. Needs `rowsPerPageOptions`. The list
   * closes with its leave motion, which the harness does not wait for.
   */
  async setRowsPerPage(rows: number): Promise<void> {
    const select = await this.sizeSelectOrThrow();
    if ((await select.getAttribute('aria-expanded')) !== 'true') {
      await select.click();
    }
    for (const option of await this.sizeOptions()) {
      if ((await option.text()).trim() === String(rows)) {
        await option.click();
        return;
      }
    }
    await select.sendKeys(TestKey.ESCAPE);
    throw new Error(`wj-paginator offers no page size of ${String(rows)}`);
  }

  /** The text of the current page report, `null` when `showCurrentPageReport` is off. */
  async getReportText(): Promise<string | null> {
    return (await (await this.report())?.text())?.trim() ?? null;
  }

  private async sizeSelectOrThrow() {
    const select = await this.sizeSelect();
    if (select === null) {
      throw new Error('wj-paginator has no rows-per-page select: set rowsPerPageOptions');
    }
    return select;
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
      return Promise.reject(new Error(`wj-paginator has no ${name} page button`));
    }
    return Promise.resolve(button);
  }
}
