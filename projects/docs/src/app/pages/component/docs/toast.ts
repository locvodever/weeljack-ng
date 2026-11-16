import { ToastBasicExample } from '../../../examples/toast/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'toast',
  title: 'Toast',
  purpose:
    'Short messages that appear and close on their own, shown from code through `WjToastService` into the one `wj-toast` in your app shell.',
  examples: [
    {
      title: 'Basic',
      description:
        'One button per severity calls `show`, and Clear calls `clear`. This is the only live `wj-toast` on the page: without a key, every `wj-toast` shows every message. Put what happened in the `summary`, in words.',
      sourceKey: 'toast/basic',
      component: ToastBasicExample,
    },
    {
      title: 'In the app shell',
      description:
        'Render one `wj-toast` in the root component, beside the router outlet. Provide nothing: `WjToastService` is root-provided, and the host reads the same message source. A message shown while no `wj-toast` is rendered is not queued.',
      sourceKey: 'toast/app-shell',
      component: null,
    },
    {
      title: 'Your own service',
      description:
        'Wrap `WjToastService` in an app service with named methods, so the wording and `life` live in one place.',
      sourceKey: 'toast/own-service',
      component: null,
    },
    {
      title: 'Testing',
      description:
        "In a spec, inject the service and spy on it: `vi.spyOn(TestBed.inject(WjToastService), 'show')`, then `expect(show).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))`. It replaces spying on the Optimus `MessageService`, and needs no provider. To read the messages on screen, import `WjToastHarness` from `weeljack-ng/toast/testing`: `getMessages()` returns one `WjToastMessageHarness` per open message, with `getSeverity()`, `getSummary()`, `getDetail()`, `getCloseLabel()` and `close()`.",
      sourceKey: 'toast/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect: 'Moves to and from each message’s close button.',
    },
    { key: 'Enter, Space', effect: 'Closes the message.' },
    { key: 'Showing a message', effect: 'Focus stays where it was.' },
  ],
  aria: [
    'Each message is `role="alert"`, `aria-live="assertive"` and `aria-atomic="true"`, so it is announced when it appears. Every severity is assertive, `info` and `success` included. This is an Optimus gap, not an AA failure.',
    'Showing a message never moves focus: Optimus puts `autofocus` on each close button, and `wj-toast` removes it.',
    'Meaning is not carried by colour alone. Severity shows as colour plus an `aria-hidden` icon, so put the meaning in the `summary`, in words.',
    'A message closes after its `life` and pauses only while the pointer is over it, never while it holds focus. This is an Optimus gap: a message the reader must act on does not belong in a toast.',
    'Closing a message by keyboard drops focus to the page, because the close button goes with its message. This is an Optimus gap.',
    'The close button is named from the translation (`aria.close`, "Close" in English), so you never pass a label. It is 28 × 28 px.',
    'The stack is 25 rem wide and never wider than the viewport minus its 20 px inset on both sides, so a message fits a 320 px viewport (WCAG 1.4.10). Long text wraps inside the message.',
    'Under reduced motion, messages appear and close without motion.',
    'Render one `wj-toast`; every `wj-toast` shows every message. Place it in the app shell.',
    'The close buttons are inside Optimus, so `aria-*` on `wj-toast` raises `WJ0003`. `wj-toast` has no ARIA inputs: there is no single focusable element to route them to.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus toast underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-toast`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. A function `pt` is called for each part, and for a message part it receives that message in its context. `wj-toast` sets the close button’s `autofocus` itself, and stamps `data-wj-*` hooks that the harness reads; your `pt` keeps every other attribute. Motion is always `safe`: `pt.motion` cannot turn that off, and `wj-toast` binds Optimus’s `motionOptions` itself.',
  parts: [
    { part: 'host', description: 'The Optimus `p-toast` element.' },
    { part: 'root', description: 'The fixed container that stacks the messages.' },
    { part: 'message', description: 'One message: the live region, with its severity.' },
    {
      part: 'messageContent',
      description: 'The row inside a message: icon, text and close button.',
    },
    { part: 'messageIcon', description: 'The severity icon, hidden from assistive technology.' },
    { part: 'messageText', description: 'The column that holds the summary and the detail.' },
    { part: 'summary', description: 'The summary text.' },
    { part: 'detail', description: 'The detail text.' },
    { part: 'closeButton', description: 'The button that closes one message.' },
    { part: 'closeIcon', description: 'The cross inside the close button.' },
  ],
  mapping: [
    {
      optimus: 'MessageService (app-provided)',
      weeljack: 'WjToastService (root-provided)',
      status: 'renamed',
      note: 'The app provides nothing.',
    },
    {
      optimus: 'MessageService.add(message)',
      weeljack: 'WjToastService.show(message)',
      status: 'renamed',
      note: 'Takes a `WjToastMessage`.',
    },
    {
      optimus: 'MessageService.clear(key?)',
      weeljack: 'WjToastService.clear()',
      status: 'kept',
      note: 'No key: it closes every open message.',
    },
    dropped(
      'addAll, messageObserver, clearObserver',
      'Not used; the observers are Optimus plumbing.',
    ),
    {
      optimus: 'ToastMessageOptions',
      weeljack: 'WjToastMessage',
      status: 'renamed',
      note: 'A subset, assignable with no mapping.',
    },
    {
      optimus: 'message severity (string)',
      weeljack: 'severity (WjToastSeverity)',
      status: 'kept',
      note: '`success`, `info`, `warn` or `error`. Unset shows as `info`.',
    },
    {
      optimus: 'message summary, detail, life',
      weeljack: 'summary, detail, life',
      status: 'kept',
      note: 'Text renders through interpolation, never as HTML. `life` is in milliseconds and falls back to 3000.',
    },
    dropped(
      'message data',
      'Never rendered, because there is no message template. A retry action would be a later typed slot.',
    ),
    dropped(
      'message icon, styleClass, contentStyleClass, closeIcon',
      'Class strings Optimus writes into `[class]`. Icons are not exposed.',
    ),
    dropped(
      'message key, id, text, sticky, closable',
      'Not used. Every message is closable, and closes by itself.',
    ),
    {
      optimus: 'position',
      weeljack: 'position',
      status: 'kept',
      note: 'Seven values, default `top-right`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjToastPt`. Tracks Optimus.',
    },
    dropped(
      'key',
      'One `wj-toast` per app. Without a key, every rendered `wj-toast` shows every message.',
    ),
    dropped('life (on the toast)', 'Set per message.'),
    dropped('autoZIndex, baseZIndex, preventOpenDuplicates, preventDuplicates', 'Not used.'),
    dropped(
      'showTransformOptions, hideTransformOptions, showTransitionOptions, hideTransitionOptions',
      'Deprecated since Optimus v21.',
    ),
    dropped('motionOptions', 'Not exposed: `wj-toast` sets `{ safe: true }` itself.'),
    dropped(
      'breakpoints',
      'Not used. It writes its values into a `<style>` element, and `wj-toast` caps the width itself.',
    ),
    dropped('onClose', 'Not used. It would come back as `closed` when an app needs it.'),
    dropped(
      'template, headlessTemplate, pTemplate',
      'Slots by need: a richer message would be a later typed slot.',
    ),
    dropped('styleClass, dt, unstyled, ptOptions, ToastModule', droppedAlways),
  ],
};
