import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-dialog` with {@link WjDialogHarness.with}. */
export interface WjDialogHarnessFilters extends BaseHarnessFilters {
  /** The title, as a string for an exact match or a RegExp. Only an open dialog has one. */
  title?: string | RegExp;
}

/**
 * Test harness for `wj-dialog`. Describes the dialog as a user meets it. The body and the footer
 * are inside it, so `getHarness(WjButtonHarness.with({ label: 'Delete' }))` reaches the actions.
 * A closed dialog renders nothing, so everything but {@link isOpen} throws until it opens.
 */
export class WjDialogHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-dialog';

  private readonly dialog = this.locatorFor('[role="dialog"]');
  private readonly maybeDialog = this.locatorForOptional('[role="dialog"]');
  private readonly title = this.locatorFor('[data-pc-section="title"]');
  private readonly closeButton = this.locatorForOptional('[data-pc-section="header"] button');

  /** Finds the dialogs that match `options`. */
  static with(options: WjDialogHarnessFilters = {}): HarnessPredicate<WjDialogHarness> {
    return new HarnessPredicate(WjDialogHarness, options).addOption(
      'title',
      options.title,
      async (harness, title) =>
        HarnessPredicate.stringMatches(
          (await harness.isOpen()) ? await harness.getTitle() : null,
          title,
        ),
    );
  }

  /** Whether the dialog is on the page. A dialog that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybeDialog()) !== null;
  }

  /** The title text. */
  async getTitle(): Promise<string> {
    return (await (await this.title()).text()).trim();
  }

  /** The element's role: `dialog`. */
  async getRole(): Promise<string | null> {
    return (await this.dialog()).getAttribute('role');
  }

  /** Whether the dialog tells assistive technology that the page behind it is inert. */
  async isModal(): Promise<boolean> {
    return (await (await this.dialog()).getAttribute('aria-modal')) === 'true';
  }

  /** The text of the element that describes the dialog, `null` without `ariaDescribedBy`. */
  async getDescription(): Promise<string | null> {
    const id = await (await this.dialog()).getAttribute('aria-describedby');
    if (id === null) {
      return null;
    }
    const description = await this.documentRootLocatorFactory().locatorForOptional(
      `#${CSS.escape(id)}`,
    )();
    return (await description?.text())?.trim() ?? null;
  }

  /** Whether the dialog has a close button (it has none while `closable` is false). */
  async hasCloseButton(): Promise<boolean> {
    return (await this.closeButton()) !== null;
  }

  /** The close button's accessible name, `null` when there is no button. */
  async getCloseLabel(): Promise<string | null> {
    return (await (await this.closeButton())?.getAttribute('aria-label')) ?? null;
  }

  /** Clicks the close button. Throws when there is none. */
  async close(): Promise<void> {
    const button = await this.closeButton();
    if (button === null) {
      throw new Error('wj-dialog has no close button: it is not closable, or it is closed');
    }
    await button.click();
  }

  /** Presses Escape on the dialog, as a user does. It closes the dialog only while closable. */
  async closeWithEscape(): Promise<void> {
    await (await this.dialog()).sendKeys(TestKey.ESCAPE);
  }

  /** Whether focus is on the dialog or inside it. */
  async containsFocus(): Promise<boolean> {
    return (await this.dialog()).matchesSelector(':focus-within');
  }
}
