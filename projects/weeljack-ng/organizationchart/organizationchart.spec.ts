/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTreeNode } from 'weeljack-ng';
import {
  WjOrganizationChart,
  WjOrganizationChartNodeSlot,
  type WjOrganizationChartPt,
} from 'weeljack-ng/organizationchart';
import {
  WjOrganizationChartHarness,
  WjOrganizationChartNodeHarness,
} from 'weeljack-ng/organizationchart/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Person {
  title: string;
}

type Node = WjTreeNode<Person>;

/** Freezes the value and everything reachable from it: an app's immutable state, or a probe. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** A three-level chart: Studio, two teams and their four leaves. Every branch is open. */
function makeChart(): Node[] {
  return [
    {
      key: 'studio',
      label: 'Studio',
      data: { title: 'Studio head' },
      expanded: true,
      children: [
        {
          key: 'design',
          label: 'Design',
          data: { title: 'Design lead' },
          expanded: true,
          children: [
            { key: 'research', label: 'Research', data: { title: 'Researcher' } },
            { key: 'visual', label: 'Visual', data: { title: 'Visual designer' } },
          ],
        },
        {
          key: 'engineering',
          label: 'Engineering',
          data: { title: 'Engineering lead' },
          expanded: true,
          children: [
            { key: 'web', label: 'Web', data: { title: 'Web developer' } },
            { key: 'mobile', label: 'Mobile', data: { title: 'Mobile developer' } },
          ],
        },
      ],
    },
  ];
}

/** The same chart one level deeper under Mobile, so a collapsed branch hides a toggle. */
function makeDeepChart(): Node[] {
  const chart = makeChart();
  const mobile = chart[0]?.children?.[1]?.children?.[1];
  if (mobile) {
    mobile.expanded = true;
    mobile.children = [
      { key: 'ios', label: 'iOS', data: { title: 'iOS developer' } },
      { key: 'android', label: 'Android', data: { title: 'Android developer' } },
    ];
  }
  return chart;
}

/** The node with this label, anywhere under `nodes`: the app's own object. */
function find(nodes: readonly Node[], label: string): Node {
  for (const node of nodes) {
    if (node.label === label) {
      return node;
    }
    for (const child of node.children ?? []) {
      try {
        return find([child], label);
      } catch {
        // not under this child: try the next
      }
    }
  }
  throw new Error(`no node labelled ${label}`);
}

/** What a part's context says about its node's label: Optimus's context is untyped. */
function labelOf(instance: unknown): string {
  const node: unknown = Reflect.get(Object(instance), 'node');
  return String(Reflect.get(Object(node), 'label'));
}

/** A consumer's template: a chart between two buttons, in tall page room, with its one slot. */
@Component({
  selector: 'wj-organizationchart-host',
  imports: [WjOrganizationChart, WjOrganizationChartNodeSlot],
  template: `
    <button type="button" id="before">Before</button>
    <div class="above"></div>
    <div class="frame">
      <wj-organizationchart
        [value]="chart()"
        [collapsible]="collapsible()"
        [pt]="pt()"
        (nodeExpand)="expands.push($event)"
        (nodeCollapse)="collapses.push($event)"
      >
        @if (withSlot()) {
          <ng-template wjOrganizationChartNode [wjOrganizationChartNodeOf]="chart()" let-node>
            <strong class="name">{{ seen(node) }}</strong>
            <small class="title">{{ node.data?.title }}</small>
          </ng-template>
        }
      </wj-organizationchart>
    </div>
    <button type="button" id="after">After</button>
    <div class="below"></div>
  `,
  styles: `
    .frame {
      overflow-x: auto;
      padding: 4px;
    }
    .above {
      block-size: 2rem;
    }
    .below {
      block-size: 300vh;
    }
  `,
})
class Host {
  readonly chart = signal<Node[]>(makeChart());
  readonly collapsible = signal(false);
  readonly pt = signal<WjOrganizationChartPt | undefined>(undefined);
  readonly withSlot = signal(false);

  readonly expands: Node[] = [];
  readonly collapses: Node[] = [];
  /** The nodes the slot was given, once each. */
  readonly slotNodes = new Set<Node>();

  seen(node: Node): string {
    this.slotNodes.add(node);
    return node.label ?? '';
  }
}

/** A consumer who writes `aria-label` on the host instead of using an input. */
@Component({
  selector: 'wj-organizationchart-aria-host',
  imports: [WjOrganizationChart],
  template: `<wj-organizationchart [value]="[]" aria-label="Studio" />`,
})
class AriaOnHostHost {}

/** A consumer who gives nothing but the value. */
@Component({
  selector: 'wj-organizationchart-plain-host',
  imports: [WjOrganizationChart],
  template: `<wj-organizationchart [value]="chart" />`,
})
class PlainHost {
  readonly chart = makeChart();
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  chart: WjOrganizationChartHarness;
  /** The `wj-organizationchart` element. */
  element: HTMLElement;
  /** The fixture's root, for the buttons around the chart. */
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
  const element = part(page, 'wj-organizationchart');
  const chart = await TestbedHarnessEnvironment.loader(fixture).getHarness(
    WjOrganizationChartHarness,
  );
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, '[data-wj-node]')).borderRadius).toBe('12px');
  return { fixture, host: fixture.componentInstance, chart, element, page };
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

/** The node harness for the node whose text is `text`. */
async function node(
  chart: WjOrganizationChartHarness,
  text: string,
): Promise<WjOrganizationChartNodeHarness> {
  const [found] = await chart.getNodes({ text });
  if (found === undefined) {
    throw new Error(`no node with the text ${text}`);
  }
  return found;
}

/** The text of the nodes on screen, from the harness, in order. */
async function texts(chart: WjOrganizationChartHarness): Promise<string[]> {
  const out: string[] = [];
  for (const shown of await chart.getNodes()) {
    out.push(await shown.getText());
  }
  return out;
}

/** The node box whose own text starts with `label`, from the DOM. */
function boxOf(element: ParentNode, label: string): HTMLElement {
  const box = parts(element, '[data-wj-node]').find((candidate) =>
    candidate.textContent.trim().startsWith(label),
  );
  if (!box) {
    throw new Error(`no node ${label}`);
  }
  return box;
}

/** The toggle of the node labelled `label`, from the DOM. */
function toggleOf(element: ParentNode, label: string): HTMLElement {
  return part(boxOf(element, label), '[data-wj-toggle]');
}

/** Emulates the user's reduced-motion preference. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

/** One Tab, then waits until focus is on `target`: the toggles are the Tab stops. */
async function tabTo(target: HTMLElement): Promise<void> {
  await userEvent.tab();
  await expect.poll(() => document.activeElement).toBe(target);
}

const STATES: { name: string; setup: (host: Host) => void }[] = [
  { name: 'a three-level chart', setup: () => undefined },
  {
    name: 'collapsible, with Engineering collapsed',
    setup: (host) => {
      host.collapsible.set(true);
      find(host.chart(), 'Engineering').expanded = false;
    },
  },
  {
    name: 'collapsible, with Engineering expanded',
    setup: (host) => {
      host.collapsible.set(true);
    },
  },
  {
    name: 'the custom-node slot',
    setup: (host) => {
      host.collapsible.set(true);
      host.withSlot.set(true);
    },
  },
];

const ALL = ['Studio', 'Design', 'Research', 'Visual', 'Engineering', 'Web', 'Mobile'];

describe('WjOrganizationChart', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await emulateReducedMotion(false);
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('value', () => {
    it('draws the root and its descendants, in document order', async () => {
      const { chart, element } = await render();

      expect(await texts(chart)).toEqual(ALL);
      expect(getComputedStyle(element).display).toBe('block');
    });

    it('draws only the first node of the array', async () => {
      const { chart } = await render('light', (host) => {
        host.chart.set([...makeChart(), { key: 'other', label: 'Other root' }]);
      });

      expect(await texts(chart)).toEqual(ALL);
    });

    it('draws nothing for an empty value', async () => {
      const { fixture, host, chart, element } = await render();

      host.chart.set([]);
      await fixture.whenStable();

      expect(await chart.getNodes()).toEqual([]);
      expect(element.querySelector('table')).toBeNull();
    });

    it('hides the children of a node that is not expanded, with or without a toggle', async () => {
      const { chart } = await render('light', (host) => {
        find(host.chart(), 'Design').expanded = false;
      });

      expect(await texts(chart)).toEqual(['Studio', 'Design', 'Engineering', 'Web', 'Mobile']);
    });

    it('keeps a toggle across a new value, by key', async () => {
      const { fixture, host, chart } = await render('light', (host) => {
        host.collapsible.set(true);
      });
      await (await node(chart, 'Engineering')).toggle();
      expect(await texts(chart)).toEqual(['Studio', 'Design', 'Research', 'Visual', 'Engineering']);

      host.chart.set(makeChart());
      await fixture.whenStable();

      expect(await texts(chart)).toEqual(['Studio', 'Design', 'Research', 'Visual', 'Engineering']);
      expect(await (await node(chart, 'Engineering')).isExpanded()).toBe(false);
    });

    it('opens a node that had no children once the app sets them on nodeExpand', async () => {
      const { fixture, host, chart } = await render('light', (host) => {
        host.collapsible.set(true);
        host.chart.set([{ key: 'root', label: 'Root', leaf: false }]);
      });
      const root = await node(chart, 'Root');
      expect(await root.isToggleable()).toBe(true);
      expect(await root.isExpanded()).toBe(false);

      await root.toggle();
      expect(host.expands.map((expanded) => expanded.label)).toEqual(['Root']);
      host.chart.set([
        { key: 'root', label: 'Root', leaf: false, children: [{ key: 'kid', label: 'Kid' }] },
      ]);
      await fixture.whenStable();

      expect(await texts(chart)).toEqual(['Root', 'Kid']);
      expect(await (await node(chart, 'Root')).isExpanded()).toBe(true);
    });
  });

  describe('slot', () => {
    it('renders its template for every node, with the app’s own node as the context', async () => {
      const { host, element, chart } = await render('light', (host) => {
        host.withSlot.set(true);
      });

      expect(await texts(chart)).toContain('StudioStudio head');
      expect(parts(element, '.name').map((name) => name.textContent)).toEqual(ALL);
      expect(parts(element, '.title').map((title) => title.textContent)).toContain('Web developer');
      for (const label of ALL) {
        expect(host.slotNodes.has(find(host.chart(), label))).toBe(true);
      }
      expect(host.slotNodes.size).toBe(7);
    });

    it('renders the label of a node whose type came from elsewhere', async () => {
      const { chart } = await render('light', (host) => {
        host.withSlot.set(true);
        const foreign = { key: 'foreign', label: 'Foreign type', type: 'person' };
        host.chart.set([{ key: 'root', label: 'Root', expanded: true, children: [foreign] }]);
      });

      expect(await texts(chart)).toEqual(['Root', 'Foreign type']);
    });

    it('draws the label with no slot given', async () => {
      const { element } = await render();

      expect(element.querySelector('.name')).toBeNull();
    });
  });

  describe('outputs', () => {
    it('emits the app’s own node on expand and on collapse, and never writes it', async () => {
      const { host, chart } = await render('light', (host) => {
        host.collapsible.set(true);
        host.chart.set(deepFreeze(makeChart()));
      });
      const before = JSON.stringify(host.chart());

      const design = await node(chart, 'Design');
      await design.toggle();
      await design.toggle();

      expect(host.collapses).toHaveLength(1);
      expect(host.expands).toHaveLength(1);
      expect(host.collapses[0]).toBe(find(host.chart(), 'Design'));
      expect(host.expands[0]).toBe(find(host.chart(), 'Design'));
      expect(JSON.stringify(host.chart())).toBe(before);
      expect(find(host.chart(), 'Design').expanded).toBe(true);
    });

    it('emits nothing from a click on the node’s own box', async () => {
      const { host, element } = await render('light', (host) => {
        host.collapsible.set(true);
      });

      await userEvent.click(part(element, '[data-wj-node]'));

      expect(host.expands).toEqual([]);
      expect(host.collapses).toEqual([]);
    });
  });

  describe('the toggle', () => {
    it('is a button named by the node’s label, with aria-expanded following each toggle', async () => {
      const { chart, element } = await render('light', (host) => {
        host.collapsible.set(true);
      });
      const engineering = await node(chart, 'Engineering');
      const toggle = toggleOf(element, 'Engineering');

      expect(toggle.getAttribute('role')).toBe('button');
      expect(toggle.getAttribute('aria-label')).toBe('Engineering');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(await engineering.getToggleLabel()).toBe('Engineering');
      expect(await engineering.isExpanded()).toBe(true);

      await engineering.toggle();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(await engineering.isExpanded()).toBe(false);

      await engineering.toggle();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.getAttribute('aria-label')).toBe('Engineering');
    });

    it('is named Collapse or Expand by state when the node has no label', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
        host.withSlot.set(true);
        host.chart.set([
          {
            key: 'root',
            data: { title: 'Nobody' },
            expanded: true,
            children: [{ key: 'kid', label: 'Kid' }],
          },
        ]);
      });
      const toggle = part(element, '[data-wj-toggle]');

      expect(toggle.getAttribute('aria-label')).toBe('Collapse');
      await userEvent.click(toggle);
      await expect.poll(() => toggle.getAttribute('aria-label')).toBe('Expand');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('is on every node that has children, and only when collapsible', async () => {
      const { element, chart, host, fixture } = await render('light', (host) => {
        host.collapsible.set(true);
      });

      expect(parts(element, '[data-wj-toggle]')).toHaveLength(3);
      for (const label of ['Studio', 'Design', 'Engineering']) {
        expect(await (await node(chart, label)).isToggleable()).toBe(true);
      }
      for (const label of ['Research', 'Visual', 'Web', 'Mobile']) {
        const leaf = await node(chart, label);
        expect(await leaf.isToggleable()).toBe(false);
        expect(await leaf.getToggleLabel()).toBeNull();
        expect(await leaf.isExpanded()).toBe(false);
      }

      host.collapsible.set(false);
      await fixture.whenStable();
      expect(parts(element, '[data-wj-toggle]')).toHaveLength(0);
    });

    it('is at least 24 by 24 px', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
      });

      for (const toggle of parts(element, '[data-wj-toggle]')) {
        const { width, height } = toggle.getBoundingClientRect();
        expect(width).toBeGreaterThanOrEqual(24);
        expect(height).toBeGreaterThanOrEqual(24);
      }
    });

    it('renders its new state with no app code to mark it, zoneless', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
      });
      const toggle = toggleOf(element, 'Design');
      const research = boxOf(element, 'Research');

      await userEvent.click(toggle);

      await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('false');
      expect(getComputedStyle(research).visibility).toBe('hidden');
      await userEvent.click(toggle);
      await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
      expect(getComputedStyle(research).visibility).toBe('visible');
    });
  });

  describe('connectors', () => {
    it('are hidden from assistive tech, and the nodes are not', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
      });

      const hidden = parts(element, 'tr[aria-hidden="true"]');
      expect(hidden).toHaveLength(14);
      for (const row of hidden) {
        expect(row.querySelector('[data-wj-node]')).toBeNull();
      }
      for (const box of parts(element, '[data-wj-node]')) {
        expect(box.closest('[aria-hidden="true"]')).toBeNull();
      }
    });
  });

  describe('connector colour', () => {
    it.each<Scheme>(['light', 'dark'])(
      'is the control-boundary step, 3:1 or better, in %s',
      async (scheme) => {
        const { element } = await render(scheme);
        const line = part(element, 'tr[aria-hidden="true"] div');
        const probe = document.createElement('i');
        probe.style.backgroundColor = 'var(--wj-form-field-border-color)';
        element.append(probe);

        expect(getComputedStyle(line).backgroundColor).toBe(
          getComputedStyle(probe).backgroundColor,
        );
        expect(getComputedStyle(line).height).toBe('24px');
        probe.remove();
      },
    );
  });

  describe('pt', () => {
    // Optimus 2.0.2 hands the root node the chart's `pt` and every node below it none (FR-51
    // proved this: see the notes in organizationchart.ts), so `pt` is asserted where it lands, and
    // the wrapper's own attributes where `pt` cannot reach.
    it('reaches the chart and its root node, as an object, and the wrapper’s attributes win', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
        host.pt.set({
          node: { 'data-probe': 'node' },
          nodeToggleButton: { 'data-probe': 'toggle', role: 'link' },
          connectors: { 'data-probe': 'line' },
          root: { 'data-probe': 'root' },
        });
      });

      expect(element.querySelector('[data-probe="root"]')).not.toBeNull();
      const [first] = parts(element, '[data-wj-node]');
      expect(parts(element, '[data-probe="node"]')).toEqual([first]);
      const [toggle] = parts(element, '[data-wj-toggle]');
      expect(parts(element, '[data-probe="toggle"]')).toEqual([toggle]);
      expect(toggle?.getAttribute('role')).toBe('button');
      expect(parts(element, 'tr[data-probe="line"]')).toHaveLength(2);
      for (const row of parts(element, 'tr[data-probe="line"]')) {
        expect(row.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('reaches the chart and its root node, as a function, and per part as a function', async () => {
      const { element, fixture, host } = await render('light', (host) => {
        host.collapsible.set(true);
        host.pt.set((chart) => ({
          root: { 'data-probe': typeof chart.instance },
          node: (context) => ({ 'data-label': labelOf(context.instance) }),
          nodeToggleButton: { 'data-probe': 'toggle' },
        }));
      });

      expect(element.querySelector('[data-probe="object"]')).not.toBeNull();
      expect(parts(element, '[data-label]').map((box) => box.dataset['label'])).toEqual(['Studio']);
      expect(parts(element, '[data-probe="toggle"]')).toHaveLength(1);

      host.pt.set({
        node: (context) => ({ 'data-label': `by part: ${labelOf(context.instance)}` }),
      });
      await fixture.whenStable();
      expect(parts(element, '[data-label]').map((box) => box.dataset['label'])).toEqual([
        'by part: Studio',
      ]);
    });

    it('lands after a toggle, a new value and a new pt, and the wrapper’s attributes stay on every node', async () => {
      const { fixture, host, element, chart } = await render('light', (host) => {
        host.collapsible.set(true);
        host.pt.set({ node: { 'data-probe': 'one' } });
      });

      await (await node(chart, 'Engineering')).toggle();
      expect(parts(element, '[data-probe="one"]')).toHaveLength(1);

      host.chart.set(makeChart());
      await fixture.whenStable();
      expect(parts(element, '[data-probe="one"]')).toHaveLength(1);

      host.pt.set({ node: { 'data-probe': 'two' } });
      await fixture.whenStable();
      expect(parts(element, '[data-probe="two"]')).toHaveLength(1);
      expect(parts(element, '[data-probe="one"]')).toHaveLength(0);
      expect(parts(element, '[data-wj-node]')).toHaveLength(7);
      expect(parts(element, '[data-wj-toggle]')).toHaveLength(3);
    });

    it('does not reach a node below the root: the gap the docs list', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
        host.pt.set({ node: { 'data-probe': 'node' } });
      });

      const boxes = parts(element, '[data-wj-node]');
      expect(boxes).toHaveLength(7);
      expect(boxes.filter((box) => box.dataset['probe'] === 'node')).toHaveLength(1);
    });
  });

  describe('keyboard', () => {
    /** Puts focus on the Before button. */
    function start({ page }: Rendered): void {
      part(page, '#before').focus();
    }

    it('tabs through the visible toggles in document order', async () => {
      const rendered = await render('light', (host) => {
        host.collapsible.set(true);
      });
      start(rendered);
      const { element, page } = rendered;

      await tabTo(toggleOf(element, 'Studio'));
      await tabTo(toggleOf(element, 'Design'));
      await tabTo(toggleOf(element, 'Engineering'));
      await tabTo(part(page, '#after'));
    });

    it('draws the 2 px preset ring on a toggle reached by Tab', async () => {
      const rendered = await render('light', (host) => {
        host.collapsible.set(true);
      });
      start(rendered);
      const toggle = toggleOf(rendered.element, 'Studio');

      await tabTo(toggle);

      const ring = getComputedStyle(toggle);
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');
    });

    it('does not reach the toggle of a collapsed branch', async () => {
      const rendered = await render('light', (host) => {
        host.collapsible.set(true);
        host.chart.set(makeDeepChart());
      });
      start(rendered);
      const { element, page } = rendered;

      await tabTo(toggleOf(element, 'Studio'));
      await tabTo(toggleOf(element, 'Design'));
      await tabTo(toggleOf(element, 'Engineering'));
      await tabTo(toggleOf(element, 'Mobile'));
      await userEvent.tab({ shift: true });
      await expect.poll(() => document.activeElement).toBe(toggleOf(element, 'Engineering'));

      await userEvent.keyboard('{Enter}');
      await expect
        .poll(() => toggleOf(element, 'Engineering').getAttribute('aria-expanded'))
        .toBe('false');
      await tabTo(part(page, '#after'));
    });

    it('toggles on Enter and on Space, and Space does not scroll the page', async () => {
      const rendered = await render('light', (host) => {
        host.collapsible.set(true);
      });
      start(rendered);
      const { host, element } = rendered;
      const design = toggleOf(element, 'Design');
      await tabTo(toggleOf(element, 'Studio'));
      await tabTo(design);
      const top = window.scrollY;

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => design.getAttribute('aria-expanded')).toBe('false');
      await userEvent.keyboard(' ');
      await expect.poll(() => design.getAttribute('aria-expanded')).toBe('true');

      expect(window.scrollY).toBe(top);
      expect(host.collapses.map((collapsed) => collapsed.label)).toEqual(['Design']);
      expect(host.expands.map((expanded) => expanded.label)).toEqual(['Design']);
      expect(document.activeElement).toBe(design);
    });
  });

  describe('reduced motion', () => {
    it('keeps Aura’s 0.2s colour transitions, and drops them to 0s under reduce', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
      });
      const toggle = toggleOf(element, 'Studio');
      const box = part(element, '[data-wj-node]');
      const durations = (target: HTMLElement): string[] =>
        getComputedStyle(target).transitionDuration.split(', ');

      expect(durations(toggle)).toContain('0.2s');
      expect(durations(box)).toContain('0.2s');

      await emulateReducedMotion(true);

      await expect.poll(() => durations(toggle).every((duration) => duration === '0s')).toBe(true);
      expect(durations(box).every((duration) => duration === '0s')).toBe(true);
    });
  });

  describe('rendering safety', () => {
    it('renders a payload in a label as text, and in the toggle’s name as an attribute', async () => {
      const { element } = await render('light', (host) => {
        host.collapsible.set(true);
        host.chart.set([
          {
            key: 'root',
            label: PAYLOAD,
            expanded: true,
            children: [{ key: 'kid', label: PAYLOAD }],
          },
        ]);
      });

      expect(part(element, '[data-wj-node]').textContent).toContain(PAYLOAD);
      expect(part(element, '[data-wj-toggle]').getAttribute('aria-label')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders a payload in slot data as text', async () => {
      const { element } = await render('light', (host) => {
        host.withSlot.set(true);
        host.chart.set([{ key: 'root', label: 'Root', data: { title: PAYLOAD } }]);
      });

      expect(part(element, '.title').textContent).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup', () => {
    it('warns WJ0003 once, with the default advice, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-organizationchart: aria-label is set on the host, where it is not forwarded ' +
          'to the focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input ' +
          'instead. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the value is given', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(PlainHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility (axe)', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const state of STATES) {
        it(`has no violations: ${state.name}, ${scheme}`, async () => {
          const rendered = await render(scheme, state.setup);

          await expectNoAxeViolations(rendered.element);
        });
      }
    }

    it('has no violations with a toggle focused, dark', async () => {
      const rendered = await render('dark', (host) => {
        host.collapsible.set(true);
      });
      part(rendered.page, '#before').focus();
      await tabTo(toggleOf(rendered.element, 'Studio'));

      await expectNoAxeViolations(rendered.element);
    });
  });
});
