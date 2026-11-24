import {
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  viewChild,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Optimus } from '@openng/optimus-ui/config';
import { Listbox } from '@openng/optimus-ui/listbox';
import type { WjOption } from 'weeljack-ng';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _ptContextFlag,
  _registerWithField,
} from 'weeljack-ng/private';
import type { WjListboxPt } from './listbox-types';

/** How many pickable options PageDown and PageUp move focus by. */
const PAGE_STEP = 10;

/** An option index an Optimus finder returned, `-1` when it is not a number. */
function asIndex(value: unknown): number {
  return typeof value === 'number' ? value : -1;
}

/**
 * A single-choice list of `options` over Optimus's `p-listbox`: a box of rows that grows with its
 * options up to 14rem and then scrolls. Click, Enter or Space picks a row, and the same action on
 * the picked row unpicks it. Bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`:
 * it is its own value accessor, and `value` is the picked option's `value` (`null` while none is
 * picked). Outside a `wj-field`, name the list with `ariaLabelledBy` (a visible text's id) or
 * `ariaLabel`: the focusable element is a `ul`, so a `<label for>` cannot name it.
 *
 * Inside a `wj-field` the field's label names the list, a click on that label focuses it, and the
 * field describes it and marks it invalid. The list is touched when focus leaves it, not when focus
 * moves between its rows. Size the list with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-listbox',
  imports: [Listbox],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjListbox, multi: true }],
  host: { '(focusout)': 'leave($event)' },
  templateUrl: './listbox.html',
  styleUrl: './listbox.css',
})
export class WjListbox<T> implements ControlValueAccessor {
  /** The picked option's `value`, `null` while none is picked. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  /**
   * The choices, in order. An empty list shows the translation's empty message. A `value` that no
   * option has picks nothing and is kept.
   */
  readonly options = input<WjOption<T>[]>([]);
  /** Makes the list inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the list as required (`aria-required`). */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is shown
   * instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /**
   * Id of the element whose focus Optimus moves into the list, the one a `wj-field` focuses when
   * its label is clicked. Inside a field one is generated.
   */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the list. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the list. Set on the list. Inside a `wj-field` it defaults to the
   * field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the list. Set on the list. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the list's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjListboxPt>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /**
   * The translation's `emptyMessage`. Optimus's list reads its translation for every other message
   * but draws the empty one from its own input alone, so with none given an empty list is blank.
   */
  protected readonly emptyMessage = ((): string => {
    const text: unknown = inject(Optimus).getTranslation('emptyMessage');
    return typeof text === 'string' ? text : '';
  })();
  private readonly inner = viewChild(Listbox);
  /** The form's touched callback, the one Optimus holds as its `onModelTouched`. */
  private touched: (() => void) | undefined;

  /**
   * Optimus's accessor, keeping the touched callback: Optimus's list never calls it (`onListBlur`
   * only emits `onBlur`), so the host's `focusout` does (`leave`). Its `writeValue` reads no
   * signal, so the bridge's effect re-runs only when the model changes.
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
    'wj-listbox',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'listbox',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts. On the list: the
   * field's label as its name (a `ul` cannot be labelled by a `<label for>`), the description,
   * `aria-invalid`, `aria-required` (Optimus binds none of these), and `aria-multiselectable`
   * `false`, which Optimus hard-codes to `true` even in single mode. On the hidden element in
   * front of the list, whose focus Optimus moves into the list: the id a field focuses, left off
   * while the list is disabled so that a label click cannot focus it. On the scrolling box around
   * the list: `tabindex="-1"`, because a browser makes a scrolling box a Tab stop of its own (a
   * Shift+Tab from the list would stop there first). On every option: `aria-disabled`, which
   * Optimus binds as `false` unless the option itself is disabled, so a disabled list would leave
   * its rows announced and measured as enabled.
   */
  protected readonly partAttributes = computed<WjListboxPt>(() => {
    const routed = _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(this.pt(), 'list', {
          'aria-labelledby': this.field.labelledBy(),
          'aria-describedby': this.field.describedBy(),
          'aria-invalid': this.field.invalid() ? 'true' : undefined,
          'aria-required': this.required() ? 'true' : undefined,
          'aria-multiselectable': 'false',
        }),
        'hiddenFirstFocusableElement',
        { id: this.isDisabled() ? undefined : this.field.id() },
      ),
      'listContainer',
      { tabindex: '-1' },
    );
    const disabled = this.isDisabled();
    return (context) => {
      const pt = routed(context);
      const own = pt.option;
      return {
        ...pt,
        option: (options) => {
          const attributes = typeof own === 'function' ? own(options) : own;
          return {
            ...(typeof attributes === 'string' ? { class: attributes } : attributes),
            'aria-disabled': String(disabled || _ptContextFlag(options, 'disabled')),
          };
        },
      };
    };
  });

  constructor() {
    // In the capture phase, so that Optimus's own handler (a reversed scroll) never sees the key.
    afterNextRender(() => {
      this.host.addEventListener(
        'keydown',
        (event) => {
          this.page(event);
        },
        { capture: true },
      );
    });
  }

  /**
   * PageDown and PageUp: focus moves ten pickable options (a disabled one is skipped), stopping at
   * the last or first, where Optimus only scrolls the list, and the wrong way round.
   */
  private page(event: KeyboardEvent): void {
    const forward = event.key === 'PageDown';
    const list = this.inner();
    if ((!forward && event.key !== 'PageUp') || !list) {
      return;
    }
    let index = list.focusedOptionIndex();
    if (index < 0) {
      const picked = asIndex(list.findSelectedOptionIndex());
      index = picked >= 0 ? picked : asIndex(list.findNextOptionIndex(-1));
    }
    for (let step = 0; step < PAGE_STEP; step++) {
      const next = asIndex(
        forward ? list.findNextOptionIndex(index) : list.findPrevOptionIndex(index),
      );
      if (next === index) {
        break;
      }
      index = next;
    }
    list.changeFocusedOptionIndex(event, index);
    event.preventDefault();
    event.stopPropagation();
  }

  /** Touched on blur: focus has left the host, rather than moved between its parts. */
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
