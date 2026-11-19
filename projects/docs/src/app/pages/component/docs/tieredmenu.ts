import { TieredMenuBasicExample } from '../../../examples/tieredmenu/basic';
import { TieredMenuItemSlotExample } from '../../../examples/tieredmenu/item-slot';
import { TieredMenuPopupExample } from '../../../examples/tieredmenu/popup';
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
  entry: 'tieredmenu',
  title: 'Tiered menu',
  purpose: 'Nested commands that open as submenus, inline or as a popup.',
  optimusSelector: 'p-tieredMenu',
  examples: [
    {
      title: 'Basic',
      description:
        'Items are `WjMenuItem` objects (a type from `weeljack-ng`, described on the Menu page at `/components/menu`). An item with `items` is a parent: it opens its entries as a submenu beside it, one branch at a time, and a `separator` draws a line. Give the menu `ariaLabel`. To change it, replace the array: the menu reads the array when it changes, not while you edit it, and it never changes your objects. A label is text, never HTML. With no items, the menu renders nothing at all. Keep labels to one to three words, and at most eight items per level.',
      sourceKey: 'tieredmenu/basic',
      component: TieredMenuBasicExample,
    },
    {
      title: 'Popup',
      description:
        'Set `popup` and open the menu from the app: `toggle($event)` opens a closed menu and closes an open one, aligned to the element that was clicked. Use a `wj-button` as the trigger, and show its state: `opened` and `closed` drive its `ariaExpanded` input, and `ariaHasPopup="menu"` marks it as a menu opener. The popup closes on an outside click, Escape, Tab or running an item, and focus goes back to the trigger. Keep `wj-tieredmenu` after the row of openers, not inside it. Inside a container that clips, set `appendTo="body"`.',
      sourceKey: 'tieredmenu/popup',
      component: TieredMenuPopupExample,
    },
    {
      title: 'Item slot',
      description:
        'Put an `ng-template` marked `wjTieredMenuItem` inside the menu (import `WjTieredMenuItemSlot`: without it the template is silently dropped) to draw each item yourself, at every level: here an icon beside the top-level labels and a chevron on the parents. `let-item` is your own item object, so a `Map` keyed by the items finds per-item data, and `hasSubmenu` says whether the item opens a submenu. Draw the item’s `label` as visible text, because the menu names the item from it, and add no link or button of your own: the menu wraps your template in the item’s link, so it keeps the padding, the height and the Enter and Space keys of a plain item. The slot replaces the whole default rendering, so it owns the submenu mark: draw it from `hasSubmenu`. Give the menu the slot when it is created.',
      sourceKey: 'tieredmenu/item-slot',
      component: TieredMenuItemSlotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTieredMenuHarness` from `weeljack-ng/tieredmenu/testing`. `isOpen()`, `getName()`, `getItemLabels()`, `getSeparatorCount()` and `getAriaAttributes()` read the menu as a user meets it, `getItems()` finds the items that are on the page (each a `WjTieredMenuItemHarness` with `getLabel()`, `isDisabled()`, `isActive()`, `hasSubmenu()`, `isSubmenuOpen()`, `openSubmenu()` and `click()`), and `clickItem()` runs one by its label. The items of a submenu are on the page only while it is open: call `openSubmenu()` first. A popup that is closed renders nothing: ask `isOpen()` first. Nothing here names an Optimus class.',
      sourceKey: 'tieredmenu/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus onto the list and off it. The list is one Tab stop: the items are walked with the arrow keys. No item is active until the first Arrow Down.',
    },
    {
      key: 'Arrow Down, Arrow Up',
      effect:
        'Moves the active item to the next or previous one in the open list. Disabled items are skipped.',
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
        'Runs the active item: its command, or its link. On a parent, opens its submenu. A popup closes and focus returns to the trigger.',
    },
    {
      key: 'Escape',
      effect:
        'Closes every open submenu and keeps focus on the list. In a popup, closes the popup and returns focus to the trigger.',
    },
    {
      key: 'Tab (popup)',
      effect:
        'Closes the popup. Focus moves on to the next Tab stop, or returns to the trigger when there is none, and never falls to the page.',
    },
  ],
  aria: [
    'The list is a `role="menu"` of `menuitem`s, and each submenu is a `role="menu"` too. A parent has `aria-haspopup="menu"` and an `aria-expanded` that follows its submenu. Give the root list a name with `ariaLabel` or `ariaLabelledBy`, and a description with `ariaDescribedBy`. All three are set on the root list, not on the `wj-tieredmenu` host.',
    'Setting an `aria-*` attribute on the `wj-tieredmenu` host logs the dev-mode warning `WJ0003` and is not forwarded: use the inputs instead.',
    'Gap, fixed: a `wj-button` that opens the popup takes `ariaHasPopup` and `ariaExpanded`, set on its button element. The popup example sets `ariaHasPopup="menu"` and an `ariaExpanded` that follows `opened` and `closed`.',
    'A slotted item’s visible text must be its `label`: the menu names each item from `label`, so a different visible text fails "Label in Name".',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a menu takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'Below a 960 px viewport, submenus open in place under their parent, indented, instead of beside it. The keys are the same.',
    'Optimus gap: while a submenu is open, its parent item keeps its own label as its accessible name but its visible text includes the submenu’s items, so axe reports "Elements must have their visible text as part of their accessible name" (`label-content-name-mismatch`) on that one parent. It is the only violation in that state.',
    'Optimus gap, fixed: the active item shows the 2 px focus ring inside its fill while the menu has keyboard focus.',
    'Optimus gap, fixed: in the light scheme the mark that shows a submenu is now `{surface.500}`, about 4.8:1 against the menu. A slotted item draws its own mark: give it 3:1.',
    'Optimus gap: Optimus runs the command of a disabled item when a click reaches it, which a pointer cannot do but a screen reader’s click can. `wj-tieredmenu` removes the command of a disabled item, so a disabled item runs nothing.',
    'Under reduced motion a popup and a submenu appear and disappear without motion, and `opened` and `closed` are still emitted.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari for the popup) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits, and the popup renders inside its host unless `appendTo` is `body`. The host is a block with no box of its own, and a menu that is a popup takes no space while it is closed. A menu is as wide as its container, and at least 12.5rem; a submenu is at least as wide as the list it opens from, and a popup is at least as wide as its trigger. A label wraps at spaces and is never cut off. For anything else, `pt` reaches the parts of the Optimus tiered menu underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-tieredmenu`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby` on the `rootList` part is set by the component from `ariaDescribedBy`, and wins over a `pt` value; `pt.motion` cannot switch `safe` off, because `wj-tieredmenu` binds the motion options itself.',
  parts: [
    { part: 'root', description: 'The menu box: the inline menu, or the popup.' },
    {
      part: 'rootList',
      description:
        'The root `role="menu"` list. `wj-tieredmenu` merges `aria-describedby` into it, and it wins over a `pt` value.',
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
      optimus: 'popup',
      weeljack: 'popup',
      status: 'kept',
      note: 'Accepts a bare attribute. Read once, when the menu is created.',
    },
    {
      optimus: 'appendTo',
      weeljack: 'appendTo',
      status: 'kept',
      note: '`self` (default) or `body`: use `body` for a popup inside a container that clips it.',
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
      note: 'Typed `WjTieredMenuPt`. Tracks Optimus.',
    },
    {
      optimus: 'onShow',
      weeljack: 'opened',
      status: 'renamed',
      note: 'Emits when a popup has opened. No value.',
    },
    {
      optimus: 'onHide',
      weeljack: 'closed',
      status: 'renamed',
      note: 'Emits once when a popup has closed, whatever closed it. No value. Optimus itself emits `onHide` twice.',
    },
    {
      optimus: 'toggle(event), show(event), hide()',
      weeljack: 'toggle(event), show(event), hide()',
      status: 'kept',
      note: 'For popups. They do nothing while the menu has no items.',
    },
    {
      optimus: '#item template (TieredMenuItemTemplateContext)',
      weeljack: 'wjTieredMenuItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjTieredMenuItem]`, typed `WjTieredMenuItemSlot`, with a `WjTieredMenuItemContext`: `$implicit` is your own item and `hasSubmenu` says whether it opens a submenu.',
    },
    dropped('#submenuicon template', 'Not exposed: draw the mark in the item slot.'),
    dropped('motionOptions', 'Not exposed: `wj-tieredmenu` sets `{ safe: true }` itself.'),
    dropped(
      'breakpoint, autoDisplay, disabled, id, tabindex, autoZIndex, baseZIndex',
      droppedByNeed,
    ),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'TieredMenuSub, TieredMenuModule, TieredMenuStyle',
      'Optimus internals: one selector per wrapper.',
    ),
  ],
};
