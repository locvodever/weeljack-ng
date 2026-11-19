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
import { TreeSelect } from '@openng/optimus-ui/treeselect';
import type { WjTreeNode, WjTreeSelectionMode } from 'weeljack-ng';
import {
  _OVERLAY_MOTION,
  _bridgeAccessor,
  type _AccessorHost,
  _copyTree,
  _mergePartAttributes,
  _registerWithField,
  _wjId,
} from 'weeljack-ng/private';
import type { WjTreeSelectPt, WjTreeSelectSize } from './treeselect-types';

/*
 * Notes on the template (kept here: a partially compiled template ships as text, inside the size
 * budget):
 * - Optimus writes `parent`, `expanded` and `partialSelected` into every node it renders, so it
 *   gets copies (`_copyTree`) and everything it reports comes back as the app's own nodes. The
 *   `accessor` computed wraps Optimus's own accessor to map between the two, so `_bridgeAccessor`
 *   is used as it is. It depends on the copies, so a new `options` array writes the value again
 *   into the new copies. It skips the write that echoes what Optimus just reported: Optimus
 *   resets its partly checked marks and its opened branches on every write.
 * - Optimus hands its tree nodes the `pt` it was given once, so the parts of a node below the first
 *   level get none. What axe needs of every node is therefore written on the DOM after each render,
 *   for the panel's tree, at any depth (see `fixNodes`).
 */

/** Optimus's value, one node or an array, `null` when empty, as an array. */
function toArray<N>(picked: N | N[] | null): N[] {
  return Array.isArray(picked) ? picked : picked ? [picked] : [];
}

/**
 * What every node of the panel's tree needs, at any depth: the toggle and the checkbox are hidden
 * from assistive tech (the treeitem already says expanded and checked), and the treeitem has no
 * `aria-label`: an open treeitem contains its children, so a label of its own text is not part of
 * its visible text (axe `label-content-name-mismatch`), and it is named from its content. A node
 * that can open says `aria-expanded="false"` while closed: Optimus leaves it off. Its set size is
 * the number of siblings (Optimus gives its own child count), and a node whose own checkbox is
 * partly checked says `aria-checked="mixed"` (a stale `"mixed"` goes back to `"false"`: Optimus
 * writes nothing when a partly checked node is unchecked).
 */
function fixNodes(host: HTMLElement): void {
  for (const node of host.querySelectorAll('[role="treeitem"]')) {
    node.removeAttribute('aria-label');
    node.setAttribute(
      'aria-setsize',
      String(node.parentElement?.parentElement?.childElementCount ?? 0),
    );
    if (!node.hasAttribute('aria-expanded') && !node.classList.contains('p-tree-node-leaf')) {
      node.setAttribute('aria-expanded', 'false');
    }
    const mixed =
      node.querySelector(
        ':scope > [data-pc-section="nodecontent"] > [data-p-partialchecked="true"]',
      ) !== null;
    if (mixed || node.getAttribute('aria-checked') === 'mixed') {
      node.setAttribute('aria-checked', mixed ? 'mixed' : 'false');
    }
  }
  const hidden =
    '[data-pc-section="nodetogglebutton"], [data-pc-section="nodecontent"] > p-checkbox';
  for (const part of host.querySelectorAll(hidden)) {
    part.setAttribute('aria-hidden', 'true');
  }
}

/**
 * A form control that picks one or more nodes from a tree, in a drop-down panel, over Optimus's
 * `p-treeselect`. Give it `options`, nodes of `WjTreeNode` from `weeljack-ng`, with a `key` on
 * each, and bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is its own
 * value accessor, and `value` is an array of your own nodes, at most one in `single` mode. Your
 * nodes are never written. Outside a `wj-field`, give it `ariaLabel` or `ariaLabelledBy`.
 *
 * Inside a `wj-field` the field's label names the combobox together with the value it shows, a
 * click on that label focuses it, and the field describes it and marks it invalid. The panel opens
 * inside the host. Size the control with `class` or `style` on the host.
 */
@Component({
  selector: 'wj-treeselect',
  imports: [TreeSelect],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjTreeSelect, multi: true }],
  templateUrl: './treeselect.html',
  styleUrl: './treeselect.css',
  host: { '(keydown)': 'jump($event)' },
})
export class WjTreeSelect<T = unknown> implements ControlValueAccessor {
  /** The picked nodes, always an array of your own nodes: at most one in `single` mode. Two-way. */
  readonly value = model<WjTreeNode<T>[]>([]);
  /** The nodes to pick from. Never changed: Optimus gets copies, matched to `value` by `key`. */
  readonly options = input<WjTreeNode<T>[]>([]);
  /** How nodes are picked: one, many by click, or many by checkbox. */
  readonly selectionMode = input<WjTreeSelectionMode>('single');
  /** Makes the control inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the control as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is shown
   * instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Id of the combobox element. Inside a field one is generated. */
  readonly inputId = input<string>();
  /** Accessible name when there is no visible label. Set on the combobox. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the control. Set on the combobox, followed by the id of the shown
   * value. Inside a `wj-field` it defaults to the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the control. Set on the combobox. */
  readonly ariaDescribedBy = input<string>();
  /** Hint text shown while nothing is picked. Rendered as text. */
  readonly placeholder = input<string>();
  /** Height step: 44 px by default, 36 px `small`, 52 px `large`. */
  readonly size = input<WjTreeSelectSize>();
  /**
   * Pass-through for the control's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTreeSelectPt>();

  protected readonly motion = _OVERLAY_MOTION;
  private readonly inner = viewChild(TreeSelect);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly valueId = _wjId('treeselect-value');
  private reported: WjTreeNode<T>[] | undefined;

  /** The copies Optimus renders, rebuilt for each new `options` array. */
  protected readonly copy = computed(() => _copyTree(this.options()));

  /** Optimus's accessor, writing the copies in and your own nodes out. */
  private readonly accessor: Signal<ControlValueAccessor | undefined> = computed(() => {
    const control = this.inner();
    const { copyOf, original } = this.copy();
    const single = this.selectionMode() === 'single';
    return (
      control && {
        writeValue: (nodes: WjTreeNode<T>[]) => {
          if (nodes !== this.reported) {
            const copies = nodes.map(copyOf);
            control.writeValue(single ? (copies[0] ?? null) : copies);
          }
        },
        registerOnChange: (fn: (nodes: WjTreeNode<T>[]) => void) => {
          control.registerOnChange((picked: WjTreeNode<T> | WjTreeNode<T>[] | null) => {
            this.reported = toArray(picked).map(original);
            fn(this.reported);
          });
        },
        registerOnTouched: (fn: () => void) => {
          control.registerOnTouched(fn);
        },
      }
    );
  });

  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-treeselect',
    this.value,
    this.accessor,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'treeselect',
    id: this.inputId,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /** The name's ids followed by the shown value's, so the combobox reads "label, value". */
  protected readonly labelledBy = computed(() => {
    const names = this.field.labelledBy();
    return names ? `${names} ${this.valueId}` : undefined;
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts: the ARIA
   * attributes on the combobox (Optimus sets no `aria-required`), the shown value's id, marked
   * disabled with the control (axe then skips its muted colour), and the chevron hidden from
   * assistive tech (it is a second, English-only "treeselect trigger" button beside the combobox).
   */
  protected readonly partAttributes = computed<WjTreeSelectPt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(this.pt(), 'hiddenInput', {
          'aria-describedby': this.field.describedBy(),
          'aria-invalid': this.field.invalid() ? 'true' : undefined,
          'aria-required': this.required() ? 'true' : undefined,
        }),
        'label',
        { id: this.valueId, 'aria-disabled': this.isDisabled() ? 'true' : undefined },
      ),
      'dropdown',
      { 'aria-hidden': 'true' },
    ),
  );

  constructor() {
    afterEveryRender(() => {
      fixNodes(this.host);
    });
  }

  /**
   * Home and End move focus to the first and the last node on screen in the panel, and hand the one
   * Tab stop over as Optimus does. Nothing is picked. Optimus ignores these keys, so they reach the
   * host; only a treeitem target counts, so the combobox keeps its keys.
   */
  protected jump(event: KeyboardEvent): void {
    const { key } = event;
    const items = [...this.host.querySelectorAll<HTMLElement>('[role="treeitem"]')];
    const from = items.find((item) => item === event.target);
    const next = key === 'Home' ? items[0] : key === 'End' ? items.at(-1) : undefined;
    if (from && next) {
      event.preventDefault();
      from.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    }
  }

  declare registerOnChange: _AccessorHost<WjTreeNode<T>[]>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<WjTreeNode<T>[]>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<WjTreeNode<T>[]>['setDisabledState'];

  writeValue(value: WjTreeNode<T>[] | null): void {
    this.value.set(value ?? []);
  }
}
