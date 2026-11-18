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
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { InputText } from '@openng/optimus-ui/inputtext';
import { InputOtp } from '@openng/optimus-ui/inputotp';
import type { InputTextPassThrough } from '@openng/optimus-ui/types/inputtext';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _wjStrings,
} from 'weeljack-ng/private';
import type { WjInputOtpPt, WjInputOtpSize } from './inputotp-types';

/*
 * Optimus rewrites its characters from the model on every write, and it joins a partly filled row
 * ("3" typed in the third box of an empty row) into a shorter string, so the write that echoes the
 * string it just reported would move that character into the first box. The adapter below skips
 * that one write. It also cuts a pasted code to `length` (Optimus keeps one character too many) and
 * lets that write through, so Optimus drops the extra character as well.
 *
 * Optimus never marks the control touched, and its keydown handler blocks every key that is not a
 * digit under `integerOnly`, Tab included. The wrapper marks the control touched when focus leaves
 * the group and forwards only the keys Optimus means to handle.
 */

/** The keys Optimus's keydown handler is for: characters, arrows and Backspace. */
const HANDLED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace']);

/**
 * A one-time-code input over Optimus's `p-inputotp`: one box for each character, which moves to the
 * next box as you type and takes a pasted code whole. Bind `[(value)]`, or use `ngModel`, a
 * `FormControl` or `[formField]`: it is its own value accessor, and `value` is the characters
 * joined, `null` while every box is empty. Outside a `wj-field`, name the group with
 * `ariaLabelledBy` or `ariaLabel`.
 *
 * Every box is named from the translation ("Please enter one time password character 2"), so there
 * is no per-box label input. The group is a `role="group"` named by the label.
 */
@Component({
  selector: 'wj-inputotp',
  imports: [InputOtp, InputText],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjInputOtp, multi: true }],
  templateUrl: './inputotp.html',
  styleUrl: './inputotp.css',
  host: { '(focusout)': 'leave($event)' },
})
export class WjInputOtp implements ControlValueAccessor {
  /** The characters joined, `null` while every box is empty. Two-way: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** How many boxes there are, which is how many characters the code has. Default 4. */
  readonly length = input(4, { transform: numberAttribute });
  /** Accepts digits only and shows the numeric keypad. */
  readonly integerOnly = input(false, { transform: booleanAttribute });
  /** Hides each character, as a password does. */
  readonly mask = input(false, { transform: booleanAttribute });
  /** Makes every box inert. A form can disable them too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks every box as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid` on every box. Inside a `wj-field` the field's error
   * state is shown instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the first box, for a `<label for>`. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name of the group when there is no visible label. Set on the group. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the group. Set on the group. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the code. Set on every box. */
  readonly ariaDescribedBy = input<string>();
  /** Width and height step: 40 × 44 px boxes by default, 32 × 36 px `small`, 48 × 52 px `large`. */
  readonly size = input<WjInputOtpSize>();
  /**
   * Pass-through for the group and its boxes. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjInputOtpPt>();

  private readonly inner = viewChild(InputOtp);
  private readonly text = _wjStrings();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private reported: string | null | undefined;
  private touched: (() => void) | undefined;

  /**
   * Optimus's accessor, changed as the note above the class says: an empty row is reported as
   * `null`, a pasted code is cut to `length`, and the write that echoes what Optimus just reported
   * is skipped. Touched is the wrapper's, since Optimus never calls it.
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
        registerOnChange: (fn: (value: string | null) => void) => {
          control.registerOnChange((typed: string) => {
            const cut = typed.slice(0, this.length());
            const code = cut === '' ? null : cut;
            this.reported = cut === typed ? code : undefined;
            fn(code);
          });
        },
        registerOnTouched: (fn: () => void) => {
          this.touched = fn;
        },
      }
    );
  });

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-inputotp',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'inputotp',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /** `pt` forwarded as given, plus the group's role and name on the root. */
  protected readonly rootPt = computed<WjInputOtpPt>(() =>
    _mergePartAttributes(this.pt(), 'root', {
      role: 'group',
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.field.labelledBy(),
    }),
  );

  /**
   * One `pt` for each box, in order: the box's name (the translation's `otpCharacter`, `{0}` its
   * 1-based position), `aria-describedby`, `aria-invalid` and, on the first box, the id. Optimus's
   * own `pcInputText` part cannot tell its boxes apart, so the boxes are rendered from the `#input`
   * template and bound to these. The consumer's `pcInputText` is kept under them.
   */
  protected readonly boxes = computed<InputTextPassThrough[]>(() => {
    const pt = this.pt();
    const describedBy = this.field.describedBy();
    const invalid = this.field.invalid() ? 'true' : undefined;
    const id = this.field.id();
    return Array.from({ length: this.length() }, (_, index) => {
      const merge = _mergePartAttributes(pt, 'pcInputText.root', {
        id: index === 0 ? id : undefined,
        'aria-label': this.text('otpCharacter').replaceAll('{0}', String(index + 1)),
        'aria-describedby': describedBy,
        'aria-invalid': invalid,
      });
      return (context) => {
        const part = merge(context).pcInputText;
        return typeof part === 'function' ? part(context) : (part ?? {});
      };
    });
  });

  /** Forwards a key to Optimus only when it is one it handles (see the note above). */
  protected keydown(event: KeyboardEvent, forward: (event: Event) => void): void {
    if (event.key.length === 1 || HANDLED_KEYS.has(event.key)) forward(event);
  }

  /** Marks the control touched when focus leaves the group, not when it moves between boxes. */
  protected leave(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node && this.host.contains(next))) this.touched?.();
  }

  declare registerOnChange: _AccessorHost<string | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<string | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<string | null>['setDisabledState'];

  writeValue(value: string | null): void {
    this.value.set(value);
  }
}
