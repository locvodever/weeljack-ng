import { CarouselBasicExample } from '../../../examples/carousel/basic';
import { CarouselCircularExample } from '../../../examples/carousel/circular';
import { CarouselResponsiveExample } from '../../../examples/carousel/responsive';
import { CarouselSeveralVisibleExample } from '../../../examples/carousel/several-visible';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'carousel',
  title: 'Carousel',
  purpose:
    'A slider that shows a few slides at a time and pages through the rest. It never moves on its own.',
  examples: [
    {
      title: 'Basic',
      description:
        'Give `value` and put an `ng-template` with `wjCarouselItem` inside: it renders once per item, and `[wjCarouselItemOf]` only types `let-product`. `ariaLabel` names the region. Render the carousel only when it has items, such as `@if (products.length) { <wj-carousel …> } @else { <p>No products yet.</p> }`: with none, Optimus draws both buttons around an empty strip. The name of each card is its link; a real app links it to the product. A link on a slide that is off screen leaves the Tab order.',
      sourceKey: 'carousel/basic',
      component: CarouselBasicExample,
    },
    {
      title: 'Several visible',
      description:
        '`numVisible` slides show at once and a page change moves `numScroll` of them. Three and three here, so the six cards are two pages; a `numScroll` smaller than `numVisible` makes more pages that overlap.',
      sourceKey: 'carousel/several-visible',
      component: CarouselSeveralVisibleExample,
    },
    {
      title: 'Responsive',
      description:
        '`responsiveOptions` change `numVisible` and `numScroll` while the window is at most a breakpoint wide: here three cards, two below a 1024 px window and one below 640 px. The breakpoints follow the window, not the panel the carousel sits in. The array you pass is never reordered.',
      sourceKey: 'carousel/responsive',
      component: CarouselResponsiveExample,
    },
    {
      title: 'Circular',
      description:
        'With `circular` the next button on the last page wraps to the first page, and the previous button on the first page wraps to the last. Optimus wraps by sliding onto a copy of the first slides and then jumping to the real ones; the copies are `inert`. Set `circular` when the carousel is created: Optimus reads it once.',
      sourceKey: 'carousel/circular',
      component: CarouselCircularExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjCarouselHarness` from `weeljack-ng/carousel/testing` to find a carousel by its name and read what a user meets: the page and the number of pages, the slides on screen and their text. Page with `next`, `previous` and `goToPage`. Pages count from 0. The page count, `getPage` and `goToPage` read the indicators, so they need `showIndicators`.',
      sourceKey: 'carousel/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect:
        'Moves to the previous button, the controls in the slides on screen, the next button, then the indicator of the current page. Slides off screen are skipped.',
    },
    {
      key: 'Enter or Space',
      effect: 'On the previous or next button: changes the page. On an indicator: shows that page.',
    },
    {
      key: 'ArrowLeft or ArrowRight',
      effect: 'On an indicator: moves focus to the previous or next indicator.',
    },
  ],
  aria: [
    '`ariaLabel` is required and names the carousel. Optimus 2.0.2 renders its root as `role="region"` with no name, an axe `landmark` failure; `ariaLabel` (or `ariaLabelledBy`) lands there. A missing `ariaLabel` is a compile error under `strictTemplates`. Name each carousel on a page differently.',
    'The previous and next buttons are named from the translation (`aria.prevPageLabel` and `aria.nextPageLabel`, “Previous Page” and “Next Page” in English). Optimus puts that name on the `p-button` element and leaves the real `<button>` inside with none, an axe `button-name` failure: `wj-carousel` names the inner button. The names are read once, when the carousel is created.',
    'Optimus marks every slide off screen `aria-hidden` while its content stays focusable, an axe `aria-hidden-focus` failure as soon as a slide holds a link or a button. `wj-carousel` makes every slide off screen `inert`, the copies a circular carousel keeps included, and takes `inert` off a slide when it comes on screen. Optimus works out which slides are on screen one check late after it is created and after `value`, `numVisible` and `numScroll` change; `wj-carousel` asks it to check again.',
    'Slide changes are announced: Optimus ties `aria-live` to its autoplay, which is always off here, so `wj-carousel` sets `aria-live="polite"` on the content. A spec re-checks it after paging, a wrap and a change of inputs.',
    'Each indicator is a button named by the translation (`aria.pageLabel`, “Page 1” in English), and the current one has `aria-current="page"`. The visible bar stays 32 × 8 px; its hit box is 32 × 24 px. The bar is drawn in the preset’s control-boundary colour, which holds 3:1 against the page, where Optimus’s own is under 2:1.',
    'Listed gap: on the indicators only ArrowLeft and ArrowRight move focus. Optimus wires no Home or End.',
    'Listed gap: on the first page the previous button, and on the last page the next button (not circular), look dim but stay Tab stops and are not announced as disabled.',
    'Nothing moves on its own: there is no autoplay, so WCAG 2.2.2 (pause, stop, hide) does not apply. Optimus’s slide runs a 500 ms transition that no option reaches; under `prefers-reduced-motion: reduce` `wj-carousel` makes it 1 ms. It is never `none`: the circular wrap finishes on the transition’s end, and without that event the carousel would stay on a copy.',
    'Optimus puts `autofocus="true"` on each navigator’s button. It does not move focus when the carousel renders (a spec pins this); it only leaves the attribute.',
    'An `aria-*` attribute on `wj-carousel` is not forwarded and raises `WJ0003` in development: use `ariaLabel` or `ariaLabelledBy` instead.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `block` with no padding, border or background of its own, and the slides, the navigators and the spacing are Optimus’s. Three things differ. Each indicator button is a 32 × 24 px box whose bar, still 32 × 8 px, is painted on its content box (8 px of transparent block padding): the indicator list’s block padding drops from 16 px to 8 px so the bar keeps its place. The inactive bar is `--wj-form-field-border-color` and its hover is `--wj-form-field-hover-border-color`; the current bar stays `--wj-primary-color`. The content container gets 4 px of padding, so the navigators’ focus rings are not clipped by its scrolling overflow. Under `prefers-reduced-motion: reduce` the slide’s transition lasts 1 ms. Slides are your own content: give a card an inline margin of about 8 px so its ring does not touch the viewport’s edge. For anything else, `pt` reaches the parts of the Optimus carousel underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-carousel`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-carousel` sets these itself, and they win over the same attributes in your `pt`: the root’s `aria-label` and `aria-labelledby`, the inner buttons’ `aria-label`, `inert` on slides and copies, and the content’s `aria-live`; every other key you pass is kept.',
  parts: [
    {
      part: 'root',
      description:
        'The Optimus `p-carousel` element, `role="region"`. `wj-carousel` sets its `aria-label` and `aria-labelledby`.',
    },
    {
      part: 'content',
      description: 'The row that holds the buttons and the viewport. Its `aria-live` is set.',
    },
    {
      part: 'pcPrevButton',
      description:
        'The previous button, a pass-through of its own: `root` is the `<button>`, which `wj-carousel` names.',
    },
    { part: 'viewport', description: 'The clipping box around the slides.' },
    { part: 'itemList', description: 'The row of slides that slides sideways.' },
    {
      part: 'item',
      description:
        'One slide. Its function form receives a `context` with `active`, `index`, `start` and `end`. `wj-carousel` sets `inert` on it.',
    },
    {
      part: 'itemClone',
      description: 'A copy of a slide, kept at both ends of a circular carousel. It is `inert`.',
    },
    {
      part: 'pcNextButton',
      description:
        'The next button, a pass-through of its own: `root` is the `<button>`, which `wj-carousel` names.',
    },
    { part: 'indicatorList', description: 'The list of page indicators.' },
    { part: 'indicator', description: 'One indicator’s `li`.' },
    { part: 'indicatorButton', description: 'One indicator’s `button`, the bar and its hit box.' },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'The items, `input<T[]>`; `T` is inferred from `wjCarouselItemOf`. Never changed.',
    },
    {
      optimus: 'page, onPage',
      weeljack: 'page, pageChange',
      status: 'renamed',
      note: 'A two-way `model`: `[(page)]`. The page counts from 0.',
    },
    {
      optimus: 'numVisible, numScroll',
      weeljack: 'numVisible, numScroll',
      status: 'kept',
      note: '1 each by default.',
    },
    {
      optimus: 'responsiveOptions',
      weeljack: 'responsiveOptions',
      status: 'kept',
      note: '`WjCarouselResponsiveOption[]`: `breakpoint`, `numVisible`, `numScroll`. Your array is copied, because Optimus sorts the one it is given.',
    },
    {
      optimus: 'circular',
      weeljack: 'circular',
      status: 'kept',
      note: 'Read when the carousel is created.',
    },
    {
      optimus: 'showIndicators, showNavigators',
      weeljack: 'showIndicators, showNavigators',
      status: 'kept',
      note: '`true` by default.',
    },
    {
      optimus: 'item template',
      weeljack: 'wjCarouselItem slot',
      status: 'renamed',
      note: '`WjCarouselItemSlot<T>`, on an `ng-template`. The context is `WjCarouselItemContext<T>`, `{ $implicit: T }`, and `[wjCarouselItemOf]` types it.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel',
      status: 'added',
      note: 'Required. Names the region, on the Optimus root.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy',
      status: 'added',
      note: 'Names the region by id.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjCarouselPt`. Tracks Optimus.',
    },
    dropped(
      'autoplayInterval',
      'Not exposed. Autoplay needs a pause control named from the translation, which has no play or pause key, no start under reduced motion, a stop on hover and focus, and `aria-live` off while it rotates (Optimus has that inverted). It can return as an additive minor.',
    ),
    dropped('orientation, verticalViewPortHeight', 'By need: horizontal only.'),
    dropped(
      'prevButtonProps, nextButtonProps',
      'By need. `pt.pcPrevButton` and `pt.pcNextButton` reach the buttons.',
    ),
    dropped(
      'header, footer templates, p-header, p-footer',
      'By need. Content around the carousel is your own markup.',
    ),
    dropped('previousicon, nexticon templates', 'Icon slots are not exposed.'),
    dropped(
      'contentClass, indicatorsContentClass, indicatorsContentStyle, indicatorStyleClass, indicatorStyle, styleClass, dt, unstyled, ptOptions',
      droppedAlways,
    ),
  ],
};
