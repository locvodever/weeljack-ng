import { Injectable, Injector, inject } from '@angular/core';
import { _WJ_CONFIRMATIONS, _confirm } from 'weeljack-ng/private';

/**
 * What to ask for `WjConfirmationService.confirm`. Only these fields are used: any other key of a
 * wider object is dropped.
 *
 * A `type` alias, not an `interface`: the API generator documents type aliases only.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjConfirmation = {
  /** The question. Rendered as text, never as HTML. It describes the dialog and names the popup. */
  message: string;
  /** The dialog's title, which names it. The popup ignores it. Rendered as text. */
  header?: string;
  /** The Accept button's label. Unset uses the translation's `accept` ("Yes"). */
  acceptLabel?: string;
  /** The Reject button's label. Unset uses the translation's `reject` ("No"). */
  rejectLabel?: string;
  /** Runs once, when the reader accepts. */
  accept?: () => void;
  /** Runs once, when the reader rejects: the Reject button, the close button or Escape. */
  reject?: () => void;
  /** Present: the popup opens beside this element. Absent: the dialog opens. */
  target?: EventTarget;
};

/**
 * Asks the reader to confirm an action, in the application's `wj-confirmdialog`, or, with a
 * `target`, in its `wj-confirmpopup`. Root-provided: inject it anywhere and provide nothing. This
 * is the root-provided `Wj*` service pattern (W1-display 4.4), kept in the root because two
 * entries drive it:
 *
 * - **One Optimus instance:** it writes to an internal root token that holds Optimus's
 *   `ConfirmationService`, and never exposes that instance or extends its class.
 * - **How the hosts connect:** each host maps Optimus's service class to that token in its own
 *   `providers`. The service sets an internal routing key, and each host opens only its own, so
 *   a confirmation never opens in both.
 * - **SSR:** no module-level state and no browser global, so each server request has its own
 *   instance.
 *
 * Render one `wj-confirmdialog` (and one `wj-confirmpopup`, if you pass a `target`) in your app
 * shell: a confirmation with no host is dropped, with a dev-mode warning. In a spec, replace the
 * call with `vi.spyOn(TestBed.inject(WjConfirmationService), 'confirm')`.
 */
@Injectable({ providedIn: 'root' })
export class WjConfirmationService {
  private readonly confirmations = inject(_WJ_CONFIRMATIONS);
  private readonly injector = inject(Injector);

  /**
   * Opens the confirmation. Only `WjConfirmation`'s fields are used. `accept` and `reject` each
   * run once, with no arguments, when the reader chooses.
   */
  confirm(confirmation: WjConfirmation): void {
    _confirm(this.confirmations, this.injector, confirmation);
  }

  /** Closes the open confirmation without running `accept` or `reject`. */
  close(): void {
    this.confirmations.close();
  }
}
