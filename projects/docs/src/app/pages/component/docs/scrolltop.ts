import { ScrollTopBasicExample } from '../../../examples/scrolltop/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'scrolltop',
  title: 'Scroll top',
  purpose:
    'A button that appears once the reader has scrolled down, and takes them back to the top of the page.',
  optimusSelector: 'p-scrollTop',
  examples: [
    {
      title: 'Basic',
      description:
        'The page’s one live `wj-scrolltop`, with `threshold` 200. It renders nothing in this panel: scroll this page past 200 px and a round button appears in the bottom corner of the window. Put one on a page, near its end: every instance follows the same window.',
      sourceKey: 'scrolltop/basic',
      component: ScrollTopBasicExample,
    },
    {
      title: 'Own label',
      description:
        'Set `ariaLabel` to name the button for its page. Without it the button is named from the translation (`aria.scrollTop`, "Scroll Top" in English).',
      sourceKey: 'scrolltop/own-label',
      component: null,
    },
    {
      title: 'Testing',
      description:
        'Import `WjScrollTopHarness` from `weeljack-ng/scrolltop/testing`. `isShown()` reports whether the button is on screen, `getLabel()` is its accessible name (empty while it is hidden) and `activate()` presses it. Scroll the window with `window.scrollTo` in your own fixture, then poll until `isShown()` is `true`.',
      sourceKey: 'scrolltop/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Reaches the button once it shows.' },
    { key: 'Enter, Space', effect: 'Scrolls the window to the top.' },
    { key: 'The button appearing', effect: 'Focus stays where it was.' },
  ],
  aria: [
    'The button is named by `ariaLabel`, or else by the translation (`aria.scrollTop`, "Scroll Top" in English). Optimus puts its own `buttonAriaLabel` on a generic element around the button, so `wj-scrolltop` names the real `<button>` itself and never sets `buttonAriaLabel`. This is an Optimus gap.',
    '`ariaLabelledBy` and `ariaDescribedBy` are set on the button. The button is Optimus’s focusable part, so `aria-*` on `wj-scrolltop` raises `WJ0003`.',
    'The button is not rendered, so not in the Tab order or the accessibility tree, until the window is scrolled past `threshold`.',
    'Showing the button never moves focus: Optimus writes `autofocus` on it, and `wj-scrolltop` turns that off.',
    'Pressing the button hides it, because the page is back at the top. Focus then falls to the document, and the next Tab continues from where the button was. This is an Optimus gap: place `wj-scrolltop` near the end of the page, and keep a skip link at the top.',
    'Under reduced motion the button appears and disappears at once, and a press jumps to the top instead of gliding. Chromium does not drop a smooth scroll on its own, so `wj-scrolltop` passes `behavior: "auto"` while the reader prefers reduced motion, and follows the preference as it changes.',
    'The button is a 44 × 44 px round control, well above the 24 × 24 px minimum, with the theme’s 2 px focus ring.',
    'The button is fixed 20 px from the window’s bottom corner. Keep that corner free of controls the reader must reach, or leave room for it at the end of the page. At 320 px wide or 200 % zoom it can cover content there.',
    'The keyboard and screen-reader passes (NVDA with Chrome) are recorded here before W5d’s release.',
  ],
  stylingIntro:
    'Colours, radius and size come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus scroll top underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-scrolltop`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-scrolltop` routes `ariaLabelledBy` and `ariaDescribedBy` onto `pcButton.root` itself, and your `pt` keeps every other attribute. Motion is always `safe`: `pt.motion` cannot turn that off, and `wj-scrolltop` binds Optimus’s `motionOptions` itself.',
  parts: [
    { part: 'host', description: 'The Optimus `p-scrolltop` element.' },
    { part: 'root', description: 'The same element, for a second set of attributes.' },
    {
      part: 'pcButton',
      description:
        'The round button, as an Optimus button pass-through: `pcButton.root` is the `<button>`.',
    },
    {
      part: 'motion',
      description: 'The enter and leave motion options. `safe` cannot be unset.',
    },
  ],
  mapping: [
    {
      optimus: 'threshold',
      weeljack: 'threshold',
      status: 'kept',
      note: 'The window’s scroll position, in px, past which the button shows. Read with `numberAttribute`, default 400.',
    },
    {
      optimus: 'behavior',
      weeljack: 'behavior',
      status: 'kept',
      note: '`smooth` (default) or `auto`. Under reduced motion the wrapper always passes `auto`.',
    },
    dropped(
      'target',
      'Window only. Optimus reads `parent` as the element’s parent, which inside the wrapper is the `wj-scrolltop` host: it never scrolls.',
    ),
    {
      optimus: 'buttonAriaLabel',
      weeljack: 'ariaLabel',
      status: 'renamed',
      note: 'Optimus puts it on a generic element, leaving the `<button>` unnamed; the wrapper names the button itself. Defaults to the translation’s `aria.scrollTop`.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Set on the button.',
    },
    dropped(
      'buttonProps',
      'The wrapper binds the rounded button, with no `autofocus` and the name above.',
    ),
    dropped('motionOptions', 'Not exposed: `wj-scrolltop` sets `{ safe: true }` itself.'),
    dropped('icon, iconTemplate, pTemplate', 'Icon slots are not exposed.'),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjScrollTopPt`. Tracks Optimus.',
    },
    dropped(
      'styleClass, style, dt, unstyled, ptOptions, ScrollTopModule',
      'Never exposed on any wrapper (ADR 0002).',
    ),
  ],
};
