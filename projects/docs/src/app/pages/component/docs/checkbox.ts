import { CheckboxBasicExample } from '../../../examples/checkbox/basic';
import { CheckboxDisabledExample } from '../../../examples/checkbox/disabled';
import { CheckboxInAFieldExample } from '../../../examples/checkbox/in-a-field';
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
  entry: 'checkbox',
  title: 'Checkbox',
  purpose:
    'An on/off checkbox with a 24 px box. `checked` is its value: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. Inside a field, the label and hint sit beside the box.',
  examples: [
    {
      title: 'Basic',
      description:
        'Pair `inputId` with your own `<label for>`, one row item with the label 8 px after the box. Bind `[(checked)]`, or use any of the forms APIs.',
      sourceKey: 'checkbox/basic',
      component: CheckboxBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label and hint sit beside the box, and a click on the label toggles it. The second field shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'checkbox/in-a-field',
      component: CheckboxInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled checkbox leaves the Tab order and cannot be toggled.',
      sourceKey: 'checkbox/disabled',
      component: CheckboxDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjCheckboxHarness` from `weeljack-ng/checkbox/testing` to check, uncheck and toggle the box, and to read its checked, disabled, required and invalid states without touching the DOM.',
      sourceKey: 'checkbox/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the checkbox and away from it.' },
    { key: 'Space', effect: 'Toggles the focused checkbox.' },
    { key: 'Enter', effect: 'Does nothing, as on a native checkbox.' },
    {
      key: 'Any key, while disabled',
      effect: 'The checkbox is not in the Tab order and cannot be toggled.',
    },
  ],
  aria: [
    'The focusable element is a native `input type="checkbox"`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-checkbox`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Always give a checkbox an accessible name: a field label, your own `<label for>` that matches `inputId`, `ariaLabel` or `ariaLabelledBy`.',
    'Inside a `wj-field` the checkbox is named by the field’s label: `<label for>` points at the input’s `id`, which is your `inputId` or a generated one.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The box is 24 × 24 px, which meets the 24 px target size. A label beside it extends the target, so a click on the label toggles the box.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex` and adds no box of its own around the Optimus root. For anything else, `pt` reaches the parts of the Optimus checkbox underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-checkbox`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `input` part lose to `ariaDescribedBy` and `aria-invalid`, which the component routes there.',
  parts: [
    { part: 'root', description: 'The Optimus root element around the box.' },
    { part: 'input', description: 'The native checkbox `input`: the focusable element.' },
    { part: 'box', description: 'The painted 24 px square.' },
    { part: 'icon', description: 'The check mark inside the box.' },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'checked',
      status: 'added',
      note: 'A `model(false)`: the source of truth, two-way as `[(checked)]`.',
    },
    {
      optimus: 'onChange',
      weeljack: 'checkedChange',
      status: 'renamed',
      note: 'The output of the `checked` model.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside.',
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
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjCheckboxPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'Native events on `wj-checkbox`: there are no `on` outputs.',
    },
    dropped('binary, value, trueValue, falseValue', 'Always binary; group mode by need.'),
    dropped('indeterminate, readonly, name, tabindex, autofocus', droppedByNeed),
    dropped('variant, size', 'By need. A smaller box would break the 24 px hit box.'),
    dropped('checkboxIcon, #icon template', 'Icon slots are never exposed.'),
    dropped(
      'formControl',
      'The wrapper is the value accessor, and the name clashes with reactive forms.',
    ),
    dropped('inputStyle, inputClass, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-checkBox, p-check-box, focus(), CheckboxModule', 'Duplicates, by need, standalone.'),
  ],
};
