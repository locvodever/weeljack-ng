import {
  Component,
  type Signal,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Slider } from '@openng/optimus-ui/slider';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _rangeKeys,
  _registerWithField,
  _touchedOnLeave,
} from 'weeljack-ng/private';
import type { WjSliderOrientation, WjSliderPt } from './slider-types';

/**
 * A single-handle slider over Optimus's `p-slider`: a track, a range filled up to the handle and a
 * 24 px handle that is dragged, or moved by key. Bind `[(value)]`, or use `ngModel`, a
 * `FormControl` or `[formField]`: it is its own value accessor, and `value` is a number in
 * [`min`, `max`], or `null` until it is set, which shows the handle at `min`.
 *
 * The handle is the one focusable element, a `role="slider"`. Name it with `ariaLabelledBy` (the id
 * of a visible text) or `ariaLabel`; inside a `wj-field` the field's label names it, and the field
 * describes it and marks it invalid. The keys follow `step`: an arrow moves one step, Page Up and
 * Page Down ten, Home and End go to `min` and `max`. A vertical slider needs a height on its host.
 * Optimus paints no invalid look on a slider.
 */
@Component({
  selector: 'wj-slider',
  imports: [Slider],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjSlider, multi: true }],
  host: { '(focusout)': 'leave($event)' },
  templateUrl: './slider.html',
  styleUrl: './slider.css',
})
export class WjSlider implements ControlValueAccessor {
  /** The value, in [`min`, `max`]. `null` shows the handle at `min`. Two-way: `[(value)]`. */
  readonly value = model<number | null>(null);
  /** The lowest value. Default 0. A `[formField]` schema's `min` is pushed in here. */
  readonly min = input<number>();
  /** The highest value. Default 100. A `[formField]` schema's `max` is pushed in here. */
  readonly max = input<number>();
  /** The grid the value moves on, from `min`: what an arrow key and a drag change it by. Default 1. */
  readonly step = input(1, { transform: numberAttribute });
  /** The direction. A vertical slider needs a height on its host. */
  readonly orientation = input<WjSliderOrientation>('horizontal');
  /** Makes the slider inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Sets `aria-invalid` on the handle. Inside a `wj-field` the field's error state is shown instead.
   * Optimus paints no invalid look.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the handle. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the handle. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the handle. Set on the handle. Inside a `wj-field` it defaults to
   * the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the handle. Set on the handle. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the slider's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSliderPt>();

  private readonly inner = viewChild(Slider);
  /** `min` and `max` with Optimus's defaults, which an input left `undefined` would replace. */
  protected readonly low = computed(() => this.min() ?? 0);
  protected readonly high = computed(() => this.max() ?? 100);

  /**
   * Optimus's accessor, with two changes. A `null` is written as `min`: Optimus writes `value || 0`,
   * which would put the handle off the track for a `min` above 0, and the form's value stays `null`
   * until the user moves the handle. And `min` and `max` are handed over with every write (below).
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    return (
      control && {
        writeValue: (value: number | null) => {
          // Optimus places the handle from its own `min` and `max`, which the template binds only
          // after this write runs. Set them first, so the first write and a change of either land.
          control.min = this.low();
          control.max = this.high();
          control.writeValue(value ?? this.low());
        },
        registerOnChange: (fn: (value: number | null) => void) => {
          control.registerOnChange(fn);
        },
        registerOnTouched: (fn: () => void) => {
          control.registerOnTouched(fn);
        },
      }
    );
  });

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-slider',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'slider',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    // The focusable part is a `role="slider"` span, which `<label for>` cannot name.
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes onto the handle, none of which Optimus
   * binds: its id, its description, `aria-invalid` and, while disabled, `aria-disabled`. Never
   * `aria-valuenow`: Optimus keeps it current, and shows `min` for a `null` value.
   */
  protected readonly partAttributes = computed<WjSliderPt>(() =>
    _mergePartAttributes(this.pt(), 'handle', {
      id: this.field.id(),
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
      'aria-disabled': this.isDisabled() ? 'true' : undefined,
    }),
  );

  /** Touched on blur: focus has left the host. Optimus never marks a slider touched. */
  protected readonly leave = _touchedOnLeave(this.inner);

  constructor() {
    // Optimus moves a page by one step whenever `step` is set; these keys run first, stop its
    // handler, and write through its public `updateValue`.
    _rangeKeys({
      min: this.low,
      max: this.high,
      step: this.step,
      value: () => this.value() ?? this.low(),
      inert: this.isDisabled,
      part: () => {
        // `ElementRef.nativeElement` is `any`; the keys only compare it with the event's target.
        const handle: unknown = this.inner()?.sliderHandle?.nativeElement;
        return handle;
      },
      write: (next, event) => {
        this.inner()?.updateValue(next, event);
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
