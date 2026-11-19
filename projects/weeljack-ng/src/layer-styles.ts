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
 * Notes on the rules below, moved out of the string because CSS comments inside it ship in the
 * bundle (keep them out of it):
 * - 44px controls (22 Q3): the form-field padding tokens assume a 1.5 line-height.
 * - Invalid looks: the rating, slider, knob, colour picker and hovered-invalid rules.
 * - Disabled looks: Aura styles a disabled toggle button with `:disabled`, which never matches the
 *   `span` Optimus renders, so the rule restates it on `.p-disabled`. The doubled
 *   `.p-togglebutton` (0,3,0) beats the checked rule (0,2,0). The picked pill
 *   (`.p-togglebutton-content`, (0,3,0) over (0,2,0)) swaps the two disabled colours, so it stays
 *   visible, and its icon (0,4,0 over 0,3,0) inherits the pill's text colour. A pointer never
 *   reaches a disabled button (`.p-disabled` sets `pointer-events: none`), so no hover rule needs
 *   to be out-ranked. The datepicker rule takes exactly the day, month and year: Optimus dims
 *   them with the class's 0.6 opacity and shows no disabled state, while a generic `.p-disabled`
 *   rule would undim disabled selects and menus. It matches `datepicker.css`'s local rule.
 * - Menu focus: Optimus marks the active descendant with `.p-focus` and fills it with a surface
 *   about 1.1:1 against the menu, and outlines the list itself `0`. The rule draws the preset's 2px
 *   ring, inset (offset minus the width) so a menu's own clipping never cuts it, on that item's
 *   content, only while an ancestor is `:focus-visible`: a pointer click leaves the list focused but
 *   not focus-visible, so hover alone never draws it. Optimus sets no `outline` on the content, so
 *   (0,3,0) wins without `!important`. The panel menu's header takes the same ring when it is the
 *   `:focus-visible` element.
 * - Reduced motion: transitions keep Aura's 0.2s on named properties; reduced motion drops them to
 *   none.
 * - The narrow-layout submenu indicator turns with a hard-coded `transition: transform 0.2s`, not on
 *   `--wj-transition-duration`, from selectors up to (0,5,0): only an important declaration
 *   inside the layer beats them without copying them. The mark still turns, it just does not
 *   animate. Reduced motion also drops the anchored overlays' 300ms keyframes, which a select list
 *   (the pager's rows-per-page list takes no per-instance motion option) otherwise plays. The
 *   overlay's motion reads the computed duration, so it still finishes and leaves the DOM.
 * - Dock tile: Optimus gives `.p-dock-item` no hover rule and no hover token, so the tile takes the
 *   card hover fill. A disabled tile (`.p-disabled`) takes none. Under reduced motion `wj-dock`
 *   already zeroes the tile's transition.
 * - Text buttons: Optimus renders the datepicker's month and year, the fieldset legend, the page
 *   numbers and the step header as `<button>`s with no font rule, so they take the browser's 13.33px
 *   control font. `:where()` has no specificity, so it beats only the browser's own style and any
 *   Optimus class that sets a size or weight still wins. Weight and line height are untouched.
 * - Optimus injects the icon-spin rule unlayered, and an unlayered rule beats any layered one,
 *   so only an important declaration inside the layer stops the button's loading spinner.
 * - wjRipple: Optimus's press handler returns early when the ink is not displayed.
 * - wjAnimateOnScroll: nothing is held or animated. The important beats the inline opacity: 0
 *   that Optimus writes on a held element.
 * - Optimus fades the tooltip bubble in from JavaScript, writing an inline opacity on every
 *   step, so only an important declaration inside the layer shows it fully opaque at once.
 */
export const wjLayerStyles = `
.p-inputtext,.p-textarea,.p-select-label,.p-treeselect-label,.p-cascadeselect-label,.p-multiselect-label,.p-togglebutton-label,.p-button{line-height: 1.5}
.p-rating[aria-invalid='true'] .p-rating-option:not(.p-rating-option-active) .p-rating-icon{color: var(--wj-form-field-invalid-border-color)}
.p-slider .p-slider-handle[aria-invalid='true'],.p-slider:not(.p-disabled) .p-slider-handle[aria-invalid='true']:hover{background: var(--wj-form-field-invalid-border-color)}
.p-knob svg[aria-invalid='true']{box-shadow: 0 0 0 1px var(--wj-form-field-invalid-border-color)}
.p-colorpicker .p-colorpicker-preview[aria-invalid='true']{box-shadow: inset 0 0 0 1px var(--wj-form-field-invalid-border-color)}
:is(.p-inputtext,.p-textarea).p-invalid:enabled:hover,:is(.p-select,.p-multiselect,.p-cascadeselect,.p-treeselect).p-invalid:not(.p-disabled):hover,.p-autocomplete.p-invalid .p-autocomplete-input-multiple:not(.p-disabled):hover,:is(.p-checkbox,.p-radiobutton,.p-toggleswitch).p-invalid.p-invalid:not(.p-disabled):has(input:hover) > :is(.p-checkbox-box,.p-radiobutton-box,.p-toggleswitch-slider){border-color: var(--wj-form-field-invalid-border-color)}
:focus-visible .p-focus > :is(.p-menu-item-content,.p-tieredmenu-item-content,.p-menubar-item-content,.p-megamenu-item-content,.p-contextmenu-item-content,.p-panelmenu-item-content),.p-panelmenu-header:focus-visible > .p-panelmenu-header-content{outline: var(--wj-focus-ring-width) var(--wj-focus-ring-style) var(--wj-focus-ring-color);outline-offset: calc(-1 * var(--wj-focus-ring-width))}
.p-dock-item:not(.p-disabled):hover{background: var(--wj-content-hover-background)}
:where(.p-datepicker-select-month,.p-datepicker-select-year,.p-fieldset-toggle-button,.p-paginator-page,.p-step-header){font-family: inherit;font-size: inherit}
.p-togglebutton.p-togglebutton.p-disabled{opacity: 1;cursor: default;background: var(--wj-togglebutton-disabled-background);border-color: var(--wj-togglebutton-disabled-border-color);color: var(--wj-togglebutton-disabled-color)}
.p-togglebutton.p-togglebutton.p-disabled:not(.p-togglebutton-checked) .p-togglebutton-icon{color: var(--wj-togglebutton-icon-disabled-color)}
.p-togglebutton-checked.p-disabled .p-togglebutton-content{background: var(--wj-togglebutton-disabled-color);color: var(--wj-togglebutton-disabled-background)}
.p-togglebutton-checked.p-disabled.p-disabled .p-togglebutton-icon{color: inherit}
:is(.p-datepicker-day,.p-datepicker-month,.p-datepicker-year).p-disabled{opacity: 1;color: var(--wj-text-muted-color);cursor: default}
@media (prefers-reduced-motion: reduce){
:root,:host{--wj-transition-duration: 0s;--wj-mask-transition-duration: 0s}
.p-progressspinner .p-progressspinner-spin,.p-progressspinner .p-progressspinner-circle{animation: none}
.p-icon-spin{animation: none !important}
.p-ripple > .p-ink{display: none}
.p-animateonscroll{opacity: 1 !important;animation: none !important;transition: none !important}
.p-tooltip{opacity: 1 !important}
:is(.p-menubar-submenu-icon,.p-megamenu-submenu-icon,.p-tieredmenu-submenu-icon,.p-contextmenu-submenu-icon){transition: none !important}
.p-anchored-overlay-enter-active,.p-anchored-overlay-leave-active{animation: none}
}
`;
