import { RadioButtonBasicExample } from '../../../examples/radiobutton/basic';
import { RadioButtonDisabledExample } from '../../../examples/radiobutton/disabled';
import { RadioButtonReactiveFormsExample } from '../../../examples/radiobutton/reactive-forms';
import { RadioButtonSignalFormsExample } from '../../../examples/radiobutton/signal-forms';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'radiobutton',
  title: 'Radio button',
  purpose:
    'One choice from a few options, one radio button per option. Give every radio of a group the same `name` and bind the same value: `[(value)]` on one signal, `ngModel`, a `formControlName` in one `FormGroup`, or one `[formField]`. `option` is this radio’s own value, `value` is the group’s, and the radio whose `option` equals `value` is checked. The radios are real `input type="radio"` elements, so the browser gives a group one Tab stop, arrow keys that check and wrap, and Space. Put the group in a `wj-field` and its label names the group; a radio’s own name is its `<label>`.',
  examples: [
    {
      title: 'Basic',
      description:
        'A `wj-field` holds the group, with the three radios in one element of your own, each inside its own `<label>`, so a click on the text checks the radio. All three share `name="basic-speed"` and one `[(value)]` signal. Two or more radios make the field a group: its label is a `span` and the field names the group with `aria-labelledby`. Give every group on a page its own `name`, because two groups sharing one would merge into one native group.',
      sourceKey: 'radiobutton/basic',
      component: RadioButtonBasicExample,
    },
    {
      title: 'Reactive forms',
      description:
        'Three radios with `formControlName="size"` on one `FormGroup` share one control. Optimus keeps a registry of the radios that share a control and re-checks the others when one is picked, so the previous radio unchecks on a click and on an arrow key. The group starts at Medium.',
      sourceKey: 'radiobutton/reactive-forms',
      component: RadioButtonReactiveFormsExample,
    },
    {
      title: 'Signal forms',
      description:
        'Each radio is `[formField]` on the same field and sets no `name`: the form pushes one shared name, so `WJ0090` is not raised. The field is `required`, and its message shows once a radio is touched or on Save, which touches every field.',
      sourceKey: 'radiobutton/signal-forms',
      component: RadioButtonSignalFormsExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled group leaves the Tab order and ignores every key and click, and its checked radio keeps its dot, so the held value still shows. In the second group Evening is disabled: the radio is shown but cannot be picked, and the arrow keys skip it.',
      sourceKey: 'radiobutton/disabled',
      component: RadioButtonDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjRadioButtonHarness` from `weeljack-ng/radiobutton/testing` to find a radio by its state (`checked`), its `name` or its label text, check it with a click, read whether it is checked, disabled, required or invalid, read its `name`, id, ARIA attributes and label text (its `<label>` elements, else its `aria-label`), and focus and blur it, without touching the DOM.',
      sourceKey: 'radiobutton/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'A group is one Tab stop. Tab enters at the checked radio, or at the first radio when none is checked (the last on Shift+Tab), and leaves the group on the next press. A disabled radio is skipped, and a disabled group is not in the Tab order.',
    },
    {
      key: 'Arrow Down, Arrow Right',
      effect:
        'Move to the next radio of the group, check it and fire `valueChange`. After the last radio the focus wraps to the first. A disabled radio is skipped.',
    },
    {
      key: 'Arrow Up, Arrow Left',
      effect:
        'Move to the previous radio of the group and check it. Before the first the focus wraps to the last.',
    },
    {
      key: 'Space',
      effect: 'Checks the focused radio, when it is not checked.',
    },
    {
      key: 'Enter',
      effect: 'Nothing: a native radio is checked by Space or an arrow key, not Enter.',
    },
  ],
  aria: [
    'Each radio is a native `input type="radio"`. `inputId`, `ariaLabel` and `ariaLabelledBy` are Optimus’s own inputs, set on the `input`; `ariaDescribedBy` and `aria-invalid` are routed through the `input` part. An `aria-*` attribute on `wj-radiobutton` itself is not forwarded and raises `WJ0003` in development.',
    'The group story is the native one. A group is the radios that share a `name`: the browser gives them one Tab stop, the arrow keys and Space, and a screen reader announces each radio’s name, its checked state and its place in the group (“2 of 3”). Every radio of a group binds the same value and gets the same `name`.',
    'Inside a `wj-field`, one radio registers inline: the field label sits beside it and a click on the label checks it, as with `wj-checkbox`. Two or more radios make the field a group: the field’s label is a `span`, the field has `role="group"` with `aria-labelledby` set to it, and it lists the hint and the error in `aria-describedby`. Each radio also merges the hint and error ids and shows `aria-invalid="true"` while the field shows an error.',
    'Name each option yourself: a `<label>` that wraps the radio or points at it (`<label for>` with `inputId`), or `ariaLabel`. The field’s label names the group, not an option.',
    'Outside a field, wrap the group in an element with `role="radiogroup"` and an accessible name (`aria-label` or `aria-labelledby`), or the group has no name. A lone radio outside a field needs a `<label for>` that matches `inputId`, or `ariaLabel`.',
    '`WJ0090` is a development warning, raised once per application after the first render, when a radio has no `name`. It then forms a group of its own, so the arrow keys do not reach the other options and every such radio is its own Tab stop. A `[formField]` pushes one shared `name`, which counts.',
    'A radio is touched, for `ngModel`, `FormControl` and `[formField]`, when it loses focus: Optimus’s own `onInputBlur` does it, so moving the focus between the radios of a group marks the group touched too.',
    'Optimus’s radio looks up an `NgControl` on its own element with no fallback, and registers it in a root registry. The wrapper hands the radio the `NgControl` of your `ngModel`, `formControlName` or `[formField]`, and a stand-in with a control of its own when there is none, so a plain `[(value)]` group works and radios of different groups never meet. You do nothing for this.',
    'Colour is never the only sign: the checked radio is a ring around a dot. The border is 4.83:1 on white in light and 4.12:1 on the dark field background, and the dot is 19.9:1 and 19.06:1 on its fill. The hit box is 24 × 24 px.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The radio is 24 px, with a 16 px dot when checked, and its look is Aura’s through the preset. The host is an inline-flex box around Optimus’s root, so inside a field’s inline mode the box sits on the label’s first line. For anything else, `pt` reaches the parts of the Optimus radio underneath: `root`, `input` (the native radio), `box` and `icon` (the dot). It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-radiobutton`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `input` lose to `aria-describedby` and `aria-invalid`, which the component routes there while they have a value.',
  parts: [
    {
      part: 'root',
      description:
        'Optimus’s root element, the 24 px box that holds the `input` and the painted circle.',
    },
    {
      part: 'input',
      description:
        'The native `input type="radio"`, transparent and filling the root. It is the focusable part and the hit box, and carries the ARIA attributes.',
    },
    { part: 'box', description: 'The painted circle: its border, background and focus ring.' },
    { part: 'icon', description: 'The dot inside the circle, shown while the radio is checked.' },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<T | null>(null)`: the group’s value, the `option` of the checked radio. Every radio of one group binds the same value, two-way as `[(value)]`.',
    },
    {
      optimus: 'value',
      weeljack: 'option',
      status: 'renamed',
      note: 'This radio’s own value, a required input. `value` is the group’s model. Compared with `==`, as Optimus compares.',
    },
    {
      optimus: 'onClick',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output. It fires on the radio the user checks.',
    },
    {
      optimus: 'name',
      weeljack: 'name',
      status: 'kept',
      note: 'One group: radios with the same name share one Tab stop and the arrow keys. A `[formField]` pushes it. Without one, `WJ0090` is raised in development.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside.',
    },
    {
      optimus: 'inputId, ariaLabel, ariaLabelledBy',
      weeljack: 'inputId, ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Optimus binds them on the `input`. Inside a field one id is generated.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Merged into the `input` part with the field’s hint and error ids.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjRadioButtonPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'No `on` outputs: use the native `focusin` and `focusout` events on the host.',
    },
    dropped('binary', 'A radio is always a group member. For an on/off choice use `wj-checkbox`.'),
    dropped('variant, size', 'By need: a smaller circle would break the 24 px hit box.'),
    dropped('tabindex, autofocus', 'By need: the native group manages the Tab stop.'),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'p-radioButton, p-radio-button, focus(), RadioButtonModule',
      'Duplicate selectors; by need; the component is standalone.',
    ),
    dropped(
      'RadioControlRegistry, RADIO_VALUE_ACCESSOR',
      'Optimus internals. The root registry keeps working underneath; WeeljackNg exports neither.',
    ),
  ],
};
