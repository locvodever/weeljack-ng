import { TabsBasicExample } from '../../../examples/tabs/basic';
import { TabsDisabledExample } from '../../../examples/tabs/disabled';
import { TabsLabelledExample } from '../../../examples/tabs/labelled';
import { TabsScrollableExample } from '../../../examples/tabs/scrollable';
import { TabsSelectOnFocusExample } from '../../../examples/tabs/select-on-focus';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'tabs',
  title: 'Tabs',
  purpose: 'One panel at a time, picked from a row of tabs.',
  examples: [
    {
      title: 'Basic',
      description:
        'Declare a `wj-tablist` of `wj-tab` children and a `wj-tabpanels` of `wj-tabpanel` children inside `wj-tabs`, and import all five classes (`WjTabs`, `WjTabList`, `WjTab`, `WjTabPanels`, `WjTabPanel`). A tab and its panel share a `value`, and `value` on `wj-tabs` is the active one, so Overview is active at rest here. Name every tab list: `ariaLabel` here, or `ariaLabelledBy` (below). Every `value` is unique within its tabs: ids and ARIA references are built from it.',
      sourceKey: 'tabs/basic',
      component: TabsBasicExample,
    },
    {
      title: 'Disabled tab',
      description:
        'A disabled tab cannot be activated, takes no focus and is skipped by the arrow keys, Home and End. It is dimmed, and it is not in the Tab order.',
      sourceKey: 'tabs/disabled',
      component: TabsDisabledExample,
    },
    {
      title: 'Scrollable (many tabs)',
      description:
        'Tabs never wrap or shrink: when they are wider than the row, the row scrolls and a Previous and a Next button appear at its ends, named from the translation. There is nothing to turn on. Keep `value` on a tab that exists.',
      sourceKey: 'tabs/scrollable',
      component: TabsScrollableExample,
    },
    {
      title: 'Select on focus',
      description:
        'With `selectOnFocus`, focusing a tab activates it, so the arrow keys switch panels as they move. Use it only when a panel shows instantly: nothing is fetched on activation.',
      sourceKey: 'tabs/select-on-focus',
      component: TabsSelectOnFocusExample,
    },
    {
      title: 'Labelled tab list',
      description:
        'When a visible caption already names the tabs, point `ariaLabelledBy` at its `id` instead of repeating the text in `ariaLabel`. Both are set on the `role="tablist"` element.',
      sourceKey: 'tabs/labelled',
      component: TabsLabelledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTabsHarness` and `WjTabHarness` from `weeljack-ng/tabs/testing`. The tabs harness lists the tabs with `getTabs()`, optionally only those whose `label` matches, and reads `getTabLabels()`, `getSelectedTab()`, `getSelectedPanelText()` and the tab list’s name with `getTabListAriaLabel()` and `getTabListAriaLabelledBy()`. A tab harness reads `getLabel()`, `isSelected()` and `isDisabled()`, and drives the tab with `select()` (a click) and `focus()`; `isFocused()` says whether it has focus. A tab is found through the tabs the app drew. Nothing here names an Optimus class.',
      sourceKey: 'tabs/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect:
        'Moves into the tab list, where focus lands on the active tab (the other tabs are not Tab stops). Tab again leaves the tab list for the active panel, which is a Tab stop, and then for any control inside it.',
    },
    {
      key: 'Arrow Right, Arrow Left',
      effect:
        'Moves focus to the next or the previous tab, wrapping from the last to the first and back, and skipping disabled tabs. The tab is not activated unless `selectOnFocus` is set.',
    },
    {
      key: 'Home, End',
      effect: 'Moves focus to the first or the last tab, skipping a disabled one.',
    },
    {
      key: 'Enter, Space',
      effect: 'Activates the focused tab and shows its panel. Each press activates once.',
    },
    {
      key: 'Page Up, Page Down',
      effect:
        'Not part of the APG tabs pattern. Scrolls the row to its first or its last tab without moving focus.',
    },
  ],
  aria: [
    'The row is a `role="tablist"`, each tab a `role="tab"` with `aria-selected`, `aria-controls` and `aria-disabled`, and each panel a `role="tabpanel"` named by its tab with `aria-labelledby`, and `hidden` while inactive (all Optimus). A tab is named by its own text, so none of the five components takes an ARIA input on a tab or a panel.',
    'Name every tab list. `wj-tablist` takes `ariaLabel` and `ariaLabelledBy` and sets them on the `role="tablist"` element, which Optimus leaves unnamed; an input wins over a consumer `pt` name of the same kind on that element, and a name whose input is not set keeps its `pt` value.',
    'Setting an `aria-*` attribute on the `wj-tabs`, `wj-tablist`, `wj-tab`, `wj-tabpanels` or `wj-tabpanel` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'The Previous and Next buttons are Tab stops named from the translation (`aria.previous` and `aria.next`, “Previous” and “Next” in English), so a translated app gets translated names. They appear whenever the tabs overflow, and not otherwise.',
    'A tab’s content is text and decorative icons (give an icon `aria-hidden="true"`) only. A tab never wraps or truncates: use one or two words, and at most about six tabs that fit at the width of the page. More than that is the scrollable case.',
    'Only `wj-tablist` and `wj-tabpanels` children render. Anything else you write directly inside `wj-tabs`, a `wj-tab` outside a tab list and a `wj-tabpanel` outside the panels are dropped.',
    'The `value` of every tab and panel is unique within one `wj-tabs`: Optimus builds the ids that the tab and the panel point at from it, so two equal values share ids. `value` is required, and it must stay on an existing tab: with no active tab every tab is out of the Tab order, so the row cannot be reached by keyboard, and no panel shows.',
    'Use `selectOnFocus` only for panels that show instantly. With it, the APG automatic-activation pattern applies; without it, activation is manual, with Enter or Space.',
    'Gap, fixed: Optimus leaves the tab list unnamed. `wj-tablist` routes `ariaLabel` and `ariaLabelledBy` to it.',
    'Gap, fixed: Optimus gives a panel no `tabindex`. Every panel carries `tabindex="0"` (a hidden panel is not focusable), so a panel whose first content is not focusable is in the Tab sequence, as APG advises.',
    'Gap, listed: `p-tab` stops the propagation of every `keydown` it receives, so a key listener you put on an element above a tab never sees the keys pressed on that tab. Follow the `value` model for what the keys change.',
    'Motion: the bar under the active tab slides, and the row scrolls smoothly. Under `prefers-reduced-motion: reduce` the bar moves at once and the row scrolls without gliding.',
    'No axe rule is tolerated on this page: the four documented states (first tab active, a disabled tab, many tabs with both scroll buttons showing, a labelled tab list) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, the rule under the row and the active bar come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, so its width is yours. A part renders nothing itself: a part’s host is hidden and takes no `class` or `style`, so style the row, a tab, the panels and a panel through each part’s own `pt`. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-tabs`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'wj-tabs · root', description: 'The `p-tabs` element, the row and the panels.' },
    {
      part: 'wj-tablist · root',
      description: 'The `p-tablist` element, the row with its buttons.',
    },
    {
      part: 'wj-tablist · content',
      description: 'The viewport that scrolls when the tabs overflow.',
    },
    {
      part: 'wj-tablist · tabList',
      description: 'The `role="tablist"` element that holds the tabs.',
    },
    { part: 'wj-tablist · activeBar', description: 'The bar under the active tab.' },
    { part: 'wj-tablist · prevButton', description: 'The Previous scroll button.' },
    { part: 'wj-tablist · nextButton', description: 'The Next scroll button.' },
    { part: 'wj-tab · root', description: 'One tab, a `role="tab"` element.' },
    { part: 'wj-tabpanels · root', description: 'The box that holds the panels.' },
    { part: 'wj-tabpanel · root', description: 'One panel, a `role="tabpanel"` element.' },
  ],
  mapping: [
    {
      optimus: '`p-tabs` value',
      weeljack: '`wj-tabs` value',
      status: 'kept',
      note: 'Required, and a two-way model: with no active tab Optimus gives every tab `tabindex="-1"`, so the tab list could not be reached by keyboard.',
    },
    dropped(
      'scrollable',
      'In Optimus 2.0.2 it only adds a class that no WeeljackNg preset styles, and the scroll buttons follow overflow whatever it says. Removed before `0.1.0` (gap-fill D2).',
    ),
    {
      optimus: 'selectOnFocus',
      weeljack: 'selectOnFocus',
      status: 'kept',
      note: 'Accepts a bare attribute. APG’s automatic activation.',
    },
    dropped(
      '`lazy` (tabs and tabpanel)',
      'Panel content is projected, and Angular creates projected content whatever Optimus renders, so there is no lazy first cut.',
    ),
    dropped(
      'showNavigators',
      'Not exposed: WeeljackNg exposes by need, and Optimus’s default (shown) applies.',
    ),
    dropped('tabindex', 'Not exposed: the focus order is the roving tabindex.'),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjTabsPt`. Tracks Optimus.',
    },
    dropped('styleClass; dt, unstyled, ptOptions', droppedAlways),
    {
      optimus: '`p-tablist` pt',
      weeljack: '`wj-tablist` pt',
      status: 'kept',
      note: 'Typed `WjTabListPt`. Tracks Optimus.',
    },
    {
      optimus: 'None',
      weeljack: '`wj-tablist` ariaLabel, ariaLabelledBy',
      status: 'added',
      note: 'Set on the `role="tablist"` element, which Optimus leaves unnamed (APG asks for a named tab list).',
    },
    dropped('`p-tablist` #previcon, #nexticon', 'Icon slots: icons are not exposed.'),
    {
      optimus: '`p-tab` value, disabled, pt',
      weeljack: '`wj-tab` value, disabled, pt',
      status: 'kept',
      note: '`value` is required and unique. `disabled` accepts a bare attribute. The tab’s content is the projected label. `pt` is typed `WjTabPt`.',
    },
    {
      optimus: '`p-tabpanels` pt',
      weeljack: '`wj-tabpanels` pt',
      status: 'kept',
      note: 'Typed `WjTabPanelsPt`. Tracks Optimus.',
    },
    {
      optimus: '`p-tabpanel` value, pt',
      weeljack: '`wj-tabpanel` value, pt',
      status: 'kept',
      note: '`value` is required and unique. `pt` is typed `WjTabPanelPt`.',
    },
    {
      optimus: '`p-tabpanel` #content',
      weeljack: '`wj-tabpanel` content',
      status: 'renamed',
      note: 'The panel’s projected content.',
    },
    dropped(
      'TabsModule; updateValue and the other public methods',
      'No NgModule, and the state is the `value` model.',
    ),
  ],
};
