import { InplaceBasicExample } from '../../../examples/inplace/basic';
import { InplaceClosableExample } from '../../../examples/inplace/closable';
import { InplaceDisabledExample } from '../../../examples/inplace/disabled';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'inplace',
  title: 'Inplace',
  purpose: 'Shows a value that turns into an editor or more content when activated.',
  examples: [
    {
      title: 'Basic',
      description:
        'Fill both slots. `wjInplaceDisplay` is what shows first: a button the user clicks, or reaches with Tab and activates with Enter or Space. `wjInplaceContent` replaces it, and its `close` (`let-close="close"`) switches back to the display and returns focus to it. Here the value is edited in a `wjInputText`: Enter or Save stores it and calls `close()`, and Escape calls `close()` without storing (Optimus handles no Escape, so that key is yours). The display is named by the visible label and the value together (`ariaLabelledBy` with both ids), so it reads “Display name Mara Ellis, button”. Render a muted placeholder when the value is empty: an empty display is a blank 44 px target.',
      sourceKey: 'inplace/basic',
      component: InplaceBasicExample,
    },
    {
      title: 'Closable',
      description:
        'With `closable`, a round close button sits after the content while it is active, level with its first line. Its name comes from the translation (`aria.close`, “Close” in English), so a localised app gets a localised name. The display’s text should say what activating it does when it is not a value, as “Show the delivery address” does.',
      sourceKey: 'inplace/closable',
      component: InplaceClosableExample,
    },
    {
      title: 'Disabled',
      description:
        'With `disabled`, nothing switches: a click, Enter and Space on the display do nothing, and the content’s `close` and the close button do nothing too. The display stays in the Tab order and is announced as unavailable (`aria-disabled="true"`), so a keyboard user hears why nothing happens. It is drawn at 0.6 opacity with no hover.',
      sourceKey: 'inplace/disabled',
      component: InplaceDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjInplaceHarness` from `weeljack-ng/inplace/testing`. `WjInplaceHarness.with({ displayText })` finds an inplace by its display text, so it finds one that is not active. `isActive()`, `isClosable()` and `isDisabled()` read the state (the last two work in either state), and `getDisplayText()` and `getContentText()` read what the user sees. `activate()` clicks the display and `close()` clicks the close button; each fails when there is nothing to click. `focus()`, `blur()` and `isFocused()` act on the display, and `hasContentFocus()` says whether focus is in the content. `getAriaLabel()`, `getAriaLabelledBy()`, `getAriaDescribedBy()` and `getCloseLabel()` read the routed names. The inplace is a container harness, so `getHarness` reaches the harnesses inside its content once it is active. Nothing here names an Optimus class.',
      sourceKey: 'inplace/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Reaches the display. Once active, moves through the content in reading order, then the close button. A disabled display is still reached.',
    },
    {
      key: 'Enter, Space',
      effect:
        'On the display: activates, and focus moves to the first focusable element of the content (or to the content itself when it has none). Does nothing while disabled.',
    },
    {
      key: 'Enter, Space',
      effect:
        'On the close button: switches back to the display, and focus returns to the display.',
    },
  ],
  aria: [
    'The display is a `div` with `role="button"` and `tabindex="0"`. It is named by its content, or by `ariaLabel`, or by `ariaLabelledBy` and `ariaDescribedBy` pointing at your own elements. Setting an `aria-*` attribute on the `wj-inplace` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'Name the display from a visible label and its value together (`ariaLabelledBy="label-id value-id"`), so the visible text is part of the name. Make the display’s text say what activating it does when it is not a value.',
    'The close button is a real `button` named from the translation’s `aria.close`: “Close” in English, and the language you give `provideWeeljack({ translation })` otherwise.',
    'Focus moves on a switch the user makes, and only then: after the display is activated it moves to the first focusable element of the content, or else to the content itself (which takes `tabindex="-1"` and shows the focus ring); after the close button or `close()` it returns to the display. Setting `active` from your own code moves no focus.',
    '`aria-live="polite"` stays on Optimus’s root, so the switch is announced. With the focus move, a screen reader may speak the new content twice; this is for the NVDA pass to confirm.',
    'Gap, fixed: Optimus sets the close button’s label on the `p-button` host, so the real button had no name and axe reported `button-name`. `wj-inplace` puts the translation’s `aria.close` on the real button.',
    'Gap, fixed: Optimus activates on Enter only. `wj-inplace` activates on Space too, and stops the page from scrolling.',
    'Gap, fixed: a disabled display kept `tabindex="0"` and only a data attribute, so it looked enabled to assistive technology. `wj-inplace` sets `aria-disabled="true"` on it while `disabled`.',
    'Gap, fixed: the focused display or close button is removed on every switch, so focus fell to the page. `wj-inplace` moves it (see above).',
    'The display is at least 44 px tall and 30 px wide even when empty, and the close button is 44 × 44 px.',
    'Escape does not switch back: Optimus handles no Escape. Add `(keydown.escape)="close()"` to your editor, as the Basic example does.',
    'No axe rule is tolerated on this page: the four documented states (inactive, active, active and closable, disabled) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host and Optimus’s root are blocks, so the display hugs its text at the start of the line; to place an inplace inside a sentence, set `display: inline-block` on the host. A long display wraps and is never truncated. While active, the content is a row: your template sits in one box with the close button 8 px after it, level with its first line. The close button is drawn as a round secondary text icon button. Where `wj-inplace` routes its own attributes onto a part (the display’s `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-disabled`, the content’s `tabindex`, the close button’s `aria-label` and `class`), the routed value wins over the same attribute in your `pt`; every other key you set is kept. That includes the close button’s `class`: a `class` you set on `pcButton.root` is replaced by the look’s classes. `pt` reaches the parts of the Optimus inplace underneath, and the close button as `pcButton`. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-inplace`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. Both slots are required and are read at first render.',
  parts: [
    { part: 'host', description: 'The `p-inplace` element, as the host of the Optimus inplace.' },
    { part: 'root', description: 'The `p-inplace` element: the block that holds either part.' },
    {
      part: 'display',
      description: 'The `role="button"` display, present while the inplace is not active.',
    },
    {
      part: 'content',
      description:
        'The row that holds your content and the close button, present while active. It takes `tabindex="-1"`.',
    },
    {
      part: 'pcButton',
      description: 'The close button, with the button’s own parts (`root`, `icon`).',
    },
  ],
  mapping: [
    {
      optimus: 'active, onActivate, onDeactivate',
      weeljack: 'active',
      status: 'kept',
      note: 'One two-way model, `[(active)]`; it takes a binding, not a bare attribute. It follows Optimus’s own toggling, a click or a key press, so both sides stay equal, and `activeChange` reports each switch once. Setting it from your code switches without moving focus.',
    },
    {
      optimus: 'closable',
      weeljack: 'closable',
      status: 'kept',
      note: 'Shows the close button while active. Accepts a bare attribute.',
    },
    {
      optimus: 'disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'Neither the display nor the close button changes the state. Accepts a bare attribute.',
    },
    {
      optimus: 'closeAriaLabel',
      weeljack: 'The translation’s `aria.close`',
      status: 'renamed',
      note: 'Set on the close button itself. Optimus sets it on the `p-button` host, so the button had no name.',
    },
    {
      optimus: '#display, [pInplaceDisplay], p-inplacedisplay',
      weeljack: '`wjInplaceDisplay` slot',
      status: 'renamed',
      note: 'An `ng-template[wjInplaceDisplay]`, typed `WjInplaceDisplaySlot`. Required.',
    },
    {
      optimus: '#content, [pInplaceContent], p-inplacecontent',
      weeljack: '`wjInplaceContent` slot',
      status: 'renamed',
      note: 'An `ng-template[wjInplaceContent]`, typed `WjInplaceContentSlot`. Required. Its context is `WjInplaceContentContext`: `let-close="close"`. Optimus’s `closeCallback(event)` is not exposed.',
    },
    {
      optimus: '—',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the display, which is the focusable element.',
    },
    dropped('closeIcon, #closeicon', 'Icon slots are never exposed.'),
    dropped('preventClick', 'Exposed by need.'),
    dropped('activate(), deactivate()', 'Set `active` instead.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjInplacePt`. Reaches the close button as `pcButton`. Tracks Optimus.',
    },
    dropped('styleClass; dt, unstyled, ptOptions, InplaceModule', droppedAlways),
  ],
};
