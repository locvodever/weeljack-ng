import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-galleria` with {@link WjGalleriaHarness.with}. */
export interface WjGalleriaHarnessFilters extends BaseHarnessFilters {
  /** The region's accessible name (the `ariaLabel` input), as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
}

/**
 * Test harness for `wj-galleria`. Describes the gallery as a user meets it: the item shown (counted
 * from 0, as `activeIndex` is), the previous and next buttons, the caption, and the full screen.
 * `next` and `previous` need `showItemNavigators`; `getCaption` needs a `wjGalleriaCaption`
 * template. A full-screen gallery has no item until it is open, and `isFullScreenOpen` and
 * `closeFullScreen` read the full-screen dialog, which only exists while it is open.
 */
export class WjGalleriaHarness extends ComponentHarness {
  static hostSelector = 'wj-galleria';

  private readonly region = this.locatorForOptional('[data-pc-section="root"]');
  private readonly previousButton = this.locatorFor('[data-pc-section="prevbutton"]');
  private readonly nextButton = this.locatorFor('[data-pc-section="nextbutton"]');
  private readonly item = this.locatorForOptional('[data-pc-section="item"]');
  private readonly caption = this.locatorForOptional('[data-pc-section="caption"]');
  private readonly dialog = this.locatorForOptional('[aria-modal="true"]');
  private readonly closeButton = this.locatorForOptional('[data-pc-section="closebutton"]');

  /** Finds the galleries whose region is named by `options.ariaLabel`. */
  static with(options: WjGalleriaHarnessFilters = {}): HarnessPredicate<WjGalleriaHarness> {
    return new HarnessPredicate(WjGalleriaHarness, options).addOption(
      'ariaLabel',
      options.ariaLabel,
      async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches(await harness.getAriaLabel(), ariaLabel),
    );
  }

  /**
   * The region's accessible name (`aria-label`); `null` when unset. A full-screen gallery has no
   * region until it is open, so it has no name to find it by while closed.
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this.region())?.getAttribute('aria-label') ?? null;
  }

  /** The item shown, from 0: the number Optimus puts in the item's id. `-1` when nothing is shown. */
  async getActiveIndex(): Promise<number> {
    const id = (await (await this.item())?.getAttribute('id')) ?? '';
    return Number(/_item_(\d+)$/.exec(id)?.[1] ?? -1);
  }

  /** Clicks the previous button. */
  async previous(): Promise<void> {
    await (await this.previousButton()).click();
  }

  /** Clicks the next button. */
  async next(): Promise<void> {
    await (await this.nextButton()).click();
  }

  /** The caption's text, trimmed; `null` when there is no caption. */
  async getCaption(): Promise<string | null> {
    const caption = await this.caption();
    return caption ? (await caption.text()).trim() : null;
  }

  /**
   * Whether the full-screen dialog is open. With motion on, Optimus can leave its closed mask in the
   * page with `display: none`: that is closed.
   */
  async isFullScreenOpen(): Promise<boolean> {
    const dialog = await this.dialog();
    return dialog !== null && (await dialog.getCssValue('display')) !== 'none';
  }

  /** Clicks Close; throws when the full screen is not open. */
  async closeFullScreen(): Promise<void> {
    const close = await this.closeButton();
    if (!close) {
      throw new Error('wj-galleria is not open in full screen');
    }
    await close.click();
  }
}
