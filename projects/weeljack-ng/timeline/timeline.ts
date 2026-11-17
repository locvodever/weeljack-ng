import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, input } from '@angular/core';
import { Timeline } from '@openng/optimus-ui/timeline';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjTimelineContentSlot, WjTimelineOppositeSlot } from './timeline-slots';
import type { WjTimelineAlign, WjTimelineOrientation, WjTimelinePt } from './timeline-types';

/*
 * Notes on the template (kept here: a partially compiled template ships as text, inside the size
 * budget):
 * - Optimus only reads `value`, so the app's array goes in as it is (FR-9).
 * - A template is declared only for a slot the app gave; the slot's template is rendered inside
 *   Optimus's, which carries the event. Optimus reads its templates once: give slots at creation.
 * - The marker slot is not exposed (FR-57); the marker is restyled through `pt` (`eventMarker`).
 * - Optimus puts the `root` part on its own host element, whose children are the events, so
 *   `role="list"` there and `role="listitem"` on each `event` part form one list.
 */

/**
 * A series of chained events along a line, over Optimus's `p-timeline`. Give it `value`, and put a
 * `wjTimelineContent` template inside it to say what each event shows; `wjTimelineOpposite` adds a
 * second side, usually a date. `orientation` and `align` place the events. Its root is a list:
 * give it `ariaLabel` or `ariaLabelledBy`.
 */
@Component({
  selector: 'wj-timeline',
  imports: [Timeline, NgTemplateOutlet],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class WjTimeline<T = unknown> {
  /** The events, in order. Never changed: the timeline only reads it. */
  readonly value = input<T[]>();
  /** Where the line sits against the content. */
  readonly align = input<WjTimelineAlign>('left');
  /** The axis the events run along. Optimus calls it `layout`. */
  readonly orientation = input<WjTimelineOrientation>('vertical');
  /** Accessible name of the list. Set on the timeline's root, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the timeline's root, not on the host. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the timeline's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTimelinePt>();

  protected readonly contentSlot = contentChild(WjTimelineContentSlot);
  protected readonly oppositeSlot = contentChild(WjTimelineOppositeSlot);

  /** `pt` forwarded as given, plus the list roles and the name this wrapper routes. */
  protected readonly partAttributes = computed<WjTimelinePt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'root', {
        role: 'list',
        'aria-label': this.ariaLabel(),
        'aria-labelledby': this.ariaLabelledBy(),
      }),
      'event',
      { role: 'listitem' },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-timeline');
    _checkAriaOnHost('wj-timeline', 'Use ariaLabel or ariaLabelledBy instead');
  }
}
