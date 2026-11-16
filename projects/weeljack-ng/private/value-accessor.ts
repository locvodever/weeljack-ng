import { effect, signal, type ModelSignal, type Signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { _checkAriaOnHost, _checkWeeljackSetup } from './dev-warnings';

/**
 * The three `ControlValueAccessor` methods {@link _bridgeAccessor} fills in on a wrapper. The
 * wrapper declares them with `declare`, so they cost it no code.
 *
 * @docs-private
 */
export interface _AccessorHost<T> {
  registerOnChange: (fn: (value: T) => void) => void;
  registerOnTouched: (fn: () => void) => void;
  setDisabledState: (disabled: boolean) => void;
}

/**
 * The plumbing of a component control's own `ControlValueAccessor` (w1-forms FR-2). The wrapper's
 * `model()` is the source of truth; the inner Optimus control is driven through its own accessor.
 * There is no inner `ngModel`, and Optimus's `formControl` input is never bound.
 *
 * - Whenever `model` changes, and once `inner` exists, the value is written into the inner control.
 *   A value the form writes before that (a reactive control's initial value) waits in the model.
 * - The inner control's change callback sets `model` and calls the form's; its touched callback
 *   calls the form's (touched on blur).
 * - `writeValue` stays the wrapper's own method: it sets `model` and nothing else, so the form's
 *   change callback is never echoed, and it is where a wrapper coerces (`null` to `false`).
 * - `registerOnChange`, `registerOnTouched` and `setDisabledState` are assigned onto `host`.
 *
 * It also makes the two dev-mode checks every component control's constructor makes
 * (`_checkWeeljackSetup`, `_checkAriaOnHost`) for `selector`, because each control would repeat
 * them and a wrapper's code is budgeted to 1.5 KB.
 *
 * Returns the effective disabled state: the `disabled` input OR the state the form set. Bind it to
 * the inner control. Must run in an injection context (a field initialiser):
 *
 * ```ts
 * @Component({
 *   selector: 'wj-checkbox',
 *   imports: [Checkbox],
 *   providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjCheckbox, multi: true }],
 *   template: '<p-checkbox binary [disabled]="isDisabled()" />',
 * })
 * class WjCheckbox implements ControlValueAccessor {
 *   readonly checked = model(false);
 *   readonly disabled = input(false, { transform: booleanAttribute });
 *   private readonly inner = viewChild(Checkbox);
 *   protected readonly isDisabled = _bridgeAccessor(this, 'wj-checkbox', this.checked, this.inner, this.disabled);
 *
 *   declare registerOnChange: _AccessorHost<boolean>['registerOnChange'];
 *   declare registerOnTouched: _AccessorHost<boolean>['registerOnTouched'];
 *   declare setDisabledState: _AccessorHost<boolean>['setDisabledState'];
 *   writeValue(value: boolean | null): void { this.checked.set(value === true); }
 * }
 * ```
 *
 * @docs-private
 */
export function _bridgeAccessor<T>(
  host: _AccessorHost<T>,
  selector: string,
  model: ModelSignal<T>,
  inner: Signal<ControlValueAccessor | undefined>,
  disabled: Signal<boolean>,
): () => boolean {
  _checkWeeljackSetup(selector);
  _checkAriaOnHost(selector);

  let changed: ((value: T) => void) | undefined;
  let touched: (() => void) | undefined;
  const fromForm = signal(false);

  effect(() => {
    const control = inner();
    control?.registerOnChange((value: T) => {
      model.set(value);
      changed?.(value);
    });
    control?.registerOnTouched(() => {
      touched?.();
    });
    control?.writeValue(model());
  });

  Object.assign(host, {
    registerOnChange: (fn: (value: T) => void) => {
      changed = fn;
    },
    registerOnTouched: (fn: () => void) => {
      touched = fn;
    },
    setDisabledState: (value: boolean) => {
      fromForm.set(value);
    },
  } satisfies _AccessorHost<T>);

  return () => disabled() || fromForm();
}
