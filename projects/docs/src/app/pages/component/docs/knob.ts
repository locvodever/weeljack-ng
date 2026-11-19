import { KnobBasicExample } from '../../../examples/knob/basic';
import { KnobDiameterExample } from '../../../examples/knob/diameter';
import { KnobInAFieldExample } from '../../../examples/knob/in-a-field';
import { KnobRangeAndStepExample } from '../../../examples/knob/range-and-step';
import { KnobReadOnlyAndDisabledExample } from '../../../examples/knob/read-only-and-disabled';
import { KnobValueTemplateExample } from '../../../examples/knob/value-template';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'knob',
  title: 'Knob',
  purpose:
    'A round dial: a 270 degree arc filled up to a number between `min` and `max` (0 and 100 by default), with the number shown in the middle. Drag round the arc or click on it, or use the keys. Bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is a `number`, and `null` until it is set, which shows `min`. The dial is the one focusable element, a `role="slider"`: name it with `ariaLabelledBy` or `ariaLabel`, or put the knob in a `wj-field`, whose label names it and whose hint and error describe it. Use `wj-slider` for a straight track, and `wj-inputnumber` when the user should type the number.',
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the dial through `ariaLabelledBy`. The knob runs 0 to 100 and starts at 50. Drag round the arc, click on it, or use the arrow keys, Page Up, Page Down, Home and End.',
      sourceKey: 'knob/basic',
      component: KnobBasicExample,
    },
    {
      title: 'Range and step',
      description:
        'The `min`, `max` and `step` inputs set the range and the grid the value moves on, from `min`. With `min="16"`, `max="30"` and `step="2"`, an arrow key moves the value by 2, Page Up and Page Down by 20 (clamped to the range), and a click or a drag snaps to a multiple of 2 from 16.',
      sourceKey: 'knob/range-and-step',
      component: KnobRangeAndStepExample,
    },
    {
      title: 'Value template',
      description:
        'The `valueTemplate` input is the text in the middle, with `{value}` replaced by the number: here `{value}%`. It is rendered as text, never as HTML. Keep it to about five characters at the default diameter: a longer one runs onto the arcs. `showValue="false"` hides the text; the dial still announces its value.',
      sourceKey: 'knob/value-template',
      component: KnobValueTemplateExample,
    },
    {
      title: 'Diameter',
      description:
        'The `diameter` input sets the width and height of the dial in CSS pixels, 100 by default. The arcs and the text scale with it. The host is exactly that square, so a caption sits right under it. Each caption here names its dial through `ariaLabelledBy`. Keep the diameter at 24 px or more.',
      sourceKey: 'knob/diameter',
      component: KnobDiameterExample,
    },
    {
      title: 'Read-only and disabled',
      description:
        'A read-only knob shows its value and cannot be changed, and looks unchanged; it leaves the Tab order and sets `aria-readonly`. A disabled knob leaves the Tab order too, sets `aria-disabled`, and Optimus dims it to 0.6 opacity. Neither reacts to a key, a click or a drag. The first holds 72 and shows `{value}%`; the second holds 30.',
      sourceKey: 'knob/read-only-and-disabled',
      component: KnobReadOnlyAndDisabledExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the dial through `aria-labelledby`, and a click on it moves focus to the dial. The first field shows a hint; the second shows a static error, which sets `aria-invalid` and shows the message: the knob itself paints no invalid look.',
      sourceKey: 'knob/in-a-field',
      component: KnobInAFieldExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjKnobHarness` from `weeljack-ng/knob/testing` to read the value, `min`, `max` and the shown text, move the knob with the keys a user would press (a step up or down N times, a page up or down, to `min` or `max`), check the disabled, read-only and invalid states, read the dial’s id and ARIA attributes, and move focus onto the dial and away, without touching the DOM. Find a knob by its `ariaLabel`.',
      sourceKey: 'knob/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Move focus onto the dial and off it. A read-only or disabled knob is skipped. Focus draws the family’s 2 px ring round the dial, after a key press and not after a click.',
    },
    { key: 'Arrow Right, Arrow Up', effect: 'Add one `step`.' },
    { key: 'Arrow Left, Arrow Down', effect: 'Take one `step`.' },
    { key: 'Page Up', effect: 'Add ten steps, up to `max`.' },
    { key: 'Page Down', effect: 'Take ten steps, down to `min`.' },
    { key: 'Home', effect: 'Go to `min`.' },
    { key: 'End', effect: 'Go to `max`.' },
    {
      key: 'Any key, while read-only or disabled',
      effect: 'The dial is not in the Tab order and the value does not change.',
    },
  ],
  aria: [
    'The dial is Optimus’s `svg` with `role="slider"`, `aria-valuemin`, `aria-valuenow` and `aria-valuemax`. The component routes the rest to it through `pt`: `id` (from `inputId`, or generated inside a field), `aria-describedby`, `aria-invalid`, `aria-disabled` while disabled and `aria-readonly` while read-only. It never routes `aria-valuenow`: Optimus keeps it current. A routed attribute wins over the same attribute in your `pt`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Name the knob for what it sets; a screen reader then says “Volume, slider, 50”. Outside a field use `ariaLabelledBy` (the id of a visible text) or `ariaLabel`. Inside a field the field’s label names it, and a consumer’s `ariaLabelledBy` wins over it. The knob is not labelable by `<label for>`, because the dial is an `svg`; the field’s label is a `span`, and a click on it moves focus to the dial.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates. The dial sets `aria-invalid="true"` exactly while the field shows an error, so the `invalid` input is not shown there.',
    'The knob is touched, for `ngModel`, `FormControl` and `[formField]`, when focus leaves it: a `focusout` on the host whose `relatedTarget` is outside the host. Optimus never marks a knob touched itself, so a key, a drag or a click does not touch it until focus moves on.',
    'The keys follow one map, which Optimus’s own do not (Optimus moves by 1 and 10 whatever `step` is): the component handles these keys first, stops Optimus’s handler and the page from scrolling, and writes through Optimus’s `updateModelValue`. Values clamp to `min` and `max` and snap to the step grid from `min`. A modified key (Alt, Ctrl or Meta) is left to the browser.',
    '`null` shows `min` in the arc and the text, and `aria-valuenow` reads `min`. The form keeps `null` until the user changes the value.',
    'A `[formField]` schema’s `min` and `max` rules are pushed into the `min` and `max` inputs, so the dial’s range follows the validators.',
    'Gap: a knob paints no invalid look. Optimus 2.0.2 has no invalid rule for it, so `invalid` and a field’s error set `aria-invalid` and the field’s message shows, but the arcs do not change. Pair the knob with the field’s error text, which is how the In a field example shows it.',
    'Gap: a read-only knob is out of the Tab order (Optimus sets `tabindex="-1"` on it), so a keyboard user does not reach it. A screen reader user reads it in browse mode, where it is announced with `aria-readonly` and its value.',
    'The dial is the `diameter` square, 100 px by default, well above the 24 px hit box. The range arc is 4.83:1 on cards in light and 3.67:1 in dark; the value arc is 4.12:1 on the range arc in light and 4.63:1 in dark; the text is 4.83:1 in light and 6.91:1 in dark.',
    'Motion: the dial’s own colour changes follow `--wj-transition-duration`, which is 0 under `prefers-reduced-motion: reduce`. The range arc has a 0.1 s stroke fade of its own in Optimus, which the component also turns off under reduced motion.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The preset’s `knob` token moves the range arc from Aura’s border colour to `surface.500`, so the dial reaches 3:1 on a card; the value arc is the primary colour and the text the muted text colour. The host is inline-level and exactly the `diameter` square, with no gap under the dial. For anything else, `pt` reaches the parts of the Optimus knob underneath: `svg` is the dial and the one focusable part, `range` the full arc, `value` the filled arc, and `text` the number in the middle. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-knob`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `svg` lose to `id`, `aria-describedby`, `aria-invalid`, `aria-disabled` and `aria-readonly`, which the component routes there while they have a value. The function form of `pt` and a function per part both work.',
  parts: [
    {
      part: 'svg',
      description:
        'The dial, a `role="slider"` and the one focusable part: where the component routes the id, the description, the invalid state, `aria-disabled` and `aria-readonly`.',
    },
    { part: 'range', description: 'The full 270 degree arc, behind the value.' },
    { part: 'value', description: 'The filled arc, from the start to the value.' },
    { part: 'text', description: 'The number in the middle, from `valueTemplate`.' },
  ],
  customProperties: [
    {
      name: '--wj-knob-value-background',
      defaultValue: 'var(--wj-primary-color)',
      description: 'The colour of the value arc.',
    },
    {
      name: '--wj-knob-range-background',
      defaultValue: 'var(--wj-surface-500)',
      description: 'The colour of the full arc behind the value.',
    },
    {
      name: '--wj-knob-text-color',
      defaultValue: 'var(--wj-text-muted-color)',
      description: 'The colour of the number in the middle.',
    },
  ],
  optimusSelector: 'p-knob',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<number | null>(null)`, two-way as `[(value)]`. `null` shows `min` and the form keeps `null` until the user changes it.',
    },
    {
      optimus: 'onChange',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output. It fires once per change, with the new number.',
    },
    {
      optimus: 'min, max, step',
      weeljack: 'min, max, step',
      status: 'kept',
      note: 'Default 0, 100 and 1. `step` accepts a static attribute (`step="2"`) and drives the keys and the click and drag snap. A `[formField]` schema’s `min` and `max` are pushed in here.',
    },
    {
      optimus: 'readonly',
      weeljack: 'readonly',
      status: 'kept',
      note: 'Angular’s form-state name. Accepts a bare attribute. Routed as `aria-readonly`.',
    },
    {
      optimus: 'disabled, invalid',
      weeljack: 'disabled, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. Invalid is routed as `aria-invalid`; there is no invalid look.',
    },
    {
      optimus: 'size',
      weeljack: 'diameter',
      status: 'renamed',
      note: 'The width and height of the dial in CSS pixels, default 100. `size` stays free for a `small` or `large` choice.',
    },
    {
      optimus: 'showValue',
      weeljack: 'showValue',
      status: 'kept',
      note: 'Default `true`. Accepts a bare attribute.',
    },
    {
      optimus: 'valueTemplate',
      weeljack: 'valueTemplate',
      status: 'kept',
      note: 'Default `{value}`. Rendered as text in the `svg`, never as HTML.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the dial. Inside a field `ariaLabelledBy` defaults to the field’s label.',
    },
    {
      optimus: 'None',
      weeljack: 'inputId, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the dial (the `svg` part). Inside a field `ariaDescribedBy` merges with the field’s hint and error, and an id is generated.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjKnobPt`. Tracks Optimus.',
    },
    dropped(
      'valueColor, rangeColor, textColor',
      'Colour comes from `--wj-knob-value-background`, `--wj-knob-range-background` and `--wj-knob-text-color`, or from `pt`.',
    ),
    dropped('strokeWidth', 'By need.'),
    dropped('tabindex, required, name', 'By need.'),
    dropped('styleClass, dt, unstyled, ptOptions, KnobModule', droppedAlways),
  ],
};
