import { DividerBasicExample } from '../../../examples/divider/basic';
import { DividerContentExample } from '../../../examples/divider/content';
import { DividerVerticalExample } from '../../../examples/divider/vertical';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'divider',
  title: 'Divider',
  purpose: 'A line that separates content, horizontal or vertical, with optional text in it.',
  examples: [
    {
      title: 'Basic',
      description:
        'A horizontal divider is a 1 px line across the full width of its container, with 16 px above and below it. It is a block, so its width is yours. It needs no input to be useful.',
      sourceKey: 'divider/basic',
      component: DividerBasicExample,
    },
    {
      title: 'Content and alignment',
      description:
        'Whatever you put between the tags sits in the line, on `--wj-divider-content-background`, with 8 px of padding, and wraps rather than truncating. `align` places it: `left`, `center` or `right` on a horizontal divider (`top`, `center` or `bottom` on a vertical one). With `align` unset, the content renders centred: Optimus 2.0.2 gives such a divider a `p-divider-left` class but centres it with an inline style, and the inline style is what you see. `wj-divider` keeps this and does not fix it, so set `align` when you want a side. Text inside a divider is skipped by screen readers (see Accessibility). The content sits on a content-coloured box that masks the line, so it shows as a patch on any other surface: use it on a content surface (a card, a panel, a dialog), or set `--wj-divider-content-background` to the surface behind it.',
      sourceKey: 'divider/content',
      component: DividerContentExample,
    },
    {
      title: 'Vertical',
      description:
        'Set `orientation="vertical"` for a line between side-by-side items. The divider fills the height of the flex or grid row it sits in, so put it in a row that stretches its items (the default for `display: flex` and `display: grid`); outside one it has no height to fill. It has 16 px on either side.',
      sourceKey: 'divider/vertical',
      component: DividerVerticalExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjDividerHarness` from `weeljack-ng/divider/testing`. `getOrientation()` reads `aria-orientation` from the separator, as `horizontal` or `vertical`, and `getContentText()` reads the text in the line (empty when there is none). Nothing here names an Optimus class.',
      sourceKey: 'divider/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'None', effect: 'A divider is not focusable.' }],
  aria: [
    'Optimus gives the divider `role="separator"` and `aria-orientation`, and `wj-divider` keeps both. The divider is not focusable and takes no ARIA input, so an `aria-*` attribute you write on its host applies as written and logs no `WJ0003` warning.',
    'Gap, listed: the children of a `separator` are presentational in ARIA, so screen readers skip text inside a divider. Keep meaningful text outside it, and never make the divider the only label of a section. A divider that is purely decorative can be hidden with `aria-hidden="true"` on its host.',
    'No axe rule is tolerated on this page: the eight documented states (horizontal without content; horizontal with content at left, center and right; vertical without content; vertical with content at top, center and bottom) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'The line, its 16 px spacing and the 8 px content padding come from the `--wj-*` variables that `provideWeeljack` emits: `--wj-content-border-color` for the line and `--wj-divider-content-background` behind the content. The host is a block when horizontal and a flex box when vertical, so a vertical divider stretches to its row. `wj-divider` routes no attribute of its own, so everything you set in `pt` reaches the Optimus divider underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-divider`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The `p-divider` element: the line, with its spacing.' },
    {
      part: 'content',
      description: 'The box around the content you project, which masks the line behind it.',
    },
  ],
  mapping: [
    {
      optimus: 'layout',
      weeljack: 'orientation',
      status: 'renamed',
      note: '`horizontal` or `vertical`, default `horizontal`. One name for the concept across the library.',
    },
    {
      optimus: 'align',
      weeljack: 'align',
      status: 'kept',
      note: '`left`, `center`, `right` on a horizontal divider; `top`, `center`, `bottom` on a vertical one. Unset renders centred (Optimus 2.0.2 centres it inline though its class says left).',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjDividerPt`. Tracks Optimus.',
    },
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'Projected: text or an icon in the line.',
    },
    dropped(
      'type',
      'Exposed by need: the default look draws solid lines. Can return as an additive minor.',
    ),
    dropped('style, styleClass; dt, unstyled, ptOptions, DividerModule', droppedAlways),
  ],
};
