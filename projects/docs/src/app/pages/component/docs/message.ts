import { MessageBasicExample } from '../../../examples/message/basic';
import { MessageClosableExample } from '../../../examples/message/closable';
import { MessageSizesExample } from '../../../examples/message/sizes';
import { MessageVariantsExample } from '../../../examples/message/variants';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'message',
  title: 'Message',
  purpose: 'An inline message with a severity, optionally closable.',
  examples: [
    {
      title: 'Basic',
      description:
        'One message per severity. The words carry the meaning, so each one leads with what happened; colour only adds to it. `info` is the default, `error` and `warn` are announced as alerts, and the others as status messages.',
      sourceKey: 'message/basic',
      component: MessageBasicExample,
    },
    {
      title: 'Closable',
      description:
        'A closable message emits `closed` once, and the app removes it with `@if`. A closed message is gone for everyone, and focus is the app’s to move: the button the user pressed goes with its message, so the example moves focus to “Show the message”, and back to the new close button when the message is rendered again. Rendering it with `@if` is also what gets it announced.',
      sourceKey: 'message/closable',
      component: MessageClosableExample,
    },
    {
      title: 'Variants',
      description:
        '`outlined` keeps the edge and drops the fill, `simple` drops both. `simple` suits a short line under a form; a field’s own error belongs to `wj-field`.',
      sourceKey: 'message/variants',
      component: MessageVariantsExample,
    },
    {
      title: 'Sizes',
      description:
        '`small` for dense layouts, the default for most, `large` for a page-level message.',
      sourceKey: 'message/sizes',
      component: MessageSizesExample,
    },
    {
      title: 'Testing',
      description:
        'Import `WjMessageHarness` from `weeljack-ng/message/testing`. `getText()` reads the visible text, `getRole()` how it is announced (`alert` or `status`), `isClosable()` whether it has a close button, `getCloseButtonLabel()` that button’s name, `close()` presses it and `isClosed()` says whether the message has been hidden. A closed message hides once its leave motion has ended (at once under reduced motion), so poll `isClosed()` instead of reading it once.',
      sourceKey: 'message/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves to and from the close button. A message without one is not a Tab stop, and the page’s Tab order passes over it.',
    },
    { key: 'Enter, Space', effect: 'On the close button, closes the message.' },
  ],
  aria: [
    'The role follows the severity. `error` and `warn` are `role="alert"` with `aria-live="assertive"`; `info`, `success`, `secondary` and `contrast` are `role="status"` with `aria-live="polite"`. Optimus writes `role="alert"` with `aria-live="polite"` on every severity, a contradictory pair: this is an Optimus gap, fixed here.',
    'A message is announced only when it is rendered after the page has loaded. Render it with `@if` when its condition arises; one that is already there at load is read in document order, not announced.',
    'Keep `error` and `warn` for what needs attention now, because they interrupt.',
    'Say what happened and what to do, in words: colour and role are not enough. There is no severity icon, so lead with a short phrase, as the examples do. To add an icon, project a `wj-icon` before the text: it is decorative by default (`aria-hidden`), so the text stays the message.',
    'The close button is named from the translation (`aria.close`, "Close" in English), so you never pass a label. It is 28 × 28 px at every size.',
    'Closing hides the message for everyone. Optimus only collapses a closed message and keeps it exposed to assistive technology: this is an Optimus gap, fixed here. Once the leave motion has ended (at once under reduced motion), `wj-message` sets `hidden` on itself, so it leaves the layout and the accessibility tree. A closed message is not shown again; render it again with `@if`.',
    'Focus is the app’s to move. Focus on the close button is lost when the message hides, so move it in `(closed)` to the next sensible control.',
    'Long text wraps, and an unbroken string such as a URL breaks, so the close button stays inside the box at 320 px (WCAG 1.4.10).',
    'Under reduced motion, a message appears and closes without motion.',
    'Text meets 4.5:1 on its tint and the close button’s focus ring 3:1, in both schemes. Optimus’s light `success`, `warn` and `error` and dark `info` and `error` fall short, and the default look corrects them, following the toast’s colours. An app that passes its own brand colours owns their contrast.',
    'A field’s own error belongs to `wj-field`, and a message that closes on a timer is `wj-toast`’s job.',
    'The close button is inside Optimus, so `aria-*` on `wj-message` raises `WJ0003`. `wj-message` has no ARIA inputs: its role follows the severity, and its text is the projected content.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the W5a release.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus message underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-message`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-message` routes `role` and `aria-live` onto the `host` part: they win over the same attributes in your `pt`, and your other keys survive. Motion is always `safe`: `wj-message` binds Optimus’s `motionOptions` itself, and `pt.motion` cannot turn that off.',
  parts: [
    {
      part: 'host',
      description: 'The Optimus `p-message` element: the live region, with its role and severity.',
    },
    { part: 'root', description: 'The same element, as Optimus’s root part.' },
    { part: 'contentWrapper', description: 'The wrapper that collapses when the message leaves.' },
    { part: 'content', description: 'The row: text and close button.' },
    {
      part: 'icon',
      description:
        'The icon. `wj-message` sets no icon, so it is not rendered: project a `wj-icon` instead.',
    },
    { part: 'text', description: 'The text part that holds the projected content.' },
    { part: 'closeButton', description: 'The button that closes the message.' },
    { part: 'closeIcon', description: 'The cross inside the close button.' },
  ],
  mapping: [
    {
      optimus: 'severity',
      weeljack: 'severity (WjMessageSeverity)',
      status: 'kept',
      note: '`success`, `info`, `warn`, `error`, `secondary` or `contrast`. Defaults to `info`, and sets the role.',
    },
    {
      optimus: 'closable',
      weeljack: 'closable',
      status: 'kept',
      note: 'Defaults to `false`; a bare attribute is `true`.',
    },
    {
      optimus: 'size',
      weeljack: 'size (WjMessageSize)',
      status: 'kept',
      note: '`small` or `large`.',
    },
    {
      optimus: 'variant',
      weeljack: 'variant (WjMessageVariant)',
      status: 'kept',
      note: '`outlined` or `simple`. Optimus’s `text` value has no style in 2.0.2.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjMessagePt`. Tracks Optimus.',
    },
    {
      optimus: 'onClose',
      weeljack: 'closed',
      status: 'renamed',
      note: 'An output that emits once per close, with no payload.',
    },
    {
      optimus: 'default content',
      weeljack: 'default content',
      status: 'kept',
      note: 'The message text and any rich content, projected.',
    },
    dropped(
      'text',
      'Deprecated since Optimus v20. Project the text instead: content is the only way rich content gets in.',
    ),
    dropped(
      'escape',
      'Deprecated since Optimus v20. It stays `true` and is never bound, so the `innerHTML` branch is unreachable.',
    ),
    dropped('icon, closeIcon', 'Icon class strings. Project an icon; icon slots are not exposed.'),
    dropped('life', 'A message that closes on a timer is `wj-toast`’s job (WCAG 2.2.1).'),
    dropped('motionOptions', 'Not exposed: `wj-message` sets `{ safe: true }` itself.'),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped('container, icon and closeicon templates', 'Slots by need; none is exposed.'),
    dropped('close(event), MessageModule', 'Not used: there is no NgModule.'),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
  ],
};
