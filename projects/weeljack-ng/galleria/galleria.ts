import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewEncapsulation,
  afterEveryRender,
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
import {
  WjGalleriaCaptionSlot,
  WjGalleriaItemSlot,
  WjGalleriaThumbnailSlot,
} from './galleria-slots';
import type {
  WjGalleriaPt,
  WjGalleriaResponsiveOption,
  WjGalleriaThumbnailsPosition,
} from './galleria-types';

/*
 * Notes on the template and the routed parts (kept here: a partially compiled template ships as
 * text, inside the size budget):
 * - Optimus declares Galleria and its parts in an NgModule, so `GalleriaModule` is imported here
 *   and nowhere else. Optimus only reads `value` and copies `responsiveOptions` before it sorts
 *   them, so both go in as the app gave them.
 * - The thumbnail strip is off by default (`showThumbnails`, so every gallery is as it was). Optimus
 *   makes it a `tablist` whose children are not tabs, with `aria-selected` on a `div` and
 *   `aria-label` on a role-less `div`. The focusable thumbnail is the tab (a static `role`, which
 *   `Bind` keeps), and the wrapper around it loses `aria-selected` and `aria-controls` (an
 *   `undefined` key, which `Bind` removes again after every check), so the current thumbnail is told
 *   apart by Optimus's `aria-current="page"`. Its two navigators are dimmed like the item ones.
 * - The item navigators carry a static `role="navigation"` and no name; both are routed.
 * - A navigator at an end is only dimmed (`p-disabled`), and Optimus still steps past the end on
 *   Enter: the host stops that click (`stopDimmed`), and `dim`, after every render, takes the
 *   button out of the Tab order and says it is disabled. The strip's navigators carry the same
 *   `data-pc-group-section` ending, so the pass covers them.
 * - Optimus binds nothing to Escape, so the document listener below closes the full screen; focus
 *   goes back to the opener as `visible` turns false.
 */

/**
 * A gallery over Optimus's `p-galleria`: one item at a time, with previous and next buttons and an
 * optional strip of thumbnails, inline or as a full-screen overlay. Give it `value` and put a
 * `wjGalleriaItem` template inside it (plus `wjGalleriaThumbnail` with `showThumbnails`, and an
 * optional `wjGalleriaCaption`). `ariaLabel` or `ariaLabelledBy` names the region and the
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
  /** The item shown, from 0. Changes with the navigators, the thumbnails and their keys. */
  readonly activeIndex = model(0);
  /** Whether the full screen is open (with `fullScreen`). Two-way: `[(visible)]`. */
  readonly visible = model(false);
  /** Shows the gallery as a modal overlay opened by `visible`, instead of inline. */
  readonly fullScreen = input(false, { transform: booleanAttribute });
  /** Thumbnails shown at once. */
  readonly numVisible = input(3);
  /** Changes `numVisible` while the window is at most a breakpoint wide. */
  readonly responsiveOptions = input<WjGalleriaResponsiveOption[]>();
  /** Wraps from the last item to the first and back. */
  readonly circular = input(false, { transform: booleanAttribute });
  /** Shows the previous and next buttons over the item. */
  readonly showItemNavigators = input(true, { transform: booleanAttribute });
  /** Shows the thumbnail strip: needs a `wjGalleriaThumbnail` template. */
  readonly showThumbnails = input(false, { transform: booleanAttribute });
  /** Shows the buttons that page the thumbnail strip. */
  readonly showThumbnailNavigators = input(true, { transform: booleanAttribute });
  /** Where the thumbnail strip sits. */
  readonly thumbnailsPosition = input<WjGalleriaThumbnailsPosition>('bottom');
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
  protected readonly thumbnailSlot = contentChild(WjGalleriaThumbnailSlot);
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
      ['thumbnail', { role: 'tab' }],
      ['thumbnailItem', { 'aria-selected': null, 'aria-controls': null }],
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
      host.addEventListener('keydown', stripKey, true);
    });
    afterEveryRender(() => {
      dim(host);
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

/** Sets an attribute only when it differs, so a render that changes nothing writes nothing. */
function put(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) !== value) {
    if (value === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }
}

/** Makes each navigator button Optimus dims a non-stop that reads as disabled. */
function dim(host: HTMLElement): void {
  for (const button of host.querySelectorAll('[data-pc-group-section$="navigator"]')) {
    const dimmed = button.classList.contains('p-disabled');
    put(button, 'aria-disabled', dimmed ? 'true' : null);
    put(button, 'tabindex', dimmed ? '-1' : null);
  }
}

/**
 * Stops a click on a dimmed navigator before Optimus sees it. Dimmed (`p-disabled`) is only a look:
 * the pointer cannot reach it, and `dim` keeps it out of the Tab order, but a reader who still lands
 * on it with Enter would move Optimus past the last item (an `undefined` item reaches the app's template) or before the first.
 */
function stopDimmed(event: Event): void {
  if (event.target instanceof Element && event.target.closest('.p-disabled')) {
    event.stopPropagation();
    event.preventDefault();
  }
}

const STRIP_KEYS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  Home: -Infinity,
  End: Infinity,
};

/**
 * Arrow keys, Home and End along the thumbnail strip, in place of Optimus's own: it counts the
 * strip's items with a selector the thumbnail slots also match, so every second press lands on the
 * thumbnail's image. Focus moves to the thumbnails in view (Optimus hides the rest) and takes the
 * Tab stop with it; Enter and Space still show the item.
 */
function stripKey(event: KeyboardEvent): void {
  const tab = event.target;
  const step = STRIP_KEYS[event.key];
  if (step === undefined || !(tab instanceof HTMLElement) || tab.getAttribute('role') !== 'tab') {
    return;
  }
  const tabs = Array.from(
    tab.closest('[role=tablist]')?.querySelectorAll<HTMLElement>('[role=tab]') ?? [],
  ).filter((other) => getComputedStyle(other).visibility !== 'hidden');
  const next = tabs[Math.max(0, Math.min(tabs.length - 1, tabs.indexOf(tab) + step))];
  tabs.forEach((other) => {
    other.tabIndex = other === next ? 0 : -1;
  });
  next?.focus();
  event.preventDefault();
  event.stopPropagation();
}

/** An item navigator's name from the translation `provideWeeljack` fills, English by default. */
function label(key: 'previous' | 'next'): string {
  const aria: unknown = inject(Optimus).getTranslation('aria');
  const text: unknown = Reflect.get(Object(aria), key);
  return typeof text === 'string' && text !== '' ? text : _WJ_EN.aria[key];
}
