import { MenubarBasicExample } from '../../../examples/menubar/basic';
import { MenubarRouterLinksExample } from '../../../examples/menubar/router-links';
import { MenubarSlotsExample } from '../../../examples/menubar/slots';
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
  entry: 'menubar',
  title: 'Menubar',
  purpose:
    'A horizontal bar of commands and links with dropdowns, collapsing to a menu button on narrow screens.',
  optimusSelector: 'p-menubar',
  examples: [
    {
      title: 'Basic',
      description:
        'Items are `WjMenuItem` objects (a type from `weeljack-ng`, described on the Menu page at `/components/menu`). The root items sit across the bar, an item with `items` opens them as a dropdown below it, and a `separator` draws a line. Give the bar `ariaLabel`. To change it, replace the array: the bar reads the array when it changes, not while you edit it, and it never changes your objects. A label is text, never HTML. Keep labels to one to three words and at most six root items. Narrow the window below 960 px to see the Navigation button that replaces the row.',
      sourceKey: 'menubar/basic',
      component: MenubarBasicExample,
    },
    {
      title: 'Start and end slots',
      description:
        'Put an `ng-template` marked `wjMenubarStart` inside the bar for a brand or title, and one marked `wjMenubarEnd` for compact controls such as a small `wj-button` (import `WjMenubarStartSlot` and `WjMenubarEndSlot`: without them the template is silently dropped). Both stay visible in the wide and the narrow layout, and the bar keeps them, and its height, when it has no items. Give the bar its slots when it is created: a slot added afterwards is not picked up. `wjMenubarItem`, with `WjMenubarItemSlot`, draws every item yourself, in the bar and in its dropdowns: `let-item` is your own item object, `let-root="root"` says whether it is on the bar, and your template draws the dropdown mark. Draw the item’s `label` as visible text and add no link or button of your own: the bar wraps your template in the item’s link. Narrow the window below 960 px: the slots stay, beside the Navigation button.',
      sourceKey: 'menubar/slots',
      component: MenubarSlotsExample,
    },
    {
      title: 'Router links',
      description:
        'An item with `routerLink` renders as a real link, so middle-click and “open in new tab” work. Here the links go to this site’s own component pages, and the array is the one Angular’s `routerLink` takes. `url` and `target` make an external link. Nothing marks the current page: set it yourself, for instance with a label. The bar needs the app’s router, which `provideRouter` supplies.',
      sourceKey: 'menubar/router-links',
      component: MenubarRouterLinksExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjMenubarHarness` from `weeljack-ng/menubar/testing`. `getName()`, `getItemLabels()`, `getSeparatorCount()`, `isDropdownOpen()` and `getAriaAttributes()` read the bar as a user meets it, `getItems()` finds the items that are on the page (each a `WjMenubarItemHarness` with `getLabel()`, `isDisabled()`, `isActive()`, `hasSubmenu()`, `isSubmenuOpen()`, `openSubmenu()` and `click()`), and `clickItem()` runs one by its label. The items of a dropdown are on the page only while it is open: call `openSubmenu()` first. On a narrow screen `getMobileButtonName()`, `isMobileMenuOpen()` and `toggleMobileMenu()` drive the Navigation button. Nothing here names an Optimus class.',
      sourceKey: 'menubar/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus onto the bar and off it. The list is one Tab stop: the items are walked with the arrow keys. The first root item is active when focus arrives from outside. On a narrow screen the Navigation button comes first.',
    },
    {
      key: 'Arrow Right, Arrow Left',
      effect:
        'Moves the active item along the bar to the next or previous root item. Disabled items are skipped. Inside a dropdown, Arrow Right opens a nested dropdown on a parent and does nothing on any other item, and Arrow Left closes the dropdown and returns to its root item.',
    },
    { key: 'Home, End', effect: 'Moves the active item to the first or last root item.' },
    {
      key: 'Arrow Down',
      effect:
        'On a root parent, opens its dropdown and moves into it. Inside a dropdown, moves to the next item.',
    },
    { key: 'Arrow Up', effect: 'Inside a dropdown, moves to the previous item.' },
    {
      key: 'Enter, Space',
      effect:
        'Runs the active item: its command, or its link. On a parent, opens its dropdown. Running an item closes the dropdown.',
    },
    {
      key: 'Escape',
      effect: 'Closes the open dropdown and leaves focus on its root item.',
    },
    {
      key: 'Enter, Space (Navigation button)',
      effect:
        'On a narrow screen, opens the list below the bar and moves focus into it. The button closes it again.',
    },
  ],
  aria: [
    'The list is a `role="menubar"` of `menuitem`s. A parent has `aria-haspopup="menu"` and an `aria-expanded` that follows its dropdown. Give the list a name with `ariaLabel` or `ariaLabelledBy`, and a description with `ariaDescribedBy`. All three are set on the root list, not on the `wj-menubar` host.',
    'Setting an `aria-*` attribute on the `wj-menubar` host logs the dev-mode warning `WJ0003` and is not forwarded: use the inputs instead.',
    'The Navigation button is named from the translation, `translation.aria.navigation` (“Navigation” in English, “Điều hướng” in `weeljack-ng/locale/vi`), and carries `aria-expanded`. It is 44 × 44 px, through `--wj-menubar-mobile-button-size`.',
    'The narrow layout applies below a 960 px viewport; the breakpoint is not an input. A bar with no items draws no Navigation button.',
    'A slotted item’s visible text must be its `label`: the bar names each item from `label`, so a different visible text fails “Label in Name”.',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a bar takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'Optimus gap: while a dropdown is open, its root item keeps its own label as its accessible name but its visible text includes the dropdown’s items, so axe reports “Elements must have their visible text as part of their accessible name” (`label-content-name-mismatch`) on that one parent. It is the only violation in that state, and the spec tolerates only that rule on an expanded parent.',
    'Optimus gap, fixed: the active item shows the 2 px focus ring inside its fill while the menu has keyboard focus.',
    'Optimus gap, fixed: in the light scheme the mark that shows a dropdown is now `{surface.500}`, about 4.8:1 against the bar. A slotted item draws its own mark: give it 3:1.',
    'Optimus gap, fixed: under reduced motion the mark turns without animating.',
    'Optimus gap: a dropdown is placed by CSS only, with no flip, so one near the inline end of the viewport can overflow it. Keep at most six root items and put the longest labels first.',
    'Optimus gap: Optimus runs the command of a disabled item when a click reaches it, which a pointer cannot do but a screen reader’s click can. `wj-menubar` removes the command of a disabled item, so a disabled item runs nothing.',
    'Menubar has no Optimus motion part: nothing is passed to it, and the dropdowns appear without a motion of their own. Aura’s own transitions on hover and colour stay.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, the bar inside it is Optimus’s flex row, and a dropdown renders inside the bar. The bar is as wide as its container; when the root items do not fit they wrap onto a second row and never clip or scroll. A label wraps at spaces and is never cut off. For anything else, `pt` reaches the parts of the Optimus menubar underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-menubar`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby` on the `rootList` part is set by the component from `ariaDescribedBy`, and wins over a `pt` value.',
  customProperties: [
    {
      name: '--wj-menubar-mobile-button-size',
      defaultValue: '2.75rem',
      description:
        'The width and height of the Navigation button in the narrow layout. It is an Optimus variable that `wj-menubar` sets on its host; override it on the host or a parent.',
    },
  ],
  parts: [
    { part: 'root', description: 'The bar.' },
    {
      part: 'rootList',
      description:
        'The root `role="menubar"` list. `wj-menubar` merges `aria-describedby` into it, and it wins over a `pt` value.',
    },
    { part: 'submenu', description: 'The list of a dropdown.' },
    { part: 'item', description: 'One item.' },
    { part: 'itemContent', description: 'The clickable area of an item.' },
    { part: 'itemLink', description: 'The link inside an item.' },
    { part: 'itemLabel', description: 'The text of an item.' },
    { part: 'separator', description: 'A separator line.' },
    { part: 'button', description: 'The Navigation button of the narrow layout.' },
    { part: 'start', description: 'The region of the `wjMenubarStart` slot.' },
    { part: 'end', description: 'The region of the `wjMenubarEnd` slot.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. The root items sit across the bar, their `items` open as dropdowns. The item fields are on the Menu page.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the root `role="menubar"` list.',
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
      note: 'Typed `WjMenubarPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'No `on` outputs: listen for the native events on the host.',
    },
    {
      optimus: '#item template (MenubarItemTemplateContext)',
      weeljack: 'wjMenubarItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjMenubarItem]`, typed `WjMenubarItemSlot`, with a `WjMenubarItemContext`: `$implicit` is your own item and `root` says whether it is on the bar.',
    },
    {
      optimus: '#start template',
      weeljack: 'wjMenubarStart slot',
      status: 'renamed',
      note: 'An `ng-template[wjMenubarStart]`, typed `WjMenubarStartSlot`: a brand or title before the items.',
    },
    {
      optimus: '#end template, default content',
      weeljack: 'wjMenubarEnd slot',
      status: 'renamed',
      note: 'An `ng-template[wjMenubarEnd]`, typed `WjMenubarEndSlot`. Optimus projects default content into the end region; `wj-menubar` exposes the region as a slot only.',
    },
    dropped('#menuicon, #submenuicon templates', 'Not exposed: icon slots.'),
    dropped('styleClass', 'Never exposed on any wrapper; deprecated since Optimus v20.'),
    dropped(
      'breakpoint, autoDisplay, autoHide, autoHideDelay, id, autoZIndex, baseZIndex',
      `${droppedByNeed} Optimus’s 960 px breakpoint applies.`,
    ),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'MenubarSub, MenubarService, MenubarModule, MenuBarStyle',
      'Optimus internals: one selector per wrapper.',
    ),
  ],
};
