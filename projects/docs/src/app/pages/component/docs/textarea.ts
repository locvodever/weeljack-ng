import { TextareaBasicExample } from '../../../examples/textarea/basic';
import { TextareaDisabledExample } from '../../../examples/textarea/disabled';
import { TextareaInAFieldExample } from '../../../examples/textarea/in-a-field';
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
  entry: 'textarea',
  title: 'Textarea',
  purpose:
    'A native multi-line text input with the default look. Its height follows `rows`. It binds like any textarea and, inside a field, is named, described and marked invalid by it.',
  optimusSelector: '[pTextarea]',
  examples: [
    {
      title: 'Basic',
      description:
        'Put `wjTextarea` on a native `textarea` and set `rows`. Outside a field, give it your own `<label for>`.',
      sourceKey: 'textarea/basic',
      component: TextareaBasicExample,
    },
    {
      title: 'In a field with a character count',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The count is your own paragraph right after the textarea, and the textarea’s static `aria-describedby` points at it: the field lists your id first, then its hint, then its error. The second field shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'textarea/in-a-field',
      component: TextareaInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled textarea leaves the Tab order and cannot be edited.',
      sourceKey: 'textarea/disabled',
      component: TextareaDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTextareaHarness` from `weeljack-ng/textarea/testing` to read and set the value and to check the disabled, required and invalid states without touching the DOM.',
      sourceKey: 'textarea/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the textarea and away from it.' },
    {
      key: 'Enter',
      effect: 'Inserts a new line. It never submits the enclosing form.',
    },
    { key: 'Any character key', effect: 'Types into the focused textarea, as a native one does.' },
    {
      key: 'Any key, while disabled',
      effect: 'The textarea is not in the Tab order and cannot be edited.',
    },
  ],
  aria: [
    '`id`, `name`, `rows`, `placeholder`, `disabled`, `required` and every `aria-*` attribute stay native attributes on the `textarea`. There are no ARIA inputs.',
    'Inside a `wj-field` the textarea is named by the field’s label: `<label for>` points at its `id`. A static `id` is adopted once, and the textarea gets a generated one when it has none.',
    'Inside a field, `aria-describedby` lists your own static ids first, then the hint, then the error, without duplicates. Outside a field the directive writes neither the `id` nor `aria-describedby`.',
    'The textarea sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'Always give a textarea an accessible name: a field label, your own `<label for>`, or `aria-label`. A placeholder is not a name.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius, padding and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The text keeps the browser’s default line height, so set `line-height` in your own CSS to match the 1.5 of the text input. For anything else, `pt` reaches the part of the Optimus textarea underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wjTextarea`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'root',
      description: 'The native `textarea` element itself. The directive adds no other part.',
    },
  ],
  mapping: [
    {
      optimus: 'pSize',
      weeljack: 'size',
      status: 'renamed',
      note: '`small` or `large`: smaller or larger text and padding than the default.',
    },
    {
      optimus: 'pTextareaPT',
      weeljack: 'pt',
      status: 'renamed',
      note: 'Typed `WjTextareaPt`. Tracks Optimus. Optimus’s inherited `pt` input is the one exposed.',
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
    dropped('autoResize, onResize', droppedByNeed),
    dropped('variant', droppedByNeed),
    dropped('fluid', 'The native element is the box: size it with CSS.'),
    dropped('ptTextarea, pTextareaPT alias', 'Duplicates of `pt`.'),
    dropped('pTextareaUnstyled, dt, unstyled, ptOptions', droppedAlways),
    dropped('hostName, TextareaModule', 'Internal; the directive is standalone.'),
  ],
};
