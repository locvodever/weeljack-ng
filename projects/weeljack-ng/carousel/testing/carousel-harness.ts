import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-carousel` with {@link WjCarouselHarness.with}. */
export interface WjCarouselHarnessFilters extends BaseHarnessFilters {
  /** The region's accessible name (the `ariaLabel` input), as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-carousel`. Describes the carousel as a user meets it: the page, how many
 * pages there are, the previous and next buttons, a jump to a page through its indicator, and the
 * slides on screen. Pages are counted from 0, as `page` is, and are read from the indicators, so
 * `getPage`, `getPageCount` and `goToPage` need `showIndicators`; `next` and `previous` need
 * `showNavigators`. A circular carousel has no slide on screen for the moment it wraps: poll.
 */
export class WjCarouselHarness extends ComponentHarness {
  static hostSelector = 'wj-carousel';

  private readonly region = this.locatorFor('p-carousel');
  private readonly previousButton = this.locatorFor('[data-pc-name="pcprevbutton"]');
  private readonly nextButton = this.locatorFor('[data-pc-name="pcnextbutton"]');
  private readonly indicators = this.locatorForAll('[data-pc-section="indicatorbutton"]');
  private readonly visibleItems = this.locatorForAll(
    '[data-pc-section="item"][data-p-carousel-item-active="true"]',
  );

  /** Finds the carousels whose region is named by `options.ariaLabel`. */
  static with(options: WjCarouselHarnessFilters = {}): HarnessPredicate<WjCarouselHarness> {
    return new HarnessPredicate(WjCarouselHarness, options).addOption(
      'ariaLabel',
      options.ariaLabel,
      async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches(await harness.getAriaLabel(), ariaLabel),
    );
  }

  /** The region's accessible name (`aria-label`); `null` when unset. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.region()).getAttribute('aria-label');
  }

  /** The page shown, from 0: the current page's indicator. `-1` when there are no indicators. */
  async getPage(): Promise<number> {
    const current = await Promise.all(
      (await this.indicators()).map((indicator) => indicator.getAttribute('aria-current')),
    );
    return current.indexOf('page');
  }

  /** How many pages there are: one indicator each. */
  async getPageCount(): Promise<number> {
    return (await this.indicators()).length;
  }

  /** Clicks the previous button. */
  async previous(): Promise<void> {
    await (await this.previousButton()).click();
  }

  /** Clicks the next button. */
  async next(): Promise<void> {
    await (await this.nextButton()).click();
  }

  /** Clicks the indicator of `page` (from 0); throws when there is none. */
  async goToPage(page: number): Promise<void> {
    const indicator = (await this.indicators())[page];
    if (!indicator) {
      throw new Error(`wj-carousel has no page ${String(page)}`);
    }
    await indicator.click();
  }

  /** How many slides are on screen. */
  async getVisibleItemCount(): Promise<number> {
    return (await this.visibleItems()).length;
  }

  /** The text of each slide on screen, trimmed, in order. */
  async getVisibleItemTexts(): Promise<string[]> {
    return Promise.all((await this.visibleItems()).map(async (item) => (await item.text()).trim()));
  }
}
