import type {
  Timeline,
  TimelineItemTemplateContext,
  TimelinePassThrough,
} from '@openng/optimus-ui/timeline';
import type {
  WjTimeline,
  WjTimelineAlign,
  WjTimelineEventContext,
  WjTimelineOrientation,
  WjTimelinePt,
} from 'weeljack-ng/timeline';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, every output-direction type stays assignable from what Optimus emits, and
 * `WjTimelinePt` is Optimus's own pass-through type. The checks run in `typecheck` (`ngc` over the
 * spec project); a drift in Optimus's types turns this file red there. The runtime assertion only
 * keeps the file a spec.
 */
describe('WjTimeline types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjTimelinePt>().toEqualTypeOf<TimelinePassThrough>();
    expectTypeOf<WjTimelineAlign>().toExtend<Timeline['align']>();
    expectTypeOf<WjTimelineOrientation>().toExtend<Timeline['layout']>();
    expectTypeOf<Timeline['layout']>().toEqualTypeOf<WjTimelineOrientation>();
    expectTypeOf<ReturnType<WjTimeline['value']>>().toExtend<Timeline['value']>();

    const layout: Timeline['layout'] = 'horizontal' satisfies WjTimelineOrientation;
    const align: Timeline['align'] = 'alternate' satisfies WjTimelineAlign;
    expect([layout, align]).toEqual(['horizontal', 'alternate']);
  });

  it('keeps the event context the one Optimus hands its templates', () => {
    expectTypeOf<WjTimelineEventContext>().toExtend<TimelineItemTemplateContext>();
    expectTypeOf<TimelineItemTemplateContext>().toExtend<WjTimelineEventContext>();
    expect(true).toBe(true);
  });

  it('types a slot context from the events bound to its typing input', () => {
    interface Event {
      status: string;
    }
    expectTypeOf<WjTimelineEventContext<Event>['$implicit']>().toEqualTypeOf<Event>();
    expectTypeOf<WjTimelineEventContext['$implicit']>().toEqualTypeOf<unknown>();
    expect(true).toBe(true);
  });
});
