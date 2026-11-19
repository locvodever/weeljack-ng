import {
  Component,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
  type AfterViewInit,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Optimus } from '@openng/optimus-ui/config';
import { DatePicker } from '@openng/optimus-ui/datepicker';
import {
  _OVERLAY_MOTION,
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjDatePickerPt, WjDatePickerSize } from './datepicker-types';

/*
 * Optimus formats the date into its text box, and moves its calendar to it, whenever it is written,
 * and it takes its inputs (`dateFormat`, `inline`, the limits) and starts its calendar on today's
 * month only when it initialises. The first write therefore waits for the wrapper's view to be
 * checked once (`ready`): written earlier, the text would use the default format and an inline
 * calendar would open on today.
 *
 * Optimus rewrites its text and its shown month from the date on every write (`writeValue` formats
 * the date into the box and moves the calendar to it), so the write that echoes a date it just
 * reported would rewrite what the user is still typing ("1/2/2" would turn into a full date under
 * the caret). That one echo is skipped.
 *
 * Optimus hands its parts the `pt` it resolved itself, so the function form `pt` that
 * `_mergePartAttributes` returns reaches the input, the buttons and the panel (spec-proven).
 */

/** Sets an attribute, or removes it for `null`, and touches the DOM only when that changes it. */
function setAttribute(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) {
    return;
  }
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

/**
 * A date picker over Optimus's `p-datepicker`: a text box that takes a typed date and opens a
 * calendar, or with `inline` the calendar alone. Bind `[(value)]`, or use `ngModel`, a
 * `FormControl` or `[formField]`: it is its own value accessor, and `value` is a `Date`, or `null`
 * while nothing is picked. Typed text is read with `dateFormat`. Outside a `wj-field`, give the
 * popup `ariaLabel` or `ariaLabelledBy`, or a `<label for>` that matches `inputId`; an inline
 * calendar needs `ariaLabel` or `ariaLabelledBy` too, or it keeps Optimus's own name.
 *
 * Inside a `wj-field` the field's label names the input (or the inline calendar), and the field
 * describes it and marks it invalid. The calendar opens inside the host, and every label in it,
 * the day and month names and the first day of the week come from the translation. Size the control
 * with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-datepicker',
  imports: [DatePicker],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjDatePicker, multi: true }],
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.css',
  host: { '[class.wj-datepicker-inline]': 'inline()', '(focusout)': 'leave($event)' },
})
export class WjDatePicker implements ControlValueAccessor, AfterViewInit {
  /** The picked date, `null` while none is. Two-way: `[(value)]`. */
  readonly value = model<Date | null>(null);
  /** Shows the calendar alone, always open, instead of a text box that opens it. */
  readonly inline = input(false, { transform: booleanAttribute });
  /** The earliest date that can be picked. Earlier days, months and years are not pickable. */
  readonly minDate = input<Date>();
  /** The latest date that can be picked. */
  readonly maxDate = input<Date>();
  /** Single dates that cannot be picked. */
  readonly disabledDates = input<Date[]>([]);
  /** Weekdays that cannot be picked, `0` for Sunday through `6` for Saturday. */
  readonly disabledDays = input<number[]>([]);
  /** How a date is typed and shown, such as `dd/mm/yy`. Defaults to the translation's. */
  readonly dateFormat = input<string>();
  /** Adds a calendar button after the text box. Popup only. */
  readonly showIcon = input(false, { transform: booleanAttribute });
  /** Makes the control inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the text box as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and, on the text box, `aria-invalid`. Inside a `wj-field` the field's
   * error state is shown instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the text box, for a `<label for>`. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the text box, or the inline calendar. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the control. Set on the text box, or the inline calendar. Inside
   * a `wj-field` it defaults to the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the control. Set on the text box, or the inline calendar. */
  readonly ariaDescribedBy = input<string>();
  /** Hint text shown in the text box while it is empty, such as the format. Rendered as text. */
  readonly placeholder = input<string>();
  /** Height step of the text box: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjDatePickerSize>();
  /**
   * Pass-through for the control's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjDatePickerPt>();

  protected readonly motion = _OVERLAY_MOTION;
  private readonly translation = inject(Optimus);
  private readonly inner = viewChild(DatePicker);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly ready = signal(false);
  private reported: Date | null | undefined;
  private touched: (() => void) | undefined;

  /**
   * Optimus's accessor, with the write that echoes what Optimus just reported skipped (see the note
   * above the class). `reported` is cleared on every write, so it can never go stale.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.ready() ? this.inner() : undefined;
    return (
      control && {
        writeValue: (date: Date | null) => {
          const echo = date === this.reported;
          this.reported = undefined;
          if (!echo) control.writeValue(date);
        },
        registerOnChange: (fn: (date: Date | null) => void) => {
          control.registerOnChange((date: Date | null) => {
            this.reported = date;
            fn(date);
          });
        },
        registerOnTouched: (fn: () => void) => {
          this.touched = fn;
          control.registerOnTouched(fn);
        },
      }
    );
  });

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-datepicker',
    this.value,
    this.accessor,
    this.disabled,
  );
  /** `labelable: false` in both modes: `<label for>` cannot name an inline calendar. */
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'datepicker',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes. Popup: `aria-describedby` and
   * `aria-invalid` on the text box (Optimus sets no `aria-invalid`). Inline: Optimus's panel is a
   * `div` with an `aria-label` and no role, so it becomes a group, named by the field's label or
   * `ariaLabelledBy`, else `ariaLabel`, else the translation's own name, and described; a group
   * takes no `aria-invalid`. Both: the month and year buttons are named by their visible text,
   * which Optimus's "Choose Month" label does not contain (axe `label-content-name-mismatch`), and
   * that label becomes their description.
   */
  protected readonly partAttributes = computed<WjDatePickerPt>(() => {
    const describedBy = this.field.describedBy();
    const views = _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'selectMonth', {
        'aria-label': undefined,
        'aria-description': this.label('chooseMonth'),
      }),
      'selectYear',
      { 'aria-label': undefined, 'aria-description': this.label('chooseYear') },
    );
    return this.inline()
      ? _mergePartAttributes(views, 'panel', {
          role: 'group',
          'aria-describedby': describedBy,
          'aria-labelledby': this.field.labelledBy(),
          'aria-label': this.ariaLabel() ?? this.label('chooseDate'),
        })
      : _mergePartAttributes(views, 'pcInputText.root', {
          'aria-describedby': describedBy,
          'aria-invalid': this.field.invalid() ? 'true' : undefined,
        });
  });

  /**
   * Optimus puts the one Tab stop of the day grid on a day only when its calendar opens, and in an
   * inline calendar its own Tab handler misses the last header button (it compares the button with
   * the `p-button` around it), so no day is ever a Tab stop and the keyboard cannot reach the grid.
   * An inline calendar with no day that is a Tab stop gets one on the picked day, else on the first
   * day that can be picked. Optimus moves the stop itself as a user arrows through the grid.
   */
  private focusableDay(): void {
    if (!this.inline()) {
      return;
    }
    const days = Array.from(this.element.querySelectorAll<HTMLElement>('span[data-date]'));
    if (days.some((day) => day.tabIndex === 0)) {
      return;
    }
    const date = this.value();
    const key =
      date instanceof Date ? [date.getFullYear(), date.getMonth(), date.getDate()].join('-') : '';
    const pickable = days.filter((day) => getComputedStyle(day).pointerEvents !== 'none');
    const stop = pickable.find((day) => day.dataset['date'] === key) ?? pickable[0];
    if (stop) {
      stop.tabIndex = 0;
    }
  }

  /**
   * Optimus names a day cell by its bare number and gives it no `aria-current`, `aria-selected` or
   * `aria-disabled`, so every `td` holding a day gets them here, on the `td` (an `aria-label` on a
   * role-less `span` is prohibited). The picked day's span also gets Optimus's `p-highlight`, which
   * its `initFocusableCell` looks for to put the grid's Tab stop, and focus, on the picked day.
   * Each attribute is written only when it differs, so this pass never schedules another render.
   */
  private daySemantics(): void {
    const dayNames = this.names('dayNames');
    const monthNames = this.names('monthNames');
    for (const day of this.element.querySelectorAll<HTMLElement>('td > span[data-date]')) {
      const cell = day.parentElement;
      const [year, month, date] = (day.dataset['date'] ?? '').split('-').map(Number);
      if (!cell || year === undefined || month === undefined || date === undefined) {
        continue;
      }
      const weekday = dayNames[new Date(year, month, date).getDay()];
      const monthName = monthNames[month];
      const disabled = day.classList.contains('p-disabled');
      const selected = day.classList.contains('p-datepicker-day-selected');
      day.classList.toggle('p-highlight', selected);
      setAttribute(
        cell,
        'aria-label',
        weekday && monthName ? `${weekday}, ${String(date)} ${monthName} ${String(year)}` : null,
      );
      setAttribute(
        cell,
        'aria-current',
        cell.classList.contains('p-datepicker-today') ? 'date' : null,
      );
      setAttribute(cell, 'aria-selected', disabled ? null : String(selected));
      setAttribute(cell, 'aria-disabled', disabled ? 'true' : null);
    }
  }

  /** A list of names from the translation, empty when it has none. */
  private names(key: string): readonly string[] {
    const names: unknown = this.translation.getTranslation(key);
    return Array.isArray(names) ? names.filter((name) => typeof name === 'string') : [];
  }

  /** One of Optimus's chrome labels from the translation `provideWeeljack` set. */
  private label(key: string): string | undefined {
    const text: unknown = this.translation.getTranslation(key);
    return typeof text === 'string' ? text : undefined;
  }

  constructor() {
    afterEveryRender(() => {
      this.daySemantics();
      this.focusableDay();
    });
  }

  ngAfterViewInit(): void {
    this.ready.set(true);
  }

  /**
   * Optimus marks the control touched when its text box blurs, and an inline calendar has none, so
   * it would never be touched. Focus leaving the inline calendar marks it.
   */
  protected leave(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (this.inline() && !(next instanceof Node && this.element.contains(next))) {
      this.touched?.();
    }
  }

  declare registerOnChange: _AccessorHost<Date | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<Date | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<Date | null>['setDisabledState'];

  writeValue(value: Date | null): void {
    this.value.set(value);
  }
}
