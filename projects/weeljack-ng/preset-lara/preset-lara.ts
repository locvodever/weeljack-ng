import lara from '@openng/optimus-ui-themes/lara';
import type { WjPreset } from 'weeljack-ng';

/*
 * Lara's correction layer: 31 token-only ops over the guarantees (ADR 0010). Placement: a light op
 * is written in the component base and in `colorScheme.light`, so the gate's reading and the
 * browser's agree; a dark op only in `colorScheme.dark`; a both-schemes op in all three. It sets
 * no radius, motion, font or surface: Lara's 6 px corners, 0.2 s motion and slate/zinc stay.
 */
const look = {
  semantic: {
    // Group 3, focus ring: Lara's shadow-only ring would be a second ring on the one 2 px outline.
    focusRing: { shadow: 'none' },
    colorScheme: {
      light: { focusRing: { shadow: 'none' } },
      dark: { focusRing: { shadow: 'none' } },
    },
  },
  components: {
    // Group 1, contrast (7 ops). Slider handle: Lara fills the hovered handle with the primary, so the ring
    // on it was 2.57:1 light and 2.46:1 dark; the card colour keeps the ring visible.
    slider: {
      handle: { content: { hoverBackground: '{content.background}' } },
      colorScheme: {
        light: {
          handle: { content: { hoverBackground: '{content.background}' } },
        },
        dark: {
          handle: { content: { hoverBackground: '{content.background}' } },
        },
      },
    },
    // Group 1, contrast. Light tags are 500 fills under white text (2.28:1 to 3.76:1); the smallest AA steps.
    tag: {
      info: { background: '{sky.700}' },
      warn: { background: '{orange.700}' },
      success: { background: '{green.700}' },
      danger: { background: '{red.600}' },
      colorScheme: {
        light: {
          info: { background: '{sky.700}' },
          warn: { background: '{orange.700}' },
          success: { background: '{green.700}' },
          danger: { background: '{red.600}' },
        },
      },
    },
    // Group 1, contrast. The spinner's second colour is sky.500 (2.77:1 on white); one step darker.
    progressspinner: {
      root: { colorTwo: '{sky.600}' },
      colorScheme: {
        light: {
          root: { colorTwo: '{sky.600}' },
        },
      },
    },
    // Group 1 (dark text colour, 2.57:1) and group 2, geometry: Lara's outer padding of 0.625rem 1rem stacks on the
    // shared inner padding, so toggle buttons were 56/44/68 px. Aura's 0.25rem gives 44/36/52 px.
    togglebutton: {
      root: {
        padding: '0.25rem',
        sm: { padding: '0.25rem' },
        lg: { padding: '0.25rem' },
      },
      colorScheme: {
        light: {
          root: {
            padding: '0.25rem',
            sm: { padding: '0.25rem' },
            lg: { padding: '0.25rem' },
          },
        },
        dark: {
          root: {
            color: '{surface.400}',
            padding: '0.25rem',
            sm: { padding: '0.25rem' },
            lg: { padding: '0.25rem' },
          },
        },
      },
    },
    // Group 3, focus ring: the buttons' own shadow rings take the one outline's token.
    button: {
      root: {
        primary: { focusRing: { shadow: '{focus.ring.shadow}' } },
        secondary: { focusRing: { shadow: '{focus.ring.shadow}' } },
        info: { focusRing: { shadow: '{focus.ring.shadow}' } },
        success: { focusRing: { shadow: '{focus.ring.shadow}' } },
        warn: { focusRing: { shadow: '{focus.ring.shadow}' } },
        help: { focusRing: { shadow: '{focus.ring.shadow}' } },
        danger: { focusRing: { shadow: '{focus.ring.shadow}' } },
        contrast: { focusRing: { shadow: '{focus.ring.shadow}' } },
      },
      colorScheme: {
        light: {
          root: {
            primary: { focusRing: { shadow: '{focus.ring.shadow}' } },
            secondary: { focusRing: { shadow: '{focus.ring.shadow}' } },
            info: { focusRing: { shadow: '{focus.ring.shadow}' } },
            success: { focusRing: { shadow: '{focus.ring.shadow}' } },
            warn: { focusRing: { shadow: '{focus.ring.shadow}' } },
            help: { focusRing: { shadow: '{focus.ring.shadow}' } },
            danger: { focusRing: { shadow: '{focus.ring.shadow}' } },
            contrast: { focusRing: { shadow: '{focus.ring.shadow}' } },
          },
        },
        dark: {
          root: {
            primary: { focusRing: { shadow: '{focus.ring.shadow}' } },
            secondary: { focusRing: { shadow: '{focus.ring.shadow}' } },
            info: { focusRing: { shadow: '{focus.ring.shadow}' } },
            success: { focusRing: { shadow: '{focus.ring.shadow}' } },
            warn: { focusRing: { shadow: '{focus.ring.shadow}' } },
            help: { focusRing: { shadow: '{focus.ring.shadow}' } },
            danger: { focusRing: { shadow: '{focus.ring.shadow}' } },
            contrast: { focusRing: { shadow: '{focus.ring.shadow}' } },
          },
        },
      },
    },
    // Group 3, focus ring: message and toast close buttons carry a severity-coloured shadow ring.
    message: {
      info: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      success: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      warn: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      error: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      secondary: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      contrast: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      colorScheme: {
        light: {
          info: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          success: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          warn: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          error: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          secondary: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          contrast: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
        },
        dark: {
          info: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          success: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          warn: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          error: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          secondary: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          contrast: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
        },
      },
    },
    toast: {
      info: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      success: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      warn: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      error: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      secondary: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      contrast: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
      colorScheme: {
        light: {
          info: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          success: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          warn: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          error: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          secondary: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          contrast: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
        },
        dark: {
          info: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          success: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          warn: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          error: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          secondary: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
          contrast: { closeButton: { focusRing: { shadow: '{focus.ring.shadow}' } } },
        },
      },
    },
  },
};

/**
 * Optimus's Lara with its own emerald, corners and motion, corrected to every WeeljackNg
 * guarantee. An app's `primary` and `surface` apply on top of it.
 */
export const wjLara: WjPreset = { _base: lara, _look: look, _primary: '{emerald}' };
