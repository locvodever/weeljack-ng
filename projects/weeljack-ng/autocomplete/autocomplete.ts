import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { AutoComplete } from '@openng/optimus-ui/autocomplete';
import type { WjOption } from 'weeljack-ng';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _OVERLAY_MOTION,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjAutoCompletePt, WjAutoCompleteSize } from './autocomplete-types';

/*
 * Optimus rewrites the input's text from the model on every write, and its `writeValue` reads its
 * suggestions signal. The bridge writes from an effect, so without the untracked adapter below the
 * effect would track that signal and write the (unchanged) model back each time the app answers a
 * `query`: the text typed so far, which is not the model while `forceSelection` holds, would be
 * wiped as the list opens.
 */

/**
 * A text input that suggests options as you type, over Optimus's `p-autocomplete`. Type, answer the
 * `query` output with a new `suggestions` array, and pick one: `value` is the picked `WjOption<T>`
 * (its label included, so a value a form writes shows its text before any search has run), `null`
 * while none is picked. Text that matches no suggestion is cleared when the input loses focus.
 * Bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is its own value
 * accessor. Outside a `wj-field`, give it a visible `<label for>` that matches `inputId`, or
 * `ariaLabel`.
 *
 * Inside a `wj-field` the field's label names the input, and the field describes it and marks it
 * invalid. The list opens inside the host, and its empty message and its accessible name come from
 * the translation. Size the control with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-autocomplete',
  imports: [AutoComplete],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjAutoComplete, multi: true }],
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.css',
})
export class WjAutoComplete<T> implements ControlValueAccessor {
  /** The picked suggestion, `null` while none is picked. Two-way: `[(value)]`. */
  readonly value = model<WjOption<T> | null>(null);
  /**
   * The suggestions for the last `query`. Answer every `query` with a new array, an empty one
   * included: the list opens, updates or closes, and the spinner stops, only when the reference
   * changes.
   */
  readonly suggestions = input<WjOption<T>[]>([]);
  /**
   * The text typed, 300 ms after the last keystroke and once there is at least one character. Never
   * blank text. Answer it with `suggestions`.
   */
  readonly query = output<string>();
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
  readonly size = input<WjAutoCompleteSize>();
  /**
   * Pass-through for the autocomplete's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAutoCompletePt>();

  private readonly inner = viewChild(AutoComplete);

  /**
   * Optimus's accessor, with its write run untracked (see the note above the class): the bridge
   * writes the model into it from an effect, and Optimus's `writeValue` reads its suggestions
   * signal, which would make that effect run again, and wipe the text being typed, on every answer.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    return (
      control && {
        writeValue: (value: WjOption<T> | null) => {
          untracked(() => {
            control.writeValue(value);
          });
        },
        registerOnChange: (fn: (value: WjOption<T> | null) => void) => {
          control.registerOnChange(fn);
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
    'wj-autocomplete',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'autocomplete',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
  });

  /** `pt` forwarded as given, plus the description and `aria-invalid` on the `input`. */
  protected readonly partAttributes = computed<WjAutoCompletePt>(() =>
    _mergePartAttributes(this.pt(), 'pcInputText.root', {
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
    }),
  );

  declare registerOnChange: _AccessorHost<WjOption<T> | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<WjOption<T> | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<WjOption<T> | null>['setDisabledState'];

  writeValue(value: WjOption<T> | null): void {
    this.value.set(value);
  }
}
