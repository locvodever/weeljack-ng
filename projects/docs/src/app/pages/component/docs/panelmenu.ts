import { PanelmenuBasicExample } from '../../../examples/panelmenu/basic';
import { PanelmenuInitiallyExpandedExample } from '../../../examples/panelmenu/initially-expanded';
import { PanelmenuItemSlotExample } from '../../../examples/panelmenu/item-slot';
import { PanelmenuMultipleExample } from '../../../examples/panelmenu/multiple';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'panelmenu',
  title: 'Panel menu',
  purpose: 'Collapsible panels of nested links, for side navigation.',
  optimusSelector: 'p-panelMenu',
  examples: [
    {
      title: 'Basic',
      description:
        'Items are `WjMenuItem` objects (plain objects; the Menu page at `/components/menu` describes the type and `WjMenuItemCommandEvent`). Each root item is a panel, shown as a header, and its `items` are the links inside it: those can nest further. Opening a panel closes the one that is open. Wrap the menu in your own `<nav aria-label="...">`: the menu has no name of its own and no ARIA inputs. A label is text, never HTML. To change the menu, replace the array: the menu reads the array when it changes, not while you edit it, and it never changes your objects. These items run a `command`, which is how a link navigates: call your router from it. `routerLink`, `queryParams` and `fragment` are not supported here (see Accessibility).',
      sourceKey: 'panelmenu/basic',
      component: PanelmenuBasicExample,
    },
    {
      title: 'Multiple',
      description:
        'The same model with `multiple`: panels open independently, and none is open at rest. Open two of them. Both stay open until you close them.',
      sourceKey: 'panelmenu/multiple',
      component: PanelmenuMultipleExample,
    },
    {
      title: 'Initially expanded',
      description:
        '`expanded: true` on a root item opens its panel at first render (on a nested parent it would open its items too): here Components is open and its Form and Data groups are left closed to open. The open state is kept on copies of your items, so toggling never changes your objects, and it holds while you keep passing the same array. Pass a new array and every panel goes back to its items’ own `expanded` value.',
      sourceKey: 'panelmenu/initially-expanded',
      component: PanelmenuInitiallyExpandedExample,
    },
    {
      title: 'Item slot',
      description:
        'Put an `ng-template` marked `wjPanelMenuItem` inside the menu (import `WjPanelMenuItemSlot`: without it the template is silently dropped) and the menu draws it for every panel header and every nested item, in place of its own chevron and label. `let-item` is your own item object. Draw the item’s `label` as visible text and add no link or button of your own: the menu wraps your template in the item’s link. The slot replaces the chevron, and the template is not told whether its item is open, so a slotted header cannot show open or closed: draw a mark that does not depend on it. Give the menu its slot when it is created: a slot added afterwards is not picked up.',
      sourceKey: 'panelmenu/item-slot',
      component: PanelmenuItemSlotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjPanelMenuHarness` from `weeljack-ng/panelmenu/testing`. `getPanelLabels()` reads the headers, `getPanels()` finds the panels (each a `WjPanelMenuPanelHarness` with `getLabel()`, `isExpanded()`, `isDisabled()`, `toggle()`, `focus()`, `isFocused()`, `getItems()` and `getItemLabels()`), `getItems()` finds the items that are on the page across every open panel (each a `WjPanelMenuItemHarness` with `getLabel()`, `isDisabled()`, `isActive()`, `hasSubmenu()`, `isExpanded()` and `click()`), and `clickItem()` runs one by its label. The items of a panel are on the page only while it is open: call `toggle()` first. Nothing here names an Optimus class.',
      sourceKey: 'panelmenu/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Each panel header is a Tab stop. In an open panel, each item’s link is a Tab stop too, so Tab walks the open items before the next header (a slotted item is not a stop: use the arrow keys).',
    },
    {
      key: 'Enter, Space (header)',
      effect: 'Opens the panel, or closes it when it is open. A disabled header does nothing.',
    },
    {
      key: 'Arrow Down, Arrow Up (header)',
      effect:
        'Moves to the next or previous header. Arrow Down on an open header moves into its items, and Arrow Up from its first item moves back to the header.',
    },
    {
      key: 'Arrow Down, Arrow Up (items)',
      effect:
        'Moves the active item along the visible items of the panel, skipping disabled ones. Past the last item, Arrow Down moves on to the next header.',
    },
    {
      key: 'Home, End (items)',
      effect:
        'Moves the active item to the first or last item of the panel. On a header they do nothing.',
    },
    {
      key: 'Enter, Space (item)',
      effect:
        'Runs the active item: its command, or its link. On a nested parent, shows or hides its items. Use these, not Arrow Right and Arrow Left, to open a nested level.',
    },
  ],
  aria: [
    'Wrap the menu in your own `<nav aria-label="...">`: it gives the menu a landmark name. `wj-panelmenu` has no `ariaLabel`, `ariaLabelledBy` or `ariaDescribedBy`, because it has no single focusable part to carry them. Setting an `aria-*` attribute on the `wj-panelmenu` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'Each panel header is a `role="button"` named by its item’s `label`, with `aria-expanded` and `aria-controls`; the panel’s content is a `role="region"` named by its header, and its items form a `role="tree"` of `treeitem`s. A nested parent carries its own `aria-expanded`.',
    'The open state is kept on copies of your items. Toggling never changes your objects, it holds while you keep passing the same array, and it resets to the items’ `expanded` values when you pass a new one. Replace the array only when the items change, not on every change of unrelated state.',
    '`routerLink`, `queryParams` and `fragment` are not supported on this menu: they are dropped from every item, so an item that has one is a plain item that still runs its `command`. Optimus 2.0.2 draws the label of a nested item that has a `routerLink` as HTML whatever `escape` says, so a label such as `<img src=x>` would render as markup, which the library never allows. To navigate, run a `command` that calls your router, or give the item a `url`.',
    'The slot replaces the chevron and receives no open state (Optimus), so a slotted header cannot show open or closed. A slotted item’s visible text must be its `label`: the menu names each item from `label`, so a different visible text fails “Label in Name”. A slotted `routerLink` item would not navigate either.',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a menu takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'Optimus gap, fixed here: Optimus draws a separator as `role="separator"` inside a `role="tree"`, which ARIA does not allow there (axe `aria-required-children`). `wj-panelmenu` makes it presentational (`role="none"`) through the `separator` part of `pt`, and that value wins over a `pt` value of the same name.',
    'Optimus gap, fixed here: a disabled nested item has no `aria-disabled`, so a screen reader would not know it is inert (axe flags its contrast, which a disabled item is exempt from). `wj-panelmenu` sets `aria-disabled="true"` on it through the `item` part of `pt`, beside any `pt` you give that part. Optimus also runs the command of a disabled item when a click reaches it, which a pointer cannot do but a screen reader’s click can, so the command of a disabled item is removed and it runs nothing.',
    'Optimus gap: Arrow Right and Arrow Left on a nested parent change its `aria-expanded` but do not show or hide its items, so the visible state and the announced state disagree. Use Enter or Space on the parent, which work. Home and End on a panel header do nothing.',
    'Optimus gap, fixed here: Optimus puts a `ul` directly inside the `ul` that wraps each open panel’s tree, which axe reports as “`<ul>` and `<ol>` must only directly contain `<li>`” (`list`). That wrapper has no `pt` part, so `wj-panelmenu` sets `role="none"` on it after each render and the tree inside keeps its `role="tree"`.',
    'Optimus gap: an expanded nested parent keeps its own label as its accessible name while its visible text includes its items (`label-content-name-mismatch`). It is not reachable through `pt`, so the spec tolerates only that finding, on those nodes.',
    'Optimus gap: the active item is shown only by a faint fill, about 1.1:1 against the panel in light and 1.2:1 in dark, under the 3:1 a focus indicator needs. It is listed here until the shared styles draw a ring.',
    'Optimus gap: in the light scheme the chevron is under 3:1 against the panel. A slotted item draws its own mark: give it 3:1.',
    'Optimus gap: nothing marks the current page. Optimus adds a class to a matching `routerLink`, which this menu does not take, and sets no `aria-current`. Mark it yourself in a slot or with `pt`.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block and the stack of panels inside it is Optimus’s own layout: panels 8 px apart, each its own bordered box with a 12 px radius, and nested items indented 16 px per level. The menu fills the width of its container, so give the container a width. A label wraps at spaces and is never cut off. Opening and closing a panel animates unless the reader prefers reduced motion. For anything else, `pt` reaches the parts of the Optimus panel menu underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-panelmenu`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. On the `separator` part, `role` is set to `none` by the component and wins over a `pt` value; on the `item` part, `aria-disabled` is set on a disabled item.',
  parts: [
    { part: 'root', description: 'The menu.' },
    { part: 'panel', description: 'One panel: its header and its content.' },
    { part: 'header', description: 'The panel’s header, the button that opens and closes it.' },
    { part: 'headerContent', description: 'The row inside the header.' },
    { part: 'headerLink', description: 'The link inside the header, around its label.' },
    { part: 'headerLabel', description: 'The text of a header.' },
    { part: 'contentContainer', description: 'The region that expands and collapses.' },
    { part: 'content', description: 'The content of an open panel.' },
    { part: 'rootList', description: 'The `role="tree"` of a panel’s items.' },
    { part: 'submenu', description: 'The list of a nested parent’s items.' },
    { part: 'item', description: 'One nested item. `aria-disabled` is set on a disabled one.' },
    { part: 'itemContent', description: 'The clickable area of an item.' },
    { part: 'itemLink', description: 'The link inside an item.' },
    { part: 'itemLabel', description: 'The text of an item.' },
    { part: 'separator', description: 'A separator line, made `role="none"`.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Root items are panels; nested `items` are a tree. `WjMenuItem` extends Optimus’s `MenuItem`; its field rows are on the Menu page.',
    },
    {
      optimus: 'multiple',
      weeljack: 'multiple',
      status: 'kept',
      note: '`booleanAttribute`; several panels open at once.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjPanelMenuPt`. Tracks Optimus.',
    },
    {
      optimus: '#item template (PanelMenuItemTemplateContext)',
      weeljack: 'wjPanelMenuItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjPanelMenuItem]`, typed `WjPanelMenuItemSlot`, with a `WjPanelMenuItemContext`: `$implicit` is your own item. It replaces the chevron and label of headers and items alike.',
    },
    dropped('#submenuicon, #headericon templates', 'Not exposed: icon slots.'),
    dropped('motionOptions', '`{ safe: true }` internally: reduced motion is honoured.'),
    dropped('transitionOptions', 'Deprecated since Optimus v21.'),
    dropped('collapseAll()', droppedByNeed),
    dropped('id, tabindex', droppedByNeed),
    dropped('styleClass', 'Never exposed on any wrapper; deprecated since Optimus v20.'),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'MenuItem.routerLink, queryParams, fragment',
      'Dropped: Optimus renders routed item labels as HTML. Run a `command` with your router, or give a `url`.',
    ),
    dropped(
      'PanelMenuSub, PanelMenuList, PanelMenuModule, PanelMenuStyle',
      'Optimus internals: one selector per wrapper.',
    ),
  ],
};
