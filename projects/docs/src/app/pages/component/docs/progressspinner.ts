import { ProgressspinnerBasicExample } from '../../../examples/progressspinner/basic';
import { ProgressspinnerLabelledExample } from '../../../examples/progressspinner/labelled';
import { ProgressspinnerSizesExample } from '../../../examples/progressspinner/sizes';
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
  entry: 'progressspinner',
  title: 'Progress spinner',
  purpose: 'An indeterminate spinner for work in progress.',
  examples: [
    {
      title: 'Basic',
      description:
        'A spinner at the default 100 × 100 px, named with `ariaLabel`. Every spinner needs a name: without `ariaLabel` or `ariaLabelledBy`, `WJ0160` warns in development.',
      sourceKey: 'progressspinner/basic',
      component: ProgressspinnerBasicExample,
    },
    {
      title: 'Sizes',
      description:
        'Size the host with `style` or `class`, for example `style="width: 2rem; height: 2rem"`: the spinner fills it. The stroke scales with the box, so keep a spinner 2rem or larger.',
      sourceKey: 'progressspinner/sizes',
      component: ProgressspinnerSizesExample,
    },
    {
      title: 'Labelled',
      description:
        'Point `ariaLabelledBy` at visible text. Everyone then gets the same message, including a reader whose reduced-motion setting stops the rotation. A spinner beside text goes in a centred flex row, because on its own it sits on the text baseline and looks low.',
      sourceKey: 'progressspinner/labelled',
      component: ProgressspinnerLabelledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjProgressSpinnerHarness` from `weeljack-ng/progressspinner/testing`. `getAriaAttributes()` returns the label, the labelled-by id and the described-by id (each `null` when absent), and `isBusy()` says whether the spinner reports itself busy.',
      sourceKey: 'progressspinner/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'Not focusable; Tab passes over it.' }],
  aria: [
    'Optimus renders the spinner as `role="progressbar"` with `aria-busy="true"`. It has no value, so it is indeterminate.',
    'The spinner needs a name, and the name is yours: `ariaLabel`, or `ariaLabelledBy` with the id of visible text, which is the better choice. `ariaDescribedBy` adds a description but is not a name. WeeljackNg ships no default name, because "Loading" is app content, not interface text. With neither a label nor a labelled-by id, `WJ0160` warns once in development, after the first render.',
    '`ariaLabelledBy` and `ariaDescribedBy` are routed onto the `progressbar` element through the `host` part. Your own `pt.host` keys survive, and a routed id wins over a `pt.host` key of the same name.',
    'The spinner’s appearance is not announced. Announce the outcome when the work ends, for example a `wj-message` rendered with `@if`, and remove the spinner then.',
    'Under reduced motion the rotation, the dash and the colour cycle all stop, leaving a still arc in the first colour. A still arc no longer says "working" on its own, so pair the spinner with visible text.',
    'The strokes meet 3:1 on a card in both schemes. Aura’s light green and yellow fall short, and the default look corrects them (`green.600` and `yellow.700`). An app that passes its own brand colours owns their contrast.',
    'The spinner is not focusable and adds no Tab stop. Optimus renders it inside its own element, so `aria-*` on `wj-progressspinner` raises `WJ0003`: use the inputs.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the W5a release.',
  ],
  stylingIntro:
    'The host is an `inline-block` box of 100 × 100 px, and the Optimus spinner fills it, so `style` or `class` on `wj-progressspinner` sizes it. The four stroke colours come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus spinner underneath: `pt.circle` restyles the stroke, for example. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-progressspinner`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-progressspinner` routes `aria-labelledby` and `aria-describedby` onto the `host` part: they win over the same attributes in your `pt`, and your other keys survive.',
  parts: [
    {
      part: 'host',
      description:
        'The Optimus `p-progressspinner` element: the `progressbar`, with its name, description and busy state.',
    },
    { part: 'spin', description: 'The SVG that turns.' },
    { part: 'circle', description: 'The arc, drawn as an SVG circle stroke.' },
  ],
  mapping: [
    {
      optimus: 'ariaLabel',
      weeljack: 'ariaLabel',
      status: 'kept',
      note: 'Through Optimus’s own input, onto the `progressbar` element.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy',
      status: 'added',
      note: 'Routed to the `progressbar` element (`pt.host`). The id of visible text.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Routed to the `progressbar` element (`pt.host`).',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjProgressSpinnerPt`. Tracks Optimus.',
    },
    dropped(
      'strokeWidth, fill',
      `${droppedByNeed} Restyle the stroke through \`pt.circle\` or CSS.`,
    ),
    dropped(
      'animationDuration',
      `${droppedByNeed} Motion stays the default look’s and stops under reduced motion.`,
    ),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-progress-spinner, p-progressspinner', 'Duplicate selectors.'),
  ],
};
