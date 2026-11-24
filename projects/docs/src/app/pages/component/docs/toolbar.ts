import { ToolbarLabelledExample } from '../../../examples/toolbar/labelled';
import { ToolbarSectionsExample } from '../../../examples/toolbar/sections';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'toolbar',
  title: 'Toolbar',
  purpose: 'A row of controls grouped at the start, centre and end.',
  examples: [
    {
      title: 'Start, center and end',
      description:
        'Three slots take an `ng-template`: `wjToolbarStart` packs at the inline start, `wjToolbarCenter` sits centred in the free space between its neighbours, and `wjToolbarEnd` sits at the inline end even when it is the only section. Content you put straight inside `wj-toolbar` comes first, before the sections. A section exists only while its slot is filled. Import the three slot classes: a template whose directive is not imported is silently dropped. `ariaLabel` names the toolbar. Narrow the window to see the sections wrap onto new rows; controls inside a section wrap too, so nothing overflows.',
      sourceKey: 'toolbar/sections',
      component: ToolbarSectionsExample,
    },
    {
      title: 'Labelled toolbar',
      description:
        'When a visible caption already names the toolbar, point `ariaLabelledBy` at its `id` instead of repeating the text in `ariaLabel`.',
      sourceKey: 'toolbar/labelled',
      component: ToolbarLabelledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjToolbarHarness` from `weeljack-ng/toolbar/testing`. `getStartText()`, `getCenterText()` and `getEndText()` read the text of each section, and answer `null` for a section the toolbar does not have. `getAriaLabel()` and `getAriaLabelledBy()` read the toolbar’s name attributes (`null` when unset). Nothing here names an Optimus class.',
      sourceKey: 'toolbar/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'The buttons and links of the toolbar are one Tab stop: Tab enters on the first, or on the one that had focus last, and the next Tab leaves the toolbar. A text input, a select or a nested `wj-selectbutton` keeps its own Tab stop.',
    },
    {
      key: 'Left Arrow, Right Arrow, Home, End',
      effect:
        'Move focus between the buttons and links, in order (default content first, then the start, center and end sections). The arrows wrap at the ends, Home goes to the first and End to the last, and a disabled button is skipped. Inside a text input the arrows move the caret, not focus.',
    },
  ],
  aria: [
    'The toolbar element has `role="toolbar"` (Optimus) and is named by `ariaLabel` or `ariaLabelledBy`, which are written on that same element. Name it whenever a page has more than one, as the APG Toolbar pattern says. Either input is optional, so a toolbar that is the only one on its page needs neither.',
    'Gap, fixed: Optimus has no `aria-label` input, only `ariaLabelledBy`. `wj-toolbar` adds `ariaLabel` and routes it onto the toolbar element through `pt`: it lands there, goes again when you unset it, and wins over an `aria-label` in your own `pt.root`.',
    'Gap, fixed: the toolbar is one Tab stop with Arrow Left, Arrow Right, Home and End, as the APG Toolbar pattern has it (`wj-toolbar` adds it; Optimus does not). Only the buttons and links join the row: a text input, a select and a nested `wj-selectbutton` keep their own Tab stop and arrow keys, so a toolbar that holds one is not a pure roving row. Keep a toolbar to about seven controls, and keep inputs to a minimum.',
    'Setting an `aria-*` attribute on the `wj-toolbar` host logs the dev-mode warning `WJ0003` and is not forwarded: use `ariaLabel` or `ariaLabelledBy`.',
    'Name an icon-only button you put in a section yourself.',
    'Render a toolbar only when it has controls: with no content and no slot it draws an empty bar about 26 px tall.',
    'Optimus’s toolbar has no motion, so there is nothing to reduce.',
    'No axe rule is tolerated on this page: the three documented states (three sections filled with buttons, labelled through `ariaLabel`, labelled through `ariaLabelledBy`) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, border and padding come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, so its width is yours. Optimus spreads a toolbar with `justify-content: space-between`, which would stretch a row of buttons across the bar and put a lone end section at the start; `wj-toolbar` packs from the inline start instead, centres the center section in the free space, and sends the end section to the inline end. Controls inside a section sit `--wj-toolbar-gap` apart (8 px) and wrap onto a new row, and the bar wraps whole sections the same way. The bar’s own gap lies between the center and the end only, so with no start section the center sits half a gap left of the middle of the free space. Where `wj-toolbar` routes its own attribute onto a part (`aria-label` on `root`), the routed value wins over the same attribute in your `pt`; every other key you set is kept. `pt` reaches the parts of the Optimus toolbar underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-toolbar`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The `p-toolbar` element: the bordered bar, `role="toolbar"`.' },
    { part: 'start', description: 'The start section, present only with a `wjToolbarStart` slot.' },
    {
      part: 'center',
      description: 'The center section, present only with a `wjToolbarCenter` slot.',
    },
    { part: 'end', description: 'The end section, present only with a `wjToolbarEnd` slot.' },
  ],
  mapping: [
    {
      optimus: 'ariaLabelledBy',
      weeljack: 'ariaLabelledBy',
      status: 'kept',
      note: 'Optimus’s own input, written on the `role="toolbar"` element.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel',
      status: 'added',
      note: 'Routed onto the toolbar element through `pt`: Optimus has no `aria-label` input. The APG Toolbar pattern names a toolbar when a page has more than one.',
    },
    {
      optimus: 'Default content',
      weeljack: 'Default content',
      status: 'kept',
      note: 'Projected before the sections.',
    },
    {
      optimus: '#start',
      weeljack: '`wjToolbarStart` slot',
      status: 'renamed',
      note: 'An `ng-template[wjToolbarStart]`, typed `WjToolbarStartSlot`. The section renders only when it is used.',
    },
    {
      optimus: '#center',
      weeljack: '`wjToolbarCenter` slot',
      status: 'renamed',
      note: 'An `ng-template[wjToolbarCenter]`, typed `WjToolbarCenterSlot`. The section renders only when it is used.',
    },
    {
      optimus: '#end',
      weeljack: '`wjToolbarEnd` slot',
      status: 'renamed',
      note: 'An `ng-template[wjToolbarEnd]`, typed `WjToolbarEndSlot`. The section renders only when it is used.',
    },
    dropped('#left, #right template names', 'Deprecated aliases of start and end.'),
    dropped('styleClass; dt, unstyled, ptOptions', droppedAlways),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjToolbarPt`. Tracks Optimus.',
    },
  ],
};
