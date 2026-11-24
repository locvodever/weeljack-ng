import { Component, booleanAttribute, computed, input, output, signal } from '@angular/core';
import { Message } from '@openng/optimus-ui/message';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
} from 'weeljack-ng/private';
import type {
  WjMessagePt,
  WjMessageSeverity,
  WjMessageSize,
  WjMessageVariant,
} from './message-types';

/**
 * An inline message with a severity, over Optimus's `p-message`: the text you project, in a tinted
 * box, optionally closable. `error` and `warn` are announced as alerts, the rest as status
 * messages, but only a message rendered after the page has loaded is announced: render it with
 * `@if` when its condition arises.
 *
 * Say what happened in words: colour is not enough. Closing hides the message for everyone, and
 * `closed` emits once; focus is yours to move in `(closed)`.
 */
@Component({
  selector: 'wj-message',
  imports: [Message],
  templateUrl: './message.html',
  styleUrl: './message.css',
  host: { '[hidden]': 'gone()' },
})
export class WjMessage {
  /** Colour role, and the role it is announced with. */
  readonly severity = input<WjMessageSeverity>('info');
  /** Adds a close button, named from the translation's `aria.close`. */
  readonly closable = input(false, { transform: booleanAttribute });
  /** Size step. */
  readonly size = input<WjMessageSize>();
  /** `outlined` or `simple` fill instead of the tinted one. */
  readonly variant = input<WjMessageVariant>();
  /**
   * Pass-through for the message's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjMessagePt>();
  /** Emits once when the user closes the message. The message then hides itself. */
  readonly closed = output();

  protected readonly motion = _OVERLAY_MOTION;
  /** Set once the leave animation has ended: the host is then `hidden`, out of layout and the a11y tree. */
  protected readonly gone = signal(false);
  private closing = false;

  /**
   * `pt` forwarded as given, plus the role and live region this wrapper routes to the message.
   * Optimus writes a static `role="alert"` and `aria-live="polite"`, which the routed ones replace.
   */
  protected readonly partAttributes = computed<WjMessagePt>(() => {
    const alert = this.severity() === 'error' || this.severity() === 'warn';
    return _mergePartAttributes(this.pt(), 'host', {
      role: alert ? 'alert' : 'status',
      'aria-live': alert ? 'assertive' : 'polite',
    });
  });

  constructor() {
    _checkWeeljackSetup('wj-message');
    _checkAriaOnHost(
      'wj-message',
      'A message has no aria inputs: its role follows the severity, and its text is the projected content',
    );
  }

  /** Optimus emits on every click of the close button, also while it is still leaving. */
  protected close(): void {
    if (!this.closing) {
      this.closing = true;
      this.closed.emit();
    }
  }

  /** Optimus collapses a closed message and keeps it exposed: hide it once its leave has ended. */
  protected hideOnceClosed(event: AnimationEvent): void {
    if (this.closing && event.target === event.currentTarget) {
      this.gone.set(true);
    }
  }
}
