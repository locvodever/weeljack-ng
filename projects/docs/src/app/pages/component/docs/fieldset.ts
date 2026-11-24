import { FieldsetBasicExample } from '../../../examples/fieldset/basic';
import { FieldsetToggleableExample } from '../../../examples/fieldset/toggleable';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'fieldset',
  title: 'Fieldset',
  purpose: 'A group of related content under a legend, optionally collapsible.',
  examples: [
    {
      title: 'Basic',
      description:
        'A fieldset groups content under a required `legend`, which sits on the top border and names the group. It is a native `fieldset`, but not a form control: it does not label a control (use `wj-field` for that) and it joins no `wj-field`.',
      sourceKey: 'fieldset/basic',
      component: FieldsetBasicExample,
    },
    {
      title: 'Toggleable',
      description:
        'With `toggleable`, a plus or minus button inside the legend collapses and expands the content. `collapsed` is a two-way model, so `[(collapsed)]` reports every toggle, a click or a key press alike; the state line below follows it. The fieldset is open at rest. Collapsed content takes no space and leaves the Tab order, and only the legend stays on the border.',
      sourceKey: 'fieldset/toggleable',
      component: FieldsetToggleableExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjFieldsetHarness` from `weeljack-ng/fieldset/testing`. `WjFieldsetHarness.with({ legend })` finds a fieldset by its `legend` text. `getLegend()` and `getContentText()` read what the user sees; `isToggleable()` and `isCollapsed()` read the state. `toggle()` clicks the toggle button, `focus()` moves focus to it and `isFocused()` says whether it has focus. `toggle()` and `focus()` fail on a fieldset with no toggle. `getContentText()` works on a collapsed fieldset too. Nothing here names an Optimus class.',
      sourceKey: 'fieldset/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Enter, Space',
      effect:
        'On the toggle button in the legend: collapses an open fieldset and opens a collapsed one. Each press toggles once.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Reaches the toggle button inside the legend. A fieldset that is not toggleable has no stop of its own. The content of a collapsed fieldset is skipped.',
    },
  ],
  aria: [
    'A native `fieldset` named by its `legend`. A toggleable fieldset adds a real `button` in the legend with `aria-expanded`, `aria-controls` and the legend text as its name, and the content is a `role="region"` labelled by the legend (the APG Disclosure pattern). The collapsed region is `aria-hidden`. The fieldset takes no ARIA input: the legend names it.',
    'A fieldset groups content; it is not a form control and does not label a control. To label one control, use `wj-field`.',
    'Setting an `aria-*` attribute on the `wj-fieldset` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'Gap, fixed: Optimus leaves the plus icon, shown while the content is collapsed, without `aria-hidden` (the minus icon has it). `wj-fieldset` routes `aria-hidden="true"` to the `toggleIcon` part.',
    'Gap, fixed: Optimus points the region’s `aria-labelledby` at the toggle’s id, which exists only on a toggleable fieldset, so a fieldset that is not toggleable has a region that points at nothing. `wj-fieldset` gives the legend a unique id and points the region’s `aria-labelledby` at it, toggleable or not.',
    'Gap, fixed: a fieldset that is not `toggleable` is never collapsed. Optimus would otherwise mark the visible content `aria-hidden` when `collapsed` is `true`.',
    'Motion: collapsing and expanding are skipped under `prefers-reduced-motion: reduce`, and `pt.motion` cannot turn that off.',
    'No axe rule is tolerated on this page: the three documented states (not toggleable, toggleable and expanded, toggleable and collapsed) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, borders and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, so its width is yours. A long legend wraps and is never truncated. Where `wj-fieldset` routes its own attributes onto a part (the legend’s `id`, the toggle icon’s `aria-hidden`, the region’s `aria-labelledby`), the routed value wins over the same attribute in your `pt`; every other key you set is kept. `pt` reaches the parts of the Optimus fieldset underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-fieldset`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt.motion` is merged under the component’s own safe motion, so it cannot turn reduced motion off.',
  parts: [
    { part: 'root', description: 'The native `fieldset` element: the bordered box.' },
    { part: 'legend', description: 'The `legend` element on the top border.' },
    {
      part: 'toggleButton',
      description: 'The toggle button inside the legend, present only while `toggleable`.',
    },
    { part: 'toggleIcon', description: 'The plus or minus icon in the toggle button.' },
    { part: 'legendLabel', description: 'The `legend` text.' },
    { part: 'contentContainer', description: 'The `role="region"` that collapses.' },
    {
      part: 'contentWrapper',
      description: 'The element that carries the height while the fieldset opens.',
    },
    { part: 'content', description: 'The box around the content.' },
  ],
  mapping: [
    {
      optimus: 'legend',
      weeljack: 'legend',
      status: 'kept',
      note: 'Required, rendered as text. It names the group and the toggle button.',
    },
    {
      optimus: 'toggleable',
      weeljack: 'toggleable',
      status: 'kept',
      note: 'Accepts a bare attribute.',
    },
    {
      optimus: 'collapsed, collapsedChange',
      weeljack: 'collapsed',
      status: 'kept',
      note: 'One two-way model, `[(collapsed)]`; it takes a binding, not a bare attribute. Optimus’s `undefined` arrives as `false`. Ignored unless `toggleable`.',
    },
    dropped(
      'onBeforeToggle, onAfterToggle',
      'Exposed by need: the `collapsed` model reports every toggle.',
    ),
    dropped('#header, p-header facet', 'Exposed by need: the `legend` text names the group.'),
    dropped('#expandicon, #collapseicon', 'Icon slots: icons are not exposed.'),
    {
      optimus: '#content',
      weeljack: 'Default content',
      status: 'renamed',
      note: 'Projected.',
    },
    dropped('motionOptions', 'Bound to `{ safe: true }`, so motion respects reduced motion.'),
    dropped('transitionOptions', 'Deprecated alias.'),
    dropped('style, styleClass; dt, unstyled, ptOptions', droppedAlways),
    dropped('toggle(), expand(), collapse()', 'Set `collapsed` instead.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjFieldsetPt`. Tracks Optimus.',
    },
  ],
};
