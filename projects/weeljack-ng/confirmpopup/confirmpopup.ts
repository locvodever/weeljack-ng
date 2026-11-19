import { DOCUMENT } from '@angular/common';
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
import { ConfirmPopup } from '@openng/optimus-ui/confirmpopup';
import {
  _CONFIRM_POPUP_KEY,
  _OVERLAY_MOTION,
  _WJ_CONFIRMATIONS,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _overlayEscapeGate,
  _overlayLifecycle,
  _registerConfirmationHost,
  _wjId,
} from 'weeljack-ng/private';
import type { WjConfirmPopupPt } from './confirmpopup-types';

/** Button props that keep Optimus from writing `autofocus="true"` on a button. */
const INERT = { autofocus: false };

/**
 * Where the application's confirmations that name a `target` open as a small popup beside that
 * element, over Optimus's `p-confirmpopup`. Render exactly one in your app shell, beside
 * `wj-confirmdialog`, and ask from code with
 * `inject(WjConfirmationService).confirm({ message, target: event.currentTarget, accept })`.
 * Provide nothing: the host reads the same confirmations as the service.
 *
 * The popup is an `alertdialog` named by the confirmation's message. Focus starts on Reject, the
 * least destructive choice; Escape and Reject run `reject` once, Accept runs `accept` once. Focus
 * returns to the `target` (a `wj-button` host included) after any of them. A click outside closes
 * it and leaves focus where the click put it.
 */
@Component({
  selector: 'wj-confirmpopup',
  imports: [ConfirmPopup],
  templateUrl: './confirmpopup.html',
  styleUrl: './confirmpopup.css',
  // The host connects to the service (W1-display 4.4): Optimus's confirm popup injects
  // `ConfirmationService`, and gets the instance `WjConfirmationService` writes to.
  providers: [{ provide: ConfirmationService, useExisting: _WJ_CONFIRMATIONS }],
})
export class WjConfirmPopup {
  /**
   * Pass-through for the popup's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjConfirmPopupPt>();

  private readonly inner = viewChild(ConfirmPopup);
  private readonly document = inject(DOCUMENT);
  private readonly messageId = _wjId('confirmpopup-message');
  private readonly target = signal<unknown>(undefined);
  protected readonly key = _CONFIRM_POPUP_KEY;
  protected readonly motion = _OVERLAY_MOTION;
  /** Whether a confirmation is open: set by the service's stream, cleared when the popup has left. */
  protected readonly open = signal(false);

  /**
   * `pt` forwarded as given, plus the attributes this wrapper sets: the name (the message's id on
   * the root's `aria-labelledby`), `aria-modal` (Optimus traps Tab inside the popup with two
   * `aria-hidden` focusable sentinels, which axe accepts only in a modal), Reject drawn as the
   * quiet button, and the `data-wj-confirm*` hooks the harness reads. A routed value wins over the consumer's. Optimus resolves this `pt`
   * itself and hands each button its part as an object, so the function form reaches every part.
   */
  protected readonly partAttributes = computed<WjConfirmPopupPt>(() => {
    let pt = _mergePartAttributes(this.pt(), 'root', {
      'aria-labelledby': this.messageId,
      'aria-modal': 'true',
      'data-wj-confirmpopup': '',
    });
    pt = _mergePartAttributes(pt, 'message', { id: this.messageId });
    pt = _mergePartAttributes(pt, 'pcAcceptButton.root', { 'data-wj-confirm-accept': '' });
    return _mergePartAttributes(pt, 'pcRejectButton.root', {
      class: 'p-button-secondary p-button-outlined',
      'data-wj-confirm-reject': '',
    });
  });

  /** Returns focus to the target once the popup has left, for every cause. */
  private readonly lifecycle = _overlayLifecycle(
    this.open,
    () => undefined,
    () => this.target(),
  );

  constructor() {
    _checkWeeljackSetup('wj-confirmpopup');
    _checkAriaOnHost(
      'wj-confirmpopup',
      "The confirmation's message names the popup; remove the attribute",
    );
    _registerConfirmationHost(_CONFIRM_POPUP_KEY, 'wj-confirmpopup');
    // It has no `closable` of its own: it joins the overlay stack, so Escape reaches it, and any
    // overlay opened above it, in turn.
    _overlayEscapeGate(
      this.open,
      () => true,
      () => this.inner(),
    );

    const subscription = inject(_WJ_CONFIRMATIONS).requireConfirmation$.subscribe((request) => {
      if (request?.key === _CONFIRM_POPUP_KEY) {
        this.target.set(request.target);
        this.open.set(true);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
    });

    // Optimus's popup has no output for leaving. Its `onAfterLeave` runs when the panel has left,
    // for every cause (a button, Escape, an outside click, a scroll, a resize, `close()`), so the
    // target gets focus back from there. The method is public in the `.d.ts`.
    const patched = new WeakSet<ConfirmPopup>();
    effect(() => {
      const popup = this.inner();
      if (popup && !patched.has(popup)) {
        patched.add(popup);
        // Its buttons get `autofocus="true"` unless the props say `false`; `option()` reads them
        // from the instance when the confirmation has none, so the confirmation stays Wj's.
        Object.assign(popup, { acceptButtonProps: INERT, rejectButtonProps: INERT });
        // Optimus's focus into the popup (`handleFocus`) finds no button: it looks for template
        // references the template does not declare. What it relies on instead is `autofocus`
        // on a button, which writes `autofocus="true"`. `defaultFocus="none"` keeps that off, and
        // Reject, the least destructive choice, gets focus from here.
        popup.handleFocus = () => {
          popup.container?.querySelector<HTMLElement>('[data-wj-confirm-reject]')?.focus();
        };
        // Optimus marks a flipped popup with a class its own stylesheet does not know
        // (`p-confirm-popup-flipped` for `p-confirmpopup-flipped`), so a popup above its target
        // overlaps it by the gutter and keeps the arrow on top. The stylesheet's class goes on too.
        const alignArrow = popup.alignArrow.bind(popup);
        popup.alignArrow = () => {
          alignArrow();
          if (popup.container?.hasAttribute('data-p-confirmpopup-flipped')) {
            popup.container.classList.add('p-confirmpopup-flipped');
          }
        };
        const afterLeave = popup.onAfterLeave.bind(popup);
        popup.onAfterLeave = () => {
          // Focus on a control outside the popup is where an outside click put it: keep it there.
          const active = this.document.activeElement;
          const elsewhere =
            active instanceof HTMLElement &&
            active !== this.document.body &&
            !popup.container?.contains(active)
              ? active
              : null;
          afterLeave();
          this.open.set(false);
          this.lifecycle.left();
          elsewhere?.focus();
        };
      }
    });
  }
}
