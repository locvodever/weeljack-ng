import { definePreset, palette, type ColorScale } from '@openng/optimus-ui-themes';
import { pairRatio, tokensFor } from './contrast';
import { _wjNoir, wjGuarantees } from './noir-on-zinc';
import { _wjPaletteSteps } from './palette-steps';
import type { WjPreset } from './preset';

/**
 * A brand colour scale (05 Q3): a `#rgb` / `#rrggbb` base or a `{palette}` name such as
 * `{indigo}`, which becomes the palette's own 50-950 scale (in light its `primary.color` takes the
 * palette's lightest WCAG AA step, e.g. indigo 600, sky 700), or a full scale with every step from
 * 50 to 950 (and an optional `0`). A hex base or a full scale is used exactly as given. Any other
 * string is ignored and logs `WJ0200` in dev mode.
 */
export type WjColorScale =
  | string
  | {
      readonly 0?: string;
      readonly 50: string;
      readonly 100: string;
      readonly 200: string;
      readonly 300: string;
      readonly 400: string;
      readonly 500: string;
      readonly 600: string;
      readonly 700: string;
      readonly 800: string;
      readonly 900: string;
      readonly 950: string;
    };

/** One layer `definePreset` takes. `WjPreset`'s fields are opaque `object`s, so a layer is narrowed here. */
type Layer = Parameters<typeof definePreset>[number];
const isLayer = (value: object | undefined): value is Layer => value !== undefined;

const COLOUR = /^(#([\da-f]{3}){1,2}|\{[\w-]+\})$/i;
type Surface = WjColorScale | { light: WjColorScale; dark: WjColorScale } | undefined;

const sides = (surface: Surface) =>
  typeof surface === 'object' && 'light' in surface ? surface : { light: surface, dark: surface };

/** The brand options whose string is not a colour, as `option 'value'`. */
export function badColours(primary: WjColorScale | undefined, surface: Surface) {
  const { light, dark } = sides(surface);
  const bad = (name: string, value: WjColorScale | undefined) =>
    typeof value === 'string' && !COLOUR.test(value) ? [`${name} '${value}'`] : [];
  return [...bad('primary', primary), ...bad('surface.light', light), ...bad('surface.dark', dark)];
}

/** A usable scale, or `undefined` for an invalid string, which falls back to the default. */
function toScale(input: WjColorScale | undefined): ColorScale | undefined {
  if (typeof input !== 'string') {
    return input;
  }
  // The pattern admits only what `palette()` turns into a scale; its `string` arm is for a bare name.
  return COLOUR.test(input) ? (palette(input) as ColorScale) : undefined;
}

/**
 * The preset for the app's brand, before the layer styles, stacked in this order: the preset's
 * Optimus base, `wjGuarantees` (the AA corrections every preset shares), the preset's look, then
 * the colour or the ink, the preset's `_brand` layer, then the app's `surface` per scheme. `preset` defaults to Noir.
 *
 * The colour is the app's `primary` when it is valid, else the preset's own `_primary`; an invalid
 * app primary falls back to the preset's colour, then to its `_ink`. With a colour, the primary
 * layer is the brand layer: the scale, its light AA step, and the slider range and knob value arc
 * as ink (`{surface.950}`) in light and the colour's 200 step in dark, so they clear 3:1 on the
 * `{surface.500}` track for every named palette. With no colour it is the preset's ink (Noir keeps
 * its ink primary there). With no arguments the result is exactly the default look.
 */
export function brandPreset(
  primary: WjColorScale | undefined,
  surface: Surface,
  preset: WjPreset = _wjNoir,
): ReturnType<typeof definePreset> {
  const own = toScale(primary);
  const colour = own === undefined ? preset._primary : primary;
  const brand = own ?? toScale(preset._primary);
  // A `{name}` colour takes its AA step in light, from the generated table (own keys only).
  const name = typeof colour === 'string' && colour.startsWith('{') ? colour.slice(1, -1) : '';
  const step = Object.hasOwn(_wjPaletteSteps, name) ? _wjPaletteSteps[name] : undefined;
  const primaryLayer =
    brand === undefined
      ? preset._ink
      : {
          semantic: {
            primary: brand,
            // Spread (here and in the surface below), never `light: undefined`: `definePreset`
            // would let that wipe Aura's whole scheme.
            ...(step && {
              colorScheme: {
                light: {
                  primary: {
                    color: `{primary.${String(step)}}`,
                    hoverColor: `{primary.${String(step + 100)}}`,
                    activeColor: `{primary.${String(step + 200)}}`,
                  },
                },
              },
            }),
          },
          // Aura paints the slider range and the knob value arc `{primary.color}`, which fails 3:1
          // on the `{surface.500}` track for every named primary. The light value sits in the
          // component base, never in `colorScheme.light`: Optimus 2.0.2 writes `colorScheme.light`
          // before the base in one rule, so there it would lose to Aura's base `{primary.color}` in
          // the browser while the gate passed it (`noir-on-zinc.ts`'s breadcrumb does the same). Ink,
          // because no primary step passes every palette in light (`{primary.950}` fails cyan, sky
          // and teal). `{primary.200}` in dark: the most saturated step that clears 3:1 on every
          // palette (worst 3.18); `{primary.300}` fails 100 of 220 rows.
          components: {
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
  // A preset without `_look`, `_ink` or `_brand` just has no such layer: there is no branch per
  // field. `_brand(name)` comes after the colour or the ink and before the app's `surface`.
  const base = definePreset(
    ...[preset._base, wjGuarantees, preset._look, primaryLayer, preset._brand?.(name)].filter(
      isLayer,
    ),
  );
  if (surface === undefined) {
    return base;
  }
  const [one, two] = [toScale(sides(surface).light), toScale(sides(surface).dark)];
  return definePreset(base, {
    semantic: {
      colorScheme: {
        ...(one && { light: { surface: { 0: '#ffffff', ...one } } }),
        ...(two && { dark: { surface: { 0: '#ffffff', ...two } } }),
      },
    },
  });
}

/**
 * The four brand pairs of 22 Q5 (the gate's list is longer), by preset token: foreground,
 * background (a function of the scheme's card surface) and the ratio each needs.
 */
const BRAND_PAIRS = [
  ['button.primary.color', 'button.primary.background', 4.5],
  ['focus.ring.color', 'card', 3],
  ['form.field.border.color', 'form.field.background', 3],
  ['form.field.placeholder.color', 'form.field.background', 4.5],
] as const;

/**
 * Brand pairs under their WCAG AA ratio in the resolved `preset`, as readable fragments. Reads
 * preset tokens only, never the DOM. Throws when a colour cannot be parsed.
 */
export function brandContrastIssues(preset: unknown, schemes: readonly ('light' | 'dark')[]) {
  const issues: string[] = [];
  for (const scheme of schemes) {
    const tokens = tokensFor(preset, scheme);
    for (const [foreground, background, need] of BRAND_PAIRS) {
      const card = scheme === 'light' ? 'surface.0' : 'content.background';
      const value = pairRatio(tokens, foreground, background === 'card' ? card : background);
      if (value < need) {
        issues.push(
          `--wj-${foreground.replaceAll('.', '-')} (${scheme}) is ${value.toFixed(2)}:1, needs ${String(need)}:1`,
        );
      }
    }
  }
  return issues;
}
