import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** The popup renders in `document.body`, so it is found from the document root. */
const POPUP = '[role="alertdialog"][data-wj-confirmpopup]';

/**
 * Test harness for `wj-confirmpopup`. Describes the popup as a user meets it. A closed popup
 * renders nothing, so everything but {@link isOpen} throws until a confirmation opens it. With
 * one `wj-confirmpopup` per application, the popup it finds is that host's.
 */
export class WjConfirmPopupHarness extends ComponentHarness {
  static hostSelector = 'wj-confirmpopup';

  private readonly popup = this.documentRootLocatorFactory().locatorFor(POPUP);
  private readonly maybePopup = this.documentRootLocatorFactory().locatorForOptional(POPUP);
  private readonly message = this.documentRootLocatorFactory().locatorFor(
    `${POPUP} .p-confirmpopup-message`,
  );
  private readonly acceptButton = this.documentRootLocatorFactory().locatorFor(
    `${POPUP} [data-wj-confirm-accept]`,
  );
  private readonly rejectButton = this.documentRootLocatorFactory().locatorFor(
    `${POPUP} [data-wj-confirm-reject]`,
  );

  /** Whether the popup is on the page. A popup that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybePopup()) !== null;
  }

  /** The message text. */
  async getMessage(): Promise<string> {
    return (await (await this.message()).text()).trim();
  }

  /** The Accept button's label. */
  async getAcceptLabel(): Promise<string> {
    return (await (await this.acceptButton()).text()).trim();
  }

  /** The Reject button's label. */
  async getRejectLabel(): Promise<string> {
    return (await (await this.rejectButton()).text()).trim();
  }

  /** The popup's accessible name: the message it is labelled by, `null` while nothing names it. */
  async getName(): Promise<string | null> {
    const id = await (await this.popup()).getAttribute('aria-labelledby');
    if (!id) {
      return null;
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(
      `#${CSS.escape(id)}`,
    )();
    return (await named?.text())?.trim() ?? null;
  }

  /** The element's role: `alertdialog`. */
  async getRole(): Promise<string | null> {
    return (await this.popup()).getAttribute('role');
  }

  /** Clicks Accept: the confirmation's `accept` runs and the popup closes. */
  async accept(): Promise<void> {
    await (await this.acceptButton()).click();
  }

  /** Clicks Reject: the confirmation's `reject` runs and the popup closes. */
  async reject(): Promise<void> {
    await (await this.rejectButton()).click();
  }

  /** Presses Escape: it means Reject. */
  async cancel(): Promise<void> {
    await (await this.popup()).sendKeys(TestKey.ESCAPE);
  }
}
