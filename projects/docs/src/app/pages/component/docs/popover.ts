import { PopoverBasicExample } from '../../../examples/popover/basic';
import { PopoverWithControlsExample } from '../../../examples/popover/with-controls';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'popover',
  title: 'Popover',
  purpose: 'A small non-modal dialog anchored to the element that opened it.',
  examples: [
    {
      title: 'Basic',
      description:
        'A "Shipping details" button toggles a popover of text, named with `ariaLabel`. Open it from the trigger’s click with `popover.toggle($event)`: the panel opens below the trigger, or above it when there is no room, and focus moves onto the panel, because it holds no control. The trigger carries `ariaHasPopup="dialog"` and `ariaExpanded`, the latter bound to `opened` and `closed`. Size the content yourself: the panel is as wide as what you put in it.',
      sourceKey: 'popover/basic',
      component: PopoverBasicExample,
    },
    {
      title: 'With controls',
      description:
        'A "Rename" button opens a small form, named by the caption inside it through `ariaLabelledBy`. Focus lands on the first control, Tab stays inside, and Save calls `hide()`. Escape and a click outside discard the edit; in every case focus returns to the Rename button.',
      sourceKey: 'popover/with-controls',
      component: PopoverWithControlsExample,
    },
    {
      title: 'Testing',
      description:
        "In a spec, import `WjPopoverHarness` from `weeljack-ng/popover/testing`: `isOpen()`, `getName()`, `getRole()`, `close()` (Escape) and `closeByClickingOutside()`. It finds the panel in the document, because the panel renders in `document.body`, and it reaches the harnesses of the controls inside it, so `popover.getHarness(WjButtonHarness.with({ label: 'Save' }))` works. Open the popover from the trigger first; a closed popover renders nothing.",
      sourceKey: 'popover/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Enter, Space on the trigger',
      effect:
        'Opens the popover and moves focus into it: to the first control, or onto the panel when it has none.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect: 'Cycles through the controls inside. It never leaves the popover while it holds one.',
    },
    {
      key: 'Escape',
      effect: 'Closes the popover, and focus returns to the trigger.',
    },
    {
      key: 'Closing',
      effect:
        'Focus returns to the trigger after Escape, `hide()`, and a click outside that lands on nothing focusable. A click on another control leaves focus on that control.',
    },
  ],
  aria: [
    'Name it with `ariaLabel` or `ariaLabelledBy`: the panel is a `dialog`, and an unnamed one is announced as an unnamed dialog. Opening one with neither raises `WJ0152` in dev mode. Both inputs are attribute text; a string with markup in it is never parsed.',
    'It is a named, non-modal dialog. Optimus sets `aria-modal="true"` on a panel that has no backdrop, so `wj-popover` clears it. The page behind stays reachable, and a click there closes the popover.',
    'Focus never reaches Optimus’s panel on its own: it focuses only an `[autofocus]` element, and the panel sits at the end of `document.body`, so Tab from the trigger never gets there. `wj-popover` moves focus in when it opens, so a screen reader announces the dialog’s name and then the focused control, or the panel’s text when there is no control. With no control, the panel itself takes focus (`tabindex="-1"`) and shows only the browser’s own focus indication.',
    'Tab stays inside through Optimus’s focus trap while the panel holds a control. A panel with only text has nothing to cycle, so it sets no trap and Tab leaves it.',
    'Focus returns to the trigger after Escape, `hide()` and a click outside that lands on nothing focusable. When the trigger is a `wj-button`, it returns to the button inside it, because the host cannot take focus. Pass `$event` from the click on the button. If the trigger has been removed, move focus yourself. In Safari, which does not focus a button when it is clicked, focus falls back to the last pressed control.',
    'Stacked overlays: Escape closes the popover and leaves a non-closable `wj-dialog` below it open. Gap, fixed: Optimus’s own Escape listener is document-wide, so a popover that was open while another overlay opened above it closed on that overlay’s Escape too. Escape now reaches only the topmost overlay: the one above closes, and the next Escape closes the popover.',
    'Gap, fixed: give a `wj-button` trigger `ariaHasPopup="dialog"` and `ariaExpanded`, as the examples do. They are set on the button element, and `ariaExpanded` follows `opened` and `closed`.',
    'Under reduced motion the popover opens and closes without motion. `aria-*` on `wj-popover` raises `WJ0003`: use `ariaLabel` or `ariaLabelledBy`, because the host has no focusable element to forward them to.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus popover underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-popover`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-popover` routes a `data-wj-popover` hook and a cleared `aria-modal` onto the root: a routed value wins over yours on the same attribute, and your `pt` keeps every other one. The panel renders in `document.body`, outside the host, so your component’s styles do not reach it; style it through `pt` classes. Its width is your content’s: set it on the content you project.',
  parts: [
    { part: 'host', description: 'The Optimus `p-popover` element.' },
    {
      part: 'root',
      description: 'The panel: the `dialog`, named by `ariaLabel` or `ariaLabelledBy`.',
    },
    {
      part: 'content',
      description: 'The box that holds your content, with the surface’s padding.',
    },
  ],
  mapping: [
    {
      optimus: 'toggle(event, target?)',
      weeljack: 'toggle(event: Event, target?: HTMLElement)',
      status: 'kept',
      note: '`target` defaults to the event’s current target.',
    },
    {
      optimus: 'show(event, target?)',
      weeljack: 'show(event: Event, target?: HTMLElement)',
      status: 'kept',
      note: 'Opens beside `target`, which defaults to the event’s current target.',
    },
    { optimus: 'hide()', weeljack: 'hide()', status: 'kept', note: 'Closes the panel.' },
    {
      optimus: 'onShow',
      weeljack: 'opened',
      status: 'renamed',
      note: 'Emits `void`, once the panel is open and focus is inside.',
    },
    {
      optimus: 'onHide',
      weeljack: 'closed',
      status: 'renamed',
      note: 'Emits `void`, once per close, whatever closed it.',
    },
    {
      optimus: 'ariaLabel',
      weeljack: 'ariaLabel',
      status: 'kept',
      note: 'Names the panel. Set this or `ariaLabelledBy`.',
    },
    {
      optimus: 'ariaLabelledBy',
      weeljack: 'ariaLabelledBy',
      status: 'kept',
      note: 'The id of the element inside that names the panel.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjPopoverPt`. Tracks Optimus. Parts `host`, `root`, `content`.',
    },
    {
      optimus: 'Default content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Whatever you project is the panel’s content.',
    },
    dropped(
      '#content (with closeCallback)',
      'Call `hide()` through a template reference instead: `(click)="popover.hide()"`.',
    ),
    dropped('dismissable', 'Always true: a click outside always closes it.'),
    dropped('focusOnShow', 'Fixed: focus moves in when it opens.'),
    dropped('ariaCloseLabel', 'Optimus renders no close button.'),
    dropped('motionOptions', 'Fixed: motion is skipped under reduced motion.'),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'appendTo, autoZIndex, baseZIndex',
      'Optimus’s defaults: the panel renders in `document.body`, layered by Optimus.',
    ),
    dropped('style, styleClass, dt, unstyled, ptOptions, PopoverModule', droppedAlways),
  ],
};
