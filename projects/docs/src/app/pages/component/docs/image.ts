import { ImageBasicExample } from '../../../examples/image/basic';
import { ImageDecorativeExample } from '../../../examples/image/decorative';
import { ImagePreviewExample } from '../../../examples/image/preview';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'image',
  title: 'Image',
  purpose: 'An image with an optional full-screen preview to rotate, zoom and close.',
  examples: [
    {
      title: 'Basic',
      description:
        'An image needs a `src` and an `alt`. Set `width` and `height` too, so the box is reserved before the image loads and the page does not jump.',
      sourceKey: 'image/basic',
      component: ImageBasicExample,
    },
    {
      title: 'Preview',
      description:
        'With `preview`, hovering the image or tabbing to it reveals an enlarge button, and Enter or Space opens the preview. The preview is a dialog named by the `alt`, with a toolbar to rotate, zoom and close. Escape or Close returns focus to the enlarge button, and `(opened)` and `(closed)` fire once each time.',
      sourceKey: 'image/preview',
      component: ImagePreviewExample,
    },
    {
      title: 'Decorative',
      description:
        'An image that adds nothing the text does not say takes `alt=""`. Screen readers skip it, so the sentence beside it has to carry the meaning.',
      sourceKey: 'image/decorative',
      component: ImageDecorativeExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjImageHarness` from `weeljack-ng/image/testing` to find an image by its URL or text alternative and read what a user meets: whether it offers a preview, then open it, rotate, zoom and close it. The preview renders inside the host, so the harness finds it from the image.',
      sourceKey: 'image/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect: 'Moves to the enlarge button. An image without `preview` is not a Tab stop.',
    },
    {
      key: 'Enter or Space',
      effect: 'On the enlarge button: opens the preview, with focus on Close.',
    },
    {
      key: 'Tab and Shift+Tab',
      effect: 'In the preview: cycle through the toolbar, and never leave it.',
    },
    {
      key: 'Enter or Space',
      effect: 'On a toolbar button: rotates, zooms or closes the preview.',
    },
    { key: 'Escape', effect: 'Closes the preview and returns focus to the enlarge button.' },
  ],
  aria: [
    '`alt` is required. An informative image describes what it shows; a decorative one sets `alt=""`, and the compiler rejects a template that leaves it out.',
    'The enlarge control is a real `button` named by the translation (`aria.zoomImage`, “Zoom Image” in English). The preview toolbar buttons are named from the translation too.',
    'The preview is a modal `role="dialog"`. Optimus 2.0.2 leaves it with no name; `wj-image` names it with the `alt`, or with `aria.zoomImage` when the `alt` is empty. The enlarged image carries the same `alt`: Optimus renders it with none.',
    'Focus moves to Close when the preview opens and stays in the toolbar. Escape returns it to the enlarge button; so does Close, which Optimus alone leaves on the page.',
    'The page behind the preview does not scroll while it is open.',
    'Always set `width` and `height`. The enlarge button covers the whole image and appears on hover and on keyboard focus.',
    'An `aria-*` attribute on `wj-image` is not forwarded and raises `WJ0003` in development: use `alt` instead.',
    'The preview fades and scales in and out, and `wj-image` makes that motion respect `prefers-reduced-motion`. Under reduced motion the rotate and zoom apply at once as well.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari) are recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-block` with no padding, border or background: the image is the only painted box. The enlarge wash and the toolbar pill sit on a photo, so both use one scrim, the darkest surface at 70 %, in the light and the dark scheme alike. Keyboard focus on the enlarge button draws the preset’s 2 px ring outside the image, which Optimus removes. Under `prefers-reduced-motion: reduce` the enlarged image’s rotate and zoom transition is off. For anything else, `pt` reaches the parts of the Optimus image underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-image`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. An `alt` on `original` and an `aria-label` on `mask` are set by `wj-image` and win over the same attribute in your `pt`; every other key you pass is kept. Optimus swallows the first click on the backdrop after a rotate or zoom; Escape and Close always close.',
  parts: [
    { part: 'root', description: 'The Optimus `p-image` element.' },
    { part: 'image', description: 'The inline `img`.' },
    {
      part: 'previewMask',
      description: 'The enlarge `button` that covers the image while `preview` is set.',
    },
    {
      part: 'mask',
      description: 'The preview’s `role="dialog"` backdrop. `wj-image` sets its `aria-label`.',
    },
    { part: 'toolbar', description: 'The pill that holds the five actions.' },
    { part: 'rotateRightButton', description: 'The rotate right button.' },
    { part: 'rotateLeftButton', description: 'The rotate left button.' },
    { part: 'zoomOutButton', description: 'The zoom out button.' },
    { part: 'zoomInButton', description: 'The zoom in button.' },
    {
      part: 'closeButton',
      description: 'The Close button, which has focus when the preview opens.',
    },
    {
      part: 'original',
      description: 'The enlarged `img`. `wj-image` sets its `alt`.',
    },
  ],
  mapping: [
    {
      optimus: 'src',
      weeljack: 'src',
      status: 'kept',
      note: 'Required. A URL `string`, never a `SafeUrl`, only ever set as the `src` of an `img`.',
    },
    {
      optimus: 'alt',
      weeljack: 'alt',
      status: 'kept',
      note: 'Required. `""` marks the image decorative. It also names the preview dialog.',
    },
    {
      optimus: 'srcSet, sizes',
      weeljack: 'srcSet, sizes',
      status: 'kept',
      note: 'Responsive images. `srcSet` is a URL list `string`, only ever set as the `srcset` of the `img`.',
    },
    {
      optimus: 'width, height',
      weeljack: 'width, height',
      status: 'kept',
      note: 'A `string` of CSS pixels, as Optimus types them.',
    },
    {
      optimus: 'loading',
      weeljack: 'loading',
      status: 'kept',
      note: '`lazy` or `eager`.',
    },
    {
      optimus: 'preview',
      weeljack: 'preview',
      status: 'kept',
      note: 'Shows the enlarge button and the preview overlay.',
    },
    {
      optimus: 'previewImageSrc',
      weeljack: 'previewImageSrc',
      status: 'kept',
      note: 'A URL `string`. The preview shows `src` without it.',
    },
    { optimus: 'onShow', weeljack: 'opened', status: 'renamed', note: 'Emits once per open.' },
    { optimus: 'onHide', weeljack: 'closed', status: 'renamed', note: 'Emits once per close.' },
    { optimus: 'onImageError', weeljack: 'imageError', status: 'renamed', note: '`Event`.' },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjImagePt`. Tracks Optimus.',
    },
    dropped(
      'maskMotionOptions, motionOptions',
      'Set internally to `{ safe: true }`, so the preview skips its motion under reduced motion.',
    ),
    dropped('previewImageSrcSet, previewImageSizes', 'By need.'),
    dropped('appendTo', 'By need. The preview renders in place, inside the host.'),
    dropped(
      'modalEnterAnimation, modalLeaveAnimation',
      'By need. The motion stays Optimus’s, made safe.',
    ),
    dropped('showTransitionOptions, hideTransitionOptions', 'Deprecated since Optimus v21.'),
    dropped('imageClass, imageStyle, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped(
      'indicator, rotaterighticon, rotatelefticon, zoominicon, zoomouticon, closeicon templates',
      'Icon slots are not exposed.',
    ),
    dropped('image, preview templates', 'By need.'),
    dropped('p-image, ImageModule', 'Duplicates, by need, standalone.'),
  ],
};
