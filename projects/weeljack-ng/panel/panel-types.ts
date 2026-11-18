import type { PanelPassThrough } from '@openng/optimus-ui/panel';

/**
 * Pass-through for `wj-panel`'s parts, including the nested toggle button as `pcToggleButton`.
 * Tracks Optimus: its part names and attributes follow the installed `@openng/optimus-ui` minor
 * and are outside this component's stable API; changes to them ship only in the release that
 * takes a new Optimus minor and are not breaking.
 */
export type WjPanelPt = PanelPassThrough;
