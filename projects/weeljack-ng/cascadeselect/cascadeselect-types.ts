import type { CascadeSelectPassThrough } from '@openng/optimus-ui/types/cascadeselect';
import type { WjOption } from 'weeljack-ng';

/**
 * A group of a `wj-cascadeselect`: a row that opens the next level instead of being picked. Its
 * `children` are more groups, or options.
 */
export interface WjCascadeSelectGroup<T> {
  /** The group's text. Rendered as text. */
  label: string;
  /** What opens when the group is chosen: more groups, or options. */
  children: WjCascadeSelectOption<T>[];
  /** Shows the group greyed out, and it cannot be opened. */
  disabled?: boolean;
}

/**
 * One row of a `wj-cascadeselect`: a leaf (a `WjOption<T>`, the only kind that can be picked) or a
 * group. A leaf must not carry a `children` key.
 */
export type WjCascadeSelectOption<T> = WjOption<T> | WjCascadeSelectGroup<T>;

/** Height step of a `wj-cascadeselect`: 44 px by default, 36 px `small`, 52 px `large`. */
export type WjCascadeSelectSize = 'small' | 'large';

/**
 * Pass-through for `wj-cascadeselect`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjCascadeSelectPt = CascadeSelectPassThrough;
