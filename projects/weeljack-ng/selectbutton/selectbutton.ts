import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  viewChild,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { SelectButton } from '@openng/optimus-ui/selectbutton';
import type { WjOption } from 'weeljack-ng';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _rovingFocus,
} from 'weeljack-ng/private';
import type { WjSelectButtonPt, WjSelectButtonSize } from './selectbutton-types';

/**
 * Whether the toggle button a pass-through function is called for is disabled. Optimus calls a
 * toggle button's own part functions with its instance, whose `$disabled` signal reads the group's
 * state and the option's; its types do not declare either, so both are narrowed with no cast.
 */
function isToggleDisabled(options: unknown): boolean {
  const instance: unknown = Reflect.get(Object(options), 'instance');
  const read: unknown = Reflect.get(Object(instance), '$disabled');
  return typeof read === 'function' && Reflect.apply(read, instance, []) === true;
}

/**
 * A single-choice group of `options` over Optimus's `p-selectbutton`: one row of joined toggle
 * buttons, one per option. Click, Enter or Space on a button picks its option, and on the picked
 * button unpicks it unless `allowEmpty` is off. Bind `[(value)]`, or use `ngModel`, a `FormControl`
 * or `[formField]`: it is its own value accessor, and `value` is the picked option's `value`
 * (`null` while none is picked). Keep to two to five short, unique labels.
 *
 * The enabled buttons are one Tab stop: Tab enters on the picked button (the first enabled one
 * while none is picked) and the next Tab leaves. Arrow Right and Arrow Left, Home and End move
 * focus between the enabled buttons without picking, and wrap; Enter and Space pick the focused
 * one. A disabled button is skipped, and a disabled group takes no Tab at all. Name the group with `ariaLabelledBy` (the id of a visible text) or `ariaLabel`;
 * inside a `wj-field` the field's label names it, and the field describes it and marks it invalid.
 * The group is touched when focus leaves it, not when focus moves between its buttons.
 */
@Component({
  selector: 'wj-selectbutton',
  imports: [SelectButton],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjSelectButton, multi: true }],
  host: { '(focusout)': 'leave($event)' },
  templateUrl: './selectbutton.html',
  styleUrl: './selectbutton.css',
})
export class WjSelectButton<T> implements ControlValueAccessor {
  /** The picked option's `value`, `null` while none is picked. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  /** The choices, in order. Labels must be unique. A `value` that no option has picks nothing and is kept. */
  readonly options = input<WjOption<T>[]>([]);
  /**
   * Whether a click on the picked button unpicks it (the value becomes `null`). Turn it off to keep
   * a pick.
   */
  readonly allowEmpty = input(true, { transform: booleanAttribute });
  /** Makes the group inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Reaches forms validation only: a group cannot carry `aria-required`. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid outline and `aria-invalid`. Inside a `wj-field` the field's error state is
   * shown instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Accessible name when there is no visible label. Set on the group. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the group. Set on the group. Inside a `wj-field` it defaults to
   * the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the group. Set on the group. */
  readonly ariaDescribedBy = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjSelectButtonSize>();
  /**
   * Pass-through for the group's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSelectButtonPt>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly inner = viewChild(SelectButton);
  /** The form's touched callback, the one Optimus holds as its `onModelTouched`. */
  private touched: (() => void) | undefined;

  /**
   * Optimus's accessor, keeping the touched callback: Optimus's `onBlur`, the only caller of
   * `onModelTouched`, is bound nowhere in its template, so the host's `focusout` calls it instead
   * (`leave`). Its `writeValue` reads no signal, so the bridge's effect re-runs only when the model
   * changes.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    return (
      control && {
        writeValue: (value: T | null) => {
          control.writeValue(value);
        },
        registerOnChange: (fn: (value: T | null) => void) => {
          control.registerOnChange(fn);
        },
        registerOnTouched: (fn: () => void) => {
          this.touched = fn;
          control.registerOnTouched(fn);
        },
      }
    );
  });

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-selectbutton',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'selectbutton',
    // No element takes focus for the group, so no id is routed and a label click does nothing.
    id: () => undefined,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts. On the group: the
   * name, the description, `aria-invalid` and, while disabled, `aria-disabled` (Optimus binds none
   * of these but `aria-labelledby`).
   * On every toggle button, a child component: Optimus never marks a disabled one `aria-disabled`,
   * and binds `tabindex="0"` on a disabled one too, so a disabled button is announced as
   * unavailable and taken out of the Tab order. An enabled button's `tabindex` is not routed (the
   * roving focus owns it, and routing `undefined` would remove Optimus's own).
   *
   * Optimus resolves a function-form `pt` once, with the group, and hands each toggle button the
   * object it returns. So the routed `root` of a toggle button is itself a function, which
   * Optimus calls per button with that button as `instance`.
   */
  protected readonly partAttributes = computed<WjSelectButtonPt>(() => {
    const routed = _mergePartAttributes(this.pt(), 'root', {
      'aria-label': this.ariaLabel(),
      'aria-disabled': this.isDisabled() ? 'true' : undefined,
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
    });
    return (context) => {
      const pt = routed(context);
      const own = pt.pcToggleButton;
      return {
        ...pt,
        pcToggleButton: (outer) => {
          const toggle = typeof own === 'function' ? own(outer) : own;
          const root = toggle?.root;
          return {
            ...toggle,
            root: (options) => {
              const attributes = typeof root === 'function' ? root(options) : root;
              const disabled = isToggleDisabled(options);
              return {
                ...(typeof attributes === 'string' ? { class: attributes } : attributes),
                'aria-disabled': disabled ? 'true' : undefined,
                ...(disabled && { tabindex: '-1' }),
              };
            },
          };
        },
      };
    };
  });

  constructor() {
    // The enabled toggle buttons are one Tab stop, led by the picked one.
    _rovingFocus(
      () => [...this.host.querySelectorAll<HTMLElement>('.p-togglebutton:not(.p-disabled)')],
      () =>
        this.host.querySelector<HTMLElement>('.p-togglebutton[aria-pressed="true"]') ?? undefined,
    );
  }

  /** Touched on blur: focus has left the host, rather than moved between its buttons. */
  protected leave(event: FocusEvent): void {
    if (!(event.relatedTarget instanceof Node && this.host.contains(event.relatedTarget))) {
      this.touched?.();
    }
  }

  declare registerOnChange: _AccessorHost<T | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<T | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<T | null>['setDisabledState'];

  writeValue(value: T | null): void {
    this.value.set(value);
  }
}
