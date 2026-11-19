import {
  Component,
  Directive,
  afterNextRender,
  booleanAttribute,
  computed,
  Injector,
  inject,
  input,
  model,
  runInInjectionContext,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import {
  FormControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  type ControlValueAccessor,
} from '@angular/forms';
import { RadioButton } from '@openng/optimus-ui/radiobutton';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _warnOnce,
} from 'weeljack-ng/private';
import type { WjRadioButtonPt } from './radiobutton-types';

/** An `NgControl` for a radio with no forms directive: its `control.root` is its own. */
class StandIn extends NgControl {
  override readonly control = new FormControl();
  override viewToModelUpdate(): void {
    // Nothing reads it: the stand-in only gives Optimus's registry a control to compare.
  }
}

/**
 * Gives the Optimus radio on its node the `NgControl` it looks up without a fallback: the
 * consumer's own on the wrapper's host, else a stand-in. A provider on the wrapper's own
 * `viewProviders` would see itself first (NG0200), so it sits on the inner node and skips it.
 */
@Directive({
  selector: '[wjRadioControl]',
  providers: [
    {
      provide: NgControl,
      useFactory: () => inject(NgControl, { skipSelf: true, optional: true }) ?? new StandIn(),
    },
  ],
})
class RadioControl {}

/**
 * A radio button over Optimus's `p-radiobutton`. Give every radio of one group the same `name` and
 * the same value: `[(value)]` on one signal, `ngModel`, a `formControlName` in one `FormGroup`, or
 * one `[formField]` (which also pushes the `name`). `option` is this radio's own value, and the
 * radio whose `option` equals `value` is checked. The browser gives the group one tab stop, arrow
 * keys that check and wrap, and Space.
 *
 * Outside a `wj-field`, wrap the group in an element with `role="radiogroup"` and a name, and give
 * each radio a `<label for>` that matches `inputId`, or `ariaLabel`. Inside a field, two or more
 * radios make the field a group: its label names the group, and the field describes it and marks
 * it invalid.
 */
@Component({
  selector: 'wj-radiobutton',
  imports: [RadioButton, RadioControl],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjRadioButton, multi: true }],
  templateUrl: './radiobutton.html',
  styleUrl: './radiobutton.css',
})
export class WjRadioButton<T> implements ControlValueAccessor {
  /** The group's value: the `option` of the checked radio. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  /** This radio's own value, compared with `==` as Optimus does. */
  readonly option = input.required<T>();
  /** The group: radios with the same name share one tab stop and arrow keys. */
  readonly name = input<string>();
  /** Makes the radio inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the group as required. */
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
  /** Id of the element that names the radio. Set on the `input`. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the radio. Set on the `input`. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the radio's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjRadioButtonPt>();

  private readonly inner = viewChild(RadioButton);
  /** Counts the form's writes, so the accessor below runs again after each, even for an equal value. */
  private readonly written = signal(0);
  /**
   * Optimus's accessor, writing this radio's `option` first: Optimus checks the radio when the
   * written value equals its `value`, and the bridge's first write runs before a template binding
   * would have set it. It reads `option` and `written`, so the bridge writes again when the option
   * changes and after every form write: a sibling the registry unchecked keeps a model that a
   * write of the same value would not change.
   */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    return (
      control && {
        writeValue: (value: T | null) => {
          this.written();
          control.value = this.option();
          control.writeValue(value);
        },
        registerOnChange: (fn: (value: T | null) => void) => {
          control.registerOnChange(fn);
        },
        registerOnTouched: (fn: () => void) => {
          control.registerOnTouched(fn);
        },
      }
    );
  });
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-radiobutton',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'radiobutton',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    inline: true,
  });

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the `input`. */
  protected readonly partAttributes = computed<WjRadioButtonPt>(() => {
    return _mergePartAttributes(this.pt(), 'input', {
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
    });
  });

  constructor() {
    if (ngDevMode) {
      const injector = inject(Injector);
      // After the first render, so the `name` a `[formField]` pushes counts.
      afterNextRender(() => {
        if (!this.name()) {
          runInInjectionContext(injector, () => {
            _warnOnce(
              'WJ0090',
              'wj-radiobutton',
              'it has no name, so it forms a group of its own and arrow keys do not reach the other options',
              'Give every radio button of one group the same name',
            );
          });
        }
      });
    }
  }

  declare registerOnChange: _AccessorHost<T | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<T | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<T | null>['setDisabledState'];

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
    this.written.update((count) => count + 1);
  }
}
