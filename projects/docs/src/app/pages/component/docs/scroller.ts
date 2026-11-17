import { ScrollerBasicExample } from '../../../examples/scroller/basic';
import { ScrollerHorizontalExample } from '../../../examples/scroller/horizontal';
import { ScrollerLazyLoadingExample } from '../../../examples/scroller/lazy-loading';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'scroller',
  title: 'Scroller',
  purpose:
    'A virtual scroller: it renders only the items in view, so a list of thousands stays light. Give it `items`, an `itemSize` in px, a `scrollHeight` and an item template. It is the answer to a long list; for a long table use `wj-table` with `scrollable`.',
  examples: [
    {
      title: 'Basic',
      description:
        'Ten thousand items in a viewport of `20rem`. Every item is exactly `itemSize` (48 px) tall, so the scroller can size the list without measuring. The item template is your markup: `[wjScrollerItemOf]` types `let-item`, and the context also carries `index`, `count`, `first`, `last`, `even` and `odd`. Items are list items, so each carries `role="listitem"` with `aria-setsize` and `aria-posinset` from `count` and `index`, and the `content` part is the `list`, through `pt`. Only a window of items is in the page at any time.',
      sourceKey: 'scroller/basic',
      component: ScrollerBasicExample,
    },
    {
      title: 'Horizontal',
      description:
        'Set `orientation` to `horizontal` and `itemSize` becomes the width of an item. One thousand tiles of 120 px in a viewport 6rem tall; the viewport is as wide as its container, or `scrollWidth` when you set one. Each tile fills the viewport’s height.',
      sourceKey: 'scroller/horizontal',
      component: ScrollerHorizontalExample,
    },
    {
      title: 'Lazy loading',
      description:
        'Set `lazy` and the scroller asks for items as the user scrolls: `lazyLoad` emits `{ first, last }`. Bind `loading` while you fetch, and give the scroller a `wjScrollerLoader` template: it renders once per placeholder, one for each item that fits the viewport, in place of the items. Here the app loads the chunks of 50 that cover the range and writes a **new** array. `loading` does nothing without `lazy`.',
      sourceKey: 'scroller/lazy-loading',
      component: ScrollerLazyLoadingExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjScrollerHarness` from `weeljack-ng/scroller/testing` to scroll a scroller and read the items in view without touching its DOM. `getRenderedItemTexts()` returns the window Optimus keeps in the page, not every item, and `scrollToOffset()` works in the unit-test environment. Wait for the window to follow with `expect.poll` or `vi.waitFor`, never a fixed sleep.',
      sourceKey: 'scroller/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the scrolling region, one tab stop, and away from it. Items are not tab stops unless your markup makes them so.',
    },
    { key: 'ArrowUp, ArrowDown', effect: 'Scrolls a vertical scroller by a line.' },
    { key: 'ArrowLeft, ArrowRight', effect: 'Scrolls a horizontal scroller by a line.' },
    { key: 'PageUp, PageDown', effect: 'Scrolls by about a viewport.' },
    { key: 'Home, End', effect: 'Scrolls to the first or the last item.' },
  ],
  aria: [
    'The scrolling element is a `region` and the one tab stop (`tabindex="0"`), so a keyboard user can scroll it. Name it: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading. Both land on that element, which carries `role="region"`, not on the `wj-scroller` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML.',
    'The items are your markup, so list semantics are yours to write. For a list: `role="listitem"` on each item with `aria-setsize` (the `count`) and `aria-posinset` (`index + 1`), because only a window of items is in the page; and `role="list"` on the content part, through `pt`. The Basic example shows both. The scroller adds no roles to items.',
    'While a `lazy` scroller is `loading`, the region carries `aria-busy="true"`. Placeholders of the `wjScrollerLoader` slot are decoration: keep them free of text a screen reader would read.',
    'With no items the scroller is a blank region. Show your own empty message instead of the scroller.',
    'Optimus gap: Optimus draws no focus style on the region it makes focusable. `wj-scroller` authors one rule for it, the preset’s 2 px ring at a 2 px offset on `:focus-visible`.',
    'The scroller adds no animation, and no scroll shadow or scrollbar styling. Scrolling is the browser’s: it follows the system’s reduced-motion settings for smooth scrolling.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host and Optimus’s element are blocks, so the viewport is as wide as its container. Its height is `scrollHeight`, and without one the viewport has no height. Items are your markup, at `itemSize` along the axis, so the colours, the borders and the padding of an item are yours; the `--wj-*` variables are there to use. The one rule the component writes is the focus ring of the region. For anything else, `pt` reaches the parts of the Optimus scroller underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-scroller`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `role`, `aria-label`, `aria-labelledby` and `aria-busy` on the `root` part are set by the component, and win over a `pt` value of the same name. The prerender writes the scroller’s first window only where Optimus renders on the server; Optimus decides.',
  parts: [
    { part: 'host', description: 'The Optimus `p-scroller` element.' },
    {
      part: 'root',
      description:
        'The scrolling viewport: the focusable region. Takes the routed role and ARIA attributes.',
    },
    {
      part: 'content',
      description: 'The element that holds the rendered items. Give it `role="list"` for a list.',
    },
    {
      part: 'spacer',
      description: 'The element that gives the viewport the height of the whole list.',
    },
    { part: 'loader', description: 'The wrapper of the placeholders while a lazy scroller loads.' },
    { part: 'loadingIcon', description: 'The spinner shown while loading with no loader slot.' },
  ],
  mapping: [
    {
      optimus: 'items, scrollHeight, scrollWidth, lazy, loading',
      weeljack: 'same',
      status: 'kept',
      note: '`items` is a `T[]`; `T` is inferred for the item template from `[wjScrollerItemOf]`.',
    },
    {
      optimus: 'itemSize',
      weeljack: 'itemSize',
      status: 'kept',
      note: 'Required; one number: the height of an item, or its width when horizontal.',
    },
    {
      optimus: 'orientation',
      weeljack: 'orientation',
      status: 'kept',
      note: '`vertical` or `horizontal`; `both` is deferred.',
    },
    {
      optimus: 'onLazyLoad, onScrollIndexChange',
      weeljack: 'lazyLoad, scrollIndexChange',
      status: 'renamed',
      note: '`WjScrollerRange` (`first`, `last`).',
    },
    {
      optimus: 'item, loader templates',
      weeljack: 'wjScrollerItem, wjScrollerLoader',
      status: 'renamed',
      note: 'Typed slots. The scroller declares an Optimus template only for a slot you give.',
    },
    {
      optimus: 'scrollToIndex()',
      weeljack: 'scrollToIndex()',
      status: 'kept',
      note: '`index` is a number: the two-axis form is deferred with `both`.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy',
      status: 'added',
      note: 'On the scrolling element, which becomes `role="region"`.',
    },
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjScrollerPt`.' },
    dropped('onScroll', 'Its name would be the DOM `scroll` event. Use `scrollIndexChange`.'),
    dropped('content template, columns', 'Deferred with `both`.'),
    dropped('showLoader', 'The loader slot’s presence decides.'),
    dropped(
      'step, delay, resizeDelay, appendOnly, inline, disabled, loaderDisabled, showSpacer, numToleratedItems, autoSize, trackBy, options',
      droppedByNeed,
    ),
    dropped('scrollTo(), scrollInView(), getRenderedRange()', 'Use `scrollToIndex()`.'),
    dropped(
      'id, tabindex, hostName, style, styleClass, dt, unstyled, ptOptions',
      `${droppedAlways} \`tabindex\` stays 0 so the region is reachable by keyboard.`,
    ),
    dropped('loadericon template', 'Icon slots are not exposed (02 Q6).'),
  ],
};
