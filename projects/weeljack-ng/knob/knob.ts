import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Knob } from '@openng/optimus-ui/knob';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _rangeKeys,
  _registerWithField,
  _touchedOnLeave,
} from 'weeljack-ng/private';
import type { WjKnobPt } from './knob-types';

/**
 * A dial over Optimus's `p-knob`: a 270 degree arc filled up to the value, with the value shown in
 * the middle. Drag it or click on the arc, or use the keys. Bind `[(value)]`, or use `ngModel`, a
 * `FormControl` or `[formField]`: it is its own value accessor, and `value` is a number in
 * [`min`, `max`], or `null` until it is set, which shows `min`.
 *
 * The dial is one focusable element, a `role="slider"`. Name it with `ariaLabelledBy` (the id of a
 * visible text) or `ariaLabel`; inside a `wj-field` the field's label names it, and the field
 * describes it and marks it invalid. The keys follow `step`: an arrow moves one step, Page Up and
 * Page Down ten, Home and End go to `min` and `max`. A read-only or disabled knob is out of the Tab
 * order. Optimus paints no invalid look on a knob.
 */
@Component({
  selector: 'wj-knob',
  imports: [Knob],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjKnob, multi: true }],
  host: { '(focusout)': 'leave($event)' },
  templateUrl: './knob.html',
  styleUrl: './knob.css',
})
export class WjKnob implements ControlValueAccessor {
  /** The value, in [`min`, `max`]. `null` shows `min`. Two-way: `[(value)]`. */
  readonly value = model<number | null>(null);
  /** The lowest value. Default 0. A `[formField]` schema's `min` is pushed in here. */
  readonly min = input<number>();
  /** The highest value. Default 100. A `[formField]` schema's `max` is pushed in here. */
  readonly max = input<number>();
  /** The grid the value moves on, from `min`: what a key and a drag change it by. Default 1. */
  readonly step = input(1, { transform: numberAttribute });
  /** Shows the value but lets nobody change it. Out of the Tab order. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Makes the knob inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Sets `aria-invalid` on the dial. Inside a `wj-field` the field's error state is shown instead.
   * Optimus paints no invalid look.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** The width and height of the dial, in CSS pixels. Default 100. */
  readonly diameter = input(100, { transform: numberAttribute });
  /** Shows the value in the middle of the dial. Default true. */
  readonly showValue = input(true, { transform: booleanAttribute });
  /**
   * The text shown in the middle, with `{value}` replaced by the value. Rendered as text. One short
   * line: a long one runs over the arc.
   */
  readonly valueTemplate = input('{value}');
  /** Id of the dial. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the dial. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the dial. Set on the dial. Inside a `wj-field` it defaults to the
   * field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the dial. Set on the dial. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the knob's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjKnobPt>();

  private readonly inner = viewChild(Knob);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** `min` and `max` with Optimus's defaults, which an input left `undefined` would replace. */
  protected readonly low = computed(() => this.min() ?? 0);
  protected readonly high = computed(() => this.max() ?? 100);

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-knob',
    this.value,
    this.inner,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'knob',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    // The focusable part is a `role="slider"` svg, which `<label for>` cannot name.
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes onto the dial, none of which Optimus
   * binds: its id, its description, `aria-invalid`, and while inert `aria-disabled` or
   * `aria-readonly`. Never `aria-valuenow`: Optimus keeps it current, and shows `min` for `null`.
   */
  protected readonly partAttributes = computed<WjKnobPt>(() =>
    _mergePartAttributes(this.pt(), 'svg', {
      id: this.field.id(),
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
      'aria-disabled': this.isDisabled() ? 'true' : undefined,
      'aria-readonly': this.readonly() ? 'true' : undefined,
    }),
  );

  /** Touched on blur: focus has left the host. Optimus never marks a knob touched. */
  protected readonly leave = _touchedOnLeave(this.inner);

  constructor() {
    // Optimus's keys move by 1 and 10 whatever `step` is; these run first, stop its handler, and
    // write through its public `updateModelValue`.
    _rangeKeys({
      min: this.low,
      max: this.high,
      step: this.step,
      value: () => this.value() ?? this.low(),
      inert: () => this.isDisabled() || this.readonly(),
      part: () => this.host.querySelector('svg'),
      write: (next) => {
        this.inner()?.updateModelValue(next);
      },
    });
  }

  declare registerOnChange: _AccessorHost<number | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<number | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<number | null>['setDisabledState'];

  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }
}
