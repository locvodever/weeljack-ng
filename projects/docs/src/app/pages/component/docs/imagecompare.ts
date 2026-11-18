import { ImageCompareBasicExample } from '../../../examples/imagecompare/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'imagecompare',
  title: 'Image compare',
  purpose:
    'Two images of the same shape with a slider between them, such as a before and an after.',
  examples: [
    {
      title: 'Basic',
      description:
        'Give both images as slots, each in an `ng-template`: `wjImageCompareLeft` fills the box and `wjImageCompareRight` is painted over it from the start edge to the handle, so the right image is the one on the left of the handle. The arrow, Page, Home and End keys move the handle. Each image carries its own `alt`, and `ariaLabel` names the slider.',
      sourceKey: 'imagecompare/basic',
      component: ImageCompareBasicExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjImageCompareHarness` from `weeljack-ng/imagecompare/testing` to find a comparison by the slider’s name, read where the divider is (0 to 100), move it, focus the slider and read its ARIA attributes.',
      sourceKey: 'imagecompare/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab', effect: 'Moves to the slider, the only Tab stop of the component.' },
    { key: 'ArrowLeft or ArrowDown', effect: 'Moves the divider 1 towards the start.' },
    { key: 'ArrowRight or ArrowUp', effect: 'Moves the divider 1 towards the end.' },
    { key: 'PageDown or PageUp', effect: 'Moves the divider 10 towards the start or the end.' },
    { key: 'Home or End', effect: 'Moves the divider to 0 or to 100.' },
  ],
  aria: [
    '`ariaLabel` is required and names the slider. It lands on the `<input type="range">`, the one focusable element, with `ariaLabelledBy` and `ariaDescribedBy`. A missing `ariaLabel` is a compile error under `strictTemplates`.',
    'Optimus 2.0.2 puts its own `aria-label`, `aria-labelledby` and `tabindex` on a host that cannot take focus, and leaves the range input unnamed. `wj-imagecompare` never passes them: the host carries no ARIA and no Tab stop, and the range input is the single stop.',
    'The two slot images carry their own `alt`: describe what each shows, or use `alt=""` when the slider’s name says it all. Give both images the same 16:9 shape and `object-fit: cover`.',
    'The slider reports its position as a number from 0 to 100, which a screen reader reads as a percentage.',
    'The handle grows from 24 px to 30 px on hover and on keyboard focus, so focus shows as a size change on any photo. The ring around the handle is the preset’s focus ring; a spec cannot read a thumb pseudo-element’s style, so this is a manual check.',
    'Give both slots when the component renders. A slot template inside an `@if` that is false at that moment, or without its directive imported, leaves a required slot missing and raises an error; the template of a slot can bind to anything and follows changes.',
    'Each slot template must render one root element: Optimus clips the last element of the right slot.',
    'An `aria-*` attribute on `wj-imagecompare` is not forwarded and raises `WJ0003` in development: use `ariaLabel` instead.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host and the Optimus element are `block`, with no padding, border or background of their own: Optimus’s element is inline, so its 16:9 box never formed until the wrapper made it a block. The box is the host’s full width and 16:9, the left image fills it and the right image is clipped from the start edge to the handle. There is no divider line, and at 0 and 100 the handle sits half outside the box. The handle is a two-tone 24 px disc, set through Optimus’s `--wj-imagecompare-handle-*` variables on the host: a fill of `--wj-content-background` and a 2 px ring of `--wj-primary-color`, so one of the two tones clears 3:1 against a photo in either scheme. It grows to Optimus’s 30 px on hover and on keyboard focus, and its focus ring takes `--wj-focus-ring-color`. The growth runs over Optimus’s own transition, which `prefers-reduced-motion` switches off. For anything else, `pt` reaches the parts of the Optimus component underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-imagecompare`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. The slider’s `aria-label`, `aria-labelledby` and `aria-describedby` are set by `wj-imagecompare` and win over the same attributes in your `pt`; every other key you pass is kept.',
  parts: [
    {
      part: 'root',
      description: 'The Optimus `p-imagecompare` element: the 16:9 box that holds the images.',
    },
    {
      part: 'slider',
      description:
        'The `input` of type `range` over the whole box. `wj-imagecompare` sets its `aria-label`, `aria-labelledby` and `aria-describedby`.',
    },
  ],
  mapping: [
    {
      optimus: 'ariaLabel',
      weeljack: 'ariaLabel',
      status: 'kept',
      note: 'Required. Lands on the range input, not the host.',
    },
    {
      optimus: 'ariaLabelledby',
      weeljack: 'ariaLabelledBy',
      status: 'renamed',
      note: 'The `aria-labelledby` spelling of every wrapper. Lands on the range input.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Lands on the range input.',
    },
    {
      optimus: 'left template',
      weeljack: 'wjImageCompareLeft slot',
      status: 'renamed',
      note: '`WjImageCompareLeftSlot`, on an `ng-template`. Required, with no context.',
    },
    {
      optimus: 'right template',
      weeljack: 'wjImageCompareRight slot',
      status: 'renamed',
      note: '`WjImageCompareRightSlot`, on an `ng-template`. Required, with no context.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjImageComparePt`. Tracks Optimus.',
    },
    dropped('tabindex', 'The range input is natively focusable.'),
    dropped('p-imageCompare, p-image-compare, dt, unstyled, ptOptions', droppedAlways),
  ],
};
