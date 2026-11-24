import { ScrollpanelBasicExample } from '../../../examples/scrollpanel/basic';
import { ScrollpanelBothExample } from '../../../examples/scrollpanel/both';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'scrollpanel',
  title: 'Scroll panel',
  purpose: 'A scroll region with slim, themed scrollbars.',
  optimusSelector: 'p-scroll-panel',
  examples: [
    {
      title: 'Basic',
      description:
        'Put the content between the tags and give the panel a block size: a `height`, a `block-size` or a flex or grid row that stretches it. The content scrolls against that size. With none, the panel is only a few pixels tall and the content spills over what follows, so every scroll panel needs one. The thumbs appear while the pointer is over the panel and while the region has keyboard focus. Keep the last 24 px at the inline end of your content clear, as this example does with its padding: the thumbs and their hit boxes sit there.',
      sourceKey: 'scrollpanel/basic',
      component: ScrollpanelBasicExample,
    },
    {
      title: 'Both directions',
      description:
        'Content wider than the panel gets a thumb along the bottom too. Keep 24 px clear at the block end then, as well as at the inline end. Both thumbs follow the content as it scrolls with keys, the wheel, touch or a drag on a thumb.',
      sourceKey: 'scrollpanel/both',
      component: ScrollpanelBothExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjScrollPanelHarness` from `weeljack-ng/scrollpanel/testing`. `WjScrollPanelHarness.with({ label })` finds a panel by its `aria-label`. `getScrollTop()` and `getScrollLeft()` read how far it is scrolled, `canScroll()` says whether the content is larger than the region, and `focus()`, `blur()` and `isFocused()` act on the region itself. `getAriaLabel()`, `getAriaLabelledBy()`, `getAriaDescribedBy()` and `getRole()` read the names routed onto it. The panel is a container harness, so `getHarness` reaches what you put inside. The CDK test element cannot scroll: in a test, scroll with trusted keys (`userEvent` from `vitest/browser`: focus the region, then press PageDown or End) and poll `getScrollTop()`, because the browser scrolls a moment after the key. Nothing here names an Optimus class.',
      sourceKey: 'scrollpanel/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the region, once. The scrollbars are not stops. Tab then moves on into any controls inside the region, in reading order.',
    },
    {
      key: 'Arrow keys, Page Up, Page Down, Home, End, Space',
      effect: 'Scroll the focused region, as the browser does for any scrolling element.',
    },
  ],
  aria: [
    'Name the region with `ariaLabel` or `ariaLabelledBy`. A named region is exposed as a `region` landmark (`role="region"`); without a name it has no role, so it is not announced as a landmark with nothing to call it. `ariaDescribedBy` describes it. Setting an `aria-*` attribute on the `wj-scrollpanel` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'The region is the scrolling element and takes `tabindex="0"`, so content with no control of its own can still be reached and scrolled with the keyboard. It is one Tab stop even when its content fits.',
    'The scrollbars are hidden from assistive technology (`aria-hidden="true"`) and are not Tab stops (`tabindex="-1"`). They are for the pointer; keys, the wheel and touch scroll the region.',
    'Gap, fixed: Optimus makes its two scrollbars the keyboard stops, but they are invisible until the panel is hovered, their `aria-controls` names an id no element carries, and their `aria-valuenow` goes stale because it updates outside change detection. `wj-scrollpanel` moves the stop to the region and hides the scrollbars from assistive technology.',
    'Gap, fixed: Optimus draws a focus outline on a scrollbar with a misspelt width token, so it never showed. The region shows the focus ring instead (see Styling).',
    'Gap, listed: a panel with no block size does not scroll, and its content spills (see Basic). Give it one.',
    'Gap, listed: a thumb is at least 10 % of its track long, so it is at least 24 px long only when the panel is at least 240 px tall (or wide) on that axis. A shorter panel has a shorter thumb.',
    'Gap, listed: on touch, where nothing hovers, an invisible thumb’s 24 px hit box can still catch a tap over the last 24 px of the content at the inline end. Keep that lane clear.',
    'The thumbs are `--wj-surface-500`, at least 3:1 against the page in the light and the dark scheme. No axe rule is tolerated on this page: the states (overflowing vertically, overflowing both ways, content that fits, each named with `ariaLabel`) have no violations in either scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours come from the `--wj-*` variables that `provideWeeljack` emits. The host and Optimus’s root are blocks, and a block size you set on the host reaches the root, which fills it. The panel has no frame of its own: put it in a card or a panel when it needs one. The thumbs are 9 px thick with rounded ends and appear while the pointer is over the panel. `wj-scrollpanel` sets their colour to `--wj-surface-500` through Optimus’s `--wj-scrollpanel-bar-background` on the host, and grows each thumb’s hit box to 24 px across without changing the thumb you see or the sizes Optimus measures to place it. The focus ring is the one 2 px ring of the preset, drawn around the panel while the region itself has keyboard focus (the scrolling element is larger than its clipping container, so a ring on it would be cut), and the thumbs show while it has focus. A control inside the region shows its own ring and no second one. Where `wj-scrollpanel` routes its own attributes onto a part (the region’s `tabindex`, `role`, `aria-label`, `aria-labelledby` and `aria-describedby`; both scrollbars’ `tabindex` and `aria-hidden`), the routed value wins over the same attribute in your `pt`; every other key you set is kept. `pt` reaches the parts of the Optimus scroll panel underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-scrollpanel`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The `p-scroll-panel` element, as the host of the Optimus panel.',
    },
    { part: 'root', description: 'The `p-scroll-panel` element: the block that holds the parts.' },
    {
      part: 'contentContainer',
      description: 'The clipping box around the region. It hides the native scrollbars.',
    },
    {
      part: 'content',
      description:
        'The scrolling region that holds your content. It takes `tabindex="0"`, the routed ARIA attributes and `role="region"` while named.',
    },
    {
      part: 'barX',
      description:
        'The thumb along the block end. Pointer-only: `tabindex="-1"`, `aria-hidden="true"`.',
    },
    {
      part: 'barY',
      description:
        'The thumb along the inline end. Pointer-only: `tabindex="-1"`, `aria-hidden="true"`.',
    },
  ],
  mapping: [
    {
      optimus: 'p-scroll-panel, p-scrollPanel, p-scrollpanel',
      weeljack: 'wj-scrollpanel',
      status: 'renamed',
      note: 'One selector.',
    },
    {
      optimus: 'contentTemplate (#content)',
      weeljack: 'Default content',
      status: 'renamed',
      note: 'Put the content between the tags.',
    },
    {
      optimus: '—',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the scroll region, which is the focusable element. A named region takes `role="region"`.',
    },
    dropped(
      'step',
      'It stepped the scrollbars’ own keys. The region now scrolls with the browser’s keys.',
    ),
    dropped(
      'refresh(), scrollTop()',
      'Dropped by need. The thumbs re-measure on scroll, on hover and on window resize, so content that grows later shows correct thumbs on the next hover or scroll.',
    ),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjScrollPanelPt`. Tracks Optimus.',
    },
    dropped('styleClass; dt, unstyled, ptOptions, ScrollPanelModule', droppedAlways),
  ],
};
