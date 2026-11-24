import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding an element with `wjAnimateOnScroll` through {@link WjAnimateOnScrollHarness.with}. */
export type WjAnimateOnScrollHarnessFilters = BaseHarnessFilters;

/** Test harness for an element with `wjAnimateOnScroll`, whatever the element is. */
export class WjAnimateOnScrollHarness extends ComponentHarness {
  static hostSelector = '[wjAnimateOnScroll]';

  /** Finds the elements that match `options` (a `selector` or an `ancestor`). */
  static with(
    options: WjAnimateOnScrollHarnessFilters = {},
  ): HarnessPredicate<WjAnimateOnScrollHarness> {
    return new HarnessPredicate(WjAnimateOnScrollHarness, options);
  }

  /** Whether the element is held: its computed `opacity` is `0`, as before it first enters. */
  async isHidden(): Promise<boolean> {
    const opacity = await (await this.host()).getCssValue('opacity');
    return Number(opacity) === 0;
  }

  /** Whether the element carries the class `name`, for example the app's enter class. */
  async hasClass(name: string): Promise<boolean> {
    return (await this.host()).hasClass(name);
  }
}
