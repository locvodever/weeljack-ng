import { NgTemplateOutlet } from '@angular/common';
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
import { Drawer } from '@openng/optimus-ui/drawer';
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
} from 'weeljack-ng/private';
import { WjDrawerFooterSlot } from './drawer-footer';
import type { WjDrawerPosition, WjDrawerPt } from './drawer-types';

/**
 * A modal drawer over Optimus's `p-drawer`: bind `[(visible)]`, give it a `header` and a
 * `position`, and put the body in the content and the actions in a `wjDrawerFooter` template. The
 * header names the drawer. Focus moves in when it opens (the first control of the body, else the
 * footer, else the close button) and returns to the element that opened it; Tab stays inside, the
 * page behind does not scroll, and Escape, the close button or a click on the backdrop closes it.
 *
 * `closable` set to `false`, even while the drawer is open, removes the close button and stops
 * Escape and the backdrop: bind it to a busy flag. The close button is named from the translation
 * (`aria.close`). Left and right drawers are 20rem wide and never wider than the viewport minus
 * 3rem; top and bottom drawers are as tall as their content, up to 90% of the viewport height.
 */
@Component({
  selector: 'wj-drawer',
  imports: [Drawer, NgTemplateOutlet],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class WjDrawer {
  /** Whether the drawer is open. Two-way: `[(visible)]`. */
  readonly visible = model(false);
  /** The title. It names the drawer (`aria-labelledby`). Rendered as text, never as HTML. */
  readonly header = input.required<string>();
  /** The edge the drawer opens from. */
  readonly position = input<WjDrawerPosition>('left');
  /**
   * Whether the user can close the drawer: the close button, Escape and a click on the backdrop.
   * Turn it off while the app is busy; it takes effect at once, also while the drawer is open.
   */
  readonly closable = input(true, { transform: booleanAttribute });
  /** Id of the element that describes the drawer. Set on the drawer element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the drawer's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjDrawerPt>();
  /** Emits once each time the drawer has opened. */
  readonly opened = output();
  /** Emits once each time the drawer has closed, whatever closed it, after it is gone. */
  readonly closed = output();

  private readonly inner = viewChild(Drawer);
  protected readonly footer = contentChild(WjDrawerFooterSlot);
  protected readonly motion = _OVERLAY_MOTION;
  protected readonly closeLabel = _overlayCloseLabel();
  protected readonly closeButtonProps = _OVERLAY_CLOSE_BUTTON;
  private readonly titleId = _wjId('drawer-title');
  private readonly lifecycle = _overlayLifecycle(this.visible, () => {
    this.closed.emit();
  });

  /** `pt` forwarded as given, plus the dialog role, the title's name and the description. */
  protected readonly partAttributes = computed<WjDrawerPt>(() =>
    _drawerPassThrough(this.pt(), this.titleId, this.ariaDescribedBy()),
  );

  constructor() {
    _checkWeeljackSetup('wj-drawer');
    _checkAriaOnHost('wj-drawer', 'Use the ariaDescribedBy input; the header names the drawer');
    _overlayDrawer(this.inner, this.visible, this.closable, () => {
      this.lifecycle.left();
    });

    // Optimus reads the bridged footer from a content query into a plain property, and its OnPush
    // view does not notice that the property changed: a footer slot that appears or goes while
    // the drawer is open needs the nudge.
    effect(() => {
      this.footer();
      this.inner()?.cd.markForCheck();
    });
  }

  /** Optimus has opened the drawer: move focus in, then say so. */
  protected entered(): void {
    const container = this.inner()?.container;
    _focusIntoOverlay(container, [
      container?.querySelector<HTMLElement>('[data-pc-section="content"]'),
      container?.querySelector<HTMLElement>('[data-pc-section="footer"]'),
      container?.querySelector<HTMLElement>('[data-pc-section="header"]'),
    ]);
    this.opened.emit();
  }
}
