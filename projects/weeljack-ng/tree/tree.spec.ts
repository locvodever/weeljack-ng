import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TreeDragDropService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTreeNode, type WjTreeSelectionMode } from 'weeljack-ng';
import { WjTree, WjTreeEmptySlot, WjTreeNodeSlot, type WjTreePt } from 'weeljack-ng/tree';
import { WjTreeHarness, WjTreeNodeHarness } from 'weeljack-ng/tree/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Entry {
  items: number;
}

type Node = WjTreeNode<Entry>;

/** Freezes the value and everything reachable from it: an app's immutable state, or a probe. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** A file tree: nested keys, an unselectable folder, a lazy folder and a leaf with no key. */
function makeNodes(): Node[] {
  return [
    {
      key: 'documents',
      label: 'Documents',
      data: { items: 2 },
      children: [
        {
          key: 'documents/reports',
          label: 'Reports',
          data: { items: 2 },
          children: [
            { key: 'documents/reports/q1', label: 'Q1 report', data: { items: 0 } },
            { key: 'documents/reports/q2', label: 'Q2 report', data: { items: 0 } },
          ],
        },
        { key: 'documents/invoices', label: 'Invoices', data: { items: 0 } },
      ],
    },
    {
      key: 'pictures',
      label: 'Pictures',
      data: { items: 1 },
      children: [{ key: 'pictures/holidays', label: 'Holidays', data: { items: 0 } }],
    },
    { key: 'music', label: 'Music', data: { items: 0 } },
    {
      key: 'archive',
      label: 'Archive',
      data: { items: 1 },
      selectable: false,
      children: [{ key: 'archive/old', label: 'Old files', data: { items: 0 } }],
    },
  ];
}

/** The item at `index`, or a throw: keeps the specs free of `!` and casts. */
function at<T>(list: readonly T[], index: number): T {
  const found = list[index];
  if (found === undefined) {
    throw new Error(`nothing at ${String(index)}`);
  }
  return found;
}

/** A consumer's template: a tree between two buttons, with every slot a consumer can give. */
@Component({
  selector: 'wj-tree-host',
  imports: [WjTree, WjTreeNodeSlot, WjTreeEmptySlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Files</p>
    <div class="frame">
      <wj-tree
        [value]="nodes()"
        [selectionMode]="mode()"
        [selection]="selection()"
        (selectionChange)="onSelection($event)"
        [expandedKeys]="expanded()"
        (expandedKeysChange)="onExpanded($event)"
        [loading]="loading()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (nodeExpand)="expands.push($event)"
        (nodeCollapse)="collapses.push($event)"
      >
        @if (withNodeSlot()) {
          <ng-template wjTreeNode [wjTreeNodeOf]="nodes()" let-node>
            <span class="text">{{ seen(node) }}</span>
            <small class="count">{{ node.data?.items }} items</small>
          </ng-template>
        }
        @if (withEmptySlot()) {
          <ng-template wjTreeEmpty><em class="empty-slot">No folders yet.</em></ng-template>
        }
      </wj-tree>
    </div>
    <p id="description">Folders and files</p>
    <button type="button" id="after">After</button>
  `,
  styles: `
    .frame {
      inline-size: 24rem;
    }
  `,
})
class Host {
  readonly nodes = signal<Node[]>(makeNodes());
  readonly mode = signal<WjTreeSelectionMode | undefined>(undefined);
  readonly selection = signal<Node[]>([]);
  readonly expanded = signal<Record<string, boolean>>({});
  readonly loading = signal(false);
  readonly ariaLabel = signal<string | undefined>('Files');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTreePt | undefined>(undefined);
  readonly withNodeSlot = signal(false);
  readonly withEmptySlot = signal(false);

  /** Every `selectionChange` the tree reported, in order. */
  readonly selections: Node[][] = [];
  /** Every `expandedKeysChange` the tree reported, in order. */
  readonly expansions: Record<string, boolean>[] = [];
  readonly expands: Node[] = [];
  readonly collapses: Node[] = [];
  /** The nodes the node slot was given, once each. */
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
    return node.label ?? '';
  }
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-tree-aria-host',
  imports: [WjTree],
  template: `<wj-tree [value]="[]" aria-label="Files" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only, and gives the setup nothing else. */
@Component({
  selector: 'wj-tree-routed-host',
  imports: [WjTree],
  template: `<wj-tree [value]="nodes" ariaLabel="Files" />`,
})
class RoutedHost {
  readonly nodes = makeNodes();
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  tree: WjTreeHarness;
  /** The `wj-tree` element. */
  element: HTMLElement;
  /** The fixture's root, for the buttons around the tree. */
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
  const element = part(page, 'wj-tree');
  const tree = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTreeHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, '.p-tree')).paddingTop).toBe('16px');
  // The pointer is page-wide: park it on a neutral element before any hoverable colour is read.
  await userEvent.hover(part(page, '#name'));
  return { fixture, host: fixture.componentInstance, tree, element, page };
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

const ITEM = '[role="treeitem"]';

/** A treeitem's own text: its slot's `.text` when there is one, else its label span. */
function labelOf(node: Element): string {
  const label =
    node.querySelector('[data-pc-section="nodelabel"] .text') ??
    node.querySelector('[data-pc-section="nodelabel"]');
  return label?.textContent.trim() ?? '';
}

/** The treeitem whose own text is `label`. */
function item(element: ParentNode, label: string): HTMLElement {
  const found = parts(element, ITEM).find((candidate) => labelOf(candidate) === label);
  if (found === undefined) {
    throw new Error(`no treeitem with the text ${label}`);
  }
  return found;
}

/** The row of the treeitem named `label`: the box that takes the highlight and the focus ring. */
function row(element: ParentNode, label: string): HTMLElement {
  return part(item(element, label), '[data-pc-section="nodecontent"]');
}

/** The node harness for the node whose text is `text`. */
async function node(tree: WjTreeHarness, text: string | RegExp): Promise<WjTreeNodeHarness> {
  const [found] = await tree.getNodes({ text });
  if (found === undefined) {
    throw new Error(`no node with the text ${String(text)}`);
  }
  return found;
}

/** The own text of the nodes on screen, from the DOM, in order. */
function labels(element: ParentNode): string[] {
  return parts(element, ITEM).map(labelOf);
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
    name: 'a custom node slot',
    setup: (host) => {
      host.withNodeSlot.set(true);
      expandAll(host);
    },
  },
  {
    name: 'single selection, a node selected',
    setup: (host) => {
      host.mode.set('single');
      expandAll(host);
      host.selection.set([at(host.nodes(), 1)]);
    },
  },
  {
    name: 'multiple selection, two nodes selected',
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
    act: async ({ tree }) => {
      await (await node(tree, 'Q1 report')).select();
      await (await node(tree, 'Pictures')).select();
    },
  },
  {
    name: 'checkbox mode with a node that is not selectable',
    setup: (host) => {
      host.mode.set('checkbox');
      host.expanded.set({ archive: true });
    },
  },
  {
    name: 'a node that is not selectable, in single mode',
    setup: (host) => {
      host.mode.set('single');
      host.expanded.set({ archive: true });
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
    name: 'loading, with nodes',
    setup: (host) => {
      host.loading.set(true);
      host.expanded.set({ documents: true });
    },
  },
  {
    name: 'loading, with no nodes',
    setup: (host) => {
      host.nodes.set([]);
      host.loading.set(true);
    },
  },
];

describe('WjTree', () => {
  let warn: MockInstance<typeof console.warn>;
  let error: MockInstance<typeof console.error>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('value', () => {
    it('renders the root nodes collapsed, as a block, and follows a new array', async () => {
      const { element, fixture, host, tree } = await render();

      expect(await tree.getNodeTexts()).toEqual(['Documents', 'Pictures', 'Music', 'Archive']);
      expect(getComputedStyle(element).display).toBe('block');
      expect(await (await node(tree, 'Documents')).isExpandable()).toBe(true);
      expect(await (await node(tree, 'Music')).isExpandable()).toBe(false);

      host.nodes.set([{ key: 'trash', label: 'Trash' }]);
      await fixture.whenStable();
      expect(await tree.getNodeTexts()).toEqual(['Trash']);
    });

    it('shows a node open when its own expanded says so, and not its children when it does not', async () => {
      const { tree } = await render('light', (host) => {
        const list = makeNodes();
        host.nodes.set([{ ...at(list, 0), expanded: true }, ...list.slice(1)]);
      });

      expect(await tree.getNodeTexts()).toEqual([
        'Documents',
        'Reports',
        'Invoices',
        'Pictures',
        'Music',
        'Archive',
      ]);
    });

    it('renders a node’s label as the text of the row, at its level', async () => {
      const { tree } = await render('light', expandAll);
      const reports = await node(tree, 'Reports');
      const q1 = await node(tree, 'Q1 report');

      expect(await (await node(tree, 'Documents')).getLevel()).toBe(1);
      expect(await reports.getLevel()).toBe(2);
      expect(await q1.getLevel()).toBe(3);
      expect(await tree.getNodes({ level: 3 })).toHaveLength(2);
    });

    it('shows a node with no label as an empty row, and a node with an empty children array as a leaf', async () => {
      const { tree } = await render('light', (host) => {
        host.nodes.set([{ key: 'a' }, { key: 'b', label: 'B', children: [] }]);
      });

      expect(await tree.getNodeTexts()).toEqual(['', 'B']);
      expect(await (await node(tree, 'B')).isExpandable()).toBe(false);
    });
  });

  describe('expandedKeys', () => {
    it('opens the nodes it names, and an entry wins over the node’s own expanded', async () => {
      const { tree } = await render('light', (host) => {
        const list = makeNodes();
        host.nodes.set([{ ...at(list, 0), expanded: true }, ...list.slice(1)]);
        host.expanded.set({ documents: false, pictures: true });
      });

      expect(await tree.getNodeTexts()).toEqual([
        'Documents',
        'Pictures',
        'Holidays',
        'Music',
        'Archive',
      ]);
    });

    it('follows a new map from the app, in both directions', async () => {
      const { fixture, host, tree } = await render('light', (initial) => {
        initial.expanded.set({ documents: true });
      });
      expect(await tree.getNodeTexts()).toContain('Reports');

      host.expanded.set({ pictures: true });
      await fixture.whenStable();
      expect(await tree.getNodeTexts()).toEqual([
        'Documents',
        'Pictures',
        'Holidays',
        'Music',
        'Archive',
      ]);
    });

    it('answers a toggle with a new map, keyed by the node, and keeps the other entries', async () => {
      const first = deepFreeze({ pictures: true });
      const { host, tree } = await render('light', (initial) => {
        initial.expanded.set(first);
      });

      await (await node(tree, 'Documents')).expand();
      expect(host.expansions).toHaveLength(1);
      expect(host.expansions[0]).toEqual({ pictures: true, documents: true });
      expect(host.expansions[0]).not.toBe(first);
      expect(first).toEqual({ pictures: true });

      await (await node(tree, 'Pictures')).collapse();
      expect(host.expansions[1]).toEqual({ pictures: false, documents: true });
      expect(host.expanded()).toBe(host.expansions[1]);
    });

    it('fires nodeExpand and nodeCollapse with the app’s own node, for every toggle', async () => {
      const { host, tree } = await render();
      const documents = at(host.nodes(), 0);

      await (await node(tree, 'Documents')).expand();
      await (await node(tree, 'Documents')).collapse();

      expect(host.expands).toHaveLength(1);
      expect(host.expands[0]).toBe(documents);
      expect(host.collapses).toHaveLength(1);
      expect(host.collapses[0]).toBe(documents);
    });

    it('toggles a node with no key on screen, fires the outputs and writes no entry', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.nodes.set([{ label: 'Loose', children: [{ label: 'Child' }] }]);
      });
      const loose = at(host.nodes(), 0);

      await (await node(tree, 'Loose')).expand();
      expect(await tree.getNodeTexts()).toEqual(['Loose', 'Child']);
      expect(host.expands).toEqual([loose]);
      expect(host.expansions).toEqual([]);

      await (await node(tree, 'Loose')).collapse();
      expect(await tree.getNodeTexts()).toEqual(['Loose']);
      expect(host.collapses[0]).toBe(loose);
    });

    it('keeps a node open through a new value, because its key is in the map', async () => {
      const { fixture, host, tree } = await render();
      await (await node(tree, 'Documents')).expand();

      host.nodes.set(makeNodes());
      await fixture.whenStable();

      expect(await tree.getNodeTexts()).toContain('Reports');
      expect(await (await node(tree, 'Documents')).isExpanded()).toBe(true);
    });
  });

  describe('selection', () => {
    it('is not offered when selectionMode is unset', async () => {
      const { element, host, tree } = await render();

      await (await node(tree, 'Music')).select();

      expect(host.selections).toEqual([]);
      expect(await (await node(tree, 'Music')).isSelected()).toBe(false);
      expect(item(element, 'Music').hasAttribute('aria-selected')).toBe(false);
    });

    it('reads selectionMode when the tree is created: Optimus’s nodes do not follow a later change', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.mode.set('single');
      });
      expect(element.querySelector('p-checkbox')).toBeNull();

      host.mode.set('checkbox');
      await fixture.whenStable();

      // The gap, listed on the docs page: set the mode at creation, not afterwards.
      expect(element.querySelector('p-checkbox')).toBeNull();
    });

    it('selects one node in single mode, reports an array of the app’s node, and deselects on a second click', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('single');
      });
      const music = at(host.nodes(), 2);
      const pictures = at(host.nodes(), 1);

      await (await node(tree, 'Music')).select();
      expect(host.selections).toHaveLength(1);
      expect(host.selections[0]).toEqual([music]);
      expect(host.selections[0]?.[0]).toBe(music);
      expect(await (await node(tree, 'Music')).isSelected()).toBe(true);

      await (await node(tree, 'Pictures')).select();
      expect(host.selection()).toEqual([pictures]);
      expect(host.selection()[0]).toBe(pictures);
      expect(await (await node(tree, 'Music')).isSelected()).toBe(false);
      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(true);

      await (await node(tree, 'Pictures')).select();
      expect(host.selection()).toEqual([]);
      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(false);
    });

    it('shows only the first of several selected nodes in single mode', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('single');
        initial.selection.set([at(initial.nodes(), 1), at(initial.nodes(), 2)]);
      });

      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(true);
      expect(await (await node(tree, 'Music')).isSelected()).toBe(false);
      expect(host.selections).toEqual([]);
    });

    it('toggles each node on its own in multiple mode', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('multiple');
      });
      const music = at(host.nodes(), 2);
      const pictures = at(host.nodes(), 1);

      await (await node(tree, 'Music')).select();
      await (await node(tree, 'Pictures')).select();
      expect(host.selection()).toEqual([music, pictures]);
      expect(host.selection()[0]).toBe(music);
      expect(host.selection()[1]).toBe(pictures);

      await (await node(tree, 'Music')).select();
      expect(host.selection()).toEqual([pictures]);
      expect(await (await node(tree, 'Music')).isSelected()).toBe(false);
      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(true);
    });

    it('checks a parent’s descendants in checkbox mode, reports every node once, and marks its ancestors', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        expandAll(initial);
      });
      const [documents, , ,] = host.nodes();

      await (await node(tree, 'Reports')).select();

      expect(host.selections).toHaveLength(1);
      expect(host.selection().map((checked) => checked.label)).toEqual([
        'Reports',
        'Q1 report',
        'Q2 report',
      ]);
      const reports = documents?.children?.[0];
      expect(host.selection()[0]).toBe(reports);
      expect(host.selection()[1]).toBe(reports?.children?.[0]);
      expect(await (await node(tree, 'Reports')).isChecked()).toBe(true);
      expect(await (await node(tree, 'Q1 report')).isChecked()).toBe(true);
      expect(await (await node(tree, 'Q2 report')).isChecked()).toBe(true);
      expect(await (await node(tree, 'Documents')).isPartiallyChecked()).toBe(true);
      expect(await (await node(tree, 'Documents')).isChecked()).toBe(false);
    });

    it('checks a parent when its last unchecked child is checked, and clears the mark', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        initial.expanded.set({ documents: true, 'documents/reports': true });
      });

      await (await node(tree, 'Q1 report')).select();
      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(true);
      await (await node(tree, 'Q2 report')).select();

      expect(await (await node(tree, 'Reports')).isChecked()).toBe(true);
      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(false);
      expect(host.selection().map((checked) => checked.label)).toEqual([
        'Q1 report',
        'Q2 report',
        'Reports',
      ]);

      await (await node(tree, 'Q2 report')).select();
      expect(await (await node(tree, 'Reports')).isChecked()).toBe(false);
      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(true);
    });

    it('does not select or check a node marked selectable: false, and disables its checkbox', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('single');
        initial.expanded.set({ archive: true });
      });

      await (await node(tree, 'Archive')).select();
      expect(host.selections).toEqual([]);
      expect(await (await node(tree, 'Archive')).isSelected()).toBe(false);
      await (await node(tree, 'Archive')).expand();
      expect(await tree.getNodeTexts()).toContain('Old files');
    });

    it('disables the checkbox of a node that is not selectable, in checkbox mode', async () => {
      const { element, host, tree } = await render('light', (initial) => {
        initial.mode.set('checkbox');
      });

      await (await node(tree, 'Archive')).select();

      expect(host.selections).toEqual([]);
      const checkbox = part(item(element, 'Archive'), 'p-checkbox input');
      expect(checkbox instanceof HTMLInputElement && checkbox.disabled).toBe(true);
    });

    it('shows a selection set from code, and finds it by key in a new tree of new objects', async () => {
      const { fixture, host, tree } = await render('light', (initial) => {
        initial.mode.set('multiple');
        initial.selection.set([at(initial.nodes(), 1)]);
      });
      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(true);

      host.nodes.set(makeNodes());
      await fixture.whenStable();
      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(true);

      host.selection.set([]);
      await fixture.whenStable();
      expect(await (await node(tree, 'Pictures')).isSelected()).toBe(false);
    });

    it('shows a checked state set from code, and, as Optimus does, draws no partial mark for it', async () => {
      const { host, tree } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        initial.expanded.set({ documents: true, 'documents/reports': true });
        const reports = initial.nodes()[0]?.children?.[0];
        initial.selection.set([reports?.children?.[0] as Node]);
      });

      expect(await (await node(tree, 'Q1 report')).isChecked()).toBe(true);
      // The gap: Optimus sets a parent's partial mark only while it propagates a click.
      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(false);
      expect(host.selections).toEqual([]);
    });

    it('keeps the partial marks through a new value of the same keys', async () => {
      const { fixture, host, tree } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        initial.expanded.set({ documents: true, 'documents/reports': true });
      });
      await (await node(tree, 'Q1 report')).select();
      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(true);

      host.nodes.set(makeNodes());
      await fixture.whenStable();

      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(true);
      expect(await (await node(tree, 'Q1 report')).isChecked()).toBe(true);
    });
  });

  describe('lazy children', () => {
    it('shows a toggle on a leaf: false node, and keeps it open and focused when the app sets its children', async () => {
      const { element, fixture, host, tree } = await render('light', (initial) => {
        initial.nodes.set([
          { key: 'a', label: 'Lazy folder', leaf: false },
          { key: 'b', label: 'Other folder', leaf: false },
        ]);
      });
      const lazy = await node(tree, 'Lazy folder');
      expect(await lazy.isExpandable()).toBe(true);
      expect(await lazy.isExpanded()).toBe(false);
      await lazy.focus();
      const before = item(element, 'Lazy folder');

      // The app loads the children when it hears about the expansion, and answers with a new value.
      let load: (children: Node[]) => void = () => undefined;
      const loaded = new Promise<Node[]>((resolve) => {
        load = resolve;
      });
      void loaded.then((children) => {
        host.nodes.set([
          { key: 'a', label: 'Lazy folder', leaf: false, children },
          { key: 'b', label: 'Other folder', leaf: false },
        ]);
      });

      await lazy.expand();
      expect(host.expands.map((opened) => opened.label)).toEqual(['Lazy folder']);
      expect(await tree.getNodeTexts()).toEqual(['Lazy folder', 'Other folder']);

      load([
        { key: 'a/1', label: 'File 1' },
        { key: 'a/2', label: 'File 2' },
      ]);
      await expect
        .poll(() => tree.getNodeTexts())
        .toEqual(['Lazy folder', 'File 1', 'File 2', 'Other folder']);
      await fixture.whenStable();

      expect(await (await node(tree, 'Lazy folder')).isExpanded()).toBe(true);
      expect(item(element, 'Lazy folder')).toBe(before);
      expect(before.isConnected).toBe(true);
      expect(document.activeElement).toBe(before);
      expect(host.expansions.at(-1)).toEqual({ a: true });
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
        const { host, tree } = await render('light', (initial) => {
          initial.nodes.set(nodes);
          initial.selection.set(selection);
          initial.expanded.set(keys);
          initial.mode.set(mode);
        });

        await (await node(tree, 'Documents')).expand();
        await (await node(tree, 'Reports')).expand();
        await (await node(tree, 'Q1 report')).select();
        await (await node(tree, 'Pictures')).select();
        await (await node(tree, 'Reports')).select();
        await (await node(tree, 'Pictures')).expand();
        await (await node(tree, 'Documents')).collapse();
        await (await node(tree, 'Music')).select();

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

    it('hands the app only its own nodes: slots, outputs and the selection', async () => {
      const nodes = deepFreeze(makeNodes());
      const { host, tree } = await render('light', (initial) => {
        initial.nodes.set(nodes);
        initial.mode.set('multiple');
        initial.withNodeSlot.set(true);
        initial.expanded.set({ documents: true });
      });

      await (await node(tree, /^Reports/)).select();
      await (await node(tree, /^Documents/)).collapse();

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

    it('keeps every rendered node when it toggles, selects and checks', async () => {
      const { host, tree, element } = await render('light', (initial) => {
        initial.mode.set('checkbox');
        initial.expanded.set({ documents: true });
      });
      const documents = item(element, 'Documents');
      const reports = item(element, 'Reports');
      const pictures = item(element, 'Pictures');

      await (await node(tree, 'Reports')).expand();
      await (await node(tree, 'Q1 report')).select();
      await (await node(tree, 'Pictures')).select();
      await (await node(tree, 'Pictures')).expand();
      await (await node(tree, 'Pictures')).collapse();

      expect(host.selections.length).toBeGreaterThan(0);
      expect(item(element, 'Documents')).toBe(documents);
      expect(item(element, 'Reports')).toBe(reports);
      expect(item(element, 'Pictures')).toBe(pictures);
      expect(documents.isConnected && reports.isConnected && pictures.isConnected).toBe(true);
    });

    it('keeps every rendered node, and its focus, when the app sets a new value of the same keys', async () => {
      const { element, fixture, host, tree } = await render('light', (initial) => {
        initial.mode.set('single');
        initial.expanded.set({ documents: true, 'documents/reports': true });
      });
      const reports = item(element, 'Reports');
      const q2 = item(element, 'Q2 report');
      await (await node(tree, 'Q2 report')).select();
      await (await node(tree, 'Q2 report')).focus();

      host.nodes.set(deepFreeze(makeNodes()));
      await fixture.whenStable();

      expect(item(element, 'Reports')).toBe(reports);
      expect(item(element, 'Q2 report')).toBe(q2);
      expect(q2.isConnected).toBe(true);
      expect(document.activeElement).toBe(q2);
      expect(await (await node(tree, 'Q2 report')).isSelected()).toBe(true);
      expect(await (await node(tree, 'Reports')).isExpanded()).toBe(true);
    });

    it('replaces a node that gets a new key, since a key is its identity', async () => {
      const { element, fixture, host } = await render();
      const music = item(element, 'Music');

      host.nodes.set([{ key: 'music-2', label: 'Music' }, ...makeNodes().slice(0, 2)]);
      await fixture.whenStable();

      expect(music.isConnected).toBe(false);
      expect(labels(element)).toEqual(['Music', 'Documents', 'Pictures']);
    });

    it('renders without a TreeDragDropService provider: it stays inside the wrapper', async () => {
      const { tree } = await render();

      expect(await tree.getNodeTexts()).toHaveLength(4);
      expect(TestBed.inject(TreeDragDropService, null)).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe('node slot', () => {
    it('renders the consumer template for every node, with the app’s own node as its context', async () => {
      const { element, host, tree } = await render('light', (initial) => {
        initial.withNodeSlot.set(true);
        initial.expanded.set({ documents: true });
      });

      expect(parts(element, '.count').map((count) => count.textContent)).toEqual([
        '2 items',
        '2 items',
        '0 items',
        '1 items',
        '0 items',
        '1 items',
      ]);
      expect(await tree.getNodeTexts()).toEqual([
        'Documents2 items',
        'Reports2 items',
        'Invoices0 items',
        'Pictures1 items',
        'Music0 items',
        'Archive1 items',
      ]);
      const documents = at(host.nodes(), 0);
      expect(host.slotNodes.has(documents)).toBe(true);
      expect(host.slotNodes.size).toBe(6);
    });

    it('names the treeitem from what the slot shows: it carries no aria-label of its own', async () => {
      const { element } = await render('light', (initial) => {
        initial.withNodeSlot.set(true);
        initial.expanded.set({ documents: true });
      });

      for (const entry of parts(element, ITEM)) {
        expect(entry.hasAttribute('aria-label')).toBe(false);
      }
      expect(part(item(element, 'Documents'), '.text').textContent).toBe('Documents');
    });

    it('follows a changed node without a new slot', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.withNodeSlot.set(true);
      });

      host.nodes.update((list) => [
        { key: 'documents', label: 'Docs', data: { items: 9 } },
        ...list.slice(1),
      ]);
      await fixture.whenStable();

      expect(part(item(element, 'Docs'), '.count').textContent).toBe('9 items');
    });

    it('renders the label as text when no slot is given', async () => {
      const { element } = await render();

      expect(element.querySelector('.count')).toBeNull();
      expect(part(item(element, 'Music'), '[data-pc-section="nodelabel"]').textContent.trim()).toBe(
        'Music',
      );
    });
  });

  describe('empty slot and message', () => {
    it('shows the translation’s message when the tree has no nodes, and the slot instead when given', async () => {
      const { fixture, host, tree } = await render('light', (initial) => {
        initial.nodes.set([]);
      });

      expect(await tree.isEmpty()).toBe(true);
      expect(await tree.getEmptyText()).toBe('No available options');

      host.nodes.set(makeNodes());
      await fixture.whenStable();
      expect(await tree.isEmpty()).toBe(false);
      expect(await tree.getEmptyText()).toBeNull();
    });

    it('takes its message from the translation provideWeeljack was given', async () => {
      ROOT.classList.remove('wj-dark');
      TestBed.configureTestingModule({
        providers: [provideWeeljack({ translation: { emptyMessage: 'Nothing here' } })],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.nodes.set([]);
      await fixture.whenStable();
      const tree = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTreeHarness);

      expect(await tree.getEmptyText()).toBe('Nothing here');
    });

    it('renders the empty slot in place of the message', async () => {
      const { element, tree } = await render('light', (initial) => {
        initial.nodes.set([]);
        initial.withEmptySlot.set(true);
      });

      expect(await tree.getEmptyText()).toBe('No folders yet.');
      expect(part(element, '.empty-slot').textContent).toBe('No folders yet.');
    });

    it('follows an empty slot that appears and goes after the tree was created', async () => {
      const { fixture, host, tree } = await render('light', (initial) => {
        initial.nodes.set([]);
      });
      expect(await tree.getEmptyText()).toBe('No available options');

      host.withEmptySlot.set(true);
      await fixture.whenStable();
      await expect.poll(() => tree.getEmptyText()).toBe('No folders yet.');

      host.withEmptySlot.set(false);
      await fixture.whenStable();
      await expect.poll(() => tree.getEmptyText()).toBe('No available options');
    });
  });

  describe('loading', () => {
    it('shows Optimus’s mask and sets aria-busy on the list, and clears both when loading ends', async () => {
      const { element, fixture, host, tree } = await render('light', (initial) => {
        initial.loading.set(true);
      });

      expect(await tree.isLoading()).toBe(true);
      expect(part(element, '[role="tree"]').getAttribute('aria-busy')).toBe('true');

      host.loading.set(false);
      await fixture.whenStable();
      await expect.poll(() => tree.isLoading()).toBe(false);
      expect(part(element, '[role="tree"]').hasAttribute('aria-busy')).toBe(false);
    });

    it('shows no empty text while a tree with no nodes loads, and is at least 3rem tall', async () => {
      const { element, tree } = await render('light', (initial) => {
        initial.nodes.set([]);
        initial.loading.set(true);
      });

      expect(await tree.getEmptyText()).toBeNull();
      expect(await tree.isLoading()).toBe(true);
      expect(part(element, '.p-tree').getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    });

    it('is not busy, and shows no mask, by default', async () => {
      const { element, tree } = await render();

      expect(await tree.isLoading()).toBe(false);
      expect(part(element, '[role="tree"]').hasAttribute('aria-busy')).toBe(false);
    });
  });

  describe('pt', () => {
    it('reaches the parts it names, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          rootChildren: { 'data-probe': 'list' },
          nodeLabel: { 'data-probe': 'label' },
          nodeContent: { 'data-probe': 'content' },
          wrapper: { 'data-probe': 'wrapper' },
        });
      });

      expect(part(element, '[role="tree"]').getAttribute('data-probe')).toBe('list');
      expect(part(element, '[data-pc-section="nodelabel"]').getAttribute('data-probe')).toBe(
        'label',
      );
      expect(part(element, '[data-pc-section="nodecontent"]').getAttribute('data-probe')).toBe(
        'content',
      );
      expect(part(element, '[data-pc-section="wrapper"]').getAttribute('data-probe')).toBe(
        'wrapper',
      );
    });

    it('reaches the parts it names, as a function, and the empty message and the mask', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.nodes.set([]);
        initial.pt.set(() => ({
          emptyMessage: { 'data-probe': 'empty' },
          root: { 'data-probe': 'root' },
        }));
      });
      expect(part(element, '[data-pc-section="emptymessage"]').getAttribute('data-probe')).toBe(
        'empty',
      );

      host.loading.set(true);
      host.pt.set({ mask: { 'data-probe': 'mask' }, loadingIcon: { 'data-probe': 'icon' } });
      await fixture.whenStable();
      expect(part(element, '[data-pc-section="mask"]').getAttribute('data-probe')).toBe('mask');
      expect(
        element.querySelector('[data-pc-section="loadingicon"]')?.getAttribute('data-probe'),
      ).toBe('icon');
    });

    it('keeps a consumer’s pt beside the routed attributes, on a part that also gets one', async () => {
      const { element } = await render('light', (host) => {
        host.ariaDescribedBy.set('description');
        host.expanded.set({ documents: true });
        host.pt.set({
          rootChildren: { 'data-probe': 'list', class: 'consumer-list' },
          nodeToggleButton: { 'data-probe': 'toggle' },
          node: { 'data-probe': 'node' },
        });
      });
      const list = part(element, '[role="tree"]');

      expect(list.getAttribute('data-probe')).toBe('list');
      expect(list.classList.contains('consumer-list')).toBe(true);
      expect(list.getAttribute('aria-describedby')).toBe('description');
      const toggle = part(item(element, 'Documents'), '[data-pc-section="nodetogglebutton"]');
      expect(toggle.getAttribute('data-probe')).toBe('toggle');
      expect(toggle.getAttribute('aria-hidden')).toBe('true');
      expect(item(element, 'Pictures').getAttribute('data-probe')).toBe('node');
      expect(item(element, 'Pictures').getAttribute('aria-setsize')).toBe('4');
    });

    it('reaches the first level of nodes only: Optimus 2.0.2 hands the nodes below no pt', async () => {
      const { element } = await render('light', (host) => {
        host.expanded.set({ documents: true, 'documents/reports': true });
        host.pt.set({ node: { 'data-probe': 'node' }, nodeLabel: { 'data-probe': 'label' } });
      });

      // The gap, listed on the docs page: only the root nodes' own parts take the consumer's pt.
      expect(item(element, 'Documents').getAttribute('data-probe')).toBe('node');
      expect(item(element, 'Reports').hasAttribute('data-probe')).toBe(false);
      expect(item(element, 'Q1 report').hasAttribute('data-probe')).toBe(false);
    });

    it('keeps a consumer’s per-node function and a string class beside the routed per-node attributes', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.expanded.set({ documents: true });
        initial.pt.set({
          node: (options) => ({
            'data-label': String(Reflect.get(Object(Reflect.get(options, 'context')), 'index')),
          }),
        });
      });
      expect(item(element, 'Pictures').getAttribute('data-label')).toBe('1');
      expect(item(element, 'Pictures').getAttribute('aria-setsize')).toBe('4');

      host.pt.set({ node: 'consumer-node' });
      await fixture.whenStable();
      expect(item(element, 'Pictures').classList.contains('consumer-node')).toBe(true);
      expect(item(element, 'Pictures').getAttribute('aria-setsize')).toBe('4');
    });

    it('lets the routed attribute win over a consumer’s value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.loading.set(true);
        host.expanded.set({ documents: true });
        host.pt.set({
          rootChildren: { 'aria-busy': 'false' },
          nodeToggleButton: { 'aria-hidden': 'false' },
          node: { 'aria-setsize': '99', 'aria-label': 'Consumer name' },
        });
      });

      expect(part(element, '[role="tree"]').getAttribute('aria-busy')).toBe('true');
      expect(
        part(item(element, 'Documents'), '[data-pc-section="nodetogglebutton"]').getAttribute(
          'aria-hidden',
        ),
      ).toBe('true');
      expect(item(element, 'Documents').getAttribute('aria-setsize')).toBe('4');
      expect(item(element, 'Documents').hasAttribute('aria-label')).toBe(false);
    });

    it('keeps routed attributes in place after the tree’s state changes', async () => {
      const { element, tree } = await render('light', (host) => {
        host.mode.set('checkbox');
      });

      await (await node(tree, 'Documents')).expand();
      await (await node(tree, 'Reports')).expand();
      await (await node(tree, 'Q1 report')).select();
      await (await node(tree, 'Pictures')).expand();

      for (const entry of parts(element, ITEM)) {
        expect(
          part(entry, '[data-pc-section="nodetogglebutton"]').getAttribute('aria-hidden'),
        ).toBe('true');
        expect(entry.hasAttribute('aria-setsize')).toBe(true);
      }
      for (const checkbox of parts(element, 'p-checkbox')) {
        expect(checkbox.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('ARIA routing and the host', () => {
    it('puts ariaLabel on the role="tree" list and not on the host', async () => {
      const { element } = await render();

      expect(part(element, '[role="tree"]').getAttribute('aria-label')).toBe('Files');
      expect(element.hasAttribute('aria-label')).toBe(false);
    });

    it('puts ariaLabelledBy and ariaDescribedBy on the list, and clears them when unset', async () => {
      const { element, fixture, host, tree } = await render('light', (initial) => {
        initial.ariaLabel.set(undefined);
        initial.ariaLabelledBy.set('name');
        initial.ariaDescribedBy.set('description');
      });
      const list = part(element, '[role="tree"]');

      expect(list.getAttribute('aria-labelledby')).toBe('name');
      expect(list.getAttribute('aria-describedby')).toBe('description');
      expect(list.hasAttribute('aria-label')).toBe(false);
      expect(await tree.getName()).toBe('Files');

      host.ariaLabelledBy.set(undefined);
      host.ariaDescribedBy.set(undefined);
      await fixture.whenStable();
      expect(list.hasAttribute('aria-labelledby')).toBe(false);
      expect(list.hasAttribute('aria-describedby')).toBe(false);
    });

    it('gives every treeitem its set size and position, at two levels', async () => {
      const { element } = await render('light', (host) => {
        host.expanded.set({ documents: true, 'documents/reports': true });
      });

      const expected: [string, string, string, string][] = [
        ['Documents', '4', '1', '1'],
        ['Reports', '2', '1', '2'],
        ['Q1 report', '2', '1', '3'],
        ['Q2 report', '2', '2', '3'],
        ['Invoices', '2', '2', '2'],
        ['Pictures', '4', '2', '1'],
        ['Music', '4', '3', '1'],
        ['Archive', '4', '4', '1'],
      ];
      expect(
        parts(element, ITEM).map((entry) => [
          labelOf(entry),
          entry.getAttribute('aria-setsize'),
          entry.getAttribute('aria-posinset'),
          entry.getAttribute('aria-level'),
        ]),
      ).toEqual(expected);
    });

    it('keeps the set size right when the siblings change', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.expanded.set({ documents: true });
      });
      expect(item(element, 'Reports').getAttribute('aria-setsize')).toBe('2');

      host.nodes.update((list) => [
        {
          ...at(list, 0),
          children: [...(at(list, 0).children ?? []), { key: 'documents/new', label: 'New' }],
        },
        ...list.slice(1),
      ]);
      await fixture.whenStable();
      await expect.poll(() => item(element, 'Reports').getAttribute('aria-setsize')).toBe('3');
      expect(item(element, 'New').getAttribute('aria-setsize')).toBe('3');

      host.nodes.update((list) => list.slice(0, 2));
      await fixture.whenStable();
      await expect.poll(() => item(element, 'Documents').getAttribute('aria-setsize')).toBe('2');
    });

    it('says whether a node can open: aria-expanded on every node with children or leaf: false', async () => {
      const { element, tree } = await render('light', (host) => {
        host.nodes.set([...makeNodes().slice(0, 3), { key: 'lazy', label: 'Lazy', leaf: false }]);
      });

      expect(item(element, 'Documents').getAttribute('aria-expanded')).toBe('false');
      expect(item(element, 'Lazy').getAttribute('aria-expanded')).toBe('false');
      expect(item(element, 'Music').hasAttribute('aria-expanded')).toBe(false);

      await (await node(tree, 'Documents')).expand();
      expect(item(element, 'Documents').getAttribute('aria-expanded')).toBe('true');
      await (await node(tree, 'Documents')).collapse();
      expect(item(element, 'Documents').getAttribute('aria-expanded')).toBe('false');
    });

    it('leaves a partly checked node aria-checked="false": Optimus draws the mark, not the state', async () => {
      const { element, tree } = await render('light', (host) => {
        host.mode.set('checkbox');
        host.expanded.set({ documents: true, 'documents/reports': true });
      });
      expect(item(element, 'Reports').getAttribute('aria-checked')).toBe('false');

      await (await node(tree, 'Q1 report')).select();

      // The gap, listed on the docs page: a partly checked parent is announced as not checked.
      expect(await (await node(tree, 'Reports')).isPartiallyChecked()).toBe(true);
      expect(item(element, 'Reports').getAttribute('aria-checked')).toBe('false');
      expect(item(element, 'Q1 report').getAttribute('aria-checked')).toBe('true');
      expect(item(element, 'Q2 report').getAttribute('aria-checked')).toBe('false');
    });

    it('hides every toggle and node checkbox from assistive tech, and keeps them out of the Tab order', async () => {
      const { element } = await render('light', (host) => {
        host.mode.set('checkbox');
        expandAll(host);
      });
      const toggles = parts(element, '[data-pc-section="nodetogglebutton"]');
      const checkboxes = parts(element, 'p-checkbox');

      expect(toggles.length).toBe(parts(element, ITEM).length);
      expect(checkboxes.length).toBe(parts(element, ITEM).length);
      for (const toggle of toggles) {
        expect(toggle.getAttribute('aria-hidden')).toBe('true');
        expect(toggle.tabIndex).toBe(-1);
      }
      for (const checkbox of checkboxes) {
        expect(checkbox.getAttribute('aria-hidden')).toBe('true');
        expect(part(checkbox, 'input').tabIndex).toBe(-1);
      }
    });

    it('warns WJ0003 once, with the default advice, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-tree: aria-label is set on the host, where it is not forwarded to the ' +
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
        'WJ0001: wj-tree: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders a node label as text, never as an attribute or an element', async () => {
      const { element, tree } = await render('light', (host) => {
        host.nodes.set([{ key: 'x', label: PAYLOAD, children: [{ key: 'y', label: PAYLOAD }] }]);
        host.expanded.set({ x: true });
      });

      expect(await tree.getNodeTexts()).toEqual([PAYLOAD, PAYLOAD]);
      expect(labels(element)).toEqual([PAYLOAD, PAYLOAD]);
      expect(parts(element, ITEM).some((entry) => entry.hasAttribute('aria-label'))).toBe(false);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders a label as text through a node slot too', async () => {
      const { element, tree } = await render('light', (host) => {
        host.nodes.set([{ key: 'x', label: PAYLOAD }]);
        host.withNodeSlot.set(true);
      });

      expect(await tree.getNodeTexts()).toEqual([`${PAYLOAD} items`]);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('sets ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text and creates no element', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.ariaLabel.set(PAYLOAD);
        initial.ariaDescribedBy.set(PAYLOAD);
      });
      const list = part(element, '[role="tree"]');
      expect(list.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(list.getAttribute('aria-describedby')).toBe(PAYLOAD);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(PAYLOAD);
      await fixture.whenStable();
      expect(list.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('keyboard', () => {
    /** Puts focus on the Before button, then Tab: the tree's one stop. */
    async function tabIn({ page }: Rendered): Promise<void> {
      part(page, '#before').focus();
      await userEvent.tab();
    }

    it('moves into the tree with Tab, to its first node, and out with Tab', async () => {
      const rendered = await render();
      await tabIn(rendered);

      expect(document.activeElement).toBe(item(rendered.element, 'Documents'));

      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).not.toBe(item(rendered.element, 'Documents'));
      expect(rendered.element.contains(document.activeElement)).toBe(false);
    });

    it('puts Tab on a selected node below the first level', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('single');
        host.expanded.set({ documents: true, 'documents/reports': true });
        host.selection.set([host.nodes()[0]?.children?.[0]?.children?.[1] as Node]);
      });
      await tabIn(rendered);

      expect(document.activeElement).toBe(item(rendered.element, 'Q2 report'));
    });

    it('puts Tab on the first node when the selected one is a root node: Optimus’s gap', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('single');
        host.selection.set([at(host.nodes(), 2)]);
      });
      await tabIn(rendered);

      // The gap, listed on the docs page: Optimus moves the Tab stop to the selected node only
      // while it creates nested nodes, so a selected root node is reached with the arrow keys.
      expect(document.activeElement).toBe(item(rendered.element, 'Documents'));
      expect(item(rendered.element, 'Music').getAttribute('aria-selected')).toBe('true');
    });

    it('moves between the visible nodes with ArrowDown and ArrowUp', async () => {
      const rendered = await render('light', (host) => {
        host.expanded.set({ documents: true });
      });
      await tabIn(rendered);

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Reports'));
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Invoices'));
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Pictures'));
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(item(rendered.element, 'Invoices'));
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(item(rendered.element, 'Documents'));
    });

    it('expands a collapsed node with ArrowRight, then moves to its first child', async () => {
      const rendered = await render();
      await tabIn(rendered);

      await userEvent.keyboard('{ArrowRight}');

      expect(rendered.host.expands.map((opened) => opened.label)).toEqual(['Documents']);
      expect(rendered.host.expansions.at(-1)).toEqual({ documents: true });
      // Optimus moves focus after a 1 ms timeout: poll instead of waiting.
      await expect.poll(() => document.activeElement).toBe(item(rendered.element, 'Reports'));
    });

    it('leaves an expanded node alone on ArrowRight: it moves nothing and fires nothing', async () => {
      const rendered = await render('light', (host) => {
        host.expanded.set({ documents: true });
      });
      await tabIn(rendered);

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(item(rendered.element, 'Documents'));
      expect(rendered.host.expands).toEqual([]);
    });

    it('collapses an expanded node with ArrowLeft, else moves to its parent', async () => {
      const rendered = await render('light', (host) => {
        host.expanded.set({ documents: true });
      });
      await tabIn(rendered);
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Reports'));

      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(item(rendered.element, 'Documents'));

      await userEvent.keyboard('{ArrowLeft}');
      expect(rendered.host.collapses.map((closed) => closed.label)).toEqual(['Documents']);
      expect(rendered.host.expansions.at(-1)).toEqual({ documents: false });
      expect(labels(rendered.element)).toEqual(['Documents', 'Pictures', 'Music', 'Archive']);
    });

    it('selects and deselects the focused node with Enter and Space, in single mode', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('single');
      });
      await tabIn(rendered);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Music'));

      await userEvent.keyboard('{Enter}');
      expect(rendered.host.selection().map((picked) => picked.label)).toEqual(['Music']);
      expect(item(rendered.element, 'Music').getAttribute('aria-selected')).toBe('true');

      await userEvent.keyboard('{Enter}');
      expect(rendered.host.selection()).toEqual([]);

      await userEvent.keyboard(' ');
      expect(rendered.host.selection().map((picked) => picked.label)).toEqual(['Music']);
      await userEvent.keyboard(' ');
      expect(rendered.host.selection()).toEqual([]);
    });

    it('checks the focused node with Enter and Space, in checkbox mode, and propagates', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('checkbox');
        host.expanded.set({ pictures: true });
      });
      await tabIn(rendered);
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Pictures'));

      await userEvent.keyboard('{Enter}');
      expect(rendered.host.selection().map((checked) => checked.label)).toEqual([
        'Pictures',
        'Holidays',
      ]);
      expect(item(rendered.element, 'Holidays').getAttribute('aria-checked')).toBe('true');

      await userEvent.keyboard(' ');
      expect(rendered.host.selection()).toEqual([]);
    });

    it('does nothing on Enter when the tree does not select, and on a node that is not selectable', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('single');
      });
      await tabIn(rendered);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(document.activeElement).toBe(item(rendered.element, 'Archive'));

      await userEvent.keyboard('{Enter}');

      expect(rendered.host.selections).toEqual([]);
    });

    it('leaves Home, End, type-ahead and * unhandled: Optimus 2.0.2 does not honour them', async () => {
      const rendered = await render('light', (host) => {
        host.expanded.set({ documents: true });
      });
      await tabIn(rendered);
      await userEvent.keyboard('{ArrowDown}');
      const reports = item(rendered.element, 'Reports');
      expect(document.activeElement).toBe(reports);

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(reports);
      // Chrome can ignore a Home pressed right after End: press it again, and a key between.
      await userEvent.keyboard('{Home}');
      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(reports);
      await userEvent.keyboard('m');
      expect(document.activeElement).toBe(reports);
      await userEvent.keyboard('*');
      expect(document.activeElement).toBe(reports);
      expect(rendered.host.expands).toEqual([]);
    });

    it('does not take Tab stops with the toggles or the checkboxes', async () => {
      const rendered = await render('light', (host) => {
        host.mode.set('checkbox');
      });
      await tabIn(rendered);
      expect(document.activeElement).toBe(item(rendered.element, 'Documents'));

      await userEvent.tab();

      expect(rendered.element.contains(document.activeElement)).toBe(false);
    });
  });

  describe('hit boxes and look', () => {
    it('keeps Optimus’s 28 px toggle and 24 px checkbox, and the host without a box of its own', async () => {
      const { element } = await render('light', (host) => {
        host.mode.set('checkbox');
      });
      const toggle = part(element, '[data-pc-section="nodetogglebutton"]').getBoundingClientRect();
      const checkbox = part(element, 'p-checkbox').getBoundingClientRect();
      const host = getComputedStyle(element);

      expect(toggle.width).toBe(28);
      expect(toggle.height).toBe(28);
      expect(checkbox.width).toBeGreaterThanOrEqual(24);
      expect(checkbox.height).toBeGreaterThanOrEqual(24);
      expect(
        [host.margin, host.padding, host.borderTopWidth, host.backgroundColor].join(' | '),
      ).toBe('0px | 0px | 0px | rgba(0, 0, 0, 0)');
    });

    it.each<Scheme>(['light', 'dark'])(
      'fills a picked node with the highlight in %s mode',
      async (scheme) => {
        const { page } = await render(scheme, (initial) => {
          initial.mode.set('single');
          initial.selection.set([at(initial.nodes(), 1)]);
        });
        const element = part(page, 'wj-tree');
        const fill = resolved(page, 'background-color', 'var(--wj-highlight-background)');
        const text = resolved(page, 'color', 'var(--wj-highlight-color)');

        expect(getComputedStyle(row(element, 'Pictures')).backgroundColor).toBe(fill);
        expect(getComputedStyle(row(element, 'Pictures')).color).toBe(text);
        expect(getComputedStyle(row(element, 'Music')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      },
    );

    it.each<Scheme>(['light', 'dark'])(
      'leaves a checked node unfilled in %s mode: the checkbox carries the state',
      async (scheme) => {
        const { page } = await render(scheme, (initial) => {
          initial.mode.set('checkbox');
          initial.selection.set([at(initial.nodes(), 1)]);
        });
        const element = part(page, 'wj-tree');

        expect(item(element, 'Pictures').getAttribute('aria-checked')).toBe('true');
        expect(getComputedStyle(row(element, 'Pictures')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      },
    );

    it('gives a node that is not selectable no hover fill, the default cursor and an undimmed label', async () => {
      const { element, page } = await render('light', (host) => {
        host.mode.set('single');
      });
      const hover = resolved(page, 'background-color', 'var(--wj-content-hover-background)');

      await userEvent.hover(row(element, 'Pictures'));
      expect(getComputedStyle(row(element, 'Pictures')).backgroundColor).toBe(hover);
      expect(getComputedStyle(row(element, 'Pictures')).cursor).toBe('pointer');

      await userEvent.hover(row(element, 'Archive'));
      const archive = getComputedStyle(row(element, 'Archive'));
      expect(archive.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(archive.cursor).toBe('auto');
      expect(archive.opacity).toBe('1');
      expect(archive.color).toBe(resolved(page, 'color', 'var(--wj-text-color)'));
    });

    it.each<Scheme>(['light', 'dark'])(
      'draws the focus ring on a picked node in the highlight colour, 3px inside, in %s mode',
      async (scheme) => {
        const rendered = await render(scheme, (host) => {
          host.mode.set('single');
          host.selection.set([at(host.nodes(), 1)]);
        });
        part(rendered.page, '#before').focus();
        await userEvent.tab();
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(item(rendered.element, 'Pictures'));

        const ring = getComputedStyle(row(rendered.element, 'Pictures'));
        expect(ring.outlineColor).toBe(
          resolved(rendered.page, 'color', 'var(--wj-highlight-color)'),
        );
        expect(ring.outlineOffset).toBe('-3px');
        expect(ring.outlineStyle).toBe('solid');
        expect(ring.outlineWidth).toBe('2px');

        await userEvent.keyboard('{ArrowDown}');
        const plain = getComputedStyle(row(rendered.element, 'Music'));
        expect(plain.outlineColor).toBe(
          resolved(rendered.page, 'color', 'var(--wj-focus-ring-color)'),
        );
        expect(plain.outlineOffset).toBe('-1px');
      },
    );

    it('shows the empty text muted', async () => {
      const { element, page } = await render('light', (host) => {
        host.nodes.set([]);
      });

      expect(getComputedStyle(part(element, '[data-pc-section="emptymessage"]')).color).toBe(
        resolved(page, 'color', 'var(--wj-text-muted-color)'),
      );
    });

    it('lets a long label wrap instead of cutting it', async () => {
      const label = 'A label that is long enough to need more than one line in a narrow column. ';
      const { element } = await render('light', (host) => {
        host.nodes.set([{ key: 'long', label: label.repeat(3) }]);
      });
      const style = getComputedStyle(part(element, '[data-pc-section="nodelabel"]'));

      expect(style.textOverflow).not.toBe('ellipsis');
      expect(style.whiteSpace).not.toBe('nowrap');
      expect(
        part(element, '[data-pc-section="nodelabel"]').getBoundingClientRect().height,
      ).toBeGreaterThan(40);
    });
  });

  describe('accessibility (axe)', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const state of STATES) {
        it(`has no violations: ${state.name}, ${scheme}`, async () => {
          const rendered = await render(scheme, state.setup);
          await state.act?.(rendered);
          await userEvent.hover(part(rendered.page, '#name'));

          await expectNoAxeViolations(rendered.element);
        });
      }
    }

    it('has no violations with a node focused on the highlight fill', async () => {
      const rendered = await render('dark', (host) => {
        host.mode.set('single');
        host.selection.set([at(host.nodes(), 1)]);
      });
      part(rendered.page, '#before').focus();
      await userEvent.tab();
      await userEvent.keyboard('{ArrowDown}');

      await expectNoAxeViolations(rendered.element);
    });
  });
});
