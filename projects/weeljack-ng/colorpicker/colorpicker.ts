import {
  Component,
  type Signal,
  booleanAttribute,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { ColorPicker } from '@openng/optimus-ui/colorpicker';
import {
  _OVERLAY_MOTION,
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _wjId,
} from 'weeljack-ng/private';
import type { WjColorPickerPt } from './colorpicker-types';

/**
 * A colour picker over Optimus's `p-colorpicker` in its popup form: a 24 px swatch that opens a
 * panel with a saturation and brightness area and a hue strip. Bind `[(value)]`, or use `ngModel`,
 * a `FormControl` or `[formField]`: it is its own value accessor, and `value` is a `#rrggbb`
 * string, `null` until one is picked (the swatch then shows Optimus's red). Outside a `wj-field`,
 * give it `ariaLabelledBy` or `ariaLabel`; inside one the field's label names the swatch.
 *
 * The swatch opens the panel with Space or a click, and says so with `aria-haspopup` and
 * `aria-expanded`. **The panel itself is pointer-only:** its area and hue strip answer the mouse
 * and touch, not the keyboard. It marks touched when the swatch gains focus, as Optimus does.
 * Optimus paints no invalid look on it.
 */
@Component({
  selector: 'wj-colorpicker',
  imports: [ColorPicker],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjColorPicker, multi: true }],
  // `data-value` is the model, for the harness: while it is `null` the swatch still shows red.
  host: { '[attr.data-value]': 'value()' },
  templateUrl: './colorpicker.html',
  styleUrl: './colorpicker.css',
})
export class WjColorPicker implements ControlValueAccessor {
  /** The colour as `#rrggbb`, `null` until one is picked. Two-way: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** Makes the picker inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Sets `aria-invalid` on the swatch. Inside a `wj-field` the field's error state is shown
   * instead. Optimus paints no invalid look.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the swatch. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. While unset, Optimus's translated name stays. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the swatch. Inside a `wj-field` it defaults to the field's label;
   * a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the swatch. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the picker's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjColorPickerPt>();

  private readonly inner = viewChild(ColorPicker);
  /** The colour Optimus last reported, so the write that echoes it back can be skipped. */
  private reported: string | null | undefined;
  protected readonly motion = _OVERLAY_MOTION;
  /** Whether the panel is open, from Optimus's `onShow` and `onHide`. */
  protected readonly open = signal(false);
  private readonly panelId = _wjId('colorpicker-panel');

  /**
   * Optimus's accessor, with the write that echoes what Optimus just reported skipped. Optimus
   * rebuilds its `{ h, s, b }` from the hex on every write, and a hex has lost the hue of a grey and
   * the precision of a drag step, so a drag toward black would throw the hue and the handles off.
   * `reported` is cleared on every write, so it can never go stale.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    return (
      control && {
        writeValue: (value: string | null) => {
          const echo = value === this.reported;
          this.reported = undefined;
          if (!echo) control.writeValue(value);
        },
        registerOnChange: (fn: (value: string) => void) => {
          control.registerOnChange((value: string) => {
            this.reported = value;
            fn(value);
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
    'wj-colorpicker',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'colorpicker',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    // Optimus always names the swatch with `aria-label`, which beats a `<label for>`.
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes onto the swatch: its name from
   * `ariaLabel` (only while set, because a routed `undefined` would remove Optimus's translated
   * name), the field's or the app's label and description, `aria-invalid`, and `aria-haspopup`,
   * `aria-expanded` and `aria-controls`. And an id on the panel, which `aria-controls` names.
   */
  protected readonly partAttributes = computed<WjColorPickerPt>(() => {
    const label = this.ariaLabel();
    return _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'preview', {
        ...(label === undefined ? undefined : { 'aria-label': label }),
        'aria-labelledby': this.field.labelledBy(),
        'aria-describedby': this.field.describedBy(),
        'aria-invalid': this.field.invalid() ? 'true' : undefined,
        // A text input may not carry `aria-expanded`; a combobox may, and a popup of any kind.
        role: 'combobox',
        'aria-haspopup': 'dialog',
        'aria-expanded': this.open() ? 'true' : 'false',
        // An expanded combobox must name what it expands.
        'aria-controls': this.open() ? this.panelId : undefined,
      }),
      'panel',
      { id: this.panelId },
    );
  });

  declare registerOnChange: _AccessorHost<string | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<string | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<string | null>['setDisabledState'];

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
}
