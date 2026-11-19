import { ListboxBasicExample } from '../../../examples/listbox/basic';
import { ListboxDisabledExample } from '../../../examples/listbox/disabled';
import { ListboxInAFieldExample } from '../../../examples/listbox/in-a-field';
import { ListboxReactiveFormExample } from '../../../examples/listbox/reactive-form';
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
  entry: 'listbox',
  title: 'Listbox',
  purpose:
    "A single-choice list of options in a box that grows with its options up to 14rem and then scrolls. Give it `options` (the shared `WjOption<T>`, `import type { WjOption } from 'weeljack-ng'`) and bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is the picked option’s `value`, `null` while none is picked. Click, Enter or Space picks a row, and the same action on the picked row unpicks it. It is a list, not a single-line control: it has no `size`, and its rows keep Aura’s option padding. Inside a field, the field’s label names the list, and the field describes it and marks it invalid.",
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the list through `ariaLabelledBy`, because the focusable element is a `ul`, which a `<label for>` cannot name. Picking the picked option again unpicks it, so `value` goes back to `null`. Values must be distinct, as Optimus marks every row whose value equals the picked one. The list takes the width of its container: size it with `class` or `style` on `wj-listbox`.',
      sourceKey: 'listbox/basic',
      component: ListboxBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the list through `aria-labelledby`, and a click on it moves focus into the list. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'listbox/in-a-field',
      component: ListboxInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled list leaves the Tab order, ignores every key and click, and is not focused by a click on its label. Its picked row stays visible. In the second list Instantly is disabled: the option is shown but cannot be picked, is skipped by the arrow keys and is announced as unavailable.',
      sourceKey: 'listbox/disabled',
      component: ListboxDisabledExample,
    },
    {
      title: 'Reactive form',
      description:
        'A `FormControl` with an initial value shows it before anything is picked, and picking writes the option’s `value` back. The list is marked touched when focus leaves it, not while focus moves between its rows.',
      sourceKey: 'listbox/reactive-form',
      component: ListboxReactiveFormExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjListboxHarness` from `weeljack-ng/listbox/testing` to read the labels of the options, pick one by its label, read the picked label (`null` when none is picked), check whether an option is disabled, read the empty message, check the disabled, required and invalid states and the ARIA attributes, and move or read focus, without touching the DOM. Optimus renders no list element for an empty list, only its message, so the methods that read the list’s own state need at least one option.',
      sourceKey: 'listbox/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Tab enters the list in one step, with the picked option focused, or the first one that is not disabled. Tab and Shift+Tab each leave it in one step, even when the list scrolls: its scrolling box is not a Tab stop. A disabled list is skipped.',
    },
    {
      key: 'Down, Up',
      effect:
        'Focus the next or the previous option that is not disabled, and stop at the last or the first. They pick nothing.',
    },
    {
      key: 'Home, End',
      effect: 'Focus the first or the last option that is not disabled. They pick nothing.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Pick the focused option. On the picked option they unpick it and the value becomes `null`. Focus stays on the list.',
    },
    {
      key: 'A printable character',
      effect:
        'Focuses the first option whose label starts with the letters typed in the last half second, skipping disabled options. A key that matches no option moves nowhere.',
    },
    {
      key: 'PageDown, PageUp',
      effect:
        'Focus the option ten places on (PageDown) or back (PageUp), counting only options that are not disabled, and stop at the last or the first. They pick nothing.',
    },
    {
      key: 'Escape',
      effect: 'Nothing. There is no overlay to close, and the value is kept.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The list is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The focusable element is Optimus’s `ul` with `role="listbox"`. `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-listbox`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'A `ul` is not labelable, so a `<label for>` cannot name it. Outside a `wj-field`, name the list with `ariaLabelledBy` (the id of a visible text) or `ariaLabel`. Inside a field the field renders its label as a `span` and the list gets `aria-labelledby` set to it, through the `list` part; a consumer’s `ariaLabelledBy` wins.',
    '`inputId` is the id of the hidden element in front of the list, whose focus Optimus moves into the list (the part `hiddenFirstFocusableElement`). It is what a `wj-field` focuses when its label is clicked, so a click on the label lands focus in the list. Inside a field one is generated. The `ul` keeps Optimus’s own id. While the list is disabled the hidden element carries no id, so a label click does not focus it. Outside a field, `inputId` only names that element: a `<label for>` that points at it does nothing.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The list sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`. `required` is set as `aria-required="true"`, which Optimus does not bind.',
    'Each option is a `role="option"` with `aria-selected`, true for the picked one, and `aria-disabled`. Optimus hard-codes `aria-multiselectable="true"` on the list even in single mode, so the component routes `aria-multiselectable="false"` there. Optimus marks a disabled option `aria-disabled` but writes `false` on every other row while the whole list is disabled, which leaves their dimmed text to axe’s colour contrast check, so the component routes `aria-disabled="true"` on every row while the list is disabled.',
    'A list is touched, for `ngModel`, `FormControl` and `[formField]`, when focus leaves it: a `focusout` on the host whose `relatedTarget` is outside the host. Optimus’s own blur handler never reports touched, so the component does, and moving focus between the rows or into the list from its hidden entry does not.',
    'Optimus draws no focus indicator on the list and its focused-row fill is about 1.1:1 on white, so while the list has keyboard focus (`:focus-visible`, never on a mouse click) the focused row takes a 2 px ring inside its edge. A picked row takes the highlight colour for it.',
    'The scrolling box around the list gets `tabindex="-1"`: browsers make a scrolling box a Tab stop of its own, so without it Shift+Tab from a list that scrolls would stop on the box first.',
    'The empty message is the translation’s `emptyMessage`. Optimus’s list reads its translation for its other messages but draws this one from its own input alone, so the component reads the translation and passes it, once, when it is created.',
    'Gap: an empty list renders no `listbox` element, only the message, so it has no accessible name, description or invalid state of its own, and its entry is a `span` with `role="presentation"` that takes the focus. Disable the list while there is nothing to pick, or say why in the field’s hint.',
    'Gap, fixed: in Optimus, PageDown scrolls the list to its start and PageUp to its end, the reverse of what the keys mean elsewhere, and neither moves the focused option. `wj-listbox` moves focus ten options that are not disabled, forward on PageDown and back on PageUp, and stops at the last or first one.',
    'Gap: Optimus types the entry part as `hiddenFirstFocusableEl` but its template reads `hiddenFirstFocusableElement`, so a `pt` attribute for that part never lands. The id is set by the component.',
    'Gap: Optimus’s polite live region reads “1 items selected” when an option is picked, and “No selected item” when none is, from its `selectionMessage` and `emptySelectionMessage`; the count is not pluralised.',
    'Gap: the type-ahead search keeps the letters typed in the last half second, so typing “e” and then “d” in that time looks for “ed”, not “d”.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS) is recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius, the picked row’s highlight and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, and Optimus’s bordered box inside it fills it, so size the list with `class` or `style` on `wj-listbox`. The box grows with its options up to 14rem, then scrolls inside. Rows wrap at spaces and are never under 24 px tall. For anything else, `pt` reaches the parts of the Optimus list underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-listbox`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `list` part lose to `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required` and `aria-multiselectable`, which the component routes there while they have a value, and on `option` they lose to `aria-disabled`. They also lose to `tabindex` on `listContainer`. The function form of `pt` and a function per part both work.',
  parts: [
    { part: 'root', description: 'The Optimus root element: the bordered box.' },
    {
      part: 'listContainer',
      description: 'The box that scrolls once the options pass 14rem. It carries `tabindex="-1"`.',
    },
    {
      part: 'list',
      description:
        'The `ul` with `role="listbox"`, and the focusable element. It is the part the ARIA inputs are set on.',
    },
    { part: 'option', description: 'Each row: an `li` with `role="option"`.' },
    { part: 'emptyMessage', description: 'The row that holds the empty message.' },
  ],
  optimusSelector: 'p-listbox',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<T | null>(null)`: the picked option’s value, two-way as `[(value)]`. `null` while none is picked. Single choice only.',
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
      'Fixed to `label`, `value` and `disabled`, the keys of `WjOption`.',
    ),
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. `required` reaches the list as `aria-required`.',
    },
    {
      optimus: 'ariaLabel',
      weeljack: 'ariaLabel',
      status: 'kept',
      note: 'Set on the list. Optimus binds it there.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the `list` part: Optimus has neither. Inside a field they merge with the field’s label, hint and error.',
    },
    {
      optimus: 'None',
      weeljack: 'inputId',
      status: 'added',
      note: 'The id of the hidden element whose focus Optimus moves into the list, the one a field focuses on a label click.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjListboxPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur, onClick, onDblClick',
      weeljack: 'native focusin, focusout, click, dblclick',
      status: 'renamed',
      note: 'Listen to the native events on the host. There are no `on` outputs; picking is `valueChange`.',
    },
    dropped(
      'multiple, checkbox, metaKeySelection, showToggleAll, selectAll, onSelectAllChange, #checkicon',
      'By need: a multiple mode changes the value to `T[]`. For many picks use `wj-multiselect`.',
    ),
    dropped(
      'filter, filterBy, filterMatchMode, filterLocale, filterFields, filterValue, filterPlaceHolder, ariaFilterLabel, filterMessage, emptyFilterMessage, onFilter, #filter, #emptyfilter, #filtericon',
      'By need. `FilterService` stays a root internal.',
    ),
    dropped(
      'emptyMessage, searchMessage, selectionMessage, emptySelectionMessage',
      'These messages come from the translation, so they follow the app’s language. The component reads `emptyMessage` itself, because Optimus’s list does not.',
    ),
    dropped('group, optionGroupLabel, optionGroupChildren, #group', droppedByNeed),
    dropped(
      'dragdrop, dropListData, onDrop',
      'By need. Drag and drop is the CDK’s: reorder with `wj-orderlist`.',
    ),
    dropped(
      'striped, highlightOnSelect, checkmark, #checkmark, readonly, scrollHeight, lazy, onLazyLoad, virtualScroll, virtualScrollItemSize, virtualScrollOptions, dataKey, focusOnHover, selectOnFocus, autoOptionFocus, searchLocale, tabindex, id, name',
      'By need. Optimus’s defaults hold: the list is capped at 14rem.',
    ),
    dropped('fluid', 'The host is the box: size it with CSS.'),
    dropped(
      '#item, #header, #footer, #empty, #loader, p-header, p-footer',
      'By need. Template slots are not exposed; `wjListboxItem` is the first candidate when a use appears.',
    ),
    dropped(
      'listStyle, listStyleClass, styleClass, dt, unstyled, ptOptions, hostName, ListboxModule, p-listBox, p-list-box',
      droppedAlways,
    ),
  ],
};
