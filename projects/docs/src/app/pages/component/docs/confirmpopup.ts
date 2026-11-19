import { ConfirmPopupBasicExample } from '../../../examples/confirmpopup/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'confirmpopup',
  title: 'Confirm popup',
  purpose:
    'Ask for a quick confirmation beside the button that triggered it: pass the button as `target` to `WjConfirmationService.confirm`. Render one `wj-confirmpopup` in your app shell.',
  optimusSelector: 'p-confirmpopup',
  examples: [
    {
      title: 'Basic',
      description:
        'A "Remove" button passes itself as `target`, and a line under it shows what was chosen. The popup opens below the button, or above it when there is no room, and is named by its message, so keep the message to one short question. Without `acceptLabel` and `rejectLabel` the buttons read "Yes" and "No", from the translation. Cancel has focus when the popup opens, and Escape means Cancel. A confirmation without a `target` opens the app’s `wj-confirmdialog` instead. This is the only live `wj-confirmpopup` on the page: render one per app, because every host opens every confirmation with a `target`.',
      sourceKey: 'confirmpopup/basic',
      component: ConfirmPopupBasicExample,
    },
    {
      title: 'Testing',
      description:
        "In a spec, inject the service and spy on it: `vi.spyOn(TestBed.inject(WjConfirmationService), 'confirm')`, then `expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'Remove this item from the list?' }))`. It needs no provider. To drive the popup on screen, import `WjConfirmPopupHarness` from `weeljack-ng/confirmpopup/testing`: `isOpen()`, `getMessage()`, `getAcceptLabel()`, `getRejectLabel()`, `getName()`, `getRole()`, `accept()`, `reject()` and `cancel()` (Escape). It finds the popup in the document, because the popup renders in `document.body`.",
      sourceKey: 'confirmpopup/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Opening', effect: 'Focus moves to Reject, the least destructive choice.' },
    {
      key: 'Tab, Shift+Tab',
      effect: 'Cycles through Reject and Accept. It never leaves the popup.',
    },
    { key: 'Enter, Space', effect: 'Activates the focused button.' },
    {
      key: 'Escape',
      effect: 'Means Reject: runs `reject` once and closes.',
    },
    {
      key: 'Closing',
      effect:
        'Focus returns to the `target`. A click outside the popup closes it and leaves focus where the click put it.',
    },
  ],
  aria: [
    'The popup is an `alertdialog`, named by the confirmation’s `message`. It has no header: `header` is ignored. It is marked `aria-modal`, because it traps Tab: Optimus does that with two `aria-hidden` focusable sentinels, which assistive technology accepts only in a modal. The page behind stays clickable, and a click there closes the popup.',
    'Reject has focus when it opens. Escape and Reject run `reject` once; Accept runs `accept` once. A click outside, a scroll or a resize closes it without running either.',
    'The buttons read the confirmation’s `acceptLabel` and `rejectLabel`, else the translation’s `accept` and `reject` ("Yes" and "No" in English).',
    'Optimus focuses nothing in the popup on its own (it looks for template references it does not declare), and writes `autofocus="true"` on a button to focus it. `wj-confirmpopup` keeps `autofocus` off both buttons and focuses Reject itself. A popup that opens above its target overlaps it by the gutter in Optimus, because its flipped class does not match its stylesheet; `wj-confirmpopup` adds the class the stylesheet knows.',
    'Focus returns to the `target` after Accept, Reject, Escape and `close()`. When the `target` is a `wj-button`, it returns to the button inside it, because the host cannot take focus. Pass `event.currentTarget` from the click on the button. If the `target` has been removed, move focus yourself. In Safari, which does not focus a button when it is clicked, focus falls back to the last pressed control.',
    'Stacked overlays: Escape reaches the topmost one, so a confirmation opened over a non-closable `wj-dialog` closes on Escape and leaves the dialog open.',
    'The popup is only as wide as its message, up to the viewport. Keep the message to one short question: no rule can cap a panel that renders in `document.body`. Under reduced motion it opens and closes without motion.',
    'Render one `wj-confirmpopup`. A second one warns `WJ0151`, because each would open every confirmation with a `target`.',
    '`aria-*` on `wj-confirmpopup` raises `WJ0003`: the message names the popup, and the host has no focusable element to route them to.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus confirm popup underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-confirmpopup`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-confirmpopup` routes attributes of its own onto the root, the message and the two buttons, and stamps `data-wj-confirm*` hooks that the harness reads: a routed value wins over yours on the same attribute, and your `pt` keeps every other one. The popup renders in `document.body`, outside the host, so your component’s styles do not reach it; style it through `pt` classes. Reject is drawn as the secondary outlined button through an internal class on `pcRejectButton`. The `icon` part is not rendered.',
  parts: [
    { part: 'host', description: 'The Optimus `p-confirmpopup` element.' },
    { part: 'root', description: 'The popup: the `alertdialog`, named by the message.' },
    { part: 'content', description: 'The body that holds the message.' },
    { part: 'message', description: 'The `message` text, which names the popup.' },
    { part: 'footer', description: 'The row of Reject and Accept.' },
    {
      part: 'pcRejectButton',
      description: 'The Reject button. Its `root` is the `button` element.',
    },
    {
      part: 'pcAcceptButton',
      description: 'The Accept button. Its `root` is the `button` element.',
    },
  ],
  mapping: [
    {
      optimus: 'ConfirmationService (app-provided)',
      weeljack: 'WjConfirmationService (root-provided, in `weeljack-ng`)',
      status: 'renamed',
      note: 'The app provides nothing.',
    },
    {
      optimus: 'ConfirmationService.confirm(confirmation)',
      weeljack: 'WjConfirmationService.confirm(confirmation)',
      status: 'kept',
      note: 'Takes a `WjConfirmation`. It routes by `target`: one opens this popup, none opens the dialog.',
    },
    {
      optimus: 'Confirmation target',
      weeljack: 'WjConfirmation target',
      status: 'kept',
      note: 'The element the popup opens beside, and the one focus returns to. Pass `event.currentTarget`.',
    },
    {
      optimus: 'Confirmation message, acceptLabel, rejectLabel, accept, reject',
      weeljack: 'WjConfirmation message, acceptLabel, rejectLabel, accept, reject',
      status: 'kept',
      note: '`accept` and `reject` are `() => void`. The message is rendered as text.',
    },
    dropped(
      'Confirmation header',
      'The popup has no header: its message names it. A `header` is ignored.',
    ),
    dropped(
      'Confirmation key',
      'The service routes: a `target` opens the popup, none opens the dialog.',
    ),
    dropped('Confirmation icon, acceptIcon, rejectIcon', 'Icons are not exposed.'),
    dropped('Confirmation acceptVisible, rejectVisible', 'Both buttons always show.'),
    dropped(
      'Confirmation closeOnEscape, dismissableMask, defaultFocus',
      'Fixed: Escape rejects, an outside click closes, and Reject has focus first.',
    ),
    dropped(
      'Confirmation acceptButtonStyleClass, rejectButtonStyleClass, acceptButtonProps, rejectButtonProps',
      'No class inputs on a wrapper. `wj-confirmpopup` sets the button props it needs itself.',
    ),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjConfirmPopupPt`. Tracks Optimus.',
    },
    dropped('key', 'The service routes.'),
    dropped('defaultFocus', 'Fixed: Reject, the least destructive choice.'),
    dropped('visible', 'The service opens it.'),
    dropped('motionOptions', 'Fixed: motion is skipped under reduced motion.'),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'appendTo, autoZIndex, baseZIndex',
      'Optimus’s defaults: the popup renders in `document.body`, layered by Optimus.',
    ),
    dropped(
      '#content, #accepticon, #rejecticon, #headless and their template inputs',
      'The message is text, and icons are not exposed.',
    ),
    dropped('methods hide, onAccept, onReject', 'Use `WjConfirmationService.close()`.'),
    dropped('style, styleClass, dt, unstyled, ptOptions, ConfirmPopupModule', droppedAlways),
  ],
};
