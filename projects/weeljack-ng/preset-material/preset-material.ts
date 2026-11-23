import material from '@openng/optimus-ui-themes/material';
import type { WjPreset } from 'weeljack-ng';
// The `.ts` extension is deliberate. `scripts/check-contrast.mjs` loads this file under Node's own
// type stripping, which resolves no extensionless relative import; `rewriteRelativeImportExtensions`
// in `tsconfig.lib.json` lets the compiler accept it and write `.js` into the build.
import { _wjMaterialPaletteSteps } from './palette-steps.ts';

/*
 * `wjMaterial`: Optimus's Material base under every WeeljackNg guarantee (ADR 0010), as data. Two
 * readers share this file, so it stays erasable TypeScript with runtime imports only from
 * `@openng/*` and its own generated table, and it calls no `definePreset`:
 *  - `brandPreset` composes the preset from it for the one `provideOptimus` call;
 *  - `scripts/check-contrast.mjs` imports it under Node's type stripping to resolve it in both
 *    schemes, and `scripts/generate-palette-steps.mjs` bundles it to judge each candidate step.
 * It holds, in the order the builder stacks them:
 *  - `_look`: 82 correction ops over Material, each checked against its tokens: contrast (37),
 *    brand (4), geometry (5) and focus (36), plus 17 ring-colour ops. `L` ops write the base and
 *    `colorScheme.light`, `l` only `colorScheme.light`, `D` only `colorScheme.dark`, `B` all three.
 *  - `_primary`: Material's own emerald. Its step, and the light step of every named palette, come
 *    from the generated table through `_brand`.
 *  - `_brand`: the light step per palette, the dark step of the five palettes that need one, and
 *    the dark slider and knob value.
 *  - `_css`: the three things no token reaches.
 */

/**
 * The one 2 px ring, as tokens. Material hard-codes `width: 0`, `style: none` and `color: unset` on
 * 17 components. The 82 ops fix the width and the style; the colour is a further op for each of the
 * 17, because an `unset` colour leaves the ring's `outline` shorthand invalid, so no ring is drawn.
 */
const ring = {
  width: '{focus.ring.width}',
  style: '{focus.ring.style}',
  color: '{focus.ring.color}',
};

const look = {
  semantic: {
    focusRing: { shadow: 'none' },
    colorScheme: {
      light: {
        highlight: { color: '{primary.color}', focusColor: '{primary.color}' },
        focusRing: { shadow: 'none' },
      },
      dark: { focusRing: { shadow: 'none' } },
    },
  },
  components: {
    accordion: {
      header: { focusRing: ring },
      colorScheme: {
        light: { header: { focusRing: ring } },
        dark: { header: { focusRing: ring } },
      },
    },
    autocomplete: {
      dropdown: { focusRing: ring },
      colorScheme: {
        light: { dropdown: { focusRing: ring } },
        dark: { dropdown: { focusRing: ring } },
      },
    },
    badge: {
      success: { background: '{green.800}' },
      info: { background: '{sky.800}' },
      warn: { color: '{surface.950}' },
      colorScheme: {
        light: {
          success: { background: '{green.800}' },
          info: { background: '{sky.800}' },
          warn: { color: '{surface.950}' },
        },
        dark: { danger: { background: '{red.300}' } },
      },
    },
    button: {
      root: {
        success: { background: '{green.800}' },
        info: { background: '{sky.800}' },
        warn: { color: '{surface.950}', hoverColor: '{surface.950}', activeColor: '{surface.950}' },
        paddingY: '{form.field.padding.y}',
      },
      colorScheme: {
        light: {
          root: {
            success: { background: '{green.800}' },
            info: { background: '{sky.800}' },
            warn: {
              color: '{surface.950}',
              hoverColor: '{surface.950}',
              activeColor: '{surface.950}',
            },
            paddingY: '{form.field.padding.y}',
          },
        },
        dark: { root: { danger: { background: '{red.300}' }, paddingY: '{form.field.padding.y}' } },
      },
    },
    carousel: {
      indicator: { focusRing: ring },
      colorScheme: {
        light: { indicator: { focusRing: ring } },
        dark: { indicator: { focusRing: ring } },
      },
    },
    checkbox: {
      root: { focusRing: ring },
      colorScheme: { light: { root: { focusRing: ring } }, dark: { root: { focusRing: ring } } },
    },
    chip: {
      removeIcon: { focusRing: { shadow: '{focus.ring.shadow}' } },
      colorScheme: {
        light: { removeIcon: { focusRing: { shadow: '{focus.ring.shadow}' } } },
        dark: { removeIcon: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      },
    },
    datepicker: {
      dropdown: { focusRing: ring },
      colorScheme: {
        light: { dropdown: { focusRing: ring } },
        dark: { dropdown: { focusRing: ring } },
      },
    },
    fieldset: {
      legend: { focusRing: ring },
      colorScheme: {
        light: { legend: { focusRing: ring } },
        dark: { legend: { focusRing: ring } },
      },
    },
    megamenu: {
      mobileButton: { focusRing: ring },
      colorScheme: {
        light: { mobileButton: { focusRing: ring } },
        dark: { mobileButton: { focusRing: ring } },
      },
    },
    menubar: {
      mobileButton: { focusRing: ring },
      colorScheme: {
        light: { mobileButton: { focusRing: ring } },
        dark: { mobileButton: { focusRing: ring } },
      },
    },
    message: {
      info: { color: '{blue.800}', outlined: { color: '{blue.800}' } },
      success: { color: '{green.800}', outlined: { color: '{green.800}' } },
      warn: {
        color: '{yellow.950}',
        outlined: { color: '{yellow.950}' },
        closeButton: { focusRing: { color: '{yellow.950}' } },
      },
      error: { color: '{red.800}' },
      colorScheme: {
        light: {
          info: { color: '{blue.800}', outlined: { color: '{blue.800}' } },
          success: { color: '{green.800}', outlined: { color: '{green.800}' } },
          warn: {
            color: '{yellow.950}',
            outlined: { color: '{yellow.950}' },
            closeButton: { focusRing: { color: '{yellow.950}' } },
          },
          error: { color: '{red.800}' },
        },
        dark: { error: { color: '{red.300}' } },
      },
    },
    progressspinner: {
      root: { colorFour: '{yellow.950}' },
      colorScheme: { light: { root: { colorFour: '{yellow.950}' } } },
    },
    radiobutton: {
      root: { focusRing: ring },
      colorScheme: { light: { root: { focusRing: ring } }, dark: { root: { focusRing: ring } } },
    },
    rating: {
      root: { focusRing: ring },
      colorScheme: { light: { root: { focusRing: ring } }, dark: { root: { focusRing: ring } } },
    },
    slider: {
      handle: {
        content: { hoverBackground: '{content.background}', background: '{surface.0}' },
        focusRing: ring,
      },
      colorScheme: {
        light: {
          handle: {
            content: { hoverBackground: '{content.background}', background: '{surface.0}' },
            focusRing: ring,
          },
        },
        dark: {
          handle: {
            content: { hoverBackground: '{content.background}', background: '{surface.950}' },
            focusRing: ring,
          },
        },
      },
    },
    stepper: {
      stepHeader: { focusRing: ring },
      colorScheme: {
        light: { stepHeader: { focusRing: ring } },
        dark: { stepHeader: { focusRing: ring } },
      },
    },
    tabs: {
      tab: { focusRing: ring },
      tabpanel: { focusRing: ring },
      navButton: { focusRing: ring },
      colorScheme: {
        light: {
          tab: { focusRing: ring },
          tabpanel: { focusRing: ring },
          navButton: { focusRing: ring },
        },
        dark: {
          tab: { focusRing: ring },
          tabpanel: { focusRing: ring },
          navButton: { focusRing: ring },
        },
      },
    },
    tag: {
      info: { background: '{sky.800}' },
      warn: { color: '{surface.950}' },
      success: { background: '{green.800}' },
      danger: { background: '{red.700}' },
      colorScheme: {
        light: {
          info: { background: '{sky.800}' },
          warn: { color: '{surface.950}' },
          success: { background: '{green.800}' },
          danger: { background: '{red.700}' },
        },
      },
    },
    toast: {
      success: { color: '{green.800}' },
      error: { color: '{red.800}' },
      warn: { color: '{yellow.950}' },
      info: { color: '{blue.800}' },
      colorScheme: {
        light: {
          success: { color: '{green.800}' },
          error: { color: '{red.800}' },
          warn: { color: '{yellow.950}' },
          info: { color: '{blue.800}' },
        },
        dark: {
          info: { color: '{surface.0}', detailColor: '{surface.0}' },
          error: { color: '{surface.0}' },
          warn: { color: '{surface.950}', detailColor: '{surface.950}' },
          success: { detailColor: '{surface.0}' },
        },
      },
    },
    togglebutton: {
      root: {
        padding: '0.25rem',
        sm: { padding: '0.25rem' },
        lg: { padding: '0.25rem' },
        focusRing: ring,
      },
      colorScheme: {
        dark: {
          root: {
            color: '{surface.400}',
            checkedBackground: '{surface.950}',
            padding: '0.25rem',
            sm: { padding: '0.25rem' },
            lg: { padding: '0.25rem' },
            focusRing: ring,
          },
        },
        light: {
          root: {
            padding: '0.25rem',
            sm: { padding: '0.25rem' },
            lg: { padding: '0.25rem' },
            focusRing: ring,
          },
        },
      },
    },
    toggleswitch: {
      root: { height: '1.5rem', focusRing: ring },
      colorScheme: {
        light: { root: { height: '1.5rem', focusRing: ring } },
        dark: { root: { height: '1.5rem', focusRing: ring } },
      },
    },
  },
};

/**
 * A named palette's dark `primary.color` step, where Material's own mapping fails the gate: the
 * lightest white-on-dark pairing that passes on all five surfaces. Hover and active are one and two
 * steps lighter, never below 50. The rest keep Material's own dark mapping.
 */
const darkSteps: Readonly<Record<string, number>> = {
  red: 300,
  pink: 300,
  indigo: 200,
  violet: 200,
  purple: 200,
};

/**
 * The slider's range and the knob's value arc in dark. The brand branch paints them
 * `{primary.200}`, which falls under 3:1 on Material's dark track for 200 of 440 palette and
 * surface pairs (worst 1.98); `{surface.50}` clears every pair, for a hex or a scale too (worst 4.54).
 */
const darkRange = '{surface.50}';

/** A step as a primary token, held to Material's lightest and darkest step. */
const step = (value: number) => `{primary.${String(Math.min(950, Math.max(50, value)))}}`;

/**
 * The layer a primary colour adds on Material (`name` is `''` for a hex or a scale): its light step
 * from the generated table, in the shape the root's brand branch writes it (hover and active one
 * and two steps darker, held at 950), its dark step, and the dark range value. It is merged after
 * the root's own brand layer, so Material's step replaces Aura's for every named palette.
 */
function brand(name: string): object {
  const light = Object.hasOwn(_wjMaterialPaletteSteps, name)
    ? _wjMaterialPaletteSteps[name]
    : undefined;
  const dark = Object.hasOwn(darkSteps, name) ? darkSteps[name] : undefined;
  return {
    semantic: {
      colorScheme: {
        ...(light && {
          light: {
            primary: {
              color: step(light),
              hoverColor: step(light + 100),
              activeColor: step(light + 200),
            },
            highlight: { color: step(light + 100), focusColor: step(light + 100) },
          },
        }),
        ...(dark && {
          dark: {
            primary: {
              color: step(dark),
              hoverColor: step(dark - 100),
              activeColor: step(dark - 200),
            },
          },
        }),
      },
    },
    components: {
      slider: { colorScheme: { dark: { range: { background: darkRange } } } },
      knob: { colorScheme: { dark: { value: { background: darkRange } } } },
    },
  };
}

/*
 * The layer CSS, written for WeeljackNg, after `wjLayerStyles` in the root's `css`. Optimus writes
 * each Material component's own css after it, in the same `@layer wj`, so an equal specificity
 * loses and every rule here out-ranks the rule it beats. No CSS comment goes inside the string:
 * it ships. The specificities are (ids, classes, elements):
 * - Focus halos. Material draws a faint halo on keyboard focus, 1.14 to 1.28:1, so the one 2 px
 *   ring is the only focus mark. Each rule clears the box-shadow on the focused control and leaves
 *   the hover halo alone.
 *   - Checkbox and radio button: the root with its own input focus-visible, (0,5,0) over Material's
 *     (0,4,0), checked or not.
 *   - Toggle switch: the handle, (0,7,0) over (0,6,0) when checked. It keeps the resting elevation,
 *     so the rule restates it: Material Design's 2dp elevation, in our own notation.
 *   - Slider handle: (0,6,0) over (0,5,0), the focus-and-hover rule.
 *   - Rating option: (0,3,0) over (0,2,0).
 *   - Carousel indicator button: (0,4,0) over (0,3,0), the active indicator.
 * - Filled variant. Material sets `outline: 0 none` on the focused filled field of input text,
 *   textarea, select, multiselect, cascadeselect, treeselect and the autocomplete's chips input at
 *   (0,4,0) and (0,5,0). Each rule here draws the outlined variant's ring, from the preset's ring
 *   variables, at (0,5,0) and (0,6,0).
 * - Hovered invalid filled field. Material draws a filled field's edge as an underline gradient, not a
 *   border, and its hover rule (0,4,0) swaps the invalid gradient for the hover one, so a hovered
 *   invalid field loses its invalid look (`wjLayerStyles`' border rule has nothing to keep there).
 *   The rule puts the invalid colour back in both layers at (0,5,0) for the text fields and
 *   (0,5,0) to (0,6,0) for the selects and the chips input, from the one invalid-border variable.
 * - Datepicker. Material sets `outline: 0 none` on the dropdown button and on the month and year
 *   buttons at (0,2,0), which removes their ring. The rule restores it at (0,3,0).
 * - Checkbox mark. Material draws the check with `:before`, sized for an 18 px box. For the 24 px
 *   box, the three size variables and `left` centre it: the variables at (0,2,0) over (0,1,0), the
 *   `:before` rule at (0,3,1) over (0,2,1). Under reduced motion the mark takes its drawn state
 *   with no animation: the animation alone sets the mark's size, so it is restated.
 */
const css = `
.p-checkbox.p-checkbox:not(.p-disabled):has(.p-checkbox-input:focus-visible),.p-radiobutton.p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:focus-visible){box-shadow: none}
.p-toggleswitch.p-toggleswitch.p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:focus-visible) .p-toggleswitch-handle{box-shadow: 0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%)}
.p-slider.p-slider:not(.p-disabled) .p-slider-handle.p-slider-handle:focus-visible{box-shadow: none}
.p-rating .p-rating-option.p-focus-visible{box-shadow: none}
.p-carousel-indicator.p-carousel-indicator .p-carousel-indicator-button:focus-visible{box-shadow: none}
:is(.p-inputtext,.p-textarea).p-variant-filled.p-variant-filled:enabled:focus,:is(.p-select,.p-multiselect,.p-cascadeselect,.p-treeselect).p-variant-filled.p-variant-filled:not(.p-disabled).p-focus,.p-autocomplete.p-autocomplete:not(.p-disabled).p-focus .p-variant-filled.p-autocomplete-input-multiple{outline: var(--wj-focus-ring-width) var(--wj-focus-ring-style) var(--wj-focus-ring-color);outline-offset: var(--wj-focus-ring-offset)}
:is(.p-inputtext,.p-textarea).p-variant-filled.p-invalid:enabled:hover,:is(.p-select,.p-multiselect,.p-cascadeselect,.p-treeselect).p-variant-filled.p-invalid:not(.p-disabled):hover,.p-autocomplete.p-invalid .p-variant-filled.p-autocomplete-input-multiple:not(.p-disabled):hover{background-image: linear-gradient(var(--wj-form-field-invalid-border-color),var(--wj-form-field-invalid-border-color)),linear-gradient(var(--wj-form-field-invalid-border-color),var(--wj-form-field-invalid-border-color))}
:is(.p-datepicker-dropdown,.p-datepicker-select-month,.p-datepicker-select-year):not(:disabled):focus-visible{outline: var(--wj-focus-ring-width) var(--wj-focus-ring-style) var(--wj-focus-ring-color);outline-offset: var(--wj-focus-ring-offset)}
.p-checkbox.p-checkbox{--p-md-check-icon-t: 13px;--p-md-check-icon-w: 8px;--p-md-check-icon-h: 16px}
.p-checkbox.p-checkbox-checked .p-checkbox-box:before{left: 3.5px}
@media (prefers-reduced-motion: reduce){
.p-checkbox.p-checkbox-checked .p-checkbox-box:before{animation: none;width: var(--p-md-check-icon-w);height: var(--p-md-check-icon-h);border-color: var(--wj-checkbox-icon-checked-color);transform: translate3d(0, calc(-1 * var(--p-md-check-icon-h)), 0) rotate(45deg)}
}
`;

/**
 * Optimus's Material base under every WeeljackNg guarantee, with its own emerald at Material's AA
 * step and Material's 4 px corners. An app's valid `primary` and its `surface` still apply on top.
 */
export const wjMaterial: WjPreset = {
  _base: material,
  _look: look,
  _primary: '{emerald}',
  _brand: brand,
  _css: css,
};
