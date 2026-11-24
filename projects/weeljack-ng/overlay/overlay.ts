import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  model,
  output,
  runInInjectionContext,
} from '@angular/core';
import type { OverlayListenerOptions } from '@openng/optimus-ui/api';
import { Overlay } from '@openng/optimus-ui/overlay';
import {
  _OVERLAY_MOTION,
  _checkWeeljackSetup,
  _overlayEscapeGate,
  _overlayLifecycle,
  _warnOnce,
} from 'weeljack-ng/private';
import type { WjOverlayPt } from './overlay-types';

const WJ0154 = 'WJ0154';

/**
 * A panel anchored to the element before it (or to `target`), for building your own dropdowns:
 * `<button (click)="open.set(!open())">Menu</button><wj-overlay [(visible)]="open">...</wj-overlay>`.
 * The panel renders inside this element, right after the trigger, so Tab moves from the trigger
 * into it. It has no role of its own: its content decides what it is. Focus stays on the trigger
 * when it opens and returns there when it closes, except after a click on another control. It joins
 * the overlay stack: Escape closes it only while it is the top overlay, so a dialog, popover or
 * another overlay opened above it closes first.
 */
@Component({
  selector: 'wj-overlay',
  imports: [Overlay],
  templateUrl: './overlay.html',
  styleUrl: './overlay.css',
})
export class WjOverlay {
  /** Whether the panel is open. Two-way: it follows Escape, an outside click, scroll and resize. */
  readonly visible = model(false);
  /** The element the panel is anchored to. Defaults to the element just before `wj-overlay`. */
  readonly target = input<HTMLElement>();
  /**
   * Pass-through for the overlay's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjOverlayPt>();
  /** Emits once each time the panel opens. */
  readonly opened = output();
  /** Emits once per close, whatever closed it: Escape, an outside click, scroll or `visible`. */
  readonly closed = output();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private keep: HTMLElement | null = null;
  protected readonly motion = _OVERLAY_MOTION;

  /**
   * The target, read from the DOM each time the panel opens: Optimus resolves its own `@prev` from
   * inside this host, where nothing precedes it.
   */
  private readonly anchor = computed(() => {
    this.visible();
    return this.target() ?? this.host.previousElementSibling;
  });
  // type-escape: Optimus types `target` as a selector string but resolves an Element as well
  protected readonly overlayTarget = computed(() => this.anchor() as unknown as string);

  /** Returns focus to the target once the panel has left, and says `closed`, for every cause. */
  private readonly lifecycle = _overlayLifecycle(
    this.visible,
    () => {
      this.closed.emit();
    },
    () => this.keep ?? this.anchor(),
  );

  /** Whether this panel is the top of the overlay stack (it has no `closable` of its own). */
  private readonly onTop = _overlayEscapeGate(this.visible, () => true);

  /**
   * Optimus's `listener` hook, asked before each scroll, outside click, resize and keydown. It keeps
   * Optimus's own `valid`, and lets Escape through only while this panel is the top overlay.
   */
  protected readonly listener = (event: Event, options?: OverlayListenerOptions): boolean =>
    Boolean(options?.valid) && (event.type !== 'keydown' || this.onTop());

  constructor() {
    _checkWeeljackSetup('wj-overlay');
  }

  /**
   * The panel is opening, before Optimus places it. Optimus puts it at the target's height below
   * the top-left of its containing block, which is right when that block starts at the target;
   * here it is this host, after the target, so the host moves onto the target first.
   */
  protected shown(): void {
    const target = this.anchor();
    if (target) {
      // Left-to-right only: a right-to-left page needs the inline-end corner.
      this.host.style.top = this.host.style.left = '';
      const from = this.host.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      this.host.style.top = `${String(to.top - from.top)}px`;
      this.host.style.left = `${String(to.left - from.left)}px`;
    } else if (ngDevMode) {
      runInInjectionContext(this.injector, () => {
        _warnOnce(
          WJ0154,
          'wj-overlay',
          'the overlay opened with no target, so it has nothing to anchor to',
          'Put it right after the element it opens from, or set the target input',
        );
      });
    }
    this.opened.emit();
  }

  /**
   * The panel has left. Focus on a control outside this host is where an outside click put it:
   * that stays. Anything else goes back to the target.
   */
  protected left(): void {
    const active = this.document.activeElement;
    this.keep =
      active instanceof HTMLElement && active !== this.document.body && !this.host.contains(active)
        ? active
        : null;
    this.lifecycle.left();
    this.keep = null;
  }
}
