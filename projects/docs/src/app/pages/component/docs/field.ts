import { FieldGroupErrorExample } from '../../../examples/field/group-error';
import { FieldInlineCheckboxExample } from '../../../examples/field/inline-checkbox';
import { FieldRadioGroupExample } from '../../../examples/field/radio-group';
import { FieldReactiveExample } from '../../../examples/field/reactive';
import { FieldSignalFormsExample } from '../../../examples/field/signal-forms';
import { FieldTextInputExample } from '../../../examples/field/text-input';
import { FieldTwoInputsExample } from '../../../examples/field/two-inputs';
import type { ComponentDoc } from '../component-doc';

export const DOC: ComponentDoc = {
  entry: 'field',
  title: 'Field',
  purpose:
    'A label, a hint and an error around a form control. The control inside it reads its name, description and invalid state from the field.',
  examples: [
    {
      title: 'Text input with a hint and an error',
      description:
        'The most common use: a `wjInputText` in a field with `ngModel`. The error is computed from the value and the touched state, so the page loads clean and the message appears after the input is blurred.',
      sourceKey: 'field/text-input',
      component: FieldTextInputExample,
    },
    {
      title: 'The same with a reactive FormControl',
      description:
        'Nothing changes in the field. Compute `error` from the control, here once it is touched and its value is not an email address.',
      sourceKey: 'field/reactive',
      component: FieldReactiveExample,
    },
    {
      title: 'Signal forms with submit()',
      description:
        'With `[formField]` you leave `error` empty: the field shows the first error message once the input is touched, and `submit()` touches every field, so Save shows all of them.',
      sourceKey: 'field/signal-forms',
      component: FieldSignalFormsExample,
    },
    {
      title: 'Inline with a checkbox',
      description:
        'A `wj-checkbox` is an on/off control, so the field puts its label and hint beside the box, and a click on the label toggles it. The error is computed from the touched state, so the page loads clean.',
      sourceKey: 'field/inline-checkbox',
      component: FieldInlineCheckboxExample,
    },
    {
      title: 'Two inputs in one field',
      description:
        'Two registered controls make the field a group named by its label. Each input keeps its own visible `<label for>` and static `id`, and both are described by the hint.',
      sourceKey: 'field/two-inputs',
      component: FieldTwoInputsExample,
    },
    {
      title: 'Native radio group',
      description:
        'Radios are not WeeljackNg controls, so nothing registers and the field becomes a group: `role="group"` named by the label. Put the radios in one element of your own, and give each its own `<label>`.',
      sourceKey: 'field/radio-group',
      component: FieldRadioGroupExample,
    },
    {
      title: 'Group with an error',
      description:
        'A non-empty `error` shows below the controls and is announced once. A static message shows the look; in a form, compute it from the value and touched state so the page loads clean.',
      sourceKey: 'field/group-error',
      component: FieldGroupErrorExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjFieldHarness` from `weeljack-ng/field/testing` to read the label, hint and error, and to reach the control inside the field.',
      sourceKey: 'field/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'The field is not a tab stop. Focus moves between the controls inside it, and between fields.',
    },
    {
      key: 'Click on the label',
      effect: 'Moves focus to the control, or toggles an inline checkbox or switch.',
    },
  ],
  aria: [
    'A control with a labelable element (an `input` or `textarea`) is named by `<label for>` pointing at its id. A control that is not labelable, such as a select, is named by `aria-labelledby` pointing at a label `<span>`.',
    'The control is described by its own `aria-describedby` ids first, then the hint, then the error, with no duplicates. The attribute is absent when the list is empty.',
    'The error is a `<p role="alert">`: it is announced once when it appears, and focus never moves. An error with no message turns the control invalid and shows no text.',
    'With no registered control, or with several, the field is a group: `role="group"` and `aria-labelledby` the label, plus `aria-describedby` the hint and error while they show.',
    'A control that is not a WeeljackNg control, such as a plain `<input>`, does not register, so the field becomes a group and that control needs its own accessible name.',
    'In a group, each control needs its own accessible name: the group label names the group, not its members.',
    'Clicking the `<span>` label of a control that is not labelable moves focus to the control, as a `<label for>` does for a labelable one.',
    'The field adds no tab stop and no focus style of its own.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'The field has no `pt`: it is WeeljackNg’s own component and wraps nothing from Optimus. Colours and type come from the `--wj-*` variables that `provideWeeljack` emits. Size the field, not the control: a control with no width of its own fills the width of the field. Spacing between fields is yours to set in your own layout.',
  parts: [],
  customProperties: [
    {
      name: '--wj-field-gap',
      defaultValue: '4px',
      description: 'The gap between the label, the hint, the control and the error.',
    },
    {
      name: '--wj-field-inline-gap',
      defaultValue: '8px',
      description: 'The gap between an inline control and its label.',
    },
  ],
  mapping: [],
};
