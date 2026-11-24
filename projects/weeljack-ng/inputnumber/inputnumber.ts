import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  viewChild,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MinusIcon } from '@openng/optimus-ui/icons/minus';
import { PlusIcon } from '@openng/optimus-ui/icons/plus';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjInputNumberMode, WjInputNumberPt, WjInputNumberSize } from './inputnumber-types';

/*
 * Optimus rewrites its text from the number on every write (`writeValue` sets its value, and its
 * template shows the formatted number), so the write that echoes a number it just reported would
 * drop what the user has typed but Optimus has not turned into a number yet. It reports a lone `-`
 * as the string `'-'`; the echo of that is `NaN`.
 */

/**
 * A number input over Optimus's `p-inputnumber`: it formats the number as you type, steps it with
 * ArrowUp and ArrowDown, and keeps it within `min` and `max`. Bind `[(value)]`, or use `ngModel`, a
 * `FormControl` or `[formField]`: it is its own value accessor, and `value` is a `number`, or `null`
 * while the box is empty. Outside a `wj-field`, give it a visible `<label for>` that matches
 * `inputId`, or `ariaLabel`.
 *
 * With `showButtons`, a minus button sits before the input and a plus button after it, each as tall
 * as the control and 40 px wide. They are for the mouse and touch only: they are hidden from
 * assistive tech and out of the Tab order, and a keyboard user steps with the arrow keys. Size the
 * control with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-inputnumber',
  imports: [InputNumber, MinusIcon, PlusIcon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjInputNumber, multi: true }],
  templateUrl: './inputnumber.html',
  styleUrl: './inputnumber.css',
})
export class WjInputNumber implements ControlValueAccessor {
  /** The number, `null` while the box is empty. Two-way: `[(value)]`. */
  readonly value = model<number | null>(null);
  /** Makes the input inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the input as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is shown
   * instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the `input` element, for a `<label for>`. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the `input`. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the input. Set on the `input`. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the input. Set on the `input`. */
  readonly ariaDescribedBy = input<string>();
  /** Hint text shown in the input while it is empty. Rendered as text. */
  readonly placeholder = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjInputNumberSize>();
  /** The lowest value. A `[formField]` schema's `min` is pushed in here. */
  readonly min = input<number>();
  /** The highest value. A `[formField]` schema's `max` is pushed in here. */
  readonly max = input<number>();
  /** How much ArrowUp, ArrowDown and the spin buttons change the value. Default 1. */
  readonly step = input<number>();
  /** `decimal`, or `currency`, which needs `currency`. */
  readonly mode = input<WjInputNumberMode>('decimal');
  /** The ISO 4217 code of a `currency` amount, such as `VND`. Not text: a bad code throws. */
  readonly currency = input<string>();
  /** The BCP 47 language tag the number is formatted in, such as `vi-VN`. Not text. */
  readonly locale = input<string>();
  /** The fewest decimal places shown. */
  readonly minFractionDigits = input<number>();
  /** The most decimal places kept. */
  readonly maxFractionDigits = input<number>();
  /** Text shown before the number, inside the value. Rendered as text. */
  readonly prefix = input<string>();
  /** Text shown after the number, inside the value, such as " kg". Rendered as text. */
  readonly suffix = input<string>();
  /** Adds a minus button before the input and a plus button after it. */
  readonly showButtons = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the number input's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjInputNumberPt>();

  private readonly inner = viewChild(InputNumber);
  private reported: number | null | undefined;

  /**
   * Optimus's accessor, with two changes (see the note above the class). A lone minus sign is
   * reported as `null`: Optimus reports the string `'-'`, which is not a number. And the write that
   * echoes what Optimus just reported is skipped, because Optimus rewrites its text from the number
   * on every write and would turn the typed `-` into `NaN`.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    return (
      control && {
        writeValue: (value: number | null) => {
          const echo = value === this.reported;
          this.reported = undefined;
          if (!echo) control.writeValue(value);
        },
        registerOnChange: (fn: (value: number | null) => void) => {
          control.registerOnChange((typed: number | string | null) => {
            this.reported = typeof typed === 'number' ? typed : null;
            fn(this.reported);
          });
        },
        registerOnTouched: (fn: () => void) => {
          control.registerOnTouched(fn);
        },
      }
    );
  });

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-inputnumber',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'inputnumber',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
  });

  /** `pt` forwarded as given, plus `aria-invalid` on the `input`, which Optimus never sets. */
  protected readonly partAttributes = computed<WjInputNumberPt>(() =>
    _mergePartAttributes(this.pt(), 'pcInputText.root', {
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
    }),
  );

  /**
   * Home and End to a bound of 0. Optimus tests `if (this.min())`, so a 0 bound is skipped; its own
   * handler has already run by the time this bubbles, and left the key alone.
   */
  protected reachZero(event: KeyboardEvent): void {
    const bound = event.key === 'Home' ? this.min() : event.key === 'End' ? this.max() : undefined;
    if (bound === 0 && !event.defaultPrevented) {
      this.inner()?.updateModel(event, 0);
      event.preventDefault();
    }
  }

  declare registerOnChange: _AccessorHost<number | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<number | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<number | null>['setDisabledState'];

  writeValue(value: number | null): void {
    this.value.set(value);
  }
}
