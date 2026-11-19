import type { ButtonPassThrough } from '@openng/optimus-ui/button';

/** Height step of a `wj-button`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjButtonSize = 'small' | 'large';

/** Fill of a `wj-button`: solid by default, or `outlined` or `text`. */
export type WjButtonVariant = 'outlined' | 'text';

/** Colour role of a `wj-button`. Left unset, the button takes the primary (ink) look. */
export type WjButtonSeverity =
  'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';

/** Native `type` of the button element. A button never submits a form unless it says `submit`. */
export type WjButtonType = 'button' | 'submit' | 'reset';

/** Kind of popup a `wj-button` opens, written as `aria-haspopup`. */
export type WjButtonAriaHasPopup = 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

/**
 * Pass-through for `wj-button`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjButtonPt = ButtonPassThrough;
