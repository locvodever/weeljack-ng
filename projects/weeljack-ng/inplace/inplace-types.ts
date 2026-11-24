import type { InplacePassThrough } from '@openng/optimus-ui/types/inplace';

/**
 * Pass-through for `wj-inplace`'s parts, including the close button as `pcButton`. Tracks Optimus:
 * its part names and attributes follow the installed `@openng/optimus-ui` minor and are outside
 * this component's stable API; changes to them ship only in the release that takes a new Optimus
 * minor and are not breaking.
 */
export type WjInplacePt = InplacePassThrough;

/** What a `wjInplaceContent` template sees. `let-close="close"` is the function that switches back. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjInplaceContentContext = {
  /** Switches back to the display and returns focus to it. Does nothing while `disabled`. */
  close: () => void;
};
