import { Component, booleanAttribute, computed, input, model, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { ToggleSwitch } from '@openng/optimus-ui/toggleswitch';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjToggleSwitchPt } from './toggleswitch-types';

/**
 * An on/off switch over Optimus's `p-toggleswitch`, a 40 x 24 px track. Bind `[(checked)]`, or use
 * `ngModel`, a `FormControl` or `[formField]`: it is its own value accessor, and `checked` is the
 * value. Outside a `wj-field`, give it a visible `<label for>` that matches `inputId`, or `ariaLabel`.
 *
 * Inside a `wj-field` the label and hint sit beside the switch, a click on the label toggles it, and
 * the field names, describes and marks it invalid.
 */
@Component({
  selector: 'wj-toggleswitch',
  imports: [ToggleSwitch],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjToggleSwitch, multi: true }],
  templateUrl: './toggleswitch.html',
  styleUrl: './toggleswitch.css',
})
export class WjToggleSwitch implements ControlValueAccessor {
  /** Whether the switch is on. Two-way: `[(checked)]`. */
  readonly checked = model(false);
  /** Makes the switch inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the switch as required. */
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
  /** Id of the element that names the switch. Set on the `input`. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the switch. Set on the `input`. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the switch's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjToggleSwitchPt>();

  private readonly inner = viewChild(ToggleSwitch);
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-toggleswitch',
    this.checked,
    this.inner,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'toggleswitch',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    inline: true,
  });

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the `input`. */
  protected readonly partAttributes = computed<WjToggleSwitchPt>(() => {
    const merged = _mergePartAttributes(this.pt(), 'input', {
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
    });
    // Optimus removes an attribute only for a key set to `undefined`, and the merge omits those
    // keys: seed them, so a routed attribute that goes away is removed from the `input`.
    return (context) => {
      const pt = merged(context);
      const input = typeof pt.input === 'object' ? pt.input : {};
      return {
        ...pt,
        input: { 'aria-describedby': undefined, 'aria-invalid': undefined, ...input },
      };
    };
  });

  declare registerOnChange: _AccessorHost<boolean>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<boolean>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<boolean>['setDisabledState'];

  writeValue(value: boolean | null): void {
    this.checked.set(value === true);
  }
}
