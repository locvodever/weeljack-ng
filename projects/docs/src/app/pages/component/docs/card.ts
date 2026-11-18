import { CardBasicExample } from '../../../examples/card/basic';
import { CardHeaderFooterExample } from '../../../examples/card/header-footer';
import { CardTitleSlotExample } from '../../../examples/card/title-slot';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'card',
  title: 'Card',
  purpose:
    'A container for one subject: an optional header area, a title and subtitle, your content, and a footer for actions.',
  examples: [
    {
      title: 'Basic',
      description:
        'A card is a bordered box. `header` and `subheader` are the title and the subtitle, rendered as text, and the content you put between the tags sits under them. A part is drawn only when it has text or a slot: a card with neither renders no title or subtitle.',
      sourceKey: 'card/basic',
      component: CardBasicExample,
    },
    {
      title: 'Header and footer',
      description:
        'Two slots take an `ng-template`. `wjCardHeader` fills the region above the body, with no padding, so a picture runs to the edges and follows the card’s rounded top corners; it is meant for media. `wjCardFooter` is a row of actions under the content: its items sit 8 px apart and wrap onto new lines on a narrow card. Import the slot classes: a template whose directive is not imported is silently dropped. A part exists only while its slot is filled, and a slot can appear or go after the card is created.',
      sourceKey: 'card/header-footer',
      component: CardHeaderFooterExample,
    },
    {
      title: 'Title slot',
      description:
        'The title part is a `div`, not a heading, and no level fits every page. Put the heading your page needs in `wjCardTitle`: a heading placed directly in it keeps the title’s size and weight and loses its margins. `wjCardSubtitle` does the same for the subtitle. Each slot wins over its `header` or `subheader` text, and the text returns when the slot goes.',
      sourceKey: 'card/title-slot',
      component: CardTitleSlotExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjCardHarness` from `weeljack-ng/card/testing`. `WjCardHarness.with({ title })` finds a card by its title text, from `header` or from the `wjCardTitle` slot. `getTitle()` and `getSubtitle()` (empty without one) and `getContentText()` read what the user sees; `hasHeader()` and `hasFooter()` say whether those slots are filled. The card is a container harness, so `getHarness` reaches the harnesses inside it, such as a `WjButtonHarness` in the footer. Nothing here names an Optimus class.',
      sourceKey: 'card/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves through the card’s own controls in reading order: the header slot, the content, the footer slot. The card itself is not a stop.',
    },
  ],
  aria: [
    'A card renders no interactive part and has no role of its own. It is no Tab stop, and it takes no ARIA input: `wj-card` has no `ariaLabel` input and logs no `WJ0003` warning, so an `aria-*` attribute or `role` you write on its host applies as written.',
    'A card used as a landmark takes `role="region"` and `aria-label` (or `aria-labelledby`) on its host. A card that is only a visual box takes neither.',
    'Gap, listed: the title part is a `div`, not a heading, and no heading level fits every page. Put a heading of your page’s level in the `wjCardTitle` slot (see the Title slot example); it keeps the title’s look.',
    'The header region is for media. It clips its content to the card’s top corners, so a control placed there would have its focus ring cut at the clipped edge: put controls in the body or the footer.',
    'Keep a card’s footer actions to one row where you can: they wrap onto new lines on a narrow card.',
    'Title and subtitle wrap at spaces and are never truncated. An unbroken string, such as a URL, is yours to break.',
    'No axe rule is tolerated on this page: the three documented states (header, subheader and content; all four slots and content; content only) have no violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, so its width is yours, and the card fills a host that a grid or flex row stretches: the body grows and the footer sits at the bottom, so a row of cards lines up its footers. `wj-card` adds one 1 px `--wj-content-border-color` edge, so a card shows on a surface of its own colour. `wj-card` routes no attribute of its own, so everything you set in `pt` reaches the Optimus card underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-card`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description:
        'The `p-card` element, as the host of the Optimus card. Optimus 2.0.2’s types list `root` for this element, not `host`.',
    },
    { part: 'root', description: 'The `p-card` element: the bordered box.' },
    {
      part: 'header',
      description: 'The region above the body, present only with a `wjCardHeader` slot.',
    },
    { part: 'body', description: 'The padded box around the title, subtitle, content and footer.' },
    { part: 'title', description: 'The title: the `header` text or the `wjCardTitle` slot.' },
    {
      part: 'subtitle',
      description: 'The subtitle: the `subheader` text or the `wjCardSubtitle` slot.',
    },
    { part: 'content', description: 'The box around the content you project.' },
    { part: 'footer', description: 'The footer row, present only with a `wjCardFooter` slot.' },
  ],
  mapping: [
    {
      optimus: 'header',
      weeljack: 'header',
      status: 'kept',
      note: 'Text of the title part, rendered as text. Optimus’s name: a `title` input would also set the host’s native `title` tooltip when written as a static attribute. The `wjCardHeader` slot fills the region above the body, not this.',
    },
    {
      optimus: 'subheader',
      weeljack: 'subheader',
      status: 'kept',
      note: 'Text of the subtitle part, rendered as text.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjCardPt`. Tracks Optimus.',
    },
    {
      optimus: 'headerTemplate (#header, pTemplate="header"), p-header facet',
      weeljack: '`wjCardHeader` slot',
      status: 'renamed',
      note: 'An `ng-template[wjCardHeader]`, typed `WjCardHeaderSlot`. The region above the body, such as a picture.',
    },
    {
      optimus: 'titleTemplate (#title)',
      weeljack: '`wjCardTitle` slot',
      status: 'renamed',
      note: 'An `ng-template[wjCardTitle]`, typed `WjCardTitleSlot`. Wins over `header`.',
    },
    {
      optimus: 'subtitleTemplate (#subtitle)',
      weeljack: '`wjCardSubtitle` slot',
      status: 'renamed',
      note: 'An `ng-template[wjCardSubtitle]`, typed `WjCardSubtitleSlot`. Wins over `subheader`.',
    },
    {
      optimus: 'contentTemplate (#content)',
      weeljack: 'Default content',
      status: 'renamed',
      note: 'Projected: whatever you put between the tags.',
    },
    {
      optimus: 'footerTemplate (#footer), p-footer facet',
      weeljack: '`wjCardFooter` slot',
      status: 'renamed',
      note: 'An `ng-template[wjCardFooter]`, typed `WjCardFooterSlot`. Actions, for example `wj-button`s. The footer renders only when it is used.',
    },
    dropped(
      'getBlockableElement()',
      'Exposed by need: how a block-UI targets a `wj-*` host is not decided here.',
    ),
    dropped('style, styleClass; dt, unstyled, ptOptions, CardModule', droppedAlways),
  ],
};
