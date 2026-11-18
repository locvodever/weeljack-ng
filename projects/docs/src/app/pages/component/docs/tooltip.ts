import { TooltipBasicExample } from '../../../examples/tooltip/basic';
import { TooltipOnAComponentExample } from '../../../examples/tooltip/on-a-component';
import { TooltipPositionsExample } from '../../../examples/tooltip/positions';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'tooltip',
  title: 'Tooltip',
  purpose:
    'A short text that describes the element it is on, shown on hover and on keyboard focus.',
  optimusSelector: '[pTooltip]',
  examples: [
    {
      title: 'Basic',
      description:
        'Put `wjTooltip` on a focusable element. The bubble shows when the pointer is on the element or when it takes keyboard focus, and it stays while the pointer is on the bubble. It hides on blur, when the pointer leaves both, and on Escape. It never times out.',
      sourceKey: 'tooltip/basic',
      component: TooltipBasicExample,
    },
    {
      title: 'Positions',
      description:
        'The bubble is on the right by default; `tooltipPosition` asks for `left`, `top` or `bottom`. A side with no room in the viewport gives way to another.',
      sourceKey: 'tooltip/positions',
      component: TooltipPositionsExample,
    },
    {
      title: 'On a component',
      description:
        'A `wj-button` cannot take focus itself: the button inside it does. Name the directive with `#tip="wjTooltip"` and bind the component’s `ariaDescribedBy` to `tip.descriptionId`, so the text is the button’s description. Without that binding the tooltip still shows, but a screen reader does not link it to the button, and `WJ0153` is raised in dev mode.',
      sourceKey: 'tooltip/on-a-component',
      component: TooltipOnAComponentExample,
    },
    {
      title: 'Testing',
      description:
        'In a spec, import `WjTooltipHarness` from `weeljack-ng/tooltip/testing`: `hover()`, `unhover()`, `focus()`, `blur()`, `dismiss()` (Escape), `isShown()`, `getText()` (the bubble’s text; it throws while hidden), `getDescription()` (the text the element references, shown or not) and `getPosition()` (the side it is on now). The bubble renders in `document.body`, so the harness finds it from the document root: with one tooltip showing, the bubble it reads is that host’s.',
      sourceKey: 'tooltip/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect: 'Focus on the element shows the bubble; focus leaving it hides the bubble.',
    },
    {
      key: 'Escape',
      effect:
        'Hides the bubble, and focus stays on the element. Inside a dialog, Escape hides the bubble first and closes the dialog on the next press.',
    },
  ],
  aria: [
    'The text is read as the element’s description, shown or not. A hidden element that the directive owns holds it, and its id is added to the element’s `aria-describedby`; your own ids stay, and the id is put back if a binding or a `wj-field` rewrites the attribute. A screen reader speaks it when focus reaches the element, and never as stray page text. The bubble keeps Optimus’s `role="tooltip"`.',
    'Put it on an element that can take focus: a button, a link or an input. A component host such as `wj-button` cannot, so bind its `ariaDescribedBy` to `descriptionId` (`WJ0153` says so in dev mode) and the directive writes nothing on the host.',
    'The text adds to the element’s name, never repeats it. It is one or two short lines of plain text and it never holds controls or links: the bubble is not a place to move focus to. Optimus writes the text as text, so markup in the string is shown as characters and never parsed.',
    'A disabled native button receives no hover or focus events, so its tooltip never shows: put the reason next to the button instead.',
    'Hover and keyboard focus both show it, the pointer can move onto the bubble without hiding it, and Escape hides it (WCAG 1.4.13: hoverable, dismissable, persistent). A click on the element hides it too. It adds no hit box of its own: the target is the element’s.',
    'Under reduced motion the bubble is fully opaque at once, with no fade.',
    'Stacked overlays: the tooltip joins the overlay stack while it is shown, so Escape reaches it first. Inside a non-closable `wj-dialog` it hides and the dialog stays; a closable dialog stays open on that first Escape too.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'Colours, radius, shadow and spacing come from the Optimus preset’s tooltip tokens, which `provideWeeljack` emits: the bubble is `surface.700` with `surface.0` text, 10.45:1 in both schemes. For anything else, `pt` reaches the parts of the Optimus tooltip underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wjTooltip`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. The bubble renders in `document.body`, outside the host, so your component’s styles do not reach it: style it through `pt`. Its text wraps and its width is capped at 12.5rem.',
  parts: [
    { part: 'root', description: 'The bubble, with `role="tooltip"`.' },
    { part: 'arrow', description: 'The arrow that points at the element.' },
    { part: 'text', description: 'The box that holds the text.' },
  ],
  mapping: [
    {
      optimus: 'pTooltip',
      weeljack: 'wjTooltip',
      status: 'renamed',
      note: 'The text, a `string`. A `TemplateRef` is not accepted: rich content is never passed to a tooltip.',
    },
    {
      optimus: 'tooltipPosition',
      weeljack: 'tooltipPosition',
      status: 'kept',
      note: '`WjTooltipPosition`: `right` (the default), `left`, `top` or `bottom`.',
    },
    {
      optimus: 'showDelay, hideDelay',
      weeljack: 'showDelay, hideDelay',
      status: 'kept',
      note: 'Milliseconds.',
    },
    {
      optimus: 'tooltipDisabled',
      weeljack: 'tooltipDisabled',
      status: 'kept',
      note: 'Shows no bubble, and hides one that is showing.',
    },
    {
      optimus: 'pTooltipPT, ptTooltip',
      weeljack: 'pt',
      status: 'renamed',
      note: 'Typed `WjTooltipPt`. Tracks Optimus. Parts `root`, `arrow`, `text`.',
    },
    {
      optimus: '—',
      weeljack: 'descriptionId',
      status: 'added',
      note: 'A read-only property: the id of the description element, for a component host’s `ariaDescribedBy`.',
    },
    {
      optimus: 'escape',
      weeljack: 'Always true',
      status: 'dropped',
      note: 'Not exposed and never set: the text is always written as text, never as HTML.',
    },
    {
      optimus: 'tooltipEvent',
      weeljack: 'Fixed: hover and focus',
      status: 'dropped',
      note: 'Keyboard users see the tooltip too.',
    },
    {
      optimus: 'autoHide',
      weeljack: 'Fixed: false',
      status: 'dropped',
      note: 'The pointer can move onto the bubble without hiding it.',
    },
    {
      optimus: 'hideOnEscape',
      weeljack: 'Fixed: true',
      status: 'dropped',
      note: 'Escape always dismisses the bubble.',
    },
    dropped('life', 'The bubble never times out.'),
    dropped(
      'showOnEllipsis, fitContent, positionStyle, positionTop, positionLeft, tooltipZIndex, appendTo, tooltipOptions',
      'Optimus’s defaults: the bubble renders in `document.body`, layered by Optimus.',
    ),
    dropped('tooltipStyleClass, pTooltipUnstyled, dt, ptOptions', droppedAlways),
  ],
};
