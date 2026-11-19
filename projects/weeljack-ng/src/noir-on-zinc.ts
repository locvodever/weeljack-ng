import aura from '@openng/optimus-ui-themes/aura';
import { definePreset } from '@openng/optimus-ui-themes';

/*
 * The default look, "Noir on zinc" (22 Q1-Q3, variant B of the default-look prototype), built on
 * Aura. Everything this file does not name stays Aura. It is two layers:
 *  - `wjAlwaysOn`: the AA corrections and sizing over Aura (22 Q2-Q3), whatever the brand;
 *  - `wjNoirPrimary`: the ink primary (22 Q1), dropped when an app passes its own `primary`, so
 *    Aura's own primary mapping holds.
 * `wjNoirOnZinc` is Aura, then both.
 *
 * Two readers share this file and keep it dependency-light on purpose:
 *  - `provideWeeljack` hands the preset to the one `provideOptimus` call;
 *  - `scripts/check-contrast.mjs` imports it under Node's type stripping to resolve it in both
 *    schemes. So: only erasable TypeScript, imports only from `@openng/*`, no relative imports.
 */

/** Light severity fills move from Aura's 500 to 700 (white text stays AA); hover and active follow. */
function severity700(colour: string) {
  return {
    background: `{${colour}.700}`,
    hoverBackground: `{${colour}.800}`,
    activeBackground: `{${colour}.900}`,
    borderColor: `{${colour}.700}`,
    hoverBorderColor: `{${colour}.800}`,
    activeBorderColor: `{${colour}.900}`,
    color: '#ffffff',
    hoverColor: '#ffffff',
    activeColor: '#ffffff',
    focusRing: { color: `{${colour}.700}`, shadow: 'none' },
  };
}

/**
 * A message severity's text colour step: the text, the outlined text and edge, the simple text and
 * the close-button ring move together, so every variant stays AA on its tint (FR-9).
 */
function messageText(colour: string) {
  return {
    color: colour,
    outlined: { color: colour, borderColor: colour },
    simple: { color: colour },
    closeButton: { focusRing: { color: colour } },
  };
}

const zinc = {
  50: '{zinc.50}',
  100: '{zinc.100}',
  200: '{zinc.200}',
  300: '{zinc.300}',
  400: '{zinc.400}',
  500: '{zinc.500}',
  600: '{zinc.600}',
  700: '{zinc.700}',
  800: '{zinc.800}',
  900: '{zinc.900}',
  950: '{zinc.950}',
};

/**
 * Aura plus the always-on layer: focus ring, 44px controls, AA boundaries and severity fills.
 * Not exported from the root entry: apps never see a raw preset (05 Q3).
 */
export const wjAlwaysOn = definePreset(aura, {
  semantic: {
    // One focus ring on every control: 2px solid primary, 2px offset.
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
      shadow: 'none',
    },
    formField: {
      // 44px controls: 1rem text at line-height 1.5 (24px) + 2 x 9px padding + 2 x 1px border.
      paddingX: '0.875rem',
      paddingY: '0.5625rem',
      // small = 36px (0.875rem / 1.5 = 21px text, 6.5px padding), large = 52px (1.125rem / 1.5 =
      // 27px text, 11.5px padding).
      sm: { fontSize: '0.875rem', paddingX: '0.75rem', paddingY: '0.40625rem' },
      lg: { fontSize: '1.125rem', paddingX: '1rem', paddingY: '0.71875rem' },
      borderRadius: '{border.radius.lg}',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.color}',
        offset: '2px',
        shadow: 'none',
      },
    },
    // 12px on cards, toasts and overlays.
    content: { borderRadius: '{border.radius.xl}' },
    overlay: {
      select: { borderRadius: '{border.radius.xl}' },
      popover: { borderRadius: '{border.radius.xl}' },
      modal: { borderRadius: '{border.radius.xl}' },
    },
    colorScheme: {
      light: {
        // Zinc surfaces: page zinc.50, white cards (surface.0).
        surface: { 0: '#ffffff', ...zinc },
        formField: {
          // AA: control boundaries and the invalid border reach 3:1.
          borderColor: '{surface.500}',
          hoverBorderColor: '{surface.600}',
          invalidBorderColor: '{red.600}',
        },
        error: { color: '{red.700}' },
      },
      dark: {
        formField: {
          borderColor: '{surface.500}',
          hoverBorderColor: '{surface.400}',
          invalidBorderColor: '{red.400}',
        },
        error: { color: '{red.400}' },
      },
    },
  },
  components: {
    button: {
      // Icon-only buttons are as square as their text siblings are tall.
      root: {
        iconOnlyWidth: '2.75rem',
        sm: { iconOnlyWidth: '2.25rem' },
        lg: { iconOnlyWidth: '3.25rem' },
      },
      colorScheme: {
        light: {
          root: {
            info: severity700('sky'),
            success: severity700('green'),
            warn: severity700('orange'),
            help: severity700('purple'),
            danger: severity700('red'),
          },
        },
      },
    },
    tag: { root: { borderRadius: '{border.radius.md}' } },
    checkbox: {
      root: { width: '1.5rem', height: '1.5rem' },
      icon: { size: '1rem' },
    },
    // Aura's own `lg` box and dot, so the radio's hit box reaches 24 px (22 Q3), as `checkbox` does.
    radiobutton: {
      root: { width: '1.5rem', height: '1.5rem' },
      icon: { size: '1rem' },
    },
    // Aura's star is 1rem; 1.5rem makes each option a 24 px hit box (22 Q3).
    rating: { icon: { size: '1.5rem' } },
    toggleswitch: {
      colorScheme: {
        light: {
          root: { background: '{surface.500}', hoverBackground: '{surface.600}' },
        },
        dark: {
          root: { background: '{surface.500}', hoverBackground: '{surface.400}' },
          handle: {
            background: '{surface.100}',
            hoverBackground: '{surface.0}',
            checkedBackground: '{surface.950}',
            checkedHoverBackground: '{surface.950}',
          },
        },
      },
    },
    toast: {
      colorScheme: {
        light: {
          info: { color: '{blue.600}' },
          success: { color: '{green.700}' },
          warn: { color: '{yellow.800}' },
          error: { color: '{red.700}' },
        },
        // Aura's 500 on its own 16% tint reads 3.96:1 (info) and 3.98:1 (error) over a zinc.900
        // card: one step up the scale clears 4.5:1 (W1-display 9.4).
        dark: {
          info: { color: '{blue.400}' },
          error: { color: '{red.400}' },
        },
      },
    },
    // The toast's steps, on the message's own tokens (W5a-feedback FR-9). Aura's 600 text on its
    // 5% tint reads 3.16:1 (success), 2.85:1 (warn) and 4.43:1 (error) over white, and its dark 500
    // text on the 16% tint 3.96:1 (info) and 3.98:1 (error) over a zinc.900 card.
    message: {
      colorScheme: {
        light: {
          success: messageText('{green.700}'),
          warn: messageText('{yellow.800}'),
          error: messageText('{red.700}'),
        },
        dark: {
          info: messageText('{blue.400}'),
          error: messageText('{red.400}'),
        },
      },
    },
    // Aura's light green.500 and yellow.500 strokes read 2.28:1 and 1.92:1 over a white card, under
    // the 3:1 a meaningful graphic needs; one or two steps up clear it. Red, blue and the dark
    // 400s already pass (W5a-feedback FR-9).
    progressspinner: {
      colorScheme: {
        light: { root: { colorThree: '{green.600}', colorFour: '{yellow.700}' } },
      },
    },
    // White on Aura's light 500 fills reads 2.28:1 (success), 2.77:1 (info), 2.80:1 (warn) and
    // 3.76:1 (danger). The button's 700 steps clear 4.5:1 with the text left as Aura has it; the
    // primary, secondary and contrast fills and every dark badge already pass (W5a-feedback FR-9).
    badge: {
      colorScheme: {
        light: {
          success: { background: '{green.700}' },
          info: { background: '{sky.700}' },
          warn: { background: '{orange.700}' },
          danger: { background: '{red.700}' },
        },
      },
    },
    // Aura paints the connector lines with `{content.border.color}`: surface.200, 1.3:1 on white, and
    // surface.700, 1.7:1 on zinc.900. They are the chart's only drawing of what sits under what, so
    // they need 3:1 (WCAG 1.4.11): surface.500 is the smallest step that clears it in both schemes,
    // the step the control boundaries use. The node borders and the toggle ring stay Aura's
    // (W5-effects FR-50).
    organizationchart: { connector: { color: '{surface.500}' } },
    // Aura's light home glyph is surface.400 (zinc.400), 2.56:1 on white, under the 3:1 a graphic
    // that is a link's only visible content needs (WCAG 1.4.11). Rest moves to surface.500 (4.83:1)
    // and hover to surface.700, so the glyph still darkens on hover (Aura's hover is surface.500).
    // Optimus emits a component's `colorScheme.light` before its base tokens, so a light-only key
    // would lose to Aura's base value: the steps sit in the base, and `dark` puts Aura's own dark
    // tokens back (W4-menus-more FR-12).
    breadcrumb: {
      item: { icon: { color: '{surface.500}', hoverColor: '{surface.700}' } },
      colorScheme: {
        dark: {
          item: {
            icon: {
              color: '{navigation.item.icon.color}',
              hoverColor: '{navigation.item.icon.focus.color}',
            },
          },
        },
      },
    },
    /*
     * The toggle button, preset-wide: `wj-selectbutton` renders one per option, and
     * `wj-togglebutton` (w2-forms-choice) renders the same `p-togglebutton` and reads these tokens
     * unchanged. Nothing here is scoped to either entry. Three things differ from Aura (W2-select
     * FR-10, FR-41):
     *
     * 1. Heights 44 / 36 / 52 px, derived as `formField` above: a button is its 1px border twice,
     *    plus `root.padding` (the track, Aura's 0.25rem, kept) and the vertical `content.padding`
     *    (the pill) on each side, around a label at line-height 1.5 (the `.p-togglebutton-label`
     *    rule in `layer-styles.ts`). So `root.padding` + vertical `content.padding` must equal
     *    `formField.paddingY`: default 0.25 + 0.3125 = 0.5625rem (24 + 18 + 2 = 44px), small
     *    0.25 + 0.15625 = 0.40625rem (21 + 13 + 2 = 36px at 0.875rem text), large
     *    0.25 + 0.46875 = 0.71875rem (27 + 23 + 2 = 52px at 1.125rem text). The horizontal
     *    padding stays Aura's 0.75rem.
     * 2. Unpicked text. Aura's light `root.color` is `{surface.500}` on the `{surface.100}` track:
     *    4.40:1, under AA. `{surface.600}` is the smallest step that passes (7.03:1). Hover
     *    (`{surface.700}`, 9.50:1) and dark (`{surface.400}` on `{surface.950}`, 7.76:1) already
     *    pass and stay Aura's.
     * 3. The picked state. Aura's pill (`content.checkedBackground`) is white on the `{surface.100}`
     *    track in light, about 1.1:1, and `{surface.800}` on `{surface.950}` in dark, 1.34:1: the
     *    pick would show only as a slightly darker text. The pill moves to `{surface.500}` in both
     *    schemes, the smallest step that gives the pick 3:1 against the track it sits on
     *    (WCAG 1.4.11: 4.40:1 light, 4.12:1 dark) and 4.5:1 for its text, which is white
     *    (`root.checkedColor` and `icon.checkedColor` `{surface.0}`: 4.83:1). Aura's dark
     *    `checkedColor` is already `{surface.0}`. The track (`root.checkedBackground`,
     *    `root.checkedBorderColor`), the pill's faint shadow, hover and the disabled tokens stay
     *    Aura's: a disabled button keeps `{form.field.disabled.background}` / `.color`.
     *
     * Optimus emits a component's `colorScheme.light` before its base tokens, so a light-only key
     * would lose to a base value, and Aura puts its light colours in `colorScheme.light`: the light
     * steps sit in the base (the browser reads them there), repeated in `colorScheme.light` (the
     * contrast check reads a scheme's tokens after the base, so it would see Aura's otherwise), and
     * `dark` sets the one dark token that differs, the pill (as `breadcrumb` above).
     */
    togglebutton: {
      root: {
        color: '{surface.600}',
        checkedColor: '{surface.0}',
      },
      icon: { checkedColor: '{surface.0}' },
      content: {
        padding: '0.3125rem 0.75rem',
        checkedBackground: '{surface.500}',
        sm: { padding: '0.15625rem 0.75rem' },
        lg: { padding: '0.46875rem 0.75rem' },
      },
      colorScheme: {
        light: {
          root: { color: '{surface.600}', checkedColor: '{surface.0}' },
          icon: { checkedColor: '{surface.0}' },
          content: { checkedBackground: '{surface.500}' },
        },
        dark: { content: { checkedBackground: '{surface.500}' } },
      },
    },
  },
});

/**
 * The noir primary layer (22 Q1): ink primary, a zinc palette in both schemes, and the highlight
 * and tag colours that follow it.
 */
const noirPrimary = {
  semantic: {
    primary: zinc,
    colorScheme: {
      light: {
        primary: {
          color: '{zinc.950}',
          contrastColor: '#ffffff',
          hoverColor: '{zinc.900}',
          activeColor: '{zinc.800}',
        },
        highlight: {
          background: '{zinc.950}',
          focusBackground: '{zinc.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{zinc.50}',
          contrastColor: '{zinc.950}',
          hoverColor: '{zinc.100}',
          activeColor: '{zinc.200}',
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255, 255, 255, .87)',
          focusColor: 'rgba(255, 255, 255, .87)',
        },
      },
    },
  },
  components: {
    tag: {
      colorScheme: {
        light: { primary: { background: '{zinc.900}', color: '#ffffff' } },
        dark: { primary: { background: '{zinc.50}', color: '{zinc.950}' } },
      },
    },
  },
};

/** The default look: Aura, the always-on layer, then the noir primary. What `check:contrast` reads. */
export const wjNoirOnZinc = definePreset(wjAlwaysOn, noirPrimary);
