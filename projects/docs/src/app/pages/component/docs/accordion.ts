import { AccordionBasicExample } from '../../../examples/accordion/basic';
import { AccordionControlledExample } from '../../../examples/accordion/controlled';
import { AccordionDisabledExample } from '../../../examples/accordion/disabled';
import { AccordionMultipleExample } from '../../../examples/accordion/multiple';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'accordion',
  title: 'Accordion',
  purpose: 'Panels whose content expands and collapses under a header.',
  examples: [
    {
      title: 'Basic',
      description:
        'Declare each panel as a `wj-accordion-panel` with a `wj-accordion-header` and a `wj-accordion-content` inside it, and import all four classes (`WjAccordion`, `WjAccordionPanel`, `WjAccordionHeader`, `WjAccordionContent`). One panel is open at a time. `value` holds the open panel’s value, so Shipping is open at rest here; a click on an open header closes it and `value` becomes `undefined`. Every panel needs a header, and every `value` is unique within its accordion: ids and ARIA references are built from it.',
      sourceKey: 'accordion/basic',
      component: AccordionBasicExample,
    },
    {
      title: 'Multiple',
      description:
        'With `multiple`, each panel opens and closes on its own and `value` is an array of the open panels’ values. Shipping and Returns are open at rest.',
      sourceKey: 'accordion/multiple',
      component: AccordionMultipleExample,
    },
    {
      title: 'Disabled panel',
      description:
        'A disabled panel cannot open, takes no focus and is skipped by the arrow keys. It is dimmed, and it is not in the Tab order.',
      sourceKey: 'accordion/disabled',
      component: AccordionDisabledExample,
    },
    {
      title: 'Controlled',
      description:
        'Bind `[(value)]` to open a panel from your own code. The `value` model reports every toggle, a click or a key press alike: the state line below follows both. Nothing is open at rest.',
      sourceKey: 'accordion/controlled',
      component: AccordionControlledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjAccordionHarness` and `WjAccordionPanelHarness` from `weeljack-ng/accordion/testing`. The accordion harness lists the panels with `getPanels()`, optionally only those whose `headerText` matches, and the open ones with `getExpandedPanels()`; `getHeaderTexts()` reads every header. A panel harness reads `getHeaderText()`, `getContentText()`, `isExpanded()` and `isDisabled()`, and drives the panel with `toggle()` (a click on the header) and `focus()`; `isFocused()` says whether the header has focus. A panel is found through the accordion the app drew, so `getContentText()` works on a collapsed panel too. Nothing here names an Optimus class.',
      sourceKey: 'accordion/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Enter, Space',
      effect: 'On a header: opens a closed panel and closes an open one. Each press toggles once.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves through the headers and through every focusable control inside an open panel. A disabled header and the content of a collapsed panel are skipped.',
    },
    {
      key: 'Arrow Down',
      effect:
        'Moves focus to the next header, skipping disabled ones. From the last header it wraps to the first.',
    },
    {
      key: 'Arrow Up',
      effect:
        'Moves focus to the previous header, skipping disabled ones. From the first header it wraps to the last.',
    },
    {
      key: 'Home, End',
      effect:
        'Moves focus to the first or the last header, skipping a disabled one. Neither opens or closes a panel.',
    },
  ],
  aria: [
    'Each header is a `role="button"` with `aria-expanded`, `aria-controls` and `aria-disabled`, and each content is a `role="region"` named by its header with `aria-labelledby` (all Optimus). None of the four components takes an ARIA input: a header is named by its own text.',
    'Setting an `aria-*` attribute on the `wj-accordion`, `wj-accordion-panel`, `wj-accordion-header` or `wj-accordion-content` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'A header’s content is text and decorative icons (give an icon `aria-hidden="true"`) only. The header is itself a `role="button"`, so a link or a button inside it cannot be reached. A long header wraps at spaces and is never truncated. A panel with no `wj-accordion-header` draws a toggle with no name, so give every panel one.',
    'Only `wj-accordion-panel` children render. Anything else you write directly inside `wj-accordion`, and a header or a content outside a panel, is dropped.',
    'The `value` of every panel is unique within one accordion: Optimus builds the ids that the header and the region point at from it, so two equal values share ids.',
    'The arrow keys are handled by both the accordion and each header in Optimus, and a spec proves that one key press moves focus exactly one header.',
    'Gap, listed: the header button is not wrapped in an element with `role="heading"` and an `aria-level`, as the APG accordion pattern asks. Wrapping it would put an element between the Optimus panel and its header, which Optimus’s own key handling walks, so it is left as Optimus draws it.',
    'Gap, listed: every panel is a `role="region"`. APG advises against regions once more than about six panels can be open at once, because they crowd the landmark list. With `multiple` and many panels, keep the number of panels small.',
    'Optimus 2.0.2 emits `onOpen` and `onClose` on a click only, and Enter and Space toggle without emitting them. `wj-accordion` therefore has no such outputs: the `value` model reports every toggle.',
    'Motion: expanding and collapsing are skipped under `prefers-reduced-motion: reduce`, and `pt.motion` cannot turn that off.',
    'No axe rule is tolerated on this page: the four documented states (all collapsed, one expanded, `multiple` with two expanded, one disabled panel) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, dividers and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own, so its width is yours. A part renders nothing itself: a part’s host is hidden and takes no `class` or `style`, so style the panel, the header and the content through each part’s own `pt`. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-accordion`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt.motion` is merged under the component’s own safe motion, so it cannot turn reduced motion off.',
  parts: [
    { part: 'wj-accordion · root', description: 'The `p-accordion` element, the stack of panels.' },
    { part: 'wj-accordion-panel · root', description: 'One panel: its header and content.' },
    { part: 'wj-accordion-header · root', description: 'The header, a `role="button"` row.' },
    {
      part: 'wj-accordion-header · toggleicon',
      description: 'The chevron at the end of the header.',
    },
    {
      part: 'wj-accordion-content · root',
      description: 'The `role="region"` of a panel’s content.',
    },
    {
      part: 'wj-accordion-content · contentWrapper',
      description: 'The element that collapses: it carries the height while the panel opens.',
    },
    { part: 'wj-accordion-content · content', description: 'The padded box around the content.' },
  ],
  mapping: [
    {
      optimus: '`p-accordion` value',
      weeljack: '`wj-accordion` value',
      status: 'kept',
      note: 'One panel’s value, or an array with `multiple`. A two-way model; Optimus’s `null` arrives as `undefined`.',
    },
    {
      optimus: 'multiple',
      weeljack: 'multiple',
      status: 'kept',
      note: 'Accepts a bare attribute.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjAccordionPt`. Tracks Optimus.',
    },
    dropped(
      'onOpen, onClose',
      'Optimus 2.0.2 emits them on a click only: Enter and Space toggle without them. The `value` model reports every toggle.',
    ),
    dropped(
      'selectOnFocus',
      'Not exposed: WeeljackNg exposes by need, and the APG accordion has no selection that follows focus.',
    ),
    dropped('expandIcon, collapseIcon', 'Icon classes: icons are not exposed.'),
    dropped('motionOptions', 'Bound to `{ safe: true }`, so motion respects reduced motion.'),
    dropped('transitionOptions', 'Deprecated alias.'),
    dropped('styleClass; dt, unstyled, ptOptions', droppedAlways),
    {
      optimus: '`p-accordion-panel` value',
      weeljack: '`wj-accordion-panel` value',
      status: 'kept',
      note: 'Required: ids derive from it, so it must be unique within the accordion.',
    },
    {
      optimus: '`p-accordion-panel` disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'Accepts a bare attribute.',
    },
    {
      optimus: '`p-accordion-panel` pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjAccordionPanelPt`. Tracks Optimus.',
    },
    {
      optimus: '`p-accordion-header` content',
      weeljack: '`wj-accordion-header` content',
      status: 'kept',
      note: 'Projected. Text and decorative icons only: it sits inside a `role="button"`.',
    },
    {
      optimus: '`p-accordion-header` pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjAccordionHeaderPt`. Tracks Optimus.',
    },
    dropped('`p-accordion-header` #toggleicon', 'Icon slot: icons are not exposed.'),
    {
      optimus: '`p-accordion-content` content, pt',
      weeljack: '`wj-accordion-content` content, pt',
      status: 'kept',
      note: 'Typed `WjAccordionContentPt`. Tracks Optimus.',
    },
    dropped(
      'p-accordionpanel, p-accordionheader, p-accordioncontent',
      'Duplicate selectors of the parts above.',
    ),
    dropped(
      'AccordionModule; updateValue, onKeydown and the other public methods',
      'No NgModule, and the state is the `value` model.',
    ),
  ],
};
