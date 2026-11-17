import type { TimelinePassThrough } from '@openng/optimus-ui/timeline';

/**
 * Pass-through for `wj-timeline`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTimelinePt = TimelinePassThrough;

/**
 * Where the line sits against the content: `'left'` and `'right'` (and `'alternate'`, which
 * switches sides event by event) for a vertical timeline, `'top'` and `'bottom'` for a horizontal
 * one.
 */
export type WjTimelineAlign = 'left' | 'right' | 'alternate' | 'top' | 'bottom';

/** The axis a `wj-timeline` runs along. Optimus calls it `layout`. */
export type WjTimelineOrientation = 'vertical' | 'horizontal';

/**
 * What a `wjTimelineContent` or `wjTimelineOpposite` template sees for each event. `let-event` is
 * the event. `T` is the event type: give the slot `[wjTimelineContentOf]` (or
 * `[wjTimelineOppositeOf]`) to have it inferred from your events.
 */
export interface WjTimelineEventContext<T = unknown> {
  /** The event. */
  $implicit: T;
}
