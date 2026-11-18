import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-scrollpanel` with {@link WjScrollPanelHarness.with}. */
export interface WjScrollPanelHarnessFilters extends BaseHarnessFilters {
  /** The region's `aria-label` (the `ariaLabel` input), as a string or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for `wj-scrollpanel`. Describes the scroll region as a user meets it: how far it
 * is scrolled, whether it can scroll, whether it has focus, and the names routed onto it. It reads
 * Optimus's `data-pc-section` hook, never a class name. It is a container: what you put inside is
 * reachable through it.
 *
 * The CDK test element cannot scroll, so a spec scrolls with trusted keys (`userEvent` from
 * `vitest/browser`: Tab to the region, then PageDown or End) and reads the position here, by
 * polling, because the browser scrolls after the key press.
 */
export class WjScrollPanelHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-scrollpanel';

  private readonly region = this.locatorFor('[data-pc-section="content"]');

  /** Finds the scroll panels whose `aria-label` matches `options.label`. */
  static with(options: WjScrollPanelHarnessFilters = {}): HarnessPredicate<WjScrollPanelHarness> {
    return new HarnessPredicate(WjScrollPanelHarness, options).addOption(
      'label',
      options.label,
      async (harness, label) => HarnessPredicate.stringMatches(await harness.getAriaLabel(), label),
    );
  }

  /** How far the region is scrolled down, in pixels. */
  async getScrollTop(): Promise<number> {
    return (await this.region()).getProperty<number>('scrollTop');
  }

  /** How far the region is scrolled along the inline axis, in pixels. */
  async getScrollLeft(): Promise<number> {
    return (await this.region()).getProperty<number>('scrollLeft');
  }

  /** Whether the content is larger than the region in either direction. */
  async canScroll(): Promise<boolean> {
    const region = await this.region();
    const [scrollHeight, clientHeight, scrollWidth, clientWidth] = await Promise.all([
      region.getProperty<number>('scrollHeight'),
      region.getProperty<number>('clientHeight'),
      region.getProperty<number>('scrollWidth'),
      region.getProperty<number>('clientWidth'),
    ]);
    return scrollHeight > clientHeight || scrollWidth > clientWidth;
  }

  /** Moves focus to the region. */
  async focus(): Promise<void> {
    await (await this.region()).focus();
  }

  /** Removes focus from the region. */
  async blur(): Promise<void> {
    await (await this.region()).blur();
  }

  /** Whether the region itself has focus (not a control inside it). */
  async isFocused(): Promise<boolean> {
    return (await this.region()).isFocused();
  }

  /** The region's `aria-label`; `null` when it has none. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.region()).getAttribute('aria-label');
  }

  /** The region's `aria-labelledby`; `null` when it has none. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.region()).getAttribute('aria-labelledby');
  }

  /** The region's `aria-describedby`; `null` when it has none. */
  async getAriaDescribedBy(): Promise<string | null> {
    return (await this.region()).getAttribute('aria-describedby');
  }

  /** The region's `role`: `region` while it is named, `null` otherwise. */
  async getRole(): Promise<string | null> {
    return (await this.region()).getAttribute('role');
  }
}
