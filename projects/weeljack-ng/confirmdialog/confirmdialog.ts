import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { ConfirmDialog } from '@openng/optimus-ui/confirmdialog';
import { Dialog } from '@openng/optimus-ui/dialog';
import {
  _CONFIRM_DIALOG_KEY,
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _WJ_CONFIRMATIONS,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _overlayCloseLabel,
  _overlayEscapeGate,
  _overlayLifecycle,
  _registerConfirmationHost,
  _wjId,
} from 'weeljack-ng/private';
import type { WjConfirmDialogPt } from './confirmdialog-types';

/** Button props that keep Optimus from writing `autofocus="true"` on a button. */
const INERT = { autofocus: false };

/**
 * Optimus's ConfirmDialog binds no `closeButtonProps` to its Dialog, so the close button gets
 * `autofocus="true"`, and `pt` cannot clear it (Optimus's `pAutoFocus` sets it again on every
 * check). The Dialog is the `instance` its parts' `pt` functions are called with (the title's runs
 * before the close button is bound), so the props `wj-dialog` binds are set on it from here.
 */
function keepCloseButtonInert(context: unknown): void {
  const dialog: unknown = Reflect.get(Object(context), 'instance');
  if (dialog instanceof Dialog) {
    dialog.closeButtonProps = _OVERLAY_CLOSE_BUTTON;
  }
}

/**
 * Where the application's confirmations open as a modal dialog, over Optimus's `p-confirmDialog`.
 * Render exactly one in your app shell and ask from code with
 * `inject(WjConfirmationService).confirm({ header, message, accept })`: a confirmation without a
 * `target` opens here. Provide nothing: the host reads the same confirmations as the service.
 *
 * The dialog is an `alertdialog` named by the confirmation's header (or its message when there is
 * no header) and described by its message. Focus starts on Reject, the least destructive choice;
 * Escape, the close button and Reject all run `reject` once, Accept runs `accept` once, and a
 * click on the backdrop does nothing. Focus returns to the control that asked.
 */
@Component({
  selector: 'wj-confirmdialog',
  imports: [ConfirmDialog],
  templateUrl: './confirmdialog.html',
  styleUrl: './confirmdialog.css',
  // The host connects to the service (W1-display 4.4): Optimus's confirm dialog injects
  // `ConfirmationService`, and gets the instance `WjConfirmationService` writes to.
  providers: [{ provide: ConfirmationService, useExisting: _WJ_CONFIRMATIONS }],
})
export class WjConfirmDialog {
  /**
   * Pass-through for the dialog's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjConfirmDialogPt>();

  private readonly inner = viewChild(ConfirmDialog);
  private readonly titleId = _wjId('confirm-title');
  private readonly closeLabel = _overlayCloseLabel();
  private readonly header = signal<string | undefined>(undefined);
  protected readonly key = _CONFIRM_DIALOG_KEY;
  protected readonly messageId = _wjId('confirm-message');
  /** The question: the wrapper renders it as text, in place of Optimus's `[innerHTML]` span. */
  protected readonly text = signal('');
  /** Whether a confirmation is open: set by the service's stream, cleared by Optimus's `onHide`. */
  protected readonly open = signal(false);

  /**
   * `pt` forwarded as given, plus the attributes this wrapper sets: the name and description, no
   * `autofocus` on the three buttons, the close button's name, Reject drawn as the quiet button,
   * `safe` motion (Optimus's Dialog reads `motion` and `maskMotion` from this `pt`), and the
   * `data-wj-confirm-*` hooks the harness reads. A routed value wins over the consumer's.
   */
  protected readonly partAttributes = computed<WjConfirmDialogPt>(() => {
    let pt = _mergePartAttributes(this.pt(), 'root', {
      'aria-labelledby': this.header() ? this.titleId : this.messageId,
      'aria-describedby': this.messageId,
    });
    pt = _mergePartAttributes(pt, 'title', { id: this.titleId, 'data-wj-confirm-title': '' });
    pt = _mergePartAttributes(pt, 'pcCloseButton.root', {
      'aria-label': this.closeLabel,
      'data-wj-confirm-close': '',
    });
    pt = _mergePartAttributes(pt, 'pcAcceptButton.root', { 'data-wj-confirm-accept': '' });
    pt = _mergePartAttributes(pt, 'pcRejectButton.root', {
      class: 'p-button-secondary p-button-outlined',
      'data-wj-confirm-reject': '',
    });
    pt = _mergePartAttributes(pt, 'motion', _OVERLAY_MOTION);
    const merged = _mergePartAttributes(pt, 'maskMotion', _OVERLAY_MOTION);
    // Resolved once, to the object form: Optimus hands this `pt` to its Dialog unresolved, so a
    // function would hide every Dialog part (title, close button, mask) from it (#16). A consumer
    // function is called here, with no instance.
    const resolved = merged({ instance: undefined, parent: { instance: undefined } });
    const title = resolved.title;
    return {
      ...resolved,
      title: (context) => {
        keepCloseButtonInert(context);
        return typeof title === 'function' ? title(context) : title;
      },
    };
  });

  /** Returns focus to the opener once the dialog has left, for every cause. */
  private readonly lifecycle = _overlayLifecycle(this.open, () => undefined);

  constructor() {
    _checkWeeljackSetup('wj-confirmdialog');
    _checkAriaOnHost(
      'wj-confirmdialog',
      "The confirmation's header and message name and describe the dialog; remove the attribute",
    );
    _registerConfirmationHost(_CONFIRM_DIALOG_KEY, 'wj-confirmdialog');
    // It has no `closable` of its own: it joins the overlay stack, so Escape reaches it, and any
    // overlay opened above it, in turn.
    _overlayEscapeGate(this.open, () => true);

    const subscription = inject(_WJ_CONFIRMATIONS).requireConfirmation$.subscribe((request) => {
      if (request?.key === _CONFIRM_DIALOG_KEY) {
        this.header.set(request.header);
        this.text.set(request.message ?? '');
        this.open.set(true);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
    });

    // Optimus's confirm dialog binds nothing of its Dialog's `onHide` out, and its own `onHide`
    // fires as the dialog starts to close. Its `onDialogHide` runs when Dialog has left, for every
    // cause, so the opener gets focus back from there. The method is public in the `.d.ts`.
    const patched = new WeakSet<ConfirmDialog>();
    effect(() => {
      const dialog = this.inner();
      if (dialog && !patched.has(dialog)) {
        patched.add(dialog);
        // Its two buttons get `autofocus="true"` unless the props say `false`; `option()` reads
        // them from the instance when the confirmation has none, so the confirmation stays Wj's.
        Object.assign(dialog, { acceptButtonProps: INERT, rejectButtonProps: INERT });
        const hide = dialog.onDialogHide.bind(dialog);
        dialog.onDialogHide = () => {
          hide();
          this.lifecycle.left();
        };
      }
    });
  }
}
