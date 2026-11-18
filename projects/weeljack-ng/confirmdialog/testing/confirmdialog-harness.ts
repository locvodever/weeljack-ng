import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/**
 * Test harness for `wj-confirmdialog`. Describes the dialog as a user meets it. A closed dialog
 * renders nothing, so everything but {@link isOpen} throws until a confirmation opens it.
 */
export class WjConfirmDialogHarness extends ComponentHarness {
  static hostSelector = 'wj-confirmdialog';

  private readonly dialog = this.locatorFor('div[role="alertdialog"]');
  private readonly maybeDialog = this.locatorForOptional('div[role="alertdialog"]');
  private readonly title = this.locatorFor('[data-wj-confirm-title]');
  private readonly message = this.locatorFor('.message');
  private readonly acceptButton = this.locatorFor('[data-wj-confirm-accept]');
  private readonly rejectButton = this.locatorFor('[data-wj-confirm-reject]');
  private readonly closeButton = this.locatorFor('[data-wj-confirm-close]');

  /** Whether the dialog is on the page. A dialog that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybeDialog()) !== null;
  }

  /** The header text. Empty when the confirmation has no header. */
  async getHeader(): Promise<string> {
    return (await (await this.title()).text()).trim();
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

  /** Clicks Accept: the confirmation's `accept` runs and the dialog closes. */
  async accept(): Promise<void> {
    await (await this.acceptButton()).click();
  }

  /** Clicks Reject: the confirmation's `reject` runs and the dialog closes. */
  async reject(): Promise<void> {
    await (await this.rejectButton()).click();
  }

  /** Clicks the close button: it means Reject. */
  async close(): Promise<void> {
    await (await this.closeButton()).click();
  }

  /** Presses Escape: it means Reject. */
  async cancel(): Promise<void> {
    await (await this.dialog()).sendKeys(TestKey.ESCAPE);
  }

  /** The accessible name of the close button. */
  async getCloseLabel(): Promise<string> {
    return (await (await this.closeButton()).getAttribute('aria-label')) ?? '';
  }

  /** The element's role: `alertdialog`. */
  async getRole(): Promise<string | null> {
    return (await this.dialog()).getAttribute('role');
  }

  /** Whether the dialog tells assistive technology that the page behind it is inert. */
  async isModal(): Promise<boolean> {
    return (await (await this.dialog()).getAttribute('aria-modal')) === 'true';
  }
}
