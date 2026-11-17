import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  runInInjectionContext,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FilterMatchMode, type FilterMetadata } from '@openng/optimus-ui/api';
import { Optimus } from '@openng/optimus-ui/config';
import { CheckIcon } from '@openng/optimus-ui/icons/check';
import { ChevronDownIcon } from '@openng/optimus-ui/icons/chevrondown';
import { ChevronRightIcon } from '@openng/optimus-ui/icons/chevronright';
import { PencilIcon } from '@openng/optimus-ui/icons/pencil';
import { TimesIcon } from '@openng/optimus-ui/icons/times';
import {
  Table,
  TableModule,
  type ColumnFilter,
  type TableFilterEvent,
  type TableLazyLoadEvent,
} from '@openng/optimus-ui/table';
import { ObjectUtils } from '@openng/optimus-ui/utils';
import type {
  WjFilterMatchMode,
  WjFilterMetadata,
  WjFilters,
  WjLazyLoadEvent,
  WjPageEvent,
  WjPaginatorPosition,
  WjSortOrder,
} from 'weeljack-ng';
import {
  _WJ_EN,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
} from 'weeljack-ng/private';
import { WjColumn } from './column/column';
import {
  WjTableCaptionSlot,
  WjTableEmptySlot,
  WjTableGroupHeaderSlot,
  WjTableLoadingSlot,
  WjTableRowExpansionSlot,
  WjTableSummarySlot,
} from './table-slots';
import type {
  WjTableFilterDisplay,
  WjTablePt,
  WjTableRowEditEvent,
  WjTableRowExpandMode,
  WjTableRowToggleEvent,
  WjTableSelectionMode,
  WjTableSize,
} from './table-types';

/** The rows per page a paging table uses until the app or the user picks another. */
const DEFAULT_ROWS = 10;

/** The match modes Optimus knows: a `matchMode` string outside them is not a `WjFilterMatchMode`. */
const MATCH_MODES: readonly unknown[] = Object.values(FilterMatchMode);

function isMatchMode(value: unknown): value is WjFilterMatchMode {
  return MATCH_MODES.includes(value);
}

/** True for the array Optimus gives in multiple selection mode, as opposed to one row or none. */
function isList<T>(value: T | readonly T[] | null | undefined): value is readonly T[] {
  return Array.isArray(value);
}

/** A rule with no value filters nothing: Optimus keeps one per filterable column, blank. */
function isActive(rule: FilterMetadata): boolean {
  const value: unknown = rule.value;
  return value != null && value !== '' && !(Array.isArray(value) && value.length === 0);
}

function copyRule(rule: FilterMetadata): WjFilterMetadata {
  const copy: WjFilterMetadata = { value: rule.value };
  if (isMatchMode(rule.matchMode)) {
    copy.matchMode = rule.matchMode;
  }
  if (rule.operator === 'and' || rule.operator === 'or') {
    copy.operator = rule.operator;
  }
  return copy;
}

/**
 * A deep copy of the active rules of Optimus's filters, in WeeljackNg's types. Optimus writes into
 * the filter objects it is given, so the app's map never crosses the seam, and a change comes back
 * as a copy (FR-9).
 */
function copyFilters(
  rules: Readonly<Record<string, FilterMetadata | FilterMetadata[] | undefined>> | undefined,
): WjFilters {
  const copy: WjFilters = {};
  for (const [field, rule] of Object.entries(rules ?? {})) {
    if (Array.isArray(rule)) {
      const kept = rule.filter(isActive).map(copyRule);
      if (kept.length > 0) {
        copy[field] = kept;
      }
    } else if (rule !== undefined && isActive(rule)) {
      copy[field] = copyRule(rule);
    }
  }
  return copy;
}

/*
 * Notes on table.html, kept here because a partially compiled template ships as text, in the
 * size budget:
 * - Every `ng-template` is declared inside `p-table`, because an embedded view uses the injector of
 *   its declaration, and the row and column directives (`pSortableColumn`, `p-sortIcon`,
 *   `pFrozenColumn`, `p-tableCheckbox`, `pRowToggler`, `p-columnFilter`) need Optimus's Table there.
 * - A header gets `pSortableColumn` only when it is sortable: the directive cannot be switched off
 *   per column, and leaves `tabindex="0"` on a header that is not sortable.
 * - `#loadingbody` is what Optimus renders while `loading`. With the loading slot it replaces the
 *   rows (they are not given to Optimus meanwhile); without it an empty table keeps its empty row,
 *   blank, under Optimus's mask.
 */

/**
 * A data table over Optimus's `p-table`: give it `value` (the rows) and declare its columns as
 * `wj-column` children; it writes every header, row and cell itself, and sorts and pages them. A
 * `wjTableCell` or `wjTableHeaderCell` template inside a column customises what a cell shows.
 * Selection, row expansion, row editing, grouping, frozen columns, filters, lazy loading and the
 * empty, loading, caption and summary slots build on that. Your arrays and maps are never
 * changed: the table works on copies.
 *
 * The table needs a name, since it has no visible title of its own: set `ariaLabel`, or point
 * `ariaLabelledBy` at a visible heading.
 */
@Component({
  selector: 'wj-table',
  imports: [
    TableModule,
    NgTemplateOutlet,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    PencilIcon,
    TimesIcon,
  ],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class WjTable<T = unknown> {
  /** The rows. The table works on a copy, so this array keeps its order and its reference. */
  readonly value = input<readonly T[]>([]);
  /** The field the rows are sorted by, `undefined` when unsorted. Two-way: `[(sortField)]`. */
  readonly sortField = model<string>();
  /** The sort direction: `1` ascending, `-1` descending. Two-way: `[(sortOrder)]`. */
  readonly sortOrder = model<WjSortOrder>(1);
  /** Shows a pager and splits the rows into pages. */
  readonly paginator = input(false, { transform: booleanAttribute });
  /** Index of the first row of the current page. Two-way: `[(first)]`. */
  readonly first = model(0);
  /** Rows per page; 10 while the table pages and none is given. Two-way: `[(rows)]`. */
  readonly rows = model<number>();
  /** Number of rows in all pages. Defaults to the length of `value`. */
  readonly totalRecords = input(0, { transform: numberAttribute });
  /** The page sizes the pager offers, as a select. */
  readonly rowsPerPageOptions = input<number[]>();
  /** Where the pager sits: above, below or both. */
  readonly paginatorPosition = input<WjPaginatorPosition>('bottom');
  /** Row density. */
  readonly size = input<WjTableSize>();
  /** Draws a border between every cell. */
  readonly showGridlines = input(false, { transform: booleanAttribute });
  /** Gives every other row a different fill. */
  readonly stripedRows = input(false, { transform: booleanAttribute });
  /** Highlights the row under the pointer. */
  readonly rowHover = input(false, { transform: booleanAttribute });
  /** Lets the user select one row, or many with a checkbox column. */
  readonly selectionMode = input<WjTableSelectionMode>();
  /** The selected rows: always an array, which holds at most one row in single mode. Two-way. */
  readonly selection = model<T[]>([]);
  /** The row field that identifies a row. Row expansion and row editing need it. */
  readonly dataKey = input<string>();
  /** The expanded rows, by `dataKey` value. Two-way: `[(expandedRowKeys)]`. */
  readonly expandedRowKeys = model<Record<string, boolean>>({});
  /** Whether several rows may be expanded at once. */
  readonly rowExpandMode = input<WjTableRowExpandMode>('multiple');
  /** The rows in edit mode, by `dataKey` value. Two-way: `[(editingRowKeys)]`. */
  readonly editingRowKeys = model<Record<string, boolean>>({});
  /** Groups the rows by this field, under a header row. Sorts by it unless `lazy`. */
  readonly groupRowsBy = input<string>();
  /** Scrolls the table inside its host; a frozen column turns it on. */
  readonly scrollable = input(false, { transform: booleanAttribute });
  /** The height at which a scrollable table starts to scroll, as a CSS length. */
  readonly scrollHeight = input<string>();
  /** Where the column filters sit. */
  readonly filterDisplay = input<WjTableFilterDisplay>('row');
  /** The active filters, by column field (`global` for the global filter). Two-way. */
  readonly filters = model<WjFilters>({});
  /** The row fields the global filter, `filterGlobal()`, searches. */
  readonly globalFilterFields = input<string[]>();
  /** The table does not sort, filter or page `value` itself: the app loads each page. */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Shows that rows are loading: `aria-busy` on the table, and a mask or the loading slot. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible name when the table has no visible title. Set on the `table` element. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the table. Set on the `table` element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the table. Set on the `table` element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the table's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTablePt>();
  /** Emits when the user moves to another page or picks another page size. */
  readonly pageChange = output<WjPageEvent>();
  /** Emits when a row is expanded. */
  readonly rowExpand = output<WjTableRowToggleEvent<T>>();
  /** Emits when a row is collapsed. */
  readonly rowCollapse = output<WjTableRowToggleEvent<T>>();
  /** Emits when a row enters edit mode. */
  readonly rowEditInit = output<WjTableRowEditEvent<T>>();
  /** Emits when a row's edit is saved. */
  readonly rowEditSave = output<WjTableRowEditEvent<T>>();
  /** Emits when a row's edit is cancelled: restore your own copy of the row here. */
  readonly rowEditCancel = output<WjTableRowEditEvent<T>>();
  /** Emits when a `lazy` table needs rows: on init, and on every page, sort and filter. */
  readonly lazyLoad = output<WjLazyLoadEvent>();

  /** The columns, in the order declared. */
  protected readonly columns = contentChildren(WjColumn);
  protected readonly expansion = contentChild(WjTableRowExpansionSlot);
  protected readonly groupSlot = contentChild(WjTableGroupHeaderSlot);
  protected readonly emptySlot = contentChild(WjTableEmptySlot);
  protected readonly loadingSlot = contentChild(WjTableLoadingSlot);
  protected readonly captionSlot = contentChild(WjTableCaptionSlot);
  protected readonly summarySlot = contentChild(WjTableSummarySlot);

  private readonly optimus = inject(Optimus);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly table = viewChild(Table);
  /** Bumped by `clear()`: it hands Optimus a fresh copy, which restores the app's row order. */
  private readonly epoch = signal(0);
  /** The last lazy request told to the app, and how many echoes of it are still to be dropped. */
  private lastLazy = '';
  private echoes = 0;
  /** The `filters` the table last wrote itself: when the model holds it, the app changed nothing. */
  private written: WjFilters | undefined;

  protected readonly multiple = computed(() => this.selectionMode() === 'multiple');
  protected readonly editable = computed(() => this.columns().some((column) => column.editor()));
  protected readonly frozenLeft = computed(() =>
    this.columns().some((column) => column.frozen() && column.alignFrozen() !== 'right'),
  );
  protected readonly frozenRight = computed(() =>
    this.columns().some((column) => column.frozen() && column.alignFrozen() === 'right'),
  );
  protected readonly scrolls = computed(
    () => this.scrollable() || this.frozenLeft() || this.frozenRight(),
  );
  protected readonly filterRow = computed(
    () => this.filterDisplay() === 'row' && this.columns().some((column) => column.filterType()),
  );
  /** Cells in a row, utility columns included: what a full-width cell spans. */
  protected readonly colspan = computed(
    () =>
      this.columns().length +
      Number(this.multiple()) +
      Number(this.expansion() !== undefined) +
      Number(this.editable()),
  );

  /** Optimus sorts the array it is given in place, so it gets a copy (FR-9). */
  private readonly data = computed(() => {
    this.epoch();
    return [...this.value()];
  });
  /** With a loading slot the rows give way to it while `loading`. */
  protected readonly rowsToShow = computed(() =>
    this.loading() && this.loadingSlot() ? [] : this.data(),
  );

  protected readonly pageRows = computed(
    () => this.rows() ?? (this.paginator() ? DEFAULT_ROWS : undefined),
  );

  /** What Optimus gets as `selection`: one row, an array, or nothing. Optimus mutates neither. */
  protected readonly selected = computed(() => {
    const rows = this.selection();
    if (this.selectionMode() === 'single') {
      return rows[0] ?? null;
    }
    // Optimus makes no row a tab stop once `selection` is set, even to an empty array.
    return rows.length > 0 ? [...rows] : null;
  });
  protected readonly expanded = computed(() => ({ ...this.expandedRowKeys() }));
  protected readonly editing = computed(() => ({ ...this.editingRowKeys() }));
  /**
   * What Optimus starts with as `filters`. It keeps and edits its own object from then on (a blank
   * rule per filterable column lives in it), so a later change of the model is applied in place.
   */
  protected readonly initialFilters = computed(() => copyFilters(untracked(this.filters)));

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the table. */
  protected readonly partAttributes = computed<WjTablePt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'table', {
        'aria-label': this.ariaLabel(),
        'aria-labelledby': this.ariaLabelledBy(),
        'aria-describedby': this.ariaDescribedBy(),
        'aria-busy': this.loading() ? 'true' : undefined,
      }),
      // A scrolling container only a pointer can scroll fails WCAG 2.1.1: make it a tab stop.
      'tableContainer',
      {
        role: this.scrolls() ? 'region' : undefined,
        tabindex: this.scrolls() ? '0' : undefined,
        'aria-label': this.scrolls() ? this.ariaLabel() : undefined,
        'aria-labelledby': this.scrolls() ? this.ariaLabelledBy() : undefined,
      },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-table');
    _checkAriaOnHost('wj-table');
    effect(() => {
      const incoming = this.filters();
      untracked(() => {
        this.applyFilters(incoming);
      });
    });
    if (ngDevMode) {
      effect(() => {
        if (this.dataKey() === undefined && (this.expansion() !== undefined || this.editable())) {
          runInInjectionContext(this.injector, () => {
            _warnOnce(
              'WJ0050',
              'wj-table',
              'a row expansion or cell editor slot is present but dataKey is not set, so every row shares one key and expanding or editing one row does it for all of them',
              'Set the dataKey input to a field that is unique per row, for example dataKey="id"',
            );
          });
        }
      });
    }
  }

  /** Filters every row by `value` across `globalFilterFields`, after Optimus's filter delay. */
  filterGlobal(value: string, matchMode: WjFilterMatchMode = 'contains'): void {
    this.table()?.filterGlobal(value, matchMode);
  }

  /** Resets the sort, the filters and the page, and shows the rows in the order of `value`. */
  clear(): void {
    this.table()?.clear();
    this.epoch.update((count) => count + 1);
    this.sortField.set(undefined);
    this.sortOrder.set(1);
    this.written = {};
    this.filters.set(this.written);
  }

  /** The app set `filters`: blank every rule Optimus holds, put the app's rules in, and filter. */
  private applyFilters(incoming: WjFilters): void {
    const table = this.table();
    if (this.written === undefined || table === undefined) {
      // The first run only notes the value Optimus starts with.
      this.written ??= incoming;
      return;
    }
    if (incoming === this.written) {
      return;
    }
    this.written = incoming;
    const next: Record<string, FilterMetadata | FilterMetadata[]> = {};
    for (const [field, rule] of Object.entries(table.filters)) {
      next[field] = Array.isArray(rule)
        ? rule.map((one) => ({ ...one, value: null }))
        : { ...rule, value: null };
    }
    table.filters = Object.assign(next, copyFilters(incoming));
    table._filter();
  }

  /** The value of `field` on `row`, resolved the way Optimus's sort resolves it. */
  protected cellValue(row: unknown, field: string | undefined): unknown {
    if (field === undefined) {
      return undefined;
    }
    const value: unknown = ObjectUtils.resolveFieldData(row, field);
    return value;
  }

  /** A label the wrapper writes: Optimus's translation, which `provideWeeljack` fills. */
  protected label(key: keyof typeof _WJ_EN.aria): string {
    const label: unknown = Reflect.get(Object(this.optimus.getTranslation('aria')), key);
    return typeof label === 'string' ? label : _WJ_EN.aria[key];
  }

  /**
   * Optimus names its checkboxes only after the first selection change, so each is named from the
   * start, with its rule: the translation's "selected" wording while checked, else "unselected".
   */
  protected rowLabel(row: T): string {
    return this.label(this.table()?.isSelected(row) ? 'selectRow' : 'unselectRow');
  }

  protected allLabel(): string {
    const all = this.table()?.processedData.length ?? 0;
    return this.label(all > 0 && this.selection().length === all ? 'selectAll' : 'unselectAll');
  }

  protected emptyText(): string {
    const text: unknown = this.optimus.getTranslation('emptyMessage');
    return typeof text === 'string' ? text : _WJ_EN.emptyMessage;
  }

  /** Reads the sort Optimus now has: its event differs between a single and a grouped sort. */
  protected sorted(): void {
    const table = this.table();
    if (table === undefined) {
      return;
    }
    const field = table.sortField ?? undefined;
    const order = table.sortOrder === -1 ? -1 : 1;
    // Writing the models back makes Optimus sort again, which in lazy mode would ask the app for
    // the same page again: count those echoes so `lazyLoaded` can drop them.
    const changes = Number(field !== this.sortField()) + Number(order !== this.sortOrder());
    if (this.lazy() && changes > 0) {
      this.echoes = changes;
    }
    this.sortField.set(field);
    this.sortOrder.set(order);
  }

  protected paged(event: WjPageEvent): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.pageChange.emit({ first: event.first, rows: event.rows });
  }

  /**
   * Optimus's Escape and Apply close the menu and aim focus at a `p-button` element, which cannot
   * take it, so focus falls to the page: once the menu is gone, give it back to the filter button.
   */
  protected filterClosed(filter: ColumnFilter): void {
    afterNextRender(
      () => {
        const host: unknown = filter.icon?.nativeElement;
        if (this.document.activeElement === this.document.body && host instanceof Element) {
          host.querySelector('button')?.focus();
        }
      },
      { injector: this.injector },
    );
  }

  protected filtered(event: TableFilterEvent): void {
    this.written = copyFilters(event.filters);
    this.filters.set(this.written);
  }

  protected lazyLoaded(event: TableLazyLoadEvent): void {
    const request: WjLazyLoadEvent = {
      first: event.first ?? 0,
      rows: event.rows ?? undefined,
      sortField: typeof event.sortField === 'string' ? event.sortField : undefined,
      sortOrder: event.sortOrder === -1 ? -1 : 1,
      filters: copyFilters(event.filters),
      globalFilter: typeof event.globalFilter === 'string' ? event.globalFilter : undefined,
    };
    const key = JSON.stringify(request);
    if (this.echoes > 0 && key === this.lastLazy) {
      this.echoes--;
      return;
    }
    this.echoes = 0;
    this.lastLazy = key;
    this.lazyLoad.emit(request);
  }

  protected selectionChanged(value: T | readonly T[] | null | undefined): void {
    if (isList(value)) {
      this.selection.set([...value]);
    } else {
      this.selection.set(value == null ? [] : [value]);
    }
  }

  protected toggled(row: T | undefined, open: boolean): void {
    this.expandedRowKeys.set({ ...this.table()?.expandedRowKeys });
    if (row !== undefined) {
      (open ? this.rowExpand : this.rowCollapse).emit({ row });
    }
  }

  /**
   * Edit, Save and Cancel. The wrapper owns the editing state: Optimus's row-edit directives need
   * the row element as an ancestor, which a template declared inside `p-table` is not, and they
   * emit nothing. Save is refused, as Optimus refuses it, while an editor of the row is invalid.
   */
  protected edited(kind: 'init' | 'save' | 'cancel', row: T, index: number, event: Event): void {
    const tr = event.target instanceof Element ? event.target.closest('tr') : null;
    if (kind === 'save' && tr?.querySelector('.ng-invalid.ng-dirty')) {
      return;
    }
    const key = String(ObjectUtils.resolveFieldData(row, this.dataKey()));
    this.editingRowKeys.update((keys) =>
      kind === 'init'
        ? { ...keys, [key]: true }
        : Object.fromEntries(Object.entries(keys).filter(([name]) => name !== key)),
    );
    const output =
      kind === 'init' ? this.rowEditInit : kind === 'save' ? this.rowEditSave : this.rowEditCancel;
    output.emit({ row, index });
    afterNextRender(
      () => {
        // Edit hands focus to the first editor (else Save); Save and Cancel hand it back to Edit.
        const target =
          kind === 'init'
            ? tr?.querySelector(
                'td[data-wj-editor] :is(input, select, textarea, button), .p-datatable-row-editor-save',
              )
            : tr?.querySelector('.p-datatable-row-editor-init');
        if (target instanceof HTMLElement) {
          target.focus();
        }
      },
      { injector: this.injector },
    );
  }
}
