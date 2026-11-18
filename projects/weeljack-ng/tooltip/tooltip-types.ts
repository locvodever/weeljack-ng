import type { TooltipPassThrough } from '@openng/optimus-ui/types/tooltip';

/**
 * Where the bubble appears: Optimus's `right` by default. A side with no room in the viewport
 * falls back to another.
 */
export type WjTooltipPosition = 'right' | 'left' | 'top' | 'bottom';

/**
 * Pass-through for `[wjTooltip]`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this directive's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTooltipPt = TooltipPassThrough;
