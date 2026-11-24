import { MetergroupBasicExample } from '../../../examples/metergroup/basic';
import { MetergroupLabelStartExample } from '../../../examples/metergroup/label-start';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'metergroup',
  title: 'Meter group',
  purpose: 'Several values shown as segments of one bar, with a legend.',
  examples: [
    {
      title: 'Basic',
      description:
        'Each item is a label, a percentage and a colour. Name the group with visible text: `ariaLabelledBy` points at the caption above it. The values are percentages that sum to 100 or less, and every item needs a colour. Pick the colours the same way as here: each at least 3:1 against the track and against its neighbours, in every scheme your app ships. The colours in these examples are custom properties that switch with the docs’ dark class, so an app switches its own the way it switches schemes.',
      sourceKey: 'metergroup/basic',
      component: MetergroupBasicExample,
    },
    {
      title: 'Label start',
      description:
        'Set `labelPosition="start"` to put the legend above the bar. At the default, `end`, it sits below. To change the items, pass a new array: the group reads `value` when it is replaced, not when you edit the array in place.',
      sourceKey: 'metergroup/label-start',
      component: MetergroupLabelStartExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjMeterGroupHarness` from `weeljack-ng/metergroup/testing`. `WjMeterGroupHarness.with({ label })` finds a group by its accessible name. `getItems()` returns each legend entry as `{ label, percent }`; `getTotalPercent()` returns `aria-valuenow`; `getValueText()` returns the text a screen reader hears, or `null` when there are no items; `getAriaAttributes()` returns the label, labelled-by and described-by attributes.',
      sourceKey: 'metergroup/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'Not focusable; Tab passes over it.' }],
  aria: [
    'Optimus renders the group as `role="meter"` with `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow`, the rounded total of all items. `min` and `max` are not exposed: with other bounds, `aria-valuenow` (a percentage) would disagree with them. Values are percentages.',
    'The legend sits inside the meter, and the children of a meter are presentational, so assistive technology would drop it. WeeljackNg adds `aria-valuetext`, the legend entries joined by commas, for example "Apps (16%), Messages (8%), Media (24%)". Each percentage is worked out as the legend works it out: rounded, and held between 0 and 100. It follows `value` and is absent when there are no items. The array and its items are never modified.',
    'The group needs a name, and the name is yours: `ariaLabel`, or `ariaLabelledBy` with the id of visible text, which is the better choice. `ariaDescribedBy` adds a description but is not a name. With neither a label nor a labelled-by id, `WJ0160` warns once in development, after the first render.',
    '`ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are routed onto the `meter` element through the `host` part. Your own `pt.host` keys survive, and a routed attribute wins over a `pt.host` key of the same name.',
    'Segment colours are yours, and so is their contrast: each should be at least 3:1 against the track and against its neighbours. Without a colour a segment is transparent. The legend text is body text and meets 4.5:1. The track against the card is 1.27:1 in light, as in Aura: the segments and the legend carry the values.',
    'If the items add up to more than 100, the bar is full and each segment is shrunk to fit, so the segments no longer match their legend entries. Keep the sum at 100 or less.',
    'The group is not focusable and adds no Tab stop. Optimus renders it inside its own element, so `aria-*` on `wj-metergroup` raises `WJ0003`: use the inputs.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the W5a release.',
  ],
  stylingIntro:
    'The host is a block that takes its container’s width: set a maximum with `style` or `class` on `wj-metergroup`. Optimus draws an 8 px bar in `--wj-content-border-color` with touching segments, and a legend 16 px away: each entry is an 8 px marker in the segment’s colour, then "Label (n%)" in the inherited text colour. For anything else, `pt` reaches the parts of the Optimus group underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-metergroup`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-metergroup` routes the name and description attributes and `aria-valuetext` onto the `host` part: they win over the same attributes in your `pt`, and your other keys survive. The legend parts (`labelList`, `label`, `labelMarker` and `labelText`) take effect for every form of `pt`: an object, an object with function parts, or a function.',
  parts: [
    {
      part: 'host',
      description:
        'The Optimus `p-metergroup` element: the `meter`, with its name, description and value.',
    },
    { part: 'meters', description: 'The bar: the track that holds the segments.' },
    { part: 'meter', description: 'One segment, painted in its item’s colour.' },
    { part: 'labelList', description: 'The legend: an ordered list with one entry per item.' },
    { part: 'label', description: 'One legend entry.' },
    { part: 'labelMarker', description: 'The round marker in the segment’s colour.' },
    { part: 'labelText', description: 'The entry’s text, such as "Apps (16%)".' },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: '`WjMeterItem[]`: each item is `{ label, value, color }`, a percentage from 0 to 100. Never modified.',
    },
    {
      optimus: 'labelPosition',
      weeljack: 'labelPosition',
      status: 'kept',
      note: '`start` or `end`; defaults to `end`.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the `meter` element (`pt.host`). Optimus takes no name.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjMeterGroupPt`. Tracks Optimus.',
    },
    dropped(
      'min, max',
      `${droppedByNeed} Values are percentages on the 0 to 100 scale, so Optimus’s \`aria-valuenow\` agrees with \`aria-valuemin\` and \`aria-valuemax\`.`,
    ),
    dropped(
      'orientation, labelOrientation',
      `${droppedByNeed} A vertical group measures the page after it renders, which is a server-rendering risk.`,
    ),
    dropped('MeterItem.icon', `${droppedByNeed} Icons are class strings.`),
    dropped(
      'label, meter, start, end, icon templates',
      'Not exposed: the group draws its own parts.',
    ),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-metergroup, p-meter-group', 'Duplicate selectors.'),
  ],
};
