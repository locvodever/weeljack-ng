import { MenuBasicExample } from '../../../examples/menu/basic';
import { MenuCommandsExample } from '../../../examples/menu/commands';
import { MenuDisabledExample } from '../../../examples/menu/disabled';
import { MenuGroupsExample } from '../../../examples/menu/groups';
import { MenuItemSlotExample } from '../../../examples/menu/item-slot';
import { MenuPopupExample } from '../../../examples/menu/popup';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

/** A row for a field of Optimus's `MenuItem`, as `WjMenuItem` takes it. */
const itemField = (
  field: string,
  weeljack: string,
  status: MappingRow['status'],
  note: string,
): MappingRow => ({ optimus: `MenuItem.${field}`, weeljack, status, note });

export const DOC: ComponentDoc = {
  entry: 'menu',
  title: 'Menu',
  purpose: 'A list of commands or links, inline or as a popup.',
  examples: [
    {
      title: 'Basic',
      description:
        'Describe the menu as plain `WjMenuItem` objects (a type from `weeljack-ng`) and pass them as `model`. A menu is a list of commands: give it `ariaLabel`. To change it, replace the array: the menu reads the array when it changes, not while you edit it, and it never changes your objects. A label is text, never HTML. With no items, the menu renders nothing at all.',
      sourceKey: 'menu/basic',
      component: MenuBasicExample,
    },
    {
      title: 'Groups and separators',
      description:
        'An item with `items` is a group header: a label that is not focusable and not a command, with its entries below it. `{ separator: true }` draws a line. Once any top-level item has `items`, every top-level item is a group or a separator: a command never sits at the top level beside a group. Here `ariaLabelledBy` names the list from a visible caption.',
      sourceKey: 'menu/groups',
      component: MenuGroupsExample,
    },
    {
      title: 'Popup',
      description:
        'Set `popup` and open the menu from the app: `toggle($event)` opens a closed menu and closes an open one, aligned to the element that was clicked. Use a `wj-button` as the trigger, and show its state: `opened` and `closed` drive `aria-expanded`, and `aria-haspopup="menu"` goes on the button through its `pt` root, because `wj-button` has no inputs for a popup trigger yet. The popup closes on an outside click, Escape, Tab or running an item, and focus goes back to the trigger. Keep `wj-menu` after the row of openers, not inside it. Inside a container that clips, set `appendTo="body"`.',
      sourceKey: 'menu/popup',
      component: MenuPopupExample,
    },
    {
      title: 'Commands',
      description:
        'An item’s `command` receives a `WjMenuItemCommandEvent` (a type from `weeljack-ng`): `event.originalEvent` is the click or key event, and `event.item` is your own item object, the very reference you put in `model`. A command that throws reaches your `ErrorHandler`: the menu never catches it.',
      sourceKey: 'menu/commands',
      component: MenuCommandsExample,
    },
    {
      title: 'Disabled items',
      description:
        'A disabled item looks inert, is skipped by the arrow keys and runs nothing, whether it is clicked or reached by key.',
      sourceKey: 'menu/disabled',
      component: MenuDisabledExample,
    },
    {
      title: 'Item slot',
      description:
        'Put an `ng-template` marked `wjMenuItem` inside the menu (import `WjMenuItemSlot`: without it the template is silently dropped) to draw each item yourself, here an icon beside the label. `let-item` is your own item object, so a `Map` keyed by the items finds per-item data. Draw the item’s `label` as visible text, because the menu names the item from it, and add no link or button of your own: the menu wraps your template in the item’s link, so it keeps the padding, the height and the Enter and Space keys of a plain item. The slot replaces the whole default rendering: give the menu the slot when it is created, and the template owns any submenu mark.',
      sourceKey: 'menu/item-slot',
      component: MenuItemSlotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjMenuHarness` from `weeljack-ng/menu/testing`. `isOpen()`, `getName()`, `getItemLabels()`, `getGroupLabels()`, `getSeparatorCount()` and `getAriaAttributes()` read the menu as a user meets it, `getItems()` finds items (each a `WjMenuItemHarness` with `getLabel()`, `isDisabled()`, `isActive()` and `click()`), and `clickItem()` runs one by its label. A popup that is closed renders nothing: ask `isOpen()` first. Nothing here names an Optimus class.',
      sourceKey: 'menu/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus onto the list and off it. The list is one Tab stop: the items are walked with the arrow keys. The first item becomes active.',
    },
    {
      key: 'Arrow Down, Arrow Up',
      effect: 'Moves the active item to the next or previous one. Disabled items are skipped.',
    },
    { key: 'Home, End', effect: 'Moves the active item to the first or last one.' },
    {
      key: 'Enter, Space',
      effect:
        'Runs the active item: its command, or its link. A popup closes and focus returns to the trigger.',
    },
    {
      key: 'Escape (popup)',
      effect: 'Closes the popup and returns focus to the trigger.',
    },
    {
      key: 'Tab (popup)',
      effect:
        'Closes the popup. Focus passes the trigger and moves on to the next Tab stop, as it does for any menu button.',
    },
  ],
  aria: [
    'The list is a `role="menu"` of `menuitem`s. Give it a name with `ariaLabel` or `ariaLabelledBy`, and a description with `ariaDescribedBy`. All three are set on the list, not on the `wj-menu` host.',
    'Setting an `aria-*` attribute on the `wj-menu` host logs the dev-mode warning `WJ0003` and is not forwarded: use the inputs instead.',
    'A group header is not announced as a group name: Optimus gives it `role="none"`, so a screen reader reads the entries without it. Put the grouping in the item labels when it matters.',
    '`wj-button` has no ARIA inputs for a popup trigger yet. The popup example sets `aria-haspopup="menu"` and an `aria-expanded` that follows `opened` and `closed` through the button’s `pt` root. This is a gap, to be closed by a later `wj-button` minor.',
    'A slotted item’s visible text must be its `label`: the menu names each item from `label`, so a different visible text fails "Label in Name".',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a menu takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'Optimus gap: the active item is shown only by a faint fill, about 1.1:1 against the menu in light and 1.2:1 in dark, under the 3:1 a focus indicator needs. It is listed here until the shared styles draw a ring.',
    'Optimus gap: in the light scheme the mark that shows a submenu is under 3:1 against the menu. A plain menu has no submenu mark, so this does not apply to it; it applies to its siblings.',
    'Under reduced motion a popup appears and disappears without motion, and `opened` and `closed` are still emitted.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari for the popup) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits, and the popup renders inside its host unless `appendTo` is `body`. The host is a block with no box of its own, and a menu that is a popup takes no space while it is closed. A menu is as wide as its container, and at least 12.5rem; a popup is as wide as its longest label. A label wraps at spaces and is never cut off. For anything else, `pt` reaches the parts of the Optimus menu underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-menu`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby` on the `list` part is set by the component from `ariaDescribedBy`, and wins over a `pt` value; `pt.motion` cannot switch `safe` off, because `wj-menu` binds the motion options itself.',
  parts: [
    { part: 'root', description: 'The menu box: the inline menu, or the popup.' },
    {
      part: 'list',
      description:
        'The `role="menu"` list. `wj-menu` merges `aria-describedby` into it, and it wins over a `pt` value.',
    },
    { part: 'submenuLabel', description: 'A group header.' },
    { part: 'separator', description: 'A separator line.' },
    { part: 'item', description: 'One item.' },
    { part: 'itemContent', description: 'The clickable area of an item.' },
    { part: 'itemLink', description: 'The link inside an item.' },
    { part: 'itemLabel', description: 'The text of an item.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. A top-level item with `items` is a group header, one level deep as in Optimus. Replace the array to change the menu.',
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
      note: 'Set on the `role="menu"` list.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the list, through the `list` part of `pt`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjMenuPt`. Tracks Optimus.',
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
      note: 'Emits when a popup has closed, whatever closed it. No value.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'Native `(focusin)` and `(focusout)`',
      status: 'renamed',
      note: 'They bubble to the host while the list renders inside it (`appendTo` `self`). No `on`-prefixed outputs.',
    },
    {
      optimus: 'toggle(event), show(event), hide()',
      weeljack: 'toggle(event), show(event), hide()',
      status: 'kept',
      note: 'For popups. They do nothing while the menu has no items.',
    },
    {
      optimus: '#item template (MenuItemTemplateContext)',
      weeljack: 'wjMenuItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjMenuItem]`, typed `WjMenuItemSlot`, with a `WjMenuItemContext` whose `$implicit` is your own item.',
    },
    dropped('motionOptions', 'Not exposed: `wj-menu` sets `{ safe: true }` itself.'),
    dropped('#start, #end, #header, #submenuheader templates', droppedByNeed),
    dropped('id, tabindex, autoZIndex, baseZIndex', droppedByNeed),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'MenuModule, MenuItemContent, SafeHtmlPipe, MenuStyle',
      'Optimus internals: one selector per wrapper.',
    ),
    itemField('label', 'label', 'kept', 'Rendered as text: the menu forces `escape: true`.'),
    itemField(
      'command',
      'command',
      'renamed',
      'Typed `(event: WjMenuItemCommandEvent) => void`. The event is narrowed: `item` is your own object, and `index` is dropped.',
    ),
    itemField('items', 'items', 'kept', 'Typed `WjMenuItem[]`, a mutable array.'),
    itemField('disabled, visible, separator', 'same', 'kept', 'The core item states.'),
    itemField(
      'expanded',
      'expanded',
      'kept',
      'The initial expansion, for the menus that expand in place. Optimus writes to its own copy, never your object.',
    ),
    itemField('url, target', 'same', 'kept', 'Plain links. Angular’s URL sanitizer still applies.'),
    itemField('routerLink', 'routerLink', 'kept', 'Narrowed to `string | unknown[]`.'),
    itemField('queryParams', 'queryParams', 'kept', 'Narrowed to `Record<string, unknown>`.'),
    itemField('fragment', 'fragment', 'kept', 'Part of router navigation.'),
    itemField('escape', 'None', 'dropped', 'Never settable: the menu always passes `true`.'),
    itemField(
      'style, styleClass, badgeStyleClass, iconStyle, iconClass, labelStyle, labelClass, linkStyle, linkClass',
      'None',
      'dropped',
      'Styling fields. `pt` reaches every part of an item.',
    ),
    itemField('[key: string]: any', 'None', 'dropped', 'No index signature: a typo is an error.'),
    itemField(
      'icon',
      'None',
      'dropped',
      'An icon class assumes an icon font WeeljackNg does not ship. Draw icons in the item slot.',
    ),
    itemField(
      'tooltip, tooltipPosition, tooltipOptions',
      'None',
      'dropped',
      'Not needed. `tooltipOptions.escape: false` would also turn a raw HTML write on.',
    ),
    itemField('badge', 'None', 'dropped', droppedByNeed),
    itemField('title, id, automationId, tabindex', 'None', 'dropped', droppedByNeed),
    itemField(
      'routerLinkActiveOptions, queryParamsHandling, preserveFragment, skipLocationChange, replaceUrl, state',
      'None',
      'dropped',
      'Not needed: Optimus’s router defaults apply.',
    ),
  ],
};
