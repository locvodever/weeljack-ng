import aura from '@openng/optimus-ui-themes/aura';
import type { WjPreset } from 'weeljack-ng';

// Slate in both schemes; surface.0 stays white (cards). Aura's own dark surface is zinc.
const slate = {
  0: '#ffffff',
  50: '{slate.50}',
  100: '{slate.100}',
  200: '{slate.200}',
  300: '{slate.300}',
  400: '{slate.400}',
  500: '{slate.500}',
  600: '{slate.600}',
  700: '{slate.700}',
  800: '{slate.800}',
  900: '{slate.900}',
  950: '{slate.950}',
};

const look = {
  semantic: {
    formField: { borderRadius: '{border.radius.md}' }, // fields 6 px
    content: { borderRadius: '{border.radius.lg}' }, // content 8 px
    overlay: {
      select: { borderRadius: '{border.radius.lg}' }, // overlays 8 px
      popover: { borderRadius: '{border.radius.lg}' },
      modal: { borderRadius: '{border.radius.lg}' },
    },
    colorScheme: {
      light: {
        surface: slate,
        // Firmer field borders: slate.600 is 7.58:1 on the card (slate.500 was 4.76:1); hover one
        // step darker.
        formField: { borderColor: '{surface.600}', hoverBorderColor: '{surface.700}' },
      },
      dark: { surface: slate }, // the dark field border stays the shared layer's {surface.500}
    },
  },
  components: {
    tag: { root: { borderRadius: '{border.radius.sm}' } }, // tags 4 px
    card: { root: { borderRadius: '{border.radius.lg}' } }, // card 8 px (Aura's card is its own xl token)
  },
};

const ink = {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    colorScheme: {
      light: {
        // Navy #1e3a8a under white text: 10.36:1 on the card.
        primary: {
          color: '{primary.900}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.900}',
          focusBackground: '{primary.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        // blue.300 under slate.950 text: 11.19:1; the ring is 9.90:1 on the card.
        primary: {
          color: '{primary.300}',
          contrastColor: '{slate.950}',
          hoverColor: '{primary.200}',
          activeColor: '{primary.100}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.300}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.300}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
  components: {
    tag: {
      colorScheme: {
        light: { primary: { background: '{primary.900}', color: '#ffffff' } },
        dark: { primary: { background: '{primary.300}', color: '{slate.950}' } },
      },
    },
    // Aura paints the slider range and the knob value arc `{primary.color}`, which fails 3:1 on
    // the `{surface.500}` track (2.18:1 light, 2.64:1 dark). The light value sits in the component
    // base, never in `colorScheme.light`: Optimus 2.0.2 writes `colorScheme.light` before the base
    // in one rule, so there it would lose to Aura's base `{primary.color}` in the browser while a
    // scheme-first reader passed it (`src/brand.ts` and `noir-on-zinc.ts` do the same). Dark uses
    // `{primary.200}` (blue.200), which clears 3:1 on the dark track.
    slider: {
      range: { background: '{surface.950}' },
      colorScheme: { dark: { range: { background: '{primary.200}' } } },
    },
    knob: {
      value: { background: '{surface.950}' },
      colorScheme: { dark: { value: { background: '{primary.200}' } } },
    },
  },
};

/**
 * Police: built on Aura, a navy primary (blue 900 in light, blue 300 with slate 950 text in dark),
 * slate surfaces in both schemes, firmer light field borders (slate 600) and one step squarer
 * corners. Use it as `provideWeeljack({ preset: wjPolice })` or `WjTheme.setPreset(wjPolice)`.
 * An app's valid `primary` and its `surface` still apply on top.
 */
export const wjPolice: WjPreset = { _base: aura, _look: look, _ink: ink };
