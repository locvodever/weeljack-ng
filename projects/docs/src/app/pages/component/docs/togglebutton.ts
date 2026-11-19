import { ToggleButtonBasicExample } from '../../../examples/togglebutton/basic';
import { ToggleButtonDisabledExample } from '../../../examples/togglebutton/disabled';
import { ToggleButtonInAFieldExample } from '../../../examples/togglebutton/in-a-field';
import { ToggleButtonSizesExample } from '../../../examples/togglebutton/sizes';
import { ToggleButtonYourOwnLabelsExample } from '../../../examples/togglebutton/your-own-labels';
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
  entry: 'togglebutton',
  title: 'Toggle button',
  purpose:
    'An on/off choice as one button: it shows `onLabel` while it is on and `offLabel` while it is off, which are the translation’s “Yes” and “No” unless you set your own. Bind `checked` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `checked` is the value, a `boolean`. Click, Enter or Space flips it, and `aria-pressed` carries the state. Use `wj-toggleswitch` for a setting that takes effect at once, and `wj-selectbutton` for a choice between named options. Inside a field, the field’s label names the button, and the field describes it and marks it invalid.',
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the button through `ariaLabelledBy`: the button has no `<label for>` partner, because its focusable element is a `role="button"` element, not an input. It shows the translation’s Yes and No, and `aria-pressed` carries the state. The button sizes to its shown label and sits at the start of its container.',
      sourceKey: 'togglebutton/basic',
      component: ToggleButtonBasicExample,
    },
    {
      title: 'Your own labels',
      description:
        'Set `onLabel` and `offLabel` to say what the button turns on and off. A label is shown as text, never as HTML. The button hugs its label, so it changes width as it toggles when the two differ in length: give the host an inline size, here `8rem` from the example’s own styles, and the button keeps one width with its label centred.',
      sourceKey: 'togglebutton/your-own-labels',
      component: ToggleButtonYourOwnLabelsExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the button through `aria-labelledby`, and a click on it moves focus to the button and never toggles it. The button sits at the start of the field and does not stretch across it. The first field shows a hint; the second shows a static error, so the invalid outline is visible without interaction.',
      sourceKey: 'togglebutton/in-a-field',
      component: ToggleButtonInAFieldExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall, like the other controls of a form.',
      sourceKey: 'togglebutton/sizes',
      component: ToggleButtonSizesExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled button leaves the Tab order and ignores every key and click. It is dimmed by Optimus’s opacity, and its pill stays when it is on, so the held value still shows: the second button is on.',
      sourceKey: 'togglebutton/disabled',
      component: ToggleButtonDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjToggleButtonHarness` from `weeljack-ng/togglebutton/testing` to read whether the button is on, flip it, turn it on or off, read the text it shows now, check its disabled and invalid states, its id and its ARIA attributes, and move focus to it and away, without touching the DOM. Find a button by its state (`checked`) or by the text it shows now (`text`).',
      sourceKey: 'togglebutton/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Move focus to the button and away. A disabled button is skipped. Focus draws the family’s 2 px ring around the whole button, after a key press and not after a click.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Flip the button between off and on. Focus stays on it, and Space does not scroll the page.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The button is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The button is Optimus’s root: an element with `role="button"` and `aria-pressed`, `true` while it is on. `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are routed to it, and so is `inputId`, as its `id` (Optimus declares an `inputId` input but renders no id). An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'The button shows “Yes” or “No”, and that text is part of its name unless you name it. Without `ariaLabel`, `ariaLabelledBy` or a field, the name is the shown text, so it changes as the button toggles: a screen reader says “No, toggle button, not pressed”, then “Yes, toggle button, pressed”. Name it for a name that says what the button is for.',
    'A name you give always ends in the shown text. A label from `ariaLabelledBy` or the field is routed as `aria-labelledby="<label> <the button’s own id>"`, so it reads the label and then the button’s own text, “Email me a receipt No”. `ariaLabel` becomes `aria-label="<ariaLabel> <shown text>"`. Without the shown text in the name, axe’s `label-content-name-mismatch` rule (WCAG 2.5.3, Label in Name) fails, and a speech-control user could not say what they see. The cost is that the name changes with the state, and that `aria-pressed` repeats it.',
    'Inside a field the field renders its label as a `span`, and the button gets `aria-labelledby` pointing at it, then at itself. A consumer’s `ariaLabelledBy` wins over the field’s label. A click on the label moves focus to the button and does not toggle it.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The button sets `aria-invalid="true"` while it is invalid, and Optimus draws a 1 px invalid border. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there.',
    'Optimus leaves a disabled button in the Tab order and never marks it `aria-disabled`: its `tabindex` stays `0` unless it is told otherwise. The component binds `tabindex="-1"` and routes `aria-disabled="true"` to the button while it is disabled, so it is skipped and announced as unavailable. That also keeps axe’s colour contrast check off the dimmed text, which WCAG exempts for an inactive component.',
    'The button is touched, for `ngModel`, `FormControl` and `[formField]`, when focus leaves it: a `focusout` on the host whose `relatedTarget` is outside the host. Optimus’s own `onBlur` is bound nowhere in its template, so the component calls the touched callback itself. Optimus also marks the control touched on every flip.',
    'Gap: Aura’s disabled fill and text colour never apply to a toggle button, because its rule is `:disabled` and a toggle button is a `span`. A disabled button is dimmed by Optimus’s opacity instead, so it looks like an enabled one, only fainter, and its pill stays.',
    'The pill, the unpicked text and the 44 / 36 / 52 px heights come from the preset-wide `togglebutton` tokens (see Styling), shared with `wj-selectbutton`: the unpicked text is 7.03:1 on the track in light and 7.76:1 in dark, the pill is 4.40:1 (light) and 4.12:1 (dark) against the track, and its white text is 4.83:1 on it.',
    'Give the host an inline size when the two labels differ in length, so the button keeps one width. A narrow container wraps a long label at its spaces and the button grows taller.',
    'The screen-reader pass (NVDA with Chrome) and the wording of the Vietnamese “Có” and “Không” are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The button’s look is the preset’s `togglebutton` tokens, shared with `wj-selectbutton` and every other toggle button of the app: heights of 44 / 36 / 52 px (the track keeps Aura’s 0.25rem padding, the pill takes the rest of the form-field padding), unpicked text in `surface.600` in light so it passes AA on the track, and the on state as a `surface.500` pill with white text in both schemes. Everything else about the button is Aura’s. The host is an inline-flex box that sizes to its button; inside a field it sits at the start. For anything else, `pt` reaches the parts of the Optimus button underneath: `root` is the button, `content` is the pill inside it and `label` is the text. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-togglebutton`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `root` lose to `id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-invalid` and `aria-disabled`, which the component routes there while they have a value. The function form of `pt` and a function per part both work.',
  parts: [
    {
      part: 'root',
      description:
        'The button: Optimus’s root element with `role="button"` and `aria-pressed`. It is the part the id and the ARIA attributes are set on, and the one the focus ring and the 1 px invalid border draw on.',
    },
    {
      part: 'content',
      description: 'The pill inside the button, filled while the button is on.',
    },
    { part: 'label', description: 'The text of the button.' },
  ],
  optimusSelector: 'p-togglebutton',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'checked',
      status: 'added',
      note: 'A `model(false)`: whether the button is on, two-way as `[(checked)]`. A `null` from a form reads as off.',
    },
    {
      optimus: 'onChange',
      weeljack: 'checkedChange',
      status: 'renamed',
      note: 'The model’s output.',
    },
    {
      optimus: 'onLabel, offLabel',
      weeljack: 'onLabel, offLabel',
      status: 'kept',
      note: 'Shown as text. Default to the translation’s `wj.toggleOn` and `wj.toggleOff`: Optimus’s “Yes” and “No”, now translated (`vi`: “Có” and “Không”). An empty string you set stays empty.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` 36 px, default 44 px, `large` 52 px. Typed `WjToggleButtonSize`.',
    },
    {
      optimus: 'disabled, invalid',
      weeljack: 'disabled, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Routed to the button through `root`, each followed by the shown text (see Accessibility). Inside a field `ariaLabelledBy` defaults to the field’s label.',
    },
    {
      optimus: 'inputId',
      weeljack: 'inputId',
      status: 'kept',
      note: 'Optimus declares it but renders no id; the wrapper routes it to the button’s `id`. Inside a field one is generated.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Routed to the `root` part. Inside a field it merges with the field’s hint and error.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjToggleButtonPt`. Tracks Optimus.',
    },
    dropped('onIcon, offIcon, iconPos, #icon', 'Icon classes and icon slots are never exposed.'),
    dropped('#content', droppedByNeed),
    dropped(
      'allowEmpty, required, name, tabindex, autofocus',
      'By need: a toggle always has a value. `tabindex` is set by the component, `-1` while disabled.',
    ),
    dropped(
      'fluid',
      'The host is the box: it sizes to its button, or to the inline size you give it.',
    ),
    dropped('styleClass, dt, unstyled, ptOptions, hostName', droppedAlways),
    dropped('p-toggleButton, p-toggle-button, ToggleButtonModule', 'Duplicates; standalone.'),
  ],
};
