import { FloatLabelBasicExample } from '../../../examples/floatlabel/basic';
import { FloatLabelHintErrorExample } from '../../../examples/floatlabel/hint-error';
import { FloatLabelSelectExample } from '../../../examples/floatlabel/select';
import { FloatLabelTextareaPasswordExample } from '../../../examples/floatlabel/textarea-password';
import { FloatLabelVariantsExample } from '../../../examples/floatlabel/variants';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'floatlabel',
  title: 'Float label',
  purpose:
    'A label that rests inside a control and floats away when the control has focus or a value.',
  examples: [
    {
      title: 'Basic',
      description:
        'Project the control, then its `<label>`, and tie them with `for`. The label rests inside the empty control and floats above it on focus or with a value (the default `over` variant). Leave room above the float label: the floated label sits outside its box.',
      sourceKey: 'floatlabel/basic',
      component: FloatLabelBasicExample,
    },
    {
      title: 'Variants',
      description:
        '`variant` sets where the label goes when it floats: `in` inside the control’s top, `over` above it, `on` on its top border. The three controls are empty, so each label rests inside; focus one or type to see it float. `in` makes the control 59 px tall, against 44 px for the other two.',
      sourceKey: 'floatlabel/variants',
      component: FloatLabelVariantsExample,
    },
    {
      title: 'Textarea and password',
      description:
        'A textarea’s label rests at the top of the box, and a password’s floats with its value, like a text input’s. Both take `<label for>`: `for` names the `textarea` and the `inputId` of `wj-password`.',
      sourceKey: 'floatlabel/textarea-password',
      component: FloatLabelTextareaPasswordExample,
    },
    {
      title: 'Select',
      description:
        'A select’s focusable element is a `span`, so `<label for>` cannot name it. Give the label an `id` and point `ariaLabelledBy` at it. The label floats once a value is picked.',
      sourceKey: 'floatlabel/select',
      component: FloatLabelSelectExample,
    },
    {
      title: 'Hint and error',
      description:
        'A hint or an error under a float-labelled control is your own markup, 4 px under the float label. Link it with the control’s own `aria-describedby` (a directive) or `ariaDescribedBy` (a component), and show invalid through the control’s own `invalid` input: the label turns the invalid colour with it. The second control is invalid statically, so the look is visible without interaction. Do not put a float label inside a `wj-field`.',
      sourceKey: 'floatlabel/hint-error',
      component: FloatLabelHintErrorExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjFloatLabelHarness` from `weeljack-ng/floatlabel/testing` to find a float label by its label text and read the text, then reach the control inside it with `getHarness`, as here with `WjInputTextHarness`.',
      sourceKey: 'floatlabel/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'Tab', effect: 'Moves to the control; the float label is not a stop.' }],
  aria: [
    'The `label` element you project names the control: put it after the control and tie it with `for`. A float label adds no semantics and no ARIA inputs; an `aria-*` attribute or a `role` on the `wj-floatlabel` host applies as written.',
    '`wj-select` and its focusable `span` cannot take `<label for>`: give the label an `id` and set `ariaLabelledBy` on the select.',
    'A hint or an error under the control is your own markup. Link it through the control’s own `ariaDescribedBy` (component) or `aria-describedby` (directive), and mark the control invalid through its own `invalid` input.',
    'Use either `wj-field`’s label or a float label on a control, never both. Inside a `wj-field` the control would get two visible labels, and its accessible name would read twice; a `WJ0100` warning in development says so.',
    'A click where the resting label sits reaches the control under it, because Optimus gives the label `pointer-events: none`; the control takes focus. The label itself is no click target and no Tab stop.',
    'The `in` variant pads the control’s top for the label, so a default text input is 59 px tall instead of 44 px. The `over` variant floats the label about 20 px above the control’s box, so leave room above it: at least 24 px between stacked controls.',
    'An error you reveal after blur takes `role="alert"`, as `wj-field` does for its own error. A static error, shown from the start, needs no live role.',
    'Never set a `placeholder` on a float-labelled control: it floats the label at once, so the resting state never shows and the placeholder would crowd the label.',
    'Keep in-field labels short. A float label never wraps: a long one ends in an ellipsis on screen, although assistive technology reads it whole. A label that must be long belongs in a `wj-field`.',
    'Motion: Optimus transitions the label on `all` for 0.2 s, a duration its reduced-motion rule does not reach. The float label names the transitioned properties (`top`, `transform`, `font-size`, `font-weight`, `color`, `background`, `padding`) and sets its duration (`--wj-floatlabel-transition-duration`) to `0s` under `prefers-reduced-motion: reduce`, so the label moves at once.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, type and the label’s position come from the `--wj-*` variables that `provideWeeljack` emits, including `--wj-floatlabel-transition-duration`. The host is `block`, the display of the Optimus root inside it, and adds no box of its own. The root lays its in-flow children in one full-width column, so a control with no width of its own fills the float label: size the `wj-floatlabel` through `class` or `style`, not the control. A control with an explicit width keeps it. For anything else, `pt` reaches the parts of the Optimus float label underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-floatlabel`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-floatlabel` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the box that holds the control and the label.',
    },
  ],
  mapping: [
    {
      optimus: 'variant',
      weeljack: 'variant',
      status: 'kept',
      note: '`in`, `over` or `on`, default `over` (Optimus’s). Where the label goes when it floats: inside the control’s top, above it, or on its border.',
    },
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'The app’s control, then its `<label>`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjFloatLabelPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    {
      optimus: 'None',
      weeljack: '`WJ0100` check',
      status: 'added',
      note: 'A warning in development when the float label sits inside a `wj-field`.',
    },
    dropped('dt, unstyled, ptOptions, FloatLabelModule', droppedAlways),
    dropped('p-floatLabel, p-float-label', 'Duplicate selectors (ADR 0002).'),
  ],
};
