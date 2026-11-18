import { PanelBasicExample } from '../../../examples/panel/basic';
import { PanelSlotsExample } from '../../../examples/panel/slots';
import { PanelToggleableExample } from '../../../examples/panel/toggleable';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'panel',
  title: 'Panel',
  purpose: 'A titled box whose content can collapse.',
  examples: [
    {
      title: 'Basic',
      description:
        'A panel is a bordered box with a title and content. Every panel needs a title: set `header`, or fill the `wjPanelHeader` slot. A panel with neither still draws an empty header band.',
      sourceKey: 'panel/basic',
      component: PanelBasicExample,
    },
    {
      title: 'Toggleable',
      description:
        'With `toggleable`, a plus or minus button collapses and expands the content. `collapsed` is a two-way model, so `[(collapsed)]` reports every toggle, a click or a key press alike; the state line below follows it. The panel is open at rest. Collapsed content takes no space and leaves the Tab order.',
      sourceKey: 'panel/toggleable',
      component: PanelToggleableExample,
    },
    {
      title: 'Header, actions and footer slots',
      description:
        'Three slots take an `ng-template`: `wjPanelHeader` renders beside the title, `wjPanelIcons` renders in the header’s actions area before the toggle, and `wjPanelFooter` renders under the content, inside the part that collapses. Import the three slot classes: a template whose directive is not imported is silently dropped. A section exists only while its slot is filled, and a slot can appear or go after the panel is created.',
      sourceKey: 'panel/slots',
      component: PanelSlotsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjPanelHarness` from `weeljack-ng/panel/testing`. `WjPanelHarness.with({ headerText })` finds a panel by its `header` text. `getHeaderText()`, `getContentText()` and `getFooterText()` (`null` without a footer) read what the user sees; `isToggleable()` and `isCollapsed()` read the state. `toggle()` clicks the toggle button, `focus()` moves focus to it and `isFocused()` says whether it has focus. `toggle()` and `focus()` fail on a panel with no toggle. `getContentText()` works on a collapsed panel too. Nothing here names an Optimus class.',
      sourceKey: 'panel/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Enter, Space',
      effect:
        'On the toggle button: collapses an open panel and opens a collapsed one. Each press toggles once.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Reaches the toggle button, after any buttons you put in the `wjPanelIcons` slot. The content of a collapsed panel is skipped.',
    },
  ],
  aria: [
    'The toggle is a real `button` with `aria-expanded` and `aria-controls`, and the content is a `role="region"` labelled by the header (the APG Disclosure pattern). The panel takes no ARIA input: the header names it.',
    'Always give a panel a `header`, or fill the `wjPanelHeader` slot. A toggleable panel with neither logs the dev-mode warning `WJ0110` once (it never throws): its toggle button has no accessible name. A panel that is not toggleable is not warned about, but it still draws an empty header band.',
    'Setting an `aria-*` attribute on the `wj-panel` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'Name an icon-only button you put in the `wjPanelIcons` slot yourself.',
    'Gap, fixed: with a `wjPanelHeader` slot and no `header` text, Optimus leaves the toggle button with no name. `wj-panel` wraps the slot’s content in an element with a unique id and points the toggle button’s and the region’s `aria-labelledby` at it. With `header` text, both point at the title.',
    'Gap, fixed: Optimus writes the same id (`<id>_header`) on the title and on the toggle, and points the region at it. `wj-panel` gives the title its own unique id, so every id on the page is unique and the region is still labelled by the header.',
    'Gap, fixed: Optimus puts `role="button"`, `aria-expanded` and `aria-controls` on a `p-button` host that wraps the real button, which axe reports as `nested-interactive`. `wj-panel` removes the role from that host and puts `aria-expanded` and `aria-controls` on the real button. The host keeps its other attributes, which assistive technology ignores on an element with no role.',
    'Gap, fixed: Optimus 2.0.2 gives the toggle button `autofocus="true"`, so the browser could focus it on load. `wj-panel` keeps it off.',
    'Gap, fixed: a panel that is not `toggleable` is never collapsed. Optimus would otherwise mark the visible content `aria-hidden` when `collapsed` is `true`.',
    'Motion: collapsing and expanding are skipped under `prefers-reduced-motion: reduce`, and `pt.motion` cannot turn that off.',
    'No axe rule is tolerated on this page: the five documented states (not toggleable, toggleable and expanded, toggleable and collapsed, all three slots filled, header slot with no `header` text) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, borders and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, so its width is yours. A long title wraps and is never truncated. Where `wj-panel` routes its own attributes onto a part (the title’s `id`, the toggle button’s `aria-labelledby`, `aria-expanded` and `aria-controls`, the region’s `aria-labelledby`, the toggle host’s `role`), the routed value wins over the same attribute in your `pt`; every other key you set is kept. `pt` reaches the parts of the Optimus panel underneath, and the nested toggle button as `pcToggleButton`. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-panel`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt.motion` is merged under the component’s own safe motion, so it cannot turn reduced motion off.',
  parts: [
    { part: 'host', description: 'The `p-panel` element, as the host of the Optimus panel.' },
    { part: 'root', description: 'The `p-panel` element: the bordered box.' },
    { part: 'header', description: 'The header row: title, header slot and actions.' },
    { part: 'title', description: 'The `header` text.' },
    {
      part: 'headerActions',
      description:
        'The actions area at the end of the header: the `wjPanelIcons` slot and the toggle.',
    },
    {
      part: 'pcToggleButton',
      description: 'The nested toggle button, with the button’s own parts (`root`, `icon`).',
    },
    { part: 'contentContainer', description: 'The `role="region"` that collapses.' },
    {
      part: 'contentWrapper',
      description: 'The element that carries the height while the panel opens.',
    },
    { part: 'content', description: 'The padded box around the content.' },
    { part: 'footer', description: 'The footer, present only with a `wjPanelFooter` slot.' },
  ],
  mapping: [
    {
      optimus: 'header',
      weeljack: 'header',
      status: 'kept',
      note: 'Text, rendered as text. It also names the toggle button.',
    },
    {
      optimus: 'toggleable',
      weeljack: 'toggleable',
      status: 'kept',
      note: 'Accepts a bare attribute.',
    },
    {
      optimus: 'collapsed, collapsedChange',
      weeljack: 'collapsed',
      status: 'kept',
      note: 'One two-way model, `[(collapsed)]`; it takes a binding, not a bare attribute. Optimus’s `undefined` arrives as `false`. Ignored unless `toggleable`.',
    },
    dropped(
      'onBeforeToggle, onAfterToggle',
      'Exposed by need: the `collapsed` model reports every toggle.',
    ),
    {
      optimus: '#header',
      weeljack: '`wjPanelHeader` slot',
      status: 'renamed',
      note: 'An `ng-template[wjPanelHeader]`, typed `WjPanelHeaderSlot`. Rendered beside the `header` text.',
    },
    {
      optimus: '#icons',
      weeljack: '`wjPanelIcons` slot',
      status: 'renamed',
      note: 'An `ng-template[wjPanelIcons]`, typed `WjPanelIconsSlot`. The header’s actions area (`pt` part `headerActions`).',
    },
    {
      optimus: '#footer',
      weeljack: '`wjPanelFooter` slot',
      status: 'renamed',
      note: 'An `ng-template[wjPanelFooter]`, typed `WjPanelFooterSlot`. The footer renders only when it is used.',
    },
    {
      optimus: '#content',
      weeljack: 'Default content',
      status: 'renamed',
      note: 'Projected.',
    },
    dropped('#headericons', 'Icon slot: icons are not exposed.'),
    dropped('p-header, p-footer facets', 'Use the slots.'),
    dropped(
      'iconPos, toggler, showHeader, toggleButtonProps, id',
      'Exposed by need: Optimus’s defaults apply (`toggler="icon"`), and Optimus generates the id.',
    ),
    dropped('motionOptions', 'Bound to `{ safe: true }`, so motion respects reduced motion.'),
    dropped('transitionOptions', 'Deprecated alias.'),
    dropped('styleClass; dt, unstyled, ptOptions', droppedAlways),
    dropped('toggle(), expand(), collapse()', 'Set `collapsed` instead.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjPanelPt`. Reaches the nested toggle button as `pcToggleButton`. Tracks Optimus.',
    },
  ],
};
