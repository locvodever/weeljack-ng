import { Component, computed, input } from '@angular/core';
import {
  MessageService,
  type PassThroughContext,
  type PassThroughOption,
} from '@openng/optimus-ui/api';
import { Toast } from '@openng/optimus-ui/toast';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WJ_TOAST_MESSAGES } from './toast-service';
import type { WjToastPosition, WjToastPt } from './toast-types';

type Context = PassThroughContext;

/** A part's pass-through as Optimus applies it: the function form called, `null` read as none. */
function settle<E>(option: PassThroughOption<E>, context: Context) {
  return (typeof option === 'function' ? option(context) : option) ?? {};
}

/** The severity of the message a part belongs to. Optimus's context is untyped, so narrow it. */
function severityOf(context: Context): string {
  const message: unknown = Reflect.get(Object(context.instance), 'message');
  const severity: unknown = Reflect.get(Object(message), 'severity');
  return typeof severity === 'string' ? severity : 'info';
}

/**
 * Where the application's messages appear, over Optimus's `p-toast`. Render exactly one in your
 * app shell and show messages from code with `WjToastService`: every `wj-toast` shows every
 * message, and a message shown while none is rendered is not queued. Provide nothing: the host
 * reads the same message source as the service.
 *
 * Each message is announced as it appears, and closes after its `life`. Showing one never moves
 * focus.
 */
@Component({
  selector: 'wj-toast',
  imports: [Toast],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  // The host connects to the service (W1-display 4.4): Optimus's toast injects `MessageService`,
  // and gets the instance `WjToastService` writes to.
  providers: [{ provide: MessageService, useExisting: WJ_TOAST_MESSAGES }],
})
export class WjToast {
  /** Where the messages stack in the viewport. */
  readonly position = input<WjToastPosition>('top-right');
  /**
   * Pass-through for the toast's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjToastPt>();

  /**
   * `pt` forwarded as given, plus the attributes this wrapper sets: no `autofocus` on the close
   * button, `data-wj-severity` on each message, and the summary and detail hooks the harness reads.
   * Optimus hands the toast's `pt` to its messages as an object only (a top-level function is
   * called for the toast itself, never for a message), so every part is a function that settles
   * the consumer's `pt` for the context it is given.
   */
  protected readonly partAttributes = computed<WjToastPt>(() => {
    const pt = this.pt();
    const base = _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(pt, 'closeButton', { autofocus: null }),
        'summary',
        { 'data-wj-summary': '' },
      ),
      'detail',
      { 'data-wj-detail': '' },
    );
    return {
      ...(typeof pt === 'object' ? pt : null),
      host: (context) => settle(base(context).host, context),
      root: (context) => settle(base(context).root, context),
      message: (context) =>
        settle(
          _mergePartAttributes(base, 'message', { 'data-wj-severity': severityOf(context) })(
            context,
          ).message,
          context,
        ),
      messageContent: (context) => settle(base(context).messageContent, context),
      messageIcon: (context) => settle(base(context).messageIcon, context),
      messageText: (context) => settle(base(context).messageText, context),
      summary: (context) => settle(base(context).summary, context),
      detail: (context) => settle(base(context).detail, context),
      closeButton: (context) => settle(base(context).closeButton, context),
      closeIcon: (context) => settle(base(context).closeIcon, context),
    };
  });

  constructor() {
    _checkWeeljackSetup('wj-toast');
    _checkAriaOnHost('wj-toast');
  }
}
