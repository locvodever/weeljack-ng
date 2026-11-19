import { ConfirmDialogBasicExample } from '../../../examples/confirmdialog/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'confirmdialog',
  title: 'Confirm dialog',
  purpose:
    'Ask the reader to confirm an action in a modal dialog, from your code: `inject(WjConfirmationService).confirm({ header, message, accept })`. Render one `wj-confirmdialog` in your app shell.',
  optimusSelector: 'p-confirmDialog',
  examples: [
    {
      title: 'Basic',
      description:
        'A button asks for a confirmation and a line under it shows what was chosen. The confirmation names its `header`, `message` and button labels: without `acceptLabel` and `rejectLabel` the buttons read "Yes" and "No", from the translation. Cancel has focus when the dialog opens, and Escape means Cancel. This is the only live `wj-confirmdialog` on the page: render one per app, because every host opens every confirmation.',
      sourceKey: 'confirmdialog/basic',
      component: ConfirmDialogBasicExample,
    },
    {
      title: 'In the app shell',
      description:
        'Render one `wj-confirmdialog` in the root component, beside the router outlet. Provide nothing: `WjConfirmationService` is root-provided, and the host reads the same confirmations. A confirmation asked while no `wj-confirmdialog` is rendered is dropped, with the dev-mode warning `WJ0150`. A confirmation with a `target` opens in a `wj-confirmpopup` instead.',
      sourceKey: 'confirmdialog/app-shell',
      component: null,
    },
    {
      title: 'Testing',
      description:
        "In a spec, inject the service and spy on it: `vi.spyOn(TestBed.inject(WjConfirmationService), 'confirm')`, then `expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete this file?' }))`. It replaces spying on the Optimus `ConfirmationService`, and needs no provider. To drive the dialog on screen, import `WjConfirmDialogHarness` from `weeljack-ng/confirmdialog/testing`: `isOpen()`, `getHeader()`, `getMessage()`, `getAcceptLabel()`, `getRejectLabel()`, `accept()`, `reject()`, `close()`, `cancel()` (Escape), `getCloseLabel()`, `getRole()` and `isModal()`.",
      sourceKey: 'confirmdialog/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Opening', effect: 'Focus moves to Reject, the least destructive choice.' },
    {
      key: 'Tab, Shift+Tab',
      effect: 'Cycles through Reject, Accept and the close button. It never leaves the dialog.',
    },
    { key: 'Enter, Space', effect: 'Activates the focused button.' },
    {
      key: 'Escape',
      effect: 'Means Reject: runs `reject` once and closes. A click on the backdrop does nothing.',
    },
    { key: 'Closing', effect: 'Focus returns to the control that asked.' },
  ],
  aria: [
    'The dialog is an `alertdialog`, modal. It is named by the confirmation’s `header`, or by its `message` when there is no `header`, and always described by its `message`.',
    'Reject has focus when it opens. Escape, the close button and Reject all run `reject` once; Accept runs `accept` once; the backdrop never closes it.',
    'The buttons read the confirmation’s `acceptLabel` and `rejectLabel`, else the translation’s `accept` and `reject` ("Yes" and "No" in English). The close button is named from `aria.close`.',
    'Optimus binds no name and no `autofocus` setting for the close button, and writes `autofocus="true"` on its buttons. `wj-confirmdialog` names the close button and keeps `autofocus` off all three.',
    'Focus returns to the control that asked, also in Safari, which does not focus a button when it is clicked. It falls back to the last pressed control. If that control has been removed, move focus yourself.',
    'Stacked overlays: Escape reaches the topmost one, so a confirmation opened over a non-closable `wj-dialog` closes on Escape and leaves the dialog open, with its backdrop and the page’s scroll lock.',
    'A slow action does not belong in a confirmation: it closes at once. Use `wj-dialog`’s busy pattern for an action that takes time.',
    'The panel is never wider than the viewport minus 1 rem on each side, a long header wraps, and the message keeps a readable measure and breaks long words (WCAG 1.4.10). Under reduced motion it opens and closes without motion.',
    'Render one `wj-confirmdialog`. A second one warns `WJ0151`, because each would open every confirmation.',
    '`aria-*` on `wj-confirmdialog` raises `WJ0003`: the header and message name and describe the dialog, and the host has no focusable element to route them to.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits, as for `wj-dialog`. For anything else, `pt` reaches the parts of the Optimus confirm dialog underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-confirmdialog`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-confirmdialog` routes attributes of its own onto the root, the title, the three buttons and the motion, and stamps `data-wj-confirm-*` hooks that the harness reads: a routed value wins over yours on the same attribute, and your `pt` keeps every other one. A function `pt` is called once, with no instance, because Optimus hands the Dialog inside it the `pt` as given. Reject is drawn as the secondary outlined button through an internal class on `pcRejectButton`. The `message` and `icon` parts are not rendered: the message is the wrapper’s own element, so it is never read as HTML.',
  parts: [
    { part: 'host', description: 'The Optimus `p-confirmdialog` element.' },
    { part: 'root', description: 'The dialog element: the `alertdialog`, named and described.' },
    { part: 'mask', description: 'The backdrop behind the dialog.' },
    { part: 'header', description: 'The row with the title and the close button.' },
    { part: 'title', description: 'The `header` text, which names the dialog.' },
    { part: 'headerActions', description: 'The container of the close button.' },
    { part: 'pcCloseButton', description: 'The close button. Its `root` is the `button` element.' },
    { part: 'content', description: 'The body that holds the message.' },
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
      note: 'Takes a `WjConfirmation`: only its fields are used, and it routes by `target` (none: the dialog; one: the popup).',
    },
    {
      optimus: 'ConfirmationService.close()',
      weeljack: 'WjConfirmationService.close()',
      status: 'kept',
      note: 'Closes the open confirmation without running `accept` or `reject`.',
    },
    dropped(
      'ConfirmationService.onAccept(), requireConfirmation$, accept (Observable)',
      'Plumbing: no RxJS type on the public surface.',
    ),
    {
      optimus: 'Confirmation',
      weeljack: 'WjConfirmation',
      status: 'renamed',
      note: 'A subset, assignable with no mapping: `message` (required), `header`, `acceptLabel`, `rejectLabel`, `accept`, `reject` and `target`. `accept` and `reject` are `() => void`.',
    },
    dropped(
      'Confirmation key',
      'The service routes: no `target` opens the dialog, a `target` opens the popup.',
    ),
    dropped(
      'Confirmation icon, acceptIcon, rejectIcon',
      'Icons are not exposed. The dialog has no icon.',
    ),
    dropped('Confirmation acceptVisible, rejectVisible', 'Both buttons always show.'),
    dropped(
      'Confirmation closable, closeOnEscape, dismissableMask, blockScroll, modal, position, defaultFocus',
      'Fixed: always modal and centred, scroll locked, trapped. The close button and Escape cancel, the backdrop never does, and Reject has focus first.',
    ),
    dropped(
      'Confirmation acceptButtonStyleClass, rejectButtonStyleClass',
      'No class inputs on a wrapper.',
    ),
    dropped(
      'Confirmation acceptButtonProps, rejectButtonProps, closeButtonProps',
      'Typed `any` in Optimus. `wj-confirmdialog` sets the props it needs itself.',
    ),
    dropped('Confirmation acceptEvent, rejectEvent', 'Optimus internals.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjConfirmDialogPt`. Tracks Optimus.',
    },
    dropped(
      'header, message, acceptLabel, rejectLabel, icon, acceptIcon, rejectIcon, acceptVisible, rejectVisible, acceptAriaLabel, rejectAriaLabel',
      'Per confirmation (`WjConfirmation`) or not at all. No component-level defaults by need: labels come from the translation.',
    ),
    dropped('key', 'The service routes.'),
    dropped('visible', 'The service opens it.'),
    dropped('onHide', 'The confirmation’s `accept` and `reject` run instead.'),
    dropped(
      'closable, closeOnEscape, dismissableMask, modal, blockScroll, position, draggable, breakpoints, rtl, focusTrap',
      'Fixed: always modal and centred, scroll locked, trapped. The close button and Escape cancel; the backdrop never does.',
    ),
    dropped('defaultFocus', 'Fixed: Reject, the least destructive choice.'),
    dropped(
      'closeAriaLabel',
      'From the translation’s `aria.close`. Optimus does not bind it to its Dialog.',
    ),
    dropped('transitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'appendTo, autoZIndex, baseZIndex',
      'Not used. The dialog renders inside its host, as `wj-dialog` does, and Optimus layers it.',
    ),
    dropped('#message, messageTemplate', 'Always the wrapper’s own, so the message is never HTML.'),
    dropped(
      '#header, #footer, p-footer, #icon, #accepticon, #rejecticon, #headless and their template inputs',
      'Slots by need: none yet. Icons are not exposed.',
    ),
    dropped('selectors p-confirmdialog, p-confirm-dialog', 'Duplicate selectors.'),
    dropped('methods close, hide, onAccept, onReject', 'Use `WjConfirmationService.close()`.'),
    dropped(
      'style, styleClass, maskStyleClass, dt, unstyled, ptOptions, ConfirmDialogModule',
      droppedAlways,
    ),
  ],
};
