import { SliderBasicExample } from '../../../examples/slider/basic';
import { SliderDisabledExample } from '../../../examples/slider/disabled';
import { SliderInAFieldExample } from '../../../examples/slider/in-a-field';
import { SliderStepsExample } from '../../../examples/slider/steps';
import { SliderVerticalExample } from '../../../examples/slider/vertical';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'slider',
  title: 'Slider',
  purpose:
    'A single-handle slider: a track, a range filled up to a 24 px handle, and a number between `min` and `max` (0 and 100 by default). Drag the handle or click the track, or use the keys. Bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is a `number`, and `null` until it is set, which shows the handle at `min`. The handle is the one focusable element, a `role="slider"`: name it with `ariaLabelledBy` or `ariaLabel`, or put the slider in a `wj-field`, whose label names it and whose hint and error describe it. Use `wj-inputnumber` when the user should type the number, and `wj-knob` for a round dial.',
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the handle through `ariaLabelledBy`. The slider runs 0 to 100 and starts at 40. Drag the handle, click the track, or use the arrow keys, Page Up, Page Down, Home and End.',
      sourceKey: 'slider/basic',
      component: SliderBasicExample,
    },
    {
      title: 'Steps',
      description:
        'The `step` input sets the grid the value moves on, from `min`. With `step="5"` an arrow key moves the value by 5, Page Up and Page Down by 50, and a drag snaps to a multiple of 5.',
      sourceKey: 'slider/steps',
      component: SliderStepsExample,
    },
    {
      title: 'Vertical',
      description:
        'With `orientation="vertical"` the track runs bottom to top. A vertical slider needs a height: this one sets `block-size: 12rem` on the host from the example’s own styles. The key map does not change, so Arrow Up still adds.',
      sourceKey: 'slider/vertical',
      component: SliderVerticalExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the handle through `aria-labelledby`, and a click on it moves focus to the handle. The host keeps room for the 24 px handle, so it never covers the hint above or the error below. The first field shows a hint; the second shows a static error, which sets `aria-invalid` and shows the message: the slider itself paints no invalid look. Both set `min` and `max`.',
      sourceKey: 'slider/in-a-field',
      component: SliderInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled slider leaves the Tab order and ignores every key, click and drag. Optimus dims it to 0.6 opacity and the handle keeps its place, so the held value still shows: this one holds 40.',
      sourceKey: 'slider/disabled',
      component: SliderDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSliderHarness` from `weeljack-ng/slider/testing` to read the value, `min`, `max` and orientation, move the slider with the keys a user would press (a step up or down N times, a page up or down, to `min` or `max`), check the disabled and invalid states, read the handle’s id and ARIA attributes, and move focus onto the handle and away, without touching the DOM. Find a slider by its `ariaLabel`.',
      sourceKey: 'slider/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Move focus onto the handle and off it. A disabled slider is skipped. Focus draws the family’s 2 px ring round the handle, after a key press and not after a click.',
    },
    {
      key: 'Arrow Right, Arrow Up',
      effect:
        'Add one `step`. The orientation does not change the keys: Arrow Up adds on a vertical slider too.',
    },
    { key: 'Arrow Left, Arrow Down', effect: 'Take one `step`.' },
    { key: 'Page Up', effect: 'Add ten steps, up to `max`.' },
    { key: 'Page Down', effect: 'Take ten steps, down to `min`.' },
    { key: 'Home', effect: 'Go to `min`.' },
    { key: 'End', effect: 'Go to `max`.' },
    {
      key: 'Any key, while disabled',
      effect: 'The handle is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The handle is Optimus’s `span` with `role="slider"`, `aria-valuemin`, `aria-valuenow`, `aria-valuemax` and `aria-orientation`. The component routes the rest to it through `pt`: `id` (from `inputId`, or generated inside a field), `aria-describedby`, `aria-invalid`, and `aria-disabled` while disabled. It never routes `aria-valuenow`: Optimus keeps it current. A routed attribute wins over the same attribute in your `pt`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Name the slider for what it sets; a screen reader then says “Volume, slider, 40”. Outside a field use `ariaLabelledBy` (the id of a visible text) or `ariaLabel`. Inside a field the field’s label names it, and a consumer’s `ariaLabelledBy` wins over it. The slider is not labelable by `<label for>`, because the handle is a `span`; the field’s label is a `span` too, and a click on it moves focus to the handle.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates. The handle sets `aria-invalid="true"` exactly while the field shows an error, so the `invalid` input is not shown there.',
    'The slider is touched, for `ngModel`, `FormControl` and `[formField]`, when focus leaves it: a `focusout` on the host whose `relatedTarget` is outside the host. Optimus never marks a slider touched itself, so a key, a drag or a click on the track does not touch it until focus moves on.',
    'The keys follow one map, which Optimus’s own do not (with `step` set, Optimus moves a page by a single step): the component handles these keys first, stops Optimus’s handler and the page from scrolling, and writes through Optimus’s `updateValue`. Values clamp to `min` and `max` and snap to the step grid from `min`. A modified key (Alt, Ctrl or Meta) is left to the browser, so Alt+Arrow still goes back.',
    '`null` shows the handle at `min`, identical to a value of `min`, and `aria-valuenow` reads `min`. The form keeps `null` until the user moves the handle. Optimus would show a `null` at 0, off the track for a `min` above 0.',
    'A `[formField]` schema’s `min` and `max` rules are pushed into the `min` and `max` inputs, over a value set in the template, so the handle’s range follows the validators.',
    'A vertical slider needs a height on its host, which the Vertical example sets from its own styles; Optimus gives the track at least 100 px, and the track fills the host’s height less the room for the handle.',
    'Gap, fixed: while a slider is invalid (`invalid`, or a field’s error), the handle’s ring turns the invalid colour, at rest and under the pointer (4.83:1 on the handle’s face in light, 7.19:1 in dark). Optimus 2.0.2 has no invalid rule for it, so the preset’s `@layer wj` rule keys on `aria-invalid`. The track and the range stay as they are, because a red track would put the dark primary range under 3:1. Still pair the slider with the field’s error text, which is how the In a field example shows it.',
    'The handle is a 24 px hit box. The track and the handle’s ring are 4.83:1 on cards and 4.63:1 on the page in light, and 3.67:1 and 4.12:1 in dark. The ring under the pointer is 7.73:1 in light and 6.91:1 in dark. The range is 4.12:1 on the track in light and 4.63:1 in dark.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The preset’s `slider` tokens make the handle 24 px with a 20 px face, and move the track and the handle’s ring from Aura’s border colour to `surface.500`, so a thin line reaches 3:1; with Noir the range is the ink primary, and with an app’s own `primary` it is ink (`surface.950`) in light and the primary’s 200 step in dark, so it clears 3:1 on the track (named palettes: at least 4.12:1 in light, at least 3.18:1 in dark). The host is a block that keeps room for the handle as padding, worked out from `--wj-slider-handle-height`, `--wj-slider-handle-width` and `--wj-slider-track-size`, so the handle stays inside the host at `min` and `max` and never covers a field’s hint or error. The handle does not glide: it moves with the pointer. For anything else, `pt` reaches the parts of the Optimus slider underneath: `root` is the track, `range` the filled part, and `handle` the draggable handle. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-slider`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `handle` lose to `id`, `aria-describedby`, `aria-invalid` and `aria-disabled`, which the component routes there while they have a value. The function form of `pt` and a function per part both work.',
  parts: [
    {
      part: 'root',
      description: 'The track: Optimus’s root element, which holds the range and the handle.',
    },
    { part: 'range', description: 'The filled part of the track, from the start to the handle.' },
    {
      part: 'handle',
      description:
        'The draggable handle, a `role="slider"` span and the one focusable part: where the component routes the id, the description, the invalid state and `aria-disabled`.',
    },
  ],
  optimusSelector: 'p-slider',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<number | null>(null)`, two-way as `[(value)]`. `null` shows the handle at `min` and the form keeps `null` until the user moves it.',
    },
    {
      optimus: 'onChange',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output. It fires once per change, with the new number.',
    },
    {
      optimus: 'min, max',
      weeljack: 'min, max',
      status: 'kept',
      note: 'Default 0 and 100. A `[formField]` schema’s `min` and `max` are pushed in here.',
    },
    {
      optimus: 'step',
      weeljack: 'step',
      status: 'kept',
      note: 'Default 1. Accepts a static attribute (`step="5"`). It drives the keys and the drag snap.',
    },
    {
      optimus: 'orientation',
      weeljack: 'orientation',
      status: 'kept',
      note: "`WjSliderOrientation`: `'horizontal'` (default) or `'vertical'`. A vertical slider needs a height on its host.",
    },
    {
      optimus: 'disabled, invalid',
      weeljack: 'disabled, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. Invalid is routed as `aria-invalid`; there is no invalid look.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the handle. Inside a field `ariaLabelledBy` defaults to the field’s label.',
    },
    {
      optimus: 'None',
      weeljack: 'inputId, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the handle (the `handle` part). Inside a field `ariaDescribedBy` merges with the field’s hint and error, and an id is generated.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjSliderPt`. Tracks Optimus.',
    },
    dropped(
      'range',
      'By need. A two-handle model is a second value type, which can be added later without breaking.',
    ),
    dropped('onSlideEnd', 'By need; it would be named `slideEnd` when a use appears.'),
    dropped('animate', 'By need: the handle does not glide, and a click on the track jumps.'),
    dropped(
      'tabindex, autofocus, required, name',
      'By need: a slider always has a value, and takes no tab index of its own.',
    ),
    dropped('styleClass, dt, unstyled, ptOptions, SliderModule', droppedAlways),
  ],
};
