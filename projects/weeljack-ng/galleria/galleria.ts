import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  untracked,
} from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';
import { GalleriaModule } from '@openng/optimus-ui/galleria';
import {
  _OVERLAY_MOTION,
  _WJ_EN,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _overlayLifecycle,
} from 'weeljack-ng/private';
import { WjGalleriaCaptionSlot, WjGalleriaItemSlot } from './galleria-slots';
import type { WjGalleriaPt } from './galleria-types';

/*
 * Notes on the template and the routed parts (kept here: a partially compiled template ships as
 * text, inside the size budget):
 * - Optimus declares Galleria and its parts in an NgModule, so `GalleriaModule` is imported here
 *   and nowhere else. Optimus only reads `value`, so the app's array goes in as it is.
 * - There is no thumbnail strip (`[showThumbnails]="false"`): with it the entry weighs 3.29 KB
 *   against a limit of 2.75 KB (21), so the PRD's fallback ships without it (� 9 item 6).
 * - The item navigators carry a static `role="navigation"` and no name; both are routed.
 * - A navigator at an end is only dimmed, and Optimus still steps past the end on Enter: the host
 *   stops that click (`stopDimmed`).
 * - Optimus binds nothing to Escape, so the document listener below closes the full screen; focus
 *   goes back to the opener as `visible` turns false.
 */

/**
 * A gallery over Optimus's `p-galleria`: one item at a time, with previous and next buttons,
 * inline or as a full-screen overlay. Give it `value` and put a `wjGalleriaItem` template inside it
 * (and an optional `wjGalleriaCaption`). `ariaLabel` or `ariaLabelledBy` names the region and the
 * full-screen dialog. With `fullScreen`, bind `[(visible)]` to open it: focus moves to Close, Tab
 * stays inside, the page behind does not scroll, and Escape or Close returns focus to whatever
 * opened it. Nothing moves on its own.
 */
@Component({
  selector: 'wj-galleria',
  imports: [GalleriaModule, NgTemplateOutlet],
  templateUrl: './galleria.html',
  styleUrl: './galleria.css',
  // The stylesheet styles Optimus's own elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
  host: { '(document:keydown.escape)': 'escape()' },
})
export class WjGalleria<T = unknown> {
  /** The items. Never changed: the gallery only reads it. */
  readonly value = input<T[]>([]);
  /** The item shown, from 0. Changes with the previous and next buttons. */
  readonly activeIndex = model(0);
  /** Whether the full screen is open (with `fullScreen`). Two-way: `[(visible)]`. */
  readonly visible = model(false);
  /** Shows the gallery as a modal overlay opened by `visible`, instead of inline. */
  readonly fullScreen = input(false, { transform: booleanAttribute });
  /** Wraps from the last item to the first and back. */
  readonly circular = input(false, { transform: booleanAttribute });
  /** Shows the previous and next buttons over the item. */
  readonly showItemNavigators = input(true, { transform: booleanAttribute });
  /** Names the region and the full-screen dialog. Required: Optimus leaves both unnamed. */
  readonly ariaLabel = input.required<string>();
  /** Id of the element that names the region and the dialog. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the gallery's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjGalleriaPt>();

  protected readonly itemSlot = contentChild.required(WjGalleriaItemSlot);
  protected readonly captionSlot = contentChild(WjGalleriaCaptionSlot);
  protected readonly motion = _OVERLAY_MOTION;

  private readonly previousLabel = label('previous');
  private readonly nextLabel = label('next');

  /** `pt` forwarded as given, plus what this wrapper routes (see the notes above). */
  protected readonly partAttributes = computed<WjGalleriaPt>(() => {
    const name = { 'aria-label': this.ariaLabel(), 'aria-labelledby': this.ariaLabelledBy() };
    const routed = [
      ['root', name],
      ['mask', name],
      ['prevButton', { role: null, 'aria-label': this.previousLabel }],
      ['nextButton', { role: null, 'aria-label': this.nextLabel }],
    ] as const;
    return routed.reduce<WjGalleriaPt>(
      (pt, [part, attributes]) => _mergePartAttributes(pt, part, attributes),
      this.pt(),
    );
  });

  constructor() {
    _checkWeeljackSetup('wj-galleria');
    _checkAriaOnHost('wj-galleria', 'Use ariaLabel or ariaLabelledBy instead');
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      host.addEventListener('click', stopDimmed, true);
    });
    const lifecycle = _overlayLifecycle(this.visible, () => undefined);
    effect(() => {
      if (!this.visible()) {
        untracked(() => {
          lifecycle.left();
        });
      }
    });
  }

  /** Optimus wires no Escape key: close the open full screen. */
  protected escape(): void {
    if (this.fullScreen() && this.visible()) {
      this.visible.set(false);
    }
  }
}

/**
 * Stops a click on a dimmed navigator before Optimus sees it. Dimmed (`p-disabled`) is only a look:
 * the pointer cannot reach it, but a navigator at an end stays a Tab stop, and Enter on it would move
 * Optimus past the last item (an `undefined` item reaches the app's template) or before the first.
 */
function stopDimmed(event: Event): void {
  if (event.target instanceof Element && event.target.closest('.p-disabled')) {
    event.stopPropagation();
    event.preventDefault();
  }
}

/** An item navigator's name from the translation `provideWeeljack` fills, English by default. */
function label(key: 'previous' | 'next'): string {
  const aria: unknown = inject(Optimus).getTranslation('aria');
  const text: unknown = Reflect.get(Object(aria), key);
  return typeof text === 'string' && text !== '' ? text : _WJ_EN.aria[key];
}
