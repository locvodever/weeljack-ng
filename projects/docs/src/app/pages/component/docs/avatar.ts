import { AvatarImageExample } from '../../../examples/avatar/image';
import { AvatarLabelExample } from '../../../examples/avatar/label';
import { AvatarProjectedIconExample } from '../../../examples/avatar/projected-icon';
import { AvatarShapesExample } from '../../../examples/avatar/shapes';
import { AvatarSizesExample } from '../../../examples/avatar/sizes';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'avatar',
  title: 'Avatar',
  purpose: 'A person or thing shown as initials, a photo or your own icon.',
  examples: [
    {
      title: 'Label',
      description:
        'Initials: one or two letters, which Optimus renders as text. Each avatar here stands alone, so each is named with the full name.',
      sourceKey: 'avatar/label',
      component: AvatarLabelExample,
    },
    {
      title: 'Image',
      description:
        'The first avatar stands alone, so it is named; it binds only `image` and switches to `label` when `(imageError)` fires, because Optimus shows the label in preference to the image and an avatar never binds both. The second sits beside its person’s visible name, so it is decorative and takes no name.',
      sourceKey: 'avatar/image',
      component: AvatarImageExample,
    },
    {
      title: 'Sizes',
      description:
        'Unset is 32 px. `large` is 48 px and `xlarge` is 64 px. The initials grow with the box.',
      sourceKey: 'avatar/sizes',
      component: AvatarSizesExample,
    },
    {
      title: 'Shapes',
      description:
        'A rounded `square` is the default, taking the preset’s content radius. A `circle` crops the photo to the disc. A photo fills its box and is cropped, never stretched.',
      sourceKey: 'avatar/shapes',
      component: AvatarShapesExample,
    },
    {
      title: 'Projected icon',
      description:
        'Content you project renders in the centre. Project a `wj-icon`: it is `1em`, in `currentColor` and decorative by default, so it follows the avatar’s colour and size.',
      sourceKey: 'avatar/projected-icon',
      component: AvatarProjectedIconExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjAvatarHarness` from `weeljack-ng/avatar/testing` to find an avatar by its label and read what a user meets: the initials, the photo’s URL, whether it is named and by what, its size and its shape.',
      sourceKey: 'avatar/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'Tab', effect: 'The avatar is not a Tab stop.' }],
  aria: [
    'An avatar beside its person’s visible name is decorative. An avatar standing alone sets `ariaLabel`, or `ariaLabelledBy` pointing at the name.',
    'A named avatar is one `role="img"` with that name, and its children are presentational. An unnamed avatar has no role: initials stay readable text.',
    'The photo’s `img` always has an empty `alt`, so it is never announced by its URL and never fails the `image-alt` check. Optimus 2.0.2 renders it with no `alt`; `wj-avatar` sets one through `pt`, and a `pt` of your own cannot take it off.',
    'Optimus puts `aria-label` and `aria-labelledby` on a generic element that has no role. `wj-avatar` adds `role="img"` there through `pt` when the avatar is named, so the name is announced.',
    'Initials are one or two letters. Name an avatar that stands alone, and bind `image` only, falling back to `label` on `(imageError)`.',
    'An `aria-*` attribute on `wj-avatar` is not forwarded and raises `WJ0003` in development: use the inputs instead.',
    'Initials meet 4.5:1 contrast on the avatar fill in the light and dark schemes.',
    'The keyboard and screen-reader pass (NVDA with Chrome) is recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, the display of the Optimus avatar, and adds no padding, border or background: the Optimus root is the only painted box. An image avatar keeps the avatar fill behind its photo, so a loading or failed photo shows an empty box instead of nothing. For anything else, `pt` reaches the parts of the Optimus avatar underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-avatar`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. A `role` on `root` and an `alt` on `image` are set by `wj-avatar` and win over the same attribute in your `pt`; every other key you pass is kept.',
  parts: [
    {
      part: 'root',
      description:
        'The Optimus `p-avatar` element, which is also the painted box. `wj-avatar` sets its `role` when the avatar is named.',
    },
    { part: 'label', description: 'The `span` that holds the initials.' },
    {
      part: 'image',
      description: 'The photo’s `img`. `wj-avatar` sets its `alt` to an empty string.',
    },
  ],
  mapping: [
    {
      optimus: 'label',
      weeljack: 'label',
      status: 'kept',
      note: 'Visible text (initials), rendered as text. Optimus shows it in preference to `image`.',
    },
    {
      optimus: 'image',
      weeljack: 'image',
      status: 'kept',
      note: 'A URL `string`, only ever set as the `src` of the photo’s `img`.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`large` or `xlarge`. Unset is Optimus’s `normal`.',
    },
    {
      optimus: 'shape',
      weeljack: 'shape',
      status: 'kept',
      note: '`square` (the default) or `circle`.',
    },
    {
      optimus: 'ariaLabel',
      weeljack: 'ariaLabel',
      status: 'kept',
      note: 'Names the avatar, which then reads as one image.',
    },
    {
      optimus: 'ariaLabelledBy',
      weeljack: 'ariaLabelledBy',
      status: 'kept',
      note: 'The same, by id.',
    },
    { optimus: 'onImageError', weeljack: 'imageError', status: 'renamed', note: '`Event`.' },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjAvatarPt`. Tracks Optimus.',
    },
    {
      optimus: 'Projected content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Project a `wj-icon`: it renders before the label or image.',
    },
    dropped('icon', 'An icon class string. Icon slots are not exposed: project your own icon.'),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-avatar, AvatarModule', 'Duplicates, by need, standalone.'),
  ],
};
