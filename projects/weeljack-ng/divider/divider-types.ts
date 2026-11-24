import type { DividerPassThrough } from '@openng/optimus-ui/types/divider';

/**
 * Pass-through for `wj-divider`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjDividerPt = DividerPassThrough;

/** The direction a `wj-divider` runs. Optimus calls it `layout`. */
export type WjDividerOrientation = 'horizontal' | 'vertical';

/**
 * Where the content sits on the line: `'left'`, `'center'` and `'right'` on a horizontal divider,
 * `'top'`, `'center'` and `'bottom'` on a vertical one.
 */
export type WjDividerAlign = 'left' | 'center' | 'right' | 'top' | 'bottom';
