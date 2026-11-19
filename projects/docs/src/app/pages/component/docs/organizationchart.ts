import { OrganizationChartBasicExample } from '../../../examples/organizationchart/basic';
import { OrganizationChartCollapsibleExample } from '../../../examples/organizationchart/collapsible';
import { OrganizationChartCustomNodeExample } from '../../../examples/organizationchart/custom-node';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'organizationchart',
  title: 'Organization chart',
  purpose:
    "Shows a hierarchy, such as a team, as a tree of boxes joined by lines. Import `WjOrganizationChart` from `weeljack-ng/organizationchart` and give `wj-organizationchart` its `value`: one root node of `WjTreeNode` (imported `from 'weeljack-ng'`) with its `children` nested. Your nodes are never written, because Optimus renders copies of them. With `collapsible`, each node that has children shows a toggle. A `wjOrganizationChartNode` template says what each node shows.",
  optimusSelector: 'p-organizationChart',
  examples: [
    {
      title: 'Basic',
      description:
        'Labels only: “Studio” over “Design” (Research, Visual) and “Engineering” (Web, Mobile), every branch `expanded`. The chart sits in a scrolling region of its own, with `overflow-x: auto`, `tabindex="0"`, a role and a name: `wj-organizationchart` adds no width, overflow or scrolling, so a chart wider than its container overflows it, and the app decides how to hold it. A branch shows its children only while its node has `expanded: true`.',
      sourceKey: 'organizationchart/basic',
      component: OrganizationChartBasicExample,
    },
    {
      title: 'Collapsible',
      description:
        'The same data with `collapsible`: each node with children has a 24 × 24 px round toggle on its bottom edge. Engineering starts collapsed, so both states show at once. `nodeExpand` and `nodeCollapse` carry your own node, the very object in `value`; the line under the chart logs the last one. A collapsed branch is hidden in place and keeps its space, so the chart never moves when a branch opens or closes. Nodes have a `key`, so a toggled branch keeps its state when you set a new `value`.',
      sourceKey: 'organizationchart/collapsible',
      component: OrganizationChartCollapsibleExample,
    },
    {
      title: 'Custom node',
      description:
        'A `wjOrganizationChartNode` template renders every node, with your own node as `let-node`: `[wjOrganizationChartNodeOf]` types it from your nodes, so `node.data?.title` is a `string` under strict templates. It replaces only the label: the box, its padding, its border and its toggle stay Optimus’s. Give the template at creation, because Optimus reads it once. A node that carries a `type` from elsewhere shows its `label` instead.',
      sourceKey: 'organizationchart/custom-node',
      component: OrganizationChartCustomNodeExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjOrganizationChartHarness` and `WjOrganizationChartNodeHarness` from `weeljack-ng/organizationchart/testing` to drive a chart without touching its DOM. `getNodes({ text })` returns the nodes on screen, in document order, and leaves out those in a collapsed branch. A node harness reads `getText()`, `isToggleable()`, `isExpanded()` and `getToggleLabel()`, and presses its toggle with `toggle()`.',
      sourceKey: 'organizationchart/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves through the expand and collapse toggles, in document order. The toggles of a collapsed branch are not reachable.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Expands or collapses the branch, and fires `nodeExpand` or `nodeCollapse`. Space does not scroll the page.',
    },
  ],
  aria: [
    'The toggle is a `role="button"` named by its node’s `label`, or by "Expand" or "Collapse" (the translation’s `aria.expandLabel` and `aria.collapseLabel`) when the node has no label, with `aria-expanded` following each toggle. Optimus renders it as an `<a tabindex="0">` with no role, name or state, so `wj-organizationchart` sets them. A node you give no `label` and show through a template needs the label for a good name.',
    'The connector lines are decorative: they are `aria-hidden`. Their colour is `{surface.500}` in both schemes, at least 3:1 against the page and the card (WCAG 1.4.11), where Aura’s `{content.border.color}` read about 1.3:1. The toggle’s chevron already passes, at 4.8:1 in light and 6.9:1 in dark. The node borders take the same `{surface.500}`; the toggle ring stays Aura’s.',
    'Gap: Optimus draws the chart as nested layout tables, which assistive technology reads as a flat sequence, each node before its children. The reporting lines are not exposed. Put the relationship in the node text if a reader needs it (for example "reports to …").',
    'Gap: selection is not offered. Optimus’s selectable node is a click-only `div` with no Tab stop, role or selected state, so it would work by pointer only (WCAG 2.1.1), and making the node a control would nest the toggle inside it.',
    'Optimus draws only the first node of `value`: give it one root.',
    'To load children when a node opens, mark it `leaf: false` so it shows a toggle, add its children on `nodeExpand`, and set `value` to a new array through a signal. A node with a `key` stays open when `value` changes, a node without one does not.',
    'Without `collapsible`, a branch shows its children only when its node has `expanded: true`, and there is no toggle to open it.',
    'A wide chart scrolls sideways: put it in your own scrolling container with `tabindex="0"`, a role and a name, as these examples do. Labels wrap at spaces before it scrolls.',
    'A collapsed branch keeps its space, so the chart never moves when a branch opens or closes. Expanding and collapsing are instant; the colour transitions on nodes and toggles drop to 0 s under reduced motion.',
    'A node’s `label` and your template’s data render as text, never as HTML, and the toggle’s name is an attribute value.',
    'Gap: Optimus 2.0.2 hands the `pt` of each node table to the table below it as a signal it reads once, so `pt` reaches the chart’s own parts and the root node’s, and no node below the root. What each node must say is written on the DOM instead, for every level, by an observer on the chart: the `data-wj-node` hook, the toggle’s role, name, state and hook, and the connectors’ `aria-hidden`. It runs in the browser only: a prerendered chart has Optimus’s attributes until the client takes over (hydration is not claimed).',
    'The toggle is not a form control, and `aria-*` written on the `wj-organizationchart` host is not forwarded: there are no ARIA inputs, and it raises `WJ0003` in development.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome, to check what is announced for the nested tables) are recorded on this page before W5d’s release.',
  ],
  stylingIntro:
    'The host is a block with no box of its own. Optimus’s tables, nodes, toggles and connectors come from the preset and the `--wj-*` variables that `provideWeeljack` emits: nodes have the content background, a 1 px border and a 12 px radius; connectors are 24 px tall, 1 px wide and `{surface.500}`; the toggle takes the preset’s 2 px focus ring. For anything else, `pt` reaches the parts of the Optimus chart underneath, with two limits: it reaches the chart and its root node only (see Accessibility), and the attributes of every node and toggle are written on the DOM and win over `pt`. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-organizationchart`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The Optimus `p-organizationchart` element.' },
    { part: 'table', description: 'The root table of the chart.' },
    { part: 'body', description: 'The `tbody` of a node’s table.' },
    { part: 'row', description: 'The row that holds a node.' },
    { part: 'cell', description: 'The cell that holds a node.' },
    {
      part: 'node',
      description: 'The box of a node, where the `wjOrganizationChartNode` template goes.',
    },
    {
      part: 'nodeToggleButton',
      description: 'The expand and collapse toggle: a `role="button"` named by the node.',
    },
    { part: 'nodeToggleButtonIcon', description: 'The chevron in the toggle.' },
    {
      part: 'connectors',
      description: 'A row of connector lines, hidden from assistive technology.',
    },
    { part: 'lineCell', description: 'The cell of a connector row that holds the vertical line.' },
    { part: 'connectorDown', description: 'The vertical line from a node to its children.' },
    { part: 'connectorLeft', description: 'The left half of the bar above a child.' },
    { part: 'connectorRight', description: 'The right half of the bar above a child.' },
    { part: 'nodeChildren', description: 'The row that holds a node’s children.' },
    { part: 'nodeCell', description: 'The cell that holds one child’s table.' },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'A `WjTreeNode<T>[]` (from `weeljack-ng`); `T` is inferred. Optimus renders `value[0]` only: one root. Optimus gets copies, so your nodes are never written.',
    },
    {
      optimus: 'collapsible',
      weeljack: 'collapsible',
      status: 'kept',
      note: 'Shows a toggle on each node that has children, or `leaf: false`.',
    },
    {
      optimus: 'onNodeExpand, onNodeCollapse',
      weeljack: 'nodeExpand, nodeCollapse',
      status: 'renamed',
      note: 'Narrowed from `{ originalEvent, node }` to the node: your own object.',
    },
    {
      optimus: 'node templates, keyed by node.type',
      weeljack: 'wjOrganizationChartNode',
      status: 'renamed',
      note: 'One typed slot for every node, context `WjOrganizationChartNodeContext` (your own node). Type its `let-node` with `[wjOrganizationChartNodeOf]`. A node with a foreign `type` renders its `label`.',
    },
    dropped(
      'selectionMode, selection, selectionChange, onNodeSelect, onNodeUnselect',
      'First cut. Optimus’s selectable node is a click-only `div` with no Tab stop, role or selected state, so selection would be pointer-only (WCAG 2.1.1). Making the node a control would nest the toggle inside it.',
    ),
    dropped('togglericon template', 'Icon slots are not exposed (02 Q6).'),
    dropped('preserveSpace', 'Deprecated since Optimus v20.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjOrganizationChartPt`. Tracks Optimus. Reaches the chart and its root node.',
    },
    dropped(
      'styleClass, dt, unstyled, ptOptions, OrganizationChartModule',
      'Never exposed on any wrapper (ADR 0002).',
    ),
  ],
};
