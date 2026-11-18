import { InputMaskBasicExample } from '../../../examples/inputmask/basic';
import { InputMaskDateShapedExample } from '../../../examples/inputmask/date-shaped';
import { InputMaskDisabledExample } from '../../../examples/inputmask/disabled';
import { InputMaskInAFieldExample } from '../../../examples/inputmask/in-a-field';
import { InputMaskSizesExample } from '../../../examples/inputmask/sizes';
import { InputMaskUnmaskedValueExample } from '../../../examples/inputmask/unmasked-value';
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
  entry: 'inputmask',
  title: 'Input mask',
  purpose:
    'A native text input that shapes what is typed, such as a phone number or a date, with the same look as the text input. It binds like any input and, inside a field, is named, described and marked invalid by it.',
  optimusSelector: 'input[pInputMask]',
  examples: [
    {
      title: 'Basic',
      description:
        'Put `wjInputMask` on a native `input` and give it the mask. `9` is a digit, `a` a letter, `*` either, `?` makes the rest optional, and anything else is a literal. Use a placeholder that shows the format, and outside a field give the input your own `<label for>`.',
      sourceKey: 'inputmask/basic',
      component: InputMaskBasicExample,
    },
    {
      title: 'Date-shaped mask with completed',
      description:
        '`completed` emits once every required slot is filled. A mask shapes the characters, not their meaning: `99/99/9999` accepts `99/99/9999`, so check the date in your own validator.',
      sourceKey: 'inputmask/date-shaped',
      component: InputMaskDateShapedExample,
    },
    {
      title: 'The unmasked value',
      description:
        '`unmaskedChange` emits the typed characters without literals or slot characters, which is the value to send to a server. The form value keeps the masked text.',
      sourceKey: 'inputmask/unmasked-value',
      component: InputMaskUnmaskedValueExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'inputmask/in-a-field',
      component: InputMaskInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled input leaves the Tab order and cannot be edited.',
      sourceKey: 'inputmask/disabled',
      component: InputMaskDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall. Bind `[size]`: a static `size="small"` also writes the native `size` attribute.',
      sourceKey: 'inputmask/sizes',
      component: InputMaskSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputMaskHarness` from `weeljack-ng/inputmask/testing` to focus the input, type characters through the mask, and read the shown text and the disabled, required and invalid states without touching the DOM. After `focus()`, wait for the mask to show before typing: Optimus places the caret from a timer.',
      sourceKey: 'inputmask/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the input and away from it.' },
    {
      key: 'A character key',
      effect:
        'Fills the next slot with the character when the mask accepts it, and skips literals. A character the mask rejects is dropped.',
    },
    {
      key: 'Backspace',
      effect: 'Clears the slot before the caret and moves the later characters left.',
    },
    { key: 'Delete', effect: 'Clears the slot at the caret and moves the later characters left.' },
    {
      key: 'Escape',
      effect: 'Restores the text the input had when it got focus.',
    },
    {
      key: 'Enter',
      effect: 'Checks whether the mask is complete, as leaving the input does.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The input is not in the Tab order and cannot be edited.',
    },
  ],
  aria: [
    '`id`, `type`, `name`, `placeholder`, `disabled`, `required`, `inputmode` and every `aria-*` attribute stay native attributes on the `input`. There are no ARIA inputs.',
    'Inside a `wj-field` the input is named by the field’s label: `<label for>` points at the input’s `id`. A static `id` is adopted once, and the input gets a generated one when it has none.',
    'Inside a field, `aria-describedby` lists your own static ids first, then the hint, then the error, without duplicates. Outside a field the directive writes neither the `id` nor `aria-describedby`.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'State the format in words in the label or hint, such as "Include the area code". While the input has focus its text shows the mask, and a screen reader reads the slot characters as text.',
    'An incomplete value clears when the input loses focus, unless `autoClear` is off, and the directive shows no error for it. Your validator decides what is wrong.',
    'A value that a form writes shows as written, and is masked on the next input, focus or blur. Keep the masked text in the form, or read `unmaskedChange` for the raw characters.',
    'Never combine `wjInputMask` with `wjInputText` on one element. Both compose Optimus’s text input, and Angular rejects a directive that matches twice.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the release that carries this entry.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits, the same as the text input. For anything else, `pt` reaches the part of the Optimus input underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wjInputMask`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'root',
      description: 'The native `input` element itself. The directive adds no other part.',
    },
  ],
  mapping: [
    {
      optimus: 'pInputMask',
      weeljack: 'wjInputMask',
      status: 'renamed',
      note: 'The mask: `9` digit, `a` letter, `*` either, `?` makes the rest optional, anything else is a literal. A selector-named input, as Optimus’s is.',
    },
    {
      optimus: 'slotChar',
      weeljack: 'slotChar',
      status: 'kept',
      note: 'Default `_`.',
    },
    {
      optimus: 'autoClear',
      weeljack: 'autoClear',
      status: 'kept',
      note: 'Default `true`: an incomplete value clears on blur.',
    },
    {
      optimus: 'onComplete',
      weeljack: 'completed',
      status: 'renamed',
      note: 'No `on` outputs.',
    },
    {
      optimus: 'onUnmaskedChange',
      weeljack: 'unmaskedChange',
      status: 'renamed',
      note: 'The value without literals or slot characters.',
    },
    {
      optimus: 'pSize (InputText)',
      weeljack: 'size',
      status: 'renamed',
      note: '`small` or `large`: 36 or 52 px against 44 px.',
    },
    {
      optimus: 'pInputTextPT, inherited pt (InputText)',
      weeljack: 'pt',
      status: 'renamed',
      note: 'Typed `WjInputMaskPt`. Tracks Optimus. Forwarded as the inherited `pt`.',
    },
    {
      optimus: 'invalid',
      weeljack: 'invalid',
      status: 'kept',
      note: 'The directive’s own input; accepts a bare attribute. A field drives it inside (see ARIA).',
    },
    {
      optimus: 'None',
      weeljack: 'Field registration',
      status: 'added',
      note: 'No input: the id, label, description and invalid state come from an enclosing `wj-field`.',
    },
    dropped('characterPattern, keepBuffer', droppedByNeed),
    dropped(
      'pInputMaskPT, pInputMaskUnstyled and the directive’s inherited pt, dt, unstyled, ptOptions',
      'The directive renders no part, so there is nothing for them to reach. ' + droppedAlways,
    ),
    dropped(
      'variant, fluid, ptInputText, pInputTextUnstyled, hostName',
      'By need; the native element is the box; duplicates; internal.',
    ),
    dropped(
      'The p-inputmask component (p-inputMask, p-input-mask) with mask, unmask, type, showClear, onClear, #clearicon, inputId, placeholder, tabindex, title, ariaLabel, ariaLabelledBy, ariaRequired, readonly, autofocus, autocomplete, onFocus, onBlur, onInput, onKeydown, focus(), clear()',
      'The native-element directive covers the use. Native attributes stay native; `unmaskedChange` replaces `unmask`.',
    ),
    dropped(
      'InputMaskModule, INPUTMASK_VALUE_ACCESSOR',
      'Standalone; the native accessor applies.',
    ),
  ],
};
