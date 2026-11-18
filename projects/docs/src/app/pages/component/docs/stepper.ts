import { StepperBasicExample } from '../../../examples/stepper/basic';
import { StepperLinearExample } from '../../../examples/stepper/linear';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'stepper',
  title: 'Stepper',
  purpose: 'A task split into numbered steps, one panel at a time.',
  examples: [
    {
      title: 'Basic',
      description:
        'Declare a `wj-step-list` of `wj-step` children and a `wj-step-panels` of `wj-step-panel` children inside `wj-stepper`, and import all five classes (`WjStepper`, `WjStepList`, `WjStep`, `WjStepPanels`, `WjStepPanel`). A step and its panel share a `value`, and `value` on `wj-stepper` is the active one, so step 1 is active at rest here. Values run 1, 2, 3 and so on: Optimus shows the value as the step’s number, and every value is unique within its stepper. The stepper never moves by itself: Back and Next are your own buttons, and they set `value`. A panel that held the focused button hides when the step changes, so move focus to the new panel (here, to its heading, which tells a screen-reader user where they are). Keep to three to five steps with one- or two-word titles.',
      sourceKey: 'stepper/basic',
      component: StepperBasicExample,
    },
    {
      title: 'Linear',
      description:
        'With `linear`, every step but the active one is disabled: it is dimmed, out of the Tab order and not clickable, so the Next button in the panel is the way forward. It is the same model as Basic.',
      sourceKey: 'stepper/linear',
      component: StepperLinearExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjStepperHarness` and `WjStepHarness` from `weeljack-ng/stepper/testing`. The stepper harness lists the steps with `getSteps()`, optionally only those whose `title` matches, and reads `getStepTitles()`, `getActiveStep()` and `getActivePanelText()`. A step harness reads `getTitle()`, `getNumber()`, `isActive()` and `isDisabled()`, and drives the step with `select()` (a click) and `focus()`; `isFocused()` says whether it has focus. A step is found through the steps the app drew. Nothing here names an Optimus class.',
      sourceKey: 'stepper/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Kept as Optimus does it: every enabled step button is its own Tab stop (the tab list is not one stop, as APG Tabs would make it), and a disabled step is skipped. Tab from the last step goes on to the controls in the active panel. Listed as a gap.',
    },
    {
      key: 'Enter, Space',
      effect: 'Activates the focused step and shows its panel. Each press activates once.',
    },
    {
      key: 'Arrow keys, Home, End',
      effect:
        'Do nothing: Optimus has no handler, so focus stays on the step and nothing is activated. Listed as a gap.',
    },
  ],
  aria: [
    'APG has no stepper pattern. Optimus marks the stepper up with the tab roles, so its reference is APG Tabs: each step button is a `role="tab"`, each panel a `role="tabpanel"`, and a step button points at its panel with `aria-controls`. Whether `wj-stepper` should go further is an open question for the library’s owner: either adopt the APG Tabs keyboard (roving tabindex and arrow keys) or drop the tab roles for buttons with `aria-current="step"`. Either would be a later minor. Until then `wj-stepper` keeps Optimus’s behaviour, fixes only what axe flags, and lists every other gap here.',
    'Setting an `aria-*` attribute on the `wj-stepper`, `wj-step-list`, `wj-step`, `wj-step-panels` or `wj-step-panel` host logs the dev-mode warning `WJ0003` and is not forwarded. A step is named by its own text.',
    'Gap, fixed: Optimus makes the `p-stepper` root a `role="tablist"` although it also holds the panels, which axe rejects (`aria-required-children`). The root takes `role="presentation"` and `wj-step-list` takes `role="tablist"`, so the tab list holds only the steps. Both are routed through `pt` and win over a consumer `pt` value for `role` on those two parts.',
    'Gap, fixed: Optimus puts `aria-current="step"` on the step element, which is `role="presentation"`, and axe rejects a presentation element that carries an ARIA attribute inside a tab list. The attribute is removed from the step element and set on the step button instead, so the button announces the current step. This is the one routed removal: Optimus sets the attribute again each time a step turns active, so the wrapper re-applies the removal on every change. A consumer `pt` that sets `aria-current` on the step element keeps its value.',
    'Gap, fixed: Optimus gives the `role="tab"` step button no `aria-selected`. Every step button now carries it, `true` on the active step only.',
    'Gap, listed: the tab list has no name. Optimus gives it none and `wj-stepper` has no input for one, so a screen reader announces an unnamed tab list; put a visible heading above the stepper.',
    'Gap, listed: a panel points at its step with `aria-controls`, not `aria-labelledby`, so a panel has no accessible name of its own. Optimus builds the step button’s id from an id it generates, which the wrapper cannot reach.',
    'Gap, listed: no roving tabindex and no arrow keys (the keyboard table above). The Back and Next buttons in your panels are the reliable way to move.',
    'Every `value` is a number, and unique within one `wj-stepper`: Optimus builds the ids that a step and its panel point at from it. `value` is required, and it must stay on an existing step, or no step is active and no panel shows. Only `wj-step-list` and `wj-step-panels` children render. Anything else you write directly inside `wj-stepper`, a `wj-step` outside the step list and a `wj-step-panel` outside the panels are dropped.',
    'When your own buttons change the step, move focus to the new panel (the Basic example focuses its heading with `tabindex="-1"`): the old panel and the button that had focus hide on the change, so focus would otherwise be lost.',
    'The active step’s number is filled with the primary colour, so the current step differs from the others by more than its text colour. Keep titles short: a title wraps at spaces and is never cut off, and a row that still does not fit scrolls inside the stepper.',
    'Motion: only the horizontal layout is wrapped, and in it a panel changes at once. `wj-stepper` still binds `{ safe: true }` to Optimus’s motion options, so `pt.motion` cannot turn reduced motion off.',
    'No axe rule is tolerated on this page: the documented states (step 1 active, `linear`, the last step active, and the middle step with buttons in the panel) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, the circles, the separators and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, so its width is yours. A part renders nothing itself: a part’s host is hidden and takes no `class` or `style`, so style the row, a step, the panels and a panel through each part’s own `pt`. The routed attributes (`role` on the stepper root and on the step list, `aria-selected` and `aria-current` on a step button, and the removal of `aria-current` from the step element) win over a `pt` value of the same name. The step element of the active step also carries a `data-wj-active` attribute, which the wrapper uses to re-apply that removal; you may select on it. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-stepper`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'wj-stepper · root', description: 'The `p-stepper` element, the row and the panels.' },
    {
      part: 'wj-step-list · root',
      description: 'The `p-step-list` element, the row of steps (the tab list).',
    },
    { part: 'wj-step · root', description: 'One step, the `p-step` element.' },
    { part: 'wj-step · header', description: 'The step button, a `role="tab"` element.' },
    { part: 'wj-step · number', description: 'The circle that holds the step’s number.' },
    { part: 'wj-step · title', description: 'The step’s title.' },
    { part: 'wj-step-panels · root', description: 'The box that holds the panels.' },
    { part: 'wj-step-panel · root', description: 'One panel, a `role="tabpanel"` element.' },
    {
      part: 'wj-step-panel · contentWrapper',
      description: 'The wrapper around the panel’s content.',
    },
    { part: 'wj-step-panel · content', description: 'The element that holds the panel’s content.' },
  ],
  mapping: [
    {
      optimus: '`p-stepper` value',
      weeljack: '`wj-stepper` value',
      status: 'kept',
      note: 'Required, and a two-way model, so one panel always shows. Move between steps by setting it from your own buttons.',
    },
    {
      optimus: 'linear',
      weeljack: 'linear',
      status: 'kept',
      note: 'Accepts a bare attribute. Every step but the active one is disabled.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjStepperPt`. Tracks Optimus.',
    },
    dropped(
      'motionOptions; transitionOptions',
      'Not exposed: `{ safe: true }` is bound, and `transitionOptions` is a deprecated alias.',
    ),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    {
      optimus: '`p-step-list` pt',
      weeljack: '`wj-step-list` pt',
      status: 'kept',
      note: 'Typed `WjStepListPt`. Tracks Optimus.',
    },
    {
      optimus: '`p-step` value, disabled, pt',
      weeljack: '`wj-step` value, disabled, pt',
      status: 'kept',
      note: '`value` is required, a number and unique: Optimus shows it as the step’s number, so values run 1, 2, 3 and so on. `disabled` accepts a bare attribute. `pt` is typed `WjStepPt`.',
    },
    {
      optimus: '`p-step` content',
      weeljack: '`wj-step` content',
      status: 'kept',
      note: 'The step’s title.',
    },
    dropped(
      '`p-step` #content (a custom step with `activateCallback`)',
      'Dropped by need: a step is a number and a title.',
    ),
    {
      optimus: '`p-step-panels` pt',
      weeljack: '`wj-step-panels` pt',
      status: 'kept',
      note: 'Typed `WjStepPanelsPt`. Tracks Optimus.',
    },
    {
      optimus: '`p-step-panel` value, pt',
      weeljack: '`wj-step-panel` value, pt',
      status: 'kept',
      note: '`value` is required, a number and unique. `pt` is typed `WjStepPanelPt`.',
    },
    {
      optimus: '`p-step-panel` #content (with `activateCallback`, `value` and `active`)',
      weeljack: '`wj-step-panel` content',
      status: 'renamed',
      note: 'The panel’s projected content. Navigation goes through the `value` model, so no slot context is needed.',
    },
    dropped(
      '`p-step-item`; `p-stepper-separator`',
      'The vertical layout is dropped by need, and the separator is drawn by Optimus itself.',
    ),
    dropped(
      'StepperModule; updateValue, isStepActive',
      'No NgModule, and the state is the `value` model.',
    ),
  ],
};
