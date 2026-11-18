import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding an element with `wjRipple` through {@link WjRippleHarness.with}. */
export type WjRippleHarnessFilters = BaseHarnessFilters;

/** Test harness for an element with `wjRipple`, whatever the element is. */
export class WjRippleHarness extends ComponentHarness {
  static hostSelector = '[wjRipple]';

  /** Finds the elements that match `options` (a `selector` or an `ancestor`). */
  static with(options: WjRippleHarnessFilters = {}): HarnessPredicate<WjRippleHarness> {
    return new HarnessPredicate(WjRippleHarness, options);
  }

  /** Presses the element with a pointer at its centre: a mousedown, then a mouseup. */
  async press(): Promise<void> {
    const host = await this.host();
    const { top, left, width, height } = await host.getDimensions();
    // The ink's position is not what a test reads, so the page coordinates are the viewport's.
    const point = { clientX: left + width / 2, clientY: top + height / 2 };
    const data = { ...point, pageX: point.clientX, pageY: point.clientY };
    await host.dispatchEvent('mousedown', data);
    await host.dispatchEvent('mouseup', data);
  }

  /** Whether an ink shows: an ink the press drew, whose computed `display` is not `none`. */
  async hasInk(): Promise<boolean> {
    const ink = await this.locatorForOptional('[data-wj-ink]')();
    return ink !== null && (await ink.getCssValue('display')) !== 'none';
  }

  /** Whether `wjRippleDisabled` is on, so a press draws no ink. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-wj-ripple-disabled')) === 'true';
  }
}
