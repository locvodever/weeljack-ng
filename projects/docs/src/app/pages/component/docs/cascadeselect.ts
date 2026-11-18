import { CascadeSelectBasicExample } from '../../../examples/cascadeselect/basic';
import { CascadeSelectDisabledExample } from '../../../examples/cascadeselect/disabled';
import { CascadeSelectInAFieldExample } from '../../../examples/cascadeselect/in-a-field';
import { CascadeSelectSizesExample } from '../../../examples/cascadeselect/sizes';
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
  entry: 'cascadeselect',
  title: 'Cascade select',
  purpose:
    "A single-choice select for a tree of options, 44 px tall by default. Its list opens under the control, and a group in it opens the next level beside it (stacked inside the list under a 960 px viewport). Give it `options`, a tree of leaves and groups (`WjCascadeSelectOption<T>`), and bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is the picked leaf’s `value`, `null` while none is picked. Only a leaf can be picked. A leaf is a `WjOption<T>` (the shared option type, `import type { WjOption } from 'weeljack-ng'`), and a group is an object with a `label` and `children`. Inside a field, the field’s label names the control, and the field describes it and marks it invalid.",
  examples: [
    {
      title: 'Basic',
      description:
        'Country, then state, then city. A group opens its level when it is chosen; only a leaf, here a city, becomes the value. Give every leaf a `value` and no `children` key: a row that has a `children` key is a group, even when it is empty. Values must be distinct, as Optimus marks every row whose value equals the picked one. Outside a field, name the control with a visible `<label for>` that matches `inputId` (or set `ariaLabel`).',
      sourceKey: 'cascadeselect/basic',
      component: CascadeSelectBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field, and the label is a `<label for>` that names the control. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'cascadeselect/in-a-field',
      component: CascadeSelectInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled control leaves the Tab order, ignores every key and does not open. Its value’s label still shows, found through `options`. In the second field Geelong is disabled: a disabled leaf or group, at any level, is shown but cannot be picked or opened, and is announced as unavailable. Optimus has no empty row, so with nothing to pick, disable the control and say why in the field’s hint.',
      sourceKey: 'cascadeselect/disabled',
      component: CascadeSelectDisabledExample,
    },
    {
      title: 'Sizes',
      description: '`small` is 36 px, the default is 44 px and `large` is 52 px tall.',
      sourceKey: 'cascadeselect/sizes',
      component: CascadeSelectSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjCascadeSelectHarness` from `weeljack-ng/cascadeselect/testing` to open and close the list, read the text the control shows, read the labels of each level (level 1 is the list under the control), open a group by its label, pick a leaf by its path of labels, and check the disabled, required and invalid states, without touching the DOM. A level below the first cannot render when `@openng/optimus-ui` is left unlinked, as Vitest’s dependency pre-bundling leaves it: Optimus 2.0.2 reads one of its own classes before it is defined, so opening a group throws “token must be defined”. An app build runs the Angular linker and is not affected.',
      sourceKey: 'cascadeselect/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the control and away from it. With the list open, Tab closes it without picking the focused row.',
    },
    {
      key: 'Down',
      effect:
        'While the list is closed, opens it with no row focused, or on the picked leaf with its groups open. While it is open, focuses the first row that is not disabled, then the next one of the level, and stops at the last. Focusing a group opens its level, or closes it when it was already open.',
    },
    {
      key: 'Up',
      effect:
        'While the list is closed, opens it as Down does. While it is open, focuses the previous row that is not disabled, and stops at the first. A group is opened or closed as Down does.',
    },
    {
      key: 'Right',
      effect:
        'On a group whose level is open, moves into that level, to its first row. On a closed group, opens its level.',
    },
    {
      key: 'Left',
      effect:
        'Moves back to the group the level belongs to and closes the level. On the first level, does nothing.',
    },
    {
      key: 'Enter, Space',
      effect:
        'While the list is closed, opens it. On a leaf, picks it, closes the list and keeps focus on the control. On a group, opens or closes its level and picks nothing.',
    },
    {
      key: 'Home, End',
      effect:
        'Focuses the first or the last row of the level that is not disabled. A group opens its level. On a leaf End also picks it, and the list stays open.',
    },
    {
      key: 'A printable character',
      effect:
        'Focuses the first row of the level whose label starts with the letters typed in the last half second, skipping disabled rows. A key that matches no row focuses the first row. Opens the list when it is closed.',
    },
    {
      key: 'Escape',
      effect: 'Closes the list without picking, keeps focus on the control and keeps the value.',
    },
    {
      key: 'Backspace, PageDown, PageUp',
      effect: 'Nothing. There is no clear icon, so the value cannot be cleared from the keyboard.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The control is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The focusable element is Optimus’s visually hidden `input` with `role="combobox"` and `aria-haspopup="tree"`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-cascadeselect`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development. The text the control shows is a separate element.',
    'An input is labelable: inside a `wj-field` the field renders a `<label for>` that names it, and a click on that label focuses it. Outside a field, use a visible `<label for>` that matches `inputId`, or set `ariaLabel` or `ariaLabelledBy`.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The control sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The list is a `role="tree"` named from the translation (`aria.listLabel`), and each row is a `treeitem` with its level, set size and position. A leaf is `aria-selected`, true for the picked one. A group says `aria-expanded`, `true` while its level is open. A disabled row says `aria-disabled`. Optimus sets neither of the last two: this component writes them for the first level through `pt`, and for the levels below through the DOM, because Optimus gives those no `pt`. Under the same limit it hands the levels below no disabled state, so this component also dims a disabled row there and puts it out of a mouse’s reach.',
    'No row has an `aria-label` of its own: an open group contains its level, so its own text would not be part of its visible text. A row is named from its content, and an open group’s name includes the text of its level.',
    'Only a leaf is a value. A `value` that no leaf has shows the placeholder, and the control keeps the value, so it follows the tree if the leaf appears later. Optimus clears its own value whenever `options` changes; this component writes the `value` back, and tells the form nothing, so keep one `options` array while the tree is the same.',
    'Gap: the combobox holds no value, only the placeholder, and the shown text is a separate `span`, so a screen reader may not announce the picked leaf when the control is focused. The screen-reader pass decides what to do.',
    'Gap: with no options the list opens as an empty box with no message. Disable the control while there is nothing to pick, and say why in the field’s hint.',
    'Gap: the combobox’s `aria-controls` names an id that no element carries while the list is open.',
    'Gap: Home and End pick a leaf they land on, because Optimus treats them as a click. Use the arrow keys and Enter to pick on purpose.',
    'Gap: a changed `placeholder` reaches the hidden input at once, but the shown text only after the next change of `value`, because Optimus computes it from a plain input.',
    'Gap: Alt+Up closes the list without picking the focused leaf, though Optimus documents it as a pick.',
    'The levels open inside the host. An ancestor that clips its overflow clips them too: give the field room, or do not clip. Under a 960 px viewport the levels stack inside the list, each under its group, and the group’s icon turns to point down while its level is open. That turn lasts 0.2 s and is not stopped by reduced motion.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the list) is recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, and the Optimus root inside it stretches to the host’s width, so size the control with `class` or `style` on `wj-cascadeselect`. The chevron and the group icon take the muted text colour. For anything else, `pt` reaches the parts of the Optimus cascade select underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-cascadeselect`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `hiddenInput` part lose to `ariaDescribedBy` and `aria-invalid`, which the component routes there. On `label` and `option` they lose to `aria-disabled` and `aria-expanded`. A function-form `pt` is called once, with the root cascade select, and its result applies to every part. Optimus gives the levels below the first no `pt`: the parts of their rows (`option`, `optionContent`, `optionText`, `groupIcon`) and of the lists below the second level take none.',
  parts: [
    {
      part: 'root',
      description: 'The Optimus root element, around the hidden input and the text.',
    },
    {
      part: 'hiddenInput',
      description:
        'The visually hidden `input` with `role="combobox"`, and the focusable element. It is the part the ARIA inputs are set on.',
    },
    {
      part: 'label',
      description: 'The text the control shows: the picked leaf or the placeholder.',
    },
    { part: 'dropdown', description: 'The chevron, hidden from assistive tech.' },
    { part: 'overlay', description: 'The panel that holds the list, opened inside the host.' },
    { part: 'list', description: 'The first level’s `ul` with `role="tree"`.' },
    {
      part: 'optionList',
      description: 'The `ul` with `role="group"` that holds the level a group opens.',
    },
    { part: 'option', description: 'Each row: an `li` with `role="treeitem"`.' },
    { part: 'optionContent', description: 'The row’s clickable box, around its text and icon.' },
    { part: 'optionText', description: 'The row’s label.' },
    { part: 'groupIcon', description: 'The icon at the end of a group row.' },
  ],
  optimusSelector: 'p-cascadeSelect',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<T | null>(null)`: the picked leaf’s value, two-way as `[(value)]`. `null` while none is picked.',
    },
    {
      optimus: 'onChange',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output.',
    },
    {
      optimus: 'options',
      weeljack: 'options',
      status: 'kept',
      note: 'Retyped `WjCascadeSelectOption<T>[]`: a leaf (`WjOption<T>`) or a group with `label` and `children`.',
    },
    dropped(
      'optionLabel, optionValue, optionGroupLabel, optionGroupChildren, optionDisabled',
      'Fixed to `label`, `value`, `label`, `children` and `disabled`. The wrapper reads the leaf’s value itself.',
    ),
    dropped(
      'value (Optimus’s own input)',
      'The wrapper is the accessor: one source of truth, the `value` model.',
    ),
    {
      optimus: 'placeholder',
      weeljack: 'placeholder',
      status: 'kept',
      note: 'Rendered as text.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside.',
    },
    {
      optimus: 'inputId, ariaLabel, ariaLabelledBy',
      weeljack: 'inputId, ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the hidden input. Optimus binds them there.',
    },
    dropped('inputLabel', 'A duplicate of `ariaLabel`.'),
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the hidden input, merged with the field’s hint and error ids.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` or `large`: 36 or 52 px against 44 px.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjCascadeSelectPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'native focusin, focusout',
      status: 'renamed',
      note: 'Listen to the native `focusin` and `focusout` on the host. There are no `on` outputs.',
    },
    dropped('onShow, onHide, onBeforeShow, onBeforeHide, onGroupChange', droppedByNeed),
    dropped('showClear, onClear, #clearicon', droppedByNeed),
    dropped(
      'searchMessage, emptyMessage, selectionMessage, emptySearchMessage, emptySelectionMessage',
      'These messages come from the translation, so they follow the app’s language.',
    ),
    dropped(
      'loading, loadingIcon, breakpoint, focusOnHover, selectOnFocus, autoOptionFocus, searchLocale, dataKey, tabindex, autofocus, id, name',
      'By need. Optimus’s defaults hold: the levels stack under a 960 px viewport.',
    ),
    dropped('variant, fluid', 'The host is the box: size it with CSS.'),
    dropped(
      'appendTo, overlayOptions, motionOptions',
      'The list opens inside the host, and its motion is fixed with `safe: true`.',
    ),
    dropped(
      '#value, #option, #header, #footer, #triggericon, #loadingicon, #optiongroupicon',
      'By need. Template slots are not exposed; `wjCascadeSelectOption` is the first candidate when a use appears.',
    ),
    dropped('show(), hide(), focus(), clear()', droppedByNeed),
    dropped(
      'panelStyle, panelStyleClass, styleClass, dt, unstyled, ptOptions, CascadeSelectModule, p-cascadeselect, p-cascade-select',
      droppedAlways,
    ),
  ],
};
