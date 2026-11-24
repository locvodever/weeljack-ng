import {
  Component,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  viewChild,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { CascadeSelect } from '@openng/optimus-ui/cascadeselect';
import type { WjOption } from 'weeljack-ng';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _OVERLAY_MOTION,
  _ptContextFlag,
  _registerWithField,
} from 'weeljack-ng/private';
import type {
  WjCascadeSelectOption,
  WjCascadeSelectPt,
  WjCascadeSelectSize,
} from './cascadeselect-types';

/*
 * Optimus 2.0.2 defects this wrapper works around:
 * - It clears its value whenever its `options` input changes, the first binding included, and
 *   reports the clear through its change callback as `null`. The bridge registers that callback
 *   before the first binding, so a value the form wrote first would be lost at once. Only that
 *   clear reports `null`, so the accessor adapter keeps it from the form and writes the model back
 *   once Optimus is done.
 * - With `optionValue` set it compares a leaf's value with the leaf itself, so it never marks the
 *   picked leaf, and it cannot open while its value is one no leaf has: it throws as it renders.
 *   So it is given no `optionValue`: its value is the leaf, found by the adapter from the `value`
 *   the app holds, and `null` when there is none.
 * - It hands a level its `pt` as a signal it resolves once, so the rows below the first level get
 *   no `pt` at all, and it hands those levels no `optionDisabled`, so a disabled row there is not
 *   dimmed and a mouse can pick it. `fixRows` writes what those rows need on the DOM.
 */

/** A row's `children`, `[]` for a leaf (and for a group with none, which Optimus reads as a leaf). */
function childrenOf(option: unknown): readonly unknown[] {
  const children: unknown = Reflect.get(Object(option), 'children');
  return Array.isArray(children) ? children : [];
}

/** How many levels of the tree hold groups: the length of the `children` key list Optimus reads. */
function groupLevels(options: readonly unknown[]): number {
  return Math.max(
    0,
    ...options.map((option) => {
      const children = childrenOf(option);
      return children.length > 0 ? 1 + groupLevels(children) : 0;
    }),
  );
}

/** Whether two values are the same one: identical, or objects whose own entries are. */
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => same(Reflect.get(a, key), Reflect.get(b, key)))
  );
}

/** The leaf whose `value` is `value`, at any depth, else `undefined`. */
function leafOf(options: readonly unknown[], value: unknown): unknown {
  for (const option of options) {
    const children = childrenOf(option);
    const found =
      children.length > 0
        ? leafOf(children, value)
        : same(Reflect.get(Object(option), 'value'), value)
          ? option
          : undefined;
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/** The row an Optimus key stands for: its index path (`0_2_1`) walked down the tree. */
function rowFor(options: readonly unknown[], key: string): unknown {
  let row: unknown;
  let level = options;
  for (const index of key.split('_')) {
    row = level[Number(index)];
    level = childrenOf(row);
  }
  return row;
}

/**
 * A single-choice select for a tree of options over Optimus's `p-cascadeselect`: a closed combobox
 * that opens a list, and a group in it opens the next level beside it (stacked under a 960 px
 * viewport). Bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is its own
 * value accessor, and `value` is the picked leaf's `value` (`null` while none is picked). Only a
 * leaf can be picked. Outside a `wj-field`, give it a visible `<label for>` that matches `inputId`,
 * or `ariaLabel`.
 *
 * Inside a `wj-field` the field's label names the combobox, a click on that label focuses it, and
 * the field describes it and marks it invalid. The levels open inside the host, and the list's
 * accessible name comes from the translation. Size the control with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-cascadeselect',
  imports: [CascadeSelect],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjCascadeSelect, multi: true }],
  templateUrl: './cascadeselect.html',
  styleUrl: './cascadeselect.css',
})
export class WjCascadeSelect<T> implements ControlValueAccessor {
  /** The picked leaf's `value`, `null` while none is picked. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  /**
   * The tree, in order: leaves and groups. A new array rebuilds the levels, so keep one reference
   * while the tree is the same. A `value` that no leaf has shows the placeholder and is kept.
   */
  readonly options = input<WjCascadeSelectOption<T>[]>([]);
  /** Makes the select inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the select as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is shown
   * instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the combobox `input`, for a `<label for>`. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the combobox. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the select. Set on the combobox. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the select. Set on the combobox. */
  readonly ariaDescribedBy = input<string>();
  /** Hint text shown while no leaf is picked. Rendered as text. */
  readonly placeholder = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjCascadeSelectSize>();
  /**
   * Pass-through for the select's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjCascadeSelectPt>();

  private readonly inner = viewChild(CascadeSelect);

  /** Optimus's accessor, with the defects above worked around. */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    const write = (value: T | null): void => {
      control?.writeValue(leafOf(this.options(), value) ?? null);
    };
    return (
      control && {
        writeValue: write,
        registerOnChange: (fn: (value: T | null) => void) => {
          control.registerOnChange((leaf: WjOption<T> | null) => {
            if (leaf === null) {
              queueMicrotask(() => {
                write(this.value());
              });
            } else {
              fn(leaf.value);
            }
          });
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
    'wj-cascadeselect',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'cascadeselect',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
  });

  /**
   * What Optimus gets for the tree. It types `options` as `string[]` and reads the key of the
   * children of a group once per level, so the list holds `'children'` once per level of groups.
   */
  protected readonly tree = computed(() => ({
    // type-escape: Optimus 2.0.2 types CascadeSelect.options as string[]
    items: this.options() as unknown as string[],
    levels: Array.from({ length: groupLevels(this.options()) }, () => 'children'),
  }));

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts: the description
   * and `aria-invalid` on the combobox, the shown text marked disabled with the control (axe then
   * skips its muted colour), and two gaps closed on the first level's rows. Optimus never marks a
   * disabled option `aria-disabled`, nor a group `aria-expanded`, so assistive tech would not know
   * the one is unavailable or whether the other is open. Rows below the first level get them from
   * `fixRows`.
   *
   * Each level is a child component, and Optimus hands it the root's `pt` without resolving the
   * function form, so a function would hide every row part from every level. The merge returns the
   * function form; it is called here, once, with the root, so Optimus gets an object and the first
   * level gets every part. A function-form `pt` of your own is called that once, not per part.
   */
  protected readonly partAttributes = computed<WjCascadeSelectPt>(() => {
    const pt = _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'hiddenInput', {
        'aria-describedby': this.field.describedBy(),
        'aria-invalid': this.field.invalid() ? 'true' : undefined,
      }),
      'label',
      { 'aria-disabled': this.isDisabled() ? 'true' : undefined },
    )({ instance: this.inner(), parent: { instance: undefined } });
    const own = pt.option;
    return {
      ...pt,
      option: (options) => {
        const attributes = typeof own === 'function' ? own(options) : own;
        return {
          ...(typeof attributes === 'string' ? { class: attributes } : attributes),
          'aria-disabled': _ptContextFlag(options, 'disabled') ? 'true' : undefined,
          'aria-expanded': _ptContextFlag(options, 'optionGroup')
            ? String(_ptContextFlag(options, 'active'))
            : undefined,
        };
      },
    };
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterEveryRender(() => {
      this.fixRows(host);
    });
  }

  /**
   * Writes on every open row what `pt` cannot reach, however deep. No row has an `aria-label` of
   * its own text: an open group contains its level, so that text is not part of its visible text
   * (axe `label-content-name-mismatch`), and it is named from its content. A row below the first
   * level is dimmed, and out of a mouse's reach, when its option is disabled, says so, and a group
   * says whether its level is open. The option is found from the row's id: the control's id, then
   * the index path.
   */
  private fixRows(host: HTMLElement): void {
    const id = this.inner()?.id ?? '';
    for (const row of host.querySelectorAll('[role="treeitem"]')) {
      row.removeAttribute('aria-label');
      if (row.getAttribute('aria-level') !== '1') {
        const option = rowFor(this.options(), row.id.slice(id.length + 1));
        const disabled = Reflect.get(Object(option), 'disabled') === true;
        row.classList.toggle('p-disabled', disabled);
        if (disabled) {
          row.setAttribute('aria-disabled', 'true');
        } else {
          row.removeAttribute('aria-disabled');
        }
        if (childrenOf(option).length > 0) {
          row.setAttribute(
            'aria-expanded',
            String(row.classList.contains('p-cascadeselect-option-active')),
          );
        }
      }
    }
  }

  declare registerOnChange: _AccessorHost<T | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<T | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<T | null>['setDisabledState'];

  writeValue(value: T | null): void {
    this.value.set(value);
  }
}
