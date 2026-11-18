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
import { ContextMenu } from '@openng/optimus-ui/contextmenu';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
} from 'weeljack-ng/private';
import { WjContextMenuItemSlot } from './contextmenu-slots';
import type { WjContextMenuPt } from './contextmenu-types';

/**
 * A menu that opens at the pointer over Optimus's `p-contextMenu`, when `target` is right-clicked
 * (or its context-menu key or Shift+F10 is pressed), or anywhere on the page with `global`. Describe
 * it as `WjMenuItem` objects in `model`: an item with `items` opens them as a submenu beside it, a
 * `separator` item draws a line. The list is a `role="menu"`: give it `ariaLabel` or
 * `ariaLabelledBy`. The menu renders in `body`, closes on an outside click, Escape, Tab or running
 * an item, and gives focus back to where it was. With no items, nothing renders and the browser's
 * own menu appears.
 */
@Component({
  selector: 'wj-contextmenu',
  imports: [ContextMenu, NgTemplateOutlet],
  templateUrl: './contextmenu.html',
  styleUrl: './contextmenu.css',
})
export class WjContextMenu {
  /**
   * The items. Replace the array to change the menu: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /**
   * The element whose right-click opens the menu: a template reference such as `#region`. Give it
   * when the menu is created. Make it focusable and named so the keyboard reaches it.
   */
  readonly target = input<HTMLElement>();
  /**
   * The whole page is the target, and the menu replaces the browser's own on every right-click.
   * Read once, when the menu is created.
   */
  readonly global = input(false, { transform: booleanAttribute });
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
  readonly pt = input<WjContextMenuPt>();
  /** Emits when the menu has opened. */
  readonly opened = output();
  /** Emits once when the menu has closed, whatever closed it. */
  readonly closed = output();

  private readonly document = inject(DOCUMENT);
  private opener: HTMLElement | null = null;
  private shown = false;
  protected readonly itemSlot = contentChild(WjContextMenuItemSlot);
  private readonly menu = viewChild(ContextMenu);
  protected readonly motion = _OVERLAY_MOTION;

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() => _toOptimusMenuModel(this.model()));

  /**
   * `pt` forwarded as given, plus the description routed to the list. Optimus 2.0.2 puts
   * `aria-level` on every `role="menuitem"`, which ARIA does not allow there (axe
   * `aria-allowed-attr`), so that attribute is cleared on every item.
   */
  protected readonly partAttributes = computed<WjContextMenuPt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'rootList', { 'aria-describedby': this.ariaDescribedBy() }),
      'item',
      { 'aria-level': undefined },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-contextmenu');
    _checkAriaOnHost('wj-contextmenu');
  }

  /** Opens the menu at the position of a pointer event. It does nothing while there are no items. */
  show(event: MouseEvent): void {
    this.menu()?.show(event);
  }

  /** Closes the menu. */
  hide(): void {
    this.menu()?.hide();
  }

  /** The menu has opened: remember the element that has focus, where focus goes back to. */
  protected entered(): void {
    if (this.shown) {
      return;
    }
    this.shown = true;
    const active = this.document.activeElement;
    this.opener = active instanceof HTMLElement && active !== this.document.body ? active : null;
    this.opened.emit();
  }

  /**
   * The menu closes, once: Optimus says `onHide` again for a second outside click or a resize.
   * Optimus never restores focus, and it is on the closing list: put it back on the opener. Focus
   * that is somewhere else already (an item's command moved it, a click on another control) stays.
   */
  protected left(): void {
    if (!this.shown) {
      return;
    }
    this.shown = false;
    this.closed.emit();
    const { activeElement, body } = this.document;
    if (
      this.opener?.isConnected &&
      (activeElement === null || activeElement === body || activeElement.closest('[role="menu"]'))
    ) {
      this.opener.focus();
    }
    this.opener = null;
  }
}
