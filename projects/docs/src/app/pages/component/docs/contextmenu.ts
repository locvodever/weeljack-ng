import { ContextMenuGlobalExample } from '../../../examples/contextmenu/global';
import { ContextMenuItemSlotExample } from '../../../examples/contextmenu/item-slot';
import { ContextMenuTargetExample } from '../../../examples/contextmenu/target';
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
  entry: 'contextmenu',
  title: 'Context menu',
  purpose: 'A menu that opens at the pointer when an element is right-clicked.',
  optimusSelector: 'p-contextMenu',
  examples: [
    {
      title: 'On a target region',
      description:
        'Items are `WjMenuItem` objects (a type from `weeljack-ng`, described on the Menu page at `/components/menu`). Give the menu a `target`: a template reference to the element whose right-click opens it, here `#region`. Make the target focusable (`tabindex="0"`) and named (`role="group"` with an `aria-label`), show the focus ring, and say in its visible text how to open the menu: the context-menu key and Shift+F10 fire the same `contextmenu` event as a right-click. An item with `items` opens them as a submenu beside it, and a `separator` draws a line. Give the menu `ariaLabel`, and give `target` when the menu is created: it is read once. The menu renders in `body`, so it is never clipped by a container. Place `wj-contextmenu` after the target; the host takes no space. With no items, the menu renders nothing and the browser’s own menu appears. Keep labels to one to three words, and at most eight items per level.',
      sourceKey: 'contextmenu/target',
      component: ContextMenuTargetExample,
    },
    {
      title: 'Global',
      description:
        'Set `global` and the whole page is the target: a right-click anywhere opens the menu. While it is on, it replaces the browser’s own menu on every right-click, including on links, images and text fields, so offer it only where that is what a reader expects, and keep the way out in the menu (here “Turn off page menu”). Like `target`, `global` is read once, when the menu is created: the example renders the menu with `@if` to switch it.',
      sourceKey: 'contextmenu/global',
      component: ContextMenuGlobalExample,
    },
    {
      title: 'Item slot',
      description:
        'Put an `ng-template` marked `wjContextMenuItem` inside the menu (import `WjContextMenuItemSlot`: without it the template is silently dropped) to draw each item yourself, at every level: here an icon beside each label and a chevron on the item that has `items`. `let-item` is your own item object, so a `Map` keyed by the items finds per-item data. Draw the item’s `label` as visible text, because the menu names the item from it, and add no link or button of your own: the menu wraps your template in the item’s link, so it keeps the padding, the height and the Enter and Space keys of a plain item. The slot replaces the whole default rendering, so it owns the submenu mark. Give the menu the slot when it is created.',
      sourceKey: 'contextmenu/item-slot',
      component: ContextMenuItemSlotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjContextMenuHarness` from `weeljack-ng/contextmenu/testing`. Open the menu by dispatching a `contextmenu` event on the target (the event a right-click, the context-menu key and Shift+F10 fire). The menu renders in `body`, and the harness finds it there: `isOpen()`, `getName()`, `getItemLabels()`, `getSeparatorCount()` and `getAriaAttributes()` read it as a user meets it, `getItems()` finds the items that are on the page (each a `WjContextMenuItemHarness` with `getLabel()`, `isDisabled()`, `isActive()`, `hasSubmenu()`, `isSubmenuOpen()`, `openSubmenu()` and `click()`), and `clickItem()` runs one by its label. A menu that is closed renders nothing and has no name: ask `isOpen()` first, and find the harness without a `name`. Nothing here names an Optimus class.',
      sourceKey: 'contextmenu/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Context-menu key, Shift+F10',
      effect:
        'On the focused target, opens the menu at the target, with the list focused and no item active.',
    },
    {
      key: 'Arrow Down, Arrow Up',
      effect:
        'Moves the active item to the next or previous one in the open list. No item is active until the first Arrow Down. Disabled items are skipped.',
    },
    { key: 'Home, End', effect: 'Moves the active item to the first or last one in the list.' },
    {
      key: 'Arrow Right',
      effect: 'On a parent, opens its submenu and moves into it. On any other item, does nothing.',
    },
    {
      key: 'Arrow Left',
      effect: 'In a submenu, closes it and moves back to its parent.',
    },
    {
      key: 'Enter, Space',
      effect:
        'Runs the active item: its command, or its link. On a parent, opens its submenu. The menu closes and focus returns to where it was.',
    },
    {
      key: 'Escape',
      effect: 'Closes the menu and returns focus to the target.',
    },
    {
      key: 'Tab',
      effect:
        'Closes the menu. Focus returns to the target, and the browser’s Tab then moves on to the next Tab stop. It never falls to the page.',
    },
  ],
  aria: [
    'The list is a `role="menu"` of `menuitem`s, and each submenu is a `role="menu"` too. A parent has `aria-haspopup="menu"` and an `aria-expanded` that follows its submenu. Give the root list a name with `ariaLabel` or `ariaLabelledBy`, and a description with `ariaDescribedBy`. All three are set on the root list, not on the `wj-contextmenu` host.',
    'Setting an `aria-*` attribute on the `wj-contextmenu` host logs the dev-mode warning `WJ0003` and is not forwarded: use the inputs instead.',
    'Make the target reachable and named: `tabindex="0"`, `role="group"` and an `aria-label`, with the focus ring shown and visible text that says how to open the menu (“Right-click, or focus and press Shift+F10”). A context menu is not discoverable by itself, and it must never be the only way to reach a command: offer the same commands elsewhere.',
    '`global` replaces the browser’s own menu on the whole page, including its spelling and link commands. Use it deliberately.',
    'Focus goes back to the element that had it when the menu opened, when it closes by Escape, Tab or running an item, if it is still on the page. A menu opened by a mouse click on an element that cannot take focus has nowhere to return to. A command that moves focus elsewhere wins, and so does a click on another control.',
    'A slotted item’s visible text must be its `label`: the menu names each item from `label`, so a different visible text fails "Label in Name".',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a menu takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'Below a 960 px viewport, submenus open in place under their parent, indented, instead of beside it. The keys are the same.',
    'Optimus gap, fixed: Optimus puts `aria-level` on every `role="menuitem"`, which ARIA does not allow there (axe `aria-allowed-attr`, critical). `wj-contextmenu` clears it through `pt`; a `pt` that sets `aria-level` on `item` keeps it.',
    'Optimus gap, fixed: Optimus emits `onHide` for every `hide()`, so a second outside click or a resize while the menu is closing says "closed" again. `closed` is emitted once per open.',
    'Optimus gap: while a submenu is open, its parent item keeps its own label as its accessible name but its visible text includes the submenu’s items, so axe reports "Elements must have their visible text as part of their accessible name" (`label-content-name-mismatch`) on that one parent. It is the only violation in that state.',
    'Optimus gap: the active item is shown only by a faint fill, about 1.1:1 against the menu in light and 1.2:1 in dark, under the 3:1 a focus indicator needs. It is listed here until the shared styles draw a ring.',
    'Optimus gap: in the light scheme the mark that shows a submenu is under 3:1 against the menu. A slotted item draws its own mark: give it 3:1.',
    'Optimus gap: Optimus does not restore focus when the menu closes. `wj-contextmenu` does, as described above.',
    'Under reduced motion the menu and a submenu appear and disappear without motion, and `opened` and `closed` are still emitted.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari for the touch press) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The menu always renders in `body`, positioned at the pointer, flipped to stay inside the viewport and above the page, so a container that clips never clips it. The host is a block with no box of its own and takes no space, and nothing paints until the menu opens. The menu is at least 12.5rem wide and grows to its longest label; a submenu is at least as wide as the list it opens from. A label wraps at spaces and is never cut off. For anything else, `pt` reaches the parts of the Optimus context menu underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-contextmenu`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby` on the `rootList` part is set by the component from `ariaDescribedBy`, and wins over a `pt` value; `pt.motion` cannot switch `safe` off, because `wj-contextmenu` binds the motion options itself.',
  parts: [
    { part: 'root', description: 'The menu box, in `body` while it is open.' },
    {
      part: 'rootList',
      description:
        'The root `role="menu"` list. `wj-contextmenu` merges `aria-describedby` into it, and it wins over a `pt` value.',
    },
    { part: 'submenu', description: 'The list of a submenu.' },
    { part: 'item', description: 'One item.' },
    { part: 'itemContent', description: 'The clickable area of an item.' },
    { part: 'itemLink', description: 'The link inside an item.' },
    { part: 'itemLabel', description: 'The text of an item.' },
    { part: 'separator', description: 'A separator line.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Nested `items` open as submenus. The item fields are on the Menu page.',
    },
    {
      optimus: 'target: HTMLElement | string',
      weeljack: 'target',
      status: 'kept',
      note: 'Narrowed to `HTMLElement`: a template reference to the element whose right-click opens the menu. Read once, when the menu is created.',
    },
    {
      optimus: 'global',
      weeljack: 'global',
      status: 'kept',
      note: 'Accepts a bare attribute. The whole document is the target. Read once, when the menu is created.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the root `role="menu"` list.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the root list, through the `rootList` part of `pt`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjContextMenuPt`. Tracks Optimus.',
    },
    {
      optimus: 'onShow',
      weeljack: 'opened',
      status: 'renamed',
      note: 'Emits when the menu has opened. No value.',
    },
    {
      optimus: 'onHide',
      weeljack: 'closed',
      status: 'renamed',
      note: 'Emits once per open when the menu has closed, whatever closed it. No value.',
    },
    {
      optimus: 'show(event), hide()',
      weeljack: 'show(event), hide()',
      status: 'kept',
      note: 'Open the menu at a pointer event’s position from app code, and close it. They do nothing while the menu has no items.',
    },
    dropped('toggle(event)', droppedByNeed),
    dropped(
      'appendTo',
      'Not exposed: the menu always renders in `body`. Optimus positions it with the event’s page coordinates, which only line up when the overlay’s containing block is the document.',
    ),
    {
      optimus: '#item template (ContextMenuItemTemplateContext)',
      weeljack: 'wjContextMenuItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjContextMenuItem]`, typed `WjContextMenuItemSlot`, with a `WjContextMenuItemContext`: `$implicit` is your own item.',
    },
    dropped('#submenuicon template', 'Not exposed: draw the mark in the item slot.'),
    dropped('motionOptions', 'Not exposed: `wj-contextmenu` sets `{ safe: true }` itself.'),
    dropped(
      'triggerEvent, pressDelay, breakpoint, id, autoZIndex, baseZIndex',
      `${droppedByNeed} The trigger is the \`contextmenu\` event, and a touch press of 500 ms.`,
    ),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'ContextMenuSub, ContextMenuModule, ContextMenuStyle',
      'Optimus internals: one selector per wrapper.',
    ),
    dropped(
      'ContextMenuService',
      'Optimus declares it, but no component uses it: `wj-contextmenu` neither provides nor exports one, and an app never provides it.',
    ),
  ],
};
