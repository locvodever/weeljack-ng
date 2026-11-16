import { ToggleSwitchBasicExample } from '../../../examples/toggleswitch/basic';
import { ToggleSwitchDisabledExample } from '../../../examples/toggleswitch/disabled';
import { ToggleSwitchInAFieldExample } from '../../../examples/toggleswitch/in-a-field';
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
  entry: 'toggleswitch',
  title: 'Toggle switch',
  purpose:
    'An on/off switch with a 40 × 24 px track. `checked` is its value: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. Inside a field, the label and hint sit beside the switch.',
  examples: [
    {
      title: 'Basic',
      description:
        'Pair `inputId` with your own `<label for>`, one row item with the label 8 px after the switch. Bind `[(checked)]`, or use any of the forms APIs.',
      sourceKey: 'toggleswitch/basic',
      component: ToggleSwitchBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label and hint sit beside the switch, and a click on the label toggles it. The second field shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'toggleswitch/in-a-field',
      component: ToggleSwitchInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled switch leaves the Tab order and cannot be toggled.',
      sourceKey: 'toggleswitch/disabled',
      component: ToggleSwitchDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjToggleSwitchHarness` from `weeljack-ng/toggleswitch/testing` to check, uncheck and toggle the switch, and to read its checked, disabled, required and invalid states without touching the DOM.',
      sourceKey: 'toggleswitch/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the switch and away from it.' },
    { key: 'Space', effect: 'Toggles the focused switch.' },
    { key: 'Enter', effect: 'Does nothing, as on a native checkbox.' },
    {
      key: 'Any key, while disabled',
      effect: 'The switch is not in the Tab order and cannot be toggled.',
    },
  ],
  aria: [
    'The focusable element is a native `input type="checkbox"` with `role="switch"`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-toggleswitch`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Always give a switch an accessible name: a field label, your own `<label for>` that matches `inputId`, `ariaLabel` or `ariaLabelledBy`. A `<label for>` must point at the input’s id, never at the `wj-toggleswitch` host.',
    'Inside a `wj-field` the switch is named by the field’s label: `<label for>` points at the input’s `id`, which is your `inputId` or a generated one.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The track is 40 × 24 px, which meets the 24 px target size. A label beside it extends the target, so a click on the label toggles the switch.',
    'Under `prefers-reduced-motion: reduce` the handle jumps to its new position instead of sliding.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex` and adds no box of its own around the Optimus root. For anything else, `pt` reaches the parts of the Optimus toggle switch underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-toggleswitch`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `input` part lose to `ariaDescribedBy` and `aria-invalid`, which the component routes there.',
  parts: [
    { part: 'root', description: 'The Optimus root element: the 40 × 24 px track box.' },
    {
      part: 'input',
      description: 'The native `input` with `role="switch"`: the focusable element.',
    },
    { part: 'slider', description: 'The painted track.' },
    { part: 'handle', description: 'The 16 px handle that slides between off and on.' },
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
      note: 'Set on the `input` (`role="switch"`).',
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
      note: 'Typed `WjToggleSwitchPt`. Tracks Optimus.',
    },
    dropped('trueValue, falseValue, readonly, name, tabindex, autofocus', droppedByNeed),
    dropped('size', 'By need. The 40 × 24 px track is the hit box.'),
    dropped('#handle template', 'By need. Template slots are not exposed.'),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-toggleSwitch, p-toggle-switch, ToggleSwitchModule', 'Duplicates, standalone.'),
  ],
};
