import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DOCUMENT,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TieredMenu } from '@openng/optimus-ui/tieredmenu';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
} from 'weeljack-ng/private';
import { WjTieredMenuItemSlot } from './tieredmenu-slots';
import type { WjTieredMenuPt } from './tieredmenu-types';

/**
 * Nested commands over Optimus's `p-tieredMenu`, inline or as a popup. Describe it as `WjMenuItem`
 * objects in `model`: an item with `items` opens them as a submenu beside it (in place below it on
 * a narrow screen), a `separator` item draws a line. The list is a `role="menu"`: give it
 * `ariaLabel` or `ariaLabelledBy`. A popup is opened from the app with `toggle(event)` or
 * `show(event)`, aligned to the event's target, and closes on an outside click, Escape, Tab or
 * running an item. With no items, nothing renders.
 */
@Component({
  selector: 'wj-tieredmenu',
  imports: [TieredMenu, NgTemplateOutlet],
  templateUrl: './tieredmenu.html',
  styleUrl: './tieredmenu.css',
})
export class WjTieredMenu {
  /**
   * The items. Replace the array to change the menu: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** Shows the menu as a popup: closed until `toggle` or `show` is called. */
  readonly popup = input(false, { transform: booleanAttribute });
  /** Where a popup renders. `'body'` for a popup inside a container that clips it. */
  readonly appendTo = input<'self' | 'body'>('self');
  /** Accessible name of the list. Set on the `role="menu"` element, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the `role="menu"` element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the list. Set on the `role="menu"` element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the menu's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTieredMenuPt>();
  /** Emits when a popup has opened. */
  readonly opened = output();
  /** Emits when a popup has closed, whatever closed it. */
  readonly closed = output();

  private readonly document = inject(DOCUMENT);
  private opener: HTMLElement | null = null;
  private shown = false;
  protected readonly itemSlot = contentChild(WjTieredMenuItemSlot);
  private readonly menu = viewChild(TieredMenu);
  protected readonly motion = _OVERLAY_MOTION;

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() => _toOptimusMenuModel(this.model()));

  /** `pt` forwarded as given, plus the description routed to the list. */
  protected readonly partAttributes = computed<WjTieredMenuPt>(() =>
    _mergePartAttributes(this.pt(), 'rootList', { 'aria-describedby': this.ariaDescribedBy() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-tieredmenu');
    _checkAriaOnHost('wj-tieredmenu');
  }

  /** Opens a closed popup and closes an open one, aligned to `event.currentTarget`. */
  toggle(event: Event): void {
    this.remember();
    this.menu()?.toggle(event);
  }

  /** Opens the popup, aligned to `event.currentTarget`. */
  show(event: Event): void {
    this.remember();
    this.menu()?.show(event);
  }

  /** Closes the popup. */
  hide(): void {
    this.menu()?.hide();
  }

  /** The element that has focus when a popup opens: where focus goes back to when it closes. */
  private remember(): void {
    if (this.shown) {
      return;
    }
    const active = this.document.activeElement;
    this.opener = active instanceof HTMLElement && active !== this.document.body ? active : null;
  }

  /** A popup has opened. */
  protected entered(): void {
    this.shown = true;
    this.opened.emit();
  }

  /**
   * Optimus says a popup is leaving twice: when `hide` runs, and again once the leave motion has
   * ended. The first is `closed`. The second is where focus is put right: Optimus focuses the
   * element that was clicked, which is not focusable when it is a `wj-button`'s host, and an item
   * that ran puts focus back on the list, so focus ends on the closing list, or on `body` once it
   * is gone. Put it back on the opener. Focus that is somewhere else (Tab moved on, an outside
   * click on another control) stays.
   */
  protected left(): void {
    if (this.shown) {
      this.shown = false;
      this.closed.emit();
      return;
    }
    const { activeElement, body } = this.document;
    const stranded =
      activeElement === null || activeElement === body || activeElement.closest('[role="menu"]');
    if (this.opener?.isConnected && stranded) {
      this.opener.focus();
    }
    this.opener = null;
  }
}
