import { SplitButtonBasicExample } from '../../../examples/splitbutton/basic';
import { SplitButtonContentSlotExample } from '../../../examples/splitbutton/content-slot';
import { SplitButtonDisabledExample } from '../../../examples/splitbutton/disabled';
import { SplitButtonNestedExample } from '../../../examples/splitbutton/nested';
import { SplitButtonVariantsExample } from '../../../examples/splitbutton/variants';
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
  entry: 'splitbutton',
  title: 'Split button',
  purpose: 'A button with a main action and a menu of related actions.',
  optimusSelector: 'p-splitbutton',
  examples: [
    {
      title: 'Basic',
      description:
        'The `label` button is the main action: it emits `buttonClick`, and a click on the menu button never does. The chevron next to it opens `model`, a list of `WjMenuItem` objects (a type from `weeljack-ng`, described on the Menu page at `/components/menu`) whose commands run with your own item. To change the items, replace the array: the menu reads the array when it changes, not while you edit it, and it never changes your objects. A label is text, never HTML. The popup opens on `body`, below the button and aligned to its start, and flips above when there is no room below.',
      sourceKey: 'splitbutton/basic',
      component: SplitButtonBasicExample,
    },
    {
      title: 'Variants, severities and sizes',
      description:
        'Both buttons take `variant` (`outlined` or `text`), `severity` and `size` together. Set them when the split button is created: `severity` follows a later change, but Optimus reads `variant` and `size` once, so changing them later does not restyle the buttons.',
      sourceKey: 'splitbutton/variants',
      component: SplitButtonVariantsExample,
    },
    {
      title: 'Disabled',
      description:
        'Set `disabled` to make both buttons inert: neither is a Tab stop, no click reaches `buttonClick`, and the menu never opens. A split button with no items is a different case: its menu button is disabled by itself, and the main button still works.',
      sourceKey: 'splitbutton/disabled',
      component: SplitButtonDisabledExample,
    },
    {
      title: 'Nested items',
      description:
        'An item with `items` is a parent: it opens its entries as a submenu beside it, in place below it on a narrow screen, one branch at a time. Only the leaves run commands, and running one closes the whole popup.',
      sourceKey: 'splitbutton/nested',
      component: SplitButtonNestedExample,
    },
    {
      title: 'Content slot',
      description:
        'Put an `ng-template` marked `wjSplitButtonContent` inside the split button (import `WjSplitButtonContentSlot`: without it the template is silently dropped) to draw the main button’s content yourself, such as a decorative icon beside the text. Optimus names the button from `ariaLabel`, or else from `label`, so draw the `label` as the visible text and keep the icon `aria-hidden`. The slot has no context. Give it when the split button is created: Optimus reads it once, and a slot that appears later is not drawn.',
      sourceKey: 'splitbutton/content-slot',
      component: SplitButtonContentSlotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSplitButtonHarness` from `weeljack-ng/splitbutton/testing`. `getLabel()`, `getMenuButtonName()`, `isDisabled()`, `isMenuButtonDisabled()` and `isMenuOpen()` read the control as a user meets it, `clickButton()`, `openMenu()` and `closeMenu()` drive it, and `getItems()` finds the items that are on the page (each a `WjSplitButtonItemHarness` with `getLabel()`, `isDisabled()`, `hasSubmenu()`, `openSubmenu()` and `click()`), and `clickItem()` runs one by its label. The menu renders nothing while it is closed, and its items are on the page only while it is open (and a submenu only while it is open too): open it first. The popup is found in the document, wherever it renders. Nothing here names an Optimus class.',
      sourceKey: 'splitbutton/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves from the main button to the menu button, and on. Both are Tab stops. The popup’s list is one Tab stop of its own.',
    },
    {
      key: 'Enter, Space (main button)',
      effect: 'Emits `buttonClick`, and closes an open menu.',
    },
    {
      key: 'Enter, Space, Arrow Down, Arrow Up (menu button)',
      effect:
        'Opens the menu and moves focus into its list. No item is active until the next Arrow Down.',
    },
    {
      key: 'Arrow Down, Arrow Up',
      effect:
        'In the menu, moves the active item to the next or previous one. Disabled items are skipped.',
    },
    { key: 'Home, End', effect: 'Moves the active item to the first or last one in the list.' },
    {
      key: 'Arrow Right',
      effect: 'On a parent, opens its submenu and moves into it. On any other item, does nothing.',
    },
    { key: 'Arrow Left', effect: 'In a submenu, closes it and moves back to its parent.' },
    {
      key: 'Enter, Space (in the menu)',
      effect:
        'Runs the active item: its command, or its link. On a parent, opens its submenu. The menu closes and focus returns to the menu button.',
    },
    {
      key: 'Escape',
      effect: 'Closes the menu and returns focus to the menu button.',
    },
    {
      key: 'Tab (in the menu)',
      effect:
        'Closes the menu. The popup sits on `body`, after the page, so with no next Tab stop focus returns to the menu button and never falls to the page.',
    },
  ],
  aria: [
    'The menu button is named “More actions” (`wj.moreActions` in the translation), because Optimus gives it no name. `expandAriaLabel` overrides it, and the popup’s list is named the same: its `aria-label` is that value. The menu button carries `aria-haspopup`, `aria-expanded` and `aria-controls`, which Optimus tracks.',
    'The main button is named by its visible text. `ariaLabel` sets its `aria-label` for an action whose content is not text, `ariaLabelledBy` and `ariaDescribedBy` name and describe it, and all three are set on the button, not on the `wj-splitbutton` host. With the content slot, Optimus names the button from `ariaLabel`, or else from `label`, so the slot’s visible text must be the `label`.',
    'Setting an `aria-*` attribute on the `wj-splitbutton` host logs the dev-mode warning `WJ0003` and is not forwarded: use the inputs instead.',
    'Focus returns to the menu button after Escape, after running an item and, when nothing follows the popup, after Tab. Focus that the reader moved elsewhere, such as an outside click on another control, stays there. `closed` is emitted once per close, although Optimus reports a popup leaving twice.',
    'With no items the menu button is disabled: it is not a Tab stop and no empty menu ever opens. The main button still works, and the rule holds when `disabled` goes from `true` back to `false`.',
    '`tooltip` and `tooltipOptions` are not exposed: `tooltipOptions.escape: false` turns on Optimus’s tooltip raw HTML write, so no tooltip ever shows on hover or focus.',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what the menu takes, and a field such as `icon`, `styleClass`, `tooltip` or `escape` on a wider object never reaches Optimus.',
    'Optimus gap: while a submenu is open, its parent item keeps its own label as its accessible name but its visible text includes the submenu’s items, so axe reports "Elements must have their visible text as part of their accessible name" (`label-content-name-mismatch`) on that one parent. It is the only violation in that state.',
    'Optimus gap: the active item in the menu is shown only by a faint fill, about 1.1:1 against the menu in light and 1.2:1 in dark, under the 3:1 a focus indicator needs. In the light scheme the mark that shows a submenu is under 3:1 too. Both are listed on the Menu page and wait for the shared styles.',
    'Optimus gap: Optimus runs the command of a disabled item when a click reaches it, which a pointer cannot do but a screen reader’s click can. `wj-splitbutton` removes the command of a disabled item, so a disabled item runs nothing.',
    'Optimus gap: the menu button is a little wider than it is tall: 46 px beside the default 44 px height (42 beside 36 small, 50 beside 52 large), because Optimus pads its chevron as a labelled button. It is still well above the 24 × 24 px target size.',
    'Optimus gap: the types give `pcMenu` the Menu’s parts, but the popup is a tiered menu, so the part that names its list is `rootList`, which the types do not list: a `pt.pcMenu.list` is never applied. `wj-splitbutton` merges the popup’s `aria-label` into `rootList` itself, and it wins over a `pt` value.',
    'Under reduced motion the popup and a submenu appear and disappear without motion, and `opened` and `closed` are still emitted.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari for the popup) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is an inline box exactly as wide and tall as the two joined buttons: 44 px tall by default, 36 px `small` and 52 px `large`. The popup opens on `body` by default, below the host and aligned to its start, at least as wide as the host and 12.5rem, and flips above when there is no room below; with `appendTo="self"` it opens inside the host, where an ancestor with `overflow: hidden` can clip it, so keep `body` there. For anything else, `pt` reaches the parts of the Optimus split button underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-splitbutton`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-labelledby` and `aria-describedby` on the `pcButton` root and `aria-label` on the popup’s `rootList` are set by the component and win over a `pt` value; `pt.motion` cannot switch `safe` off, because `wj-splitbutton` binds the motion options itself.',
  parts: [
    { part: 'root', description: 'The box around both buttons.' },
    {
      part: 'pcButton',
      description:
        'The main button, a Button: reach its parts through `pcButton`, such as `pcButton.root`. `wj-splitbutton` merges `aria-labelledby` and `aria-describedby` into `pcButton.root`, and they win over a `pt` value.',
    },
    {
      part: 'pcDropdown',
      description:
        'The menu button, a Button: reach its parts through `pcDropdown`, such as `pcDropdown.root`.',
    },
    {
      part: 'pcMenu',
      description:
        'The popup, a tiered menu: its parts are `root`, `rootList`, `submenu`, `item`, `itemContent`, `itemLink`, `itemLabel` and `separator`. `wj-splitbutton` merges the popup’s `aria-label` into `pcMenu.rootList`, and it wins over a `pt` value.',
    },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Nested `items` open as submenus of the popup. The item fields are on the Menu page.',
    },
    {
      optimus: 'label',
      weeljack: 'label',
      status: 'kept',
      note: 'The main action’s text, written as a text node.',
    },
    {
      optimus: 'severity',
      weeljack: 'severity',
      status: 'kept',
      note: 'Typed `WjSplitButtonSeverity`: the values of `wj-button`. Follows a later change.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: 'Typed `WjSplitButtonSize`, both buttons: 44 px tall by default. Read once, when the buttons are created.',
    },
    {
      optimus: 'text, outlined',
      weeljack: 'variant',
      status: 'renamed',
      note: 'Typed `WjSplitButtonVariant`: `outlined` or `text`, one vocabulary with `wj-button`. Read once, when the buttons are created.',
    },
    {
      optimus: 'disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'Accepts a bare attribute. Both buttons.',
    },
    {
      optimus: 'appendTo',
      weeljack: 'appendTo',
      status: 'kept',
      note: '`body` (default) or `self`. Narrowed from Optimus: no template variable.',
    },
    {
      optimus: 'expandAriaLabel',
      weeljack: 'expandAriaLabel',
      status: 'kept',
      note: 'The menu button’s name, and the popup’s. Default: “More actions”, from the translation.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel',
      status: 'added',
      note: 'The main button’s name for an action that is not text: routed through Optimus’s `buttonProps`, the only route it binds to the button’s `aria-label`.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Set on the main button, through the `pcButton.root` part of `pt`.',
    },
    {
      optimus: '#content template',
      weeljack: 'wjSplitButtonContent slot',
      status: 'renamed',
      note: 'An `ng-template[wjSplitButtonContent]`, typed `WjSplitButtonContentSlot`, with no context. Read once, when the split button is created.',
    },
    {
      optimus: 'onClick',
      weeljack: 'buttonClick',
      status: 'renamed',
      note: 'Emits the `MouseEvent` of the main button only. A native `click` on the host also fires for the menu button, so the main action has its own output.',
    },
    {
      optimus: 'onMenuShow, onMenuHide',
      weeljack: 'opened, closed',
      status: 'renamed',
      note: 'No value. `closed` is emitted once per close: Optimus itself reports a popup leaving twice.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjSplitButtonPt`. Tracks Optimus; `pcMenu` reaches the popup.',
    },
    dropped('raised, rounded, plain', `${droppedByNeed} \`wj-button\` has none of them.`),
    dropped(
      'buttonDisabled, menuButtonDisabled',
      `${droppedByNeed} With no items the menu button is disabled by itself.`,
    ),
    dropped(
      'icon, iconPos, dropdownIcon',
      'Icon class names are not supported: put an icon in the `wjSplitButtonContent` slot.',
    ),
    dropped('#dropdownicon template', 'Icon slot: not exposed.'),
    dropped(
      'buttonProps, menuButtonProps',
      `${droppedByNeed} \`ariaLabel\` uses \`buttonProps\` internally, and \`menuButtonProps\` would override the expanded state Optimus tracks.`,
    ),
    dropped(
      'tooltip, tooltipOptions',
      '`tooltipOptions.escape: false` turns on Optimus’s tooltip raw `innerHTML` write, the path WeeljackNg bans.',
    ),
    dropped('onDropdownClick', `${droppedByNeed} \`opened\` covers it.`),
    dropped('motionOptions', 'Not exposed: `wj-splitbutton` sets `{ safe: true }` itself.'),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'autofocus',
      'Not exposed: bound to `false`. Left unset, Optimus writes `autofocus="true"` on the main button and the browser focuses it on load.',
    ),
    dropped('tabindex, dir', droppedByNeed),
    dropped('menuStyle, menuStyleClass, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'p-splitButton, p-split-button, SplitButtonModule, SplitButtonStyle',
      'Duplicate selectors and internals: one selector per wrapper.',
    ),
  ],
};
