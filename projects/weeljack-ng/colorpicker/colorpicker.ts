import {
  Component,
  type ElementRef,
  type Signal,
  booleanAttribute,
  computed,
  effect,
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
  _rangeKeys,
  _registerWithField,
  _wjId,
  _wjStrings,
} from 'weeljack-ng/private';
import type { WjColorPickerPt } from './colorpicker-types';

/** A colour as Optimus holds it: hue 0-360, saturation and brightness 0-100. */
interface Hsb {
  h: number;
  s: number;
  b: number;
}

/** Optimus's own default swatch, red, which it shows while the value is `null`. */
const RED: Hsb = { h: 0, s: 100, b: 100 };

/**
 * What is read of an Optimus picker: its colour, which it types as `any` and which is always a
 * `{ h, s, b }`. Narrowed here, so the colour never travels as `any`.
 */
interface Coloured {
  readonly value: Hsb;
}

function hsbOf(control: Coloured | undefined): Hsb {
  return control?.value ?? RED;
}

/** The element behind one of Optimus's `ElementRef`s, or nothing while its part is not rendered. */
function elementOf(ref: ElementRef | null | undefined): unknown {
  return ref?.nativeElement;
}

/**
 * A colour picker over Optimus's `p-colorpicker` in its popup form: a 24 px swatch that opens a
 * panel with a saturation and brightness area and a hue strip. Bind `[(value)]`, or use `ngModel`,
 * a `FormControl` or `[formField]`: it is its own value accessor, and `value` is a `#rrggbb`
 * string, `null` until one is picked (the swatch then shows Optimus's red). Outside a `wj-field`,
 * give it `ariaLabelledBy` or `ariaLabel`; inside one the field's label names the swatch.
 *
 * The panel works by keyboard. Enter or Space on the swatch opens it and moves focus to the area,
 * where the arrow keys change saturation and brightness (Shift moves ten). Tab goes on to the hue
 * strip, whose keys are Arrow Up and Down, Page Up and Down, Home and End. Escape closes the panel
 * and returns to the swatch. It marks touched when the swatch gains focus, as Optimus does. Optimus
 * paints no invalid look on it.
 */
@Component({
  selector: 'wj-colorpicker',
  imports: [ColorPicker],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjColorPicker, multi: true }],
  // `data-value` is the model, for the harness: while it is `null` the swatch still shows red.
  host: {
    '[attr.data-value]': 'value()',
    '(keydown)': 'keys($event)',
    '(focusout)': 'leave($event)',
  },
  // prettier-ignore
  template: '<p-colorpicker [inputId]="field.id()" [disabled]="isDisabled()" [motionOptions]="motion" [pt]="partAttributes()" (onShow)="open.set(true)" (onHide)="open.set(false)" />',
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
  private readonly text = _wjStrings();
  /** The colour Optimus last reported, so the write that echoes it back can be skipped. */
  private reported: string | null | undefined;
  protected readonly motion = _OVERLAY_MOTION;
  /** Whether the panel is open, from Optimus's `onShow` and `onHide`. */
  protected readonly open = signal(false);
  /** Counts the colours this wrapper wrote, which no signal of Optimus's shows (see `paint`). */
  private readonly painted = signal(0);
  private readonly panelId = _wjId('colorpicker-panel');

  /**
   * Optimus's accessor, with the write that echoes what Optimus just reported skipped. Optimus
   * rebuilds its `{ h, s, b }` from the hex on every write, and a hex has lost the hue of a grey,
   * the precision of a step and every step that lands on the same hex, so a key press would reset
   * the panel's own colour. `reported` is cleared on every write, so it can never go stale.
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
   * `pt` forwarded as given, plus what this wrapper routes. On the swatch: its name from
   * `ariaLabel` (only while set, because a routed `undefined` would remove Optimus's translated
   * name), the field's or the app's label and description, `aria-invalid`, and `aria-haspopup` and
   * `aria-expanded`. On the panel's two parts, which Optimus leaves as bare `div`s: the slider
   * role, a name, the range and the value. Those values are read when Optimus asks for the part,
   * not here, because a drag or a key changes them without changing any signal.
   */
  protected readonly partAttributes = computed<WjColorPickerPt>(() => {
    const label = this.ariaLabel();
    // A key, a drag or the app changes the colour without changing any signal of Optimus's: these
    // two are what run this again.
    this.painted();
    this.value();
    const { h, s, b } = hsbOf(this.inner());
    const saturation = Math.round(s);
    return _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(
          _mergePartAttributes(this.pt(), 'preview', {
            ...(label === undefined ? undefined : { 'aria-label': label }),
            'aria-labelledby': this.field.labelledBy(),
            'aria-describedby': this.field.describedBy(),
            'aria-invalid': this.field.invalid() ? 'true' : undefined,
            // A text input may not carry `aria-expanded`; a combobox may, and a popup of any kind.
            role: 'combobox',
            'aria-haspopup': 'dialog',
            'aria-expanded': this.open() ? 'true' : 'false',
            // A combobox that is expanded must name what it expands.
            'aria-controls': this.open() ? this.panelId : undefined,
          }),
          'panel',
          { id: this.panelId },
        ),
        'colorSelector',
        {
          role: 'slider',
          tabindex: 0,
          'aria-label': this.text('colorArea'),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': saturation,
          'aria-valuetext': this.text('colorAreaValue')
            .replace('{s}', String(saturation))
            .replace('{b}', String(Math.round(b))),
        },
      ),
      'hue',
      {
        role: 'slider',
        tabindex: 0,
        'aria-label': this.text('colorHue'),
        'aria-orientation': 'vertical',
        'aria-valuemin': 0,
        'aria-valuemax': 360,
        'aria-valuenow': Math.round(h),
      },
    );
  });

  constructor() {
    // Focus follows the panel in, once Optimus has rendered it.
    effect(() => {
      if (this.open()) {
        this.focus(this.inner()?.colorSelectorViewChild);
      }
    });
    // The hue strip, and the area's two axes (saturation across, brightness up), on the family's
    // range keys, which stop Optimus's handlers (it has none here) and write through `paint`.
    for (const [prop, max, part, axis] of [
      ['h', 360, 'hueViewChild', undefined],
      ['s', 100, 'colorSelectorViewChild', 'x'],
      ['b', 100, 'colorSelectorViewChild', 'y'],
    ] as const) {
      _rangeKeys({
        min: () => 0,
        max: () => max,
        step: () => 1,
        value: () => Math.round(hsbOf(this.inner())[prop]),
        inert: this.isDisabled,
        part: () => elementOf(this.inner()?.[part]),
        write: (next) => {
          this.paint({ [prop]: next });
        },
        axis,
      });
    }
  }

  /**
   * The panel's other keys, on the host. Enter opens the panel (Optimus has Space) and never
   * submits a form; on an open panel it closes it, and so does Escape, from anywhere inside, with
   * focus back on the swatch (Optimus's own Escape reads `event.code`, which a synthetic event may
   * not carry). Tab goes on into an open panel, which Optimus's own Tab would close first, so it is
   * opened again.
   */
  protected keys(event: KeyboardEvent): void {
    const control = this.inner();
    const { key } = event;
    if (!control) return;
    if (key === 'Enter') event.preventDefault();
    if (key === 'Escape' || (key === 'Enter' && this.open())) {
      control.hide();
      this.focus(control.inputViewChild);
    } else if (key === 'Enter' || (key === 'Tab' && !event.shiftKey && this.open())) {
      control.show();
    }
  }

  /** Focus left the host for somewhere else: the panel closes. */
  protected leave(event: FocusEvent): void {
    const { currentTarget, relatedTarget } = event;
    if (
      currentTarget instanceof Node &&
      relatedTarget instanceof Node &&
      !currentTarget.contains(relatedTarget)
    ) {
      this.inner()?.hide();
    }
  }

  private focus(ref: ElementRef | null | undefined): void {
    const element = elementOf(ref);
    if (element instanceof HTMLElement) element.focus();
  }

  /** Writes a new colour the way Optimus's own pick does, so the swatch, the panel and the model agree. */
  private paint(next: Partial<Hsb>): void {
    const control = this.inner();
    if (control) {
      control.value = { ...hsbOf(control), ...next };
      control.updateColorSelector();
      control.updateUI();
      control.updateModel();
      this.painted.update((n) => n + 1);
    }
  }

  declare registerOnChange: _AccessorHost<string | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<string | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<string | null>['setDisabledState'];

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
}
