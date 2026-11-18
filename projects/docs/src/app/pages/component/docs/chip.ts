import { ChipBasicExample } from '../../../examples/chip/basic';
import { ChipDisabledExample } from '../../../examples/chip/disabled';
import { ChipRemovableExample } from '../../../examples/chip/removable';
import { ChipWithImageExample } from '../../../examples/chip/with-image';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'chip',
  title: 'Chip',
  purpose:
    'A compact label with an optional photo and an optional remove button, for a filter, a tag or a person.',
  examples: [
    {
      title: 'Basic',
      description:
        'A chip shows its `label` as text. It is display only until it is `removable`: it takes no focus and adds no Tab stop.',
      sourceKey: 'chip/basic',
      component: ChipBasicExample,
    },
    {
      title: 'With image',
      description:
        'A photo fills a 32 px circle at the start of the chip, cropped and never stretched. Its `alt` is empty by default, because the label names the chip. Bind `alt` only when the photo says something the label does not.',
      sourceKey: 'chip/with-image',
      component: ChipWithImageExample,
    },
    {
      title: 'Removable',
      description:
        'A `removable` chip has a remove button and emits `(removed)` once per click, Enter, Space or Backspace. The chip never hides itself: this list drops the chip in `(removed)`, then moves focus to the next chip’s remove button, else the previous one’s, else the button that brings the chips back. The status line reports each removal.',
      sourceKey: 'chip/removable',
      component: ChipRemovableExample,
    },
    {
      title: 'Disabled',
      description:
        '`disabled` disables the remove button: it leaves the Tab order, emits nothing, and its glyph fades. The chip’s body does not change.',
      sourceKey: 'chip/disabled',
      component: ChipDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjChipHarness` from `weeljack-ng/chip/testing` to find a chip by its label and read what a user meets: the label, the photo’s URL and `alt`, whether it is removable or disabled. `remove()` clicks the remove button and `focusRemoveButton()` moves focus to it.',
      sourceKey: 'chip/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab', effect: 'Moves focus to the remove button of a removable chip.' },
    { key: 'Enter', effect: 'Removes the chip: `(removed)` emits once.' },
    { key: 'Space', effect: 'Removes the chip: `(removed)` emits once.' },
    { key: 'Backspace', effect: 'Removes the chip: `(removed)` emits once.' },
    { key: 'Disabled', effect: 'A disabled remove button is not in the Tab order.' },
  ],
  aria: [
    'The remove button is a native `<button type="button">`, named by the translation’s `aria.removeLabel` ("Remove" in English) and described by the chip’s label, so a screen reader hears "Remove, button, In stock". It is the chip’s only Tab stop and the only remove control.',
    'Optimus 2.0.2 draws its remove control as an `svg` with `role="button"` and `tabindex="0"`, which answers only Enter and Backspace. `wj-chip` replaces it: it renders its own button inside Optimus’s `removeicon` template, and removes the role, `tabindex` and `aria-label` from the Optimus element around it through `pt`, so no `role="button"` is left and there is no second Tab stop.',
    'Optimus’s remove handler hides the chip itself. `wj-chip` stops the button’s click and its Enter and Backspace keys from reaching it, so the chip stays until your app drops it in `(removed)`. Move focus yourself, as the Removable example does, or a keyboard user is dropped back to the top of the page.',
    'The photo is decorative by default (`alt` is empty), because the label names the chip. A chip with only an image and no label has no name: always give a label.',
    'Optimus puts the label on the chip root as an `aria-label`. That element has no role, so it adds nothing and fails no axe rule; the label text itself is what a screen reader reads.',
    'The remove button’s hit box is 24 × 24 px around the 16 px glyph. The glyph stays at Optimus’s size and place, and the chip keeps its size.',
    'An `aria-*` attribute on `wj-chip` is not forwarded and raises `WJ0003` in development: the chip is named by its label.',
    'The keyboard and screen-reader pass (NVDA with Chrome) is recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `inline-flex`, the display of the Optimus chip, and adds no padding, border or background: the Optimus root is the only painted box. The remove button is transparent and borderless, with no hover fill; its focus ring is the preset’s single 2 px ring around the 24 px box. For anything else, `pt` reaches the parts of the Optimus chip underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-chip`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. An `id` on `label` is set by `wj-chip` and wins over the same attribute in your `pt`; the `role`, `tabindex` and `aria-label` of `removeIcon` are cleared by `wj-chip`, and a `pt` of your own that sets them again undoes the fix.',
  parts: [
    { part: 'root', description: 'The Optimus `p-chip` element, which is also the painted box.' },
    { part: 'image', description: 'The photo’s `img`.' },
    {
      part: 'label',
      description:
        'The `div` that holds the label. `wj-chip` sets its `id`, which the remove button is described by.',
    },
    {
      part: 'removeIcon',
      description:
        'The Optimus `span` around the remove button. `wj-chip` clears its `role`, `tabindex` and `aria-label`; the button inside is `wj-chip`’s own.',
    },
  ],
  mapping: [
    { optimus: 'label', weeljack: 'label', status: 'kept', note: 'Text, rendered as text.' },
    {
      optimus: 'image',
      weeljack: 'image',
      status: 'kept',
      note: 'A URL `string`, only ever set as the `src` of the photo’s `img`.',
    },
    {
      optimus: 'alt',
      weeljack: 'alt',
      status: 'kept',
      note: 'Defaults to an empty string: decorative, since the label names the chip.',
    },
    {
      optimus: 'disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'Disables the remove button.',
    },
    {
      optimus: 'removable',
      weeljack: 'removable',
      status: 'kept',
      note: 'Renders the wrapper’s own remove button.',
    },
    {
      optimus: 'onRemove',
      weeljack: 'removed',
      status: 'renamed',
      note: '`output<void>()`. The chip does not hide itself: drop it in `(removed)`.',
    },
    { optimus: 'onImageError', weeljack: 'imageError', status: 'renamed', note: '`Event`.' },
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: 'Typed `WjChipPt`. Tracks Optimus.' },
    {
      optimus: 'Default content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Projected before the label, as in Optimus.',
    },
    dropped('icon, removeIcon, removeicon template', 'Icon slots are not exposed (02 Q6).'),
    dropped('chipProps', 'Duplicates the inputs above (02 Q1).'),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('p-chip, ChipModule', 'Duplicates, by need, standalone.'),
  ],
};
