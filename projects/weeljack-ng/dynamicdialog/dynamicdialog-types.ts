import type { DialogPassThrough } from '@openng/optimus-ui/dialog';

/**
 * Pass-through for the dynamic dialog's parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this service's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjDynamicDialogPt = DialogPassThrough;

/**
 * What `WjDialogService.open` takes besides the component.
 *
 * A `type` alias, not an `interface`: the API generator documents type aliases only.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjDynamicDialogConfig<D = unknown> = {
  /** The title. It names the dialog (`aria-labelledby`). Rendered as text, never as HTML. */
  header: string;
  /** Handed to the component as `ref.data`. */
  data?: D;
  /**
   * Whether the user can close the dialog: the close button and Escape. Default `true`. Fixed for
   * the dialog's life; the component can still close itself with `ref.close()`.
   */
  closable?: boolean;
  /** Pass-through for the dialog's parts. Tracks Optimus; see {@link WjDynamicDialogPt}. */
  pt?: WjDynamicDialogPt;
};
