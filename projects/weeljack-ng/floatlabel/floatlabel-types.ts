import type { FloatLabelPassThrough } from '@openng/optimus-ui/types/floatlabel';

/**
 * Where a `wj-floatlabel`'s label goes once it floats: `over` above the control's box (the
 * default), `in` inside the control's top (the control grows taller to make room), `on` on the
 * control's top border.
 */
export type WjFloatLabelVariant = 'in' | 'over' | 'on';

/**
 * Pass-through for `wj-floatlabel`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
 * to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjFloatLabelPt = FloatLabelPassThrough;
