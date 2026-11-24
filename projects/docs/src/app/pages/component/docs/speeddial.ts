import { SpeedDialBasicExample } from '../../../examples/speeddial/basic';
import { SpeedDialDisabledExample } from '../../../examples/speeddial/disabled';
import { SpeedDialLayoutsExample } from '../../../examples/speeddial/layouts';
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
  entry: 'speeddial',
  title: 'Speed dial',
  purpose: 'A floating button that opens a set of icon actions.',
  optimusSelector: 'p-speeddial',
  examples: [
    {
      title: 'Basic',
      description:
        'Describe the actions as plain `WjMenuItem` objects (a type from `weeljack-ng`, documented on the Menu page at `/components/menu`) in `model`, and put each icon, a `wj-icon`, in an `ng-template` marked `wjSpeedDialItem` (import `WjSpeedDialItemSlot`: without it the template is silently dropped and every action is empty). `let-item` is your own item, so a `Map` keyed by the items finds its icon. An action has no icon field and no visible text: its `label` is its accessible name only, so every item needs one. The slot draws the round button for you, so put no link or button of your own inside it. A click, Enter or Space on an action runs its `command` with `{ originalEvent, item }`, `item` being your own object, then closes the dial. The closed actions are scaled to zero, not removed, so they keep their space: the host is not positioned for you. Place it out of flow, anchored at the toggle’s corner, with `position: fixed` and insets for a page-level button, or `position: absolute` inside a `position: relative` container, as the stage here does. The toggle sits at the end the actions grow away from. To change the actions, replace the array: it is read when it changes, and your objects are never changed. An item with `visible: false` is left out. Give the slot when the dial is created: Optimus reads its item template once, and a slot that appears later is not drawn. `visible` is two-way: bind `[(visible)]` to open or close the dial from code, or to know whether it is open.',
      sourceKey: 'speeddial/basic',
      component: SpeedDialBasicExample,
    },
    {
      title: 'Directions and circle types',
      description:
        '`direction` is the side the actions open toward (`up`, the default, `down`, `left` or `right`), and `type` is how they are laid out: `linear` (the default, in a line, 8 px apart), `circle` (evenly around the toggle), `semi-circle` (half a circle on the `direction` side) or `quarter-circle` (a quarter toward a diagonal `direction`: `up-left`, `up-right`, `down-left` or `down-right`, which are for this type only). The directions are physical: they are not mirrored in right-to-left pages. Anchor the toggle at the end the actions grow away from, as each stage does. The circle types place the actions on a circle of `radius` px around the toggle’s centre, and `radius` `0` gives each action 20 px, so 80 px for four: keep `radius` + 18 px of room on every side the actions open toward. Three to six actions fit well. Several dials on one page each need their own name; here the layout is in it.',
      sourceKey: 'speeddial/layouts',
      component: SpeedDialLayoutsExample,
    },
    {
      title: 'Disabled action',
      description:
        'A `disabled` action is dimmed, is not a Tab stop and runs nothing, whatever `command` the item carries. The arrow keys still land on it, which is Optimus’s behaviour and listed under Accessibility. `disabled` on the dial makes the toggle inert, so the actions cannot open.',
      sourceKey: 'speeddial/disabled',
      component: SpeedDialDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSpeedDialHarness` from `weeljack-ng/speeddial/testing`. `getName()` reads the toggle’s name, `isOpen()`, `toggle()`, `open()` and `close()` drive it, and `isDisabled()` says whether the whole dial is disabled. `getItems()` finds the actions (each a `WjSpeedDialItemHarness` with `getLabel()`, `isDisabled()`, `isActive()` and `click()`); `getItemLabels()` reads their names, and `clickItem()` opens the dial and runs one by its name, because a closed dial’s actions are out of reach. `focusToggle()` moves focus to the toggle. Nothing here names an Optimus class.',
      sourceKey: 'speeddial/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'The toggle is a Tab stop. While the dial is open each enabled action is a Tab stop too, after the toggle. Closed, the actions are skipped.',
    },
    { key: 'Enter, Space', effect: 'On the toggle, opens a closed dial and closes an open one.' },
    {
      key: 'Arrow Down, Arrow Left',
      effect:
        'On the toggle, opens the dial, moves focus to the list and activates the first action. The active action is in `aria-activedescendant` of the list and is shown by a ring.',
    },
    {
      key: 'Arrow Up, Arrow Right',
      effect:
        'On the toggle, opens the dial and moves focus to the list. Once the list has lost focus before, this activates the last action. Optimus starts with no active action, so the very first press on a fresh dial opens it and activates nothing: press it again on the list to start from the first.',
    },
    {
      key: 'Arrow keys on the list',
      effect:
        'Move the active action by `direction`: for `up` the Arrow Up key goes to the next action and Arrow Down back, for `down` the reverse, and likewise Arrow Left and Right for `left` and `right`. The active action stops at the first and last (it does not wrap).',
    },
    { key: 'Home, End', effect: 'Moves the active action to the first or last one.' },
    {
      key: 'Enter, Space',
      effect:
        'On the list, runs the active action’s `command`, closes the dial and puts focus back on the toggle. A disabled action is skipped by the arrow keys, so it is never the active one.',
    },
    {
      key: 'Enter, Space on an action',
      effect:
        'On an action reached with Tab, runs its `command` once, closes the dial and puts focus back on the toggle.',
    },
    { key: 'Escape', effect: 'Closes the dial and puts focus back on the toggle.' },
  ],
  aria: [
    'The toggle is a button with `aria-expanded` and `aria-haspopup`, and it is the dial’s focusable part. It is named "Actions" (from the translation, so `weeljack-ng/locale` gives "Thao tác" in Vietnamese) unless you set `ariaLabel`, or `ariaLabelledBy` pointing at visible text; `ariaDescribedBy` describes it (through the `pcButton` part of `pt`; a `pt.pcButton.root` of your own keeps its other keys, and the description set by the component wins over a `pt` value). All three are set on the toggle, not on the `wj-speeddial` host: an `aria-*` attribute on the host logs the dev-mode warning `WJ0003` and is not forwarded. With several dials on a page, give each its own name.',
    'The actions are a `role="menu"` list of `role="menuitem"` items, each holding a round button named by its item’s `label` (`aria-label`). So an action has no visible name: every item needs a `label`. Put only a decorative icon in the slot, such as a `wj-icon` at `font-size: 1rem` (16 px; it is `aria-hidden` and in `currentColor` by default), never a link, a button or text that carries meaning. The button is a plain `button` without a role of its own: the list item is the menu item, and a second `role="menuitem"` inside it fails axe (`aria-required-parent`).',
    '`WJ0141` is the dev-mode warning for a dial that has items but no `wjSpeedDialItem` template: every action is an empty button. It fires once per application, in dev mode only.',
    'Gap (Optimus), fixed: closed actions are only scaled to zero and made transparent, so they stayed in the page, in the accessibility tree and, as buttons, in the Tab order. While the dial is closed each action is `inert`, through a per-item `pt.item` function on Optimus’s own hidden state, and it is not inert once the dial is open. Tab from the toggle then reaches the next control, and a screen reader finds no actions until the dial opens. Optimus’s keyboard opening still works: the list itself is never inert, so Arrow keys on the toggle focus it before the dial shows.',
    'Gap (Optimus), fixed: every action pointed `aria-controls` at an id that never exists, which axe reports as an invalid value. The attribute is cleared on each action.',
    'Gap (Optimus), fixed: Optimus draws every item and its Enter key finds the action by its position in `model`, so an item with `visible: false` would draw anyway and Enter could run its neighbour. Items with `visible: false` are left out of a new array before Optimus sees them, so what is drawn is what Enter indexes.',
    'Gap (Optimus), fixed: the active action is marked `p-focus` but nothing is drawn, so a keyboard user could not see which action Enter would run. It gets the same 2 px ring as the toggle, in the preset’s focus colour, 2 px out.',
    'Gap (Optimus), fixed: the circle types did not centre on the toggle. Optimus’s root is not positioned, so the actions anchored to whatever ancestor was; its 8 px root gap moved the circle’s centre off the toggle; and it never sets the half-step it adds to each action’s position (it tries before its buttons have attributes), leaving the circle 4 px up and to the left. Each is fixed, so the actions sit on one circle exactly around the toggle’s centre.',
    'Gap (Optimus), fixed: the small icon-only button put its text padding back, which squeezed a 16 px icon to 10 px. The action’s padding is zero, so the icon is 16 × 16 px, centred in the 36 × 36 px button.',
    'Gap (Optimus), fixed: the actions, the toggle’s turn and the list animate over 200 to 800 ms, which does not follow the reduced-motion setting. Under `prefers-reduced-motion: reduce` their transitions are stopped, so the dial opens and closes in one frame and the plus becomes a cross at once.',
    'Gap, fixed: the arrow keys landed on a disabled action. Optimus skips only an item whose `a` is `p-disabled`, which its button rendering never has, so each disabled action is drawn with a hidden `a.p-disabled` beside its button (never rendered, not in the accessibility tree). The arrow keys, Home and End now skip it. While every action is disabled the marker is left off, because Optimus throws when it skips them all; the arrows then land on a disabled action, which runs nothing.',
    'Gap, fixed: Enter on the list ran the active action and put focus on the toggle during the key press, so the browser’s Enter then clicked the toggle and opened the dial again. The default of an Enter pressed on the list is now cancelled after Optimus’s handler, so the command runs and the dial stays closed, as Space already did.',
    'Gap, fixed: Enter or Space on an action reached with Tab ran nothing, because Optimus’s list took the key, found no active action and moved focus to the toggle. The action now handles both keys itself: it runs its `command` once as a click does, closes the dial and puts focus on the toggle, since the closed actions are `inert`.',
    'Gap (Optimus), listed: with a slot that appears after the dial was created, Optimus keeps its own empty buttons. Give the slot at creation.',
    'The tooltip inputs are not exposed: `tooltipOptions` can switch on a raw HTML write, so no tooltip ever appears, on hover or on focus. The icon is therefore the only visible hint of an action (it has no visible name).',
    'The toggle is 44 × 44 px and each action 36 × 36 px, both above the 24 × 24 px target size; the 36 px actions sit between the 24 px floor and the 44 px of the toggle, as the menu family’s rows do.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is an `inline-flex` box that holds the toggle and its actions, and it sets no position: the closed actions keep their space, so a `linear` dial of four is 220 px long before it opens. Place the host out of flow, anchored at the toggle’s corner, and keep `radius` + 18 px of room around the toggle for the circle types. The toggle is a round primary button, 44 × 44 px, whose plus turns 45° into a cross while the dial is open; each action is a round secondary button, 36 × 36 px, 8 px from its neighbours. Draw the icon in the slot at 16 px in `currentColor`, so it follows the button’s colour. For anything else, `pt` reaches the parts of the Optimus speed dial underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-speeddial`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'root',
      description:
        'The flex box that holds the toggle and the list. `wj-speeddial` makes it `position: relative`.',
    },
    {
      part: 'pcButton',
      description:
        'The toggle: a `pt` for Optimus’s button, whose `root` part is the `button`. `wj-speeddial` merges `aria-describedby` into `pcButton.root`, and it wins over a `pt` value.',
    },
    {
      part: 'list',
      description:
        'The `role="menu"` list that holds the actions. It is the element that takes focus.',
    },
    {
      part: 'item',
      description:
        'One action: a `role="menuitem"` `li`. `wj-speeddial` merges `inert` (while closed) and a cleared `aria-controls` into it, beside any `pt.item` of your own (an object, a function or a class string).',
    },
    {
      part: 'pcAction',
      description:
        'Optimus’s own action button. It does not apply with the slot: `wj-speeddial` draws the action itself, so style an action through `item`.',
    },
    {
      part: 'actionIcon',
      description:
        'Optimus’s own icon element, for an item `icon` class. It does not apply: the icon is the slot.',
    },
    { part: 'mask', description: 'Unused: `wj-speeddial` never shows Optimus’s mask.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Each item is an action: `label` names it and `command` runs it. Links and children are ignored. Items with `visible: false` are filtered out. The item fields are on the Menu page.',
    },
    {
      optimus: 'visible, visibleChange',
      weeljack: 'visible',
      status: 'kept',
      note: 'A two-way `model<boolean>(false)`.',
    },
    dropped('onVisibleChange', 'Duplicate of `visibleChange`.'),
    {
      optimus: 'direction',
      weeljack: 'direction',
      status: 'kept',
      note: 'Narrowed to `WjSpeedDialDirection`: `up` (default), `down`, `left`, `right`, `up-left`, `up-right`, `down-left` or `down-right`.',
    },
    {
      optimus: 'type',
      weeljack: 'type',
      status: 'kept',
      note: 'Narrowed to `WjSpeedDialType`: `linear` (default), `circle`, `semi-circle` or `quarter-circle`.',
    },
    {
      optimus: 'radius',
      weeljack: 'radius',
      status: 'kept',
      note: 'A number (`numberAttribute`), default `0`: the circle types give each action 20 px.',
    },
    {
      optimus: 'disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'A `booleanAttribute`.',
    },
    {
      optimus: 'ariaLabel, ariaLabelledBy',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'The toggle’s name. `ariaLabel` defaults to "Actions" (`wj.actions` in the translation).',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the toggle, through the `pcButton.root` part of `pt`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjSpeedDialPt`. Tracks Optimus. With the item slot, `pcAction` and `actionIcon` reach nothing, because the wrapper draws the action: style an action through `item`.',
    },
    {
      optimus: '#item template',
      weeljack: 'wjSpeedDialItem slot',
      status: 'renamed',
      note: 'An `ng-template[wjSpeedDialItem]`, typed `WjSpeedDialItemSlot`, whose context `WjSpeedDialItemContext` is `$implicit`, your own item. It is the icon route: `WjMenuItem` has no icon field. The wrapper draws the action button and puts your template inside it. Without it every action is empty and `WJ0141` warns. Read once, when the dial is created.',
    },
    dropped('#button', 'Not exposed: Optimus’s toggle keeps its own ARIA wiring.'),
    dropped('#icon', 'Icon slot, not exposed.'),
    dropped('showIcon, hideIcon', 'Icon class names: the icon font is not shipped.'),
    dropped(
      'rotateAnimation',
      'Not exposed: the toggle’s turn stays, and stops under reduced motion.',
    ),
    dropped(
      'transitionDelay, mask, hideOnClickOutside',
      `${droppedByNeed} No stagger, no mask, and Optimus’s close on an outside click holds.`,
    ),
    dropped(
      'tooltipOptions',
      'Not exposed: `tooltipOptions.escape: false` turns on a raw HTML write. No tooltip appears.',
    ),
    dropped('buttonProps', droppedByNeed),
    dropped('onClick, onShow, onHide', `${droppedByNeed} \`visible\` reports opening and closing.`),
    dropped('show(), hide()', 'Use `visible`.'),
    dropped('id', 'Optimus generates one.'),
    dropped(
      'style, className, buttonStyle, buttonClassName, maskStyle, maskClassName',
      `${droppedAlways} Deprecated since Optimus v20.`,
    ),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'p-speedDial, p-speed-dial, SpeedDialModule, SpeedDialStyle',
      'Duplicate selectors and internals.',
    ),
  ],
};
