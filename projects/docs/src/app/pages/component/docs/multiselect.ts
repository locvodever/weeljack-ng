import { MultiSelectBasicExample } from '../../../examples/multiselect/basic';
import { MultiSelectDisabledExample } from '../../../examples/multiselect/disabled';
import { MultiSelectInAFieldExample } from '../../../examples/multiselect/in-a-field';
import { MultiSelectSignalFormsExample } from '../../../examples/multiselect/signal-forms';
import { MultiSelectSizesExample } from '../../../examples/multiselect/sizes';
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
  entry: 'multiselect',
  title: 'Multi select',
  purpose:
    "A multiple-choice select, 44 px tall by default. Its list opens under the control, with a checkbox on every option and, above them, one checkbox that picks or unpicks every option. Give it `options` (`WjOption<T>[]`, the shared option type: `import type { WjOption } from 'weeljack-ng'`) and bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is an array of the picked options’ `value`s, `[]` while none is picked, and a form that writes `null` gets `[]`. Every pick is a new array, and your own array is never changed. Inside a field, the field’s label names the control, and the field describes it and marks it invalid.",
  examples: [
    {
      title: 'Basic',
      description:
        'The closed control shows the placeholder while nothing is picked, then up to three labels separated by commas, then a count (“4 items selected”, from the translation). The value keeps pick order: picks are appended, an unpick removes, and toggle-all writes the options in their own order. Values must be distinct, and are compared deeply, so they may be objects. Outside a field, name the control with a visible `<label for>` that matches `inputId` (or set `ariaLabel`).',
      sourceKey: 'multiselect/basic',
      component: MultiSelectBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field, and the label is a `<label for>` that names the control. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'multiselect/in-a-field',
      component: MultiSelectInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled control leaves the Tab order, ignores every key and does not open. The labels of its value still show. In the second field Sunday is disabled: a disabled option is shown but cannot be picked, is skipped by the arrow keys and by toggle-all, and is announced as unavailable. A disabled option that is already picked stays picked.',
      sourceKey: 'multiselect/disabled',
      component: MultiSelectDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall. The checkboxes in the list are 24 px at every size.',
      sourceKey: 'multiselect/sizes',
      component: MultiSelectSizesExample,
    },
    {
      title: 'Signal forms',
      description:
        'Bind `[formField]` to a signal-forms field of type `string[]`. An empty array is not “empty” to `required`, so ask for a pick with `minLength(path.days, 1, { message })`. The field shows the error once the control is touched, or on Save, which touches every field.',
      sourceKey: 'multiselect/signal-forms',
      component: MultiSelectSignalFormsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjMultiSelectHarness` from `weeljack-ng/multiselect/testing` to open and close the list, read the text the control shows, read the labels of the options and which are picked, pick or unpick an option by its label, toggle all, and check the disabled, required and invalid states, without touching the DOM. The methods that pick open the list first and leave it open; `getOptionLabels` only reads it, so it sees nothing while the list is closed.',
      sourceKey: 'multiselect/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the control and away from it. With the list open, Tab moves into it, to the toggle-all checkbox, and the next Tab returns to the control (and Shift+Tab the other way), so focus is never lost while the list is open. Close the list with Escape to move on.',
    },
    {
      key: 'Down',
      effect:
        'While the list is closed, opens it and focuses the first option, or the first picked one. While it is open, focuses the next option that is not disabled, and stops at the last.',
    },
    {
      key: 'Up',
      effect:
        'While the list is closed, opens it on the last option. While it is open, focuses the previous option that is not disabled, and stops at the first.',
    },
    {
      key: 'Home, End',
      effect: 'Focuses the first or the last option. Opens the list when it is closed.',
    },
    {
      key: 'PageDown, PageUp',
      effect:
        'Scrolls the list to its last or its first option. The focused option does not change.',
    },
    {
      key: 'Enter, Space',
      effect:
        'While the list is closed, opens it. While it is open, picks the focused option or unpicks it, and the list stays open. On the toggle-all checkbox, Space picks every enabled option, or unpicks all of them.',
    },
    {
      key: 'A printable character',
      effect:
        'Focuses the first option whose label starts with the letters typed in the last half second, and picks nothing. Opens the list when it is closed.',
    },
    {
      key: 'Ctrl+A',
      effect: 'Picks every enabled option.',
    },
    {
      key: 'Escape',
      effect:
        'Closes the list without changing the value. Focus stays on the control when Escape is pressed there.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The control is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The focusable element is Optimus’s visually hidden `input` with `role="combobox"` and `aria-haspopup="listbox"`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-multiselect`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development. The text the control shows is a separate element.',
    'An input is labelable: inside a `wj-field` the field renders a `<label for>` that names it, and a click on that label focuses it. Outside a field, use a visible `<label for>` that matches `inputId`, or set `ariaLabel` or `ariaLabelledBy`.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The control sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The list is a `role="listbox"` with `aria-multiselectable="true"`, named from the translation (`aria.listLabel`). Each option is a `role="option"` with its set size and position, and `aria-selected` and `aria-checked` true while it is picked. A disabled option says `aria-disabled`, which Optimus does not set: this component writes it through `pt`.',
    'Every message comes from the translation, so it follows the app’s language: the empty message, the count shown beyond three picks, the list’s name and the toggle-all checkbox’s name.',
    'Gap, fixed: the toggle-all checkbox has no visible text and is named "Select all" in both states (`aria.selectAll` and `aria.unselectAll`); the checkbox’s own state says whether it is checked. The screen-reader pass confirms the name (D6).',
    'Gap: the combobox holds no readable value, only the placeholder, and the shown text is a separate element, so a screen reader may not announce the picked labels when the control is focused. The screen-reader pass decides what to do.',
    'Gap: a click on an option, or on the toggle-all checkbox, moves focus off the control to the list, so the control is reported touched while its list is still open, and the keys of the control (Escape, the arrows) do nothing until focus returns with Tab or a click on the control. The picks themselves are unaffected.',
    'Gap: Optimus shows a filter input in the header by default, with no name. This component turns it off (`filter` is fixed to `false`), so the header holds only the toggle-all checkbox.',
    'Gap: Optimus has no partial mark on toggle-all. It is checked only while every option is picked.',
    'Fixed: a picked row takes no fill. Optimus’s highlight puts an ink fill under a checked ink checkbox, so in the light scheme the box vanishes into its row. `highlightOnSelect` is fixed to `false`, and the 24 px checkbox carries the pick.',
    'Fixed: a `value` that has no option is kept, not shown, and put back in front of the next pick. Optimus alone shows the word “null” for it.',
    'Fixed: the box that scrolls the options is out of the Tab order. A browser makes a scrolling box a Tab stop of its own.',
    'The list opens inside the host. An ancestor that clips its overflow clips it too: give the field room, or do not clip. The list scrolls past 200 px.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the list) is recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, and the Optimus root inside it stretches to the host’s width, so size the control with `class` or `style` on `wj-multiselect`. The chevron takes the muted text colour. For anything else, `pt` reaches the parts of the Optimus multi select underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-multiselect`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `hiddenInput` part lose to `ariaDescribedBy` and `aria-invalid`, which the component routes there; on `listContainer` they lose to `tabindex`, and on `option` to `aria-disabled`. A function-form `pt` is called once, with the root multi select, and its result applies to every part. Optimus’s `pt` type does not declare `hiddenInput`, though its template reads it: this component reaches it, but a typed `pt` of your own cannot name it.',
  parts: [
    {
      part: 'root',
      description: 'The Optimus root element, around the hidden input and the text.',
    },
    {
      part: 'hiddenInput',
      description:
        'The visually hidden `input` with `role="combobox"`, and the focusable element. It is the part the ARIA inputs are set on. Untyped in Optimus’s `pt`.',
    },
    { part: 'labelContainer', description: 'The box around the shown text.' },
    {
      part: 'label',
      description: 'The text the control shows: the placeholder, the picked labels, or the count.',
    },
    { part: 'dropdown', description: 'The chevron, hidden from assistive tech.' },
    {
      part: 'overlay',
      description: 'The panel that holds the header and the list, opened inside the host.',
    },
    { part: 'header', description: 'The bar above the list. It holds the toggle-all checkbox.' },
    {
      part: 'pcHeaderCheckbox',
      description: 'The toggle-all checkbox, with its own `root`, `input`, `box` and `icon` parts.',
    },
    { part: 'listContainer', description: 'The box that scrolls the options.' },
    { part: 'list', description: 'The `ul` with `role="listbox"`.' },
    { part: 'option', description: 'Each option: an `li` with `role="option"`.' },
    {
      part: 'pcOptionCheckbox',
      description:
        'The checkbox in each option, with its own `root`, `input`, `box` and `icon` parts.',
    },
    { part: 'emptyMessage', description: 'The row shown when there are no options.' },
  ],
  optimusSelector: 'p-multiSelect',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<T[]>([])`: the picked options’ values, two-way as `[(value)]`. `writeValue(null)` becomes `[]`.',
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
      note: 'Retyped `WjOption<T>[]`.',
    },
    dropped(
      'optionLabel, optionValue, optionDisabled',
      'Fixed to `WjOption`’s keys: `label`, `value` and `disabled`.',
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
      note: 'Typed `WjMultiSelectPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur, onClick',
      weeljack: 'native focusin, focusout, click',
      status: 'renamed',
      note: 'Listen to the native events on the host. There are no `on` outputs.',
    },
    dropped(
      'onPanelShow, onPanelHide',
      'By need. `opened` and `closed` outputs are the first candidates when a use appears.',
    ),
    dropped(
      'display, chipIcon, onRemove, #chipicon, #removetokenicon',
      'By need: the chip mode’s remove icons have no name.',
    ),
    dropped(
      'maxSelectedLabels, selectedItemsLabel, displaySelectedLabel, #selecteditems',
      'By need. Optimus’s default shows up to three labels, then the translation’s `selectionMessage`.',
    ),
    dropped(
      'selectionLimit, showToggleAll, selectAll, onSelectAllChange, showHeader, #headercheckboxicon, #itemcheckboxicon',
      'By need. The toggle-all checkbox shows as Optimus’s default, and its name stays Optimus’s.',
    ),
    dropped(
      'filter, filterBy, filterMatchMode, filterLocale, filterPlaceHolder, ariaFilterLabel, emptyFilterMessage, resetFilterOnHide, autofocusFilter, filterFields, filterValue, onFilter, #filter, #emptyfilter, #filtericon',
      'By need. Optimus shows the filter by default, so it is fixed off.',
    ),
    dropped(
      'emptyMessage',
      'The message comes from the translation, so it follows the app’s language.',
    ),
    dropped('group, optionGroupLabel, optionGroupChildren, #group', droppedByNeed),
    dropped(
      'showClear, onClear, #clearicon, loading, loadingIcon, #loadingicon, dropdownIcon, #dropdownicon, lazy, onLazyLoad, virtualScroll, virtualScrollItemSize, virtualScrollOptions, scrollHeight, dataKey, focusOnHover, selectOnFocus, autoOptionFocus, overlayVisible, readonly, tabindex, autofocus, autocomplete, id, name',
      'By need. Optimus’s defaults hold: the list scrolls past 200 px.',
    ),
    dropped(
      'highlightOnSelect',
      'Fixed to `false`: a picked row takes no fill, and the checkbox carries the pick.',
    ),
    dropped(
      'tooltip, tooltipPosition, tooltipPositionStyle, tooltipStyleClass',
      'By need. Optimus’s `pTooltip` stays inert, because its `tooltip` input is never bound.',
    ),
    dropped('variant, fluid', 'The host is the box: size it with CSS.'),
    dropped(
      'appendTo, overlayOptions, motionOptions',
      'The list opens inside the host, and its motion is fixed with `safe: true`.',
    ),
    dropped(
      '#item, #header, #footer, #empty, #loader, p-header, p-footer',
      'By need. Template slots are not exposed; `wjMultiSelectItem` is the first candidate when a use appears.',
    ),
    dropped('show(), hide(), focus(), clear() and the other public methods', droppedByNeed),
    dropped(
      'panelStyle, panelStyleClass, styleClass, dt, unstyled, ptOptions, MultiSelectModule, p-multiselect, p-multi-select',
      droppedAlways,
    ),
  ],
};
