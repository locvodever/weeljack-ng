import type { ToastPassThrough } from '@openng/optimus-ui/types/toast';

/** Colour role of a message. Left unset, a message shows as `info`. */
export type WjToastSeverity = 'success' | 'info' | 'warn' | 'error';

/**
 * A message for `WjToastService.show`. Only these four fields are used.
 *
 * A `type` alias, not an `interface`: the API generator documents type aliases only.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjToastMessage = {
  /** Colour role. Unset shows as `info`. */
  severity?: WjToastSeverity;
  /** Short title of the message. Say what happened in words: colour and icon are not enough. */
  summary?: string;
  /** Longer text under the summary. */
  detail?: string;
  /** How long the message stays, in milliseconds. Unset falls back to 3000. */
  life?: number;
};

/** Where `wj-toast` stacks its messages in the viewport. */
export type WjToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

/**
 * Pass-through for `wj-toast`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjToastPt = ToastPassThrough;
