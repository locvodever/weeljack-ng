import { PasswordBasicExample } from '../../../examples/password/basic';
import { PasswordDisabledExample } from '../../../examples/password/disabled';
import { PasswordInAFieldExample } from '../../../examples/password/in-a-field';
import { PasswordMaskToggleExample } from '../../../examples/password/mask-toggle';
import { PasswordStrengthFeedbackExample } from '../../../examples/password/strength-feedback';
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
  entry: 'password',
  title: 'Password',
  purpose:
    'A password input, 44 px tall by default, with an optional strength overlay and an optional mask toggle that is a real button. `value` is the text: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. Inside a field, the input is named, described and marked invalid by it.',
  examples: [
    {
      title: 'Basic',
      description:
        'Pair `inputId` with your own `<label for>`. `feedback` is on by default; here it is off, as it is for a sign-in field that does not set a password.',
      sourceKey: 'password/basic',
      component: PasswordBasicExample,
    },
    {
      title: 'With the mask toggle',
      description:
        '`toggleMask` adds a button at the end of the field. Its name is "Show Password" while the text is masked and "Hide Password" while it shows, and it is pressed while the text shows. Focus stays on it after Enter, Space or a click.',
      sourceKey: 'password/mask-toggle',
      component: PasswordMaskToggleExample,
    },
    {
      title: 'With strength feedback',
      description:
        'Type in the input: the overlay below it grades the password as weak, medium or strong, in the translation’s own words. It stays closed until you type, and Escape closes it.',
      sourceKey: 'password/strength-feedback',
      component: PasswordStrengthFeedbackExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field, and the input is described by them. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'password/in-a-field',
      component: PasswordInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled password leaves the Tab order, and its toggle is disabled with it.',
      sourceKey: 'password/disabled',
      component: PasswordDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjPasswordHarness` from `weeljack-ng/password/testing` to read and set the text, flip the mask through the button, read the button’s name and pressed state and the strength text, and check the disabled, required and invalid states without touching the DOM.',
      sourceKey: 'password/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect: 'Moves focus to the input, then to the mask toggle when there is one, and away.',
    },
    { key: 'Any character key', effect: 'Types into the input and opens the strength overlay.' },
    {
      key: 'Enter, Space (on the toggle)',
      effect: 'Shows or hides the text. Focus stays on the toggle.',
    },
    {
      key: 'Escape (in the input)',
      effect: 'Closes the strength overlay. Focus stays on the input.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The input and the toggle are not in the Tab order and cannot be used.',
    },
  ],
  aria: [
    'The focusable element is a native `input`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-password`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Always give the input an accessible name: a field label, your own `<label for>` that matches `inputId`, `ariaLabel` or `ariaLabelledBy`. A placeholder is not a name.',
    'Inside a `wj-field` the input is named by the field’s label: `<label for>` points at the input’s `id`, which is your `inputId` or a generated one. `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The mask toggle is a real `button` after the input, with a hit box of 28, 36 or 44 px. Its name is the translation’s `wj.showPassword` while the text is masked and `wj.hidePassword` while it shows, and `aria-pressed` is `true` while the text shows. It is disabled with the control.',
    'Gap, fixed: Optimus does not announce the strength text, so the strength was not read out as the user typed. `wj-password` routes `role="status"` and `aria-live="polite"` onto the strength text, so each change (weak, medium, strong) is announced.',
    'Gap: while the strength overlay is open it covers whatever sits below the input, including a field’s error message. The message stays in the input’s description, so a screen reader still reads it.',
    'The strength meter’s fill grows over one second in Optimus. Under `prefers-reduced-motion: reduce` it does not animate.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the overlay) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, and the Optimus root and input inside it stretch to the host’s width, so size the control with `class` or `style` on `wj-password`. For anything else, `pt` reaches the parts of the Optimus password underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-password`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `pcInputText.root` lose to `ariaDescribedBy` and `aria-invalid`, which the component routes there. The mask toggle is the component’s own button: Optimus’s `maskIcon` and `unmaskIcon` parts are not rendered.',
  parts: [
    { part: 'root', description: 'The Optimus root element, around the input.' },
    {
      part: 'pcInputText',
      description:
        'The nested input pass-through. Its `root` is the native `input`, the focusable element.',
    },
    {
      part: 'maskIcon',
      description: 'Not rendered: the mask toggle is the component’s own button.',
    },
    {
      part: 'unmaskIcon',
      description: 'Not rendered: the mask toggle is the component’s own button.',
    },
    { part: 'overlay', description: 'The strength overlay panel.' },
    { part: 'meter', description: 'The strength meter’s track.' },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<string | null>(null)`: the source of truth, two-way as `[(value)]`.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. `required` lands on the input.',
    },
    {
      optimus: 'inputId, ariaLabel, ariaLabelledBy',
      weeljack: 'inputId, ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the `input`.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the `input`, merged with the field’s hint and error ids.',
    },
    {
      optimus: 'placeholder, autocomplete',
      weeljack: 'placeholder, autocomplete',
      status: 'kept',
      note: 'Use `current-password` or `new-password`.',
    },
    {
      optimus: 'feedback',
      weeljack: 'feedback',
      status: 'kept',
      note: 'On by default: the strength overlay.',
    },
    {
      optimus: 'toggleMask',
      weeljack: 'toggleMask',
      status: 'kept',
      note: 'Off by default. When on, the toggle is a real button instead of Optimus’s bare icon.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` or `large`: 36 or 52 px against 44 px.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjPasswordPt`. Tracks Optimus. `pcInputText` reaches the native input.',
    },
    dropped(
      'promptLabel, weakLabel, mediumLabel, strongLabel',
      'The overlay’s texts come from the translation (`passwordPrompt`, `weak`, `medium`, `strong`).',
    ),
    dropped('mediumRegex, strongRegex', droppedByNeed),
    dropped('showClear, onClear, #clearicon', 'By need. Icon slots are not exposed.'),
    dropped('onFocus, onBlur', 'Listen to the native `focusin` and `focusout` on the host.'),
    dropped(
      'maxLength, maxlength, minlength, pattern, min, max, step, inputSize, label, name, tabindex, autofocus',
      droppedByNeed,
    ),
    dropped(
      'appendTo, overlayOptions, motionOptions, showTransitionOptions, hideTransitionOptions',
      'The overlay motion is fixed with `safe: true`.',
    ),
    dropped('variant, fluid', 'The host is the box: size it with CSS.'),
    dropped(
      '#content, #header, #footer, #showicon, #hideicon',
      'By need. Template slots are not exposed.',
    ),
    dropped('inputStyle, inputStyleClass, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('[pPassword], PasswordModule, clear()', 'Standalone; the directive is not exposed.'),
  ],
};
