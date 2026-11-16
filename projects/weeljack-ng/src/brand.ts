import { definePreset, palette, type ColorScale } from '@openng/optimus-ui-themes';
import { pairRatio, tokensFor } from './contrast';
import { wjAlwaysOn, wjNoirOnZinc } from './noir-on-zinc';

/**
 * A brand colour scale (05 Q3): a `#rrggbb` base, which becomes a 50-950 scale with the base on
 * 500, or a full scale with every step from 50 to 950 (and an optional `0`).
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

function toScale(input: WjColorScale): ColorScale {
  if (typeof input !== 'string') {
    return input;
  }
  // `palette()` is typed `string | ColorScale` but returns a scale for a hex; a throw is the app's.
  const scale = palette(input);
  if (typeof scale === 'string') {
    throw new Error(`provideWeeljack: '${input}' is not a colour scale`);
  }
  return scale;
}

/**
 * The preset for the app's brand, before the layer styles: Aura, the always-on AA layer, then
 * either the noir primary or the app's own `primary`, then the app's `surface` per scheme.
 * With neither option it is exactly the default look.
 */
export function brandPreset(
  primary: WjColorScale | undefined,
  surface: WjColorScale | { light: WjColorScale; dark: WjColorScale } | undefined,
): ReturnType<typeof definePreset> {
  const base =
    primary === undefined
      ? wjNoirOnZinc
      : definePreset(wjAlwaysOn, { semantic: { primary: toScale(primary) } });
  if (surface === undefined) {
    return base;
  }
  const { light, dark } =
    typeof surface === 'object' && 'light' in surface ? surface : { light: surface, dark: surface };
  return definePreset(base, {
    semantic: {
      colorScheme: {
        light: { surface: { 0: '#ffffff', ...toScale(light) } },
        dark: { surface: { 0: '#ffffff', ...toScale(dark) } },
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
