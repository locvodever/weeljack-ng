import { SheetBasicExample } from '../../../examples/sheet/basic';
import { SheetBusyExample } from '../../../examples/sheet/busy';
import type { ComponentDoc } from '../component-doc';

export const DOC: ComponentDoc = {
  entry: 'sheet',
  title: 'Sheet',
  purpose:
    'WeeljackNg’s own modal sheet: a centred dialog on wide screens and a bottom drawer on narrow ones, from one body. Bind `[(visible)]`, give it a `header` that names it, put the body in its content and the actions in elements marked `wjSheetFooter`. Which one it is follows the app-wide `WJ_SHEET_WIDE` token, which defaults to `(min-width: 768px)`, and the host says so in `data-wj-mode`. It is always modal and never draggable or resizable. Set `closable` to `false`, also while it is open, to take every way of closing away while the app is busy.',
  examples: [
    {
      title: 'Basic',
      description:
        'A button opens the sheet. The `header` is required and names it; the body is the content, and each action is a `wj-button` carrying a `wjSheetFooter` attribute: the footer sits below the body, end-aligned, dismissive action first, and a sheet without such an element has no footer. Widen or narrow the window across 768px to see the mode change between a dialog and a bottom drawer. `ngSkipHydration` is set on the `wj-sheet` host because the server renders drawer mode and a wide browser switches to dialog mode: hydration is not claimed, so the host is rendered again in the browser. `wj-sheet` stays in the template while closed, and renders nothing until `visible` is `true`.',
      sourceKey: 'sheet/basic',
      component: SheetBasicExample,
    },
    {
      title: 'Busy',
      description:
        'Bind `[closable]="!saving()"` while a request runs. The close button goes, Escape does nothing and, in drawer mode, neither does the backdrop; the header keeps its height so nothing below it moves. Show the busy state on the actions yourself: Save is `loading` and Cancel is `disabled`. Widen or narrow the window across 768px to see the mode change; `ngSkipHydration` is set for the reason given in Basic. A `loading` `wj-button` is inert, so the focus it held drops to the page: this known gap of the busy pattern is not fixed here.',
      sourceKey: 'sheet/busy',
      component: SheetBusyExample,
    },
    {
      title: 'The wide token',
      description:
        'The mode follows `WJ_SHEET_WIDE`, an `InjectionToken<Signal<boolean>>` exported from `weeljack-ng/sheet`: `true` is a dialog, `false` a bottom drawer. Its default is `matchMedia("(min-width: 768px)")`, kept live, `false` on the server and `false` in a browser with no `matchMedia` function. An app that already has a breakpoint signal points the token at it once, in its providers; a spec pins the mode with a signal it can set.',
      sourceKey: 'sheet/wide-token',
      component: null,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSheetHarness` from `weeljack-ng/sheet/testing`. `getMode()` returns `"dialog"` or `"drawer"` from `data-wj-mode`, `isOpen()`, `getTitle()`, `getRole()`, `isModal()`, `hasCloseButton()` and `getCloseLabel()` read the sheet as a user meets it, and `close()`, `closeWithEscape()` and `clickBackdrop()` close it (a drawer closes on its backdrop, a dialog does not). The body and the footer are inside the harness, so `sheet.getHarness(WjButtonHarness.with({ label: "Save" }))` reaches the actions. Pin the token in the spec, as in the wide-token example.',
      sourceKey: 'sheet/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Opening',
      effect:
        'Focus moves into the sheet, in both modes: to the first control of the body, else the first action of the footer, else the close button. With nothing inside that can take focus, it moves to the sheet itself.',
    },
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves between the controls of the sheet, in order: the close button, the body, the footer. Focus wraps and never leaves the sheet while it is open.',
    },
    {
      key: 'Enter, Space',
      effect: 'On the close button, closes the sheet.',
    },
    {
      key: 'Escape',
      effect:
        'Closes the sheet while `closable` is `true`, after any control inside the body that handles it first: an open select list closes before the sheet does. While `closable` is `false`, even if it turned `false` while the sheet was open, nothing happens.',
    },
    {
      key: 'Closing',
      effect:
        'Focus returns to the element that had it when the sheet opened, if that element is still in the document. A mode change while the sheet is open is not a close: the original opener stays the one it returns to.',
    },
  ],
  aria: [
    'In both modes the sheet is `role="dialog"` with `aria-modal="true"`, named by its `header` (`aria-labelledby` points at the title). In drawer mode Optimus alone would render a `complementary` landmark with no name. `header` is required and renders as text, never as HTML.',
    'There is no `ariaLabel`, `ariaLabelledBy` or `ariaDescribedBy` input: the header names the sheet. `aria-*` written on the `wj-sheet` host is not forwarded and raises `WJ0003` in development, which says to remove it.',
    'The close button is named from the translation (`aria.close`): "Close" in English, "Đóng" with the `vi` translation from `weeljack-ng/locale`. You never pass a label. It is 44 × 44 px.',
    'The host carries `data-wj-mode="dialog"` or `data-wj-mode="drawer"`, closed or open, following `WJ_SHEET_WIDE`. Tests read it; so does a harness.',
    'Focus moves in when the sheet opens and returns to the opener when it closes, whatever closed it. If the action removed the opener (a deleted row), the sheet cannot return focus: move it yourself in the `(closed)` handler, which runs after the sheet restored focus.',
    'While the sheet is open the page behind it does not scroll. In drawer mode the backdrop closes the sheet while `closable` is `true`; in dialog mode a click on it never does. Keep the sheet in the template while it is closed: it renders nothing, and is announced and focusable only when open.',
    'If the window crosses 768px while the sheet is open, the other mode replaces it at once, without motion. The body keeps its elements and what the user typed, focus goes back to the control that had it when that control is still in the sheet, and there is still one backdrop and one scroll lock. The body scrolls from the top again. This is not a close, so `closed` is not emitted.',
    'Under reduced motion the sheet and its backdrop appear and disappear without motion, and `closed` is still emitted.',
    'A long title wraps with the close button held in the top corner, and a crowded footer wraps onto further end-aligned rows; footer actions are never stretched to the full width.',
    'Optimus’s two hidden focus-trap spans sit inside the sheet with `aria-hidden` and `tabindex="0"`. They pass the automated checks; the screen-reader pass will say whether they matter.',
    'The keyboard walk and the screen-reader passes (NVDA with Chrome, VoiceOver on iOS Safari) are recorded on this page before `0.1.0`.',
  ],
  stylingIntro:
    'The sheet has no `pt`: it is WeeljackNg’s own component, built on Optimus’s dialog and drawer, which it hides. Colours, radius, shadow and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits, and both overlays render inside the host, so a property set on `wj-sheet` (a `class`, a `style` or a rule on its selector) reaches whichever is open. The host is a block. In dialog mode the width is a fixed `--wj-sheet-width`, so content never resizes the sheet; in drawer mode the sheet is as wide as the page and as tall as its content, up to 90% of the viewport height, and clears a phone’s home indicator. The header and the footer keep their insets whatever the body padding is. To choose the mode yourself, point `WJ_SHEET_WIDE` at your own breakpoint signal once, in the application providers: `{ provide: WJ_SHEET_WIDE, useFactory: () => inject(BreakpointService).wide }`. Coming from Optimus, where an app wrote an `@if (breakpoint.wide())` pair of `p-dialog` and `p-drawer` around a shared `#body` template: replace the pair and the template with one `wj-sheet` and `WJ_SHEET_WIDE`. `[visible]` with `(visibleChange)` becomes `[(visible)]`, `header` and `[closable]` stay, and `(onHide)` becomes `(closed)`. `styleClass`, an `aria-label` on the host, `closeAriaLabel` and `ariaCloseLabel`, `draggable`, `resizable` and `modal` are gone, because the sheet sets them. The actions move out of the body into `wjSheetFooter` elements.',
  parts: [],
  customProperties: [
    {
      name: '--wj-sheet-width',
      defaultValue: 'min(32rem, 100vw - 2rem)',
      description:
        'The width of the sheet in dialog mode. A fixed width, so content never resizes the dialog. Drawer mode ignores it.',
    },
    {
      name: '--wj-sheet-body-padding',
      defaultValue: '0 1.25rem 1.25rem',
      description:
        'The padding of the body, in both modes. Set it to `0` for a body that runs to the edges; the header and the footer keep their own insets.',
    },
  ],
  mapping: [],
};
