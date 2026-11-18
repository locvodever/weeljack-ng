import {
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';
import { Image } from '@openng/optimus-ui/image';
import {
  _OVERLAY_MOTION,
  _WJ_EN,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
} from 'weeljack-ng/private';
import type { WjImageLoading, WjImagePt } from './image-types';

/**
 * An image over Optimus's `p-image`, with an optional full-screen preview. `src` and `alt` are
 * required: an empty `alt` marks the image decorative. With `preview`, a real button covers the
 * image, named from the translation (`aria.zoomImage`). It opens a modal dialog named by `alt`
 * (the translation's `aria.zoomImage` when `alt` is empty) with a toolbar to rotate, zoom and
 * close: focus moves to Close, Tab stays in the toolbar, the page behind does not scroll, and
 * Escape or Close returns focus to the enlarge button. Give `width` and `height` so the box is
 * reserved before the image loads.
 */
@Component({
  selector: 'wj-image',
  imports: [Image],
  templateUrl: './image.html',
  styleUrl: './image.css',
  // The stylesheet styles Optimus's own elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
})
export class WjImage {
  /** URL of the image. A plain string, only ever set as the `src` of an `img`. */
  readonly src = input.required<string>();
  /** Text alternative of the image. `''` marks it decorative. Rendered as text, never as HTML. */
  readonly alt = input.required<string>();
  /** The `srcset` of the image: a plain string, only ever set on its `img`. */
  readonly srcSet = input<string>();
  /** The `sizes` of the image, for `srcSet`. */
  readonly sizes = input<string>();
  /** Width in CSS pixels, as a string (`'320'`). */
  readonly width = input<string>();
  /** Height in CSS pixels, as a string (`'240'`). */
  readonly height = input<string>();
  /** How the browser loads the image. */
  readonly loading = input<WjImageLoading>();
  /** Shows the enlarge button and the preview overlay. */
  readonly preview = input(false, { transform: booleanAttribute });
  /** URL of a larger image for the preview; the preview shows `src` without it. */
  readonly previewImageSrc = input<string>();
  /**
   * Pass-through for the image's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjImagePt>();
  /** Emits once each time the preview has opened. */
  readonly opened = output();
  /** Emits once each time the preview has closed, whatever closed it, after focus has returned. */
  readonly closed = output();
  /** Emits when the image fails to load. */
  readonly imageError = output<Event>();

  private readonly inner = viewChild(Image);
  protected readonly motion = _OVERLAY_MOTION;
  private readonly zoomLabel = zoomLabel();

  /**
   * `pt` forwarded as given, plus two routed parts. The enlarged image gets the `alt` Optimus
   * leaves off it. The overlay is a dialog Optimus leaves unnamed: `alt` names it, or the
   * translation's `aria.zoomImage` while `alt` is empty.
   */
  protected readonly partAttributes = computed<WjImagePt>(() =>
    _mergePartAttributes(_mergePartAttributes(this.pt(), 'original', { alt: this.alt() }), 'mask', {
      'aria-label': this.alt() || this.zoomLabel,
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-image');
    _checkAriaOnHost('wj-image', 'Use the alt input, which names the image and its preview');
  }

  /** Optimus has finished closing the preview: put focus back on the enlarge button, then say so. */
  protected hidden(): void {
    // Optimus returns focus after Escape only; Close would leave it on the page.
    const button: unknown = this.inner()?.previewButton?.nativeElement;
    if (button instanceof HTMLElement) {
      button.focus();
    }
    this.closed.emit();
  }
}

/** `aria.zoomImage` of the translation `provideWeeljack` fills, with the English default. */
function zoomLabel(): string {
  const aria: unknown = inject(Optimus).getTranslation('aria');
  const label: unknown = Reflect.get(Object(aria), 'zoomImage');
  return typeof label === 'string' && label !== '' ? label : _WJ_EN.aria.zoomImage;
}
