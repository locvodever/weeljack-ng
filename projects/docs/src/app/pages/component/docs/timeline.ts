import { TimelineAlternateExample } from '../../../examples/timeline/alternate';
import { TimelineBasicExample } from '../../../examples/timeline/basic';
import { TimelineHorizontalExample } from '../../../examples/timeline/horizontal';
import { TimelineOppositeContentExample } from '../../../examples/timeline/opposite-content';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'timeline',
  title: 'Timeline',
  purpose:
    'A series of chained events along a line. Give `wj-timeline` its `value` and a `wjTimelineContent` template that says what each event shows: without one an event shows nothing, so the content slot is the way to show events. A `wjTimelineOpposite` template adds a second side across the line, usually a date. `orientation` and `align` place the events. Your array is only read, never changed. The timeline is a list: name it with `ariaLabel`, or point `ariaLabelledBy` at a visible heading.',
  examples: [
    {
      title: 'Basic',
      description:
        'Four shipment events in a 32rem column, each with its status (weight 600) over a muted date. `[wjTimelineContentOf]` types `let-event` from your events, so `event.status` is a `string` under strict templates. Optimus’s marker, connector and spacing are kept as they are. The text renders as text, never as HTML.',
      sourceKey: 'timeline/basic',
      component: TimelineBasicExample,
    },
    {
      title: 'Alternate',
      description:
        'Set `align` to `alternate` and the content switches sides from one event to the next. The dates go opposite, in a `wjTimelineOpposite` template, so each event reads across the line. `left` and `right` keep every event on one side.',
      sourceKey: 'timeline/alternate',
      component: TimelineAlternateExample,
    },
    {
      title: 'Horizontal',
      description:
        'Set `orientation` to `horizontal` and the events run along a row: Optimus calls this input `layout`, and WeeljackNg renames it so the axis input reads the same on every wrapper. Use `top` or `bottom` for `align` in this orientation. Each event gets an equal share of the width, so keep the labels short. A horizontal timeline squeezes its events: use vertical at narrow widths.',
      sourceKey: 'timeline/horizontal',
      component: TimelineHorizontalExample,
    },
    {
      title: 'Opposite content',
      description:
        'The date goes opposite, in a `wjTimelineOpposite` template, and the status and a note are the content. Both slots get the same context, the event. An event shows only what its slots give: with no opposite slot the opposite side is empty. Give the templates at creation: Optimus reads them once, so adding or removing one later is not picked up.',
      sourceKey: 'timeline/opposite-content',
      component: TimelineOppositeContentExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTimelineHarness` from `weeljack-ng/timeline/testing` to read a timeline without touching its DOM: `getEventTexts()` and `getOppositeTexts()` return the text on each side of every event, in order (an empty string for an event with none), and `getOrientation()` returns the way it runs. Find one by its name with `WjTimelineHarness.with({ name })`.',
      sourceKey: 'timeline/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'The timeline has no keys of its own and is not a tab stop. Tab moves through the focusable content inside the events, such as a link or a button in a content template, in order, and nothing else.',
    },
  ],
  aria: [
    'The root is a `list` and each event is a `listitem`, so a screen reader announces the number of events. Both roles are added by the component: Optimus’s root and events carry no role (22 Q4). Name the list: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading. Both land on the root, which carries `role="list"`, not on the `wj-timeline` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML.',
    'The marker and the connector are decoration: they carry no text and no role. What an event means must be in its text, as the status and the date are in the examples, never in the marker’s colour alone.',
    'With no events the timeline is a bare list. Show your own empty message instead of the timeline.',
    'The timeline adds no animation.',
    'A horizontal timeline squeezes its events into the width of its container, and a long label wraps or overflows. Use vertical at narrow widths.',
    'Optimus does not name an event. A listitem is named by its content: keep the first text of each event meaningful on its own.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host is a block, and Optimus’s timeline fills its width. The marker, the connector, the spacing of events and the colours are Optimus’s, set by the preset and the `--wj-*` variables that `provideWeeljack` emits; the component writes no CSS of its own beyond the host. What an event shows, and its type and colours, are your templates. For anything else, `pt` reaches the parts of the Optimus timeline underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-timeline`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `role`, `aria-label` and `aria-labelledby` on the `root` part and `role` on the `event` part are set by the component, and win over a `pt` value of the same name. To restyle the marker, use the `eventMarker` part.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-timeline` element. It is also the root: both parts land on it.',
    },
    {
      part: 'root',
      description: 'The list. Takes the routed `role`, `aria-label` and `aria-labelledby`.',
    },
    { part: 'event', description: 'One event, a list item. Takes the routed `role`.' },
    {
      part: 'eventOpposite',
      description: 'The opposite side of an event, where the `wjTimelineOpposite` template goes.',
    },
    {
      part: 'eventSeparator',
      description: 'The column or row that holds an event’s marker and connector.',
    },
    { part: 'eventMarker', description: 'The marker, a dot. Restyle it here.' },
    {
      part: 'eventConnector',
      description: 'The line from an event’s marker to the next one. The last event has none.',
    },
    {
      part: 'eventContent',
      description: 'The content of an event, where the `wjTimelineContent` template goes.',
    },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'A `T[]`; `T` is inferred for the templates from `[wjTimelineContentOf]` and `[wjTimelineOppositeOf]`. Never changed.',
    },
    {
      optimus: 'layout',
      weeljack: 'orientation',
      status: 'renamed',
      note: '`vertical` or `horizontal` (`WjTimelineOrientation`), default `vertical`. The axis input is `orientation` on every wrapper.',
    },
    {
      optimus: 'align',
      weeljack: 'align',
      status: 'kept',
      note: 'Narrowed from `string` to `WjTimelineAlign`: `left`, `right`, `alternate`, `top` or `bottom`, default `left`.',
    },
    {
      optimus: 'content, opposite templates',
      weeljack: 'wjTimelineContent, wjTimelineOpposite',
      status: 'renamed',
      note: 'Typed slots with context `WjTimelineEventContext` (the event). The timeline declares an Optimus template only for a slot you give.',
    },
    {
      optimus: 'marker template',
      weeljack: 'None',
      status: 'dropped',
      note: 'Deferred: the marker is decoration. Restyle it through `pt` (`eventMarker`).',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'added',
      note: 'On the root, which becomes `role="list"`; each event becomes `role="listitem"`.',
    },
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjTimelinePt`.' },
    dropped('getBlockableElement()', 'Not exposed. The host element is the timeline.'),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
  ],
};
