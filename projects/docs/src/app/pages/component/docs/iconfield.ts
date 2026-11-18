import { IconFieldBasicExample } from '../../../examples/iconfield/basic';
import { IconFieldInAFieldExample } from '../../../examples/iconfield/in-a-field';
import { IconFieldLeadingExample } from '../../../examples/iconfield/leading';
import { IconFieldTrailingExample } from '../../../examples/iconfield/trailing';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'iconfield',
  title: 'Icon field',
  purpose: 'Puts an icon inside a text input, at its start or end.',
  examples: [
    {
      title: 'Basic',
      description:
        'Put a text input inside `wj-iconfield`, with a visible `<label for>` above it. Size the icon field, not the input: an input with no width of its own fills it.',
      sourceKey: 'iconfield/basic',
      component: IconFieldBasicExample,
    },
    {
      title: 'Leading icon',
      description:
        'Put a `wj-inputicon` before the input for an icon at its start. Draw the icon as an inline SVG `1em` square in `currentColor` and mark it `aria-hidden="true"`: it is decorative, and the input keeps its name from the label. The input pads its start so typed text never runs under the icon.',
      sourceKey: 'iconfield/leading',
      component: IconFieldLeadingExample,
    },
    {
      title: 'Trailing icon',
      description:
        'Put the `wj-inputicon` after the input for an icon at its end. It sits at the input’s end because the input fills the icon field, and the input pads its end instead.',
      sourceKey: 'iconfield/trailing',
      component: IconFieldTrailingExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the icon field changes nothing: the field’s label names the input, and the hint and the error describe it. The invalid input keeps its icon, and the icon keeps its colour.',
      sourceKey: 'iconfield/in-a-field',
      component: IconFieldInAFieldExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjIconFieldHarness` from `weeljack-ng/iconfield/testing` to reach the input inside it with the inherited `getHarness`, as here with `WjInputTextHarness`, and to ask whether it has a leading or a trailing icon. Each is read from the order of the `wj-inputicon` elements: one before the input is leading, one after it is trailing.',
      sourceKey: 'iconfield/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab', effect: 'Moves to the input; the icon field and its icons are not stops.' },
  ],
  aria: [
    '`wj-iconfield` adds no semantics: no role, no label and no Tab stop. The input keeps its own name, so give it a visible `<label for>` or sit it inside a `wj-field`. An `aria-*` attribute or a `role` on the `wj-iconfield` host applies as written.',
    'Mark a decorative icon `aria-hidden="true"`, so a screen reader skips it. An icon that carries information the text does not is not decorative: say it in the label or the hint instead.',
    'A clickable control beside an input belongs in a `wj-inputgroupaddon`, not in an icon: an icon is not a button and takes no focus.',
    'A decorative icon passes clicks to the input under it, so a click anywhere in the visible box focuses the input.',
    'Optimus gap: the icon’s colour (`--wj-iconfield-icon-color`, zinc 400 in the light theme) is about 2.6:1 on white, which meets no contrast minimum. That is acceptable only because every icon covered here is decorative; never let the icon alone carry a state.',
    'Inside a `wj-field` the icon field changes nothing: the input is named by the field’s label, described by its hint and error, and invalid while the field shows an error.',
    'Only a text input (`input[wjInputText]`) is covered. Other controls inside an icon field are not supported.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'The host is `block`, the display of the Optimus root inside it, and adds no box of its own. The root is the positioned box the icons sit in, and lays its in-flow children in one full-width column, so an input with no width of its own fills it and a trailing icon sits at the input’s end. Size the `wj-iconfield` through `class` or `style`. Optimus pads the input’s start by 44 px when a sibling precedes it, and its end by 44 px when one follows, at every input size, so typed text never runs under an icon. For anything else, `pt` reaches the parts of the Optimus icon field underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-iconfield`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-iconfield` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the positioned box that holds the input and icons.',
    },
  ],
  mapping: [
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'A text input, with a `wj-inputicon` before it and/or after it.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjIconFieldPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    dropped(
      'iconPosition',
      'It only toggles two classes that no Optimus 2.0 style reads. An icon’s side follows its place before or after the input.',
    ),
    dropped('hostName', 'Internal to Optimus.'),
    dropped('styleClass, dt, unstyled, ptOptions, IconFieldModule', droppedAlways),
    dropped('p-iconField, p-icon-field', 'Duplicate selectors.'),
  ],
};
