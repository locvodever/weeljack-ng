import { TagBasicExample } from '../../../examples/tag/basic';
import { TagSeveritiesExample } from '../../../examples/tag/severities';
import { TagWithIconExample } from '../../../examples/tag/with-icon';
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
  entry: 'tag',
  title: 'Tag',
  purpose: 'A short label that sorts content, with an optional colour role.',
  examples: [
    {
      title: 'Basic',
      description:
        'A tag always has a value. Keep it short: a long value wraps inside the tag rather than truncating.',
      sourceKey: 'tag/basic',
      component: TagBasicExample,
    },
    {
      title: 'Severities',
      description:
        'Left unset, the tag takes the ink look. The six severities follow, each value naming its role, because the colour alone must not carry the meaning.',
      sourceKey: 'tag/severities',
      component: TagSeveritiesExample,
    },
    {
      title: 'With an icon',
      description:
        'Content you project renders before the value. Use a decorative icon at `1em` in `currentColor` and mark it `aria-hidden`, so it follows the tag’s colour and size.',
      sourceKey: 'tag/with-icon',
      component: TagWithIconExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTagHarness` from `weeljack-ng/tag/testing` to find a tag by its value and read the text a user sees, without touching the DOM.',
      sourceKey: 'tag/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'A tag is not focusable and adds no Tab stop.' }],
  aria: [
    'A tag is read as its text. Do not carry meaning by colour alone: the `value` says what the colour means, for example “Overdue” in `danger`, not just a red tag.',
    'Mark a projected icon `aria-hidden="true"` (and `focusable="false"` on an SVG) so a screen reader reads only the value.',
    'A tag has no focusable element, so it has no ARIA inputs, and an `aria-*` attribute on `wj-tag` does not raise `WJ0003`. A tag that needs to be clicked or removed wants a different component.',
    'Text and fill meet 4.5:1 contrast in the light and dark schemes for the unset look and every severity.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius and type come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, the display of the Optimus tag, and adds no padding, border or background: the Optimus root is the only painted box. For anything else, `pt` reaches the parts of the Optimus tag underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-tag`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'host', description: 'The Optimus `p-tag` element, which is also its root box.' },
    { part: 'root', description: 'The same element as `host`: the painted tag box.' },
    { part: 'label', description: 'The `span` that holds the `value`.' },
  ],
  mapping: [
    { optimus: 'value', weeljack: 'value', status: 'kept', note: 'Rendered as text.' },
    {
      optimus: 'severity',
      weeljack: 'severity',
      status: 'kept',
      note: 'Optimus’s six values. Unset takes the ink look.',
    },
    {
      optimus: 'Projected content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Renders before the value, as in Optimus.',
    },
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: 'Typed `WjTagPt`. Tracks Optimus.' },
    dropped('icon, #icon template', 'Project your own icon instead: it renders before the value.'),
    dropped('rounded', droppedByNeed),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-tag, TagModule', 'Duplicates, by need, standalone.'),
  ],
};
