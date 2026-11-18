import { TreeBasicExample } from '../../../examples/tree/basic';
import { TreeCheckboxExample } from '../../../examples/tree/checkbox';
import { TreeCustomNodesExample } from '../../../examples/tree/custom-nodes';
import { TreeEmptyAndLoadingExample } from '../../../examples/tree/empty-and-loading';
import { TreeLazyChildrenExample } from '../../../examples/tree/lazy-children';
import { TreeSingleAndMultipleExample } from '../../../examples/tree/single-and-multiple';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';
const droppedIcon = 'Icon slots are not exposed (02 Q6).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'tree',
  title: 'Tree',
  purpose:
    "Shows hierarchical data as an expandable tree, with optional single, multiple or checkbox selection. Give `wj-tree` its `value`, nodes of `WjTreeNode` (imported `from 'weeljack-ng'`), and give every node a `key`: a node with a key keeps its expansion, its keyboard focus and its selection when you set a new `value`. `selection` and `expandedKeys` are two-way models that always hold your own nodes and keys, in new arrays and maps; your tree is never written, because Optimus renders copies of it. `selectionMode` takes `single`, `multiple` or `checkbox` (`WjTreeSelectionMode`, also `from 'weeljack-ng'`). A `wjTreeNode` template says what each node shows. The tree is a list: name it with `ariaLabel`, or point `ariaLabelledBy` at a visible heading.",
  examples: [
    {
      title: 'Basic',
      description:
        'A file tree in a 24rem column, named “Files”. `[(expandedKeys)]` is a map of node `key` to open or closed: Documents starts open, and every toggle, by pointer or by ArrowRight and ArrowLeft, writes a new map. A node with no `key` still toggles on screen, but nothing is written for it, and a later new `value` resets it to its own `expanded`. Labels wrap, and are never cut.',
      sourceKey: 'tree/basic',
      component: TreeBasicExample,
    },
    {
      title: 'Custom nodes',
      description:
        'A `wjTreeNode` template renders every node, with your own node as `let-node`: `[wjTreeNodeOf]` types it from your nodes, so `node.data?.items` is a `number` under strict templates. Here a decorative glyph (`aria-hidden`), the label and, for folders, a muted count. Muted text is for a tree with no selection: on a hover or a picked node it falls under 4.5:1. The template renders inside the node’s label, and the node is named from what it shows. Give the template at creation: Optimus reads it once. A node that carries a `type` from elsewhere shows its `label` instead.',
      sourceKey: 'tree/custom-nodes',
      component: TreeCustomNodesExample,
    },
    {
      title: 'Single and multiple selection',
      description:
        'Two trees, 24px apart, each with a state line. In `single` mode a click, Enter or Space picks a node and another click drops it; in `multiple` mode each node toggles on its own. `selection` is always an array of your own nodes, with at most one in `single` mode. Archive is `selectable: false`: it opens, but cannot be picked, gets no hover and is not dimmed. Optimus does not announce it as unselectable.',
      sourceKey: 'tree/single-and-multiple',
      component: TreeSingleAndMultipleExample,
    },
    {
      title: 'Checkbox selection',
      description:
        'Checking a folder checks everything in it, and checking part of one marks it partly checked, with Optimus’s minus. `selection` lists every checked node, parents included, once per click. A selection set from code checks the nodes but draws no partial mark: that is why nothing is checked at rest here. A checked node takes no fill, since the checkbox carries the state.',
      sourceKey: 'tree/checkbox',
      component: TreeCheckboxExample,
    },
    {
      title: 'Lazy children',
      description:
        'Three folders marked `leaf: false` show a toggle with no children. On `nodeExpand` the example sets the tree-wide `loading`, waits about 400 ms for a simulated server, and sets a new `value` in which that folder has its files. The folder stays open and focused, because its node has a `key`: the wrapper wrote `expandedKeys`, and Optimus tracks the node by key. There is no per-node spinner in this version.',
      sourceKey: 'tree/lazy-children',
      component: TreeLazyChildrenExample,
    },
    {
      title: 'Empty and loading',
      description:
        'With no nodes the tree shows the translation’s `emptyMessage`, or a `wjTreeEmpty` template instead: here “No folders yet.”, in the muted colour. `loading` covers the tree with Optimus’s mask and spinner and sets `aria-busy` on the list; an empty tree that loads is at least 3rem tall and shows no empty text. The spinner stops under reduced motion.',
      sourceKey: 'tree/empty-and-loading',
      component: TreeEmptyAndLoadingExample,
    },
    {
      title: 'Testing with the harness',
      description:
        "Import `WjTreeHarness` and `WjTreeNodeHarness` from `weeljack-ng/tree/testing` to drive a tree without touching its DOM. `WjTreeHarness.with({ name })` finds a tree by its name; `getNodes({ text, level })` returns the nodes on screen, in order, and `getNodeTexts()`, `isEmpty()`, `getEmptyText()` and `isLoading()` describe it. A node harness reads `getText()`, `getLevel()`, `isExpandable()`, `isExpanded()`, `isSelected()`, `isChecked()` and `isPartiallyChecked()`, and acts with `expand()`, `collapse()`, `select()` and `focus()`. A tree with no nodes has no list to carry a name, so it matches the name `''` only.",
      sourceKey: 'tree/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves into the tree at its first node, or at the selected node when that node is below the first level, and out of it. The toggles and the checkboxes are not Tab stops.',
    },
    { key: 'ArrowDown, ArrowUp', effect: 'Moves to the next or the previous visible node.' },
    {
      key: 'ArrowRight',
      effect:
        'Expands a collapsed node, then moves focus to its first child; on an open node it does nothing. `nodeExpand` fires. Optimus moves the focus a moment after the expansion.',
    },
    {
      key: 'ArrowLeft',
      effect:
        'Collapses an expanded node, and fires `nodeCollapse`; on a collapsed node it moves focus to its parent.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Selects the focused node, or drops it when it is selected; in `checkbox` mode, checks or unchecks it, with its descendants. Does nothing on a node that is `selectable: false`, or when `selectionMode` is unset.',
    },
  ],
  aria: [
    'The list is `role="tree"` and each node a `treeitem`, with its level, position and set size. Name the tree: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading, and `ariaDescribedBy` at a description. All three land on the list, not on the `wj-tree` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML.',
    'Fixed in the component, because Optimus 2.0.2 gets them wrong: each node’s set size is the number of its siblings (Optimus sets its own child count, so a leaf read “1 of 0”); a node that can open says `aria-expanded="false"` while it is closed (Optimus leaves the attribute off until the first toggle); and the toggle and the checkbox of every node are hidden from assistive tech, since the treeitem already states what they do. They stay out of the Tab order and keep their pointer behaviour.',
    'A node is named from what it shows, not from its `label`. Optimus sets `aria-label` to the label, but an open node contains its children, so a name of only its own label does not contain the text on screen (WCAG 2.5.3, axe `label-content-name-mismatch`), and the component removes it. The cost is that a screen reader may read an open branch with its children. Keep the first text of a custom node meaningful on its own.',
    'These are written on the rendered nodes of every level by an observer on the tree, because Optimus hands the nodes below the first level no `pt`. It runs in the browser only: a prerendered tree has the Optimus attributes until the client takes over (hydration is not claimed).',
    'Gap: a node that is `selectable: false` is not announced as such. Optimus sets no `aria-disabled`, and one would read as “unavailable” on a node that still opens.',
    'Gap: a partly checked node is announced as not checked: Optimus draws the minus on the checkbox but leaves `aria-checked="false"` on the treeitem. The harness reads the checkbox for `isPartiallyChecked()`.',
    'Gap: a selection set from code checks and selects the nodes, but a parent’s partial mark is drawn only while Optimus propagates a click, so it is not redrawn.',
    'Gap: Home, End, type-ahead and `*` are not handled. Tab enters at the first node, unless the selected node is below the first level: a selected root node is reached with the arrow keys.',
    'Gap: `selectionMode` is read when the tree is created. Optimus’s rendered nodes do not follow a later change, so a checkbox mode set afterwards draws no checkboxes: set it at creation.',
    'Gap: `pt` reaches the tree’s own parts and the parts of the first level of nodes only. Optimus hands the nodes below no `pt`, so `node`, `nodeLabel` and the like change nothing there.',
    'Gap: the English `emptyMessage` reads “No available options”, which suits a picker better than a tree. Set `translation: { emptyMessage }` in `provideWeeljack`, or give a `wjTreeEmpty` template.',
    'Expanding and collapsing are instant, and `wj-tree` adds no animation. The loading spinner stops under reduced motion.',
    'Give every node a `key`, unique in the tree. A node without one toggles on screen only and loses its state on a new `value`.',
    'Cap a long tree’s height on the host (`max-block-size` and `overflow: auto`). Give slots at creation: Optimus reads the node template once, though a `wjTreeEmpty` template can appear later.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host is a block with no box of its own, and Optimus’s tree, its rows, toggles and checkboxes come from the preset and the `--wj-*` variables that `provideWeeljack` emits. A picked node takes the highlight fill, and a checked one takes none; the focus ring on a picked node turns the highlight colour so it stays visible. For anything else, `pt` reaches the parts of the Optimus tree underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-tree`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby` and `aria-busy` on the `rootChildren` part are set by the component and win over a `pt` value of the same name; the attributes of a node are written on the DOM and win over `pt` too. `pt` reaches only the first level of nodes.',
  parts: [
    { part: 'host', description: 'The Optimus `p-tree` element.' },
    { part: 'root', description: 'The tree’s root element.' },
    { part: 'mask', description: 'The loading mask over the tree.' },
    { part: 'loadingIcon', description: 'The spinner in the loading mask.' },
    { part: 'wrapper', description: 'The element that scrolls the list.' },
    {
      part: 'rootChildren',
      description: 'The `role="tree"` list. Takes the routed `aria-describedby` and `aria-busy`.',
    },
    { part: 'node', description: 'One node, a `treeitem`. First level only.' },
    { part: 'nodeContent', description: 'The row of a node: toggle, checkbox and label.' },
    { part: 'nodeToggleButton', description: 'The toggle button, hidden from assistive tech.' },
    { part: 'nodeTogglerIcon', description: 'The chevron in the toggle.' },
    { part: 'pcNodeCheckbox', description: 'The checkbox of a node, in `checkbox` mode.' },
    {
      part: 'nodeLabel',
      description: 'The label of a node, where the `wjTreeNode` template goes.',
    },
    { part: 'nodeChildren', description: 'The list of a node’s children.' },
    { part: 'emptyMessage', description: 'The empty message, or the `wjTreeEmpty` template.' },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'A `WjTreeNode<T>[]` (from `weeljack-ng`); `T` is inferred. Optimus gets copies, so your nodes are never written.',
    },
    {
      optimus: 'selectionMode',
      weeljack: 'selectionMode',
      status: 'kept',
      note: '`single`, `multiple` or `checkbox` (`WjTreeSelectionMode`). Unset: no selection.',
    },
    {
      optimus: 'selection, selectionChange',
      weeljack: 'selection',
      status: 'renamed',
      note: 'A `model<WjTreeNode<T>[]>`: always an array of your own nodes, at most one in `single` mode.',
    },
    dropped('onNodeSelect, onNodeUnselect', 'The `selection` model covers them.'),
    dropped('metaKeySelection', 'Stays `false`: a click toggles.'),
    dropped(
      'propagateSelectionUp, propagateSelectionDown',
      'By need: Optimus’s default (both on) applies in `checkbox` mode.',
    ),
    {
      optimus: 'None',
      weeljack: 'expandedKeys',
      status: 'added',
      note: 'A `model<Record<string, boolean>>`: which nodes are open, by `key`. A new map on every toggle.',
    },
    {
      optimus: 'onNodeExpand, onNodeCollapse',
      weeljack: 'nodeExpand, nodeCollapse',
      status: 'renamed',
      note: 'Outputs that carry your own node, from the pointer and from the keyboard.',
    },
    {
      optimus: 'loading',
      weeljack: 'loading',
      status: 'kept',
      note: 'Optimus’s mask, plus `aria-busy="true"` on the list.',
    },
    dropped('loadingMode, loadingIcon, loadingicon template', 'Mask only; ' + droppedIcon),
    dropped('emptyMessage', 'Comes from the translation (22 Q8), which `provideWeeljack` fills.'),
    {
      optimus: 'empty template',
      weeljack: 'wjTreeEmpty',
      status: 'renamed',
      note: 'A typed slot with no context.',
    },
    {
      optimus: 'node templates, keyed by node.type',
      weeljack: 'wjTreeNode',
      status: 'renamed',
      note: 'One typed slot for every node, context `WjTreeNodeContext` (your own node). Type its `let-node` with `[wjTreeNodeOf]`.',
    },
    dropped('header, footer templates', 'Content around the host is your layout.'),
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'On the `role="tree"` list.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'On the same list, through `pt`.',
    },
    dropped(
      'togglerAriaLabel',
      'Optimus never renders it: the toggle is hidden from assistive tech instead.',
    ),
    dropped(
      'filter, filterBy, filterMode, filterPlaceholder, filterLocale, filterInputAutoFocus, filterOptions, filteredNodes, onFilter, resetFilter(), filter and filtericon templates',
      'Deferred: filtering returns as an additive minor.',
    ),
    dropped(
      'draggableNodes, droppableNodes, draggableScope, droppableScope, validateDrop, onNodeDrop',
      'Deferred: drag alone fails WCAG 2.5.7, and a single-pointer alternative comes with it. `TreeDragDropService` stays inside the wrapper and is never reached.',
    ),
    dropped(
      'contextMenu, contextMenuSelection, contextMenuSelectionMode, onNodeContextMenuSelect',
      'Waits for `wj-contextmenu` to take a tree.',
    ),
    dropped('onNodeDoubleClick', 'Pointer only.'),
    dropped(
      'virtualScroll, virtualScrollItemSize, virtualScrollOptions, lazy, indentation, onLazyLoad, onScroll, onScrollIndexChange, scrollToVirtualIndex(), scrollTo(), loader template',
      'By need. Children load lazily through `leaf: false` and `nodeExpand` instead.',
    ),
    dropped(
      'scrollHeight',
      'Size the host with `class` or `style`: `max-block-size` and `overflow: auto`.',
    ),
    dropped(
      'trackBy',
      'Set inside the wrapper, by `key`, so a new `value` keeps the rendered nodes.',
    ),
    dropped('highlightOnSelect', 'By need.'),
    dropped('togglericon, checkboxicon templates', droppedIcon),
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjTreePt`.' },
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('getBlockableElement()', 'Not exposed. The host element is the tree.'),
  ],
};
