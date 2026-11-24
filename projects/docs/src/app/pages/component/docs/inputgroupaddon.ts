import { InputGroupAddonButtonExample } from '../../../examples/inputgroupaddon/button';
import { InputGroupAddonTextExample } from '../../../examples/inputgroupaddon/text';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'inputgroupaddon',
  title: 'Input group addon',
  purpose: 'A text or button cell at the edge of a `wj-inputgroup`.',
  optimusSelector: 'p-inputgroup-addon',
  examples: [
    {
      title: 'Text addon',
      description:
        'Put a `wj-inputgroupaddon` before or after the control inside a `wj-inputgroup`: a currency, a unit, a scheme or, as here, an `@`. Keep it to one short word or symbol, because the addon keeps its width and the control shrinks. Give the addon an `id` and name it in the input’s `aria-describedby`, so a screen reader reads it with the input.',
      sourceKey: 'inputgroupaddon/text',
      component: InputGroupAddonTextExample,
    },
    {
      title: 'Button addon',
      description:
        'Put a `wj-button` in the addon at the end of the group. The button fills the addon, is 44 px tall and carries the group’s rounded outer corners, and its 2 px focus ring is drawn whole on every side. The addon adds the group’s two 1 px lines, so a group with a button addon is 46 px tall.',
      sourceKey: 'inputgroupaddon/button',
      component: InputGroupAddonButtonExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputGroupAddonHarness` from `weeljack-ng/inputgroupaddon/testing`. Find an addon by its text with `with({ text })`, read it with `getText()`, and reach a `wj-button` inside it with the inherited `getHarness`, as here with `WjButtonHarness`.',
      sourceKey: 'inputgroupaddon/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect:
        'None for the addon: it is not a stop. A `wj-button` inside it is one, in its place in the group.',
    },
  ],
  aria: [
    '`wj-inputgroupaddon` adds no semantics: no role, no label and no Tab stop. An `id` or an `aria-*` attribute on the host applies as written.',
    'Optimus gap: an addon’s text ("$", "kg", "https://") is not part of the control’s name or description. Put the unit in the control’s label, or give the addon an `id` and name it in the control’s `aria-describedby`, as the examples do. Inside a `wj-field` the field’s hint and error follow the ids you wrote.',
    'The addon’s text is the muted text colour, 4.8:1 on the field background in the light theme. Optimus’s own colour for it, the form-field icon colour (zinc 400), is about 2.6:1 and fails WCAG 1.4.3, so the addon sets it through `--wj-inputgroup-addon-color`.',
    'A text addon is not a control and has no disabled or invalid look: it keeps its grey boundary beside a disabled or invalid control.',
    'A `wj-button` inside an addon is 44 px tall and needs its own name, which its label gives. The addon does not clip it, so its focus ring is not cut off.',
    'An addon is for a `wj-inputgroup`. Outside one it keeps Optimus’s standalone look, a full border with rounded corners, which is not a documented use.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'The host is `flex`, the group’s flex item, and the Optimus root inside fills it. The cell is Optimus’s own: the field background, the form-field border, 8 px padding, at least 40 px wide, its content centred, and as tall as the control beside it. Its border and corners are drawn by `wj-inputgroup`, keyed on its position: the group’s outer edge and outer corners on the first and last addon, one line between two neighbouring addons, and none between an addon and a control, where the control’s own border is the line. The text takes the muted text colour. Size nothing on the addon: set the width of the `wj-inputgroup`. For anything else, `pt` reaches the parts of the Optimus input group addon underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-inputgroupaddon`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-inputgroup-addon` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the cell that holds the text or the button.',
    },
  ],
  mapping: [
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'Text, an icon or a `wj-button`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjInputGroupAddonPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    dropped(
      'style, styleClass, dt, unstyled, ptOptions, InputGroupAddonModule',
      `${droppedAlways} \`style\` is an Optimus input here, and still dropped.`,
    ),
    dropped('p-inputGroupAddon', 'Duplicate selector.'),
  ],
};
