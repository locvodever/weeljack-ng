import { ButtonGroupBasicExample } from '../../../examples/buttongroup/basic';
import { ButtonGroupDisabledExample } from '../../../examples/buttongroup/disabled';
import { ButtonGroupSizesExample } from '../../../examples/buttongroup/sizes';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'buttongroup',
  title: 'Button group',
  purpose: 'A row of joined buttons that act as one control, such as paging or a clipboard bar.',
  examples: [
    {
      title: 'Basic',
      description:
        'Project `wj-button` elements and name the group. The buttons are secondary and outlined: the join drops each inner border so neighbours share one seam, and filled buttons of one severity would merge into a single bar with no visible seam. Keep to two to five short labels, because the group never wraps.',
      sourceKey: 'buttongroup/basic',
      component: ButtonGroupBasicExample,
    },
    {
      title: 'With a disabled button',
      description:
        'A disabled button keeps its place and its corners in the join, looks as `wj-button` does when disabled and is skipped by Tab.',
      sourceKey: 'buttongroup/disabled',
      component: ButtonGroupDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        'The group has no `size`: set `size` on every `wj-button`. The three groups are named apart, "Date navigation, small" and so on.',
      sourceKey: 'buttongroup/sizes',
      component: ButtonGroupSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjButtonGroupHarness` from `weeljack-ng/buttongroup/testing`. `getButtons()` hands back the buttons as `WjButtonHarness`es, narrowed by the same filters (`label`), and `getAriaLabel()` and `getAriaLabelledBy()` read the group’s name.',
      sourceKey: 'buttongroup/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect: 'Moves through each button in order. The group is not a Tab stop.',
    },
    { key: 'Enter, Space', effect: 'Activates the focused button, as `wj-button` does.' },
    { key: 'Any key, on a disabled button', effect: 'A disabled button is skipped by Tab.' },
  ],
  aria: [
    'The group is a `role="group"` element. Name every group with `ariaLabel` or `ariaLabelledBy`, such as "Date navigation", so a screen reader says what the buttons belong to.',
    'Optimus has no input or pass-through for that element, so `wj-buttongroup` sets the name on it itself, in the server-rendered page too. It is never on the `wj-buttongroup` host.',
    'An `aria-*` attribute on `wj-buttongroup` is not forwarded and raises `WJ0003` in development: use `ariaLabel` or `ariaLabelledBy`.',
    'Use outlined buttons so the seams show. A group with no buttons renders nothing visible but a named group is still announced, so render the group once it has buttons.',
    'The keyboard and screen-reader pass (NVDA with Chrome) is recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, the display of the Optimus group, and adds no padding, border, colour or seam of its own. Optimus 2.0.2 ships no pass-through for ButtonGroup: it binds no part and has no `ButtonGroupPassThrough` type, so `wj-buttongroup` has no `pt` and this page has no pass-through table. A `pt` will come when an Optimus minor adds one. Optimus’s joined-look rules select sibling Optimus buttons, and each one now sits alone inside its `wj-button`, so the group restates them for `wj-button` children: every button but the last drops its inline-end border, inner corners are square and the outer corners keep the button’s own radius, and a lone button keeps all four. They use logical properties, so right-to-left mirrors. The focused button sits on top of its neighbours so its whole ring shows, which is Optimus’s own rule. The group never wraps: past its container it overflows.',
  parts: [],
  mapping: [
    {
      optimus: 'None',
      weeljack: 'ariaLabel',
      status: 'added',
      note: 'Names the `role="group"` element.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy',
      status: 'added',
      note: 'Names the `role="group"` element, by id.',
    },
    {
      optimus: 'Projected content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Project `wj-button` elements.',
    },
    dropped(
      'pt, dt, unstyled, ptOptions',
      'Optimus binds no part and ships no `ButtonGroupPassThrough`, so `pt` would reach nothing.',
    ),
    dropped('p-buttonGroup, p-button-group', 'Duplicate selectors: only `wj-buttongroup`.'),
  ],
};
