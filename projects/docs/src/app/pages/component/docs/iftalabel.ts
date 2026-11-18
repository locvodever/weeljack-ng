import { IftaLabelBasicExample } from '../../../examples/iftalabel/basic';
import { IftaLabelHintErrorExample } from '../../../examples/iftalabel/hint-error';
import { IftaLabelSelectExample } from '../../../examples/iftalabel/select';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'iftalabel',
  title: 'Ifta label',
  purpose: 'A label fixed at the top inside a control, so the name stays visible while you type.',
  examples: [
    {
      title: 'Basic',
      description:
        'Project the control, then its `<label>`, and tie them with `for`. The label always sits at the top inside the control, and the control pads its top to make room, so a text input is 59 px tall instead of 44 px. Focus changes only the label’s colour.',
      sourceKey: 'iftalabel/basic',
      component: IftaLabelBasicExample,
    },
    {
      title: 'Select',
      description:
        'A select’s focusable element is a `span`, so `<label for>` cannot name it. Give the label an `id` and point `ariaLabelledBy` at it. The chosen option shows under the label.',
      sourceKey: 'iftalabel/select',
      component: IftaLabelSelectExample,
    },
    {
      title: 'Hint and error',
      description:
        'A hint or an error under an ifta-labelled control is your own markup, 4 px under the ifta label. Link it with the control’s own `aria-describedby` (a directive) or `ariaDescribedBy` (a component), and show invalid through the control’s own `invalid` input: the label turns the invalid colour with it. The second control is invalid statically, so the look is visible without interaction. Do not put an ifta label inside a `wj-field`.',
      sourceKey: 'iftalabel/hint-error',
      component: IftaLabelHintErrorExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjIftaLabelHarness` from `weeljack-ng/iftalabel/testing` to find an ifta label by its label text and read the text, then reach the control inside it with `getHarness`, as here with `WjInputTextHarness`.',
      sourceKey: 'iftalabel/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'Tab', effect: 'Moves to the control; the ifta label is not a stop.' }],
  aria: [
    'The `label` element you project names the control: put it after the control and tie it with `for`. An ifta label adds no semantics and no ARIA inputs; an `aria-*` attribute or a `role` on the `wj-iftalabel` host applies as written.',
    '`wj-select` and its focusable `span` cannot take `<label for>`: give the label an `id` and set `ariaLabelledBy` on the select.',
    'A hint or an error under the control is your own markup. Link it through the control’s own `ariaDescribedBy` (component) or `aria-describedby` (directive), and mark the control invalid through its own `invalid` input.',
    'Use either `wj-field`’s label or an ifta label on a control, never both. Inside a `wj-field` the control would get two visible labels, and its accessible name would read twice; a `WJ0100` warning in development says so.',
    'A click where the label sits reaches the control under it, because Optimus gives the label `pointer-events: none`; the control takes focus. The label itself is no click target and no Tab stop.',
    'The label pads the control’s top, so a default text input is 59 px tall instead of 44 px. Plan the form’s vertical rhythm for the taller box.',
    'An error you reveal after blur takes `role="alert"`, as `wj-field` does for its own error. A static error, shown from the start, needs no live role.',
    'The label is always visible, so a placeholder is not needed. One is allowed: it shows under the label as a format, never as the name.',
    'Keep in-field labels short. An ifta label never wraps: a long one ends in an ellipsis on screen, although assistive technology reads it whole. A label that must be long belongs in a `wj-field`.',
    'Motion: Optimus transitions the label on `all` for 0.2 s, a duration its reduced-motion rule does not reach. The label only changes colour, so the ifta label names that one property (`color`) and sets its duration (`--wj-iftalabel-transition-duration`) to `0s` under `prefers-reduced-motion: reduce`, so the colour changes at once.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, type and the label’s position come from the `--wj-*` variables that `provideWeeljack` emits, including `--wj-iftalabel-transition-duration`. The host is `block`, the display of the Optimus root inside it, and adds no box of its own. The root lays its in-flow children in one full-width column, so a control with no width of its own fills the ifta label: size the `wj-iftalabel` through `class` or `style`, not the control. A control with an explicit width keeps it. For anything else, `pt` reaches the parts of the Optimus ifta label underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-iftalabel`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-iftalabel` element, which is also its root box.',
    },
    {
      part: 'root',
      description: 'The same element as `host`: the box that holds the control and the label.',
    },
  ],
  mapping: [
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
      note: 'Typed `WjIftaLabelPt`. `host` and `root` land on the same element. Tracks Optimus.',
    },
    {
      optimus: 'None',
      weeljack: '`WJ0100` check',
      status: 'added',
      note: 'A warning in development when the ifta label sits inside a `wj-field`.',
    },
    dropped('dt, unstyled, ptOptions, IftaLabelModule', droppedAlways),
    dropped('p-iftaLabel, p-ifta-label', 'Duplicate selectors (ADR 0002).'),
  ],
};
