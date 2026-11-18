import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** The hook `WjDialogService` puts on the dialog element. */
const DIALOG = '[data-wj-dynamicdialog]';

/** Criteria for finding a dynamic dialog with {@link WjDynamicDialogHarness.with}. */
export interface WjDynamicDialogHarnessFilters extends BaseHarnessFilters {
  /** The header, as a string for an exact match or a RegExp. */
  header?: string | RegExp;
}

/**
 * Test harness for a dialog opened with `WjDialogService`. The dialog renders in `document.body`,
 * outside the fixture, so find it from the document root:
 * `TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(WjDynamicDialogHarness)`. The
 * harnesses of the component inside it are found from the dialog:
 * `dialog.getHarness(WjButtonHarness.with({ label: 'Save' }))`. A closed dialog has no element, so
 * there is nothing to find: ask the loader with `getAllHarnesses` whether one is open.
 */
export class WjDynamicDialogHarness extends ContentContainerComponentHarness {
  static hostSelector = DIALOG;

  private readonly title = this.locatorFor('[data-pc-section="title"]');
  private readonly closeButton = this.locatorForOptional('[data-pc-section="header"] button');
  private readonly onPage = this.documentRootLocatorFactory().locatorForOptional(DIALOG);

  /** Finds the dialogs that match `options`. */
  static with(
    options: WjDynamicDialogHarnessFilters = {},
  ): HarnessPredicate<WjDynamicDialogHarness> {
    return new HarnessPredicate(WjDynamicDialogHarness, options).addOption(
      'header',
      options.header,
      async (harness, header) => HarnessPredicate.stringMatches(await harness.getHeader(), header),
    );
  }

  /** Whether a dialog is still on the page. A dialog that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.onPage()) !== null;
  }

  /** The header text. */
  async getHeader(): Promise<string> {
    return (await (await this.title()).text()).trim();
  }

  /** The element's role: `dialog`. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Whether the dialog tells assistive technology that the page behind it is inert. */
  async isModal(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-modal')) === 'true';
  }

  /** Whether the dialog has a close button (it has none when it was opened `closable: false`). */
  async hasCloseButton(): Promise<boolean> {
    return (await this.closeButton()) !== null;
  }

  /** The close button's accessible name, `null` when there is no button. */
  async getCloseLabel(): Promise<string | null> {
    return (await (await this.closeButton())?.getAttribute('aria-label')) ?? null;
  }

  /** Clicks the close button: `closed` settles with `undefined`. Throws when there is none. */
  async close(): Promise<void> {
    const button = await this.closeButton();
    if (button === null) {
      throw new Error('The dynamic dialog has no close button: it is not closable, or it is gone');
    }
    await button.click();
  }

  /** Presses Escape on the dialog, as a user does. It closes the dialog only while closable. */
  async closeWithEscape(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }

  /** Whether focus is on the dialog or inside it. */
  async containsFocus(): Promise<boolean> {
    return (await this.host()).matchesSelector(':focus-within');
  }
}
