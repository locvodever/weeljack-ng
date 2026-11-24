import { ProgressbarDeterminateExample } from '../../../examples/progressbar/determinate';
import { ProgressbarIndeterminateExample } from '../../../examples/progressbar/indeterminate';
import { ProgressbarWithoutValueExample } from '../../../examples/progressbar/without-value';
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
  entry: 'progressbar',
  title: 'Progress bar',
  purpose: 'A bar that shows how far a task has got, or that work is ongoing.',
  examples: [
    {
      title: 'Determinate',
      description:
        'The fill grows to `value` percent, and the value is shown inside it. Name the bar with visible text: `ariaLabelledBy` points at the caption above it, so everyone gets the same name.',
      sourceKey: 'progressbar/determinate',
      component: ProgressbarDeterminateExample,
    },
    {
      title: 'Indeterminate',
      description:
        'Set `mode="indeterminate"` when the length of the work is unknown: two bars sweep the track, and the bar has no value for assistive technology. Switch to determinate once progress can be measured.',
      sourceKey: 'progressbar/indeterminate',
      component: ProgressbarIndeterminateExample,
    },
    {
      title: 'Without value',
      description:
        'Turn `showValue` off to leave the fill bare. Then give the value in text near the bar, and point `ariaDescribedBy` at it: the line is not a live region, and the bar’s own value reaches assistive technology. Do the same for low values, where the label inside the fill is clipped.',
      sourceKey: 'progressbar/without-value',
      component: ProgressbarWithoutValueExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjProgressBarHarness` from `weeljack-ng/progressbar/testing`. `WjProgressBarHarness.with({ label })` finds a bar by its accessible name. `getValue()` returns `aria-valuenow` as a number, or `null` when the bar is indeterminate; `getMode()` says which mode it is in; `getDisplayedValue()` returns the "40%" shown inside the fill, or `null`; `getAriaAttributes()` returns the label, labelled-by and described-by attributes.',
      sourceKey: 'progressbar/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'Not focusable; Tab passes over it.' }],
  aria: [
    'Optimus renders the bar as `role="progressbar"` with `aria-valuemin="0"` and `aria-valuemax="100"`. In determinate mode `aria-valuenow` is `value`, and WeeljackNg adds `aria-valuetext` ("40%"). In indeterminate mode there is no `aria-valuenow` and no `aria-valuetext`, so the bar reads as work in progress with no figure. Pass whole numbers from 0 to 100.',
    'Optimus writes an `aria-level` attribute on the bar, which ARIA does not allow on a `progressbar` and which axe reports (`aria-allowed-attr`). This is an Optimus gap, fixed here: `wj-progressbar` removes it in every state and after every value change. Optimus rewrites it each time the value changes, so the removal is routed through `pt.host` together with the changing `aria-valuetext`, which makes Optimus apply it again each time.',
    'The bar needs a name, and the name is yours: `ariaLabel`, or `ariaLabelledBy` with the id of visible text, which is the better choice. `ariaDescribedBy` adds a description but is not a name. WeeljackNg ships no default name, because "Uploading" is app content, not interface text. With neither a label nor a labelled-by id, `WJ0160` warns once in development, after the first render.',
    '`ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are routed onto the `progressbar` element through the `host` part. Your own `pt.host` keys survive, and a routed attribute wins over a `pt.host` key of the same name.',
    'Give the value in text when `showValue` is off or the value is low, because the label inside the fill is hidden at 0 and clipped while the fill is narrower than it. The track against the card is 1.27:1 in light, as in Aura: the value is always also given as text, and the fill against the track passes 3:1 in both schemes.',
    'Under reduced motion the fill jumps to each new value instead of easing over a second. The indeterminate sweep keeps running: it is the bar’s only visible sign of activity (the essential-activity case of WCAG 2.2.2).',
    'When the work fails, replace the bar with a `wj-message` rendered with `@if`; never leave a bar stalled.',
    'The bar is not focusable and adds no Tab stop. Optimus renders it inside its own element, so `aria-*` on `wj-progressbar` raises `WJ0003`: use the inputs.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the W5a release.',
  ],
  stylingIntro:
    'The host is a block that takes its container’s width: set a maximum with `style` or `class` on `wj-progressbar`. Optimus draws a 20 px track in `--wj-content-border-color` with an ink fill from `--wj-primary-color`, and the value in `--wj-primary-contrast-color` at 0.75rem and weight 600. For anything else, `pt` reaches the parts of the Optimus bar underneath: `pt.value` restyles the fill, for example. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-progressbar`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-progressbar` routes the name and description attributes, `aria-valuetext` and the removals of `aria-level` and, when indeterminate, `aria-valuenow` onto the `host` part: they win over the same attributes in your `pt`, and your other keys survive.',
  parts: [
    {
      part: 'host',
      description:
        'The Optimus `p-progressbar` element: the `progressbar`, with its name, description and value.',
    },
    { part: 'value', description: 'The fill. In indeterminate mode it also carries the sweep.' },
    { part: 'label', description: 'The value shown inside the fill, such as "40%".' },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'A percentage from 0 to 100; defaults to `0`. Passed to Optimus only in determinate mode.',
    },
    {
      optimus: 'mode',
      weeljack: 'mode',
      status: 'kept',
      note: '`determinate` or `indeterminate`; defaults to `determinate`.',
    },
    {
      optimus: 'showValue',
      weeljack: 'showValue',
      status: 'kept',
      note: 'Defaults to `true`. Shows "40%" inside the fill.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the `progressbar` element (`pt.host`). Optimus takes no name.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjProgressBarPt`. Tracks Optimus.',
    },
    dropped(
      'unit',
      `${droppedByNeed} The value is a percentage. Optimus also writes it into the invalid \`aria-level\`.`,
    ),
    dropped('color', `${droppedByNeed} Restyle the fill through \`pt.value\` or \`--wj-*\`.`),
    dropped('valueStyleClass, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('content template', 'Not exposed: the value is shown by `showValue`.'),
    dropped('p-progressBar, p-progress-bar', 'Duplicate selectors.'),
  ],
};
