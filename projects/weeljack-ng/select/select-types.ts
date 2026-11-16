import type { SelectPassThrough } from '@openng/optimus-ui/types/select';

/** One choice of a `wj-select`. Its `value` is what the select's `value` holds when it is picked. */
export interface WjSelectOption<T> {
  /** The text the option and the closed select show. Rendered as text. */
  label: string;
  /** The value the option stands for. Any type, compared deeply. */
  value: T;
  /** Shows the option greyed out and skips it in keyboard navigation. */
  disabled?: boolean;
}

/** Height step of a `wj-select`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjSelectSize = 'small' | 'large';

/**
 * Pass-through for `wj-select`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjSelectPt = SelectPassThrough;
