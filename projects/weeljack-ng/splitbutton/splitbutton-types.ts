import type { SplitButtonPassThrough } from '@openng/optimus-ui/types/splitbutton';

/** Height step of a `wj-splitbutton`, both buttons: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjSplitButtonSize = 'small' | 'large';

/** Fill of a `wj-splitbutton`: solid by default, or `outlined` or `text`. */
export type WjSplitButtonVariant = 'outlined' | 'text';

/** Colour role of a `wj-splitbutton`. Left unset, it takes the primary (ink) look. */
export type WjSplitButtonSeverity =
  'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';

/**
 * Pass-through for `wj-splitbutton`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSplitButtonPt = SplitButtonPassThrough;
