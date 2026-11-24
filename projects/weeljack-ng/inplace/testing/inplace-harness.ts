import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-inplace` with {@link WjInplaceHarness.with}. */
export interface WjInplaceHarnessFilters extends BaseHarnessFilters {
  /** The text of the display, as a string or a RegExp. Only an inplace that is not active has it. */
  displayText?: string | RegExp;
}

/**
 * Test harness for `wj-inplace`. Describes the component as a user meets it: the display while it
 * is inactive, the content (and the close button) while it is active. It reads Optimus's
 * `data-pc-*` hooks and the attributes `wj-inplace` sets, never a class name. It is a container:
 * what your content template renders is inside it, so
 * `getHarness(WjInputTextHarness)` reaches the editor once the inplace is active.
 */
export class WjInplaceHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-inplace';

  private readonly display = this.locatorForOptional('[data-pc-section="display"][role="button"]');
  private readonly content = this.locatorForOptional('[data-pc-section="content"]');
  private readonly closeButton = this.locatorForOptional('[data-pc-name="pcbutton"]');

  /** Finds the inplaces whose display text matches `options.displayText`. */
  static with(options: WjInplaceHarnessFilters = {}): HarnessPredicate<WjInplaceHarness> {
    return new HarnessPredicate(WjInplaceHarness, options).addOption(
      'displayText',
      options.displayText,
      (harness, displayText) =>
        HarnessPredicate.stringMatches(harness.getDisplayText(), displayText),
    );
  }

  /** Whether the content shows in place of the display. */
  async isActive(): Promise<boolean> {
    return (await this.content()) !== null;
  }

  /** Whether `closable` is set, whether or not the inplace is active. */
  async isClosable(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-wj-closable')) !== null;
  }

  /** Whether `disabled` is set, whether or not the inplace is active. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-wj-disabled')) !== null;
  }

  /** The text of the display, trimmed; empty while the inplace is active. */
  async getDisplayText(): Promise<string> {
    return ((await (await this.display())?.text()) ?? '').trim();
  }

  /** The text of the content, trimmed, close button included; empty while not active. */
  async getContentText(): Promise<string> {
    return ((await (await this.content())?.text()) ?? '').trim();
  }

  /** Clicks the display, which activates the inplace. Fails while it is already active. */
  async activate(): Promise<void> {
    await (await this.requireDisplay()).click();
  }

  /** Clicks the close button, which switches back to the display. Fails without a close button. */
  async close(): Promise<void> {
    const button = await this.closeButton();
    if (button === null) {
      throw new Error('wj-inplace has no close button: it is active and `closable` only.');
    }
    await button.click();
  }

  /** Moves focus to the display. Fails while the inplace is active. */
  async focus(): Promise<void> {
    await (await this.requireDisplay()).focus();
  }

  /** Removes focus from the display. Fails while the inplace is active. */
  async blur(): Promise<void> {
    await (await this.requireDisplay()).blur();
  }

  /** Whether the display has focus; `false` while the inplace is active. */
  async isFocused(): Promise<boolean> {
    return (await (await this.display())?.isFocused()) ?? false;
  }

  /** Whether focus is in the content or on the content part; `false` while not active. */
  async hasContentFocus(): Promise<boolean> {
    return (await (await this.content())?.matchesSelector(':focus-within')) ?? false;
  }

  /** The display's `aria-label`; `null` when it has none or the inplace is active. */
  async getAriaLabel(): Promise<string | null> {
    return (await (await this.display())?.getAttribute('aria-label')) ?? null;
  }

  /** The display's `aria-labelledby`; `null` when it has none or the inplace is active. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await (await this.display())?.getAttribute('aria-labelledby')) ?? null;
  }

  /** The display's `aria-describedby`; `null` when it has none or the inplace is active. */
  async getAriaDescribedBy(): Promise<string | null> {
    return (await (await this.display())?.getAttribute('aria-describedby')) ?? null;
  }

  /** The close button's accessible name; `null` while there is no close button. */
  async getCloseLabel(): Promise<string | null> {
    return (await (await this.closeButton())?.getAttribute('aria-label')) ?? null;
  }

  private async requireDisplay(): Promise<TestElement> {
    const display = await this.display();
    if (display === null) {
      throw new Error('wj-inplace shows no display: it is active.');
    }
    return display;
  }
}
