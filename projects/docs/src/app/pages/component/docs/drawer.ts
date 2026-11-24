import { DrawerBusyExample } from '../../../examples/drawer/busy';
import { DrawerPositionsExample } from '../../../examples/drawer/positions';
import { DrawerWithFooterExample } from '../../../examples/drawer/with-footer';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'drawer',
  title: 'Drawer',
  purpose:
    'A modal panel over Optimus’s `p-drawer` that opens from the left, right, top or bottom edge: bind `[(visible)]`, give it a `header` that names it, and put the body in its content and the actions in a `wjDrawerFooter` template. It is always modal, and it closes with Escape, the close button or a click on the backdrop. Set `closable` to `false`, also while it is open, to take all three away while the app is busy.',
  examples: [
    {
      title: 'Positions',
      description:
        'One `wj-drawer` and four buttons: each sets `position` to `left`, `right`, `top` or `bottom` and opens it. Left and right drawers are 20rem wide, and never wider than the viewport minus 3rem, so some backdrop stays beside them. Top and bottom drawers are as tall as their content, up to 90% of the viewport height, round the edge that faces the page, and the bottom one clears a phone’s home indicator. `wj-drawer` stays in the template while closed, and renders nothing until `visible` is `true`.',
      sourceKey: 'drawer/positions',
      component: DrawerPositionsExample,
    },
    {
      title: 'With a footer',
      description:
        'The actions go in an `ng-template` marked `wjDrawerFooter` (import `WjDrawerFooterSlot`: without it the template is silently dropped). The footer sits below the body, end-aligned, dismissive action first, and wraps when it is crowded. A drawer without the template has no footer region at all.',
      sourceKey: 'drawer/with-footer',
      component: DrawerWithFooterExample,
    },
    {
      title: 'Busy',
      description:
        'Bind `[closable]="!saving()"` while a request runs. The close button goes, and Escape and the backdrop do nothing, also if `closable` turned `false` while the drawer was open. The header keeps its height so nothing below it moves. Show the busy state on the actions yourself: Save is `loading` and Cancel is `disabled`. A `loading` `wj-button` is inert, so the focus it held drops to the page: this known gap of the busy pattern is not fixed here.',
      sourceKey: 'drawer/busy',
      component: DrawerBusyExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjDrawerHarness` from `weeljack-ng/drawer/testing`. `isOpen()`, `getTitle()`, `getRole()`, `isModal()`, `getPosition()`, `getDescription()`, `hasCloseButton()` and `getCloseLabel()` read the drawer as a user meets it, `close()`, `closeWithEscape()` and `clickBackdrop()` close it, and `hasBackdrop()` says whether the page behind is covered. The body and the footer are inside the harness, so `drawer.getHarness(WjButtonHarness.with({ label: "Apply" }))` reaches the actions.',
      sourceKey: 'drawer/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Opening',
      effect:
        'Focus moves into the drawer: to the first control of the body, else the first action of the footer, else the close button. With nothing inside that can take focus, it moves to the drawer itself.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves between the controls of the drawer, in order: the close button, the body, the footer. Focus wraps and never leaves the drawer while it is open.',
    },
    {
      key: 'Enter, Space',
      effect: 'On the close button, closes the drawer.',
    },
    {
      key: 'Escape',
      effect:
        'Closes the drawer while `closable` is `true`, after any control inside the body that handles it first: an open select list closes before the drawer does. While `closable` is `false`, even if it turned `false` while the drawer was open, nothing happens: the backdrop and the scroll lock stay.',
    },
    {
      key: 'Closing',
      effect:
        'Focus returns to the element that had it when the drawer opened, if that element is still in the document.',
    },
  ],
  aria: [
    'The drawer is `role="dialog"` with `aria-modal="true"`, and is named by its `header` (`aria-labelledby` points at the title). Optimus alone renders a `complementary` landmark with no name. `header` is required and renders as text, never as HTML.',
    '`ariaDescribedBy` sets `aria-describedby` on the drawer element: point it at the element in the body that says what the drawer is about. `aria-*` written on the `wj-drawer` host is not forwarded and raises `WJ0003` in development; it says to use `ariaDescribedBy`, because the header already names the drawer, so there is no `ariaLabel` or `ariaLabelledBy` input.',
    'The close button is named from the translation (`aria.close`): "Close" in English, "Đóng" with the `vi` translation from `weeljack-ng/locale`. You never pass a label. It is 44 × 44 px.',
    'Focus moves in when the drawer opens and returns to the opener when it closes, whatever closed it. If the action removed the opener (a deleted row), the drawer cannot return focus: move it yourself in the `(closed)` handler, which runs after the drawer restored focus.',
    'While the drawer is open the page behind it does not scroll. The backdrop closes the drawer while `closable` is `true`, and does nothing while it is `false`. Keep the drawer in the template while it is closed: it renders nothing, and is announced and focusable only when open.',
    'Under reduced motion the drawer and its backdrop appear and disappear without motion, and `opened` and `closed` are still emitted. `pt.motion` cannot turn that off.',
    'A long title wraps with the close button held in the top corner, and a crowded footer wraps. A side drawer is never wider than the viewport minus 3rem.',
    'Optimus’s two hidden focus-trap spans sit inside the drawer with `aria-hidden` and `tabindex="0"`. They pass the automated checks; the screen-reader pass will say whether they matter.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari) are recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'Colours, radius, shadow and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits, and the drawer renders inside its host, so a `--wj-*` property set on `wj-drawer` reaches it. The host is a block. `wj-drawer` sets `--wj-drawer-header-padding`, `--wj-drawer-title-font-size` (1.25rem, the dialog’s title size) and `--wj-drawer-footer-padding` on its host. Side drawers are 20rem wide; set another width through `pt.root`. For anything else, `pt` reaches the parts of the Optimus drawer underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-drawer`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `role`, `aria-modal`, `aria-labelledby` and `aria-describedby` on the `root` part and `id` on the `title` part are set by the component, and win over a `pt` value; `pt.motion` cannot switch `safe` off, because `wj-drawer` binds the motion options itself.',
  parts: [
    { part: 'host', description: 'The Optimus `p-drawer` element.' },
    { part: 'root', description: 'The drawer panel: `role="dialog"`.' },
    { part: 'header', description: 'The row with the title and the close button.' },
    { part: 'title', description: 'The title: the `header` text.' },
    { part: 'pcCloseButton', description: 'The close button. Takes the pass-through of a button.' },
    { part: 'content', description: 'The body, the one region that scrolls.' },
    {
      part: 'footer',
      description: 'The footer with the actions, present only with a footer slot.',
    },
  ],
  mapping: [
    {
      optimus: 'visible + visibleChange',
      weeljack: 'visible',
      status: 'kept',
      note: 'A `model(false)`: two-way as `[(visible)]`.',
    },
    {
      optimus: 'header',
      weeljack: 'header',
      status: 'kept',
      note: 'Required: it names the drawer (`aria-labelledby` points at its title). Text only.',
    },
    {
      optimus: 'position',
      weeljack: 'position',
      status: 'kept',
      note: 'Default `left`: `left`, `right`, `top` or `bottom`, typed `WjDrawerPosition` (Optimus’s values without `full`).',
    },
    {
      optimus: 'closable',
      weeljack: 'closable',
      status: 'kept',
      note: 'Default `true`. `false` removes the close button, Escape and the backdrop close, also while the drawer is open.',
    },
    {
      optimus: 'onShow',
      weeljack: 'opened',
      status: 'renamed',
      note: 'Emits once each time the drawer has opened. No value.',
    },
    {
      optimus: 'onHide',
      weeljack: 'closed',
      status: 'renamed',
      note: 'Emits once each time the drawer has closed, whatever closed it, including the app setting `visible` to `false` (which Optimus’s `onHide` does not report). No value.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjDrawerPt`. Tracks Optimus.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the drawer element.',
    },
    {
      optimus: 'default content',
      weeljack: 'projected body',
      status: 'kept',
      note: 'The default content slot.',
    },
    {
      optimus: '#footer, pTemplate="footer"',
      weeljack: 'wjDrawerFooter slot',
      status: 'renamed',
      note: 'An `ng-template[wjDrawerFooter]`, typed `WjDrawerFooterSlot`. The footer renders only when it is used.',
    },
    dropped(
      'modal, blockScroll',
      'Always modal, and the page behind does not scroll (Optimus’s `blockScroll` is off by default).',
    ),
    dropped(
      'dismissible, closeOnEscape',
      'Both follow `closable`: the backdrop and Escape close the drawer while it is closable.',
    ),
    dropped('ariaCloseLabel', 'The close button is named from the translation (`aria.close`).'),
    dropped(
      'closeButtonProps, #closeicon, closeIconTemplate',
      'The close button is fixed. Icon slots are not exposed.',
    ),
    dropped('showCloseIcon, transitionOptions', 'Deprecated since Optimus v21.'),
    dropped(
      'motionOptions',
      'Not exposed: `wj-drawer` sets `{ safe: true }` itself, so reduced motion is respected.',
    ),
    dropped('fullScreen', 'Not needed.'),
    dropped(
      'appendTo, autoZIndex, baseZIndex',
      'Not needed. The drawer renders inside its host, with Optimus’s layering.',
    ),
    dropped(
      '#header, #content, #headless, headerTemplate, contentTemplate, headlessTemplate',
      'The header is text, and the body is projected.',
    ),
    dropped('style, styleClass, maskStyle, dt, unstyled, ptOptions', droppedAlways),
    dropped('show, hide, close (methods)', 'Close it by setting `visible` to `false`.'),
  ],
};
