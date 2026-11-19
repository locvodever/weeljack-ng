import { InputOtpBasicExample } from '../../../examples/inputotp/basic';
import { InputOtpDisabledExample } from '../../../examples/inputotp/disabled';
import { InputOtpInAFieldExample } from '../../../examples/inputotp/in-a-field';
import { InputOtpMaskedExample } from '../../../examples/inputotp/masked';
import { InputOtpSixDigitsExample } from '../../../examples/inputotp/six-digits';
import { InputOtpSizesExample } from '../../../examples/inputotp/sizes';
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
  entry: 'inputotp',
  title: 'Input OTP',
  purpose:
    'A one-time-code input: one box for each character, 40 × 44 px by default, which moves to the next box as you type and takes a pasted code whole. `value` is the characters joined, and `null` while every box is empty: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. The group is named by the field label or by `ariaLabelledBy` or `ariaLabel`, and every box is named from the translation. Inside a field, the boxes are described and marked invalid by it.',
  optimusSelector: 'p-inputotp',
  examples: [
    {
      title: 'Basic',
      description:
        'Outside a field, name the group: a visible element whose `id` goes in `ariaLabelledBy`, as here, or `ariaLabel`. The default is four boxes. The line below only shows what the two-way binding holds.',
      sourceKey: 'inputotp/basic',
      component: InputOtpBasicExample,
    },
    {
      title: 'Six digits',
      description:
        '`length` sets the number of boxes, and `integerOnly` accepts digits only and shows the numeric keypad. A pasted code is cut to `length`, and a code with a letter in it is refused under `integerOnly`. Say the length in the hint.',
      sourceKey: 'inputotp/six-digits',
      component: InputOtpSixDigitsExample,
    },
    {
      title: 'Masked',
      description:
        '`mask` hides each character, as a password does. The value is still the plain characters, so mask a PIN, not something the app must show back.',
      sourceKey: 'inputotp/masked',
      component: InputOtpMaskedExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label names the group, the first box takes the generated id, and the hint and error describe every box. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'inputotp/in-a-field',
      component: InputOtpInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'Every box of a disabled group leaves the Tab order and cannot be edited, and the code stays visible.',
      sourceKey: 'inputotp/disabled',
      component: InputOtpDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` boxes are 32 × 36 px, the default 40 × 44 px and `large` 48 × 52 px, 8 px apart at every size. Bind `[size]` or write it as a plain attribute.',
      sourceKey: 'inputotp/sizes',
      component: InputOtpSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputOtpHarness` from `weeljack-ng/inputotp/testing` to type or paste a code, and to read the characters, the number of boxes, every box’s name, the group’s name and the disabled, required and invalid states without touching the DOM.',
      sourceKey: 'inputotp/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect: 'Moves to the next or the previous box. Every box is a tab stop.',
    },
    { key: 'A character', effect: 'Fills the box, replacing what it held, and moves to the next.' },
    {
      key: 'Backspace',
      effect:
        'Empties the box and moves to the previous one. On an empty box it only moves to the previous one.',
    },
    { key: 'Delete', effect: 'Empties the box and moves to the next one.' },
    { key: 'ArrowLeft, ArrowRight', effect: 'Moves to the previous or the next box.' },
    { key: 'ArrowUp, ArrowDown', effect: 'Does nothing.' },
    {
      key: 'Paste',
      effect:
        'In any box, fills the boxes from the first with the pasted code, cut to `length`. Under `integerOnly` a code with a letter is refused.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The boxes are not in the Tab order and cannot be edited.',
    },
  ],
  aria: [
    'The group is a `role="group"` on `wj-inputotp`’s inner `p-inputotp`, named by the field’s label inside a field, or by `ariaLabelledBy` or `ariaLabel` outside one. Outside a field with neither, the group has no name: always set one. Your own `ariaLabelledBy` wins over the field label. An `aria-*` attribute on the `wj-inputotp` host is not forwarded and raises `WJ0003` in development.',
    'Every box is a native `input` named from the translation: "Please enter one time password character 1", "… character 2" and so on, from the string `wj.otpCharacter` with `{0}` replaced by the box’s position. `provideWeeljack({ translation })` sets the text, and `weeljack-ng/locale` ships English and Vietnamese. The names are in the server-rendered HTML. If a screen-reader pass prefers shorter names, set `translation: { wj: { otpCharacter: "Digit {0}" } }`.',
    'Every box is a tab stop, in order. A screen-reader user moves between boxes with Tab, or with the arrow keys once in one.',
    '`inputId` lands on the first box, which is what the field label’s click focuses. `ariaDescribedBy` lands on every box, merged with the field’s hint and error ids, your own ids first and without duplicates. The first box also carries `autocomplete="one-time-code"`, so a phone can offer a code from a message; the other boxes carry none.',
    'Every box sets `aria-invalid="true"` while the group is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'Keep codes longer than six characters to wide layouts. The boxes shrink together down to 32 px in a narrow container and never wrap, so eight boxes overflow a container narrower than about 312 px.',
    'Fixed here, not in Optimus 2.0: under `integerOnly` Optimus cancels every key that is not a digit, so Tab and Enter did nothing and the group trapped the keyboard; the wrapper passes only characters, arrows and Backspace on to it. Optimus never marks a control touched, so a form never saw it blur; the wrapper does when focus leaves the group. And Optimus keeps one character too many from a pasted code; the form value is cut to `length`.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the release that carries this entry.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex` and sizes to its boxes, which start at the start edge, so inside a field the rest of the row stays empty. Each box is a full text input with its own border, radius and focus ring, 8 px from the next, with the character centred and no box around the group. In a container narrower than the row the boxes shrink together to 32 px, and the row never wraps. For anything else, `pt` reaches the parts of the Optimus group underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-inputotp`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `root` lose to the `role` and name the component routes there, and on `pcInputText.root` to each box’s name, `aria-describedby`, `aria-invalid` and, on the first, `id`.',
  parts: [
    { part: 'root', description: 'The Optimus root element: the `role="group"` around the boxes.' },
    {
      part: 'pcInputText',
      description:
        'The nested input pass-through, applied to every box. Its `root` is the native `input`, the focusable element.',
    },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<string | null>(null)`: the characters joined, two-way as `[(value)]`. `valueChange` is the change output.',
    },
    {
      optimus: 'onChange',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output. It carries the joined characters, `null` while every box is empty.',
    },
    {
      optimus: 'length',
      weeljack: 'length',
      status: 'kept',
      note: 'Default 4. A static `length="6"` is read as a number.',
    },
    {
      optimus: 'integerOnly',
      weeljack: 'integerOnly',
      status: 'kept',
      note: 'Digits only, and the numeric keypad.',
    },
    {
      optimus: 'mask',
      weeljack: 'mask',
      status: 'kept',
      note: 'Hides each character, as a password does.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. They land on every box.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` or `large`: boxes 32 × 36 or 48 × 52 px against 40 × 44 px.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjInputOtpPt`. Tracks Optimus. `root` is the group, `pcInputText` reaches every box.',
    },
    {
      optimus: 'None',
      weeljack: 'inputId',
      status: 'added',
      note: 'Lands on the first box, for a `<label for>`. Inside a field one is generated.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'added',
      note: 'Name the group. Inside a field the label names it.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Lands on every box, merged with the field’s hint and error ids.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'native focusin, focusout',
      status: 'renamed',
      note: 'No `on` outputs: listen to the native events on the host.',
    },
    dropped(
      'readonly, tabindex, name, autofocus, variant',
      'By need. `wjAutoFocus` covers autofocus.',
    ),
    dropped(
      '#input template',
      'By need (02 Q6). The component renders its own box template to name every box.',
    ),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-inputOtp, p-input-otp, InputOtpModule', 'Duplicate selectors; standalone.'),
    dropped('the public methods', droppedByNeed),
  ],
};
