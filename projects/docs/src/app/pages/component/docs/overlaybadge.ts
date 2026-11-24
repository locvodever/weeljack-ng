import { OverlayBadgeBasicExample } from '../../../examples/overlaybadge/basic';
import { OverlayBadgeDotExample } from '../../../examples/overlaybadge/dot';
import { OverlayBadgeSeveritiesExample } from '../../../examples/overlaybadge/severities';
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
  entry: 'overlaybadge',
  title: 'Overlay badge',
  purpose: 'Puts a badge on the corner of another element.',
  examples: [
    {
      title: 'Basic',
      description:
        'Wrap the element in `wj-overlaybadge` and set `value`. The badge sits on the element’s top-end corner. The badge is not announced with the element, so put its meaning in the element’s name: here `ariaLabel` carries the count. The badge reaches past the corner, so leave 16 px of room above and beside the element. The badge is not clickable: a click on it reaches the element under it. Keep values short, for example “99+”, because the badge never wraps its value.',
      sourceKey: 'overlaybadge/basic',
      component: OverlayBadgeBasicExample,
    },
    {
      title: 'Severities',
      description:
        'Left unset, the badge takes the ink look. The six severities follow, and each button’s name starts with its visible label and carries the count, because the colour alone must not carry the meaning. Rows keep 24 px between elements, so one badge never lands on the next element.',
      sourceKey: 'overlaybadge/severities',
      component: OverlayBadgeSeveritiesExample,
    },
    {
      title: 'Dot',
      description:
        'With no `value` the badge is an 8 px dot. A dot carries nothing for assistive technology, so the element’s name says what it means, here “new activity”.',
      sourceKey: 'overlaybadge/dot',
      component: OverlayBadgeDotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjOverlayBadgeHarness` from `weeljack-ng/overlaybadge/testing`. `getValue()` returns the badge’s text (`""` for a dot) and `isDot()` says whether it is the dot. The harness is a container, so `getHarness(WjButtonHarness)` on it reaches the wrapped control.',
      sourceKey: 'overlaybadge/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'Adds no Tab stop; the wrapped element keeps its own keys.' }],
  aria: [
    'An overlay badge has no role and adds nothing to what assistive technology reads. Name the wrapped control with the badge’s meaning, for example `ariaLabel="Notifications, 4 unread"`; for a control with a visible label, start the name with that label.',
    'A dot has no text, so it carries nothing for assistive technology: the control’s name says what it means. Colour alone is not meaning either.',
    'The wrapped control keeps its Tab stop and its focus ring. The badge adds no Tab stop and passes the pointer through, so a click on it reaches the control.',
    'The badge has no focusable element and no ARIA inputs, so an `aria-*` attribute on `wj-overlaybadge` raises `WJ0003` in development: name the wrapped control instead.',
    'The badge covers only the control’s corner, so an icon-only `wj-button` keeps its 24 px target. Text on the badge meets 4.5:1 contrast in the light and dark schemes, with the same colours as `wj-badge`.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the W5a release.',
  ],
  stylingIntro:
    'Colours, radius and type come from the `--wj-*` variables that `provideWeeljack` emits. The host, the `p-overlaybadge` element and the root `div` are all `inline-flex`, so the box is exactly as big as the wrapped element and the badge’s centre sits on its top-end corner (top-start in a right-to-left context), with a 2 px ring in the surface colour. `pt.root` and `pt.pcBadge` reach those parts. The badge stays on one line and passes the pointer through. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-overlaybadge`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-overlaybadge` element, the box around the content.',
    },
    { part: 'root', description: 'The `div` inside it that holds the content and the badge.' },
    {
      part: 'pcBadge',
      description: 'The badge. Its own parts (`root`, …) are reached under this key.',
    },
  ],
  mapping: [
    {
      optimus: 'default content',
      weeljack: 'default content',
      status: 'kept',
      note: 'The element the badge sits on.',
    },
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'A string or a number, rendered as text. Unset gives the dot; `0` shows “0”.',
    },
    {
      optimus: 'severity',
      weeljack: 'severity',
      status: 'kept',
      note: 'The badge’s six values. Unset takes the ink look.',
    },
    {
      optimus: 'badgeSize',
      weeljack: 'size',
      status: 'renamed',
      note: '`small` or `large`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjOverlayBadgePt`. `pcBadge` reaches the inner badge’s parts. Tracks Optimus.',
    },
    dropped('size', 'A deprecated alias of `badgeSize`.'),
    dropped(
      'badgeDisabled, xlarge',
      `${droppedByNeed} Render the badge conditionally with \`@if\`.`,
    ),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-overlay-badge, p-overlaybadge', 'Duplicate selectors of `wj-overlaybadge`.'),
    dropped('OverlayBadgeModule', 'No NgModule: the component is standalone.'),
  ],
};
