import { InputGroupButtonAddonExample } from '../../../examples/inputgroup/button-addon';
import { InputGroupInAFieldExample } from '../../../examples/inputgroup/in-a-field';
import { InputGroupInputSelectExample } from '../../../examples/inputgroup/input-select';
import { InputGroupTextAddonsExample } from '../../../examples/inputgroup/text-addons';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'inputgroup',
  title: 'Input group',
  purpose: 'Joins a control and its addons into one shape.',
  examples: [
    {
      title: 'Text input and select',
      description:
        'Put a text input and a `wj-select` side by side inside `wj-inputgroup`. The two controls share the width, their outer corners are rounded and the corners where they meet are square. Both borders show at the seam, a 2 px line. Size the group, not the controls. The group takes `role="group"` and `aria-labelledby` on its host, so a screen reader announces the caption; each control keeps its own name.',
      sourceKey: 'inputgroup/input-select',
      component: InputGroupInputSelectExample,
    },
    {
      title: 'Text addons',
      description:
        'Put a `wj-inputgroupaddon` before the input, after it, or on both sides. An addon keeps its width, at least 40 px, and the input takes the rest. The outer corners are rounded, and there is one line between an addon and the input: the input’s own border. Give each addon an `id` and name it in the input’s `aria-describedby`, so the unit is read with the input.',
      sourceKey: 'inputgroup/text-addons',
      component: InputGroupTextAddonsExample,
    },
    {
      title: 'Button addon',
      description:
        'Put a `wj-button` in a `wj-inputgroupaddon` at the end of the group. The button carries the rounded outer corners and its focus ring is drawn whole. The group is 46 px tall: the 44 px button plus the addon’s two 1 px lines.',
      sourceKey: 'inputgroup/button-addon',
      component: InputGroupButtonAddonExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the input registers as it would bare: the field’s label names it and its hint and error describe it, after the addon’s id that you wrote in `aria-describedby`. The addon keeps its grey boundary beside an invalid input.',
      sourceKey: 'inputgroup/in-a-field',
      component: InputGroupInAFieldExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputGroupHarness` from `weeljack-ng/inputgroup/testing` and reach the controls inside it with the inherited `getHarness`, as here with `WjInputTextHarness` and `WjSelectHarness`. It also reports how many addons the group holds and what they say, through `WjInputGroupAddonHarness`: reach one by its text with `getHarness(WjInputGroupAddonHarness.with({ text }))`.',
      sourceKey: 'inputgroup/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'Tab', effect: 'Follows the children’s own order; the group is not a stop.' }],
  aria: [
    '`wj-inputgroup` adds no semantics: no role, no label and no Tab stop. An `aria-*` attribute or a `role` on the `wj-inputgroup` host applies as written, so caption the group with `role="group"` and `aria-labelledby`, as the example does.',
    'Every control in the group needs its own name: an `aria-label`, a visible `<label for>`, or `ariaLabel` on a `wj-select`. Two controls in one group each need a name, and the group a caption.',
    'The focused control is lifted above its neighbour, so its 2 px focus ring is drawn whole over the control next to it, through the `wj-select` too.',
    'Inside a `wj-field` one control registers with the field as it would bare: its label names it, its hint and error describe it, and it is invalid while the field shows an error. With two controls the field becomes a labelled group instead, so name each control yourself.',
    'Optimus gap: an addon’s text ("$", "kg") is not part of the input’s name or description. Put the unit in the label, or give the addon an `id` and name it in the input’s `aria-describedby`, as the Text addons and In a field examples do. Two controls in one group each need a name, and the group a caption.',
    'Only a text input (`input[wjInputText]`) and a `wj-select`, with text or button addons, are covered. A `wj-password`, a float or ifta label, an icon field and a `wj-button` placed directly inside the group are not supported. A `wj-button` goes in a `wj-inputgroupaddon`.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'The host is `block`, the display of the Optimus root inside it, and adds no box of its own. The root is one flex row that never wraps. Every part that is not an addon grows to share the row, so two controls take the width between them; the row is as tall as its tallest control and the others stretch to it. An addon keeps its content width. The first part’s outer start corners and the last part’s outer end corners take the form-field radius, and every inner corner is square, whether the radius sits on the control itself, inside a `wj-select` or on an addon. An addon draws its top and bottom line, its outer edge on the first and last position and one line between two neighbouring addons; between an addon and a control the control’s border is the one line. Size the `wj-inputgroup` through `class` or `style`. For anything else, `pt` reaches the parts of the Optimus input group underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-inputgroup`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-inputgroup` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the flex row that holds the controls.',
    },
  ],
  mapping: [
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'Controls and `wj-inputgroupaddon`s in a row.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjInputGroupPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    dropped(
      'styleClass, dt, unstyled, ptOptions, InputGroupModule',
      `${droppedAlways} Optimus’s root class also reads a \`fluid\` that has no input, so nothing is lost.`,
    ),
    dropped('p-inputGroup, p-input-group', 'Duplicate selectors.'),
  ],
};
