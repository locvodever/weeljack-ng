import { SkeletonBasicExample } from '../../../examples/skeleton/basic';
import { SkeletonCardExample } from '../../../examples/skeleton/card';
import { SkeletonShapesExample } from '../../../examples/skeleton/shapes';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'skeleton',
  title: 'Skeleton',
  purpose: 'A placeholder shape that holds the place of content while it loads.',
  examples: [
    {
      title: 'Basic',
      description:
        'Two text lines, one at the full width and one at 60 %. Size each line to the text it stands for, so the layout does not shift when the content arrives.',
      sourceKey: 'skeleton/basic',
      component: SkeletonBasicExample,
    },
    {
      title: 'Shapes',
      description:
        'A circle is a square `size` with a full radius. A rectangle takes `width` and `height`; `size` wins over both.',
      sourceKey: 'skeleton/shapes',
      component: SkeletonShapesExample,
    },
    {
      title: 'A card that is loading',
      description:
        'An avatar, two lines and a rounded block, set with `borderRadius`. The card is the app’s own markup: it carries `aria-busy` while it loads.',
      sourceKey: 'skeleton/card',
      component: SkeletonCardExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSkeletonHarness` from `weeljack-ng/skeleton/testing` to read the rendered size and whether the shape is a circle, without touching the DOM.',
      sourceKey: 'skeleton/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'A skeleton is not focusable and adds no Tab stop.' }],
  aria: [
    'Optimus hides the skeleton from assistive technology (`aria-hidden`), so a screen reader skips it. Marking the loading region, for example with `aria-busy`, and announcing the content once it is loaded is the app’s.',
    'A skeleton has no focusable element, so it has no ARIA inputs, and an `aria-*` attribute on `wj-skeleton` does not raise `WJ0003`.',
    'The shimmer stops when the reader asks for reduced motion: the shapes stay, with a static fill.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Fill and radius come from the `--wj-*` variables that `provideWeeljack` emits. The host is a `block` that carries the size, and the Optimus skeleton fills it, so a percentage `width` resolves against the container the way it does for a bare `p-skeleton`, in a block parent and in a flex row alike. For anything else, `pt` reaches the parts of the Optimus skeleton underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-skeleton`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'host', description: 'The Optimus `p-skeleton` element, which is also its root box.' },
    { part: 'root', description: 'The same element as `host`: the painted shape.' },
  ],
  mapping: [
    {
      optimus: 'width',
      weeljack: 'width',
      status: 'kept',
      note: 'Default `100%`. Set on the host.',
    },
    {
      optimus: 'height',
      weeljack: 'height',
      status: 'kept',
      note: 'Default `1rem`. Set on the host.',
    },
    { optimus: 'size', weeljack: 'size', status: 'kept', note: 'Sets both, and wins over them.' },
    { optimus: 'shape', weeljack: 'shape', status: 'kept', note: '`rectangle` or `circle`.' },
    {
      optimus: 'borderRadius',
      weeljack: 'borderRadius',
      status: 'kept',
      note: 'Left unset, the theme’s content radius applies.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjSkeletonPt`. Tracks Optimus.',
    },
    dropped(
      'animation',
      'Not exposed: the shimmer is the only look, and it stops under reduced motion.',
    ),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-skeleton, SkeletonModule', 'Duplicates, by need, standalone.'),
  ],
};
