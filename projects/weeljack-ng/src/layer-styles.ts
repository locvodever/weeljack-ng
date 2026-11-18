/**
 * The `@layer wj` styles that are not design tokens (FR-13). `provideWeeljack` attaches them to
 * the Optimus preset's root `css`, which Optimus injects once, wrapped in the `wj` layer, so an
 * app's unlayered CSS always wins without `::ng-deep`.
 *
 * Plain CSS in a string: the root entry has no component to carry a `styleUrl`, and ng-packagr
 * cannot inline a loose `.css` file into an entry's TypeScript.
 *
 * Each entry that adds a control to the 44px family adds its Optimus class to the
 * `line-height` rule below; T0 has the button and the text input; textarea and the select label join it.
 */
export const wjLayerStyles = `
/* 44px controls (22 Q3): the form-field padding tokens assume a 1.5 line-height. */
.p-inputtext,
.p-textarea,
.p-select-label,
.p-treeselect-label,
.p-cascadeselect-label,
.p-multiselect-label,
.p-button {
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  /* Transitions keep Aura's 0.2s on named properties; reduced motion drops them to none. */
  :root,
  :host {
    --wj-transition-duration: 0s;
    --wj-mask-transition-duration: 0s;
  }

  .p-progressspinner .p-progressspinner-spin,
  .p-progressspinner .p-progressspinner-circle {
    animation: none;
  }

  /*
   * Optimus injects the icon-spin rule unlayered, and an unlayered rule beats any layered one,
   * so only an important declaration inside the layer stops the button's loading spinner.
   */
  .p-icon-spin {
    animation: none !important;
  }

  /* wjRipple: Optimus's press handler returns early when the ink is not displayed. */
  .p-ripple > .p-ink {
    display: none;
  }

  /*
   * wjAnimateOnScroll: nothing is held or animated. The important beats the inline opacity: 0
   * that Optimus writes on a held element.
   */
  .p-animateonscroll {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
}
`;
