import { InputTextBasicExample } from '../../../examples/inputtext/basic';
import { InputTextDisabledExample } from '../../../examples/inputtext/disabled';
import { InputTextInAFieldExample } from '../../../examples/inputtext/in-a-field';
import { InputTextSizesExample } from '../../../examples/inputtext/sizes';
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
  entry: 'inputtext',
  title: 'Input text',
  purpose:
    'A native text input with the default look, 44 px tall by default. It binds like any input and, inside a field, is named, described and marked invalid by it.',
  optimusSelector: 'input[pInputText]',
  examples: [
    {
      title: 'Basic',
      description:
        'Put `wjInputText` on a native `input`. Outside a field, give it your own `<label for>`.',
      sourceKey: 'inputtext/basic',
      component: InputTextBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'inputtext/in-a-field',
      component: InputTextInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled input leaves the Tab order and cannot be edited.',
      sourceKey: 'inputtext/disabled',
      component: InputTextDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall. Bind `[size]`: a static `size="small"` also writes the native `size` attribute.',
      sourceKey: 'inputtext/sizes',
      component: InputTextSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputTextHarness` from `weeljack-ng/inputtext/testing` to read and set the value and to check the disabled, required and invalid states without touching the DOM.',
      sourceKey: 'inputtext/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the input and away from it.' },
    { key: 'Any character key', effect: 'Types into the focused input, as a native input does.' },
    {
      key: 'Any key, while disabled',
      effect: 'The input is not in the Tab order and cannot be edited.',
    },
  ],
  aria: [
    '`id`, `type`, `name`, `placeholder`, `disabled`, `required` and every `aria-*` attribute stay native attributes on the `input`. There are no ARIA inputs.',
    'Inside a `wj-field` the input is named by the field’s label: `<label for>` points at the input’s `id`. A static `id` is adopted once, and the input gets a generated one when it has none.',
    'Inside a field, `aria-describedby` lists your own static ids first, then the hint, then the error, without duplicates. Outside a field the directive writes neither the `id` nor `aria-describedby`.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'Always give an input an accessible name: a field label, your own `<label for>`, or `aria-label`. A placeholder is not a name.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the part of the Optimus input underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wjInputText`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'root',
      description: 'The native `input` element itself. The directive adds no other part.',
    },
  ],
  mapping: [
    {
      optimus: 'pSize',
      weeljack: 'size',
      status: 'renamed',
      note: '`small` or `large`: 36 or 52 px against 44 px.',
    },
    {
      optimus: 'pInputTextPT',
      weeljack: 'pt',
      status: 'renamed',
      note: 'Typed `WjInputTextPt`. Tracks Optimus.',
    },
    {
      optimus: 'invalid',
      weeljack: 'invalid',
      status: 'kept',
      note: 'Accepts a bare attribute. A field drives it inside (see ARIA).',
    },
    {
      optimus: 'None',
      weeljack: 'Field registration',
      status: 'added',
      note: 'No input: the id, label, description and invalid state come from an enclosing `wj-field`.',
    },
    dropped('variant', droppedByNeed),
    dropped('fluid', 'The native element is the box: size it with CSS.'),
    dropped('ptInputText, inherited pt', 'Duplicates of `pt`.'),
    dropped('pInputTextUnstyled, dt, unstyled, ptOptions', droppedAlways),
    dropped('hostName, InputTextModule', 'Internal; the directive is standalone.'),
  ],
};
