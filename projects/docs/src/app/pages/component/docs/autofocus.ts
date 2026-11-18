import { AutoFocusFocusOnRevealExample } from '../../../examples/autofocus/focus-on-reveal';
import { AutoFocusOffAtLoadExample } from '../../../examples/autofocus/off-at-load';
import { AutoFocusOnAContainerExample } from '../../../examples/autofocus/on-a-container';
import { AutoFocusOnAWjHostExample } from '../../../examples/autofocus/on-a-wj-host';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'autofocus',
  title: 'Autofocus',
  purpose:
    'An attribute that moves focus into an element when it appears: a text input, a container with fields in it, or a `wj-*` control such as the number input. It adds no look and no form control of its own. Use it where the user expects to type at once, such as the first field of a form you reveal, and nowhere else.',
  optimusSelector: '[pAutoFocus]',
  examples: [
    {
      title: 'Off at load',
      description:
        'This page never moves focus when it loads. The search field below carries a static `wjAutoFocus="false"`: the attribute is there and off, so nothing takes focus. A bare `wjAutoFocus` is on, and `[wjAutoFocus]="false"` is off, so a bound value can turn it on later.',
      sourceKey: 'autofocus/off-at-load',
      component: AutoFocusOffAtLoadExample,
    },
    {
      title: 'Focus on reveal',
      description:
        'Pressing the button reveals a field, and its input takes focus because it carries `wjAutoFocus`. The button keeps its label and reports `aria-expanded`. Pressing it again hides the field and focus stays on the button.',
      sourceKey: 'autofocus/focus-on-reveal',
      component: AutoFocusFocusOnRevealExample,
    },
    {
      title: 'On a container',
      description:
        'Put `wjAutoFocus` on a `div` and focus lands in its first focusable descendant, here the Street field. An element with nothing focusable inside takes focus itself (give it `tabindex="-1"`).',
      sourceKey: 'autofocus/on-a-container',
      component: AutoFocusOnAContainerExample,
    },
    {
      title: 'On a wj-* host',
      description:
        'The attribute works on a `wj-*` host too: focus lands in the input inside `wj-inputnumber`, never on its mouse-only spin buttons.',
      sourceKey: 'autofocus/on-a-wj-host',
      component: AutoFocusOnAWjHostExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjAutoFocusHarness` from `weeljack-ng/autofocus/testing`. `isFocused()` is `true` when the element, or something inside it, has focus. Optimus moves focus in a timer after the render and zoneless `whenStable()` does not wait for it, so poll with `expect.poll`.',
      sourceKey: 'autofocus/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Any key',
      effect:
        'Goes to the element that took focus at once, so the user can type without reaching for it.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect: 'Continue from the focused element in document order.',
    },
  ],
  aria: [
    'Moving focus on load can disorient screen-reader and keyboard users: the page reads from an unexpected place and the content before it is skipped. Use it where the user expects to type at once, such as the first field of a form they just revealed, or a search page. Never use it on content far down a page.',
    '`wjAutoFocus` has no ARIA input and adds no attribute besides `wjAutoFocus` and the native `autofocus` attribute that Optimus sets while it is on. The focused element keeps its own name and description.',
    'Focus moves once per element, when it appears. Later changes never take focus back after the user has moved it. Show a hidden form in answer to a user action, and keep the trigger button focusable, so the user can reach it again.',
    'Focus moves in the browser only. A page rendered ahead of time carries no focus change, so a prerendered page is as quiet as this one.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the release that carries this entry.',
  ],
  stylingIntro:
    'There is no styling: `wjAutoFocus` adds no part, class, colour or motion, and no `pt`, because Optimus’s autofocus renders nothing for a pass-through to reach. The focused element shows its own focus ring, and the browser scrolls it into view without smoothing.',
  parts: [],
  mapping: [
    {
      optimus: 'pAutoFocus (autofocus)',
      weeljack: 'wjAutoFocus',
      status: 'renamed',
      note: 'A boolean attribute: a bare `wjAutoFocus` focuses, and `"false"` or `[wjAutoFocus]="false"` does not. Optimus’s input has no boolean transform, so a bare attribute does nothing there.',
    },
    dropped(
      'Inherited pt, dt, unstyled, ptOptions',
      'Optimus’s `AutoFocus` renders no part, so there is nothing to pass through. Always (ADR 0002).',
    ),
    dropped('AutoFocusModule', 'Standalone.'),
  ],
};
