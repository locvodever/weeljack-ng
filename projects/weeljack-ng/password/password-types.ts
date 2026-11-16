import type { PasswordPassThrough } from '@openng/optimus-ui/types/password';

/** Height step of a `wj-password`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjPasswordSize = 'small' | 'large';

/**
 * Pass-through for `wj-password`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjPasswordPt = PasswordPassThrough;
