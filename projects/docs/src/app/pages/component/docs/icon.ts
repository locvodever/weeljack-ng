import { IconBasicExample } from '../../../examples/icon/basic';
import { IconCustomExample } from '../../../examples/icon/custom';
import { IconGalleryExample } from '../../../examples/icon/gallery';
import { IconInAButtonExample } from '../../../examples/icon/in-a-button';
import { IconLabelledExample } from '../../../examples/icon/labelled';
import { IconOnlyButtonExample } from '../../../examples/icon/icon-only-button';
import { IconSpinExample } from '../../../examples/icon/spin';
import type { ComponentDoc } from '../component-doc';

export const DOC: ComponentDoc = {
  entry: 'icon',
  title: 'Icon',
  purpose:
    "An inline SVG icon that takes the text's size and colour, from WeeljackNg's set of 80 or your own.",
  examples: [
    {
      title: 'Basic',
      description:
        'Import `WjIcon` and an icon constant, and bind the constant to `icon`. The icon is `1em` square and `currentColor`, so it follows the `font-size` and `color` of the text it sits in: the last two lines change them.',
      sourceKey: 'icon/basic',
      component: IconBasicExample,
    },
    {
      title: 'In a button',
      description:
        'Project a `wj-icon` into a `wj-button` and it renders before the label. The icon is decorative, and the button keeps its name from the label.',
      sourceKey: 'icon/in-a-button',
      component: IconInAButtonExample,
    },
    {
      title: 'Icon-only button',
      description:
        'A button with only an icon needs `ariaLabel` on the button. Leave the icon decorative, so the name is read once.',
      sourceKey: 'icon/icon-only-button',
      component: IconOnlyButtonExample,
    },
    {
      title: 'Labelled icon',
      description:
        'An icon that carries meaning on its own sets `label`, which gives the svg `role="img"` and that name. The text next to it does not repeat the word.',
      sourceKey: 'icon/labelled',
      component: IconLabelledExample,
    },
    {
      title: 'Spin',
      description:
        '`spin` turns the icon once a second, as a loading indicator. It stands still under reduced motion, so the text beside it, in a `role="status"` element, carries the state.',
      sourceKey: 'icon/spin',
      component: IconSpinExample,
    },
    {
      title: 'Your own icon',
      description:
        'Describe an icon with `wjIconDef(name, viewBox, nodes)`: a list of `[tag, attributes]` nodes over `path`, `circle`, `ellipse`, `rect`, `line`, `polyline` and `polygon`. The first icon takes the stroke the svg sets; the second paints its nodes with `fill` and `stroke: "none"`, which is how a filled icon is written.',
      sourceKey: 'icon/custom',
      component: IconCustomExample,
    },
    {
      title: 'The set',
      description:
        'All 80 icons. Search by name, then choose one to copy its import line. Names follow Lucide 1.77.0: `trash` (was trash-2), `circle-exclamation-point` (circle-alert), `triangle-exclamation-point` (triangle-alert), `circle-question-mark` (circle-help), `house`, `funnel`, `ellipsis`, `ellipsis-vertical`.',
      sourceKey: 'icon/gallery',
      component: IconGalleryExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjIconHarness` from `weeljack-ng/icon/testing` to find an icon by name and read its label.',
      sourceKey: 'icon/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'None',
      effect: 'An icon is never focusable; a button around it is what takes focus.',
    },
  ],
  aria: [
    'An icon is decorative by default (`aria-hidden="true"`): use it beside text that already says the same thing.',
    'Set `label` only when the icon carries meaning on its own (a status icon with no text). The svg then gets `role="img"` and that name.',
    'An icon-only `wj-button` sets `ariaLabel` on the button and leaves the icon decorative, so the name is read once.',
    'The colour is `currentColor`, so an icon has the contrast of its text. A meaningful icon on its own needs 3:1 against its background (WCAG 1.4.11), which the theme’s text colours meet.',
    '`spin` stops under reduced motion. A spinning icon is not a status message, so pair a loading state with text or `aria-busy`, as the `loading` state of `wj-button` does.',
  ],
  stylingIntro:
    'Size the icon with `font-size` on it or on its parent, and colour it with `color`. It sits on the text baseline. There are no `--wj-*` variables and no `pt`: `wj-icon` is WeeljackNg’s own component. The set’s drawings are adapted from Lucide, an independent open-source icon project (ISC licence, with portions from Feather under MIT); WeeljackNg is not affiliated with it. The licence text ships in `THIRD-PARTY-NOTICES.md`.',
  parts: [],
  mapping: [],
};
