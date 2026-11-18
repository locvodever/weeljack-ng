import { GalleriaBasicExample } from '../../../examples/galleria/basic';
import { GalleriaFullScreenExample } from '../../../examples/galleria/full-screen';
import { GalleriaWithCaptionExample } from '../../../examples/galleria/with-caption';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

const droppedForSize = (optimus: string): MappingRow =>
  dropped(
    optimus,
    'Dropped: size (21). With the thumbnail strip the entry weighs 3.29 KB against its 2.75 KB limit. It can return as an additive minor.',
  );

export const DOC: ComponentDoc = {
  entry: 'galleria',
  title: 'Galleria',
  purpose:
    'A gallery that shows one photo at a time with previous and next buttons, inline or as a full-screen overlay. It never moves on its own.',
  examples: [
    {
      title: 'Basic',
      description:
        'Give `value` and put an `ng-template` with `wjGalleriaItem` inside: it renders for the item shown, and `[wjGalleriaItemOf]` only types `let-photo`. `ariaLabel` names the region. Give each photo a descriptive `alt`; same-shape photos keep the gallery from changing size between items. Render the gallery only when it has photos, such as `@if (photos.length) { <wj-galleria …> } @else { <p>No photos yet.</p> }`: with none, Optimus draws an empty box.',
      sourceKey: 'galleria/basic',
      component: GalleriaBasicExample,
    },
    {
      title: 'With caption',
      description:
        'A `wjGalleriaCaption` template shows over the bottom of the photo, on the photo scrim. Keep it to a title and one line. Give the caption template when the gallery is created: Optimus reads it when it draws an item, so one that arrives later shows from the next item on.',
      sourceKey: 'galleria/with-caption',
      component: GalleriaWithCaptionExample,
    },
    {
      title: 'Full screen',
      description:
        'With `fullScreen` the gallery shows over the page while `visible` is true. An app button sets it, and `[(visible)]` follows Close, Escape and a click on the backdrop. Focus moves to Close when it opens and goes back to the button when it closes. The gallery is `min(48rem, 90vw)` wide, centred on the mask. `visible` has no effect without `fullScreen`.',
      sourceKey: 'galleria/full-screen',
      component: GalleriaFullScreenExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjGalleriaHarness` from `weeljack-ng/galleria/testing` to find a gallery by its name and read what a user meets: the item shown (from 0) and its caption. Move with `next` and `previous`; `isFullScreenOpen` and `closeFullScreen` drive the full screen. A full-screen gallery that is closed has no region and no name, so find it without a filter. With Optimus’s motion on, a closed full screen can leave a hidden mask in the page: `isFullScreenOpen` reads it as closed.',
      sourceKey: 'galleria/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect:
        'Moves to the previous button, then the next button, then on. A button at an end looks dim but stays a Tab stop. In full screen focus starts on Close, and Tab stays inside the gallery.',
    },
    {
      key: 'Enter or Space',
      effect:
        'On the previous or next button: shows the previous or next item. On a button at an end: nothing.',
    },
    {
      key: 'Escape',
      effect:
        'In full screen: closes it by setting `visible` to `false`, and focus goes back to the element that opened it. Inline: nothing.',
    },
  ],
  aria: [
    '`ariaLabel` is required and names the gallery. Optimus 2.0.2 renders its root as `role="region"` and the full-screen overlay as `role="dialog"`, both with no name; `ariaLabel` (or `ariaLabelledBy`) lands on both. A missing `ariaLabel` is a compile error under `strictTemplates`. Name each gallery on a page differently.',
    'Optimus draws the previous and next buttons with a static `role="navigation"` and no name, an axe failure. `wj-galleria` removes the role and names them from the translation (`aria.previous` and `aria.next`, “Previous” and “Next” in English). The names are read once, when the gallery is created.',
    'Optimus marks the item `role="group"` with `aria-roledescription="Slide"` and names it by its number alone (`aria.slideNumber`, “1” in English). Set `aria.slideNumber` in your translation to a phrase such as “Photo {slideNumber}” for a fuller name.',
    'Every `img` in a template is yours: give each item image a descriptive `alt`.',
    'The full screen is a modal `role="dialog"` named by `ariaLabel`. Focus moves to Close when it opens, Tab stays inside, and the page behind does not scroll. Optimus wires no Escape: `wj-galleria` closes the gallery on Escape and returns focus to the element that opened it, whichever way it closed (Close, Escape, the backdrop or the app setting `visible` to `false`).',
    'Listed gap: the previous button on the first item, and the next button on the last (not circular), look dim but stay Tab stops and are not announced as disabled. Optimus would step past the end when Enter reaches one, handing your template an `undefined` item: `wj-galleria` stops that click.',
    'There is no thumbnail strip, and no indicators: the navigators are the way to move. Optimus’s strip is a `tablist` of `div`s that are not tabs, with `aria-selected` on a `div` and `aria-label` on a role-less `div`, and its arrow keys miscount; making it clean takes more code than the entry’s size limit leaves. It can return as an additive minor.',
    'Nothing moves on its own: there is no autoplay, so WCAG 2.2.2 (pause, stop, hide) does not apply. The full screen fades and scales in over 300 ms, and `wj-galleria` makes that motion respect `prefers-reduced-motion`: under reduced motion it appears and disappears at once.',
    'An `aria-*` attribute on `wj-galleria` is not forwarded and raises `WJ0003` in development: use `ariaLabel` or `ariaLabelledBy` instead.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari, for the overlay) are recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `block` with no padding, border or background of its own; the frame, the photo, the buttons and the spacing are Optimus’s. The previous and next buttons, Close and the caption sit on a photo, so all four use one scrim, the darkest surface at 70 %, in the light and the dark scheme alike (hover on a button is the solid surface). The full-screen gallery is `min(48rem, 90vw)` wide. For anything else, `pt` reaches the parts of the Optimus galleria underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-galleria`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-galleria` sets these itself, and they win over the same attributes in your `pt`: the `aria-label` and `aria-labelledby` of `root` and `mask`, and the `role` and `aria-label` of the previous and next buttons; every other key you pass is kept.',
  parts: [
    {
      part: 'root',
      description:
        'The gallery’s frame, `role="region"` (inline and in the full screen). `wj-galleria` sets its `aria-label` and `aria-labelledby`.',
    },
    {
      part: 'mask',
      description:
        'The full-screen backdrop, `role="dialog"`. `wj-galleria` sets its `aria-label` and `aria-labelledby`.',
    },
    {
      part: 'closeButton',
      description: 'The Close button in full screen, named by the translation (`aria.close`).',
    },
    { part: 'content', description: 'The column that holds the item.' },
    { part: 'itemsContainer', description: 'The box that holds the item and its buttons.' },
    { part: 'items', description: 'The row of the item and the buttons.' },
    {
      part: 'prevButton',
      description:
        'The previous button. `wj-galleria` removes its `role` and sets its `aria-label`.',
    },
    { part: 'item', description: 'The item: a `role="group"` that holds your item template.' },
    {
      part: 'nextButton',
      description: 'The next button. `wj-galleria` removes its `role` and sets its `aria-label`.',
    },
    {
      part: 'caption',
      description: 'The caption band over the bottom of the item, present with a caption template.',
    },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'The items, `input<T[]>`; `T` is inferred from `wjGalleriaItemOf`. Never changed.',
    },
    {
      optimus: 'activeIndex, activeIndexChange',
      weeljack: 'activeIndex',
      status: 'kept',
      note: 'A two-way `model`: `[(activeIndex)]`. Counts from 0.',
    },
    {
      optimus: 'visible, visibleChange',
      weeljack: 'visible',
      status: 'kept',
      note: 'A two-way `model`: `[(visible)]`. Whether the full screen is open.',
    },
    {
      optimus: 'fullScreen',
      weeljack: 'fullScreen',
      status: 'kept',
      note: 'Shows the gallery as a modal overlay, opened by `visible`.',
    },
    {
      optimus: 'circular',
      weeljack: 'circular',
      status: 'kept',
      note: 'Wraps from the last item to the first and back.',
    },
    {
      optimus: 'showItemNavigators',
      weeljack: 'showItemNavigators',
      status: 'kept',
      note: '`true` by default here (`false` in Optimus): the buttons are how a reader moves.',
    },
    {
      optimus: 'item, caption templates',
      weeljack: 'wjGalleriaItem, wjGalleriaCaption slots',
      status: 'renamed',
      note: '`WjGalleriaItemSlot<T>` (required) and `WjGalleriaCaptionSlot<T>`, on an `ng-template`. The contexts are `WjGalleriaItemContext<T>` and `WjGalleriaCaptionContext<T>`, `{ $implicit: T }`; `[wjGalleriaItemOf]` and `[wjGalleriaCaptionOf]` type them.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel',
      status: 'added',
      note: 'Required. Names the region and the full-screen dialog.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabelledBy',
      status: 'added',
      note: 'Names the region and the dialog by id.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjGalleriaPt`. Tracks Optimus.',
    },
    droppedForSize('showThumbnails'),
    droppedForSize('showThumbnailNavigators'),
    droppedForSize('thumbnailsPosition'),
    droppedForSize('numVisible'),
    droppedForSize('responsiveOptions'),
    droppedForSize('thumbnail template'),
    dropped(
      'autoPlay, shouldStopAutoplayByClick, transitionInterval',
      'Not exposed. Nothing moves on its own. Autoplay needs a pause control and `aria-live` off while it rotates (Optimus has that inverted); it can return as an additive minor.',
    ),
    dropped(
      'showIndicators, showIndicatorsOnItem, indicatorsPosition, changeItemOnIndicatorHover, indicator template',
      'The indicators carry `aria-selected` on an `li` and an unnamed inner button, so the gallery has none.',
    ),
    dropped(
      'showItemNavigatorsOnHover',
      'Hover-only controls hide from keyboard users, so the buttons always show.',
    ),
    dropped(
      'verticalThumbnailViewPortHeight, left and right positions',
      'By need: no thumbnails, no vertical layout.',
    ),
    dropped('id, baseZIndex', 'By need. The id is generated and the z-index is the config’s.'),
    dropped('motionOptions, maskMotionOptions', 'Set internally to `{ safe: true }`.'),
    dropped(
      'showTransitionOptions, hideTransitionOptions',
      'Deprecated since Optimus v21 in favour of the motion options.',
    ),
    dropped('header, footer templates', 'By need. Content around the gallery is your own markup.'),
    dropped(
      'closeicon, itempreviousicon, itemnexticon, previousthumbnailicon, nextthumbnailicon templates',
      'Icon slots are not exposed.',
    ),
    dropped('maskClass, containerClass, containerStyle, dt, unstyled, ptOptions', droppedAlways),
  ],
};
