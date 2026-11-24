import { DynamicDialogBasicExample } from '../../../examples/dynamicdialog/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'dynamicdialog',
  title: 'Dynamic dialog',
  purpose:
    'Open your own component in a modal dialog from code: `inject(WjDialogService).open(Component, { header, data })`; the component closes itself through `inject(WjDynamicDialogRef)`. There is no component to render: the service and the ref are the whole API.',
  optimusSelector: 'DialogService',
  examples: [
    {
      title: 'Basic',
      description:
        'A button opens an "Edit name" form and the line under it shows the saved name. `open` takes the component and a config: the `header` is required and names the dialog, and `data` reaches the component as `ref.data`. It returns a `WjDynamicDialogRef`; `await ref.closed` gives what the component closed with, after the dialog is gone and focus is back on the button. Cancel, Escape and the close button give `undefined`, which leaves the name as it was. Nothing is rendered in your template and nothing is provided: `WjDialogService` is root-provided.',
      sourceKey: 'dynamicdialog/basic',
      component: DynamicDialogBasicExample,
    },
    {
      title: 'The component in the dialog',
      description:
        'The component is your own: it lays out its fields and its actions, and closes itself through `inject(WjDynamicDialogRef)`, the same ref `open` returned. `ref.close(value)` hands `value` to `closed`; `ref.close()` hands `undefined`. The dialog is as wide as the component, so this one sets its own `inline-size`. An empty name shows the field error and keeps the dialog open.',
      sourceKey: 'dynamicdialog/content',
      component: null,
    },
    {
      title: 'Testing with the harness',
      description:
        'The dialog renders in `document.body`, outside the fixture, so find `WjDynamicDialogHarness` (from `weeljack-ng/dynamicdialog/testing`) from the document root: `TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(WjDynamicDialogHarness)`. `getHeader()`, `getRole()`, `isModal()`, `hasCloseButton()` and `getCloseLabel()` read it as a user meets it, `close()` and `closeWithEscape()` close it, and the harnesses of your component are found from it: `dialog.getHarness(WjButtonHarness.with({ label: "Save" }))`. A closed dialog has no element, so `getAllHarnesses` on the loader tells whether one is open.',
      sourceKey: 'dynamicdialog/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Opening',
      effect:
        'Focus moves into the dialog: to the first control of your component, else the close button. With nothing inside that can take focus, it moves to the dialog itself.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves between the controls of the dialog, in order: the close button, then your component. Focus wraps and never leaves the dialog while it is open.',
    },
    { key: 'Enter, Space', effect: 'On the close button, closes the dialog.' },
    {
      key: 'Escape',
      effect:
        'Closes the dialog while `closable` is `true`, after any control inside your component that handles it first. With `closable: false` nothing happens. Only the topmost overlay closes.',
    },
    {
      key: 'Closing',
      effect:
        'Focus returns to the element that had it when the dialog opened, if that element is still in the document, before `closed` settles.',
    },
  ],
  aria: [
    'The dialog is `role="dialog"` with `aria-modal="true"`, and is named by its `header` (`aria-labelledby` points at the title). `header` is required and renders as text, never as HTML.',
    'The close button is named from the translation (`aria.close`): "Close" in English, "Đóng" with the `vi` translation from `weeljack-ng/locale`. You never pass a label. It is 44 × 44 px and carries no `autofocus`.',
    '`closable: false` removes the close button and Escape for the dialog’s life; your component still closes it with `ref.close()`. Give such a dialog an action that closes it.',
    'Focus moves in when the dialog opens and returns to the opener when it closes, whatever closed it, also in Safari, which does not focus a button when it is clicked. If the action removed the opener, the dialog cannot return focus: move it yourself after `await ref.closed`, which runs after the dialog restored focus.',
    'While the dialog is open the page behind it does not scroll, and the backdrop is not a way to close it. Opening a component that is already open returns the open dialog’s ref instead of a second dialog.',
    'Your component is created from the application’s root injector, not from the component tree that called `open`. A service provided only in the caller’s `providers` is not found there and raises `NG0201`: provide it in root, or hand the value over as `data`.',
    'Under reduced motion the dialog and its backdrop appear and disappear without motion. `pt.motion` cannot turn that off.',
    'The dialog is never wider than the viewport minus 1 rem on each side while your component is the widest part; an unbroken header longer than that can widen the panel up to the viewport. The header’s spacing is Optimus’s own, a few pixels more than `wj-dialog`’s.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'Colours, radius, shadow and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The dialog renders in `document.body`, so a `--wj-*` property set on one of your components does not reach it: set it on `:root`. Width is your component’s, so size that. For anything else, `pt` in the config reaches the parts of the Optimus dialog underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `WjDialogService`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `WjDialogService` routes a `data-wj-dynamicdialog` hook onto the root, which the harness reads, and `safe` motion onto `motion` and `maskMotion`: a routed value wins over yours on the same attribute, and your `pt` keeps every other one. A function `pt` is called for each part.',
  parts: [
    { part: 'host', description: 'The Optimus `p-dialog` element.' },
    { part: 'mask', description: 'The backdrop that covers the page behind the dialog.' },
    { part: 'root', description: 'The dialog element: `role="dialog"`.' },
    { part: 'header', description: 'The row with the title and the close button.' },
    { part: 'title', description: 'The title: the `header` text.' },
    { part: 'pcCloseButton', description: 'The close button. Takes the pass-through of a button.' },
    {
      part: 'content',
      description: 'The body that holds your component, the one region that scrolls.',
    },
  ],
  mapping: [
    {
      optimus: 'DialogService (app-provided)',
      weeljack: 'WjDialogService (root-provided)',
      status: 'renamed',
      note: 'The app provides nothing.',
    },
    {
      optimus: 'open(componentType, config): DynamicDialogRef | null',
      weeljack: 'open(component: Type<unknown>, config: WjDynamicDialogConfig): WjDynamicDialogRef',
      status: 'kept',
      note: 'Generic over the result and the data types. Opening a component that is already open returns its open dialog’s ref (Optimus returns `null`).',
    },
    dropped('getInstance(ref), dialogComponentRefMap', 'Internal.'),
    {
      optimus: 'DynamicDialogRef (injected by the content)',
      weeljack: 'WjDynamicDialogRef (injected by the content, and returned by `open`)',
      status: 'renamed',
      note: '`inject(WjDynamicDialogRef)` in your component.',
    },
    {
      optimus: 'DynamicDialogRef.close(result)',
      weeljack: 'close(result?)',
      status: 'kept',
      note: 'Only the first close of a dialog counts.',
    },
    {
      optimus: 'DynamicDialogRef.onClose (Observable)',
      weeljack: 'closed (Promise)',
      status: 'renamed',
      note: 'Settles once, after the dialog is gone, with the result; `undefined` for Escape or the close button. No RxJS type on the public surface.',
    },
    dropped(
      'destroy, onDestroy, drag, resize and maximize events and methods, onChildComponentLoaded',
      'Not used.',
    ),
    {
      optimus: 'DynamicDialogConfig.data',
      weeljack: 'config.data, read in the content as `ref.data`',
      status: 'kept',
      note: 'Typed by the `D` of `open`.',
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
      note: 'Default `true` (Optimus’s own default is unset, so the service always passes it). Fixed for the dialog’s life.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjDynamicDialogPt`. Tracks Optimus; merged with what the service routes.',
    },
    dropped(
      'width, height, breakpoints, position, style, contentStyle, styleClass, maskStyleClass',
      'Width is your component’s.',
    ),
    dropped('inputValues', 'Data travels as `ref.data`.'),
    dropped('footer, templates', 'Your component renders its own actions.'),
    dropped(
      'draggable, resizable, maximizable, minX, minY, keepInViewport, maximizeIcon, minimizeIcon',
      'Fixed off, as `wj-dialog`. Optimus’s defaults for `draggable` and `resizable` are on.',
    ),
    dropped(
      'modal, dismissableMask, closeOnEscape, focusOnShow, focusTrap, showHeader, ariaLabelledBy, closeAriaLabel',
      'Fixed: modal, the backdrop never closes it, Escape and the close button close it while `closable`, focus is trapped, the header names it, the close button is named from `aria.close`.',
    ),
    dropped('appendTo, autoZIndex, baseZIndex, duplicate, transitionOptions, rtl', 'Not used.'),
    dropped('unstyled', droppedAlways),
  ],
};
