import { Component, booleanAttribute, computed, input, model, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Select } from '@openng/optimus-ui/select';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjSelectOption, WjSelectPt, WjSelectSize } from './select-types';

/** Whether the pass-through context Optimus gives an `option` part describes a disabled option. */
function isDisabledOption(options: unknown): boolean {
  return Reflect.get(Object(Reflect.get(Object(options), 'context')), 'disabled') === true;
}

/**
 * A single-choice select over Optimus's `p-select`: a closed combobox that opens a list of
 * `options`. Bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is its own
 * value accessor, and `value` is the picked option's `value` (`null` while none is picked). Outside
 * a `wj-field`, give it `ariaLabel` or `ariaLabelledBy`: the focusable element is a `span`, so a
 * `<label for>` cannot name it.
 *
 * Inside a `wj-field` the field's label names the combobox, a click on that label focuses it, and
 * the field describes it and marks it invalid. The list opens inside the host, and its empty
 * message and its accessible name come from the translation. Size the control with `class` or
 * `style` on the host.
 */
@Component({
  selector: 'wj-select',
  imports: [Select],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjSelect, multi: true }],
  templateUrl: './select.html',
  styleUrl: './select.css',
})
export class WjSelect<T> implements ControlValueAccessor {
  /** The picked option's `value`, `null` while none is picked. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  /** The choices, in order. An empty list shows the translation's empty message when opened. */
  readonly options = input<WjSelectOption<T>[]>([]);
  /** Makes the select inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the select as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is shown
   * instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the combobox element. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the combobox. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the select. Set on the combobox. Inside a `wj-field` it defaults
   * to the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the select. Set on the combobox. */
  readonly ariaDescribedBy = input<string>();
  /** Hint text shown while no option is picked. Rendered as text. */
  readonly placeholder = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjSelectSize>();
  /**
   * Pass-through for the select's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSelectPt>();

  private readonly inner = viewChild(Select);
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-select',
    this.value,
    this.inner,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'select',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts: the ARIA
   * attributes on the combobox, and three gaps closed here. Optimus's two hidden focus-trap spans
   * sit in the Tab order, so Tab from an open list would land on one and lose focus when the list
   * closed; it never marks a disabled option `aria-disabled`, so assistive tech would not know the
   * option is unavailable; and its chevron is a second, English-only "dropdown trigger" button
   * beside the combobox, so it is hidden from assistive tech.
   */
  protected readonly partAttributes = computed<WjSelectPt>(() => {
    const untabbable = { tabindex: '-1' };
    const routed = _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(
          _mergePartAttributes(this.pt(), 'label', {
            'aria-describedby': this.field.describedBy(),
            'aria-invalid': this.field.invalid() ? 'true' : undefined,
          }),
          'hiddenFirstFocusableEl',
          untabbable,
        ),
        'hiddenLastFocusableEl',
        untabbable,
      ),
      'dropdown',
      { 'aria-hidden': 'true' },
    );
    return (context) => {
      const pt = routed(context);
      const own = pt.option;
      return {
        ...pt,
        option: (options) => {
          const attributes = typeof own === 'function' ? own(options) : own;
          return {
            ...(typeof attributes === 'string' ? { class: attributes } : attributes),
            'aria-disabled': isDisabledOption(options) ? 'true' : undefined,
          };
        },
      };
    };
  });

  declare registerOnChange: _AccessorHost<T | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<T | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<T | null>['setDisabledState'];

  writeValue(value: T | null): void {
    this.value.set(value);
  }
}
