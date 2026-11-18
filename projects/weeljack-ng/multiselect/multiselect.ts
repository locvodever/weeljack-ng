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
import { MultiSelect } from '@openng/optimus-ui/multiselect';
import { ObjectUtils } from '@openng/optimus-ui/utils';
import type { WjOption } from 'weeljack-ng';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _OVERLAY_MOTION,
  _ptContextFlag,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjMultiSelectPt, WjMultiSelectSize } from './multiselect-types';

/*
 * Optimus 2.0.2 defects this wrapper works around:
 * - A value that no option has shows as the word `null` in the closed control ("null, Monday"). The
 *   accessor adapter hands Optimus only the values some option has, and reports what the user picks
 *   with the values it did not hand over put back in front, so the model keeps them.
 * - It hands its option rows the `pt` it was given unresolved, so a function-form `pt` would hide
 *   the `pcOptionCheckbox` part from every row. `partAttributes` resolves it once.
 * - It shows a filter input in the header by default, with no name, though the filter is dropped.
 * - Each option row nests a checkbox `input` that stays focusable (`tabindex="-1"`), which axe
 *   reports as `nested-interactive`. The row is the control; the input is made inert.
 */

/**
 * A multiple-choice select over Optimus's `p-multiselect`: a closed combobox that opens a list of
 * `options`, each with a checkbox, under a header holding one checkbox that picks or unpicks every
 * option. Bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is its own value
 * accessor, and `value` is an array of the picked options' `value`s, in pick order (`[]` while none
 * is picked). The closed control shows the placeholder while nothing is picked, then up to three
 * labels, then a count. Every pick is a new array; the app's own is never changed.
 *
 * Inside a `wj-field` the field's label names the combobox, a click on that label focuses it, and
 * the field describes it and marks it invalid. Outside one, give it a visible `<label for>` that
 * matches `inputId`, or `ariaLabel`. The list opens inside the host, and its empty message, its
 * accessible name and the toggle-all checkbox's name come from the translation. Size the control
 * with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-multiselect',
  imports: [MultiSelect],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjMultiSelect, multi: true }],
  templateUrl: './multiselect.html',
  styleUrl: './multiselect.css',
})
export class WjMultiSelect<T> implements ControlValueAccessor {
  /** The picked options' `value`s, in pick order. Two-way: `[(value)]`. */
  readonly value = model<T[]>([]);
  /**
   * The choices, in order. An empty list shows the translation's empty message. A `value` that no
   * option has is kept in the model.
   */
  readonly options = input<WjOption<T>[]>([]);
  /** Makes the select inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the select as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is shown
   * instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the combobox `input`, for a `<label for>`. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the combobox. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the select. Set on the combobox. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the select. Set on the combobox. */
  readonly ariaDescribedBy = input<string>();
  /** Hint text shown while nothing is picked. Rendered as text. */
  readonly placeholder = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjMultiSelectSize>();
  /**
   * Pass-through for the select's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjMultiSelectPt>();

  private readonly inner = viewChild(MultiSelect);

  /**
   * Optimus's accessor, with the first defect above worked around. Its `writeValue` reads no
   * signal; the adapter reads `options()` on purpose, so the model is written again after the
   * options change.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    const known = (value: T): boolean =>
      this.options().some((option) => ObjectUtils.equals(option.value, value));
    return (
      control && {
        writeValue: (value: T[]) => {
          const shown = value.filter(known);
          control.writeValue(shown.length === value.length ? value : shown);
        },
        registerOnChange: (fn: (value: T[]) => void) => {
          control.registerOnChange((picked: T[]) => {
            fn([...this.value().filter((value) => !known(value)), ...picked]);
          });
        },
        registerOnTouched: (fn: () => void) => {
          control.registerOnTouched(fn);
        },
      }
    );
  });

  protected readonly motion = _OVERLAY_MOTION;
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-multiselect',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'multiselect',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts: the description
   * and `aria-invalid` on the combobox (Optimus's `pt` type leaves `hiddenInput` out, though its
   * template reads it), the shown text marked disabled with the control (axe then skips its muted
   * colour), `tabindex="0"` on the box that scrolls the options (Chrome makes a scrolling box a
   * Tab stop anyway, and axe asks for keyboard access to it, so it is one on purpose), `inert` on
   * each option's checkbox input (the row takes the click, and the input is
   * no longer nested focusable content), and a gap closed on the options. Optimus never marks a
   * disabled option `aria-disabled`, so assistive tech would not know it is unavailable.
   *
   * Each option is a child component, and Optimus hands it the root's `pt` without resolving the
   * function form, so a function would hide `pcOptionCheckbox` from every row. The merge returns
   * the function form; it is called here, once, with the root, so Optimus gets an object. A
   * function-form `pt` of your own is called that once, not per part.
   */
  protected readonly partAttributes = computed<WjMultiSelectPt>(() => {
    const pt = _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(
          _mergePartAttributes(this.pt(), 'hiddenInput', {
            'aria-describedby': this.field.describedBy(),
            'aria-invalid': this.field.invalid() ? 'true' : undefined,
          }),
          'label',
          { 'aria-disabled': this.isDisabled() ? 'true' : undefined },
        ),
        'listContainer',
        { tabindex: '0' },
      ),
      'pcOptionCheckbox.input',
      { inert: 'true' },
    )({ instance: this.inner(), parent: { instance: undefined } });
    const own = pt.option;
    return {
      ...pt,
      option: (options) => {
        const attributes = typeof own === 'function' ? own(options) : own;
        return {
          ...(typeof attributes === 'string' ? { class: attributes } : attributes),
          'aria-disabled': _ptContextFlag(options, 'disabled') ? 'true' : undefined,
        };
      },
    };
  });

  declare registerOnChange: _AccessorHost<T[]>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<T[]>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<T[]>['setDisabledState'];

  writeValue(value: T[] | null): void {
    this.value.set(value ?? []);
  }
}
