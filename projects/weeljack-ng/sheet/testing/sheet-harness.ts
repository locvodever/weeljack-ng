import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-sheet` with {@link WjSheetHarness.with}. */
export interface WjSheetHarnessFilters extends BaseHarnessFilters {
  /** The title, as a string for an exact match or a RegExp. Only an open sheet has one. */
  title?: string | RegExp;
}

/**
 * Test harness for `wj-sheet`. Describes the sheet as a user meets it, in either mode. The body and
 * the footer are inside it, so `getHarness(WjButtonHarness.with({ label: 'Save' }))` or
 * `getAllHarnesses(WjButtonHarness)` reaches the actions. A closed sheet renders nothing, so
 * everything but {@link getMode} and {@link isOpen} throws until it opens.
 */
export class WjSheetHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-sheet';

  private readonly sheet = this.locatorFor('[role="dialog"]');
  private readonly maybeSheet = this.locatorForOptional('[role="dialog"]');
  private readonly title = this.locatorFor('[data-pc-section="title"]');
  private readonly closeButton = this.locatorForOptional('[data-pc-section="header"] button');
  // The dialog's backdrop is inside the host; the drawer's is appended to the document body.
  private readonly dialogBackdrop = this.locatorForOptional('.p-dialog-mask');
  private readonly drawerBackdrop =
    this.documentRootLocatorFactory().locatorForOptional('.p-drawer-mask');

  /** Finds the sheets that match `options`. */
  static with(options: WjSheetHarnessFilters = {}): HarnessPredicate<WjSheetHarness> {
    return new HarnessPredicate(WjSheetHarness, options).addOption(
      'title',
      options.title,
      async (harness, title) =>
        HarnessPredicate.stringMatches(
          (await harness.isOpen()) ? await harness.getTitle() : null,
          title,
        ),
    );
  }

  /** The mode the sheet is in, from `data-wj-mode`: a `dialog` on wide screens, else a `drawer`. */
  async getMode(): Promise<'dialog' | 'drawer'> {
    const mode = await (await this.host()).getAttribute('data-wj-mode');
    if (mode === 'dialog' || mode === 'drawer') {
      return mode;
    }
    throw new Error(`wj-sheet has no known mode: ${String(mode)}`);
  }

  /** Whether the sheet is on the page. A sheet that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybeSheet()) !== null;
  }

  /** The title text. */
  async getTitle(): Promise<string> {
    return (await (await this.title()).text()).trim();
  }

  /** The element's role: `dialog`, in both modes. */
  async getRole(): Promise<string | null> {
    return (await this.sheet()).getAttribute('role');
  }

  /** Whether the sheet tells assistive technology that the page behind it is inert. */
  async isModal(): Promise<boolean> {
    return (await (await this.sheet()).getAttribute('aria-modal')) === 'true';
  }

  /** Whether the sheet has a close button (it has none while `closable` is false). */
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
      throw new Error('wj-sheet has no close button: it is not closable, or it is closed');
    }
    await button.click();
  }

  /** Presses Escape on the sheet, as a user does. It closes the sheet only while closable. */
  async closeWithEscape(): Promise<void> {
    await (await this.sheet()).sendKeys(TestKey.ESCAPE);
  }

  /** Whether the page behind the sheet has a backdrop over it. */
  async hasBackdrop(): Promise<boolean> {
    return (await this.dialogBackdrop()) !== null || (await this.drawerBackdrop()) !== null;
  }

  /**
   * Clicks the backdrop, as a user does. It closes a drawer while closable, and never a dialog.
   * Throws without a backdrop.
   */
  async clickBackdrop(): Promise<void> {
    const backdrop = (await this.dialogBackdrop()) ?? (await this.drawerBackdrop());
    if (backdrop === null) {
      throw new Error('wj-sheet has no backdrop: it is closed');
    }
    await backdrop.click();
  }

  /** Whether focus is on the sheet or inside it. */
  async containsFocus(): Promise<boolean> {
    return (await this.sheet()).matchesSelector(':focus-within');
  }
}
