import { InputNumberBasicExample } from '../../../examples/inputnumber/basic';
import { InputNumberCurrencyExample } from '../../../examples/inputnumber/currency';
import { InputNumberDecimalsExample } from '../../../examples/inputnumber/decimals';
import { InputNumberDisabledExample } from '../../../examples/inputnumber/disabled';
import { InputNumberInAFieldExample } from '../../../examples/inputnumber/in-a-field';
import { InputNumberMinMaxAndSpinButtonsExample } from '../../../examples/inputnumber/min-max-and-spin-buttons';
import { InputNumberPrefixAndSuffixExample } from '../../../examples/inputnumber/prefix-and-suffix';
import { InputNumberSignalFormsExample } from '../../../examples/inputnumber/signal-forms';
import { InputNumberSizesExample } from '../../../examples/inputnumber/sizes';
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
  entry: 'inputnumber',
  title: 'Input number',
  purpose:
    'A number input, 44 px tall by default, that formats the number as you type, steps it with the arrow keys and keeps it between `min` and `max`. `value` is a `number`, or `null` while the box is empty: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. Optional minus and plus buttons sit before and after the input for the mouse and touch. Inside a field, the input is named, described and marked invalid by it.',
  optimusSelector: 'p-inputNumber',
  examples: [
    {
      title: 'Basic',
      description:
        'Pair `inputId` with your own `<label for>`. The value is a plain `number`, and `null` while the box is empty. The line below only shows what the two-way binding holds.',
      sourceKey: 'inputnumber/basic',
      component: InputNumberBasicExample,
    },
    {
      title: 'Decimals',
      description:
        '`minFractionDigits` and `maxFractionDigits` set the decimal places, and `step` sets what the arrow keys change the number by. A number never has more places than `maxFractionDigits`.',
      sourceKey: 'inputnumber/decimals',
      component: InputNumberDecimalsExample,
    },
    {
      title: 'Currency',
      description:
        '`mode="currency"` needs `currency`, an ISO 4217 code such as `VND`, and `locale`, a BCP 47 tag such as `vi-VN`, which sets the separators and where the symbol goes. WeeljackNg sets no `LOCALE_ID`: pass the locale you want. The value stays a plain number, `125000` here.',
      sourceKey: 'inputnumber/currency',
      component: InputNumberCurrencyExample,
    },
    {
      title: 'Min, max and spin buttons',
      description:
        '`showButtons` adds a minus button before the input and a plus button after it, each as tall as the control and 40 px wide. They stop at `min` and `max`. They are for the mouse and touch only: see Accessibility for the keyboard.',
      sourceKey: 'inputnumber/min-max-and-spin-buttons',
      component: InputNumberMinMaxAndSpinButtonsExample,
    },
    {
      title: 'Prefix and suffix',
      description:
        '`prefix` and `suffix` are text inside the value, in the same colour and size, such as a unit. Put the space in the text: `suffix=" kg"`. They render as text, never as HTML.',
      sourceKey: 'inputnumber/prefix-and-suffix',
      component: InputNumberPrefixAndSuffixExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field, and the input is described by them. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'inputnumber/in-a-field',
      component: InputNumberInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled input leaves the Tab order and cannot be edited, and its spin buttons take the same disabled look.',
      sourceKey: 'inputnumber/disabled',
      component: InputNumberDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall, and the spin buttons grow with the control. Bind `[size]` or write it as a plain attribute.',
      sourceKey: 'inputnumber/sizes',
      component: InputNumberSizesExample,
    },
    {
      title: 'Signal forms',
      description:
        'With `[formField]`, the schema’s `min` and `max` also reach the input, so the arrow keys and the spin buttons stop at 1 and 10. The error shows once the input is touched, or on Save.',
      sourceKey: 'inputnumber/signal-forms',
      component: InputNumberSignalFormsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputNumberHarness` from `weeljack-ng/inputnumber/testing` to type a number, step it with the arrow keys, commit it, and read the shown text, the number, the range and the disabled, required and invalid states without touching the DOM.',
      sourceKey: 'inputnumber/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the input and away from it.' },
    {
      key: 'ArrowUp, ArrowDown',
      effect: 'Raises or lowers the number by `step`, and keeps it between `min` and `max`.',
    },
    {
      key: 'Home, End',
      effect:
        'Goes to `min` or `max`, when it is set. Nothing happens when it is `0`: see Accessibility.',
    },
    {
      key: 'Enter, Tab',
      effect: 'Commits what was typed and formats it, clamped to `min` and `max`.',
    },
    {
      key: 'Digits, the minus sign, the decimal separator',
      effect:
        'Types into the number at the caret. Any other character is dropped, and the separators stay in place.',
    },
    {
      key: 'Backspace, Delete',
      effect: 'Removes the digit before or after the caret and skips over a group separator.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The input is not in the Tab order and cannot be edited.',
    },
  ],
  aria: [
    'The focusable element is a native `input` with `role="spinbutton"`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-inputnumber`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Always give the input an accessible name: a field label, your own `<label for>` that matches `inputId`, `ariaLabel` or `ariaLabelledBy`. A placeholder is not a name.',
    'The input says its value and its range: `aria-valuenow` follows the number, and `aria-valuemin` and `aria-valuemax` follow `min` and `max`. A schema’s `min` and `max` reach them through `[formField]`.',
    'Inside a `wj-field` the input is named by the field’s label: `<label for>` points at the input’s `id`, which is your `inputId` or a generated one. `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The spin buttons are for the mouse and touch only. Optimus hides them from assistive technology (`aria-hidden="true"`) and keeps them out of the Tab order (`tabindex="-1"`), so a keyboard or screen-reader user steps the number with ArrowUp and ArrowDown, which the input announces. The buttons draw a minus and a plus, and are 40 px wide and as tall as the control.',
    'Gap: Home and End do nothing when `min` or `max` is `0`, because Optimus tests the value for truthiness. Use a range that does not end at `0`, or let the user type the number.',
    'A lone minus sign stays on screen while the user types it, and the form value is `null` until a digit follows. On blur an incomplete number is cleared.',
    '`currency` and `locale` are codes, not text. A code `Intl.NumberFormat` does not know makes it throw a `RangeError`, which WeeljackNg never catches.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the release that carries this entry.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, and the Optimus root and input inside it stretch to the host’s width, so size the control with `class` or `style` on `wj-inputnumber`. With `showButtons` the buttons are joined to the input, 40 px wide and as tall as the control, with the outer corners rounded. The focused input is drawn above them so its ring is whole. The glyphs take the muted text colour, and a disabled control gives its buttons the disabled fill. For anything else, `pt` reaches the parts of the Optimus input underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-inputnumber`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `pcInputText.root` lose to `aria-invalid`, which the component routes there. The buttons’ glyphs are the component’s own, so Optimus’s `incrementButtonIcon` and `decrementButtonIcon` parts are not rendered, and neither are `buttonGroup` and `clearIcon`.',
  parts: [
    { part: 'root', description: 'The Optimus root element, around the input and the buttons.' },
    {
      part: 'pcInputText',
      description:
        'The nested input pass-through. Its `root` is the native `input`, the focusable element.',
    },
    { part: 'incrementButton', description: 'The plus button, shown with `showButtons`.' },
    { part: 'decrementButton', description: 'The minus button, shown with `showButtons`.' },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<number | null>(null)`: the source of truth, two-way as `[(value)]`. `valueChange` is the change output.',
    },
    {
      optimus: 'onInput',
      weeljack: 'None',
      status: 'dropped',
      note: '`valueChange` covers it. The raw keystroke event is by need.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. `required` lands on the input.',
    },
    {
      optimus: 'inputId, ariaLabel, ariaLabelledBy, ariaDescribedBy',
      weeljack: 'inputId, ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'kept',
      note: 'Set on the `input`. `ariaDescribedBy` is merged with the field’s hint and error ids.',
    },
    {
      optimus: 'placeholder',
      weeljack: 'placeholder',
      status: 'kept',
      note: 'Rendered as an attribute.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` or `large`: 36 or 52 px against 44 px.',
    },
    {
      optimus: 'min, max, step',
      weeljack: 'min, max, step',
      status: 'kept',
      note: 'They set `aria-valuemin` and `aria-valuemax`. `[formField]` pushes a schema’s `min` and `max` into them.',
    },
    {
      optimus: 'mode, currency, locale',
      weeljack: 'mode, currency, locale',
      status: 'kept',
      note: '`mode` is `decimal` or `currency`. `currency` and `locale` are `Intl.NumberFormat` codes; WeeljackNg sets no `LOCALE_ID`.',
    },
    {
      optimus: 'minFractionDigits, maxFractionDigits',
      weeljack: 'minFractionDigits, maxFractionDigits',
      status: 'kept',
      note: 'The decimal places.',
    },
    {
      optimus: 'prefix, suffix',
      weeljack: 'prefix, suffix',
      status: 'kept',
      note: 'Text inside the value, such as "₫" or " kg".',
    },
    {
      optimus: 'showButtons',
      weeljack: 'showButtons',
      status: 'kept',
      note: 'The spin buttons, always in the horizontal layout.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjInputNumberPt`. Tracks Optimus. `pcInputText` reaches the native input.',
    },
    {
      optimus: 'onFocus, onBlur, onKeyDown',
      weeljack: 'native focusin, focusout, keydown',
      status: 'renamed',
      note: 'No `on` outputs: listen to the native events on the host.',
    },
    dropped(
      'buttonLayout',
      'Fixed to `horizontal`. Optimus’s stacked default splits the 44 px control into two 22 px targets, under the 24 px floor.',
    ),
    dropped('useGrouping, format, allowEmpty, localeMatcher, currencyDisplay', droppedByNeed),
    dropped(
      'readonly, autocomplete, name, tabindex, title, ariaRequired, autofocus',
      'By need. `required` gives the input `required`, and `wjAutoFocus` covers autofocus.',
    ),
    dropped('showClear, onClear, #clearicon', 'By need. Icon slots are not exposed.'),
    dropped(
      'incrementButtonIcon, decrementButtonIcon, #incrementbuttonicon, #decrementbuttonicon',
      'Icon slots are never exposed: the buttons draw a minus and a plus.',
    ),
    dropped('variant, fluid, inputSize, pattern, minlength, maxlength', droppedByNeed),
    dropped(
      'incrementButtonClass, decrementButtonClass, inputStyle, inputStyleClass, styleClass, dt, unstyled, ptOptions',
      droppedAlways,
    ),
    dropped(
      'p-inputNumber, p-input-number, InputNumberModule, the public methods',
      'Duplicate selectors; standalone; by need.',
    ),
  ],
};
