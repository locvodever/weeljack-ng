import { BlockuiCardExample } from '../../../examples/blockui/card';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'blockui',
  title: 'Block UI',
  purpose:
    'Cover a region, or the page, while it is busy: the pointer and the keyboard cannot reach it.',
  optimusSelector: 'p-blockUI',
  examples: [
    {
      title: 'Card',
      description:
        'Save, outside the card, blocks it for a moment. `wj-blockui` takes the card as its `target`; its content is the message, shown centred on the mask on a surface card. While blocked, everything in the card is `inert` and the card is `aria-busy`. Save stays enabled, so its focus is never lost; the example ignores a press while it is saving. Say what is happening in a status line, as the example does: the mask’s own content is not announced.',
      sourceKey: 'blockui/card',
      component: BlockuiCardExample,
    },
    {
      title: 'The page',
      description:
        'With no `target`, `wj-blockui` covers the whole page and locks its scroll. Everything else in the page is `inert` while it is blocked, and the body is `aria-busy`. The message sits on a surface card here too.',
      sourceKey: 'blockui/page',
      component: null,
    },
    {
      title: 'Testing',
      description:
        'In a spec, import `WjBlockUIHarness` from `weeljack-ng/blockui/testing`: `isBlocked()`, `isBusy()`, `isInert()` and `getMaskText()`. Optimus moves its mask out of the host, onto the target or the page, so the harness finds it from the document root by a `data-wj-blockui` hook, and `isBusy()` and `isInert()` describe the region behind it.',
      sourceKey: 'blockui/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Skip every control in the blocked region, because it is `inert`. For the page, nothing outside the mask can be reached. A control you place on the mask stays reachable.',
    },
    {
      key: 'Escape',
      effect: 'Does nothing: block UI is not on the overlay stack and cannot be dismissed.',
    },
    {
      key: 'Unblocking',
      effect:
        'Focus returns to the element that had it, if it is still on the page and not inert. If you moved focus elsewhere meanwhile, it stays there.',
    },
  ],
  aria: [
    'Optimus’s mask blocks only the pointer, so Tab would still reach every control under it. While `blocked`, `wj-blockui` also makes the region’s content `inert` (the target’s children, or the page’s body children, the mask excepted) and sets `aria-busy="true"` on the region (the target, or `body`). On unblock it removes only what it set: an `inert` or an `aria-busy` of your own is kept.',
    'Focus inside the region is lost when it becomes `inert`. On unblock it goes back to the element that had it, if that is still in the page and not `inert`.',
    'The mask’s content is not announced to a screen reader. Announce the status yourself, with `wj-toast` or a live region, as the example’s status line does.',
    'Never put text straight on the mask: in light mode Aura’s mask text colour over the 40% black mask reaches only about 2.2:1. Put the message on a surface card, as the examples do (about 10:1 in light and 17:1 in dark).',
    'Gap, fixed: Optimus sets `position: relative` inline on the target when it blocks and never removes it. `wj-blockui` records the target’s own inline `position` before the block and writes it back once the mask has left (or removes the property when the target had none). The target is `position: relative` while blocked, so block a static or relatively positioned element. A block that starts again before the mask has left keeps the first recorded value.',
    'Under reduced motion the mask appears and leaves without a fade, and unblocking completes.',
    'Destroying `wj-blockui` while it is blocked releases the scroll lock, removes the mask and takes `inert` and `aria-busy` off the region.',
    'Gap, fixed: Optimus’s 12px radius also applied to the page mask, so the four corners of the viewport showed a sliver of unmasked page. The page mask now has no radius; a target’s mask keeps the radius of a card.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, and VoiceOver on iOS Safari for overlays) are recorded here before wave 4’s release.',
  ],
  stylingIntro:
    'The mask takes `--wj-mask-background` (40% black in light, 60% in dark) and a radius of `--wj-blockui-border-radius` (12px), so it fits a card. The projected content sits centred on the mask, on both axes; `wj-blockui` paints no card, spinner or text of its own, so put your message on a surface and style it as you like. Unblocked, nothing of it shows. The host is a block with no height. For anything else, `pt` reaches the parts of the Optimus block UI underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-blockui`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'host',
      description: 'The element Optimus moves onto the target or the page: the mask.',
    },
    {
      part: 'root',
      description:
        'The same element, as the mask. `wj-blockui` stamps its `data-wj-blockui` hook here.',
    },
  ],
  mapping: [
    {
      optimus: 'blocked',
      weeljack: 'blocked',
      status: 'kept',
      note: '`input(false)`, with `booleanAttribute`.',
    },
    {
      optimus: 'target (a `BlockableUI` component)',
      weeljack: 'target: HTMLElement',
      status: 'kept',
      note: 'Any element: the wrapper adapts it to Optimus’s `getBlockableElement()`. With none, the whole page is blocked.',
    },
    {
      optimus: 'Default content, #content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Shown centred on the mask: a message on a surface card, say.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjBlockUIPt`. Tracks Optimus. Parts `host`, `root`.',
    },
    dropped('autoZIndex, baseZIndex', 'Optimus’s defaults apply: the mask layers like a modal.'),
    dropped('styleClass, dt, unstyled, ptOptions', droppedAlways),
    dropped('Selectors `p-blockui`, `p-block-ui`', 'Duplicate selectors.'),
  ],
};
