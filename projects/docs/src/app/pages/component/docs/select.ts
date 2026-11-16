import { SelectBasicExample } from '../../../examples/select/basic';
import { SelectDisabledExample } from '../../../examples/select/disabled';
import { SelectInAFieldExample } from '../../../examples/select/in-a-field';
import { SelectSignalFormsExample } from '../../../examples/select/signal-forms';
import { SelectSizesExample } from '../../../examples/select/sizes';
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
  entry: 'select',
  title: 'Select',
  purpose:
    'A single-choice select, 44 px tall by default: a closed combobox that opens a list of options. `value` is the picked option’s `value`: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. Inside a field, the field’s label names the combobox, and the field describes it and marks it invalid.',
  examples: [
    {
      title: 'Basic',
      description:
        'A select needs a name that is not its own text. The focusable element is a `span`, so a `<label for>` cannot name it: point `ariaLabelledBy` at a visible element, or set `ariaLabel`. `placeholder` shows while nothing is picked; the disabled option is shown and cannot be picked.',
      sourceKey: 'select/basic',
      component: SelectBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field, the combobox is named by the field’s label, and a click on that label focuses it. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'select/in-a-field',
      component: SelectInAFieldExample,
    },
    {
      title: 'Disabled',
      description: 'A disabled select leaves the Tab order, ignores every key and does not open.',
      sourceKey: 'select/disabled',
      component: SelectDisabledExample,
    },
    {
      title: 'Sizes',
      description: '`small` is 36 px, the default is 44 px and `large` is 52 px tall.',
      sourceKey: 'select/sizes',
      component: SelectSizesExample,
    },
    {
      title: 'Signal forms',
      description:
        'Bind `[formField]` to a signal-forms field of type `string | null`. The field shows the error once the select is touched, or on Save, which touches every field.',
      sourceKey: 'select/signal-forms',
      component: SelectSignalFormsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSelectHarness` from `weeljack-ng/select/testing` to open and close the list, read the option labels and the shown text, pick an option by its label, and check the disabled, required and invalid states without touching the DOM.',
      sourceKey: 'select/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the select and away from it. With the list open, Tab picks the focused option, if there is one, closes the list and moves on.',
    },
    {
      key: 'Down',
      effect:
        'Opens the list when it is closed, with the picked option focused, or none while nothing is picked. In an open list it focuses the next option that is not disabled.',
    },
    {
      key: 'Up',
      effect:
        'Opens the list when it is closed, with the picked option focused, or the last one while nothing is picked. In an open list it focuses the previous option that is not disabled.',
    },
    {
      key: 'Alt+Up',
      effect: 'Picks the focused option and closes the list.',
    },
    {
      key: 'Home, End',
      effect: 'Focuses the first or the last option that is not disabled, opening the list first.',
    },
    {
      key: 'PageDown, PageUp',
      effect:
        'Scrolls the open list to its last or first option. The focused option does not move.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Opens the list when it is closed. In an open list it picks the focused option and closes the list. Focus stays on the select.',
    },
    {
      key: 'Escape',
      effect: 'Closes the list without picking. Focus stays on the select.',
    },
    {
      key: 'A printable character',
      effect:
        'Opens the list and focuses the first option that is not disabled and whose label starts with the typed characters. Characters typed within half a second of each other add up.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The select is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The focusable element is Optimus’s `span` with `role="combobox"`, not a native control. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-select`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Because the combobox is not a labelable element, a `<label for>` cannot name it. Outside a field, set `ariaLabel` or point `ariaLabelledBy` at a visible element. Without either, Optimus names the combobox after the text it shows (the picked label or the placeholder), which is not a name.',
    'Inside a `wj-field` the combobox gets `aria-labelledby` set to the field’s label, which takes precedence over the `aria-label` Optimus derives from the picked text. An `ariaLabelledBy` you set wins over the field’s. The field’s label is a `span`, so the field moves focus to the combobox when the label is clicked.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates.',
    'The combobox sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'While the list is open, focus stays on the combobox and `aria-activedescendant` points at the focused option. The list is named from the translation (`aria.listLabel`), and an empty list shows the translation’s `emptyMessage` as its only row.',
    'Fixed here through `pt`: a disabled option gets `aria-disabled="true"`, which Optimus leaves off, so assistive tech now hears it as unavailable. Optimus’s two hidden focus-trap spans are taken out of the Tab order, because Tab from an open list would otherwise land on one and lose focus when the list closed. The chevron, an English-only "dropdown trigger" button next to the combobox, is hidden from assistive tech.',
    'Gap: the "no options" row is an `li` with `role="option"` in Optimus, so a screen reader announces it as an option, though it cannot be picked.',
    'Gap: PageDown and PageUp only scroll the list. The WAI-ARIA select-only combobox pattern lets them move focus by about ten options; Optimus does not.',
    'The list opens inside the host. An ancestor that clips its overflow clips the list too: give the field room, or do not clip.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the list) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits, and the chevron uses `--wj-text-muted-color`. The host is `inline-flex`, and the Optimus root inside it stretches to the host’s width, so size the control with `class` or `style` on `wj-select`. A long picked text is cut off with an ellipsis; its full text stays the combobox’s text. For anything else, `pt` reaches the parts of the Optimus select underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-select`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on the `label` part lose to `ariaDescribedBy` and `aria-invalid`, and on the `option` part to `aria-disabled`, which the component routes there; `tabindex` on the two hidden parts and `aria-hidden` on the `dropdown` part are set by the component too.',
  parts: [
    { part: 'root', description: 'The Optimus root element, around the combobox and the chevron.' },
    {
      part: 'label',
      description:
        'The combobox: the `span` with `role="combobox"` that shows the picked label or the placeholder, and the focusable element.',
    },
    { part: 'dropdown', description: 'The chevron at the end of the control.' },
    { part: 'overlay', description: 'The panel that holds the list, opened inside the host.' },
    { part: 'list', description: 'The `ul` with `role="listbox"`.' },
    { part: 'option', description: 'Each option row: an `li` with `role="option"`.' },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<T | null>(null)`: the source of truth, two-way as `[(value)]`. `null` while nothing is picked.',
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
      note: 'Typed `WjSelectOption<T>[]`: `{ label, value, disabled? }`.',
    },
    dropped(
      'optionLabel, optionValue, optionDisabled',
      'Fixed to `WjSelectOption`’s `label`, `value` and `disabled`.',
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
      note: 'Set on the combobox. Inside a field `ariaLabelledBy` defaults to the field’s label.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the combobox, merged with the field’s hint and error ids.',
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
      note: 'Typed `WjSelectPt`. Tracks Optimus.',
    },
    dropped(
      'onFocus, onBlur, onClick',
      'Listen to the native `focusin`, `focusout` and `click` on the host.',
    ),
    dropped(
      'onShow, onHide',
      'By need. They would be named `opened` and `closed` when a use appears.',
    ),
    dropped(
      'filter, filterBy, filterFields, filterValue, filterMatchMode, filterLocale, filterPlaceholder, resetFilterOnHide, autofocusFilter, ariaFilterLabel, emptyFilterMessage, onFilter',
      'By need. Optimus’s `FilterService` stays a root internal: the app provides nothing and WeeljackNg exports nothing for it.',
    ),
    dropped(
      'emptyMessage',
      'The empty message comes from the translation (`emptyMessage`), so it follows the app’s language.',
    ),
    dropped(
      'editable, readonly, group, optionGroupLabel, optionGroupChildren, showClear, onClear, checkmark, loading, loadingIcon, dropdownIcon, lazy, onLazyLoad, virtualScroll, virtualScrollItemSize, virtualScrollOptions, scrollHeight, dataKey, focusOnHover, selectOnFocus, autoOptionFocus, tabindex, autofocus, name, id',
      droppedByNeed,
    ),
    dropped(
      'variant, fluid, inputSize, pattern, min, max, step, minlength, maxlength',
      'The host is the box: size it with CSS.',
    ),
    dropped(
      'tooltip, tooltipPosition, tooltipPositionStyle, tooltipStyleClass',
      'By need. There is no tooltip path.',
    ),
    dropped(
      'appendTo, overlayOptions, motionOptions',
      'The list opens inside the host, and its motion is fixed with `safe: true`.',
    ),
    dropped(
      '#item, #selectedItem, #group, #header, #footer, #empty, #emptyfilter, #filter, #loader, the icon templates and the rest',
      'By need. Template slots are not exposed; `wjSelectItem` is the first candidate when a use appears.',
    ),
    dropped('show(), hide(), focus(), clear(), resetFilter()', droppedByNeed),
    dropped(
      'panelStyle, panelStyleClass, styleClass, dt, unstyled, ptOptions, SelectModule, p-selectItem',
      droppedAlways,
    ),
  ],
};
