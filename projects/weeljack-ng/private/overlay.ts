import {
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  untracked,
} from '@angular/core';
import type { ButtonProps } from '@openng/optimus-ui/button';
import { Optimus } from '@openng/optimus-ui/config';
import type { Drawer } from '@openng/optimus-ui/drawer';
import { _mergePartAttributes } from './part-attributes';
import { _WJ_EN } from './translation-en';

/*
 * The overlay seam (w1-overlays FR-1). `wj-dialog` uses it first; `wj-drawer`, `wj-sheet` and the
 * wave-4 overlays (confirm dialog, dynamic dialog, popover) read the same helpers instead of
 * re-deriving them: the close-button name, motion that respects reduced motion, focus in on open
 * and back on close, `closed` once per close, and an Escape key that follows `closable`.
 */

/**
 * The motion options every animated overlay part gets (22 Q6). `safe` makes Optimus skip the
 * motion under `prefers-reduced-motion: reduce`. Bind it to `motionOptions` and
 * `maskMotionOptions`: Optimus merges those over a consumer's `pt.motion`, so `pt` cannot switch
 * it off.
 *
 * @docs-private
 */
export const _OVERLAY_MOTION = { safe: true } as const;

/**
 * An overlay's close button as Optimus draws it by default, plus `autofocus: false`. With neither
 * `autofocus` nor `buttonProps.autofocus` set, Optimus 2.0.2 writes `autofocus="true"` on it and
 * the browser focuses it on load. Bind it to `closeButtonProps`.
 *
 * @docs-private
 */
export const _OVERLAY_CLOSE_BUTTON: ButtonProps = {
  severity: 'secondary',
  variant: 'text',
  rounded: true,
  autofocus: false,
};

/**
 * The name of an overlay's close button: the translation's `aria.close` that `provideWeeljack`
 * set, or the English default when it is missing or empty. Read once, when called: the language is
 * not switched at runtime. Must run in an injection context.
 *
 * @docs-private
 */
export function _overlayCloseLabel(): string {
  const aria: unknown = inject(Optimus).getTranslation('aria');
  const label: unknown = Reflect.get(Object(aria), 'close');
  return typeof label === 'string' && label !== '' ? label : _WJ_EN.aria.close;
}

/** Where focus may land, as a CSS selector: what a user can Tab to, minus `tabindex="-1"`. */
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex^="-"])`)
  .join(',');

/**
 * A part of an overlay that focus may move into: an element, an `ElementRef` to one (Optimus's
 * `contentViewChild` and its siblings are those), or nothing while the part is not rendered.
 *
 * @docs-private
 */
export type _OverlayRegion = ElementRef<unknown> | HTMLElement | null | undefined;

function elementOf(region: _OverlayRegion): HTMLElement | null {
  const node: unknown = region instanceof ElementRef ? region.nativeElement : region;
  return typeof HTMLElement !== 'undefined' && node instanceof HTMLElement ? node : null;
}

/** The first control in `region` that is rendered, so one that is `display: none` is skipped. */
function firstFocusable(region: HTMLElement): HTMLElement | undefined {
  return Array.from(region.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
    (control) => control.getClientRects().length > 0,
  );
}

/**
 * Moves focus into an open overlay, in Dialog's order: the first focusable control of each region
 * in turn (pass the body, the footer, then the header). When no region has one, focus goes to
 * `root`, which gets `tabindex="-1"` for it, so focus is never left behind the backdrop. Call it
 * once the overlay has entered; it is a no-op without a `root`.
 *
 * @docs-private
 */
export function _focusIntoOverlay(
  root: HTMLElement | null | undefined,
  regions: readonly _OverlayRegion[],
): void {
  if (!root) {
    return;
  }
  for (const region of regions) {
    const element = elementOf(region);
    const target = element ? firstFocusable(element) : undefined;
    if (target) {
      target.focus();
      return;
    }
  }
  if (!root.hasAttribute('tabindex')) {
    root.setAttribute('tabindex', '-1');
  }
  root.focus();
}

/**
 * What {@link _overlayLifecycle} gives back.
 *
 * @docs-private
 */
export interface _OverlayLifecycle {
  /**
   * Call it from the overlay's "has left" event (Optimus's `onHide`, or a motion `onAfterLeave`).
   * Once per open it returns focus to the opener if that is still in the document, then calls
   * `closed`. Further calls, and calls for a leave that no open preceded, do nothing.
   */
  left(): void;
}

function isFocusTarget(element: Element | null): element is HTMLElement {
  return element !== null && 'focus' in element && typeof element.focus === 'function';
}

/**
 * Remembers the opener and derives "closed once per close" (FR-5, FR-7). When `visible` turns
 * true the element that has focus is kept as the opener (the first one wins until the overlay has
 * left, so a reopen mid-leave keeps the original). {@link _OverlayLifecycle.left} then restores
 * focus and runs `closed`, whatever closed the overlay: a button, Escape, a backdrop or the app
 * setting `visible` to `false`. Focus is restored first, so a `closed` handler can move it
 * elsewhere (the opener may be gone). Must run in an injection context.
 *
 * @docs-private
 */
export function _overlayLifecycle(visible: () => boolean, closed: () => void): _OverlayLifecycle {
  const document = inject(DOCUMENT);
  let open = false;
  let opener: HTMLElement | null = null;

  effect(() => {
    if (visible()) {
      untracked(() => {
        if (!open) {
          open = true;
          const active = document.activeElement;
          opener = isFocusTarget(active) && active !== document.body ? active : null;
        }
      });
    }
  });

  return {
    left: () => {
      if (!open) {
        return;
      }
      open = false;
      if (opener?.isConnected) {
        opener.focus();
      }
      opener = null;
      closed();
    },
  };
}

/**
 * Makes Escape follow `closable` while the overlay is open (FR-2). Optimus Dialog decides at open
 * time whether Escape closes it, and Drawer never asks, so a `closable` that turns false mid-open
 * would not stop it. While `open()` and not `closable()` this swallows Escape before it reaches
 * Optimus's document listener, and nothing else:
 * - a keydown inside the overlay is stopped at the host, after the control that has focus handled
 *   it, so an open select list inside the body still closes first;
 * - a keydown with focus on the page (a click on the backdrop leaves it there) is stopped as it
 *   enters the document.
 *
 * It does not look at stacked overlays: an Escape inside a nested overlay passes the outer host.
 * Listeners exist only in a browser. Must run in an injection context.
 *
 * @docs-private
 */
export function _overlayEscapeGate(open: () => boolean, closable: () => boolean): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);
  const blocked = (event: KeyboardEvent): boolean =>
    event.key === 'Escape' && open() && !closable();

  afterNextRender(() => {
    const inside = (event: KeyboardEvent): void => {
      if (blocked(event)) {
        event.stopPropagation();
      }
    };
    const onPage = (event: KeyboardEvent): void => {
      if (
        blocked(event) &&
        (event.target === document.body || event.target === document.documentElement)
      ) {
        event.stopImmediatePropagation();
      }
    };
    host.addEventListener('keydown', inside);
    document.addEventListener('keydown', onPage, { capture: true });
    destroyRef.onDestroy(() => {
      host.removeEventListener('keydown', inside);
      document.removeEventListener('keydown', onPage, { capture: true });
    });
  });
}

/**
 * The drawer's accessibility pass-through (FR-21): Optimus Drawer renders `role="complementary"`
 * with no name, so the root becomes a modal dialog named by its title part (`titleId`, which the
 * title gets) and, when given, described by `describedBy`. The consumer's `pt` is kept, and these
 * attributes win over theirs. Returns the function form, ready to bind to `[pt]`.
 *
 * @docs-private
 */
export function _drawerPassThrough<C, T extends object>(
  pt: T | ((context: C) => T) | null | undefined,
  titleId: string,
  describedBy: string | undefined,
): (context: C) => T {
  return _mergePartAttributes(_mergePartAttributes(pt, 'title', { id: titleId }), 'root', {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
    'aria-describedby': describedBy,
  });
}

/**
 * Brings an Optimus Drawer in line with `closable` and with the overlay seam (FR-21, FR-2, FR-7).
 * Optimus gives Drawer no way to do these, so this reaches its public members once, when the
 * instance exists:
 * - Drawer's container keydown handler runs `hide(false)` on any Escape, which drops the backdrop
 *   and the scroll lock while the drawer stays open. While not `closable` it is skipped, and
 *   nothing else is: a control inside the body still gets Escape first. `_overlayEscapeGate` keeps
 *   the keydown from reaching Optimus's document listener.
 * - Drawer binds its Escape and backdrop-click listeners when it opens. A `closable` that turns
 *   true while open (a failed save) binds the ones that are missing.
 * - Drawer's `onHide` fires only for a close by the user, but its leave handler runs for every
 *   cause, the app setting `visible` to `false` included, so `left` is called from there.
 *
 * `closable` must also be bound to Drawer's `dismissible` and `closeOnEscape`. Must run in an
 * injection context.
 *
 * @docs-private
 */
export function _overlayDrawer(
  drawer: () => Drawer | undefined,
  visible: () => boolean,
  closable: () => boolean,
  left: () => void,
): void {
  _overlayEscapeGate(visible, closable);
  const patched = new WeakSet<Drawer>();

  effect(() => {
    const inner = drawer();
    if (!inner || patched.has(inner)) {
      return;
    }
    patched.add(inner);
    const keydown = inner.onKeyDown.bind(inner);
    const afterLeave = inner.onAfterLeave.bind(inner);
    inner.onKeyDown = (event) => {
      if (event.code !== 'Escape' || closable()) {
        keydown(event);
      }
    };
    inner.onAfterLeave = () => {
      afterLeave();
      left();
    };
  });

  effect(() => {
    const inner = drawer();
    if (!closable() || !inner) {
      return;
    }
    if (inner.container && !inner.documentEscapeListener) {
      inner.bindDocumentEscapeListener();
    }
    const mask = inner.mask;
    if (mask && !inner.maskClickListener) {
      const onClick = (event: Event): void => {
        if (inner.dismissible) {
          inner.close(event);
        }
      };
      mask.addEventListener('click', onClick);
      inner.maskClickListener = () => {
        mask.removeEventListener('click', onClick);
      };
    }
  });
}
