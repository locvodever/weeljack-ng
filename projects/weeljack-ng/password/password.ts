import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { EyeIcon } from '@openng/optimus-ui/icons/eye';
import { EyeSlashIcon } from '@openng/optimus-ui/icons/eyeslash';
import { Password } from '@openng/optimus-ui/password';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _wjStrings,
} from 'weeljack-ng/private';
import type { WjPasswordPt, WjPasswordSize } from './password-types';

/**
 * A password input over Optimus's `p-password`, with an optional strength overlay and an optional
 * mask toggle: a real button at the end of the field box. Bind `[(value)]`, or use `ngModel`, a
 * `FormControl` or `[formField]`: it is its own value accessor, and `value` is the text. Outside a
 * `wj-field`, give it a visible `<label for>` that matches `inputId`, or `ariaLabel`.
 *
 * The toggle's name, its prompt and its strength texts come from the translation, so there is no
 * per-instance label input. Size the control with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-password',
  imports: [Password, EyeIcon, EyeSlashIcon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjPassword, multi: true }],
  templateUrl: './password.html',
  styleUrl: './password.css',
})
export class WjPassword implements ControlValueAccessor {
  /** The text. Two-way: `[(value)]`. */
  readonly value = model<string | null>(null);
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
  /** Hint text shown in the input while it is empty. */
  readonly placeholder = input<string>();
  /** The browser's autofill hint: `current-password` or `new-password`. */
  readonly autocomplete = input<string>();
  /** Shows the strength overlay while the input has focus. */
  readonly feedback = input(true, { transform: booleanAttribute });
  /** Adds a button that shows and hides the text. */
  readonly toggleMask = input(false, { transform: booleanAttribute });
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjPasswordSize>();
  /**
   * Pass-through for the password's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjPasswordPt>();

  private readonly inner = viewChild(Password);
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-password',
    this.value,
    this.inner,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'password',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
  });

  /** Whether the text shows. Optimus's own flag follows it: see `flip`. */
  protected readonly shown = signal(false);
  private readonly text = _wjStrings();
  protected readonly label = computed(() =>
    this.text(this.shown() ? 'hidePassword' : 'showPassword'),
  );

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the `input`. */
  protected readonly partAttributes = computed<WjPasswordPt>(() => {
    const merged = _mergePartAttributes(this.pt(), 'pcInputText.root', {
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
    });
    // Optimus removes an attribute only for a key set to `undefined`, and the merge omits those
    // keys: seed them, so a routed attribute that goes away is removed from the `input`.
    return (context) => {
      const pt = merged(context);
      const input = typeof pt.pcInputText === 'object' ? pt.pcInputText : {};
      const root = typeof input?.root === 'object' ? input.root : {};
      return {
        ...pt,
        pcInputText: {
          ...input,
          root: { 'aria-describedby': undefined, 'aria-invalid': undefined, ...root },
        },
      };
    };
  });

  declare registerOnChange: _AccessorHost<string | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<string | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<string | null>['setDisabledState'];

  writeValue(value: string | null): void {
    this.value.set(value);
  }

  /**
   * Flips the mask through Optimus's own toggle, then refreshes its OnPush view. The button lives
   * outside Optimus's template, so the swap of its show and hide icons cannot destroy it and
   * focus stays on it.
   */
  protected flip(): void {
    const inner = this.inner();
    inner?.onMaskToggle();
    inner?.cd.markForCheck();
    this.shown.set(inner?.unmasked ?? false);
  }
}
