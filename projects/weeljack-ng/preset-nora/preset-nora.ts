import nora from '@openng/optimus-ui-themes/nora';
import type { WjPreset } from 'weeljack-ng';

/*
 * Nora's own `colorScheme` values are repeated in the component base for every `L` op below: Optimus
 * writes `colorScheme.light` before the base in one rule, so a light value kept only there would
 * lose to the base in the browser while the gate passed it. A dark value never needs the base.
 */

const toastLight = {
  success: { color: '{green.50}' },
  error: { color: '{red.50}' },
  info: { color: '{blue.50}' },
  warn: { color: '{yellow.950}', detailColor: '{yellow.950}' },
};

const messageLight = {
  success: { color: '{green.50}', closeButton: { focusRing: { color: '{green.50}' } } },
  error: { color: '{red.50}', closeButton: { focusRing: { color: '{red.50}' } } },
  warn: { color: '{yellow.950}', closeButton: { focusRing: { color: '{yellow.950}' } } },
};

const tagLight = {
  info: { background: '{sky.700}' },
  warn: { background: '{orange.700}' },
  success: { background: '{green.700}' },
};

const navigationLight = {
  item: {
    focusBackground: '{surface.100}',
    focusColor: '{text.hover.color}',
    icon: { focusColor: '{surface.500}' },
  },
};

const toggleswitchLight = {
  root: { background: '{surface.500}', hoverBackground: '{surface.600}' },
  handle: { background: '{surface.0}', hoverBackground: '{surface.0}' },
};

/** The toggle button's tighter padding, in the base and both schemes (it keeps the 44 px box). */
const togglebuttonPadding = {
  root: { padding: '0.25rem', sm: { padding: '0.25rem' }, lg: { padding: '0.25rem' } },
};

/**
 * Nora's correction look: the contrast, brand and geometry fixes its own tokens need, and nothing
 * for surfaces, radius or motion (Nora keeps its slate and zinc, its 2 px corners and no motion).
 */
const _look = {
  semantic: {
    navigation: navigationLight,
    colorScheme: {
      light: {
        navigation: navigationLight,
        highlight: { background: '{primary.color}', focusBackground: '{primary.hover.color}' },
      },
      dark: {
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            focusColor: '{text.hover.color}',
            icon: { focusColor: '{surface.400}' },
          },
          submenuIcon: { focusColor: '{surface.400}' },
        },
      },
    },
  },
  components: {
    toast: {
      ...toastLight,
      colorScheme: {
        light: toastLight,
        dark: { info: { color: '{blue.950}' }, error: { color: '{red.950}' } },
      },
    },
    message: {
      ...messageLight,
      colorScheme: {
        light: messageLight,
        dark: {
          info: { color: '{blue.950}', closeButton: { focusRing: { color: '{blue.950}' } } },
          error: { color: '{red.950}', closeButton: { focusRing: { color: '{red.950}' } } },
        },
      },
    },
    tag: { ...tagLight, colorScheme: { light: tagLight } },
    slider: {
      track: { background: '{surface.500}' },
      handle: {
        content: { background: '{surface.0}', hoverBackground: '{content.background}' },
      },
      colorScheme: {
        light: {
          track: { background: '{surface.500}' },
          handle: {
            content: { background: '{surface.0}', hoverBackground: '{content.background}' },
          },
        },
        dark: {
          track: { background: '{surface.500}' },
          handle: {
            content: { background: '{surface.950}', hoverBackground: '{content.background}' },
          },
        },
      },
    },
    knob: {
      range: { background: '{surface.500}' },
      colorScheme: {
        light: { range: { background: '{surface.500}' } },
        dark: { range: { background: '{surface.500}' } },
      },
    },
    toggleswitch: { ...toggleswitchLight, colorScheme: { light: toggleswitchLight } },
    button: {
      colorScheme: {
        dark: { root: { danger: { background: '{red.400}', borderColor: '{red.400}' } } },
      },
    },
    badge: { colorScheme: { dark: { danger: { background: '{red.400}' } } } },
    togglebutton: {
      root: { ...togglebuttonPadding.root, checkedBackground: '{surface.100}' },
      colorScheme: {
        light: {
          root: { ...togglebuttonPadding.root, checkedBackground: '{surface.100}' },
        },
        dark: {
          root: {
            ...togglebuttonPadding.root,
            color: '{surface.400}',
            checkedBackground: '{surface.950}',
          },
        },
      },
    },
  },
};

/** The darkest dark step of each named palette that fails on Nora's own dark `{primary.500}`. */
const DARK_STEP: Readonly<Record<string, 300 | 400>> = {
  emerald: 400,
  orange: 400,
  sky: 400,
  fuchsia: 400,
  red: 300,
  blue: 300,
  violet: 300,
  purple: 300,
  pink: 300,
  rose: 300,
  indigo: 300,
  slate: 300,
  gray: 300,
  zinc: 300,
  neutral: 300,
  stone: 300,
};

/** Indigo and the five neutrals also fail the selected rows (4.42 and 4.09) on Nora's dark highlight. */
const DARK_HIGHLIGHT = ['indigo', 'slate', 'gray', 'zinc', 'neutral', 'stone'];

/** Dark rows for the 16 named palettes that fail on Nora; green, lime, amber, yellow, teal and cyan pass. */
function _brand(name: string): object | undefined {
  const step = Object.hasOwn(DARK_STEP, name) ? DARK_STEP[name] : undefined;
  if (step === undefined) {
    return undefined;
  }
  return {
    semantic: {
      colorScheme: {
        dark: {
          primary: {
            color: `{primary.${String(step)}}`,
            hoverColor: `{primary.${String(step - 100)}}`,
            activeColor: `{primary.${String(step - 200)}}`,
          },
          ...(DARK_HIGHLIGHT.includes(name) && {
            highlight: { background: '{primary.color}', focusBackground: '{primary.hover.color}' },
          }),
        },
      },
    },
  };
}

/**
 * Optimus's Nora base with its own emerald, its 2 px corners and no motion, on Nora's own slate
 * and zinc surfaces, under every WeeljackNg guarantee. An app's valid `primary` and its `surface`
 * still apply on top.
 */
export const wjNora: WjPreset = { _base: nora, _look, _primary: '{emerald}', _brand };
