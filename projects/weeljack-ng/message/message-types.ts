import type { MessagePassThrough } from '@openng/optimus-ui/types/message';

/**
 * Colour role of a `wj-message`. Left unset, a message shows as `info`. `error` and `warn` are
 * announced as alerts, the rest as status messages.
 */
export type WjMessageSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

/** Size step of a `wj-message`: `small` for dense layouts, `large` for a page-level message. */
export type WjMessageSize = 'small' | 'large';

/** Fill of a `wj-message`: tinted with an edge by default, `outlined` (an edge, no fill) or `simple`. */
export type WjMessageVariant = 'outlined' | 'simple';

/**
 * Pass-through for `wj-message`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjMessagePt = MessagePassThrough;
