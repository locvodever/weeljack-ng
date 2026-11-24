import { DialogBasicExample } from '../../../examples/dialog/basic';
import { DialogBusyExample } from '../../../examples/dialog/busy';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'dialog',
  title: 'Dialog',
  purpose:
    'A modal dialog over Optimus’s `p-dialog`: bind `[(visible)]`, give it a `header` that names it, and put the body in its content and the actions in a `wjDialogFooter` template. It is always modal, never draggable or resizable, and it closes with Escape or the close button, never with a click on the backdrop. Set `closable` to `false`, also while it is open, to take both away while the app is busy.',
  examples: [
    {
      title: 'Basic',
      description:
        'A button opens the dialog. The `header` is required and names the dialog; the body is the content, and the actions go in an `ng-template` marked `wjDialogFooter` (import `WjDialogFooterSlot`: without it the template is silently dropped). The footer sits below the body, end-aligned, dismissive action first. The dialog is as wide as its content, so this body sets `max-inline-size: 28rem`. `wj-dialog` stays in the template while closed, and renders nothing until `visible` is `true`.',
      sourceKey: 'dialog/basic',
      component: DialogBasicExample,
    },
    {
      title: 'Busy',
      description:
        'Bind `[closable]="!deleting()"` while a request runs. The close button goes, Escape does nothing, and the header keeps its height so nothing below it moves. Show the busy state on the actions yourself: Delete is `loading` and Cancel is `disabled`. When the request ends, close the dialog or set `closable` back. A `loading` `wj-button` is inert, so the focus it held drops to the page: this known gap of the busy pattern is not fixed here.',
      sourceKey: 'dialog/busy',
      component: DialogBusyExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjDialogHarness` from `weeljack-ng/dialog/testing`. `isOpen()`, `getTitle()`, `getRole()`, `isModal()`, `getDescription()`, `hasCloseButton()` and `getCloseLabel()` read the dialog as a user meets it, and `close()` and `closeWithEscape()` close it. The body and the footer are inside the harness, so `dialog.getHarness(WjButtonHarness.with({ label: "Delete" }))` reaches the actions. Nothing here names an Optimus class.',
      sourceKey: 'dialog/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Opening',
      effect:
        'Focus moves into the dialog: to the first control of the body, else the first action of the footer, else the close button. With nothing inside that can take focus, it moves to the dialog itself.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves between the controls of the dialog, in order: the close button, the body, the footer. Focus wraps and never leaves the dialog while it is open.',
    },
    {
      key: 'Enter, Space',
      effect: 'On the close button, closes the dialog.',
    },
    {
      key: 'Escape',
      effect:
        'Closes the dialog while `closable` is `true`, after any control inside the body that handles it first: an open select list closes before the dialog does. While `closable` is `false`, even if it turned `false` while the dialog was open, nothing happens.',
    },
    {
      key: 'Closing',
      effect:
        'Focus returns to the element that had it when the dialog opened, if that element is still in the document.',
    },
  ],
  aria: [
    'The dialog is `role="dialog"` with `aria-modal="true"`, and is named by its `header` (`aria-labelledby` points at the title). `header` is required and renders as text, never as HTML.',
    '`ariaDescribedBy` sets `aria-describedby` on the dialog element: point it at the element in the body that says what the dialog is about. `aria-*` written on the `wj-dialog` host is not forwarded and raises `WJ0003` in development; it says to use `ariaDescribedBy`, because the header already names the dialog, so there is no `ariaLabel` or `ariaLabelledBy` input.',
    'The close button is named from the translation (`aria.close`): "Close" in English, "Đóng" with the `vi` translation from `weeljack-ng/locale`. You never pass a label. It is 44 × 44 px.',
    'Focus moves in when the dialog opens and returns to the opener when it closes, whatever closed it. If the action removed the opener (a deleted row), the dialog cannot return focus: move it yourself in the `(closed)` handler, which runs after the dialog restored focus.',
    'While the dialog is open the page behind it does not scroll, and the backdrop is not a way to close it. Keep the dialog in the template while it is closed: it renders nothing, and is announced and focusable only when open.',
    'Under reduced motion the dialog and its backdrop appear and disappear without motion, and `opened` and `closed` are still emitted. `pt.motion` cannot turn that off.',
    'The dialog is never wider than the viewport minus 1 rem on each side, a long title wraps with the close button held in the top corner, and a crowded footer wraps.',
    'Optimus’s two hidden focus-trap spans sit inside the dialog with `aria-hidden` and `tabindex="0"`. They pass the automated checks; the screen-reader pass will say whether they matter.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari) are recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits, and the dialog renders inside its host, so a `--wj-*` property set on `wj-dialog` reaches it. The host is a block. Width is the content’s, up to the viewport minus 1 rem on each side; set it through `pt.root` when you need another (there is no width variable). For anything else, `pt` reaches the parts of the Optimus dialog underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-dialog`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby` on the `root` part is set by the component from `ariaDescribedBy`, and wins over a `pt` value; `pt.motion` cannot switch `safe` off, because `wj-dialog` binds the motion options itself.',
  parts: [
    { part: 'host', description: 'The Optimus `p-dialog` element.' },
    { part: 'mask', description: 'The backdrop that covers the page behind the dialog.' },
    { part: 'root', description: 'The dialog element: `role="dialog"`.' },
    { part: 'header', description: 'The row with the title and the close button.' },
    { part: 'title', description: 'The title: the `header` text.' },
    { part: 'pcCloseButton', description: 'The close button. Takes the pass-through of a button.' },
    { part: 'content', description: 'The body, the one region that scrolls.' },
    {
      part: 'footer',
      description: 'The footer with the actions, present only with a footer slot.',
    },
  ],
  mapping: [
    {
      optimus: 'visible + visibleChange',
      weeljack: 'visible',
      status: 'kept',
      note: 'A `model(false)`: two-way as `[(visible)]`.',
    },
    {
      optimus: 'header',
      weeljack: 'header',
      status: 'kept',
      note: 'Required: it names the dialog (`aria-labelledby` points at its title). Text only.',
    },
    {
      optimus: 'closable',
      weeljack: 'closable',
      status: 'kept',
      note: 'Default `true`. `false` removes the close button and Escape, also while the dialog is open.',
    },
    {
      optimus: 'onShow',
      weeljack: 'opened',
      status: 'renamed',
      note: 'Emits once each time the dialog has opened. No value.',
    },
    {
      optimus: 'onHide',
      weeljack: 'closed',
      status: 'renamed',
      note: 'Emits once each time the dialog has closed, whatever closed it, including the app setting `visible` to `false`. No value.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjDialogPt`. Tracks Optimus.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the dialog element.',
    },
    {
      optimus: 'default content',
      weeljack: 'projected body',
      status: 'kept',
      note: 'The default content slot.',
    },
    {
      optimus: '#footer, footerTemplate, p-footer',
      weeljack: 'wjDialogFooter slot',
      status: 'renamed',
      note: 'An `ng-template[wjDialogFooter]`, typed `WjDialogFooterSlot`. The footer renders only when it is used.',
    },
    dropped('modal', 'Always modal: the page behind is inert and does not scroll.'),
    dropped(
      'draggable, resizable, minX, minY, keepInViewport, onDragEnd, onResizeInit, onResizeEnd',
      'Never draggable or resizable.',
    ),
    dropped(
      'closeOnEscape, dismissableMask',
      'Escape closes the dialog while it is closable, and the backdrop never does.',
    ),
    dropped('closeAriaLabel', 'The close button is named from the translation (`aria.close`).'),
    dropped(
      'closeButtonProps, closeTabindex, closeIcon, #closeicon, closeIconTemplate',
      'The close button is fixed. Icon slots are not exposed.',
    ),
    dropped(
      'maximizable, maximizeIcon, minimizeIcon, maximizeButtonProps, #maximizeicon, #minimizeicon, onMaximize',
      'Not needed.',
    ),
    dropped(
      'motionOptions, maskMotionOptions',
      'Not exposed: `wj-dialog` sets `{ safe: true }` itself, so reduced motion is respected.',
    ),
    dropped('transitionOptions', 'Deprecated since Optimus v21.'),
    dropped('ariaLabelledBy', 'The required `header` names the dialog.'),
    dropped(
      'focusOnShow, focusTrap, blockScroll, autoZIndex, baseZIndex, position, breakpoints, rtl, role, showHeader, appendTo',
      'Not needed. Focus moves in, the focus trap and the scroll lock stay on, the role is `dialog`, the position is the centre, and the dialog renders inside its host.',
    ),
    dropped(
      '#header, #content, contentTemplate, #headless, headlessTemplate, pTemplate',
      'The header is text, and the body is projected.',
    ),
    dropped(
      'style, styleClass, maskStyle, maskStyleClass, contentStyle, contentStyleClass, dt, unstyled, ptOptions, hostName',
      droppedAlways,
    ),
    dropped(
      'close, maximize, center, resetPosition, moveOnTop, focus (methods)',
      'Close it by setting `visible` to `false`.',
    ),
  ],
};
