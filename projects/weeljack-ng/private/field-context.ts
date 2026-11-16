import { DestroyRef, InjectionToken, computed, inject, type Signal } from '@angular/core';
import { _wjId } from './ids';

/**
 * What a form control tells its enclosing `wj-field` about itself (w1-forms FR-14).
 *
 * @docs-private
 */
export interface _WjFieldControl {
  /** The id of the focusable element: the consumer's own, or one generated inside a field. */
  readonly id: Signal<string>;
  /** Whether the focusable element is labelable (`input`, `textarea`), so `<label for>` names it. */
  readonly labelable: boolean;
  /** An on/off control: the field puts its label and hint beside it. */
  readonly inline: boolean;
}

/**
 * What `wj-field` offers the controls inside it. Provided by `wj-field` under
 * {@link _WJ_FIELD_CONTEXT}; a control never implements it.
 *
 * @docs-private
 */
export interface _WjFieldContext {
  /** The id of the field's label element. */
  readonly labelId: string;
  /** The hint's id while a hint shows, `undefined` otherwise. */
  readonly hintId: Signal<string | undefined>;
  /** The error message's id while one shows, `undefined` otherwise. */
  readonly errorId: Signal<string | undefined>;
  /** True while the field shows an error, with or without message text. */
  readonly invalid: Signal<boolean>;
  /** Adds a control to the field. Returns the function that removes it again. */
  register(control: _WjFieldControl): () => void;
}

/**
 * The field a control sits in. Private to the package: an app has no documented need to register
 * its own control, so it is not public API. Inject it optionally; a control outside a field
 * finds `null`.
 *
 * @docs-private
 */
export const _WJ_FIELD_CONTEXT = new InjectionToken<_WjFieldContext>('WJ_FIELD_CONTEXT');

/** What a control passes to {@link _registerWithField}. */
interface FieldRegistration {
  /** The entry name, the prefix of an id generated inside a field (`wj-<entry>-<n>`). */
  readonly entry: string;
  /** The consumer's own id (`inputId`, or the static `id` attribute of a directive). */
  readonly id: Signal<string | undefined>;
  /** The consumer's own `aria-describedby` ids, space-separated. */
  readonly describedBy: Signal<string | undefined>;
  /** The consumer's own `aria-labelledby` ids. */
  readonly labelledBy: Signal<string | undefined>;
  /** The control's own `invalid` state. */
  readonly invalid: Signal<boolean>;
  /** Defaults to `true`. `false` when `<label for>` cannot name the focusable element. */
  readonly labelable?: boolean;
  /** Defaults to `false`. */
  readonly inline?: boolean;
}

/** What {@link _registerWithField} resolves for a control to bind onto its focusable element. */
interface FieldRegistered {
  readonly inField: boolean;
  readonly id: Signal<string | undefined>;
  readonly describedBy: Signal<string | undefined>;
  readonly labelledBy: Signal<string | undefined>;
  readonly invalid: Signal<boolean>;
}

/**
 * Registers a form control with the `wj-field` around it, if there is one, and unregisters it when
 * the control is destroyed. Must run in an injection context (a constructor or field
 * initialiser). Outside a field nothing registers and the signals you passed come back unchanged,
 * so the control behaves as a bare one.
 *
 * Inside a field it resolves four signals to bind onto the focusable element:
 * - `id`: your own id, else a generated `wj-<entry>-<n>`;
 * - `describedBy`: your ids, then the field's hint id and error id while they show, deduped;
 *   `undefined` when empty;
 * - `labelledBy`: yours when set; else the field's label id, only for `labelable: false`;
 * - `invalid`: exactly the field's error state. Your own `invalid` is not shown inside a field.
 *
 * A directive writes the result on its native element:
 *
 * ```ts
 * @Directive({
 *   selector: 'input[wjProbe]',
 *   host: {
 *     '[attr.id]': 'field.id()',
 *     '[attr.aria-describedby]': 'field.describedBy()',
 *     '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
 *   },
 * })
 * class WjProbe {
 *   protected readonly field = _registerWithField({
 *     entry: 'probe',
 *     id: signal(inject(new HostAttributeToken('id'), { optional: true }) ?? undefined),
 *     describedBy: signal(undefined),
 *     labelledBy: signal(undefined),
 *     invalid: signal(false),
 *   });
 * }
 * ```
 *
 * A component routes it to the focusable element inside, here through Optimus's own inputs:
 *
 * ```ts
 * protected readonly field = _registerWithField({
 *   entry: 'select',
 *   id: this.inputId,
 *   describedBy: this.ariaDescribedBy,
 *   labelledBy: this.ariaLabelledBy,
 *   invalid: this.invalid,
 *   labelable: false,
 * });
 * ```
 *
 * @docs-private
 */
export function _registerWithField(options: FieldRegistration): FieldRegistered {
  const field = inject(_WJ_FIELD_CONTEXT, { optional: true });
  const { entry, id, describedBy, labelledBy, invalid, labelable = true, inline = false } = options;
  if (field === null) {
    return { inField: false, id, describedBy, labelledBy, invalid };
  }
  const generated = _wjId(entry);
  const resolvedId = computed(() => {
    const own = id();
    return own !== undefined && own !== '' ? own : generated;
  });
  inject(DestroyRef).onDestroy(field.register({ id: resolvedId, labelable, inline }));
  return {
    inField: true,
    id: resolvedId,
    describedBy: computed(() => {
      const ids = [...(describedBy()?.split(/\s+/) ?? []), field.hintId(), field.errorId()].filter(
        (value): value is string => value !== undefined && value !== '',
      );
      return ids.length > 0 ? [...new Set(ids)].join(' ') : undefined;
    }),
    labelledBy: computed(() => {
      const own = labelledBy();
      return own !== undefined && own !== '' ? own : labelable ? undefined : field.labelId;
    }),
    invalid: field.invalid,
  };
}
