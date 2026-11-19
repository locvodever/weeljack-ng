import { ColorpickerBasicExample } from '../../../examples/colorpicker/basic';
import { ColorpickerDisabledExample } from '../../../examples/colorpicker/disabled';
import { ColorpickerInAFieldExample } from '../../../examples/colorpicker/in-a-field';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'colorpicker',
  title: 'Colorpicker',
  purpose:
    'A colour picker: a 24 px swatch that shows the colour, and opens a panel with a saturation and brightness area and a hue strip. Bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is a `#rrggbb` string, and `null` until a colour is picked. The swatch is a read-only `input`: name it with `ariaLabelledBy` or `ariaLabel`, or put the picker in a `wj-field`, whose label names it and whose hint and error describe it. The panel opens inside the component, below the swatch. Use a native `<input type="color">` when the browser’s own picker is enough.',
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the swatch through `ariaLabelledBy`. The picker holds `#0f766e`. Click the swatch, or press Enter or Space on it, to open the panel; click or drag in the area and the strip, or use the arrow keys, to pick a colour. A click outside, or Escape, closes the panel.',
      sourceKey: 'colorpicker/basic',
      component: ColorpickerBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the swatch through `aria-labelledby`, which beats Optimus’s own `aria-label`, and a click on it moves focus to the swatch. The first field shows a hint; the second shows a static error, which sets `aria-invalid` and shows the message: the picker itself paints no invalid look.',
      sourceKey: 'colorpicker/in-a-field',
      component: ColorpickerInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled picker leaves the Tab order and the panel does not open. Optimus dims the swatch to 0.6 opacity and it keeps its colour: this one holds `#0f766e`.',
      sourceKey: 'colorpicker/disabled',
      component: ColorpickerDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjColorPickerHarness` from `weeljack-ng/colorpicker/testing` to read the colour (`#rrggbb`, or `null` while none is set), read the colour the swatch shows, open and close the panel, step the saturation, brightness and hue with the keys and read them back, check the disabled and invalid states, read the swatch’s id and ARIA attributes, and move focus onto the swatch and away, without touching the DOM. Find a picker by its `ariaLabel`.',
      sourceKey: 'colorpicker/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Move focus onto the swatch and off it. A disabled picker is skipped. Focus draws the family’s 2 px ring round the swatch after a key press, and not after a click. From the swatch of an open panel, Tab goes into the panel: the colour area, then the hue strip. Shift+Tab goes back, from the strip to the area to the swatch. Focus leaving the picker closes the panel.',
    },
    {
      key: 'Enter, Space',
      effect:
        'On the swatch: open the panel, and move focus to the colour area. Enter never submits a form. In an open panel, Enter closes it.',
    },
    {
      key: 'Arrow Left, Arrow Right',
      effect:
        'In the colour area: lower or raise the saturation by 1, from 0 to 100. With Shift, by 10.',
    },
    {
      key: 'Arrow Down, Arrow Up',
      effect:
        'In the colour area: lower or raise the brightness by 1, from 0 to 100. With Shift, by 10.',
    },
    {
      key: 'Arrow Up, Arrow Right; Arrow Down, Arrow Left',
      effect: 'In the hue strip: raise or lower the hue by 1, from 0 to 360.',
    },
    { key: 'Page Up, Page Down', effect: 'In the hue strip: raise or lower the hue by 10.' },
    { key: 'Home, End', effect: 'In the hue strip: the hue 0, or 360.' },
    {
      key: 'Escape',
      effect: 'Close the panel from anywhere inside it, and return focus to the swatch.',
    },
  ],
  aria: [
    'The colour area and the hue strip are `role="slider"` with `tabindex="0"`, named “Saturation and brightness” and “Hue” (from the translation’s `colorArea` and `colorHue`). The area’s `aria-valuenow` is the saturation, 0 to 100, and its `aria-valuetext` reads “Saturation 87%, brightness 46%” (`colorAreaValue`); the strip is `aria-orientation="vertical"`, 0 to 360, with the hue as `aria-valuenow`. They follow every key, drag and value you set. A routed attribute wins over the same attribute in your `pt`.',
    'The swatch is Optimus’s read-only `input`. The component gives it `role="combobox"`, because a text input may not carry `aria-expanded`, and routes the rest through `pt`: `aria-haspopup="dialog"`, `aria-expanded` (which follows the panel), `aria-controls` (the panel’s generated id, only while it is open), `aria-label` (only while `ariaLabel` is set), `aria-labelledby`, `aria-describedby` and `aria-invalid`. With no `ariaLabel`, Optimus’s own translated name, “Select a color” (“Chọn màu” in Vietnamese), stays. A routed attribute wins over the same attribute in your `pt`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Name the picker for what it sets; a screen reader then says “Accent color, combobox, collapsed”. Outside a field use `ariaLabelledBy` (the id of a visible text) or `ariaLabel`. Inside a field the field’s label names it, and a consumer’s `ariaLabelledBy` wins over it. The swatch is not labelable by `<label for>`, because Optimus always names it with `aria-label`; the field’s label is a `span`, and a click on it moves focus to the swatch.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates. The swatch sets `aria-invalid="true"` exactly while the field shows an error, so the `invalid` input is not shown there.',
    'Gap: the picker is touched earlier than the other controls. Optimus marks it touched when the swatch gains focus, not when focus leaves it, and the component keeps that. A validator message that shows on touched will show as soon as the user tabs onto the swatch.',
    'Gap: a `null` value shows Optimus’s default red swatch, while the model and the harness read `null`. Pick a colour, or bind a value, to show the real state; no example here starts at `null`.',
    'Gap: the picker paints no invalid look. Optimus 2.0.2 has no invalid style for the swatch, so `invalid` and a field’s error set `aria-invalid` and the field’s message shows, but the swatch does not change. Pair the picker with the field’s error text, which is how the In a field example shows it.',
    'A value that is not a `#rrggbb` colour shows whatever Optimus makes of it, a black or invalid swatch, and throws nothing; the picker never renders the string as HTML.',
    'The swatch is a 24 px hit box with a 1 px inset boundary in the field-border colour, 4.83:1 on cards in light and 3.67:1 on a dark card, so a colour near its background still shows. The panel is Optimus’s own dark panel in both schemes, with white handles.',
    'The panel opens with Optimus’s motion, which the component marks safe: it is skipped under `prefers-reduced-motion: reduce`, and the swatch’s own transitions are 0 s then.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The preset’s `colorpicker` tokens are Aura’s: a 24 px preview with the field radius, and a dark panel with white handles in both schemes. The host is `inline-block`, so its box is the swatch. The component adds a 1 px inset boundary to the swatch in `--wj-form-field-border-color`, which Optimus’s own focus rule replaces while the swatch is focused. For anything else, `pt` reaches the parts of the Optimus colour picker underneath: `root`, `preview`, `panel`, `content`, `colorSelector`, `colorBackground`, `colorHandle`, `hue` and `hueHandle`. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-colorpicker`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. The area and the strip take the same ring in white, because the ink ring is invisible on the dark panel. `pt` attributes on `preview` lose to `role`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-invalid` and (while `ariaLabel` is set) `aria-label`, on `panel` to `id`, and on `colorSelector` and `hue` to the slider role, name, range and value attributes, which the component routes there. The function form of `pt` and a function per part both work.',
  parts: [
    { part: 'root', description: 'Optimus’s root element, which holds the swatch and the panel.' },
    {
      part: 'preview',
      description:
        'The swatch, a read-only `input` and the one focusable part: where the component routes the role, the name, the description, the invalid state and the popup state.',
    },
    {
      part: 'panel',
      description: 'The dark panel that opens below the swatch. It takes the generated id.',
    },
    { part: 'content', description: 'The panel’s positioned content box.' },
    {
      part: 'colorSelector',
      description:
        'The 150 px colour area: saturation by brightness. A focusable slider; it takes the slider attributes.',
    },
    { part: 'colorBackground', description: 'The area’s gradient.' },
    { part: 'colorHandle', description: 'The ring that marks the picked point in the area.' },
    {
      part: 'hue',
      description: 'The 17 px hue strip. A focusable slider; it takes the slider attributes.',
    },
    { part: 'hueHandle', description: 'The bar that marks the hue on the strip.' },
  ],
  optimusSelector: 'p-colorpicker',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<string | null>(null)`, two-way as `[(value)]`, a `#rrggbb` string. A `null` shows Optimus’s default red swatch until a colour is picked.',
    },
    {
      optimus: 'onChange',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output. It fires with the new `#rrggbb` string on every change.',
    },
    dropped(
      'format',
      'By need: hex only. `rgb` and `hsb` would add object value types later, without breaking.',
    ),
    dropped('inline', 'By need: the popup form only.'),
    dropped('defaultColor', 'By need.'),
    {
      optimus: 'disabled, invalid',
      weeljack: 'disabled, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. Invalid is routed as `aria-invalid`; there is no invalid look.',
    },
    {
      optimus: 'inputId',
      weeljack: 'inputId',
      status: 'kept',
      note: 'Optimus binds it on the swatch. Inside a field one is generated.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the swatch (the `preview` part). With none set, Optimus’s `aria.selectColor` names it. Inside a field `ariaLabelledBy` defaults to the field’s label and `ariaDescribedBy` merges with the field’s hint and error.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjColorPickerPt`. Tracks Optimus.',
    },
    dropped(
      'onShow, onHide',
      'By need; they would be named `opened` and `closed` when a use appears.',
    ),
    dropped(
      'appendTo, overlayOptions, motionOptions, showTransitionOptions, hideTransitionOptions, autoZIndex',
      'The component fixes the overlay: it opens inside the host, with motion marked safe.',
    ),
    dropped('tabindex, autofocus, required, name', 'By need.'),
    dropped(
      'styleClass, dt, unstyled, ptOptions, p-colorPicker, p-color-picker, ColorPickerModule',
      droppedAlways,
    ),
  ],
};
