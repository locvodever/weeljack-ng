import { FluidFormExample } from '../../../examples/fluid/form';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'fluid',
  title: 'Fluid',
  purpose: 'Makes every control placed directly inside it span the full width.',
  examples: [
    {
      title: 'A full-width form',
      description:
        'Size the `wj-fluid`, not the controls: here it is `min(100%, 24rem)` wide, and its three direct children, two `wj-field`s and a `wj-button`, fill it. The button’s label stays centred. `wj-fluid` adds no gap between children, so the example spaces them with its own sibling margin.',
      sourceKey: 'fluid/form',
      component: FluidFormExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjFluidHarness` from `weeljack-ng/fluid/testing` and reach the controls inside it with the inherited `getHarness`, as here with `WjInputTextHarness` and `WjButtonHarness`. The harness has no concepts of its own.',
      sourceKey: 'fluid/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'Tab', effect: 'Follows the children’s own order; the fluid is not a stop.' }],
  aria: [
    '`wj-fluid` adds no semantics: no role, no label and no Tab stop. Its children keep theirs, and an `aria-*` attribute or a `role` on the `wj-fluid` host applies as written.',
    'Only direct children are made full width. A control inside your own nested layout, such as a flex row inside the `wj-fluid`, keeps its own width, and so does a control inside another component’s view. Put the control where you want it to fill, or size it yourself.',
    'A full-width control gets wider at the same text size. Check that a long line of controls still reads well at your widest layout; give the `wj-fluid` a width of its own to cap it.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'The host is `block`, the display of the Optimus root inside it, and adds no box of its own. The root lays its direct children in one full-width column with no gap, so spacing between them is yours: put margin on the children, or a gap on your own layout. Size the `wj-fluid` through `class` or `style`. Optimus’s own Fluid works through dependency injection, which cannot cross a wrapper host, so `wj-fluid` does the job in CSS: a control with no width of its own fills the column, and a direct `wj-button`’s inner button is told to fill its row. For anything else, `pt` reaches the parts of the Optimus fluid underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-fluid`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-fluid` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the column that holds the controls.',
    },
  ],
  mapping: [
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'The controls that fill the width, as direct children.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjFluidPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    dropped('dt, unstyled, ptOptions, FluidModule', droppedAlways),
  ],
};
