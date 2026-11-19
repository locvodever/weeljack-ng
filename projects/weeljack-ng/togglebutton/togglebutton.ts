import { Component, booleanAttribute, computed, input, model, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { ToggleButton } from '@openng/optimus-ui/togglebutton';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _touchedOnLeave,
  _wjId,
  _wjStrings,
} from 'weeljack-ng/private';
import type { WjToggleButtonPt, WjToggleButtonSize } from './togglebutton-types';

/**
 * An on/off button over Optimus's `p-togglebutton`: one button that shows `onLabel` while it is on
 * and `offLabel` while it is off (the translation's "Yes" and "No" by default). Click, Enter or
 * Space toggles it. Bind `[(checked)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is
 * its own value accessor, and `checked` is the value.
 *
 * The button's own name is the label it shows, so the name changes as it toggles. Give it a
 * constant name with `ariaLabelledBy` (the id of a visible text) or `ariaLabel`; inside a
 * `wj-field` the field's label names it, and the field describes it and marks it invalid. The
 * button is touched when focus leaves it.
 */
@Component({
  selector: 'wj-togglebutton',
  imports: [ToggleButton],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjToggleButton, multi: true }],
  host: { '(focusout)': 'leave($event)' },
  templateUrl: './togglebutton.html',
  styleUrl: './togglebutton.css',
})
export class WjToggleButton implements ControlValueAccessor {
  /** Whether the button is on. Two-way: `[(checked)]`. */
  readonly checked = model(false);
  /** The label shown while the button is on. Shown as text. Defaults to the translation's "Yes". */
  readonly onLabel = input<string>();
  /** The label shown while the button is off. Shown as text. Defaults to the translation's "No". */
  readonly offLabel = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjToggleButtonSize>();
  /** Makes the button inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid outline and `aria-invalid`. Inside a `wj-field` the field's error state is
   * shown instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the button, for a `<label for>` to point at. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the button. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the button. Set on the button. Inside a `wj-field` it defaults to
   * the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the button. Set on the button. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the button's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjToggleButtonPt>();

  private readonly inner = viewChild(ToggleButton);
  protected readonly text = _wjStrings();
  /**
   * `size` as Optimus types its input. It leaves `size` undefined for the default 44 px, but
   * declares it `'large' | 'small'`, so a bare `undefined` does not compile.
   */
  protected readonly optimusSize = computed(
    // type-escape: Optimus types ToggleButton.size as 'large' | 'small' yet defaults it to undefined
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style -- `!` is banned by no-non-null-assertion
    () => this.size() as ToggleButton['size'],
  );
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-togglebutton',
    this.checked,
    this.inner,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'togglebutton',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    // The focusable part is a `role="button"` element, which `<label for>` cannot name.
    labelable: false,
  });

  /** The id the button names itself by, while a `ariaLabelledBy` has no field to supply one. */
  private readonly ownId = _wjId('togglebutton');
  /** The text on the button now: what a name that leaves it out would not say (see below). */
  private readonly shown = computed(() =>
    this.checked()
      ? (this.onLabel() ?? this.text('toggleOn'))
      : (this.offLabel() ?? this.text('toggleOff')),
  );

  /**
   * `pt` forwarded as given, plus what this wrapper routes onto Optimus's root, the focusable
   * `role="button"` element, none of which Optimus binds: the id (it declares `inputId` but
   * renders none), the description, `aria-invalid` and, while disabled, `aria-disabled`.
   *
   * The name is routed here too, and it always ends in the shown "Yes" / "No": a name that leaves
   * the visible text out fails axe's `label-content-name-mismatch` (WCAG 2.5.3). A label from
   * `ariaLabelledBy` or the field becomes `aria-labelledby="<label> <own id>"`, which reads the
   * label and then the button's own text; `ariaLabel` becomes `aria-label="<ariaLabel> <shown>"`.
   * With neither, the shown text is the name, as in Optimus.
   */
  protected readonly partAttributes = computed<WjToggleButtonPt>(() => {
    const by = this.field.labelledBy();
    const label = this.ariaLabel();
    const id = this.field.id() ?? (by ? this.ownId : undefined);
    return _mergePartAttributes(this.pt(), 'root', {
      id,
      'aria-labelledby': by ? `${by} ${String(id)}` : undefined,
      'aria-label': label ? `${label} ${this.shown()}` : undefined,
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
      'aria-disabled': this.isDisabled() ? 'true' : undefined,
    });
  });

  /** Touched on blur: focus has left the host. Optimus's `onBlur` is bound nowhere. */
  protected readonly leave = _touchedOnLeave(this.inner);

  declare registerOnChange: _AccessorHost<boolean>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<boolean>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<boolean>['setDisabledState'];

  writeValue(value: boolean | null): void {
    this.checked.set(value === true);
  }
}
