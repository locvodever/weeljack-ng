import aura from '@openng/optimus-ui-themes/aura';
import { definePreset } from '@openng/optimus-ui-themes';

/*
 * The default look, "Noir on zinc" (22 Q1-Q3, variant B of the default-look prototype), built on
 * Aura. Everything this file does not name stays Aura.
 *
 * Two readers share this file and keep it dependency-light on purpose:
 *  - `provideWeeljack` hands it to the one `provideOptimus` call;
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
 * The Optimus preset `provideWeeljack` passes to `provideOptimus`. Not exported from the root
 * entry: apps never see a raw preset (05 Q3).
 */
export const wjNoirOnZinc = definePreset(aura, {
  semantic: {
    // Primary ink: Optimus's noir mapping. The palette itself is zinc in both schemes.
    primary: zinc,
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
        formField: {
          // AA: control boundaries and the invalid border reach 3:1.
          borderColor: '{surface.500}',
          hoverBorderColor: '{surface.600}',
          invalidBorderColor: '{red.600}',
        },
        error: { color: '{red.700}' },
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
    tag: {
      root: { borderRadius: '{border.radius.md}' },
      colorScheme: {
        light: { primary: { background: '{zinc.900}', color: '#ffffff' } },
        dark: { primary: { background: '{zinc.50}', color: '{zinc.950}' } },
      },
    },
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
      },
    },
  },
});
