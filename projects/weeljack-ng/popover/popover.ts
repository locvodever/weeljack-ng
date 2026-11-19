import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  output,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { FocusTrap } from '@openng/optimus-ui/focustrap';
import { Popover } from '@openng/optimus-ui/popover';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _focusIntoOverlay,
  _mergePartAttributes,
  _overlayEscapeGate,
  _overlayLifecycle,
  _warnOnce,
} from 'weeljack-ng/private';
import type { WjPopoverPt } from './popover-types';

const WJ0152 = 'WJ0152';

/**
 * A small non-modal dialog anchored to the element that opened it, over Optimus's `p-popover`.
 * Open it from the trigger's click: `<wj-button label="Details" (click)="popover.toggle($event)" />`
 * with `<wj-popover #popover ariaLabel="Details">...</wj-popover>`. The content is yours.
 *
 * Name it with `ariaLabel` or `ariaLabelledBy`: it is a dialog. Focus moves in when it opens (to
 * the first control, else to the panel), Tab stays inside while it holds a control, and focus
 * returns to the trigger on Escape, on a click outside that lands on nothing focusable, or on
 * `hide()`. Escape closes the topmost overlay only.
 */
@Component({
  selector: 'wj-popover',
  imports: [Popover, FocusTrap],
  templateUrl: './popover.html',
  styleUrl: './popover.css',
})
export class WjPopover {
  /** The panel's accessible name, as text. Set this or `ariaLabelledBy`. */
  readonly ariaLabel = input<string>();
  /** The id of the element inside the panel that names it, as text. Set this or `ariaLabel`. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the popover's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjPopoverPt>();
  /** Emits once the panel is open and focus has moved in. */
  readonly opened = output();
  /** Emits once per close, whatever closed it: Escape, an outside click, `hide()` or a scroll. */
  readonly closed = output();

  private readonly inner = viewChild(Popover);
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private anchor: unknown = null;
  private keep: HTMLElement | null = null;
  protected readonly motion = _OVERLAY_MOTION;
  /** Whether the panel is open: set when it enters, cleared when it has left. */
  protected readonly open = signal(false);
  /** Tab is trapped only while the panel holds a control: with none there is nothing to cycle. */
  protected readonly trapped = signal(true);

  /**
   * `pt` forwarded as given, plus the attributes this wrapper sets on the panel: a `data-wj-popover`
   * hook for the harness, and no `aria-modal` (Optimus sets it on a panel that has no backdrop).
   * A routed value wins over the consumer's.
   */
  protected readonly partAttributes = computed<WjPopoverPt>(() =>
    _mergePartAttributes(this.pt(), 'root', {
      'data-wj-popover': '',
      'aria-modal': undefined,
    }),
  );

  /** Returns focus to the trigger once the panel has left, for every cause. */
  private readonly lifecycle = _overlayLifecycle(
    this.open,
    () => {
      this.closed.emit();
    },
    () => this.keep ?? this.anchor,
  );

  constructor() {
    _checkWeeljackSetup('wj-popover');
    _checkAriaOnHost('wj-popover', 'Use the ariaLabel or ariaLabelledBy input');
    // It has no `closable` of its own: it joins the overlay stack, so Escape reaches it, and any
    // overlay opened above it, in turn.
    _overlayEscapeGate(this.open, () => true);
  }

  /**
   * Opens the panel beside `target`, or closes it when it is open. `target` defaults to the
   * event's current target.
   */
  toggle(event: Event, target?: HTMLElement): void {
    this.anchor = target ?? event.currentTarget ?? event.target;
    this.inner()?.toggle(event, target);
  }

  /** Opens the panel beside `target`, which defaults to the event's current target. */
  show(event: Event, target?: HTMLElement): void {
    this.anchor = target ?? event.currentTarget ?? event.target;
    this.inner()?.show(event, target);
  }

  /** Closes the panel. */
  hide(): void {
    this.inner()?.hide();
  }

  /** The panel has entered: focus moves in, to the first control or else to the panel. */
  protected shown(): void {
    this.open.set(true);
    this.trapped.set(true);
    const panel = this.inner()?.container;
    _focusIntoOverlay(panel, [this.body()]);
    this.trapped.set(this.document.activeElement !== panel);
    if (ngDevMode && !this.ariaLabel() && !this.ariaLabelledBy()) {
      runInInjectionContext(this.injector, () => {
        _warnOnce(
          WJ0152,
          'wj-popover',
          'the popover opened with no name, so a screen reader announces an unnamed dialog',
          'Set ariaLabel or ariaLabelledBy',
        );
      });
    }
    this.opened.emit();
  }

  /**
   * The panel has left, still in the page. Focus on a control outside it is where an outside click
   * put it: that stays. Anything else (inside the panel, or nowhere) goes back to the trigger.
   */
  protected hidden(): void {
    const active = this.document.activeElement;
    this.keep =
      active instanceof HTMLElement &&
      active !== this.document.body &&
      !this.inner()?.container?.contains(active)
        ? active
        : null;
    this.open.set(false);
    this.lifecycle.left();
    this.keep = null;
  }
}
