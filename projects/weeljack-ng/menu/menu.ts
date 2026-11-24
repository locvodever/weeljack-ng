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
import { Menu } from '@openng/optimus-ui/menu';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
} from 'weeljack-ng/private';
import { WjMenuItemSlot } from './menu-slots';
import type { WjMenuPt } from './menu-types';

/**
 * A list of commands or links over Optimus's `p-menu`, inline or as a popup. Describe it as
 * `WjMenuItem` objects in `model`: a top-level item with `items` is a group header, a `separator`
 * item draws a line. Once any top-level item has `items`, every top-level item is a group or a
 * separator. The list is a `role="menu"`: give it `ariaLabel` or `ariaLabelledBy`. A popup is
 * opened from the app with `toggle(event)` or `show(event)`, aligned to the event's target, and
 * closes on an outside click, Escape, Tab or running an item. With no items, nothing renders.
 */
@Component({
  selector: 'wj-menu',
  imports: [Menu, NgTemplateOutlet],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class WjMenu {
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
  readonly pt = input<WjMenuPt>();
  /** Emits when a popup has opened. */
  readonly opened = output();
  /** Emits when a popup has closed, whatever closed it. */
  readonly closed = output();

  private readonly document = inject(DOCUMENT);
  private opener: HTMLElement | null = null;
  protected readonly itemSlot = contentChild(WjMenuItemSlot);
  private readonly menu = viewChild(Menu);
  protected readonly motion = _OVERLAY_MOTION;

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() => _toOptimusMenuModel(this.model()));

  /** `pt` forwarded as given, plus the description routed to the list. */
  protected readonly partAttributes = computed<WjMenuPt>(() =>
    _mergePartAttributes(this.pt(), 'list', { 'aria-describedby': this.ariaDescribedBy() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-menu');
    _checkAriaOnHost('wj-menu');
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
    const active = this.document.activeElement;
    this.opener = active instanceof HTMLElement && active !== this.document.body ? active : null;
  }

  /**
   * A popup has left. Optimus focuses the element that was clicked, which is not focusable when it
   * is a `wj-button`'s host, so focus ends on the closing list, or on `body` once that is gone: put
   * it back on the opener. Focus that is somewhere else (Tab moved on, an outside click) stays.
   */
  protected left(): void {
    const { activeElement, body } = this.document;
    const stranded =
      activeElement === null || activeElement === body || activeElement.closest('[role="menu"]');
    if (this.opener?.isConnected && stranded) {
      this.opener.focus();
    }
    this.opener = null;
    this.closed.emit();
  }
}
