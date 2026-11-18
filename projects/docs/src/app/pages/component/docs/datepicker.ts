import { DatePickerBasicExample } from '../../../examples/datepicker/basic';
import { DatePickerDateFormatExample } from '../../../examples/datepicker/date-format';
import { DatePickerDisabledExample } from '../../../examples/datepicker/disabled';
import { DatePickerInAFieldExample } from '../../../examples/datepicker/in-a-field';
import { DatePickerInlineExample } from '../../../examples/datepicker/inline';
import { DatePickerMinMaxAndDisabledDaysExample } from '../../../examples/datepicker/min-max-and-disabled-days';
import { DatePickerSignalFormsExample } from '../../../examples/datepicker/signal-forms';
import { DatePickerSizesExample } from '../../../examples/datepicker/sizes';
import { DatePickerWithTheCalendarButtonExample } from '../../../examples/datepicker/with-the-calendar-button';
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
  entry: 'datepicker',
  title: 'Date picker',
  purpose:
    'A date picker, 44 px tall by default: a text box that takes a typed date and opens a calendar, or with `inline` the calendar alone. `value` is a `Date`, or `null` while nothing is picked: bind it two-way, or use `ngModel`, a `FormControl` or `[formField]`. Typed text is read with `dateFormat`, which defaults to the translation’s, and the day and month names, the first day of the week and every label in the calendar come from the translation too, so `vi` reads Vietnamese with no input. The calendar opens inside the control, with motion that respects reduced motion. Inside a field, the input is named, described and marked invalid by it.',
  optimusSelector: 'p-datePicker',
  examples: [
    {
      title: 'Basic',
      description:
        'A text box that opens the calendar when it gets focus or a click. Type a date in the format of the placeholder, or pick a day: a pick closes the calendar and puts focus back on the text box. The line below only shows what the two-way binding holds. A placeholder spells the format; it is not a name, so the label is the field’s.',
      sourceKey: 'datepicker/basic',
      component: DatePickerBasicExample,
    },
    {
      title: 'With the calendar button',
      description:
        '`showIcon` adds a button after the text box that opens and closes the calendar. It is named from the translation (`chooseDate`), is as tall as the control and joins the text box.',
      sourceKey: 'datepicker/with-the-calendar-button',
      component: DatePickerWithTheCalendarButtonExample,
    },
    {
      title: 'Inline',
      description:
        '`inline` shows the calendar alone, always open, sized to its content and starting at the start edge of the field. In a narrower container it scrolls sideways inside itself. This one holds a fixed date, so the picked day looks the same on every build. The group is named by the field’s label.',
      sourceKey: 'datepicker/inline',
      component: DatePickerInlineExample,
    },
    {
      title: 'Min, max and disabled days',
      description:
        '`minDate` and `maxDate` limit the dates, `disabledDays` switches off weekdays (`0` is Sunday) and `disabledDates` switches off single dates. A day that cannot be picked is drawn in the muted text colour, with no hover, and is skipped by the keyboard; the months and years outside the limits are muted too. Here the limits are today and 30 days on, with weekends off.',
      sourceKey: 'datepicker/min-max-and-disabled-days',
      component: DatePickerMinMaxAndDisabledDaysExample,
    },
    {
      title: 'Date format',
      description:
        '`dateFormat` sets how a date is shown and read, such as `dd/mm/yy` for day, month and four-digit year. Without it the format comes from the translation: `mm/dd/yy` for `en`, `dd/mm/yy` for `vi`. Write the format in the placeholder or the hint, so people know what to type.',
      sourceKey: 'datepicker/date-format',
      component: DatePickerDateFormatExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The field’s label names the text box through `aria-labelledby`, and a click on it focuses the text box, which opens the calendar. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction. The open calendar can cover the field’s hint and error.',
      sourceKey: 'datepicker/in-a-field',
      component: DatePickerInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled date picker leaves the Tab order and does not open, and its calendar button takes the same disabled look as the text box.',
      sourceKey: 'datepicker/disabled',
      component: DatePickerDisabledExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` is 36 px, the default is 44 px and `large` is 52 px tall, and the calendar button grows with the control. The calendar itself does not change with `size`. Bind `[size]` or write it as a plain attribute.',
      sourceKey: 'datepicker/sizes',
      component: DatePickerSizesExample,
    },
    {
      title: 'Signal forms',
      description:
        'With `[formField]`, the schema’s `required` reaches the text box. The error shows once the text box is touched, or on Save, which touches every field.',
      sourceKey: 'datepicker/signal-forms',
      component: DatePickerSignalFormsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjDatePickerHarness` from `weeljack-ng/datepicker/testing` to open and close the calendar, type a date, pick a day by its number, move between months, and read the text, the shown month and year, whether a day can be picked, and the disabled, required and invalid states without touching the DOM. After `open()`, wait until `isOpen()` is true before pressing keys: Optimus drops a key pressed within about 20 ms of opening.',
      sourceKey: 'datepicker/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the text box, and on to the calendar button. The calendar opens when the text box gets focus. Tab in the text box closes it and moves on.',
    },
    {
      key: 'ArrowDown, in the text box',
      effect:
        'Moves focus into the open calendar, onto the first day that can be picked, or today in the current month. See Accessibility: it is not the picked day.',
    },
    {
      key: 'Escape, Enter',
      effect:
        'In the text box, closes the calendar and keeps focus on the text box. Escape on a day or on a header button closes it and puts focus on the text box.',
    },
    {
      key: 'Tab, Shift+Tab, in the calendar',
      effect:
        'Cycles through the previous button, the month, the year, the next button and the day grid, and round again: focus stays in the calendar until it closes. An inline calendar has no trap.',
    },
    {
      key: 'ArrowLeft, ArrowRight, ArrowUp, ArrowDown, on a day',
      effect:
        'Moves by one day or one week. Past the first or last day of the month it goes to the previous or next month.',
    },
    {
      key: 'PageUp, PageDown, on a day',
      effect: 'Shows the previous or next month, with focus on the same day of the month.',
    },
    { key: 'Home, End, on a day', effect: 'Goes to the first or the last day of the month.' },
    {
      key: 'Enter, Space, on a day',
      effect: 'Picks the day. A popup closes and puts focus on the text box.',
    },
    {
      key: 'Enter, Space, on a header button',
      effect:
        'The previous and next buttons change the month. The month and year buttons open the month and year views, where the arrows move, and Enter or Space picks.',
    },
    {
      key: 'Digits and separators, in the text box',
      effect:
        'Typing a date in the format of `dateFormat` sets the value once it is a date that can be picked, and the calendar moves to it. Text that is not a date makes the value `null`, and a blur puts the picked date back in the box.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The control is not in the Tab order and cannot be edited or opened.',
    },
  ],
  aria: [
    'The focusable element is a native `input` with `role="combobox"`, `aria-haspopup="dialog"` and `aria-expanded`. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-datepicker`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Always give the control an accessible name: a field label, `ariaLabel` or `ariaLabelledBy`, or your own `<label for>` that matches `inputId` in popup mode. A placeholder is not a name. Inline, it names the calendar group the same way.',
    'The date picker registers with a field as not labelable, in both modes, because `<label for>` cannot name an inline calendar. Inside a `wj-field` the label is a `span`, and the text box is named through `aria-labelledby` set to it; your own `ariaLabelledBy` wins. A click on the label still focuses the text box, which opens the calendar.',
    'The calendar is Optimus’s `role="dialog"` with `aria-modal="true"`, named by the translation’s `chooseDate`. The calendar button, the previous and next buttons and the day names come from the translation too.',
    'An inline calendar is a `role="group"`, which Optimus does not set: it is named by the field’s label or `ariaLabelledBy`, else `ariaLabel`, else the translation’s `chooseDate`, and described by `ariaDescribedBy` and the field’s hint and error. A group takes no `aria-invalid`: invalid shows through the panel border only.',
    'The text box sets `aria-invalid="true"` while it is invalid. Inside a field that is exactly while the field shows an error, so the `invalid` input is not shown there. Outside a field it follows `invalid`.',
    'The month and year buttons are named by what they show, such as "March" and "2024". Optimus names them "Choose Month" and "Choose Year", which do not contain the visible text (WCAG 2.5.3, axe `label-content-name-mismatch`), so those labels are moved to `aria-description`.',
    'Gap: a day is named only by its number, with no month or year, and today is marked on screen only. Optimus sets no `aria-current="date"`, and its pass-through gives the day parts no date, so `pt` cannot reach them.',
    'Gap: a picked day has no `aria-selected`, and a day that cannot be picked has no `aria-disabled`. Optimus announces a pick through a live region, and mutes the days that cannot be picked on screen only. The same missing date blocks a fix through `pt`.',
    'Gap: ArrowDown from the text box, and the grid’s Tab stop in a popup, land on the first day that can be picked (or today), not on the picked day, because Optimus looks for a class it renamed (`p-highlight`) to find it. Arrow to the picked day, or type the date.',
    'Gap: in an inline calendar, Optimus gives no day a Tab stop and its Tab handler never reaches the grid, so WeeljackNg gives the picked day, else the first day that can be picked, the Tab stop. A key that crosses into another month (PageUp, PageDown, an arrow past the end of the month) drops focus to the page, because Optimus restores focus after a month change only for a popup. Use the previous and next buttons to change month, or Tab back into the grid.',
    'Gap: the open calendar can cover the field’s hint and error.',
    'The calendar opens with `safe` motion, so under `prefers-reduced-motion: reduce` it appears at once. The motion is not configurable.',
    'Non-`Date` values pass to Optimus unchanged: a string written by a form is read with `dateFormat`, and anything Optimus rejects throws what Optimus throws. WeeljackNg catches nothing.',
    'The screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the popup) is recorded on this page before the release that carries this entry.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, and the Optimus root and the text box inside it stretch to the host’s width, so size the control with `class` or `style` on `wj-datepicker`. The calendar button is joined to the text box, and the focused text box is drawn above it so its ring is whole. A disabled control gives its button the disabled fill. In the calendar, today keeps Optimus’s fill and gets a 1 px ring in the field boundary colour, the picked day takes the primary fill, and a day, month or year that cannot be picked takes the muted text colour at full opacity (Optimus dims it to 0.6, which is under 4.5:1 on white). The month and year buttons take the page’s font. An inline calendar sizes to its content, and its border takes the invalid colour while the control is invalid. For anything else, `pt` reaches the parts of the Optimus date picker underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-datepicker`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `pcInputText.root` lose to `aria-invalid`, and on `panel` (inline) to `role`, `aria-labelledby`, `aria-label` and `aria-describedby`, which the component routes there; the month and year buttons lose their `aria-label` and gain `aria-description`. The calendar button’s glyph, the arrows and every icon template are the component’s own, so Optimus’s icon parts are not rendered.',
  parts: [
    { part: 'root', description: 'The Optimus root element, around the text box and the button.' },
    {
      part: 'pcInputText',
      description:
        'The nested text box pass-through. Its `root` is the native `input`, the focusable element.',
    },
    { part: 'dropdown', description: 'The calendar button, shown with `showIcon`.' },
    {
      part: 'panel',
      description: 'The calendar: the dialog of a popup, the group of an inline one.',
    },
    { part: 'header', description: 'The row of the previous and next buttons, month and year.' },
    {
      part: 'pcPrevButton',
      description: 'The previous button’s pass-through; `root` is its element.',
    },
    { part: 'pcNextButton', description: 'The next button’s pass-through; `root` is its element.' },
    {
      part: 'selectMonth',
      description: 'The button that shows the month and opens the month view.',
    },
    { part: 'selectYear', description: 'The button that shows the year and opens the year view.' },
    { part: 'table', description: 'The grid of days.' },
    { part: 'dayCell', description: 'A table cell of a day. Optimus gives it no date to read.' },
    {
      part: 'day',
      description: 'The focusable day inside a cell. Optimus gives it no date to read.',
    },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<Date | null>(null)`: the source of truth, two-way as `[(value)]`. `valueChange` is the change output. Anything but a `Date` or `null` passes to Optimus unchanged.',
    },
    {
      optimus: 'onSelect, onInput',
      weeljack: 'None',
      status: 'dropped',
      note: '`valueChange` covers both.',
    },
    {
      optimus: 'inline',
      weeljack: 'inline',
      status: 'kept',
      note: 'The always-shown calendar.',
    },
    {
      optimus: 'minDate, maxDate',
      weeljack: 'minDate, maxDate',
      status: 'kept',
      note: '`Date`.',
    },
    {
      optimus: 'disabledDates, disabledDays',
      weeljack: 'disabledDates, disabledDays',
      status: 'kept',
      note: '`Date[]`, and `number[]` with `0` for Sunday.',
    },
    {
      optimus: 'dateFormat',
      weeljack: 'dateFormat',
      status: 'kept',
      note: 'Defaults to the translation’s: `mm/dd/yy` for `en`, `dd/mm/yy` for `vi`.',
    },
    {
      optimus: 'showIcon',
      weeljack: 'showIcon',
      status: 'kept',
      note: 'The calendar button, always Optimus’s `iconDisplay="button"`, a real button.',
    },
    {
      optimus: 'placeholder',
      weeljack: 'placeholder',
      status: 'kept',
      note: 'Popup mode. Rendered as an attribute.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` or `large`: 36 or 52 px against 44 px. Popup mode.',
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
      note: 'Popup: set on the text box. Inline: `ariaLabel` and `ariaLabelledBy` name the calendar group.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Merged with the field’s hint and error ids, on the text box (popup) or the calendar group (inline).',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjDatePickerPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'native focusin, focusout',
      status: 'renamed',
      note: 'No `on` outputs: listen to the native events on the host.',
    },
    dropped(
      'onShow, onClose',
      'By need. 02 Q2 names them `opened` and `closed` when they are needed.',
    ),
    dropped(
      'iconAriaLabel',
      'The calendar button’s name is the translation’s `chooseDate`, so it follows the language.',
    ),
    dropped('firstDayOfWeek', 'From the translation: `en` starts on Sunday, `vi` on Monday.'),
    dropped(
      'selectionMode, maxDateCount, multipleSeparator, rangeSeparator',
      'Single date only. Range and multiple selection come by need, as a `Date[]` value.',
    ),
    dropped(
      'showTime, timeOnly, hourFormat, stepHour, stepMinute, stepSecond, showSeconds, timeSeparator',
      droppedByNeed,
    ),
    dropped(
      'view, numberOfMonths, responsiveOptions, showWeek, startWeekFromFirstDayOfYear, defaultDate',
      droppedByNeed,
    ),
    dropped(
      'showButtonBar, onTodayClick, onClearClick, showClear, onClear, #clearicon',
      droppedByNeed,
    ),
    dropped(
      'showOtherMonths, selectOtherMonths, showOnFocus, hideOnDateTimeSelect, keepInvalid, focusTrap, readonlyInput, shortYearCutoff, dataType, touchUI',
      'By need. Optimus’s defaults apply: other months shown and not pickable, opens on focus, closes on a pick, focus trapped in a popup.',
    ),
    dropped('onMonthChange, onYearChange, onClickOutside', droppedByNeed),
    dropped(
      'appendTo, motionOptions, showTransitionOptions, hideTransitionOptions, autoZIndex, baseZIndex',
      'The calendar renders inside the control, with motion that respects reduced motion (`safe`). Deprecated aliases are never exposed.',
    ),
    dropped(
      'iconDisplay, icon, every icon template',
      'Icon slots are never exposed: the button draws a calendar.',
    ),
    dropped(
      '#date, #disabledDate, #decade, #header, #footer, #buttonbar, p-header, p-footer',
      'By need. A `wjDatePickerDate` slot is the first candidate.',
    ),
    dropped(
      'tabindex, autofocus, name, variant, fluid, inputSize, pattern, min, max, step, minlength, maxlength',
      'By need. The host is the box, and `wjAutoFocus` covers autofocus.',
    ),
    dropped(
      'styleClass, inputStyle, inputStyleClass, panelStyle, panelStyleClass, todayButtonStyleClass, clearButtonStyleClass, dt, unstyled, ptOptions',
      droppedAlways,
    ),
    dropped(
      'p-datePicker, p-date-picker, DatePickerModule, the public methods',
      'Duplicate selectors; standalone; by need.',
    ),
  ],
};
