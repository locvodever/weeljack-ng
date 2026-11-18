import { BadgeBasicExample } from '../../../examples/badge/basic';
import { BadgeDotExample } from '../../../examples/badge/dot';
import { BadgeSeveritiesExample } from '../../../examples/badge/severities';
import { BadgeSizesExample } from '../../../examples/badge/sizes';
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
  entry: 'badge',
  title: 'Badge',
  purpose: 'A small count or status label.',
  examples: [
    {
      title: 'Basic',
      description:
        'A badge shows its `value` as text. Hide a zero count with `@if`: the number `0` is a value and shows as “0”. Keep values short, for example “99+”, because a badge never wraps its value: a long one overflows its container.',
      sourceKey: 'badge/basic',
      component: BadgeBasicExample,
    },
    {
      title: 'Severities',
      description:
        'Left unset, the badge takes the ink look. The six severities follow, each value naming its role, because the colour alone must not carry the meaning.',
      sourceKey: 'badge/severities',
      component: BadgeSeveritiesExample,
    },
    {
      title: 'Sizes',
      description:
        '`size` is `small` (20 px), the default (24 px) or `large` (28 px). A one-character value is a circle at every size.',
      sourceKey: 'badge/sizes',
      component: BadgeSizesExample,
    },
    {
      title: 'Dot',
      description:
        'With no `value` the badge is an 8 px dot. A dot carries nothing for assistive technology and colour alone is not meaning, so put what it stands for in text beside it.',
      sourceKey: 'badge/dot',
      component: BadgeDotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjBadgeHarness` from `weeljack-ng/badge/testing` to find a badge by its value. `getValue()` returns the text a user sees (`""` for a dot) and `isDot()` says whether the badge is the dot.',
      sourceKey: 'badge/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'Not focusable.' }],
  aria: [
    'A badge has no role: its value is plain text and is read as it stands. “8” on its own does not say what it counts, so put the meaning in text beside it, for example “Messages” before the badge.',
    'A dot has no text, so it carries nothing for assistive technology. Say what it stands for in text nearby, for example “Online” beside a green dot. Colour alone is not meaning either.',
    'A badge on another element is `wj-overlaybadge`’s job: it names the wrapped control with the meaning, for example `ariaLabel="Notifications, 4 unread"`.',
    'A badge has no focusable element and no ARIA inputs, so an `aria-*` attribute on `wj-badge` raises `WJ0003` in development: write the meaning in text beside the badge instead.',
    'Text on its fill meets 4.5:1 contrast in the light and dark schemes for the unset look and every severity. Aura’s light success, info, warn and danger fills fall short, and the default look corrects them (`green.700`, `sky.700`, `orange.700`, `red.700`). An app that passes its own brand colours owns their contrast.',
    'A badge is not a target, so the 24 px target-size rule does not apply to it.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the W5a release.',
  ],
  stylingIntro:
    'Colours, radius and type come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, the display of the Optimus badge, and adds no padding, border or background: the Optimus badge is the only painted box. It is 24 px tall (20 px small, 28 px large) with a 6 px radius, a one-character value makes it a circle, and the value stays on one line. For anything else, `pt` reaches the parts of the Optimus badge underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-badge`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'host', description: 'The Optimus `p-badge` element, which is also its root box.' },
    { part: 'root', description: 'The same element as `host`: the painted badge box.' },
  ],
  mapping: [
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
      note: 'Optimus’s six values. Unset takes the ink look.',
    },
    {
      optimus: 'badgeSize, size',
      weeljack: 'size',
      status: 'renamed',
      note: '`small` or `large`. Optimus’s `size` is a second name for the same input.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjBadgePt`. Tracks Optimus.',
    },
    dropped('xlarge (a size value)', 'The size vocabulary is small and large.'),
    dropped('badgeDisabled', `${droppedByNeed} Render the badge conditionally with \`@if\`.`),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped(
      '[pBadge], badgeStyle, badgeStyleClass, pBadgePT, ptBadgeDirective, pBadgeUnstyled',
      'Use `wj-overlaybadge` to put a badge on another element.',
    ),
    dropped('BadgeModule', 'No NgModule: the component is standalone.'),
  ],
};
