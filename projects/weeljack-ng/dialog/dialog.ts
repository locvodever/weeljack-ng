import {
  Component,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { Dialog } from '@openng/optimus-ui/dialog';
import {
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _focusIntoOverlay,
  _mergePartAttributes,
  _overlayCloseLabel,
  _overlayEscapeGate,
  _overlayLifecycle,
} from 'weeljack-ng/private';
import { WjDialogFooterSlot } from './dialog-footer';
import type { WjDialogPt } from './dialog-types';

/**
 * A modal dialog over Optimus's `p-dialog`: bind `[(visible)]`, give it a `header`, and put the
 * body in the content and the actions in a `wjDialogFooter` template. The header names the
 * dialog. Focus moves in when it opens (the first control of the body, else the footer, else the
 * close button) and returns to the element that opened it; Tab stays inside, the page behind does
 * not scroll, and Escape or the close button closes it, never a click on the backdrop.
 *
 * `closable` set to `false`, even while the dialog is open, removes the close button and stops
 * Escape: bind it to a busy flag. The close button is named from the translation (`aria.close`).
 * The dialog renders inside the host, which is a block, and its width is its content's.
 */
@Component({
  selector: 'wj-dialog',
  imports: [Dialog],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class WjDialog {
  /** Whether the dialog is open. Two-way: `[(visible)]`. */
  readonly visible = model(false);
  /** The title. It names the dialog (`aria-labelledby`). Rendered as text, never as HTML. */
  readonly header = input.required<string>();
  /**
   * Whether the user can close the dialog: the close button and Escape. Turn it off while the app
   * is busy; it takes effect at once, also while the dialog is open.
   */
  readonly closable = input(true, { transform: booleanAttribute });
  /** Id of the element that describes the dialog. Set on the dialog element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the dialog's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjDialogPt>();
  /** Emits once each time the dialog has opened. */
  readonly opened = output();
  /** Emits once each time the dialog has closed, whatever closed it, after it is gone. */
  readonly closed = output();

  private readonly inner = viewChild(Dialog);
  protected readonly footer = contentChild(WjDialogFooterSlot);
  protected readonly motion = _OVERLAY_MOTION;
  protected readonly closeLabel = _overlayCloseLabel();
  protected readonly closeButtonProps = _OVERLAY_CLOSE_BUTTON;
  protected readonly lifecycle = _overlayLifecycle(this.visible, () => {
    this.closed.emit();
  });

  /** `pt` forwarded as given, plus the description routed to the dialog element. */
  protected readonly partAttributes = computed<WjDialogPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { 'aria-describedby': this.ariaDescribedBy() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-dialog');
    _checkAriaOnHost('wj-dialog', 'Use the ariaDescribedBy input; the header names the dialog');
    _overlayEscapeGate(this.visible, this.closable);

    // Optimus binds its Escape listener when the dialog opens, and only if `closable` is true
    // then. `closable` turning true mid-open (a failed save) would bring the close button back
    // without Escape, so bind it here when it is missing. The gate above holds it back while false.
    effect(() => {
      const dialog = this.inner();
      if (this.closable() && dialog?.container() && !dialog.documentEscapeListener) {
        dialog.bindDocumentEscapeListener();
      }
    });
  }

  /** Optimus has finished opening the dialog: move focus in, then say so. */
  protected entered(): void {
    const dialog = this.inner();
    _focusIntoOverlay(dialog?.container(), [
      dialog?.contentViewChild,
      dialog?.footerViewChild,
      dialog?.headerViewChild,
    ]);
    this.opened.emit();
  }
}
