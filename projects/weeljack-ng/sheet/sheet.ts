import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DOCUMENT,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Dialog } from '@openng/optimus-ui/dialog';
import { Drawer, type DrawerPassThrough } from '@openng/optimus-ui/drawer';
import {
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _drawerPassThrough,
  _focusIntoOverlay,
  _overlayCloseLabel,
  _overlayDrawer,
  _overlayLifecycle,
  _wjId,
  type _OverlayRegion,
} from 'weeljack-ng/private';
import { WJ_SHEET_WIDE } from './sheet-wide';

/** The motion of an overlay that replaces the other one while the sheet is open: no enter. */
const SWAP_MOTION = { ..._OVERLAY_MOTION, disabled: true } as const;

/**
 * A modal sheet that is a centred dialog on wide screens and a bottom drawer on narrow ones, from
 * one body: bind `[(visible)]`, give it a `header` that names it, put the body in the content and
 * the actions in elements marked `wjSheetFooter`, which sit below the scrolling body. Which one it
 * is follows the app-wide `WJ_SHEET_WIDE` token, read from `data-wj-mode` on the host.
 *
 * Both modes are modal, block the page behind from scrolling, move focus in (the first control of
 * the body, else the footer, else the close button) and back to the element that opened them, and
 * close with Escape or the close button, which is named from the translation (`aria.close`). The
 * drawer also closes on the backdrop; the dialog never does. `closable` set to `false`, even while
 * open, removes every one of those paths: bind it to a busy flag.
 *
 * The body is not destroyed when the mode changes while the sheet is open, so what the user typed
 * stays; the other mode replaces the first at once, without motion.
 */
@Component({
  selector: 'wj-sheet',
  imports: [Dialog, Drawer, NgTemplateOutlet],
  templateUrl: './sheet.html',
  styleUrl: './sheet.css',
  host: { '[attr.data-wj-mode]': 'wide() ? "dialog" : "drawer"' },
})
export class WjSheet {
  /** Whether the sheet is open. Two-way: `[(visible)]`. */
  readonly visible = model(false);
  /** The title. It names the sheet (`aria-labelledby`). Rendered as text, never as HTML. */
  readonly header = input.required<string>();
  /**
   * Whether the user can close the sheet: the close button, Escape and, in drawer mode, the
   * backdrop. Turn it off while the app is busy; it takes effect at once, also while open.
   */
  readonly closable = input(true, { transform: booleanAttribute });
  /** Emits once each time the sheet has closed, whatever closed it, after it is gone. */
  readonly closed = output();

  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild(Dialog);
  private readonly drawer = viewChild(Drawer);
  private readonly swapping = signal(false);
  private refocus: HTMLElement | null = null;
  protected readonly wide = inject(WJ_SHEET_WIDE);
  private shownWide = this.wide();
  protected readonly motion = computed(() => (this.swapping() ? SWAP_MOTION : _OVERLAY_MOTION));
  protected readonly closeLabel = _overlayCloseLabel();
  protected readonly closeButtonProps = _OVERLAY_CLOSE_BUTTON;
  protected readonly lifecycle = _overlayLifecycle(this.visible, () => {
    this.closed.emit();
  });
  protected readonly drawerPt: DrawerPassThrough = _drawerPassThrough(
    undefined,
    _wjId('sheet-title'),
    undefined,
  );

  constructor() {
    _checkWeeljackSetup('wj-sheet');
    _checkAriaOnHost('wj-sheet', 'The header names the sheet; remove the attribute');
    // Escape follows `closable` in both modes: the gate this holds is for the dialog's too.
    _overlayDrawer(this.drawer, this.visible, this.closable, () => {
      this.lifecycle.left();
    });

    // Optimus binds the dialog's Escape listener when it opens, and only if `closable` is true
    // then: bind it when `closable` turns true mid-open (a failed save).
    effect(() => {
      const dialog = this.dialog();
      if (this.closable() && dialog?.container() && !dialog.documentEscapeListener) {
        dialog.bindDocumentEscapeListener();
      }
    });

    // A mode change while open swaps the overlay. This runs before the template does: the next
    // overlay is made without an enter, and what had focus is remembered to be given it back.
    effect(() => {
      const wide = this.wide();
      untracked(() => {
        if (wide === this.shownWide) {
          return;
        }
        this.shownWide = wide;
        if (this.visible()) {
          this.swapping.set(true);
          const active = this.document.activeElement;
          this.refocus =
            active instanceof HTMLElement && active !== this.document.body ? active : null;
        }
      });
    });
  }

  /** Optimus has opened the dialog. */
  protected dialogEntered(): void {
    const dialog = this.dialog();
    this.entered(dialog?.container(), [
      dialog?.contentViewChild,
      dialog?.footerViewChild,
      dialog?.headerViewChild,
    ]);
  }

  /** Optimus has opened the drawer. */
  protected drawerEntered(): void {
    const container = this.drawer()?.container;
    this.entered(container, [
      container?.querySelector<HTMLElement>('[data-pc-section="content"]'),
      container?.querySelector<HTMLElement>('[data-pc-section="footer"]'),
      container?.querySelector<HTMLElement>('[data-pc-section="header"]'),
    ]);
  }

  /** Focus goes back to the control that had it before a mode change, else in by FR-5's order. */
  private entered(root: HTMLElement | null | undefined, regions: readonly _OverlayRegion[]): void {
    this.swapping.set(false);
    const back = this.refocus;
    this.refocus = null;
    if (back?.isConnected && root?.contains(back)) {
      back.focus();
    } else {
      _focusIntoOverlay(root, regions);
    }
  }
}
