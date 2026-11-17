import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { WjTimelineEventContext } from './timeline-types';

/**
 * The content of each event of a `wj-timeline`: put an `<ng-template wjTimelineContent>` inside it
 * and the timeline renders it beside the line for every event. Without one an event shows nothing,
 * as in Optimus. Import the directive: an un-imported `wjTimelineContent` silently drops its
 * template.
 *
 * `[wjTimelineContentOf]` only types the template: bind it to your events
 * (`[wjTimelineContentOf]="events"`) so `let-event` has your event type. It is never read, and
 * without it the event is `unknown`.
 */
@Directive({ selector: 'ng-template[wjTimelineContent]' })
export class WjTimelineContentSlot<T = unknown> {
  /** The template a `wj-timeline` renders for each event. */
  readonly template = inject<TemplateRef<WjTimelineEventContext<T>>>(TemplateRef);
  /** Your events, bound only so the template type-checker infers the event type `T`. */
  readonly wjTimelineContentOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTimelineEventContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTimelineContentSlot<T>,
    context: unknown,
  ): context is WjTimelineEventContext<T> {
    return typeof context === 'object';
  }
}

/**
 * The opposite side of each event of a `wj-timeline`, across the line from its content: usually a
 * date. Put an `<ng-template wjTimelineOpposite>` inside the timeline. Import the directive: an
 * un-imported `wjTimelineOpposite` silently drops its template.
 *
 * `[wjTimelineOppositeOf]` only types the template, as `[wjTimelineContentOf]` does.
 */
@Directive({ selector: 'ng-template[wjTimelineOpposite]' })
export class WjTimelineOppositeSlot<T = unknown> {
  /** The template a `wj-timeline` renders opposite each event. */
  readonly template = inject<TemplateRef<WjTimelineEventContext<T>>>(TemplateRef);
  /** Your events, bound only so the template type-checker infers the event type `T`. */
  readonly wjTimelineOppositeOf = input<readonly T[] | null | undefined>();

  /** Types `let-` variables in the template as {@link WjTimelineEventContext} of `T`. */
  static ngTemplateContextGuard<T>(
    directive: WjTimelineOppositeSlot<T>,
    context: unknown,
  ): context is WjTimelineEventContext<T> {
    return typeof context === 'object';
  }
}
