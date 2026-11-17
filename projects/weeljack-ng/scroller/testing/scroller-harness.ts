import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-scroller` with {@link WjScrollerHarness.with}. */
export interface WjScrollerHarnessFilters extends BaseHarnessFilters {
  /**
   * The region's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/**
 * Test harness for `wj-scroller`. Describes the scroller as a user meets it: the items in view, the
 * scroll position and the wait for a lazy load. A virtual scroller renders only a window of its
 * items, so what the harness reads is that window.
 */
export class WjScrollerHarness extends ComponentHarness {
  static hostSelector = 'wj-scroller';

  private readonly root = this.locatorFor('.p-virtualscroller');
  private readonly content = this.locatorFor('.p-virtualscroller-content');
  private readonly items = this.locatorForAll('.p-virtualscroller-content > *');

  /** Finds the scrollers whose name matches `options.name`. */
  static with(options: WjScrollerHarnessFilters = {}): HarnessPredicate<WjScrollerHarness> {
    return new HarnessPredicate(WjScrollerHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /**
   * The region's name: its `aria-label`, else the text of the element its `aria-labelledby` points
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

  /**
   * The text of each rendered item, in order. It is the window Optimus keeps in the DOM: the items
   * in view and a few either side, never all of `items`. Needs one element per item.
   */
  async getRenderedItemTexts(): Promise<string[]> {
    const texts: string[] = [];
    for (const item of await this.items()) {
      texts.push((await item.text()).trim());
    }
    return texts;
  }

  /**
   * Scrolls the viewport to `px` along its axis, as a user dragging the scrollbar would, and waits
   * for the scroller to follow. Works in the unit-test environment only: it needs the DOM element.
   */
  async scrollToOffset(px: number): Promise<void> {
    const content = await this.content();
    // The harness API cannot scroll, so read the viewport element off the content's parent.
    const viewport = await content.getProperty<unknown>('parentElement');
    if (!(viewport instanceof HTMLElement)) {
      throw new Error('wj-scroller: scrollToOffset needs the unit-test harness environment');
    }
    const horizontal = viewport.classList.contains('p-virtualscroller-horizontal');
    const before = horizontal ? viewport.scrollLeft : viewport.scrollTop;
    viewport.scrollTo(
      horizontal ? { left: px, behavior: 'instant' } : { top: px, behavior: 'instant' },
    );
    if ((horizontal ? viewport.scrollLeft : viewport.scrollTop) !== before) {
      // The scroll event fires on the next frame, and the scroller renders its new window in it.
      await new Promise<void>((resolve) => {
        viewport.addEventListener(
          'scroll',
          () => {
            resolve();
          },
          { once: true },
        );
      });
    }
    await this.forceStabilize();
  }

  /** Whether a `lazy` scroller is loading (`aria-busy` on the region). */
  async isLoading(): Promise<boolean> {
    return (await (await this.root()).getAttribute('aria-busy')) === 'true';
  }
}
