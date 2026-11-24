import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  provideWeeljack,
  type WjPageEvent,
  type WjSortOrder,
  type WjTreeNode,
  type WjTreeSelectionMode,
} from 'weeljack-ng';
import {
  WjTreeTable,
  WjTreeTableCaptionSlot,
  WjTreeTableCellSlot,
  WjTreeTableColumn,
  WjTreeTableEmptySlot,
  WjTreeTableHeaderCellSlot,
  WjTreeTableSummarySlot,
  type WjTreeTablePt,
} from 'weeljack-ng/treetable';
import { WjTreeTableHarness, WjTreeTableRowHarness } from 'weeljack-ng/treetable/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface FileData {
  name: string;
  size: number;
  type: string;
  owner?: { name: string };
}

type Node = WjTreeNode<FileData>;

/** Freezes the value and everything reachable from it: an app's immutable state, or a probe. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function file(key: string, name: string, size: number, type: string, extra?: Partial<Node>): Node {
  return { key, label: name, data: { name, size, type }, ...extra };
}

/** A file tree: nested keys, an unselectable folder and a leaf with a dotted-path owner. */
function makeNodes(): Node[] {
  return [
    file('documents', 'Documents', 120, 'Folder', {
      children: [
        file('documents/reports', 'Reports', 80, 'Folder', {
          children: [
            {
              ...file('documents/reports/q1', 'Q1 report', 30, 'PDF'),
              data: { name: 'Q1 report', size: 30, type: 'PDF', owner: { name: 'Ana' } },
            },
            file('documents/reports/q2', 'Q2 report', 50, 'PDF'),
          ],
        }),
        file('documents/invoices', 'Invoices', 40, 'Folder'),
      ],
    }),
    file('pictures', 'Pictures', 900, 'Folder', {
      children: [file('pictures/holidays', 'Holidays', 900, 'Folder')],
    }),
    file('music', 'Music', 15, 'Folder'),
    file('archive', 'Archive', 5, 'Folder', {
      selectable: false,
      children: [file('archive/old', 'Old files', 5, 'Folder')],
    }),
  ];
}

/** `count` root folders, two files each: the paging fixture. */
function manyFolders(count: number): Node[] {
  return Array.from({ length: count }, (_, index) => {
    const name = `Folder ${String(index + 1)}`;
    return file(`f${String(index + 1)}`, name, index + 1, 'Folder', {
      children: [
        file(`f${String(index + 1)}/a`, `${name} A`, 1, 'Text'),
        file(`f${String(index + 1)}/b`, `${name} B`, 2, 'Text'),
      ],
    });
  });
}

/** The item at `index`, or a throw: keeps the specs free of `!` and casts. */
function at<T>(list: readonly T[], index: number): T {
  const found = list[index];
  if (found === undefined) {
    throw new Error(`nothing at ${String(index)}`);
  }
  return found;
}

/** A consumer's template: a tree table between two buttons, with every slot a consumer can give. */
@Component({
  selector: 'wj-treetable-host',
  imports: [
    WjTreeTable,
    WjTreeTableColumn,
    WjTreeTableCellSlot,
    WjTreeTableHeaderCellSlot,
    WjTreeTableEmptySlot,
    WjTreeTableCaptionSlot,
    WjTreeTableSummarySlot,
  ],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Files</p>
    <div class="frame">
      <wj-treetable
        [value]="nodes()"
        [selectionMode]="mode()"
        [selection]="selection()"
        (selectionChange)="onSelection($event)"
        [expandedKeys]="expanded()"
        (expandedKeysChange)="onExpanded($event)"
        [sortField]="sortField()"
        (sortFieldChange)="sortField.set($event)"
        [sortOrder]="sortOrder()"
        (sortOrderChange)="sortOrder.set($event)"
        [paginator]="paginator()"
        [first]="first()"
        (firstChange)="first.set($event)"
        [rows]="rows()"
        (rowsChange)="rows.set($event)"
        [totalRecords]="totalRecords()"
        [rowsPerPageOptions]="rowsPerPageOptions()"
        [paginatorPosition]="paginatorPosition()"
        [showGridlines]="showGridlines()"
        [rowHover]="rowHover()"
        [loading]="loading()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (pageChange)="pages.push($event)"
        (nodeExpand)="expands.push($event)"
        (nodeCollapse)="collapses.push($event)"
      >
        <wj-treetable-column field="name" header="Name" [sortable]="sortable()" />
        <wj-treetable-column field="size" header="Size" [sortable]="sortable()">
          @if (withCellSlot()) {
            <ng-template wjTreeTableCell [wjTreeTableCellOf]="nodes()" let-node let-value="value">
              <span class="size" [attr.data-key]="node.key">{{ seen(node) }}{{ value }} KB</span>
            </ng-template>
          }
          @if (withHeaderSlot()) {
            <ng-template wjTreeTableHeaderCell let-header let-field="field">
              <span class="head" [attr.data-field]="field">{{ header }} <small>KB</small></span>
            </ng-template>
          }
        </wj-treetable-column>
        <wj-treetable-column field="type" header="Type" />
        @if (withOwner()) {
          <wj-treetable-column field="owner.name" header="Owner" />
        }
        @if (withEmptySlot()) {
          <ng-template wjTreeTableEmpty><em class="empty-slot">No files yet.</em></ng-template>
        }
        @if (withCaption()) {
          <ng-template wjTreeTableCaption>
            <span id="caption-title">Project files</span>
          </ng-template>
        }
        @if (withSummary()) {
          <ng-template wjTreeTableSummary>
            <span class="summary-text">Total: 4 folders</span>
          </ng-template>
        }
      </wj-treetable>
    </div>
    <p id="description">Folders and files</p>
    <button type="button" id="after">After</button>
  `,
  styles: `
    .frame {
      inline-size: 40rem;
      max-inline-size: 100%;
    }
  `,
})
class Host {
  readonly nodes = signal<Node[]>(makeNodes());
  readonly mode = signal<WjTreeSelectionMode | undefined>(undefined);
  readonly selection = signal<Node[]>([]);
  readonly expanded = signal<Record<string, boolean>>({});
  readonly sortField = signal<string | undefined>(undefined);
  readonly sortOrder = signal<WjSortOrder>(1);
  readonly sortable = signal(false);
  readonly paginator = signal(false);
  readonly first = signal(0);
  readonly rows = signal<number | undefined>(undefined);
  readonly totalRecords = signal(0);
  readonly rowsPerPageOptions = signal<number[] | undefined>(undefined);
  readonly paginatorPosition = signal<'top' | 'bottom' | 'both'>('bottom');
  readonly showGridlines = signal(false);
  readonly rowHover = signal(false);
  readonly loading = signal(false);
  readonly ariaLabel = signal<string | undefined>('Files');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTreeTablePt | undefined>(undefined);
  readonly withCellSlot = signal(false);
  readonly withHeaderSlot = signal(false);
  readonly withEmptySlot = signal(false);
  readonly withCaption = signal(false);
  readonly withSummary = signal(false);
  readonly withOwner = signal(false);

  /** Every `selectionChange` the table reported, in order. */
  readonly selections: Node[][] = [];
  /** Every `expandedKeysChange` the table reported, in order. */
  readonly expansions: Record<string, boolean>[] = [];
  readonly pages: WjPageEvent[] = [];
  readonly expands: Node[] = [];
  readonly collapses: Node[] = [];
  /** The nodes the cell slot was given. */
  readonly slotNodes = new Set<Node>();

  onSelection(nodes: Node[]): void {
    this.selections.push(nodes);
    this.selection.set(nodes);
  }

  onExpanded(keys: Record<string, boolean>): void {
    this.expansions.push(keys);
    this.expanded.set(keys);
  }

  seen(node: Node): string {
    this.slotNodes.add(node);
    return '';
  }
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-treetable-aria-host',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable [value]="[]" aria-label="Files"
      ><wj-treetable-column field="name"
    /></wj-treetable>
  `,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only, and gives the setup nothing else. */
@Component({
  selector: 'wj-treetable-routed-host',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable [value]="nodes" ariaLabel="Files">
      <wj-treetable-column field="name" header="Name" />
    </wj-treetable>
  `,
})
class RoutedHost {
  readonly nodes = makeNodes();
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  table: WjTreeTableHarness;
  /** The `wj-treetable` element. */
  element: HTMLElement;
  /** The fixture's root, for the buttons around the table. */
  page: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const page = fixture.nativeElement as HTMLElement;
  const element = part(page, 'wj-treetable');
  const table = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTreeTableHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, 'th')).fontWeight).toBe('600');
  // The pointer is page-wide: park it on a neutral element before any hoverable colour is read.
  await userEvent.hover(part(page, '#name'));
  return { fixture, host: fixture.componentInstance, table, element, page };
}

/** The first element matching `selector` inside `element`. */
function part(element: ParentNode, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function parts(element: ParentNode, selector: string): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>(selector));
}

const ROWS = 'tbody tr[data-wj-row]';

/** A row's first cell's own text. */
function labelOf(rowElement: Element): string {
  return rowElement.querySelector('td')?.textContent.trim() ?? '';
}

/** The `tr` whose first cell reads `label`. */
function row(element: ParentNode, label: string): HTMLElement {
  const found = parts(element, ROWS).find((candidate) => labelOf(candidate) === label);
  if (found === undefined) {
    throw new Error(`no row with the text ${label}`);
  }
  return found;
}

/** The first cell of each row on screen, in order, from the DOM. */
function labels(element: ParentNode): string[] {
  return parts(element, ROWS).map(labelOf);
}

/** The row harness for the row whose first cell reads `text`. */
async function rowOf(
  table: WjTreeTableHarness,
  text: string | RegExp,
): Promise<WjTreeTableRowHarness> {
  const [found] = await table.getRows({ text });
  if (found === undefined) {
    throw new Error(`no row with the text ${String(text)}`);
  }
  return found;
}

/** A colour as the browser resolves it, for any CSS colour expression and property. */
function resolved(
  page: HTMLElement,
  property: 'color' | 'background-color',
  expression: string,
): string {
  const probe = document.createElement('span');
  probe.style.setProperty(property, expression);
  page.append(probe);
  const value = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return value;
}

/** Opens `Documents` and `Reports`, then `Pictures`, by key. */
function expandAll(host: Host): void {
  host.expanded.set({ documents: true, 'documents/reports': true, pictures: true });
}

/** Optimus marks the overlay motion with classes on `p-motion`: wait until the enter is over. */
async function overlayOpen(): Promise<void> {
  const motion = (): string | undefined => document.querySelector('p-motion')?.className;
  await expect.poll(motion).toContain('-enter-');
  await expect.poll(motion).toBe('p-motion');
}

/** The rows-per-page select's combobox. */
const rowsSelect = (element: HTMLElement): HTMLElement =>
  part(element, '.p-paginator-rpp-dropdown [role="combobox"]');

/** Closes the rows-per-page select if it is open, and waits for its leave to end. */
async function closeRowsSelect(element: HTMLElement): Promise<void> {
  const combobox = element.querySelector<HTMLElement>(
    '.p-paginator-rpp-dropdown [role="combobox"]',
  );
  if (combobox === null) {
    return;
  }
  if (combobox.getAttribute('aria-expanded') === 'true') {
    combobox.focus();
    await userEvent.keyboard('{Escape}');
  }
  await expect.poll(() => combobox.getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull();
}

/** The documented states, each rendered and checked in both schemes. */
interface State {
  name: string;
  setup: (host: Host) => void;
  act?: (rendered: Rendered) => Promise<void>;
}

const STATES: State[] = [
  { name: 'collapsed', setup: () => undefined },
  {
    name: 'one branch expanded',
    setup: (host) => {
      host.expanded.set({ documents: true });
    },
  },
  {
    name: 'custom cells and header',
    setup: (host) => {
      host.withCellSlot.set(true);
      host.withHeaderSlot.set(true);
      expandAll(host);
    },
  },
  {
    name: 'sorted ascending',
    setup: (host) => {
      host.sortable.set(true);
      host.sortField.set('name');
      expandAll(host);
    },
  },
  {
    name: 'sorted descending',
    setup: (host) => {
      host.sortable.set(true);
      host.sortField.set('size');
      host.sortOrder.set(-1);
      expandAll(host);
    },
  },
  {
    name: 'paginated',
    setup: (host) => {
      host.nodes.set(manyFolders(23));
      host.paginator.set(true);
      host.rows.set(5);
      host.rowsPerPageOptions.set([5, 10, 20]);
      host.sortable.set(true);
    },
  },
  {
    name: 'single selection, a row selected',
    setup: (host) => {
      host.mode.set('single');
      expandAll(host);
      host.selection.set([at(host.nodes(), 1)]);
    },
  },
  {
    name: 'multiple selection, two rows selected',
    setup: (host) => {
      host.mode.set('multiple');
      expandAll(host);
      host.selection.set([at(host.nodes(), 1), at(host.nodes(), 2)]);
    },
  },
  {
    name: 'checkbox mode, a parent checked and one partly checked',
    setup: (host) => {
      host.mode.set('checkbox');
      expandAll(host);
    },
    act: async ({ table }) => {
      await (await rowOf(table, 'Q1 report')).select();
      await (await rowOf(table, 'Pictures')).select();
    },
  },
  {
    name: 'checkbox mode with a row that is not selectable',
    setup: (host) => {
      host.mode.set('checkbox');
      host.expanded.set({ archive: true });
    },
  },
  {
    name: 'grid lines',
    setup: (host) => {
      host.showGridlines.set(true);
      host.expanded.set({ documents: true });
    },
  },
  {
    name: 'empty, with the default text',
    setup: (host) => {
      host.nodes.set([]);
    },
  },
  {
    name: 'empty, with the slot',
    setup: (host) => {
      host.nodes.set([]);
      host.withEmptySlot.set(true);
    },
  },
  {
    name: 'loading, with rows',
    setup: (host) => {
      host.loading.set(true);
      host.expanded.set({ documents: true });
    },
  },
  {
    name: 'loading, with no rows',
    setup: (host) => {
      host.nodes.set([]);
      host.loading.set(true);
    },
  },
  {
    name: 'caption and summary',
    setup: (host) => {
      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('caption-title');
      host.withCaption.set(true);
      host.withSummary.set(true);
      host.expanded.set({ documents: true });
    },
  },
];

describe('WjTreeTable', () => {
  let warn: MockInstance<typeof console.warn>;
  let error: MockInstance<typeof console.error>;
  let closeAtTeardown: (() => Promise<void>) | undefined;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    closeAtTeardown = undefined;
  });

  afterEach(async () => {
    await closeAtTeardown?.();
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  /** Registers the rows-per-page select to be closed before teardown. */
  function watchRowsSelect(element: HTMLElement): void {
    closeAtTeardown = () => closeRowsSelect(element);
  }

  describe('columns and cells', () => {
    it('writes a header per column and a row per visible node, showing the field as text', async () => {
      const { element, table } = await render();

      expect(await table.getHeaderTexts()).toEqual(['Name', 'Size', 'Type']);
      expect(await table.getCellTexts()).toEqual([
        ['Documents', '120', 'Folder'],
        ['Pictures', '900', 'Folder'],
        ['Music', '15', 'Folder'],
        ['Archive', '5', 'Folder'],
      ]);
      expect(getComputedStyle(element).display).toBe('block');
    });

    it('follows a column added and removed with @if, and resolves a dotted path', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        expandAll(initial);
      });

      host.withOwner.set(true);
      await fixture.whenStable();
      expect(await table.getHeaderTexts()).toEqual(['Name', 'Size', 'Type', 'Owner']);
      expect((await rowOf(table, 'Q1 report').then((found) => found.getCellTexts())).at(3)).toBe(
        'Ana',
      );
      // A missing value is an empty cell, not the text "undefined".
      expect((await (await rowOf(table, 'Q2 report')).getCellTexts()).at(3)).toBe('');

      host.withOwner.set(false);
      await fixture.whenStable();
      expect(await table.getHeaderTexts()).toEqual(['Name', 'Size', 'Type']);
    });

    it('puts the toggle first in the first cell, indented by level, and none on a leaf’s level', async () => {
      const { element, table } = await render('light', (host) => {
        expandAll(host);
      });

      const levels = await Promise.all((await table.getRows()).map((found) => found.getLevel()));
      expect(levels).toEqual([1, 2, 3, 3, 2, 1, 2, 1, 1]);
      const toggle = (label: string): HTMLElement =>
        part(row(element, label), '[data-pc-section="rowtogglebutton"]');
      expect(toggle('Documents').style.marginInlineStart).toBe('0px');
      expect(toggle('Reports').style.marginInlineStart).toBe('16px');
      expect(toggle('Q1 report').style.marginInlineStart).toBe('32px');
      expect(toggle('Q1 report').style.visibility).toBe('hidden');
      expect(toggle('Reports').style.visibility).toBe('visible');
      expect(row(element, 'Documents').querySelector('td')?.firstElementChild?.className).toContain(
        'p-treetable-body-cell-content',
      );
    });

    it('hides the column hosts and projects them last, so they reach the prerendered HTML', async () => {
      const { element } = await render();
      const columns = parts(element, 'wj-treetable-column');

      expect(columns).toHaveLength(3);
      for (const column of columns) {
        expect(getComputedStyle(column).display).toBe('none');
        expect(column.parentElement).toBe(element);
        expect(column.textContent).toBe('');
      }
      expect(element.lastElementChild?.tagName).toBe('WJ-TREETABLE-COLUMN');
    });

    it('keeps a cell’s text on screen: it wraps instead of being cut', async () => {
      const long =
        'A very long folder name that has to wrap inside its cell rather than be cut off';
      const { element } = await render('light', (host) => {
        host.nodes.set([file('long', long, 1, 'Folder')]);
      });
      const cell = part(row(element, long), 'td');

      expect(getComputedStyle(cell).textOverflow).not.toBe('ellipsis');
      expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
      expect(cell.getBoundingClientRect().height).toBeGreaterThan(52);
    });
  });

  describe('expandedKeys', () => {
    it('opens the nodes it names, and an entry wins over the node’s own expanded', async () => {
      const nodes = makeNodes();
      at(nodes, 1).expanded = true;
      const { table } = await render('light', (host) => {
        host.nodes.set(nodes);
        host.expanded.set({ documents: true, pictures: false });
      });

      expect(labels(part(document, 'wj-treetable'))).toEqual([
        'Documents',
        'Reports',
        'Invoices',
        'Pictures',
        'Music',
        'Archive',
      ]);
      expect(await (await rowOf(table, 'Pictures')).isExpanded()).toBe(false);
    });

    it('follows a new map from the app, in both directions', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.expanded.set({ documents: true });
      });
      expect(labels(element)).toContain('Reports');

      host.expanded.set({ pictures: true });
      await fixture.whenStable();

      expect(labels(element)).toEqual(['Documents', 'Pictures', 'Holidays', 'Music', 'Archive']);
    });

    it('answers a toggle with a new map, keyed by the node, and keeps the other entries', async () => {
      const { host, table } = await render('light', (initial) => {
        initial.expanded.set({ documents: true });
      });
      const before = host.expanded();

      await (await rowOf(table, 'Pictures')).toggle();
      await (await rowOf(table, 'Documents')).toggle();

      expect(host.expansions).toEqual([
        { documents: true, pictures: true },
        { documents: false, pictures: true },
      ]);
      expect(host.expanded()).not.toBe(before);
      expect(before).toEqual({ documents: true });
    });

    it('fires nodeExpand and nodeCollapse with the app’s own node, for every toggle', async () => {
      const nodes = makeNodes();
      const { host, table } = await render('light', (initial) => {
        initial.nodes.set(nodes);
      });

      await (await rowOf(table, 'Documents')).toggle();
      await (await rowOf(table, 'Documents')).toggle();

      expect(host.expands).toEqual([at(nodes, 0)]);
      expect(host.collapses).toEqual([at(nodes, 0)]);
      expect(host.expands[0]).toBe(at(nodes, 0));
      expect(host.collapses[0]).toBe(at(nodes, 0));
    });

    it('toggles a node with no key on screen, fires the outputs and writes no entry', async () => {
      const keyless: Node = {
        label: 'Loose',
        data: { name: 'Loose', size: 1, type: 'Folder' },
        children: [{ key: 'loose/child', data: { name: 'Child', size: 1, type: 'Text' } }],
      };
      const { element, host, table } = await render('light', (initial) => {
        initial.nodes.set([keyless]);
      });

      await (await rowOf(table, 'Loose')).toggle();

      expect(labels(element)).toEqual(['Loose', 'Child']);
      expect(host.expands).toEqual([keyless]);
      expect(host.expansions).toEqual([]);
    });

    it('keeps a node open through a new value, because its key is in the map', async () => {
      const { element, fixture, host, table } = await render();
      await (await rowOf(table, 'Documents')).toggle();

      host.nodes.set(makeNodes());
      await fixture.whenStable();

      expect(labels(element)).toContain('Reports');
      expect(await (await rowOf(table, 'Documents')).isExpanded()).toBe(true);
    });

    it('says a closed row can open: aria-expanded="false" on a parent whose node never set expanded, and none on a leaf', async () => {
      const { element, table } = await render('light', (host) => {
        host.expanded.set({ documents: true });
      });

      expect(row(element, 'Documents').getAttribute('aria-expanded')).toBe('true');
      expect(row(element, 'Pictures').getAttribute('aria-expanded')).toBe('false');
      expect(row(element, 'Music').hasAttribute('aria-expanded')).toBe(false);
      expect(await (await rowOf(table, 'Pictures')).isExpanded()).toBe(false);
    });
  });

  describe('slots', () => {
    it('renders the cell template for every cell of its column, with the app’s own node', async () => {
      const nodes = deepFreeze(makeNodes());
      const { element, host, table } = await render('light', (initial) => {
        initial.nodes.set(nodes);
        initial.withCellSlot.set(true);
        expandAll(initial);
      });

      expect(await table.getCellTexts()).toContainEqual(['Q1 report', '30 KB', 'PDF']);
      expect(parts(element, '.size')).toHaveLength(9);
      const everyNode = new Set<Node>();
      const walk = (list: Node[]): void => {
        for (const entry of list) {
          everyNode.add(entry);
          walk(entry.children ?? []);
        }
      };
      walk(nodes);
      expect(host.slotNodes.size).toBe(9);
      for (const given of host.slotNodes) {
        expect(everyNode.has(given)).toBe(true);
      }
      expect(part(element, '.size').dataset['key']).toBe('documents');
    });

    it('renders the cell template inside the td, after the toggle when it is the first column', async () => {
      const { element } = await render('light', (host) => {
        host.withCellSlot.set(true);
      });
      const cells = parts(row(element, 'Documents'), 'td');

      expect(cells[1]?.querySelector('.size')?.textContent).toBe('120 KB');
      expect(cells[1]?.firstElementChild?.className).toBe('size');
      expect(cells[0]?.querySelector('.p-treetable-body-cell-content')).not.toBeNull();
    });

    it('renders the header template inside the title box with the field, and keeps the sort icon outside', async () => {
      const { element, table } = await render('light', (host) => {
        host.withHeaderSlot.set(true);
        host.sortable.set(true);
      });
      const title = part(element, 'th:nth-child(2) .p-treetable-column-title');

      expect(await table.getHeaderTexts()).toEqual(['Name', 'Size KB', 'Type']);
      expect(part(title, '.head').dataset['field']).toBe('size');
      expect(title.querySelector('svg')).toBeNull();
      expect(part(element, 'th:nth-child(2)').querySelector('p-treetablesorticon')).not.toBeNull();
    });

    it('follows a changed node without a new slot', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.withCellSlot.set(true);
      });

      host.nodes.set([file('documents', 'Documents', 777, 'Folder')]);
      await fixture.whenStable();

      expect(await table.getCellTexts()).toEqual([['Documents', '777 KB', 'Folder']]);
    });

    it('shows the translation’s message when there are no rows, and the slot instead when given', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.nodes.set([]);
      });

      expect(await table.isEmpty()).toBe(true);
      expect(await table.getEmptyText()).toBe('No available options');
      expect(part(element, '.wj-treetable-empty td').getAttribute('colspan')).toBe('3');

      host.withEmptySlot.set(true);
      await fixture.whenStable();
      expect(await table.getEmptyText()).toBe('No files yet.');
      expect(part(element, '.empty-slot')).toBeDefined();

      host.withEmptySlot.set(false);
      await fixture.whenStable();
      expect(await table.getEmptyText()).toBe('No available options');
    });

    it('takes the empty message from the translation provideWeeljack was given', async () => {
      ROOT.classList.remove('wj-dark');
      TestBed.configureTestingModule({
        providers: [provideWeeljack({ translation: { emptyMessage: 'Nothing here' } })],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.nodes.set([]);
      await fixture.whenStable();
      const table = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTreeTableHarness);

      expect(await table.getEmptyText()).toBe('Nothing here');
    });

    it('shows a blank empty row, no text, while loading with no rows', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.nodes.set([]);
        initial.loading.set(true);
      });
      const empty = part(element, '.wj-treetable-empty');

      expect(await table.getEmptyText()).toBe('');
      expect(empty.getBoundingClientRect().height).toBeGreaterThan(40);

      host.loading.set(false);
      await fixture.whenStable();
      expect(await table.getEmptyText()).toBe('No available options');
    });

    it('renders the caption above and the summary below, and follows their slots coming and going', async () => {
      const { element, fixture, host, table } = await render();
      expect(await table.getCaptionText()).toBe('');
      expect(await table.getSummaryText()).toBe('');

      host.withCaption.set(true);
      host.withSummary.set(true);
      await fixture.whenStable();

      expect(await table.getCaptionText()).toBe('Project files');
      expect(await table.getSummaryText()).toBe('Total: 4 folders');
      const caption = part(element, '.p-treetable-header').getBoundingClientRect();
      const header = part(element, 'table').getBoundingClientRect();
      const summary = part(element, '.p-treetable-footer').getBoundingClientRect();
      expect(caption.bottom).toBeLessThanOrEqual(header.top);
      expect(summary.top).toBeGreaterThanOrEqual(header.bottom);

      host.withCaption.set(false);
      await fixture.whenStable();
      expect(await table.getCaptionText()).toBe('');
    });
  });

  describe('loading', () => {
    it('shows Optimus’s mask and sets aria-busy on the table, and clears both when loading ends', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.loading.set(true);
      });

      expect(await table.isLoading()).toBe(true);
      expect(part(element, 'table').getAttribute('aria-busy')).toBe('true');
      expect(element.querySelector('.p-treetable-mask')).not.toBeNull();

      host.loading.set(false);
      await fixture.whenStable();
      await expect.poll(() => element.querySelector('.p-treetable-mask')).toBeNull();
      expect(await table.isLoading()).toBe(false);
      expect(part(element, 'table').hasAttribute('aria-busy')).toBe(false);
    });
  });

  describe('pt', () => {
    it('reaches the parts it names, as an object, on the rows of every level', async () => {
      const { element } = await render('light', (host) => {
        expandAll(host);
        host.pt.set({
          table: { 'data-probe': 'table' },
          row: { 'data-probe': 'row' },
          rowToggleButton: { 'data-probe': 'toggle' },
          header: { 'data-probe': 'header' },
        });
        host.withCaption.set(true);
      });

      expect(part(element, 'table').dataset['probe']).toBe('table');
      expect(part(element, '.p-treetable-header').dataset['probe']).toBe('header');
      // Optimus's nodes below the first level get no pt; the rows of this table do, at every level.
      expect(parts(element, ROWS).map((found) => found.dataset['probe'])).toEqual(
        Array.from({ length: 9 }, () => 'row'),
      );
      expect(parts(element, '[data-pc-section="rowtogglebutton"]')).toHaveLength(9);
      for (const toggle of parts(element, '[data-pc-section="rowtogglebutton"]')) {
        expect(toggle.dataset['probe']).toBe('toggle');
      }
    });

    it('reaches the parts it names, as a function', async () => {
      const { element } = await render('light', (host) => {
        expandAll(host);
        host.pt.set(
          () =>
            ({
              row: { 'data-probe': 'fn' },
              sortableColumn: { 'data-probe': 'sort' },
            }) satisfies WjTreeTablePt,
        );
        host.sortable.set(true);
      });

      expect(row(element, 'Q2 report').dataset['probe']).toBe('fn');
      expect(part(element, 'th').dataset['probe']).toBe('sort');
    });

    it('keeps a consumer’s pt beside the routed attributes, on a part that also gets one', async () => {
      const { element } = await render('light', (host) => {
        host.mode.set('checkbox');
        host.pt.set({
          table: { 'data-probe': 'table', class: 'consumer-table' },
          pcRowCheckbox: { input: { 'data-probe': 'box' } },
          rowToggleButton: { class: 'consumer-toggle' },
        });
      });

      expect(part(element, 'table').dataset['probe']).toBe('table');
      expect(part(element, 'table').getAttribute('aria-label')).toBe('Files');
      expect(part(element, 'table').classList.contains('consumer-table')).toBe(true);
      const box = part(element, 'p-treetablecheckbox input');
      expect(box.dataset['probe']).toBe('box');
      expect(box.getAttribute('aria-label')).toBe('Select row');
      const toggle = part(element, '[data-pc-section="rowtogglebutton"]');
      expect(toggle.classList.contains('consumer-toggle')).toBe(true);
      expect(toggle.getAttribute('aria-hidden')).toBe('true');
    });

    it('lets the routed attribute win over a consumer’s value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          table: { 'aria-label': 'Consumer name' },
          rowToggleButton: { 'aria-hidden': 'false' },
        });
      });

      expect(part(element, 'table').getAttribute('aria-label')).toBe('Files');
      expect(part(element, '[data-pc-section="rowtogglebutton"]').getAttribute('aria-hidden')).toBe(
        'true',
      );
    });

    it('keeps routed attributes in place after the table’s state changes', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
      });

      await (await rowOf(table, 'Documents')).toggle();
      host.loading.set(true);
      host.ariaDescribedBy.set('description');
      await fixture.whenStable();
      await (await rowOf(table, 'Reports')).check();

      expect(part(element, 'table').getAttribute('aria-busy')).toBe('true');
      expect(part(element, 'table').getAttribute('aria-describedby')).toBe('description');
      for (const toggle of parts(element, '[data-pc-section="rowtogglebutton"]')) {
        expect(toggle.getAttribute('aria-hidden')).toBe('true');
      }
      for (const box of parts(element, 'p-treetablecheckbox input')) {
        expect(box.getAttribute('aria-label')).toBe('Select row');
      }
    });
  });

  describe('ARIA routing and the host', () => {
    it('puts ariaLabel on the role="treegrid" table and not on the host', async () => {
      const { element } = await render();

      expect(part(element, 'table').getAttribute('role')).toBe('treegrid');
      expect(part(element, 'table').getAttribute('aria-label')).toBe('Files');
      expect(element.hasAttribute('aria-label')).toBe(false);
    });

    it('puts ariaLabelledBy and ariaDescribedBy on the table, names it for the harness, and clears them when unset', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.ariaLabel.set(undefined);
        initial.ariaLabelledBy.set('name');
        initial.ariaDescribedBy.set('description');
      });

      expect(part(element, 'table').getAttribute('aria-labelledby')).toBe('name');
      expect(part(element, 'table').getAttribute('aria-describedby')).toBe('description');
      expect(await table.getName()).toBe('Files');

      host.ariaLabelledBy.set(undefined);
      host.ariaDescribedBy.set(undefined);
      host.ariaLabel.set('Other');
      await fixture.whenStable();
      expect(part(element, 'table').hasAttribute('aria-labelledby')).toBe(false);
      expect(part(element, 'table').hasAttribute('aria-describedby')).toBe(false);
      expect(await table.getName()).toBe('Other');
    });

    it('gives every row its level, and an open row aria-expanded', async () => {
      const { element } = await render('light', (host) => {
        expandAll(host);
      });

      expect(parts(element, ROWS).map((found) => found.getAttribute('aria-level'))).toEqual([
        '1',
        '2',
        '3',
        '3',
        '2',
        '1',
        '2',
        '1',
        '1',
      ]);
      expect(row(element, 'Reports').getAttribute('aria-expanded')).toBe('true');
    });

    it('hides every row toggle from assistive tech at every level, and keeps them out of the Tab order', async () => {
      const { element } = await render('light', (host) => {
        expandAll(host);
      });
      const toggles = parts(element, '[data-pc-section="rowtogglebutton"]');

      expect(toggles).toHaveLength(9);
      for (const toggle of toggles) {
        expect(toggle.getAttribute('aria-hidden')).toBe('true');
        expect(toggle.getAttribute('tabindex')).toBe('-1');
      }
    });

    it('names the header checkbox and every row checkbox from the translation, from the first render', async () => {
      const { element } = await render('light', (host) => {
        host.mode.set('checkbox');
        expandAll(host);
      });

      expect(part(element, 'thead input').getAttribute('aria-label')).toBe('Select all');
      const boxes = parts(element, 'tbody p-treetablecheckbox input');
      expect(boxes).toHaveLength(9);
      for (const box of boxes) {
        expect(box.getAttribute('aria-label')).toBe('Select row');
        expect(box.getAttribute('tabindex')).toBe('-1');
      }
    });

    it('takes the checkbox names from the translation provideWeeljack was given', async () => {
      ROOT.classList.remove('wj-dark');
      TestBed.configureTestingModule({
        providers: [
          provideWeeljack({
            translation: { aria: { selectRow: 'Pick row', selectAll: 'Pick all' } },
          }),
        ],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.mode.set('checkbox');
      await fixture.whenStable();
      const element = part(fixture.nativeElement as HTMLElement, 'wj-treetable');

      expect(part(element, 'thead input').getAttribute('aria-label')).toBe('Pick all');
      expect(part(element, 'tbody input').getAttribute('aria-label')).toBe('Pick row');
    });

    it('warns WJ0003 once, with the default advice, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-treetable: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-treetable: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders a header, a cell value and a node label as text, never as an element', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.nodes.set([
          {
            key: 'x',
            label: PAYLOAD,
            data: { name: PAYLOAD, size: 1, type: PAYLOAD },
          },
        ]);
      });

      expect(row(element, PAYLOAD).textContent).toContain(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      // The header text is a column input.
      host.withOwner.set(true);
      await fixture.whenStable();
      expect(element.querySelector('img')).toBeNull();
    });

    it('sets ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text and creates no element', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(part(element, 'table').getAttribute('aria-label')).toBe(PAYLOAD);
      expect(part(element, 'table').getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(part(element, 'table').getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('no mutation, no re-render (FR-6)', () => {
    it.each<WjTreeSelectionMode>(['single', 'multiple', 'checkbox'])(
      'never writes the app’s tree, selection or key map in %s mode, and reports new values',
      async (mode) => {
        const nodes = deepFreeze(makeNodes());
        const snapshot = structuredClone(nodes);
        const selection = deepFreeze<Node[]>([]);
        const keys = deepFreeze<Record<string, boolean>>({});
        const { host, table } = await render('light', (initial) => {
          initial.nodes.set(nodes);
          initial.selection.set(selection);
          initial.expanded.set(keys);
          initial.mode.set(mode);
          initial.sortable.set(true);
        });

        await (await rowOf(table, 'Documents')).toggle();
        await (await rowOf(table, 'Reports')).toggle();
        await (await rowOf(table, 'Q1 report')).select();
        await (await rowOf(table, 'Pictures')).select();
        await table.sortBy('Name');
        await table.sortBy('Name');
        await table.sortBy('Size');
        await (await rowOf(table, 'Reports')).select();
        await (await rowOf(table, 'Pictures')).toggle();
        await (await rowOf(table, 'Documents')).toggle();
        await (await rowOf(table, 'Music')).select();
        if (mode === 'checkbox') {
          await table.toggleAllRows();
          await table.toggleAllRows();
        }

        expect(error).not.toHaveBeenCalled();
        expect(nodes).toEqual(snapshot);
        expect(selection).toEqual([]);
        expect(keys).toEqual({});
        expect(host.nodes()).toBe(nodes);
        expect(host.selections.length).toBeGreaterThan(0);
        for (const reported of host.selections) {
          expect(reported).not.toBe(selection);
        }
        expect(host.expansions.length).toBeGreaterThan(0);
        for (const reported of host.expansions) {
          expect(reported).not.toBe(keys);
        }
      },
    );

    it('sorts and pages a deep-frozen tree without writing it', async () => {
      const nodes = deepFreeze(manyFolders(12));
      const snapshot = structuredClone(nodes);
      const { host, table } = await render('light', (initial) => {
        initial.nodes.set(nodes);
        initial.paginator.set(true);
        initial.rows.set(5);
        initial.sortable.set(true);
        initial.expanded.set(deepFreeze({ f1: true, f2: true }));
      });

      await table.sortBy('Size');
      await table.sortBy('Size');
      await table.goToNextPage();

      expect(error).not.toHaveBeenCalled();
      expect(nodes).toEqual(snapshot);
      expect(host.nodes()).toBe(nodes);
      expect(host.pages).toEqual([{ first: 5, rows: 5 }]);
    });

    it('hands the app only its own nodes: slots, outputs and the selection', async () => {
      const nodes = deepFreeze(makeNodes());
      const { host, table } = await render('light', (initial) => {
        initial.nodes.set(nodes);
        initial.mode.set('multiple');
        initial.withCellSlot.set(true);
        initial.expanded.set({ documents: true });
      });

      await (await rowOf(table, /^Reports/)).select();
      await (await rowOf(table, /^Documents/)).toggle();

      const everyNode = new Set<Node>();
      const walk = (list: Node[]): void => {
        for (const entry of list) {
          everyNode.add(entry);
          walk(entry.children ?? []);
        }
      };
      walk(nodes);
      expect(host.slotNodes.size).toBeGreaterThan(0);
      for (const given of [
        ...host.slotNodes,
        ...host.expands,
        ...host.collapses,
        ...host.selection(),
      ]) {
        expect(everyNode.has(given)).toBe(true);
      }
    });

    it('keeps every rendered row when it toggles, selects and checks', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        initial.expanded.set({ documents: true });
      });
      const documents = row(element, 'Documents');
      const reports = row(element, 'Reports');
      const pictures = row(element, 'Pictures');

      await (await rowOf(table, 'Reports')).toggle();
      await (await rowOf(table, 'Q1 report')).select();
      await (await rowOf(table, 'Pictures')).select();
      await (await rowOf(table, 'Pictures')).toggle();

      expect(host.selections.length).toBeGreaterThan(0);
      expect(row(element, 'Documents')).toBe(documents);
      expect(row(element, 'Reports')).toBe(reports);
      expect(row(element, 'Pictures')).toBe(pictures);
    });

    it('keeps every rendered row, and its focus, when the app sets a new value of the same keys', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.mode.set('single');
        initial.expanded.set({ documents: true, 'documents/reports': true });
      });
      const reports = row(element, 'Reports');
      const q2 = row(element, 'Q2 report');
      await (await rowOf(table, 'Q2 report')).select();
      q2.focus();

      host.nodes.set(deepFreeze(makeNodes()));
      await fixture.whenStable();

      expect(row(element, 'Reports')).toBe(reports);
      expect(row(element, 'Q2 report')).toBe(q2);
      expect(document.activeElement).toBe(q2);
      expect(await (await rowOf(table, 'Q2 report')).isSelected()).toBe(true);
      expect(await (await rowOf(table, 'Reports')).isExpanded()).toBe(true);
    });

    it('replaces a row that gets a new key, since a key is its identity', async () => {
      const { element, fixture, host } = await render();
      const music = row(element, 'Music');

      host.nodes.set([file('music-2', 'Music', 15, 'Folder'), ...makeNodes().slice(0, 2)]);
      await fixture.whenStable();

      expect(music.isConnected).toBe(false);
      expect(labels(element)).toEqual(['Music', 'Documents', 'Pictures']);
    });
  });

  describe('look', () => {
    it('keeps Optimus’s 28 px toggle and 24 px checkbox, and the host without a box of its own', async () => {
      const { element } = await render('light', (host) => {
        host.mode.set('checkbox');
      });
      const toggle = part(element, '[data-pc-section="rowtogglebutton"]').getBoundingClientRect();
      const checkbox = part(element, 'tbody p-checkbox').getBoundingClientRect();
      const host = getComputedStyle(element);

      expect(toggle.width).toBe(28);
      expect(toggle.height).toBe(28);
      expect(checkbox.width).toBeGreaterThanOrEqual(24);
      expect(checkbox.height).toBeGreaterThanOrEqual(24);
      expect(
        [host.margin, host.padding, host.borderTopWidth, host.backgroundColor].join(' | '),
      ).toBe('0px | 0px | 0px | rgba(0, 0, 0, 0)');
    });

    it('lays the first cell out as toggle, checkbox, then the text, 8 px apart, in a row of 52 px', async () => {
      const { element } = await render('light', (host) => {
        host.mode.set('checkbox');
      });
      const cell = part(row(element, 'Documents'), '.p-treetable-body-cell-content');
      const toggler = part(cell, 'p-treetabletoggler').getBoundingClientRect();
      const checkbox = part(cell, 'p-treetablecheckbox').getBoundingClientRect();
      const words = Array.from(cell.childNodes).find(
        (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim() !== '',
      );
      const text = document.createRange();
      text.selectNodeContents(words ?? cell);

      expect(getComputedStyle(cell).display).toBe('flex');
      expect(Math.round(checkbox.left - toggler.right)).toBe(8);
      expect(Math.round(text.getBoundingClientRect().left - checkbox.right)).toBe(8);
      // 52 px of row, and the 1px border under its cells.
      expect(row(element, 'Documents').getBoundingClientRect().height).toBe(53);
    });

    it('scrolls the table sideways inside the host when its columns do not fit, never the page', async () => {
      const { element, page } = await render('light', (host) => {
        host.withOwner.set(true);
        host.nodes.set([file('x', 'Unbroken'.repeat(30), 1, 'Folder')]);
      });
      const wrapper = part(element, '.p-treetable-wrapper');

      expect(getComputedStyle(wrapper).overflowX).toBe('auto');
      expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
      expect(element.getBoundingClientRect().width).toBeLessThanOrEqual(
        part(page, '.frame').getBoundingClientRect().width,
      );
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
    });

    it.each<Scheme>(['light', 'dark'])(
      'fills a picked row with the highlight in %s mode',
      async (scheme) => {
        const { page } = await render(scheme, (initial) => {
          initial.mode.set('single');
          initial.selection.set([at(initial.nodes(), 1)]);
        });
        const element = part(page, 'wj-treetable');
        const fill = resolved(page, 'background-color', 'var(--wj-highlight-background)');
        const text = resolved(page, 'color', 'var(--wj-highlight-color)');

        expect(getComputedStyle(row(element, 'Pictures')).backgroundColor).toBe(fill);
        expect(getComputedStyle(row(element, 'Pictures')).color).toBe(text);
        expect(getComputedStyle(row(element, 'Music')).backgroundColor).not.toBe(fill);
      },
    );

    it.each<Scheme>(['light', 'dark'])(
      'leaves a checked row unfilled in %s mode: the checkbox carries the state',
      async (scheme) => {
        const { page } = await render(scheme, (initial) => {
          initial.mode.set('checkbox');
          initial.selection.set([at(initial.nodes(), 1)]);
        });
        const element = part(page, 'wj-treetable');
        const content = resolved(page, 'background-color', 'var(--wj-treetable-row-background)');

        expect(
          part(row(element, 'Pictures'), 'p-treetablecheckbox input').matches(':checked'),
        ).toBe(true);
        expect(getComputedStyle(row(element, 'Pictures')).backgroundColor).toBe(content);
      },
    );

    it('turns the focus ring to the highlight colour, 3px inside, on a picked row and a sorted header', async () => {
      const { element, page } = await render('light', (host) => {
        host.mode.set('single');
        host.sortable.set(true);
        host.sortField.set('name');
        host.selection.set([at(host.nodes(), 1)]);
      });
      const highlight = resolved(page, 'color', 'var(--wj-highlight-color)');

      part(element, 'th').focus();
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      await userEvent.tab();
      expect(document.activeElement).toBe(part(element, 'th'));
      expect(getComputedStyle(part(element, 'th')).outlineColor).toBe(highlight);
      expect(getComputedStyle(part(element, 'th')).outlineOffset).toBe('-3px');

      row(element, 'Pictures').focus();
      expect(getComputedStyle(row(element, 'Pictures')).outlineColor).toBe(highlight);
      expect(getComputedStyle(row(element, 'Pictures')).outlineOffset).toBe('-3px');
      row(element, 'Music').focus();
      expect(getComputedStyle(row(element, 'Music')).outlineColor).not.toBe(highlight);
    });

    it('shows the empty row muted, with no hover fill and the default cursor', async () => {
      const { element, page } = await render('light', (host) => {
        host.nodes.set([]);
        host.rowHover.set(true);
      });
      const empty = part(element, '.wj-treetable-empty');
      const muted = resolved(page, 'color', 'var(--wj-text-muted-color)');

      await userEvent.hover(empty);
      expect(getComputedStyle(part(empty, 'td')).color).toBe(muted);
      expect(getComputedStyle(empty).backgroundColor).toBe(
        resolved(page, 'background-color', 'var(--wj-treetable-row-background)'),
      );
      expect(getComputedStyle(empty).cursor).toBe('default');
    });
  });

  describe('accessibility (axe)', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const state of STATES) {
        it(`has no violations: ${state.name}, ${scheme}`, async () => {
          const rendered = await render(scheme, state.setup);
          watchRowsSelect(rendered.element);
          await state.act?.(rendered);
          await userEvent.hover(part(rendered.page, '#name'));

          await expectNoAxeViolations(rendered.element);
        });
      }
    }

    it('has no violations with a row focused on the highlight fill', async () => {
      const rendered = await render('dark', (host) => {
        host.mode.set('single');
        host.selection.set([at(host.nodes(), 1)]);
      });
      row(rendered.element, 'Pictures').focus();

      await expectNoAxeViolations(rendered.element);
    });
  });

  describe('sorting', () => {
    it('sorts by a sortable header, ascending first then descending, at every level, and reports the models', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.sortable.set(true);
        expandAll(initial);
      });
      expect(await table.getSortOrder('Name')).toBe('none');

      await table.sortBy('Name');

      expect(await table.getSortOrder('Name')).toBe('ascending');
      expect(host.sortField()).toBe('name');
      expect(host.sortOrder()).toBe(1);
      expect(labels(element)).toEqual([
        'Archive',
        'Documents',
        'Invoices',
        'Reports',
        'Q1 report',
        'Q2 report',
        'Music',
        'Pictures',
        'Holidays',
      ]);

      await table.sortBy('Name');

      expect(await table.getSortOrder('Name')).toBe('descending');
      expect(host.sortOrder()).toBe(-1);
      expect(labels(element)).toEqual([
        'Pictures',
        'Holidays',
        'Music',
        'Documents',
        'Reports',
        'Q2 report',
        'Q1 report',
        'Invoices',
        'Archive',
      ]);
    });

    it('sorts a number field as numbers, and moves the mark to the header last sorted', async () => {
      const { element, table } = await render('light', (host) => {
        host.sortable.set(true);
      });

      await table.sortBy('Size');

      expect(labels(element)).toEqual(['Archive', 'Music', 'Documents', 'Pictures']);
      expect(await table.getSortOrder('Size')).toBe('ascending');
      await table.sortBy('Name');
      expect(await table.getSortOrder('Size')).toBe('none');
      expect(await table.getSortOrder('Name')).toBe('ascending');
    });

    it('starts sorted when sortField is given, and follows the app’s sortField and sortOrder', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.sortable.set(true);
        initial.sortField.set('name');
      });
      expect(labels(element)).toEqual(['Archive', 'Documents', 'Music', 'Pictures']);
      expect(await table.getSortOrder('Name')).toBe('ascending');

      host.sortOrder.set(-1);
      await fixture.whenStable();
      expect(labels(element)).toEqual(['Pictures', 'Music', 'Documents', 'Archive']);
      expect(await table.getSortOrder('Name')).toBe('descending');

      host.sortField.set('size');
      await fixture.whenStable();
      expect(labels(element)).toEqual(['Pictures', 'Documents', 'Music', 'Archive']);
    });

    it('draws no sort control on a column that is not sortable', async () => {
      const { element } = await render('light', (host) => {
        host.sortable.set(true);
      });

      expect(parts(element, 'thead th')).toHaveLength(3);
      expect(part(element, 'th:nth-child(3)').hasAttribute('aria-sort')).toBe(false);
      expect(part(element, 'th:nth-child(3)').hasAttribute('tabindex')).toBe(false);
      expect(parts(element, 'p-treetablesorticon')).toHaveLength(2);
    });
  });

  describe('paging', () => {
    it('shows no pager unless paginator is set, and pages the root nodes, 10 by default', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.nodes.set(manyFolders(23));
      });
      expect(element.querySelector('p-paginator')).toBeNull();
      expect(await table.getRows()).toHaveLength(23);

      host.paginator.set(true);
      await fixture.whenStable();

      expect(await table.getRows()).toHaveLength(10);
      expect(await table.getCurrentPage()).toBe(1);
      expect(parts(element, '.p-paginator-page')).toHaveLength(3);
    });

    it('keeps a root node’s descendants with it, and moves with the pager', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.nodes.set(manyFolders(23));
        initial.paginator.set(true);
        initial.rows.set(5);
        initial.expanded.set({ f1: true, f7: true });
      });
      expect(labels(element)).toEqual([
        'Folder 1',
        'Folder 1 A',
        'Folder 1 B',
        'Folder 2',
        'Folder 3',
        'Folder 4',
        'Folder 5',
      ]);

      await table.goToNextPage();

      expect(labels(element)).toEqual([
        'Folder 6',
        'Folder 7',
        'Folder 7 A',
        'Folder 7 B',
        'Folder 8',
        'Folder 9',
        'Folder 10',
      ]);
      expect(await table.getCurrentPage()).toBe(2);
      expect(host.first()).toBe(5);
      expect(host.pages).toEqual([{ first: 5, rows: 5 }]);

      await table.goToPage(5);
      expect(labels(element)).toEqual(['Folder 21', 'Folder 22', 'Folder 23']);
      await table.goToPreviousPage();
      expect(await table.getCurrentPage()).toBe(4);
      expect(host.pages.at(-1)).toEqual({ first: 15, rows: 5 });
    });

    it('follows a first and a rows the app sets', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.nodes.set(manyFolders(23));
        initial.paginator.set(true);
        initial.rows.set(5);
      });

      host.first.set(10);
      await fixture.whenStable();
      expect(labels(element)[0]).toBe('Folder 11');
      expect(await table.getCurrentPage()).toBe(3);

      host.rows.set(10);
      host.first.set(20);
      await fixture.whenStable();
      expect(labels(element)).toEqual(['Folder 21', 'Folder 22', 'Folder 23']);
      expect(host.pages).toEqual([]);
    });

    it('rowsPerPageOptions offers a select that changes the page size and emits it', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.nodes.set(manyFolders(23));
        initial.paginator.set(true);
        initial.rowsPerPageOptions.set([5, 10, 20]);
      });
      watchRowsSelect(element);
      expect(await table.getRows()).toHaveLength(10);

      rowsSelect(element).click();
      await overlayOpen();
      expect(parts(document, '[role="option"]').map((option) => option.textContent.trim())).toEqual(
        ['5', '10', '20'],
      );
      parts(document, '[role="option"]')
        .find((item) => item.textContent.trim() === '20')
        ?.click();
      await expect.poll(() => host.rows()).toBe(20);

      expect(await table.getRows()).toHaveLength(20);
      expect(host.pages.at(-1)).toEqual({ first: 0, rows: 20 });
      await closeRowsSelect(element);
    });

    it('puts the pager above, below or on both sides of the table', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.nodes.set(manyFolders(23));
        initial.paginator.set(true);
      });
      const side = (): string[] =>
        parts(element, 'p-paginator').map((pager) =>
          pager.getBoundingClientRect().top < part(element, 'table').getBoundingClientRect().top
            ? 'top'
            : 'bottom',
        );
      expect(side()).toEqual(['bottom']);

      host.paginatorPosition.set('top');
      await fixture.whenStable();
      expect(side()).toEqual(['top']);

      host.paginatorPosition.set('both');
      await fixture.whenStable();
      expect(side()).toEqual(['top', 'bottom']);
    });

    it('counts the root nodes itself: totalRecords has no effect while the table is not lazy', async () => {
      const { element } = await render('light', (host) => {
        host.nodes.set(manyFolders(23));
        host.paginator.set(true);
        host.rows.set(5);
        host.totalRecords.set(100);
      });

      expect(parts(element, '.p-paginator-page')).toHaveLength(5);
    });
  });

  describe('selection', () => {
    it('is not offered when selectionMode is unset', async () => {
      const { host, table } = await render();

      await (await rowOf(table, 'Music')).select();

      expect(host.selections).toEqual([]);
      expect(await table.getSelectedRowIndexes()).toEqual([]);
      expect(part(document, 'tbody tr').hasAttribute('aria-selected')).toBe(false);
    });

    it('selects one row in single mode, reports an array of the app’s node, and deselects on a second click', async () => {
      const nodes = makeNodes();
      const { host, table } = await render('light', (initial) => {
        initial.nodes.set(nodes);
        initial.mode.set('single');
      });

      await (await rowOf(table, 'Pictures')).select();
      expect(host.selections).toEqual([[at(nodes, 1)]]);
      expect(host.selections[0]?.[0]).toBe(at(nodes, 1));
      expect(await table.getSelectedRowIndexes()).toEqual([1]);

      await (await rowOf(table, 'Music')).select();
      expect(await table.getSelectedRowIndexes()).toEqual([2]);
      expect(host.selection()).toEqual([at(nodes, 2)]);

      await (await rowOf(table, 'Music')).select();
      expect(host.selection()).toEqual([]);
      expect(await table.getSelectedRowIndexes()).toEqual([]);
    });

    it('shows only the first of several selected rows in single mode', async () => {
      const { table } = await render('light', (host) => {
        host.mode.set('single');
        host.selection.set([at(host.nodes(), 1), at(host.nodes(), 2)]);
      });

      expect(await table.getSelectedRowIndexes()).toEqual([1]);
    });

    it('toggles each row on its own in multiple mode', async () => {
      const nodes = makeNodes();
      const { host, table } = await render('light', (initial) => {
        initial.nodes.set(nodes);
        initial.mode.set('multiple');
      });

      await (await rowOf(table, 'Documents')).select();
      await (await rowOf(table, 'Music')).select();
      expect(host.selection()).toEqual([at(nodes, 0), at(nodes, 2)]);
      expect(await table.getSelectedRowIndexes()).toEqual([0, 2]);

      await (await rowOf(table, 'Documents')).select();
      expect(host.selection()).toEqual([at(nodes, 2)]);
    });

    it('checks a parent’s descendants in checkbox mode, reports every node once, and marks its ancestors', async () => {
      const { host, table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        expandAll(initial);
      });

      await (await rowOf(table, 'Reports')).check();

      expect(await (await rowOf(table, 'Reports')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Q1 report')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Q2 report')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Documents')).isChecked()).toBe(false);
      expect(await (await rowOf(table, 'Documents')).isPartiallyChecked()).toBe(true);
      expect(await (await rowOf(table, 'Invoices')).isChecked()).toBe(false);
      expect(host.selection().map((node) => node.key)).toEqual([
        'documents/reports',
        'documents/reports/q1',
        'documents/reports/q2',
      ]);
      expect(host.selections).toHaveLength(1);
    });

    it('checks a parent when its last unchecked child is checked, and clears the mark', async () => {
      const { table } = await render('light', (host) => {
        host.mode.set('checkbox');
        expandAll(host);
      });

      await (await rowOf(table, 'Q1 report')).select();
      expect(await (await rowOf(table, 'Reports')).isPartiallyChecked()).toBe(true);
      await (await rowOf(table, 'Q2 report')).select();

      expect(await (await rowOf(table, 'Reports')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Reports')).isPartiallyChecked()).toBe(false);
      await (await rowOf(table, 'Q2 report')).select();
      expect(await (await rowOf(table, 'Reports')).isChecked()).toBe(false);
      expect(await (await rowOf(table, 'Reports')).isPartiallyChecked()).toBe(true);
    });

    it('checks and unchecks every row with the header checkbox', async () => {
      const { host, table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        expandAll(initial);
      });

      await table.toggleAllRows();
      expect(host.selection()).toHaveLength(10);
      for (const found of await table.getRows()) {
        expect(await found.isChecked()).toBe(true);
      }

      await table.toggleAllRows();
      expect(host.selection()).toEqual([]);
    });

    it('does not select a row marked selectable: false, and disables its checkbox', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.mode.set('single');
      });

      await (await rowOf(table, 'Archive')).select();
      expect(host.selections).toEqual([]);
      expect(await table.getSelectedRowIndexes()).toEqual([]);
      expect(part(row(element, 'Archive'), 'td').textContent).toContain('Archive');

      TestBed.resetTestingModule();
      const checkbox = await render('light', (initial) => {
        initial.mode.set('checkbox');
      });
      expect(
        part(row(checkbox.element, 'Archive'), 'p-treetablecheckbox input').hasAttribute(
          'disabled',
        ),
      ).toBe(true);
      expect(
        part(row(checkbox.element, 'Music'), 'p-treetablecheckbox input').hasAttribute('disabled'),
      ).toBe(false);
    });

    it('lets a check reach a row marked selectable: false through its children or its parent: Optimus propagates without asking', async () => {
      const { table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        initial.expanded.set({ archive: true });
      });

      await (await rowOf(table, 'Old files')).check();
      expect(await (await rowOf(table, 'Archive')).isChecked()).toBe(true);

      await (await rowOf(table, 'Old files')).select();
      await (await rowOf(table, 'Archive')).select();
      expect(await (await rowOf(table, 'Archive')).isChecked()).toBe(false);
    });

    it('draws no partial mark for a selection set from code, and keeps the marks it drew through a new value', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        expandAll(initial);
        initial.selection.set([at(at(at(initial.nodes(), 0).children ?? [], 0).children ?? [], 0)]);
      });
      expect(await (await rowOf(table, 'Q1 report')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Reports')).isPartiallyChecked()).toBe(false);

      host.selection.set([]);
      await fixture.whenStable();
      await (await rowOf(table, 'Q1 report')).select();
      expect(await (await rowOf(table, 'Reports')).isPartiallyChecked()).toBe(true);

      host.nodes.set(makeNodes());
      await fixture.whenStable();
      expect(await (await rowOf(table, 'Reports')).isPartiallyChecked()).toBe(true);
    });

    it('shows a selection set from code, and finds it by key in a new tree of new objects', async () => {
      const { fixture, host, table } = await render('light', (initial) => {
        initial.mode.set('multiple');
        initial.selection.set([at(initial.nodes(), 2)]);
      });
      expect(await table.getSelectedRowIndexes()).toEqual([2]);

      host.nodes.set(makeNodes());
      await fixture.whenStable();
      expect(await table.getSelectedRowIndexes()).toEqual([2]);

      host.selection.set([]);
      await fixture.whenStable();
      expect(await table.getSelectedRowIndexes()).toEqual([]);
    });

    it('treats two rows whose data is deep-equal as one row: Optimus compares by data', async () => {
      const { host, table } = await render('light', (initial) => {
        initial.mode.set('multiple');
        initial.nodes.set([
          file('a', 'Twin', 1, 'Folder'),
          file('b', 'Twin', 1, 'Folder'),
          file('c', 'Other', 2, 'Folder'),
        ]);
      });

      await (await table.getRows())[0]?.select();

      expect(await table.getSelectedRowIndexes()).toEqual([0, 1]);
      expect(host.selection().map((node) => node.key)).toEqual(['a']);
    });
  });

  describe('keyboard', () => {
    /** Puts focus on the Before button, then Tab: the table's first stop. */
    async function tabIn({ page }: Rendered): Promise<void> {
      part(page, '#before').focus();
      await userEvent.tab();
    }

    it('reaches each sortable header with Tab, then the rows, and out to the next control', async () => {
      const rendered = await render('light', (host) => {
        host.sortable.set(true);
      });
      const { element } = rendered;
      await tabIn(rendered);
      expect(document.activeElement).toBe(part(element, 'th'));

      await userEvent.tab();
      expect(document.activeElement).toBe(part(element, 'th:nth-child(2)'));
      await userEvent.tab();
      expect(document.activeElement).toBe(row(element, 'Documents'));

      await userEvent.tab();
      expect(document.activeElement).toBe(part(rendered.page, '#after'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(row(element, 'Documents'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(part(element, 'th:nth-child(2)'));
    });

    it('makes every row a Tab stop until the first Tab inside the table: Optimus’s gap', async () => {
      const rendered = await render();
      const rowsBefore = parts(rendered.element, ROWS);

      expect(rowsBefore.map((found) => found.tabIndex)).toEqual([0, 0, 0, 0]);
      await tabIn(rendered);
      expect(document.activeElement).toBe(rowsBefore[0]);
      await userEvent.tab();

      expect(parts(rendered.element, ROWS).map((found) => found.tabIndex)).toEqual([0, -1, -1, -1]);
    });

    it('moves between the visible rows with ArrowDown and ArrowUp', async () => {
      const { element } = await render('light', (host) => {
        host.expanded.set({ documents: true });
      });
      row(element, 'Documents').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(element, 'Reports'));
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(element, 'Pictures'));
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(row(element, 'Invoices'));
    });

    it('expands a row with ArrowRight and moves to its first child, and collapses it with ArrowLeft', async () => {
      const { element, host } = await render();
      row(element, 'Documents').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(labels(element)).toContain('Reports');
      expect(host.expands.map((node) => node.key)).toEqual(['documents']);
      expect(host.expanded()).toEqual({ documents: true });
      // Optimus moves focus after a 25 ms timeout: poll.
      await expect.poll(() => document.activeElement).toBe(row(element, 'Reports'));

      row(element, 'Documents').focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(labels(element)).not.toContain('Reports');
      expect(host.collapses.map((node) => node.key)).toEqual(['documents']);
      expect(host.expanded()).toEqual({ documents: false });
    });

    it('goes to the first and last row of the same level with Home and End', async () => {
      const { element } = await render('light', (host) => {
        expandAll(host);
      });
      row(element, 'Reports').focus();

      // The last row of level 2 in the whole table, not in Documents.
      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(row(element, 'Holidays'));
      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(row(element, 'Reports'));
      row(element, 'Music').focus();
      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(row(element, 'Documents'));
    });

    it('selects and deselects the focused row with Enter and Space, in single and multiple mode', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.mode.set('multiple');
      });
      row(element, 'Documents').focus();

      await userEvent.keyboard('{Enter}');
      expect(await table.getSelectedRowIndexes()).toEqual([0]);
      await userEvent.keyboard(' ');
      expect(await table.getSelectedRowIndexes()).toEqual([]);
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard(' ');
      expect(host.selection().map((node) => node.key)).toEqual(['pictures']);
    });

    it('checks the focused row with Space in checkbox mode, propagates, and unchecks with Space', async () => {
      const { element, host, table } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        expandAll(initial);
      });
      row(element, 'Reports').focus();

      await userEvent.keyboard(' ');
      expect(await (await rowOf(table, 'Reports')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Q2 report')).isChecked()).toBe(true);
      expect(await (await rowOf(table, 'Documents')).isPartiallyChecked()).toBe(true);
      expect(host.selection().map((node) => node.key)).toEqual([
        'documents/reports',
        'documents/reports/q1',
        'documents/reports/q2',
      ]);
      expect(document.activeElement).toBe(row(element, 'Reports'));

      await userEvent.keyboard(' ');
      expect(await (await rowOf(table, 'Reports')).isChecked()).toBe(false);
      expect(await (await rowOf(table, 'Q2 report')).isChecked()).toBe(false);
      expect(host.selection()).toEqual([]);
    });

    it('leaves Space on a row that is not selectable, and Enter in checkbox mode, alone', async () => {
      const { element, host } = await render('light', (initial) => {
        initial.mode.set('checkbox');
      });
      row(element, 'Archive').focus();
      await userEvent.keyboard(' ');
      row(element, 'Music').focus();
      await userEvent.keyboard('{Enter}');

      expect(host.selections).toEqual([]);
    });

    it('does not take Tab stops with the toggles or the checkboxes', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('checkbox');
      });
      await tabIn(rendered);
      expect(document.activeElement).toBe(part(rendered.element, 'thead input'));
      await userEvent.tab();
      expect(document.activeElement).toBe(row(rendered.element, 'Documents'));
      await userEvent.tab();

      expect(document.activeElement).toBe(part(rendered.page, '#after'));
      for (const box of parts(rendered.element, 'tbody p-treetablecheckbox input')) {
        expect(box.getAttribute('tabindex')).toBe('-1');
      }
    });

    it('sorts with Enter and with Space on a header, and Space does not scroll the page', async () => {
      const { element, table } = await render('light', (host) => {
        host.sortable.set(true);
      });
      part(element, 'th').focus();

      await userEvent.keyboard(' ');
      expect(await table.getSortOrder('Name')).toBe('ascending');
      await userEvent.keyboard(' ');
      expect(await table.getSortOrder('Name')).toBe('descending');
      await userEvent.keyboard('{Enter}');
      expect(await table.getSortOrder('Name')).toBe('ascending');
      const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      part(element, 'th').dispatchEvent(space);
      expect(space.defaultPrevented).toBe(true);
    });

    it('leaves Space on an unsortable header alone', async () => {
      const { element } = await render('light', (host) => {
        host.sortable.set(true);
      });
      const plain = part(element, 'th:nth-child(3)');
      const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      plain.dispatchEvent(space);
      expect(space.defaultPrevented).toBe(false);
    });

    it('changes the page with Enter and Space on a page button, and leaves First Page a Tab stop on page 1', async () => {
      const { element, table } = await render('light', (host) => {
        host.nodes.set(manyFolders(23));
        host.paginator.set(true);
        host.rows.set(5);
      });
      const next = part(element, '.p-paginator-next');
      expect(part(element, '.p-paginator-first').tabIndex).toBe(0);

      next.focus();
      await userEvent.keyboard('{Enter}');
      expect(await table.getCurrentPage()).toBe(2);
      await userEvent.keyboard(' ');
      expect(await table.getCurrentPage()).toBe(3);
    });

    it('opens the rows-per-page select with ArrowDown, moves with the arrows, Enter picks, and Escape closes', async () => {
      const { element, host } = await render('light', (initial) => {
        initial.nodes.set(manyFolders(23));
        initial.paginator.set(true);
        initial.rowsPerPageOptions.set([5, 10, 20]);
      });
      watchRowsSelect(element);
      const combobox = rowsSelect(element);
      combobox.focus();

      await userEvent.keyboard('{ArrowDown}');
      await overlayOpen();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => host.rows()).toBe(20);

      await userEvent.keyboard('{Enter}');
      await overlayOpen();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => combobox.getAttribute('aria-expanded')).toBe('false');
      await closeRowsSelect(element);
    });
  });

  describe('lazy children', () => {
    /** Three root folders that can open and have no children yet. */
    function lazyNodes(): Node[] {
      return ['a', 'b', 'c'].map((key) => file(key, `Folder ${key}`, 1, 'Folder', { leaf: false }));
    }

    it('shows a toggle on a leaf: false row, and keeps it open and its focus when the app sets its children', async () => {
      const { element, fixture, host, table } = await render('light', (initial) => {
        initial.nodes.set(lazyNodes());
      });
      expect(await (await rowOf(table, 'Folder b')).isExpandable()).toBe(true);
      const folder = row(element, 'Folder b');

      await (await rowOf(table, 'Folder b')).toggle();
      expect(host.expands.map((node) => node.key)).toEqual(['b']);
      expect(labels(element)).toEqual(['Folder a', 'Folder b', 'Folder c']);
      folder.focus();

      host.nodes.set([
        ...lazyNodes().slice(0, 1),
        file('b', 'Folder b', 1, 'Folder', {
          children: [file('b/1', 'File 1', 1, 'Text'), file('b/2', 'File 2', 2, 'Text')],
        }),
        ...lazyNodes().slice(2),
      ]);
      await fixture.whenStable();

      expect(labels(element)).toEqual(['Folder a', 'Folder b', 'File 1', 'File 2', 'Folder c']);
      expect(row(element, 'Folder b')).toBe(folder);
      expect(document.activeElement).toBe(folder);
      expect(await (await rowOf(table, 'Folder b')).isExpanded()).toBe(true);
    });

    it('opens a leaf: false row from the keyboard, which Optimus does only for a row with children', async () => {
      const { element, host } = await render('light', (initial) => {
        initial.nodes.set(lazyNodes());
      });
      row(element, 'Folder c').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(host.expands.map((node) => node.key)).toEqual(['c']);
      expect(host.expanded()).toEqual({ c: true });
    });
  });
});
