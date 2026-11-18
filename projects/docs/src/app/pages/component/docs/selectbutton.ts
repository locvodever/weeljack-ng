import { SelectButtonBasicExample } from '../../../examples/selectbutton/basic';
import { SelectButtonDisabledExample } from '../../../examples/selectbutton/disabled';
import { SelectButtonInAFieldExample } from '../../../examples/selectbutton/in-a-field';
import { SelectButtonKeepAPickExample } from '../../../examples/selectbutton/keep-a-pick';
import { SelectButtonSizesExample } from '../../../examples/selectbutton/sizes';
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
  entry: 'selectbutton',
  title: 'Select button',
  purpose:
    "A single choice from a few options, shown as one row of joined buttons: the picked one is a filled pill on the track. Give it `options` (the shared `WjOption<T>`, `import type { WjOption } from 'weeljack-ng'`) and bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is the picked option’s `value`, `null` while none is picked. Click, Enter or Space on a button picks it, and on the picked button unpicks it unless `allowEmpty` is off. Keep to two to five short, unique labels, and use `wj-select` for more or longer ones. Inside a field, the field’s label names the group, and the field describes it and marks it invalid.",
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the group through `ariaLabelledBy`: the group has no single focusable element, so a `<label for>` cannot name it. Picking the picked button again unpicks it, so `value` goes back to `null`. Labels must be unique, because Optimus tracks the buttons by label and Angular raises its duplicate-key error in development for two equal ones; values must be distinct too, as Optimus marks every button whose value equals the picked one. The group sizes to its buttons and sits at the start of its container.',
      sourceKey: 'selectbutton/basic',
      component: SelectButtonBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the group through `aria-labelledby`, and a click on it does nothing, as on a native `legend`. The first field shows a hint; the second shows a static error, so the invalid outline is visible without interaction.',
      sourceKey: 'selectbutton/in-a-field',
      component: SelectButtonInAFieldExample,
    },
    {
      title: 'Keep a pick',
      description:
        'With `allowEmpty` off a click on the picked button keeps it, so `value` is never `null` once something is picked. The group starts at Week: with `allowEmpty` off nothing can be unpicked, but a group that starts empty stays empty until the first click, so give it a starting value.',
      sourceKey: 'selectbutton/keep-a-pick',
      component: SelectButtonKeepAPickExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled group leaves the Tab order and ignores every key and click, and its picked button keeps the pill, so the held value still shows. In the second group Day is disabled: the button is shown but cannot be picked, is skipped by Tab and is announced as unavailable.',
      sourceKey: 'selectbutton/disabled',
      component: SelectButtonDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall, like the other controls of a form.',
      sourceKey: 'selectbutton/sizes',
      component: SelectButtonSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSelectButtonHarness` from `weeljack-ng/selectbutton/testing` to read the labels of the buttons, pick one by its label, read the picked label (`null` when none is picked), check whether an option is disabled, move focus to a button by its label, check the group’s disabled and invalid states and its ARIA attributes, and blur it, without touching the DOM. Find a group by its `aria-label` (`ariaLabel`) or by the label it holds (`selectedLabel`).',
      sourceKey: 'selectbutton/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Every enabled button is a Tab stop, in order: Tab and Shift+Tab move from button to button, and out of the group after the last or before the first. A disabled button, and every button of a disabled group, is skipped.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Pick the focused button. On the picked button they unpick it and the value becomes `null`, unless `allowEmpty` is off. Focus stays on the button, and Space does not scroll the page.',
    },
    {
      key: 'Arrow keys, Home, End, Escape',
      effect:
        'Nothing. The arrow keys do not move between the buttons, which the WAI-ARIA radio-group pattern would have them do (see the gap below).',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The group is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The group is Optimus’s root with `role="group"`, and each option is a `role="button"` with `aria-pressed`, `true` on the picked one. `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on the group, not on `wj-selectbutton`; `ariaLabelledBy` is Optimus’s own input, `ariaLabel` and `ariaDescribedBy` are routed through the `root` part. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'There is no single focusable element, so a `<label for>` cannot name the group and there is no `inputId`. Outside a `wj-field`, name it with `ariaLabelledBy` (the id of a visible text) or `ariaLabel`. Inside a field the field renders its label as a `span` and the group gets `aria-labelledby` set to it; a consumer’s `ariaLabelledBy` wins. A click on the label does nothing.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The group sets `aria-invalid="true"` while it is invalid, and Optimus draws a 1 px invalid outline around it. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. axe treats `aria-invalid` as global, so it is valid on a group.',
    'Optimus never marks a disabled toggle button `aria-disabled`, and leaves it in the Tab order (`tabindex="0"` always). The component routes `aria-disabled="true"` and `tabindex="-1"` to every disabled button, whether the option or the whole group is disabled, through the `pcToggleButton` `root` part, and `aria-disabled="true"` to the group while it is disabled. That also keeps axe’s colour contrast check off the dimmed text, which WCAG exempts for an inactive component.',
    'A group is touched, for `ngModel`, `FormControl` and `[formField]`, when focus leaves it: a `focusout` on the host whose `relatedTarget` is outside the host. Optimus’s own `onBlur`, the only caller of its touched callback, is bound nowhere in its template, so the component calls it itself, and moving focus between the buttons does not.',
    'Gap: `required` reaches forms validation only. A `role="group"` cannot carry `aria-required`, so assistive technology is not told the group is required. Say so in the field’s label or hint.',
    'Gap: every enabled button is a Tab stop and the arrow keys do nothing, because Optimus’s arrow-key handler is bound nowhere. The WAI-ARIA radio-group pattern uses one Tab stop and the arrows; this is `role="group"` of `role="button"`s with `aria-pressed`, which is a different pattern, and whether a screen reader user would rather have a radio group is the open question for the NVDA pass.',
    'Gap: Aura’s disabled fill and text colour never apply to a toggle button, because its rule is `:disabled` and a toggle button is a `span`. A disabled button is dimmed by Optimus’s opacity instead, so a disabled group looks the same as an enabled one, only fainter, and its picked pill stays.',
    'The picked pill, the unpicked text and the 44 / 36 / 52 px heights come from the preset-wide `togglebutton` tokens (see Styling), so every toggle button of the app reads them, `wj-selectbutton` and the later `wj-togglebutton` alike: the unpicked text is 7.03:1 on the track in light and 7.76:1 in dark, the picked pill is 4.40:1 (light) and 4.12:1 (dark) against the track, and its white text is 4.83:1 on it.',
    'Keep to two to five short, unique labels: a narrow container wraps a label at its spaces and every button grows to the tallest, and more buttons than fit in a row are better as `wj-select`.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS) is recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The buttons’ look is the preset’s `togglebutton` tokens, shared by every toggle button: heights of 44 / 36 / 52 px (the track keeps Aura’s 0.25rem padding, the pill takes the rest of the form-field padding), unpicked text in `surface.600` in light so it passes AA on the track, and the picked pill in `surface.500` with white text in both schemes, where Aura’s own pill is about 1.1:1 against the track. Everything else about the buttons is Aura’s. The host is an inline-flex row that sizes to its buttons; inside a field it sits at the start. For anything else, `pt` reaches the parts of the Optimus group underneath: `root` is the group, and `pcToggleButton` reaches every button through its own `root`, `content` and `label` parts. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-selectbutton`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `root` lose to `aria-label`, `aria-describedby`, `aria-invalid` and `aria-disabled`, which the component routes there while they have a value, and on `pcToggleButton.root` they lose to `aria-disabled` and `tabindex`. The function form of `pt` and a function per part both work; a function on `pcToggleButton` is called once, with the group, and a function on its `root`, `content` or `label` is called per button.',
  parts: [
    {
      part: 'root',
      description:
        'The group: Optimus’s root element with `role="group"`. It is the part the ARIA inputs are set on.',
    },
    {
      part: 'pcToggleButton.root',
      description:
        'Each toggle button: an element with `role="button"` and `aria-pressed`. It carries `aria-disabled` and `tabindex` while the button is disabled.',
    },
    {
      part: 'pcToggleButton.content',
      description: 'The pill inside each button, filled while the button is picked.',
    },
    { part: 'pcToggleButton.label', description: 'The text of each button.' },
  ],
  optimusSelector: 'p-selectbutton',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<T | null>(null)`: the picked option’s value, two-way as `[(value)]`. `null` while none is picked. Single choice only.',
    },
    {
      optimus: 'onChange',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output.',
    },
    {
      optimus: 'options',
      weeljack: 'options',
      status: 'kept',
      note: 'Retyped `WjOption<T>[]`. Labels must be unique.',
    },
    dropped(
      'optionLabel, optionValue, optionDisabled',
      'Fixed to `label`, `value` and `disabled`, the keys of `WjOption`.',
    ),
    {
      optimus: 'allowEmpty',
      weeljack: 'allowEmpty',
      status: 'kept',
      note: 'Accepts a bare attribute. Optimus’s default `true`: picking the picked button unpicks it. Off, a pick always stays.',
    },
    dropped('unselectable', 'The same switch as `allowEmpty`, inverted.'),
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. `required` reaches forms validation only.',
    },
    {
      optimus: 'ariaLabelledBy',
      weeljack: 'ariaLabelledBy',
      status: 'kept',
      note: 'Optimus binds it on the `role="group"` root. Inside a field it defaults to the field’s label.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the `root` part: Optimus has neither. Inside a field `ariaDescribedBy` merges with the field’s hint and error.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` 36 px, default 44 px, `large` 52 px. Typed `WjSelectButtonSize`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjSelectButtonPt`. Tracks Optimus. Reaches every button through `pcToggleButton`.',
    },
    dropped('onOptionClick', 'By need; picking is `valueChange`.'),
    dropped(
      'multiple',
      'By need: a multiple mode changes the value to `T[]`. For many picks use `wj-multiselect`.',
    ),
    dropped(
      '#item',
      'By need. Template slots are not exposed; `wjSelectButtonItem` is the first candidate when a use appears.',
    ),
    dropped('tabindex, autofocus, dataKey, name', droppedByNeed),
    dropped('fluid', 'The host is the box: it sizes to its buttons.'),
    dropped(
      'styleClass, dt, unstyled, ptOptions, hostName, SelectButtonModule, p-selectButton, p-select-button',
      droppedAlways,
    ),
  ],
};
