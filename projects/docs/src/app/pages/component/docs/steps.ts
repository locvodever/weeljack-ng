import { StepsBasicExample } from '../../../examples/steps/basic';
import { StepsDisabledStepExample } from '../../../examples/steps/disabled-step';
import { StepsInteractiveExample } from '../../../examples/steps/interactive';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'steps',
  title: 'Steps',
  purpose: 'The steps of a process, with the current one marked, optionally clickable.',
  examples: [
    {
      title: 'Basic',
      description:
        '`wj-steps` needs your app’s router: Optimus injects `Router` and `ActivatedRoute` when it draws the steps, so call `provideRouter(...)` in your application config. Without it Angular throws `NG0201`, naming `ActivatedRoute`, and nothing here catches it. Describe the steps as plain `WjMenuItem` objects (a type from `weeljack-ng`, documented on the Menu page at `/components/menu`) in `model`, and the current one with `activeIndex`, counted from 0 over the visible steps. The steps are read-only by default, so only the current step is a Tab stop and your own buttons move between them. Each step is named by its `label`, and every label must be unique: Optimus tracks the steps by label. Keep to three to five steps with one- or two-word labels. With no visible steps, nothing renders.',
      sourceKey: 'steps/basic',
      component: StepsBasicExample,
    },
    {
      title: 'Interactive',
      description:
        'Set `readonly` to `false` and a click, Enter or Space on a step selects it: `activeIndex` is two-way, so `[(activeIndex)]` follows the selection, and the step’s `command` runs. Selecting the step that is already current changes nothing and reports nothing, though its `command` still runs. A selection is not announced by itself; this example keeps a status line that reports it.',
      sourceKey: 'steps/interactive',
      component: StepsInteractiveExample,
    },
    {
      title: 'Disabled step',
      description:
        'A step with `disabled: true` is faded when the steps are interactive, runs nothing and cannot be selected. The arrow keys still reach it, so a keyboard user can tell it is there. In read-only steps a disabled step looks like any other inactive step.',
      sourceKey: 'steps/disabled-step',
      component: StepsDisabledStepExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjStepsHarness` from `weeljack-ng/steps/testing`. `getStepLabels()`, `getActiveIndex()`, `getActiveLabel()` and `isReadonly()` read the steps as a user meets them, `getSteps()` finds them (each a `WjStepsItemHarness` with `getLabel()`, `getNumber()`, `isActive()`, `isDisabled()`, `click()`, `focus()` and `isFocused()`), and `selectStep(label)` clicks one. A read-only step that is not current reports `isDisabled()`: it is inert. The component under test needs the router, as in your app. Nothing here names an Optimus class.',
      sourceKey: 'steps/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Focuses the current step, the only Tab stop. Leaving the steps resets the Tab stop to the current step, wherever the arrow keys had moved focus.',
    },
    { key: 'Arrow Right, Arrow Left', effect: 'Moves focus to the next and the previous step.' },
    { key: 'Home, End', effect: 'Moves focus to the first and the last step.' },
    {
      key: 'Enter, Space',
      effect:
        'Selects the focused step and runs its `command`, when the steps are not read-only. A disabled step and a read-only step do nothing.',
    },
  ],
  aria: [
    '`wj-steps` needs the app’s router: Optimus injects `Router` and `ActivatedRoute`, which only `provideRouter(...)` provides. `@angular/router` is not a peer of `weeljack-ng`, so the wrapper cannot provide it, and Angular’s `NG0201` reaches your app as thrown.',
    'The current step carries `aria-current="step"`. With a `routerLink` on the steps, Optimus asks the router which one is current instead of reading `activeIndex`, so the marker follows the URL; the Tab stop still follows `activeIndex`.',
    'Each step is named by its visible `label`. The `nav` landmark is named by `ariaLabel` (the name) or `ariaLabelledBy` (the id of an element that names it, such as a heading), set on the `nav` and not on the `wj-steps` host: an `aria-*` attribute on the host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'Gap, fixed: Optimus’s `nav` has no name, and Optimus 2.0.2 renders no part for it, so `pt` cannot set one. `wj-steps` writes `aria-label` and `aria-labelledby` on the `nav` after each render, from `ariaLabel` and `ariaLabelledBy`, and keeps them when the steps appear later. Unset, neither attribute is present.',
    'Labels must be unique. Optimus tracks the steps by `label`, and Angular logs `NG0955` in development when two steps in a list already drawn share one.',
    'The current step is a filled circle, so it does not rely on colour of the text alone. A disabled step is faded in interactive steps and keeps a number and a label, so it is still read.',
    'Gap (Optimus): the arrow keys, Home and End also reach a disabled step and, in read-only steps, every inactive one. They are announced as unavailable (`aria-disabled`) and the keys do nothing there.',
    'Gap (Optimus): an `activeIndex` past the last step leaves no current step and no Tab stop. Keep it on a step that exists.',
    '`activeIndex` and the numbers count the visible steps: a step with `visible: false` is left out, and the others are renumbered.',
    'Every step is at least 24 × 24 px: the number’s 32 px circle and the label sit in one link. Labels wrap at spaces and are never cut; a step never narrows below its longest word.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, and the steps share its width. The row is Optimus’s own: a 32 px circle with a number, then the label, joined by a 2 px line through the circles’ centre. The current step’s circle is filled with `--wj-primary-color` and its number is `--wj-primary-contrast-color`; labels wrap and are centred. Unlike the other wrappers, `wj-steps` has no `pt`: Optimus 2.0.2’s Steps renders no pass-through part, so a `pt` would reach nothing. It arrives with the Optimus minor that gives Steps parts. An app’s own CSS, unlayered, wins over the component’s rules.',
  parts: [],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Mapped like `wj-menu`’s: every item gets `escape: true`, a narrowed command `{ originalEvent, item }` (Optimus’s `index` is dropped, `activeIndex` carries it) and no mutation. Hidden items are left out. `label`, `command`, `disabled`, `visible`, `url`, `target`, `routerLink`, `queryParams` and `fragment` do something; `items`, `separator` and `expanded` are ignored.',
    },
    {
      optimus: 'activeIndex, activeIndexChange',
      weeljack: 'activeIndex',
      status: 'kept',
      note: 'A two-way `model<number>(0)`, counted over the visible steps. A selection sets it; setting the current value again emits nothing.',
    },
    {
      optimus: 'readonly',
      weeljack: 'readonly',
      status: 'kept',
      note: 'Default `true`, as Optimus’s. When `false`, a click, Enter or Space on a step selects it and runs its `command`.',
    },
    dropped(
      'exact',
      'Optimus 2.0.2 binds it only to `[attr.ariaCurrentWhenActive]`, which renders a non-ARIA attribute, so it changes nothing.',
    ),
    dropped(
      'pt',
      'Optimus 2.0.2’s Steps renders no pass-through part (no `ptm`, no `pBind`), so a `pt` would reach nothing. It arrives with the Optimus minor that gives Steps parts.',
    ),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('StepsModule, StepsStyle', 'Optimus internals: one selector per wrapper.'),
  ],
};
