import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-dataview` with {@link WjDataViewHarness.with}. */
export interface WjDataViewHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at. An empty view has no list, so it has no name.
   */
  name?: string | RegExp;
}

/**
 * Test harness for `wj-dataview`. Describes the view as a user meets it: the items of the current
 * page, the layout, the empty and loading states and the page.
 */
export class WjDataViewHarness extends ComponentHarness {
  static hostSelector = 'wj-dataview';

  private readonly root = this.locatorFor('p-dataview');
  private readonly list = this.locatorForOptional('.p-dataview-content > ul');
  private readonly items = this.locatorForAll('.p-dataview-content > ul > li');
  private readonly empty = this.locatorForOptional('.p-dataview-empty-message');
  private readonly loading = this.locatorForOptional('.p-dataview-loading');
  private readonly pageLinks = this.locatorForAll('.p-paginator-page');
  private readonly currentPageLink = this.locatorForOptional(
    '.p-paginator-page[aria-current="page"]',
  );
  private readonly previousButton = this.locatorForOptional('.p-paginator-prev');
  private readonly nextButton = this.locatorForOptional('.p-paginator-next');

  /** Finds the views whose list name matches `options.name`. */
  static with(options: WjDataViewHarnessFilters = {}): HarnessPredicate<WjDataViewHarness> {
    return new HarnessPredicate(WjDataViewHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /**
   * The list's name: its `aria-label`, else the text of the element its `aria-labelledby` points
   * at, else an empty string (also when the view is empty and has no list).
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

  /** The text of each item of the current page, in order. */
  async getItemTexts(): Promise<string[]> {
    const texts: string[] = [];
    for (const item of await this.items()) {
      texts.push((await item.text()).trim());
    }
    return texts;
  }

  /** The layout the view is in. */
  async getLayout(): Promise<'list' | 'grid'> {
    return (await (await this.root()).hasClass('p-dataview-grid')) ? 'grid' : 'list';
  }

  /** Whether the view shows no items. */
  async isEmpty(): Promise<boolean> {
    return (await this.items()).length === 0;
  }

  /** The text of the empty message; `''` when there is none, or while the view is loading. */
  async getEmptyText(): Promise<string> {
    const empty = await this.empty();
    return empty === null ? '' : (await empty.text()).trim();
  }

  /** Whether the view is loading: Optimus's mask is over the list. */
  async isLoading(): Promise<boolean> {
    return (await this.loading()) !== null;
  }

  /** The current page, counted from 1; `0` when the view shows no pager or has no pages. */
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
          `wj-dataview cannot move to page ${String(page)} from page ${String(current)}`,
        );
      }
      current = moved;
    }
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
      return Promise.reject(new Error(`wj-dataview has no ${name} page button: is it paginated?`));
    }
    return Promise.resolve(button);
  }
}
