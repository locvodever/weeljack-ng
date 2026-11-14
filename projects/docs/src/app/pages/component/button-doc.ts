import { ButtonBasicExample } from '../../examples/button/basic';
import { ButtonDisabledExample } from '../../examples/button/disabled';
import { ButtonLoadingExample } from '../../examples/button/loading';
import { ButtonSeveritiesExample } from '../../examples/button/severities';
import { ButtonSizesExample } from '../../examples/button/sizes';
import { ButtonVariantsExample } from '../../examples/button/variants';
import type { ComponentDoc, MappingRow } from './component-docs';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const BUTTON_DOC: ComponentDoc = {
  entry: 'button',
  title: 'Button',
  purpose: 'A button with a label, a loading state and a disabled state, 44 px tall by default.',
  examples: [
    {
      title: 'Basic',
      description: 'A label is all a button needs. Put the click handler on `wj-button` itself.',
      sourceKey: 'button/basic',
      component: ButtonBasicExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled button leaves the Tab order and emits no `click`.',
      sourceKey: 'button/disabled',
      component: ButtonDisabledExample,
    },
    {
      title: 'Loading',
      description:
        'A loading button shows a spinner beside its label and is inert. It keeps its accessible name and sets `aria-busy`.',
      sourceKey: 'button/loading',
      component: ButtonLoadingExample,
    },
    {
      title: 'Sizes',
      description: '`small` is 36 px, the default is 44 px and `large` is 52 px tall.',
      sourceKey: 'button/sizes',
      component: ButtonSizesExample,
    },
    {
      title: 'Variants',
      description: 'Solid by default, or `outlined` or `text`.',
      sourceKey: 'button/variants',
      component: ButtonVariantsExample,
    },
    {
      title: 'Severities',
      description: 'The colour roles. Left unset, a button takes the primary (ink) look.',
      sourceKey: 'button/severities',
      component: ButtonSeveritiesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjButtonHarness` from `weeljack-ng/button/testing` to find and drive a button without touching its DOM.',
      sourceKey: 'button/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves focus to the button and away from it.' },
    { key: 'Enter', effect: 'Activates the button once. On `type="submit"` it submits the form.' },
    { key: 'Space', effect: 'Activates the button once.' },
    {
      key: 'Any key, while disabled or loading',
      effect: 'The button is not in the Tab order, and Enter and Space emit nothing.',
    },
  ],
  aria: [
    'The accessible name is the label or the projected content. An icon-only button must set `ariaLabel`.',
    '`ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on the focusable `button` element, not on the `wj-button` host.',
    'Setting an `aria-*` attribute on the `wj-button` host logs the dev-mode warning `WJ0003`: use the inputs instead.',
    'While `loading`, the button sets `aria-busy="true"`.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus button underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-button`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'host', description: 'The `p-button` host element.' },
    {
      part: 'root',
      description:
        'The native `button`. `wj-button` merges `aria-labelledby`, `aria-describedby` and `aria-busy` into it, and they win over a `pt` value.',
    },
    { part: 'label', description: 'The label text element.' },
    { part: 'loadingIcon', description: 'The spinner shown while `loading`.' },
  ],
  mapping: [
    { optimus: 'label', weeljack: 'label', status: 'kept', note: 'Rendered as text.' },
    { optimus: 'loading', weeljack: 'loading', status: 'kept', note: 'Accepts a bare attribute.' },
    {
      optimus: 'disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'Accepts a bare attribute.',
    },
    { optimus: 'size', weeljack: 'size', status: 'kept', note: '`small` or `large`.' },
    {
      optimus: 'severity',
      weeljack: 'severity',
      status: 'kept',
      note: 'Adds `primary`; `null` is dropped.',
    },
    { optimus: 'type', weeljack: 'type', status: 'kept', note: 'Defaults to `button`.' },
    {
      optimus: 'ariaLabel',
      weeljack: 'ariaLabel',
      status: 'kept',
      note: 'Set on the focusable element.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjButtonPt`. Tracks Optimus.',
    },
    {
      optimus: 'outlined',
      weeljack: '`variant="outlined"`',
      status: 'renamed',
      note: 'One `variant` input.',
    },
    {
      optimus: 'text',
      weeljack: '`variant="text"`',
      status: 'renamed',
      note: 'One `variant` input.',
    },
    {
      optimus: 'onClick',
      weeljack: 'Native `(click)` on `wj-button`',
      status: 'renamed',
      note: 'Blocked while disabled or loading.',
    },
    {
      optimus: 'onFocus',
      weeljack: 'Native `(focusin)`',
      status: 'renamed',
      note: 'No `on`-prefixed outputs.',
    },
    {
      optimus: 'onBlur',
      weeljack: 'Native `(focusout)`',
      status: 'renamed',
      note: 'No `on`-prefixed outputs.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy',
      status: 'added',
      note: 'Set on the focusable element.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the focusable element.',
    },
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped('style, styleClass', droppedAlways),
    dropped('raised, rounded, plain, link', droppedByNeed),
    dropped('icon, iconPos, loadingIcon', 'Icons are projected content; the spinner is built in.'),
    dropped('badge, badgeClass, badgeSeverity', droppedByNeed),
    dropped('fluid, tabindex, autofocus, buttonProps', droppedByNeed),
    dropped('contentTemplate, iconTemplate, loadingIconTemplate', 'Content is projected.'),
    dropped('hostName, [pButton], pButtonLabel, pButtonIcon, ButtonModule', droppedByNeed),
  ],
};
