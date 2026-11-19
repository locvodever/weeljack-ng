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
 *
 * Optimus injects each component's styles after this css, in the same layer, so an equal
 * specificity loses to Optimus. The invalid rules therefore out-rank the rule they beat:
 * - rating, slider, knob and colour picker paint no invalid look in Optimus. Each keys on the
 *   `aria-invalid="true"` its wrapper routes onto one part. The slider track and the knob range
 *   arc stay as they are: red there leaves the dark primary under 3:1. The rating star
 *   (0,5,0) beats `.p-rating-option-active .p-rating-icon`, and Optimus's hover rule (0,6,0) still
 *   wins, so hover works. The slider hover selector (0,5,0) beats `...handle:hover` (0,4,0). The
 *   colour picker (0,3,0) beats the wrapper's `::ng-deep` boundary (0,2,0), and ties Optimus's
 *   focus rule, which wins by order and so keeps its ring.
 * - A hovered invalid control keeps its border: Optimus's hover rules are (0,3,0) for the text
 *   fields and selects (ours 0,4,0) and (0,5,0) to (0,6,0) for the checkbox, radio and switch
 *   (ours 0,6,1, the doubled `.p-invalid` also beats the checked hover rule). The autocomplete's
 *   chips input ties at (0,3,0), so ours adds the root (0,5,0). Only `border-color` is set.
 *
 * CSS comments inside the string ship in the bundle: keep them out of it.
 */
export const wjLayerStyles = `
/* 44px controls (22 Q3): the form-field padding tokens assume a 1.5 line-height. */
.p-inputtext,
.p-textarea,
.p-select-label,
.p-treeselect-label,
.p-cascadeselect-label,
.p-multiselect-label,
.p-togglebutton-label,
.p-button {
  line-height: 1.5;
}

/* Invalid looks. */
.p-rating[aria-invalid='true'] .p-rating-option:not(.p-rating-option-active) .p-rating-icon {
  color: var(--wj-form-field-invalid-border-color);
}
.p-slider .p-slider-handle[aria-invalid='true'],
.p-slider:not(.p-disabled) .p-slider-handle[aria-invalid='true']:hover {
  background: var(--wj-form-field-invalid-border-color);
}
.p-knob svg[aria-invalid='true'] {
  box-shadow: 0 0 0 1px var(--wj-form-field-invalid-border-color);
}
.p-colorpicker .p-colorpicker-preview[aria-invalid='true'] {
  box-shadow: inset 0 0 0 1px var(--wj-form-field-invalid-border-color);
}
:is(.p-inputtext, .p-textarea).p-invalid:enabled:hover,
:is(.p-select, .p-multiselect, .p-cascadeselect, .p-treeselect).p-invalid:not(.p-disabled):hover,
.p-autocomplete.p-invalid .p-autocomplete-input-multiple:not(.p-disabled):hover,
:is(.p-checkbox, .p-radiobutton, .p-toggleswitch).p-invalid.p-invalid:not(.p-disabled):has(input:hover) > :is(.p-checkbox-box, .p-radiobutton-box, .p-toggleswitch-slider) {
  border-color: var(--wj-form-field-invalid-border-color);
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

  /*
   * Optimus fades the tooltip bubble in from JavaScript, writing an inline opacity on every
   * step, so only an important declaration inside the layer shows it fully opaque at once.
   */
  .p-tooltip {
    opacity: 1 !important;
  }
}
`;
