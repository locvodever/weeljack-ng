import { OverlayBasicExample } from '../../../examples/overlay/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'overlay',
  title: 'Overlay',
  purpose: 'A panel anchored to the element before it, for building your own dropdowns.',
  examples: [
    {
      title: 'Basic',
      description:
        'A "Resources" button toggles an overlay of three links. The button carries `aria-expanded`, bound to `visible`, and `aria-controls`, through its `pt`: the overlay has no role of its own, so the trigger says what it controls. Put `wj-overlay` right after the trigger, so the panel opens beneath it and Tab moves from the trigger into the links. Focus stays on the button when it opens; Escape closes it and focus is on the button.',
      sourceKey: 'overlay/basic',
      component: OverlayBasicExample,
    },
    {
      title: 'Testing',
      description:
        'In a spec, import `WjOverlayHarness` from `weeljack-ng/overlay/testing`: `isOpen()`, `close()` (Escape) and `closeByClickingOutside()`. The panel renders inside the host, so `overlay.getHarness(...)` reaches the harnesses of whatever you put in it. Open the overlay from its trigger first; a closed overlay renders nothing.',
      sourceKey: 'overlay/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Enter, Space on the trigger',
      effect: 'Your trigger sets `visible`. Opening keeps focus on the trigger.',
    },
    {
      key: 'Tab',
      effect:
        'Moves from the trigger into the panel, because the panel is right after it in the page. There is no focus trap: Tab past the last control leaves the panel, and it stays open.',
    },
    {
      key: 'Escape',
      effect: 'Closes the overlay, and focus is on the trigger.',
    },
    {
      key: 'Closing',
      effect:
        'Focus is on the trigger after Escape, a scroll, a resize or `visible` set to `false`. A click outside closes it and leaves focus where the click put it.',
    },
  ],
  aria: [
    'The overlay has no role of its own: its content decides what it is, a list of links, a set of buttons or a menu you build. Give the trigger `aria-expanded`, bound to `visible`, and `aria-controls` with the id of what it opens, through its `pt` as the example does. Add `aria-haspopup` only when the panel really is a menu or a dialog.',
    'Focus stays on the trigger when the overlay opens, so a screen reader announces "expanded" there, and the next Tab enters the panel. Nothing is announced for the panel itself, so give it content that reads on its own.',
    'Focus returns to the trigger on Escape, on a scroll or resize that closes it, and when you set `visible` to `false`. When the trigger is a `wj-button`, it returns to the button inside it. If the trigger has been removed, move focus yourself. In Safari, which does not focus a button when it is clicked, focus falls back to the last pressed control.',
    'The overlay takes part in the overlay stack. Inside a non-closable `wj-dialog`, Escape closes the overlay and leaves the dialog open. Optimus’s own Escape listener is document-wide: an overlay that is open while another overlay is opened above it also closes on that overlay’s Escape.',
    'The panel renders inside `wj-overlay`, so a scroll container with `overflow: hidden` or `auto` around it can clip the panel. Put the overlay outside such a container, or leave room inside it.',
    'The panel sits below the target, or above it when there is no room, and at least as wide as the target. It is placed when it opens: it does not follow the target if the page moves under it, and a scroll or resize closes it. Right-to-left pages are not placed yet.',
    'With no `target` and no element before it, `wj-overlay` raises `WJ0154` in dev mode when it opens, and has nothing to anchor to. `aria-*` on `wj-overlay` is not forwarded: put them on your trigger.',
    'Under reduced motion the overlay opens and closes without motion.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. Optimus’s overlay has no look of its own, so `wj-overlay` paints the panel as the popover surface: `--wj-overlay-popover-background`, a 1px `--wj-overlay-popover-border-color` edge, `--wj-overlay-popover-color`, `--wj-overlay-popover-border-radius` and `--wj-overlay-popover-shadow`, with 4px of padding and no arrow. Your own CSS, or a `class` through `pt.content`, overrides any of it. For anything else, `pt` reaches the parts of the Optimus overlay underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-overlay`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. The host is a block with no height, so the panel never moves the page.',
  parts: [
    {
      part: 'root',
      description: 'The positioned box that holds the panel. It is absolutely positioned.',
    },
    {
      part: 'content',
      description: 'The panel: the surface that holds your content, with its 4px padding.',
    },
  ],
  mapping: [
    {
      optimus: 'visible, visibleChange',
      weeljack: 'visible',
      status: 'kept',
      note: 'A two-way `model(false)`: `[(visible)]="open"`.',
    },
    {
      optimus: 'target (default `@prev`)',
      weeljack: 'target: HTMLElement',
      status: 'kept',
      note: 'Defaults to the element just before the `wj-overlay` host. Optimus resolves `@prev` from inside its own element, where nothing precedes it, so the wrapper resolves it from the host and hands Optimus the element.',
    },
    {
      optimus: 'onShow',
      weeljack: 'opened',
      status: 'renamed',
      note: 'Emits `void`, once each time the panel opens.',
    },
    {
      optimus: 'onHide',
      weeljack: 'closed',
      status: 'renamed',
      note: 'Emits `void`, once per close, whatever closed it, including your own `visible` set to `false`.',
    },
    dropped(
      'onBeforeShow, onBeforeHide, onAnimationStart, onAnimationDone, onBeforeEnter, onEnter, onAfterEnter, onBeforeLeave, onLeave, onAfterLeave',
      'Motion plumbing. `opened` and `closed` cover the need.',
    ),
    dropped(
      'mode, responsive',
      'The overlay is always the anchored one: use `wj-dialog` or `wj-sheet` for a modal panel.',
    ),
    dropped('options, listener, inline, hostAttrSelector, hostName', 'Internal.'),
    dropped(
      'appendTo, autoZIndex, baseZIndex',
      'Fixed: the panel renders inside the host, layered by Optimus.',
    ),
    dropped('motionOptions', 'Fixed: motion is skipped under reduced motion.'),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'style, styleClass, contentStyle, contentStyleClass, dt, unstyled, ptOptions',
      droppedAlways,
    ),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjOverlayPt`. Tracks Optimus. Parts `root`, `content`.',
    },
    {
      optimus: 'Default content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Whatever you project is the panel’s content.',
    },
    dropped('#content (context `mode`)', 'The mode is always the anchored one.'),
  ],
};
