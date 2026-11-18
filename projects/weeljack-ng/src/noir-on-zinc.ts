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
