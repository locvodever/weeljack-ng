import { MegamenuHorizontalExample } from '../../../examples/megamenu/horizontal';
import { MegamenuSlotsExample } from '../../../examples/megamenu/slots';
import { MegamenuVerticalExample } from '../../../examples/megamenu/vertical';
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
  entry: 'megamenu',
  title: 'Mega menu',
  purpose: 'A navigation bar whose items open wide panels of grouped links in columns.',
  optimusSelector: 'p-megaMenu',
  examples: [
    {
      title: 'Horizontal',
      description:
        'Items are `WjMegaMenuItem` objects (a type from `weeljack-ng/megamenu`; the plain `WjMenuItem` they hold is described on the Menu page at `/components/menu`). A root item with `items` opens a panel below the bar: `items` is a list of columns, each column a list of groups, and each group is an item whose `label` is its header and whose `items` are its entries. A root item without `items` is a plain command or link. Here the entries are `routerLink`s to this site’s own component pages. Give the menu `ariaLabel`, and keep a panel to at most three columns. To change it, replace the array: the menu reads the array when it changes, not while you edit it, and it never changes your objects. A label is text, never HTML. Narrow the window below 960 px to see the Navigation button that replaces the row, with the columns stacked in place.',
      sourceKey: 'megamenu/horizontal',
      component: MegamenuHorizontalExample,
    },
    {
      title: 'Vertical',
      description:
        'The same model with `orientation="vertical"`: the root items stack in a column and a panel opens to the inline end of the menu. The menu is as wide as its container; here it sits in a 16 rem column.',
      sourceKey: 'megamenu/vertical',
      component: MegamenuVerticalExample,
    },
    {
      title: 'Start and end slots',
      description:
        'Put an `ng-template` marked `wjMegaMenuStart` inside the menu for a brand or title, and one marked `wjMegaMenuEnd` for compact controls such as a small `wj-button` (import `WjMegaMenuStartSlot` and `WjMegaMenuEndSlot`: without them the template is silently dropped). Both stay visible in the wide and the narrow layout, and the menu keeps them, and its height, when it has no items. Give the menu its slots when it is created: a slot added afterwards is not picked up. `wjMegaMenuItem`, with `WjMegaMenuItemSlot`, draws every root item and every entry yourself: `let-item` is your own item object, and your template draws the mark of a root parent. Group headers stay the menu’s own text. Draw the item’s `label` as visible text and add no link or button of your own: the menu wraps your template in the item’s link. Narrow the window below 960 px: the slots stay, beside the Navigation button.',
      sourceKey: 'megamenu/slots',
      component: MegamenuSlotsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjMegaMenuHarness` from `weeljack-ng/megamenu/testing`. `getName()`, `getOrientation()`, `getItemLabels()`, `getGroupLabels()`, `getSeparatorCount()`, `isPanelOpen()` and `getAriaAttributes()` read the menu as a user meets it, `getItems()` finds the items that are on the page (each a `WjMegaMenuItemHarness` with `getLabel()`, `isDisabled()`, `isActive()`, `hasSubmenu()`, `isSubmenuOpen()`, `openSubmenu()`, `getGroupLabels()`, `getEntryLabels()` and `click()`), and `clickItem()` runs one by its label. The entries of a panel are on the page only while it is open: call `openSubmenu()` first. On a narrow screen `getMobileButtonName()`, `isMobileMenuOpen()` and `toggleMobileMenu()` drive the Navigation button. Nothing here names an Optimus class.',
      sourceKey: 'megamenu/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus onto the menu and off it. The list is one Tab stop: the items are walked with the arrow keys. The first root item is active when focus arrives from outside. On a narrow screen the Navigation button comes first.',
    },
    {
      key: 'Arrow Right, Arrow Left (horizontal)',
      effect:
        'On the bar, moves the active item to the next or previous root item. Inside a panel, moves between its columns.',
    },
    {
      key: 'Arrow Down, Arrow Up (horizontal)',
      effect:
        'Arrow Down on a root parent opens its panel and moves into it. Inside a panel, the keys move to the next and previous item of the column.',
    },
    {
      key: 'Arrow Down, Arrow Up (vertical)',
      effect:
        'Move the active item along the root items, skipping disabled ones. Arrow Right on a root parent opens its panel and moves into it.',
    },
    { key: 'Home, End', effect: 'Moves the active item to the first or last root item.' },
    {
      key: 'Enter, Space',
      effect:
        'Runs the active item: its command, or its link. On a parent, opens its panel. Running an item closes the panel.',
    },
    {
      key: 'Escape',
      effect: 'Closes the open panel and leaves focus on its root item.',
    },
    {
      key: 'Enter, Space (Navigation button)',
      effect:
        'On a narrow screen, opens the list below the bar and moves focus into it. The button closes it again.',
    },
  ],
  aria: [
    'The list is a `role="menubar"` of `menuitem`s; a panel’s columns hold `role="menu"` lists. A parent has `aria-haspopup="menu"` and an `aria-expanded` that follows its panel. Give the list a name with `ariaLabel` or `ariaLabelledBy`, and a description with `ariaDescribedBy`. All three are set on the root list, not on the `wj-megamenu` host.',
    'Setting an `aria-*` attribute on the `wj-megamenu` host logs the dev-mode warning `WJ0003` and is not forwarded: use the inputs instead.',
    'The Navigation button is named from the translation, `translation.aria.navigation` (“Navigation” in English, “Điều hướng” in `weeljack-ng/locale/vi`), and carries `aria-expanded`. It is 44 × 44 px, through `--wj-megamenu-mobile-button-size`.',
    'The narrow layout applies below a 960 px viewport; the breakpoint is not an input. A menu with no items draws no Navigation button.',
    'A slotted item’s visible text must be its `label`: the menu names each item from `label`, so a different visible text fails “Label in Name”.',
    'Group headers are `role="presentation"` text: a screen reader reads them with the list but does not announce them as group names (Optimus).',
    'Unknown fields on an item are dropped silently: `WjMegaMenuItem` and `WjMenuItem` list what a menu takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'Optimus gap, fixed here: Optimus 2.0.2 accepts `ariaLabel` and `ariaLabelledBy` on its mega menu but never writes them to the list, so the list had no name. `wj-megamenu` writes them, and `ariaDescribedBy`, onto the root list through the `rootList` part of `pt`.',
    'Optimus gap, fixed here: Optimus puts `aria-level` on every `role="menuitem"`, which ARIA does not allow there (axe `aria-allowed-attr`). `wj-megamenu` clears it on every item through the `item` part of `pt`. A consumer `pt` that sets `aria-level` on `item` keeps it.',
    'Optimus gap: while a panel is open, its root item keeps its own label as its accessible name but its visible text includes the panel’s items, so axe reports “Elements must have their visible text as part of their accessible name” (`label-content-name-mismatch`) on that one parent. It is the only violation in that state, and the spec tolerates only that rule on an expanded parent.',
    'Optimus gap: on a horizontal bar, Arrow Right and Arrow Left stop on a disabled root item (the vertical Arrow Down and Arrow Up skip it). The item is inert: Enter and Space run nothing.',
    'Optimus gap: a panel is placed by CSS only, from the start of the menu, with no flip, so a wide panel near the inline end of the viewport can overflow it. Keep at most three columns in a panel and at most six root items.',
    'Optimus gap: the active item is shown only by a faint fill, about 1.1:1 against the menu in light and 1.2:1 in dark, under the 3:1 a focus indicator needs. It is listed here until the shared styles draw a ring.',
    'Optimus gap: in the light scheme the mark that shows a panel is under 3:1 against the bar. A slotted item draws its own mark: give it 3:1.',
    'Optimus gap: the mark of a parent rotates when its panel opens, and the rotation ignores reduced motion. Optimus has no motion part to turn it off.',
    'Optimus gap: Optimus runs the command of a disabled item when a click reaches it, which a pointer cannot do but a screen reader’s click can. `wj-megamenu` removes the command of a disabled item, so a disabled item runs nothing.',
    'The mega menu has no Optimus motion part: nothing is passed to it, and the panels appear without a motion of their own. Aura’s own transitions on hover and colour stay.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, the bar inside it is Optimus’s own layout, and a panel renders inside the menu below it (to the inline end of it, when vertical). A panel is at least as wide as the menu, its columns sit side by side and are at least 12.5 rem wide, and a label wraps at spaces and is never cut off. For anything else, `pt` reaches the parts of the Optimus mega menu underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-megamenu`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. On the `rootList` part, `aria-label`, `aria-labelledby` and `aria-describedby` are set by the component from its inputs and win over a `pt` value; on the `item` part, `aria-level` is cleared unless your `pt` sets it.',
  customProperties: [
    {
      name: '--wj-megamenu-mobile-button-size',
      defaultValue: '2.75rem',
      description:
        'The width and height of the Navigation button in the narrow layout. It is an Optimus variable that `wj-megamenu` sets on its host; override it on the host or a parent.',
    },
  ],
  parts: [
    { part: 'root', description: 'The menu.' },
    {
      part: 'rootList',
      description:
        'The root `role="menubar"` list. `wj-megamenu` merges `aria-label`, `aria-labelledby` and `aria-describedby` into it, and they win over a `pt` value.',
    },
    { part: 'overlay', description: 'The panel that opens below (or beside) a root item.' },
    { part: 'grid', description: 'The row of columns inside a panel.' },
    { part: 'column', description: 'One column of a panel.' },
    { part: 'submenu', description: 'The list of one group of a panel.' },
    { part: 'submenuLabel', description: 'The header of a group.' },
    { part: 'item', description: 'One item.' },
    { part: 'itemContent', description: 'The clickable area of an item.' },
    { part: 'itemLink', description: 'The link inside an item.' },
    { part: 'itemLabel', description: 'The text of an item.' },
    { part: 'separator', description: 'A separator line.' },
    { part: 'start', description: 'The region of the `wjMegaMenuStart` slot.' },
    { part: 'end', description: 'The region of the `wjMegaMenuEnd` slot.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMegaMenuItem[]`, default `[]`. A root item’s `items` is a list of columns, each a list of groups; a group’s `label` is its header and its `items` are its entries, plain `WjMenuItem`s. `WjMegaMenuItem` extends Optimus’s `MegaMenuItem`; its fields are those of `WjMenuItem`, whose rows are on the Menu page.',
    },
    {
      optimus: 'orientation',
      weeljack: 'orientation',
      status: 'kept',
      note: 'Narrowed to `WjMegaMenuOrientation`, `horizontal` or `vertical`; default `horizontal`. Optimus also types it `string`.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the root `role="menubar"` list, through the `rootList` part of `pt`: Optimus declares them but does not render them.',
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
      note: 'Typed `WjMegaMenuPt`. Tracks Optimus.',
    },
    {
      optimus: '#item template (MegaMenuItemTemplateContext)',
      weeljack: 'wjMegaMenuItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjMegaMenuItem]`, typed `WjMegaMenuItemSlot`, with a `WjMegaMenuItemContext`: `$implicit` is your own root item or entry. Group headers are not slotted.',
    },
    {
      optimus: '#start template',
      weeljack: 'wjMegaMenuStart slot',
      status: 'renamed',
      note: 'An `ng-template[wjMegaMenuStart]`, typed `WjMegaMenuStartSlot`: a brand or title before the items.',
    },
    {
      optimus: '#end template',
      weeljack: 'wjMegaMenuEnd slot',
      status: 'renamed',
      note: 'An `ng-template[wjMegaMenuEnd]`, typed `WjMegaMenuEndSlot`: compact controls after the items.',
    },
    dropped(
      '#button, #buttonicon, #menuicon, #submenuicon templates',
      'Not exposed: icon slots, and the Navigation button by need.',
    ),
    dropped('styleClass', 'Never exposed on any wrapper; deprecated since Optimus v20.'),
    dropped(
      'breakpoint, scrollHeight, disabled, id, tabindex',
      `${droppedByNeed} Optimus’s 960 px breakpoint applies.`,
    ),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'MegaMenuSub, MegaMenuModule, MegaMenuStyle',
      'Optimus internals: one selector per wrapper.',
    ),
  ],
};
