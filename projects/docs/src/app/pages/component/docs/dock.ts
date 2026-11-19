import { DockBasicExample } from '../../../examples/dock/basic';
import { DockCommandsExample } from '../../../examples/dock/commands';
import { DockPositionsExample } from '../../../examples/dock/positions';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'dock',
  title: 'Dock',
  purpose: 'A bar of icon shortcuts pinned to one edge of a container.',
  examples: [
    {
      title: 'Basic',
      description:
        'Describe the shortcuts as plain `WjMenuItem` objects (a type from `weeljack-ng`, documented on the Menu page at `/components/menu`) in `model`, and draw each icon in an `ng-template` marked `wjDockItem` (import `WjDockItemSlot`: without it the template is silently dropped and every tile is empty). `let-item` is your own item, so a `Map` keyed by the items finds its icon. A dock has no icon field and no visible text: each item’s `label` is the tile’s accessible name only, so every item needs one and the labels must be unique. Optimus positions the dock absolutely, against the nearest positioned ancestor, so put it in a container with `position: relative` and a real size, as the stage here does. The dock lies flush along one edge of that container and overlays its content: keep 5.5rem (88 px) of the container clear on that side. To change the items, replace the array: it is read when it changes, and your objects are never changed. Give the slot when the dock is created: Optimus reads its item template once, and a slot that appears later is not drawn. The dock is created in the browser only, so the server renders just the empty `wj-dock` element; render it once the items exist.',
      sourceKey: 'dock/basic',
      component: DockBasicExample,
    },
    {
      title: 'Positions',
      description:
        '`position` is the edge of the container the dock lies along: `bottom` (the default), `top`, `left` or `right`, which lay the tiles out in a row (for `top` and `bottom`) or a column. Above 960 px the bar is only as wide as its tiles and centred, so tiles that do not fit spill past both ends of the container: keep to seven items or fewer. At 960 px and narrower the bar spans its whole edge and scrolls when its tiles do not fit: narrow the window to see it. Several docks on one page each need their own name; here the position is in it.',
      sourceKey: 'dock/positions',
      component: DockPositionsExample,
    },
    {
      title: 'Commands and links',
      description:
        'An item with a `routerLink` or a `url` is a link, and one with a `command` runs it with `{ originalEvent, item }`, `item` being your own object. Enter and Space on the active tile run it the same way a click does. A disabled item runs nothing, is skipped by the arrow keys and loses its `url` too, so there is no link to follow.',
      sourceKey: 'dock/commands',
      component: DockCommandsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjDockHarness` from `weeljack-ng/dock/testing`. `getName()` and `getAriaAttributes()` read the list’s name and description, `getPosition()` the edge, and `getItems()` finds the tiles (each a `WjDockItemHarness` with `getLabel()`, `isDisabled()`, `isActive()` and `click()`); `getItemLabels()` and `getActiveItemLabel()` read them as a user would, `clickItem()` runs one by its name, and `focus()` and `isFocused()` drive the list. The dock is created after the first render, so read it once the fixture is stable. Nothing here names an Optimus class.',
      sourceKey: 'dock/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'The list is the dock’s only Tab stop. It becomes the focused element and the first enabled tile becomes active. Tab leaves the dock.',
    },
    {
      key: 'Arrow Right, Arrow Left',
      effect:
        'In a `top` or `bottom` dock, moves the active tile to the next or previous one. Disabled tiles are skipped, and the active tile stops at the first and last (it does not wrap).',
    },
    {
      key: 'Arrow Down, Arrow Up',
      effect: 'The same, in a `left` or `right` dock. In the other docks they do nothing.',
    },
    { key: 'Home, End', effect: 'Moves the active tile to the first or last enabled one.' },
    {
      key: 'Enter, Space',
      effect: 'Runs the active tile: its `command`, or its link (`url` or `routerLink`).',
    },
  ],
  aria: [
    'The list is a `role="menu"` and the dock’s only focusable part. Name it: `ariaLabel`, or `ariaLabelledBy` pointing at visible text, and `ariaDescribedBy` to describe it. All three are set on the list, not on the `wj-dock` host (`ariaDescribedBy` through the `list` part of `pt`; a `pt.list` of your own keeps its other keys, and the description set by the component wins over a `pt` value). Setting an `aria-*` attribute on the `wj-dock` host logs the dev-mode warning `WJ0003` and is not forwarded. With several docks on a page, give each its own name.',
    'Each tile is a `role="menuitem"` named by its item’s `label` (`aria-label`); the link around your icon is `aria-hidden`. So a tile has no visible name: every item needs a `label`, and Optimus tracks tiles by it, so labels must be unique. Draw only a decorative icon in the slot (`aria-hidden="true"`), never a link, a button or text that carries meaning.',
    '`WJ0140` is the dev-mode warning for a dock that has items but no `wjDockItem` template: every item draws an empty tile. It fires once per application, in dev mode only.',
    'The active tile is announced through `aria-activedescendant` on the list, and is shown by a ring around the 64 px tile while the list has focus. A tile is `aria-disabled` when its item is disabled.',
    'Gap (Optimus), fixed: `p-dock` reads `window.matchMedia` with no platform guard, which throws on the server and would fail a prerender. `wj-dock` creates it only in the browser, after the first render, so the server output is the empty host and the dock appears without animation once the app is running.',
    'Gap (Optimus), fixed: Optimus ids tiles by index (`0`, `1`, …), so two docks on one page, or any element with `id="0"`, share ids and `aria-activedescendant` can point into another list. `wj-dock` gives each tile an id of its own dock’s (`wj-dock-<n>-<index>`), written on the copies it makes, never on your objects.',
    'Gap (Optimus), fixed: a disabled item with a `url` kept a link, so a focusable link sat inside the `aria-hidden` one and a screen reader’s click could follow it. A disabled tile loses its `url`.',
    'Gap (Optimus), fixed: each tile animates every property over 0.2 s, which does not follow the reduced-motion setting. Under `prefers-reduced-motion: reduce` the transition is stopped, so the ring appears at once.',
    'Gap (Optimus), fixed: the dock’s frame is the card surface with a `{surface.500}` border, and a tile takes the hover fill under the pointer. The pointer still moves the active tile when it enters one, which the ring follows only while the list has focus.',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a dock takes, and a field such as `icon`, `styleClass`, `badge`, `tooltipOptions` or `escape` on a wider object never reaches Optimus. There is no icon field: the icon is the slot.',
    'Every tile is 64 × 64 px around a 48 px link, well above the 24 × 24 px target size.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block that takes no space: Optimus’s dock is positioned absolutely, `z-index: 1`, against the nearest positioned ancestor, flush to one edge and centred along it, and only the bar takes pointer events, not the band around it. The bar is a frame on the card surface (1 px `{surface.500}` border, 8 px padding, 12 px radius) around 64 × 64 px tiles; the tile is the click target and shows the pointer cursor when enabled. Draw the icon in the slot at 24 px in `currentColor`, so it follows the text colour of the container. For anything else, `pt` reaches the parts of the Optimus dock underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-dock`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The positioned element along one edge of the container.' },
    {
      part: 'listContainer',
      description: 'The frame around the list: border, padding and radius.',
    },
    {
      part: 'list',
      description:
        'The `role="menu"` list. `wj-dock` merges `aria-describedby` into it, and it wins over a `pt` value.',
    },
    { part: 'item', description: 'One tile: a `role="menuitem"` `li`, named by its item’s label.' },
    { part: 'itemContent', description: 'The box inside a tile, around its link.' },
    { part: 'itemLink', description: 'The tile’s link, `aria-hidden`, around your icon.' },
    {
      part: 'itemIcon',
      description:
        'Optimus’s own icon element, for an item `icon` class. `wj-dock` never draws it: the icon is the slot.',
    },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Each item is a tile named by its `label`, so every item needs one, and labels must be unique (Optimus tracks tiles by `label`). The item fields are on the Menu page.',
    },
    {
      optimus: 'position',
      weeljack: 'position',
      status: 'kept',
      note: 'Typed `WjDockPosition`: `bottom` (default), `top`, `left` or `right`. A placement, not an axis, so it is not renamed `orientation`.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'On the `role="menu"` list.',
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
      note: 'Typed `WjDockPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'Native events on the `wj-dock` host: they bubble from the list inside it.',
    },
    {
      optimus: '#item template',
      weeljack: 'wjDockItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjDockItem]`, typed `WjDockItemSlot`, whose context `WjDockItemContext` is `$implicit`, your own item. It is the icon route: `WjMenuItem` has no icon field. Without it every tile is empty and `WJ0140` warns. Read once, when the dock is created.',
    },
    dropped('breakpoint', 'Not exposed: WeeljackNg exposes by need. Optimus’s 960px holds.'),
    dropped('id', 'Optimus generates one.'),
    dropped('styleClass', `${droppedAlways} Deprecated since Optimus v20.`),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped('DockModule, DockStyle', 'Internals.'),
  ],
};
