import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding an element with `wjAutoFocus` through {@link WjAutoFocusHarness.with}. */
export type WjAutoFocusHarnessFilters = BaseHarnessFilters;

/** Test harness for an element with `wjAutoFocus`, whatever the element is. */
export class WjAutoFocusHarness extends ComponentHarness {
  static hostSelector = '[wjAutoFocus]';

  /** Finds the elements that match `options` (a `selector` or an `ancestor`). */
  static with(options: WjAutoFocusHarnessFilters = {}): HarnessPredicate<WjAutoFocusHarness> {
    return new HarnessPredicate(WjAutoFocusHarness, options);
  }

  /**
   * Whether the element, or something inside it, has focus. A container with `wjAutoFocus` is
   * focused when the field it moved focus into is. Optimus focuses in a timer after the render,
   * so poll this (`expect.poll`) rather than reading it once.
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).matchesSelector(':focus-within');
  }
}
