import { BreadcrumbBasicExample } from '../../../examples/breadcrumb/basic';
import { BreadcrumbCommandsExample } from '../../../examples/breadcrumb/commands';
import { BreadcrumbHomeLabelExample } from '../../../examples/breadcrumb/home-label';
import { BreadcrumbRouterLinksExample } from '../../../examples/breadcrumb/router-links';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'breadcrumb',
  title: 'Breadcrumb',
  purpose: 'Where the current page sits in the site’s hierarchy, as a trail of links.',
  examples: [
    {
      title: 'Basic',
      description:
        'Describe the trail as plain `WjMenuItem` objects (a type from `weeljack-ng`, documented on the Menu page at `/components/menu`) in `model`, and the first link as `home`. A `home` with no `label` draws a house glyph, named “Home”. The last visible item is the current page: it carries `aria-current="page"` and should have no `url` or `routerLink`. To change the trail, replace the array: it is read when it changes, and your objects are never changed. A label is text, never HTML. With no `home` and no visible items, nothing renders.',
      sourceKey: 'breadcrumb/basic',
      component: BreadcrumbBasicExample,
    },
    {
      title: 'Home with a label',
      description:
        'A `label` on `home` shows beside the glyph. The visible label names the link, so no `aria-label` is set: `homeAriaLabel` is for the glyph-only home.',
      sourceKey: 'breadcrumb/home-label',
      component: BreadcrumbHomeLabelExample,
    },
    {
      title: 'Router links',
      description:
        'An item with `routerLink` renders as a real link, so middle-click and “open in new tab” work. The path or commands array is the one Angular’s `routerLink` takes. The trail needs the app’s router, which `provideRouter` supplies; here the links go to this site’s own pages.',
      sourceKey: 'breadcrumb/router-links',
      component: BreadcrumbRouterLinksExample,
    },
    {
      title: 'Commands',
      description:
        'An item’s `command` receives a `WjMenuItemCommandEvent`: `event.originalEvent` is the click, and `event.item` is your own item object, the very reference you put in `model`. This command keeps the page from navigating with `event.originalEvent.preventDefault()`, and keeps the `url` so the links stay keyboard-operable. An item with only a `command` and no link is not one the keyboard can activate (see Accessibility).',
      sourceKey: 'breadcrumb/commands',
      component: BreadcrumbCommandsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjBreadcrumbHarness` from `weeljack-ng/breadcrumb/testing`. `getName()`, `getItemLabels()`, `getCurrentLabel()`, `hasHome()` and `getHomeName()` read the trail as a user meets it, `getItems()` finds the items of the trail (each a `WjBreadcrumbItemHarness` with `getLabel()`, `getHref()`, `isCurrent()`, `isDisabled()`, `click()`, `focus()` and `isFocused()`), and `clickItem()` and `clickHome()` follow one. The home link is not an item. Nothing here names an Optimus class.',
      sourceKey: 'breadcrumb/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves through the links in order, the home link first. Disabled items and a current page with no link are not Tab stops: a current page that is a link keeps its stop.',
    },
    {
      key: 'Enter',
      effect: 'Follows the focused link: its `url` or `routerLink`, and runs its `command`.',
    },
  ],
  aria: [
    'The trail is a `nav` landmark. WeeljackNg names it: `ariaLabel` sets the name, and without it the name is “Breadcrumb”, from the translation (`wj.breadcrumb`). It is set on the `nav`, not on the `wj-breadcrumb` host, through the `root` part of `pt`; a `pt.root` of your own keeps its other keys, and the name set by the component wins over a `pt` value of the same name.',
    'The home link is named “Home” (`wj.home`) when the home item has no `label`: a house glyph alone has no name, and Optimus’s own fallback reads a translation key that the shipped locales do not have. `homeAriaLabel` overrides it. When the home item has a `label`, that label names the link and no `aria-label` is set.',
    'The last visible item carries `aria-current="page"`. Give it no `url` or `routerLink`, and give every other item one.',
    'Setting an `aria-*` attribute on the `wj-breadcrumb` host logs the dev-mode warning `WJ0003` and is not forwarded: use `ariaLabel` and `homeAriaLabel`.',
    'Gap (Optimus): an item with only a `command` and no `url` or `routerLink` is an `a` with no `href`. It is a Tab stop, but it has no link role and Enter does not activate it. Give every item except the current one a link; a `command` runs beside the link.',
    'Gap, fixed: Optimus leaves the current page, an `a` with no `href`, a Tab stop (`tabindex="0"`). The wrapper sets `tabindex="-1"` on it through the `itemLink` part, so it is announced as text with “current page” and Tab passes it. A current page that has a `url` or `routerLink` is a link and keeps its stop.',
    'Gap, fixed: Optimus keeps the `href` of a disabled item and leaves it a Tab stop with no `aria-disabled`. The wrapper sets `aria-disabled="true"` and `tabindex="-1"` on a disabled item, the home link included, through the `itemLink` part: it is announced as unavailable and Tab passes it, and it still does nothing, because Optimus prevents the click and runs no command. Other links get no key from the wrapper, and a `pt.itemLink` of your own keeps its keys beside the routed ones.',
    'Gap (Optimus): long trails scroll sideways with the scrollbar hidden in Chromium and Safari, starting at home, so on a narrow viewport the current page can sit off the end. Focus scrolls a link into view. Keep labels to one to three words and trails to five levels with home.',
    'Colour fix: Aura’s light home glyph is zinc.400, 2.56:1 on white, under the 3:1 a graphic needs when it is the link’s only content. The default preset sets it to zinc.500 (4.83:1) and its hover to zinc.700, so the glyph still darkens on hover; the dark scheme keeps Aura’s colours. Both are rows of the contrast gate. The chevron separators are decoration (`aria-hidden`).',
    'Every link, the home glyph’s included, is at least 24 × 24 px, with its content centred.',
    'Unknown fields on an item are dropped silently: `WjMenuItem` lists what a breadcrumb takes, and a field such as `icon`, `styleClass` or `escape` on a wider object never reaches Optimus.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block with no box of its own. The trail is Optimus’s own: a `nav` with 16 px of padding, links 8 px apart in muted text with no underline, and 16 px chevrons between them. The trail never wraps: each crumb narrows to its longest word and then the row scrolls sideways. For anything else, `pt` reaches the parts of the Optimus breadcrumb underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-breadcrumb`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-label` on the `root` part is set by the component from `ariaLabel`, and wins over a `pt` value.',
  parts: [
    {
      part: 'root',
      description:
        'The `nav` landmark. `wj-breadcrumb` merges `aria-label` into it, and it wins over a `pt` value.',
    },
    { part: 'list', description: 'The ordered list of the trail.' },
    { part: 'homeItem', description: 'The home link’s list item.' },
    { part: 'item', description: 'One item of the trail.' },
    { part: 'itemLink', description: 'The link inside an item, the home link included.' },
    { part: 'itemIcon', description: 'The home glyph.' },
    { part: 'itemLabel', description: 'The text of an item.' },
    { part: 'separator', description: 'The separator between two links.' },
    { part: 'separatorIcon', description: 'The chevron in a separator.' },
  ],
  mapping: [
    {
      optimus: 'model',
      weeljack: 'model',
      status: 'kept',
      note: 'Typed `WjMenuItem[]`, default `[]`. Mapped like `wj-menu`’s: every item gets `escape: true`, a narrowed command and no mutation. The last visible item is the current page. Hidden items are left out. `items`, `separator` and `expanded` are ignored here.',
    },
    {
      optimus: 'home',
      weeljack: 'home',
      status: 'kept',
      note: 'Typed `WjMenuItem`, optional. Mapped through the same mapper as a one-item array, so it gets `escape: true` and a narrowed command too. With no `label`, Optimus draws its home glyph. With a `home` and no visible items, no `model` is passed to Optimus, because Optimus draws a separator after the home whenever `model` is set.',
    },
    {
      optimus: 'homeAriaLabel',
      weeljack: 'homeAriaLabel',
      status: 'kept',
      note: 'Default: “Home”, from the translation, applied only when the home item has no `label`. A visible label already names the link, and an `aria-label` would override it.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel',
      status: 'added',
      note: 'Names the `nav` landmark, through the `root` part of `pt`. Default: “Breadcrumb”, from the translation.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjBreadcrumbPt`. Tracks Optimus.',
    },
    dropped(
      'onItemClick',
      'Not exposed: each item’s `command` covers it, with the narrowed event `{ originalEvent, item }`.',
    ),
    dropped(
      '#item template',
      'Not exposed: Optimus’s item template replaces the whole link, so the wrapper would have to own the link, its router link and `aria-current`.',
    ),
    dropped(
      '#separator template',
      'Not exposed: the separator is decoration, and Optimus’s chevron is `aria-hidden`.',
    ),
    dropped('style, styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('BreadcrumbModule, BreadCrumbStyle', 'Optimus internals: one selector per wrapper.'),
  ],
};
