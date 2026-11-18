import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ViewEncapsulation,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Carousel } from '@openng/optimus-ui/carousel';
import { Optimus } from '@openng/optimus-ui/config';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _WJ_EN,
} from 'weeljack-ng/private';
import { WjCarouselItemSlot } from './carousel-slots';
import type { WjCarouselPt, WjCarouselResponsiveOption } from './carousel-types';

/*
 * Notes on the template and the routed parts (kept here: a partially compiled template ships as
 * text, inside the size budget):
 * - Optimus only reads `value`, so the app's array goes in as it is. `responsiveOptions` goes in as
 *   a copy: Optimus sorts the array it is given, in place.
 * - Optimus's `Bind` writes a part's attributes in an effect and removes only an `undefined` key, so
 *   only attributes Optimus does not bind are routed: the region name on `root`, the navigators'
 *   names on the inner `<button>`, `inert`, and `aria-live` (Optimus's own binding is the constant
 *   `off`, written once). `item` is re-evaluated by Optimus for every slide on each of its checks,
 *   with `context.active`, so `inert` follows the page.
 * - Clones are never on screen at rest, so every one is `inert`.
- Optimus's slide states lag its own layout by one check at creation and after an input change:
  see the `afterRenderEffect` in the constructor.
 */

/**
 * A slider of slides over Optimus's `p-carousel`. Give it `value` and put a `wjCarouselItem`
 * template inside it to say what each slide shows. `numVisible` and `numScroll` set the page,
 * `responsiveOptions` change them by window width, and `circular` wraps from the last page to the
 * first. It never moves on its own. The region is named by `ariaLabel` or `ariaLabelledBy`, slides
 * off screen are `inert`, and the navigators are named from the translation. Render it only with
 * items.
 */
@Component({
  selector: 'wj-carousel',
  imports: [Carousel, NgTemplateOutlet],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  // The stylesheet styles Optimus's own elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
})
export class WjCarousel<T = unknown> {
  /** The items, one per slide. Never changed: the carousel only reads it. */
  readonly value = input<T[]>([]);
  /** The page shown, from 0. Changes with the navigators, the indicators and the keys. */
  readonly page = model(0);
  /** Slides shown at once. */
  readonly numVisible = input(1);
  /** Slides a page change moves. */
  readonly numScroll = input(1);
  /** Changes `numVisible` and `numScroll` while the window is at most a breakpoint wide. */
  readonly responsiveOptions = input<WjCarouselResponsiveOption[]>();
  /** Wraps from the last page to the first and back. */
  readonly circular = input(false, { transform: booleanAttribute });
  /** Shows the page indicators. */
  readonly showIndicators = input(true, { transform: booleanAttribute });
  /** Shows the previous and next buttons. */
  readonly showNavigators = input(true, { transform: booleanAttribute });
  /** Names the region. Required: Optimus leaves it unnamed. Set on the root, not the host. */
  readonly ariaLabel = input.required<string>();
  /** Id of the element that names the region. Set on the root, not the host. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the carousel's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjCarouselPt>();

  protected readonly itemSlot = contentChild(WjCarouselItemSlot);
  private readonly inner = viewChild(Carousel);
  protected readonly options = computed(() => this.responsiveOptions()?.slice());

  private readonly previousLabel = label('prevPageLabel');
  private readonly nextLabel = label('nextPageLabel');

  /** `pt` forwarded as given, plus what this wrapper routes (see the notes above). */
  protected readonly partAttributes = computed<WjCarouselPt>(() => {
    const routed = [
      ['root', { 'aria-label': this.ariaLabel(), 'aria-labelledby': this.ariaLabelledBy() }],
      ['content', { 'aria-live': 'polite' }],
      ['pcPrevButton.root', { 'aria-label': this.previousLabel }],
      ['pcNextButton.root', { 'aria-label': this.nextLabel }],
      ['itemClone', { inert: 'true' }],
    ] as const;
    const merged = routed.reduce<WjCarouselPt>(
      (pt, [part, attributes]) => _mergePartAttributes(pt, part, attributes),
      this.pt(),
    );
    return (context) => {
      const pt = typeof merged === 'function' ? merged(context) : merged;
      const item = pt?.item;
      return {
        ...pt,
        item: (options) => {
          const own = typeof item === 'function' ? item(options) : item;
          return {
            ...(typeof own === 'string' ? { class: own } : own),
            inert: isActive(options) ? undefined : 'true',
          };
        },
      };
    };
  });

  constructor() {
    _checkWeeljackSetup('wj-carousel');
    _checkAriaOnHost('wj-carousel', 'Use ariaLabel or ariaLabelledBy instead');

    // Optimus works out which slides are on screen after its first check (a circular carousel
    // starts one `numVisible` in) and again after each of these inputs, but its OnPush view
    // renders once: without a second check `inert` would sit on the slide the reader is looking at.
    afterRenderEffect(() => {
      this.value();
      this.circular();
      this.numVisible();
      this.numScroll();
      this.options();
      this.itemSlot();
      this.inner()?.cd.markForCheck();
    });
  }
}

/** Whether Optimus's `item` context says the slide is on screen. */
function isActive(options: unknown): boolean {
  const context: unknown = Reflect.get(Object(options), 'context');
  return Reflect.get(Object(context), 'active') === true;
}

/** A navigator's name from the translation `provideWeeljack` fills, with the English default. */
function label(key: 'prevPageLabel' | 'nextPageLabel'): string {
  const aria: unknown = inject(Optimus).getTranslation('aria');
  const text: unknown = Reflect.get(Object(aria), key);
  return typeof text === 'string' && text !== '' ? text : _WJ_EN.aria[key];
}
