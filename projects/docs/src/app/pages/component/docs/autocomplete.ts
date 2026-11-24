import { AutoCompleteBasicExample } from '../../../examples/autocomplete/basic';
import { AutoCompleteDisabledExample } from '../../../examples/autocomplete/disabled';
import { AutoCompleteInAFieldExample } from '../../../examples/autocomplete/in-a-field';
import { AutoCompleteSignalFormsExample } from '../../../examples/autocomplete/signal-forms';
import { AutoCompleteSizesExample } from '../../../examples/autocomplete/sizes';
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
  entry: 'autocomplete',
  title: 'Autocomplete',
  purpose:
    "A text input that suggests options as you type, 44 px tall by default. You answer its `query` output with a new `suggestions` array, and the user picks one: `value` is the picked `WjOption<T>` (the shared option type, `import type { WjOption } from 'weeljack-ng'`), label included, so a value a form writes shows its text before any search has run. Bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`. Inside a field, the field’s label names the input, and the field describes it and marks it invalid.",
  examples: [
    {
      title: 'Basic',
      description:
        'Type, and the `query` handler answers with the countries whose name starts with the text. Answer every query with a new array: the list opens, updates or closes, and the spinner stops, only when the array is a new one. Outside a field, name the input with a visible `<label for>` that matches `inputId` (or set `ariaLabel`). Only a picked suggestion becomes the value: text that matches none is cleared when the input loses focus.',
      sourceKey: 'autocomplete/basic',
      component: AutoCompleteBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field, and the label is a `<label for>` that names the input. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction. The hint says "pick from the list" because typed text that matches no suggestion is cleared.',
      sourceKey: 'autocomplete/in-a-field',
      component: AutoCompleteInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled autocomplete leaves the Tab order, ignores every key and does not search. Its value is the whole option, so the label shows with no search run.',
      sourceKey: 'autocomplete/disabled',
      component: AutoCompleteDisabledExample,
    },
    {
      title: 'Sizes',
      description: '`small` is 36 px, the default is 44 px and `large` is 52 px tall.',
      sourceKey: 'autocomplete/sizes',
      component: AutoCompleteSizesExample,
    },
    {
      title: 'Signal forms',
      description:
        'Bind `[formField]` to a signal-forms field of type `WjOption<string> | null`. The field shows the error once the input is touched, or on Save, which touches every field. Read your own value with `value()?.value`.',
      sourceKey: 'autocomplete/signal-forms',
      component: AutoCompleteSignalFormsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjAutoCompleteHarness` from `weeljack-ng/autocomplete/testing` to type text, read the input’s text, check whether the list is open, read the suggestion labels and the empty message, pick a suggestion by its label, and check the disabled, required and invalid states without touching the DOM. The component emits `query` 300 ms after the last key, so wait for the list to open before reading it.',
      sourceKey: 'autocomplete/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the input and away from it. With no suggestion focused, Tab closes the list and clears text that matches no suggestion. With one focused, Tab picks it and closes the list, but Optimus then moves focus back to the input: press Tab again to move on.',
    },
    {
      key: 'A printable character',
      effect:
        'Types it. Once there is at least one character and 300 ms have passed since the last key, `query` carries the text. Nothing opens on focus, and emptying the input cancels a pending query. The list opens when your answer arrives, with no suggestion focused.',
    },
    {
      key: 'Down',
      effect:
        'In an open list, focuses the first suggestion that is not disabled, then the next one, and stops at the last. Does nothing while the list is closed.',
    },
    {
      key: 'Up',
      effect:
        'In an open list, focuses the last suggestion that is not disabled, then the previous one, and stops at the first.',
    },
    {
      key: 'Alt+Up',
      effect: 'Picks the focused suggestion and closes the list.',
    },
    {
      key: 'Left, Right',
      effect: 'Moves the caret and drops the focused suggestion. The list stays open.',
    },
    {
      key: 'Home, End',
      effect:
        'Moves the caret to the start or the end of the text (Shift selects), and drops the focused suggestion. The list stays open.',
    },
    {
      key: 'PageDown, PageUp',
      effect:
        'Scrolls the open list to its last or first suggestion. The focused suggestion does not move.',
    },
    {
      key: 'Enter',
      effect:
        'In an open list, picks the focused suggestion and closes the list; with none focused it closes the list. Focus stays on the input.',
    },
    {
      key: 'Escape',
      effect:
        'Closes the list without picking from it. Focus stays on the input. Text that is exactly a suggestion’s label (any case) picks that suggestion; any other text is cleared and the value becomes `null`.',
    },
    {
      key: 'Backspace',
      effect:
        'Edits the text; the value stays until the text is empty. Emptying the input clears the value.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The input is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The focusable element is Optimus’s `input` with `role="combobox"` and `aria-autocomplete="list"`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-autocomplete`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'An input is labelable: inside a `wj-field` the field renders a `<label for>` that names it, and a click on that label focuses it. Outside a field, use a visible `<label for>` that matches `inputId`, or set `ariaLabel` or `ariaLabelledBy`.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The input sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The value is the picked option, not a bare value: read your own with `value()?.value`. Typing changes the text, not the value, and only a picked suggestion becomes the value, because free text is not supported. Say "pick from the list" in the hint.',
    'Answer every `query` with a new array, an empty one included, or the spinner never stops. Between the query and the answer Optimus shows a spinner at the input’s end, hidden from assistive tech and stopped under reduced motion. An empty answer shows the translation’s `emptySearchMessage` as the list’s only row.',
    'While the list is open, focus stays on the input, `aria-expanded` is `true`, `aria-controls` names the list, and `aria-activedescendant` points at the focused suggestion. The list is named from the translation (`aria.listLabel`). Optimus sets `aria-disabled` on a disabled suggestion and gives it no pointer events, so a mouse cannot pick it and the arrow keys skip it. Optimus also focuses the row under the pointer.',
    'Gap, fixed: the "no results" row is an `li` with `role="option"` in Optimus, so a screen reader announces it as an option, though it cannot be picked. `wj-autocomplete` makes the row presentational and, while there are no suggestions, makes the list a `group` (a listbox with no option in it is invalid ARIA). A visually hidden polite live region beside the input reads the translation’s `emptySearchMessage` while the list is open with nothing to pick.',
    'Gap, fixed: with results, nothing announced how many there were, because Optimus puts the translation’s `searchMessage` ("N results are available") only inside the empty row, and its own polite live region reads the selection message instead ("No selected item", then "1 items selected"). The same visually hidden live region now reads `searchMessage` with the number of suggestions while the list is open, and is empty once it closes. Optimus’s selection region is left as it is.',
    'Gap: Tab with a suggestion focused picks it, then Optimus returns focus to the input, so a second Tab is needed to move on.',
    'The list opens inside the host. An ancestor that clips its overflow clips the list too: give the field room, or do not clip.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the list) is recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, and the Optimus root and the input inside it stretch to the host’s width, so size the control with `class` or `style` on `wj-autocomplete`. There is no dropdown button and no clear icon. For anything else, `pt` reaches the parts of the Optimus autocomplete underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-autocomplete`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `pcInputText` part’s `root` lose to `ariaDescribedBy` and `aria-invalid`, which the component routes there.',
  parts: [
    { part: 'root', description: 'The Optimus root element, around the input.' },
    {
      part: 'pcInputText',
      description:
        'The input component. Its `root` is the input itself: the `input` with `role="combobox"`, and the focusable element.',
    },
    {
      part: 'loader',
      description: 'The spinner at the input’s end while a search runs.',
    },
    { part: 'overlay', description: 'The panel that holds the list, opened inside the host.' },
    { part: 'list', description: 'The `ul` with `role="listbox"`.' },
    { part: 'option', description: 'Each suggestion row: an `li` with `role="option"`.' },
    {
      part: 'emptyMessage',
      description: 'The row an empty answer shows: an `li` with the translation’s empty message.',
    },
  ],
  optimusSelector: 'p-autoComplete',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<WjOption<T> | null>(null)`: the picked suggestion, label included, two-way as `[(value)]`. `null` while none is picked.',
    },
    {
      optimus: 'onSelect',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output: it covers a pick and a clear.',
    },
    {
      optimus: 'completeMethod',
      weeljack: 'query',
      status: 'renamed',
      note: 'An `output<string>()` carrying the typed text, 300 ms after the last key and once there is at least one character. Never blank text.',
    },
    {
      optimus: 'suggestions',
      weeljack: 'suggestions',
      status: 'kept',
      note: 'Typed `WjOption<T>[]`. Answer every query with a new array.',
    },
    dropped(
      'optionLabel, optionValue, optionDisabled',
      'Fixed: `label` and `disabled`. There is no `optionValue`: the value is the option.',
    ),
    dropped(
      'forceSelection',
      'Fixed to `true`: only a picked suggestion becomes the value, and text that matches none is cleared.',
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
      note: 'Set on the input. Optimus binds them there.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the input, merged with the field’s hint and error ids.',
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
      note: 'Typed `WjAutoCompletePt`. Tracks Optimus.',
    },
    dropped(
      'onFocus, onBlur, onInputKeydown, onKeyUp',
      'Listen to the native `focusin`, `focusout`, `keydown` and `keyup` on the host.',
    ),
    dropped(
      'onShow, onHide',
      'By need. They would be named `opened` and `closed` when a use appears.',
    ),
    dropped(
      'multiple, typeahead, addOnBlur, addOnTab, separator, unique, onAdd, onUnselect, #selecteditem, #removeicon',
      'By need: a multiple mode makes the value an array.',
    ),
    dropped(
      'dropdown, dropdownMode, dropdownAriaLabel, dropdownIcon, onDropdownClick, #dropdownicon',
      'By need: Optimus names its button only per instance, with no translated name.',
    ),
    dropped(
      'showClear, onClear, #clearicon',
      'By need: Optimus’s clear icon cannot be reached with the keyboard.',
    ),
    dropped(
      'emptyMessage, searchMessage, selectionMessage, emptySelectionMessage',
      'These messages come from the translation, so they follow the app’s language.',
    ),
    dropped('group, optionGroupLabel, optionGroupChildren, #group', droppedByNeed),
    dropped(
      'minQueryLength, delay, completeOnFocus, autoHighlight, autoOptionFocus, selectOnFocus, focusOnHover, searchLocale, showEmptyMessage, dataKey, lazy, onLazyLoad, virtualScroll, virtualScrollItemSize, virtualScrollOptions, scrollHeight, readonly, tabindex, autofocus, autocomplete, type, id, name',
      'By need. Optimus’s defaults hold: a search after 300 ms and one character, a list that scrolls past 200 px.',
    ),
    dropped('minLength', 'Deprecated in Optimus.'),
    dropped(
      'variant, fluid, inputSize, pattern, min, max, step, minlength, maxlength',
      'The host is the box: size it with CSS.',
    ),
    dropped(
      'appendTo, overlayOptions, motionOptions, autoZIndex, baseZIndex, showTransitionOptions, hideTransitionOptions',
      'The list opens inside the host, and its motion is fixed with `safe: true`. The two transition options are deprecated in Optimus.',
    ),
    dropped(
      '#item, #empty, #header, #footer, #loader, #loadingicon and the rest',
      'By need. Template slots are not exposed; `wjAutoCompleteItem` is the first candidate when a use appears.',
    ),
    dropped('show(), hide(), clear()', droppedByNeed),
    dropped(
      'panelStyle, panelStyleClass, inputStyle, inputStyleClass, styleClass, dt, unstyled, ptOptions, AutoCompleteModule, p-autocomplete, p-auto-complete',
      droppedAlways,
    ),
  ],
};
