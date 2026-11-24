/**
 * One choice of a WeeljackNg choice control. Its `value` is what the control holds when it is
 * picked.
 */
export interface WjOption<T> {
  /** The text the option shows. Rendered as text. */
  label: string;
  /** The value the option stands for. Any type, compared deeply. */
  value: T;
  /** Shows the option greyed out, skips it in keyboard navigation, and announces it as unavailable. */
  disabled?: boolean;
}
