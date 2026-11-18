import { InputIconLeadingExample } from '../../../examples/inputicon/leading';
import { InputIconTrailingExample } from '../../../examples/inputicon/trailing';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'inputicon',
  title: 'Input icon',
  purpose: 'The icon inside a `wj-iconfield`.',
  examples: [
    {
      title: 'Search icon',
      description:
        'A `wj-inputicon` before the input puts the icon at the input’s start. The icon is an inline SVG `1em` square in `currentColor`, `aria-hidden="true"` and `focusable="false"`. A click on the icon focuses the input under it.',
      sourceKey: 'inputicon/leading',
      component: InputIconLeadingExample,
    },
    {
      title: 'Status icon',
      description:
        'A `wj-inputicon` after the input puts the icon at its end. The check-mark repeats what the hint says in text, linked to the input through `aria-describedby`, so the icon stays decorative.',
      sourceKey: 'inputicon/trailing',
      component: InputIconTrailingExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInputIconHarness` from `weeljack-ng/inputicon/testing` to read the icon’s text content and whether assistive technology skips it (`aria-hidden="true"` on the icon you projected or on the host). Reach it inside an icon field with `WjIconFieldHarness`’s inherited `getHarness`.',
      sourceKey: 'inputicon/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'An input icon is not focusable.' }],
  aria: [
    '`wj-inputicon` adds no semantics: no role, no label and no Tab stop. Mark the icon you project `aria-hidden="true"`, so a screen reader skips it. An icon is decorative unless it carries information the text does not; if it does, say it in the label or the hint instead, or give the icon a name of its own with `role="img"` and `aria-label`.',
    'An interactive icon, such as a button that clears the input, is not covered. Use a `wj-inputgroupaddon` with a `wj-button` beside the input instead.',
    'A decorative icon passes clicks to the input under it (`pointer-events: none` on the host, which the icon inherits), so a click anywhere in the visible box focuses the input.',
    'Optimus gap: the icon’s colour (`--wj-iconfield-icon-color`, zinc 400 in the light theme) is about 2.6:1 on white, which meets no contrast minimum. That is acceptable only for a decorative icon, which is all this component covers. Never let the icon alone carry a state.',
    'Optimus gap: Optimus makes the icon 14 px and 18 px in a small and a large input, but its rule matches a class a text input never has, so the icon stays 16 px at every input size. The inset stays 14 px.',
    'Use `wj-inputicon` only inside a `wj-iconfield`, around a text input (`input[wjInputText]`). Icon fields inside a float label or an ifta label are not covered.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'The host is `inline` and adds no box of its own: the Optimus root inside is absolutely positioned against the icon field. Optimus insets that root 14 px from the start and from the end, both at once when it is the only child of its host, so `wj-inputicon` takes the inset of its own side only: an icon before the input gets the start inset and one after it gets the end inset. The icon is centred on the input, 16 px square at every input size, in Optimus’s icon colour. For anything else, `pt` reaches the parts of the Optimus input icon underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-inputicon`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-inputicon` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the absolutely positioned box around the icon.',
    },
  ],
  mapping: [
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'The icon: an inline SVG, drawn `1em` square in `currentColor`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjInputIconPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    dropped('hostName', 'Internal to Optimus.'),
    dropped('styleClass, dt, unstyled, ptOptions, InputIconModule', droppedAlways),
    dropped('p-inputIcon', 'Duplicate selector.'),
  ],
};
