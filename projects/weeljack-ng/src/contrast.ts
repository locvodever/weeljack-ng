/*
 * WCAG contrast math over an Optimus preset: the colour parser, the token flattener and `{a.b}`
 * resolver, and the ratio. One module, three readers: `scripts/check-contrast.mjs` (the gate),
 * the dev-mode brand warning in `brand.ts`, and `scripts/extract-theme.mjs` (the docs page), through `scripts/contrast-rows.mjs`.
 *
 * Optimus 2.0.2 writes each tier's `colorScheme.light` before its base in one rule that applies in
 * both schemes, then the dark rule. So a light value in `colorScheme.light` loses to the base in
 * the browser, and a light-only token applies in dark too. `tokensFor` follows that order.
 *
 * Erasable TypeScript only, and no imports at all (not even relative ones), so Node's type
 * stripping loads it from a script. Nothing here touches the DOM or a browser global. Unused
 * exports tree-shake out of the root FESM.
 */

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A preset token map: dotted path -> raw value (`{a.b}` references unresolved). */
type Tokens = Map<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `contrastColor` -> `contrast.color`: the dotted path Optimus derives its variables from. */
const dotted = (key: string): string => key.replace(/([a-z0-9])([A-Z])/g, '$1.$2').toLowerCase();

/** Flattens `tree` into `tokens` under `prefix`. */
function flatten(tokens: Tokens, prefix: string, tree: unknown): void {
  if (!isRecord(tree)) {
    return;
  }
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === '' ? dotted(key) : `${prefix}.${dotted(key)}`;
    if (isRecord(value)) {
      flatten(tokens, path, value);
    } else if (typeof value === 'string' || typeof value === 'number') {
      tokens.set(path, String(value));
    }
  }
}

/**
 * Adds a component's tokens: its `root` sits directly under the component name, any other group
 * under `<component>.<group>`.
 */
function flattenComponent(tokens: Tokens, name: string, tree: unknown): void {
  if (!isRecord(tree)) {
    return;
  }
  for (const [group, value] of Object.entries(tree)) {
    if (group === 'colorScheme' || group === 'css' || group === 'extend') {
      continue;
    }
    flatten(tokens, group === 'root' ? name : `${name}.${dotted(group)}`, value);
  }
}

/**
 * Every token `preset` paints for one scheme, in the order Optimus 2.0.2 emits them, as dotted
 * path -> raw value. Semantic: base, light, base again (the base wins in light and keeps its
 * insertion position), then dark in dark. Component: light, base, then dark in dark.
 */
export function tokensFor(preset: unknown, scheme: 'light' | 'dark'): Tokens {
  const tokens: Tokens = new Map();
  if (!isRecord(preset)) {
    throw new Error('contrast: the preset is not an object');
  }
  flatten(tokens, '', preset['primitive']);

  const semantic = preset['semantic'];
  if (isRecord(semantic)) {
    const { colorScheme, ...rest } = semantic;
    const schemes: Record<string, unknown> = isRecord(colorScheme) ? colorScheme : {};
    flatten(tokens, '', rest);
    flatten(tokens, '', schemes['light']);
    flatten(tokens, '', rest);
    if (scheme === 'dark') {
      flatten(tokens, '', schemes['dark']);
    }
  }

  const components = preset['components'];
  if (isRecord(components)) {
    for (const [name, component] of Object.entries(components)) {
      const schemes: Record<string, unknown> =
        isRecord(component) && isRecord(component['colorScheme']) ? component['colorScheme'] : {};
      flattenComponent(tokens, name, schemes['light']);
      flattenComponent(tokens, name, component);
      if (scheme === 'dark') {
        flattenComponent(tokens, name, schemes['dark']);
      }
    }
  }
  return tokens;
}

/** Resolves `{a.b}` references to a plain CSS colour string. */
function resolve(tokens: Tokens, value: string, trail: string[] = []): string {
  return value.replace(/\{([^}]+)\}/g, (_match, path: string) => {
    const next = tokens.get(path);
    if (next === undefined) {
      throw new Error(`contrast: unresolved token {${path}} (via ${trail.join(' > ')})`);
    }
    if (trail.includes(path)) {
      throw new Error(`contrast: circular token {${path}}`);
    }
    return resolve(tokens, next, [...trail, path]);
  });
}

/** Parses `#rrggbb`, `rgba(r, g, b, a)` and `color-mix(in srgb, <colour>, transparent N%)`. */
function parseColour(css: string): Rgba {
  const text = css.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(text);
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(text);
  if (rgba?.[1] !== undefined && rgba[2] !== undefined && rgba[3] !== undefined) {
    return {
      r: Number(rgba[1]) / 255,
      g: Number(rgba[2]) / 255,
      b: Number(rgba[3]) / 255,
      a: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }
  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s*,\s*transparent\s+([\d.]+)%\s*\)$/i.exec(text);
  if (mix?.[1] !== undefined && mix[2] !== undefined) {
    const colour = parseColour(mix[1]);
    return { ...colour, a: colour.a * (1 - Number(mix[2]) / 100) };
  }
  throw new Error(`contrast: cannot parse the colour '${css}'`);
}

/** sRGB composite of `top` over an opaque `bottom`. */
const over = (top: Rgba, bottom: Rgba): Rgba => ({
  r: top.r * top.a + bottom.r * (1 - top.a),
  g: top.g * top.a + bottom.g * (1 - top.a),
  b: top.b * top.a + bottom.b * (1 - top.a),
  a: 1,
});

const linear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (c: Rgba): number =>
  0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);

/** The WCAG contrast ratio between two opaque colours. */
function ratio(a: Rgba, b: Rgba): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A pair end (a literal `#rrggbb` or the dotted path of a preset token) as a resolved CSS colour
 * string. Also what the docs generator prints for a pair's colours.
 */
export function tokenValue(tokens: Tokens, end: string): string {
  if (end.startsWith('#')) {
    return end;
  }
  const raw = tokens.get(end);
  if (raw === undefined) {
    throw new Error(`contrast: no token '${end}' in the preset`);
  }
  return resolve(tokens, raw, [end]);
}

const colourOf = (tokens: Tokens, end: string): Rgba => parseColour(tokenValue(tokens, end));

/**
 * The contrast ratio of `foreground` on `background` (each a literal `#rrggbb` or a token path).
 * A translucent background composites over `layer` (default white), then a translucent foreground
 * over that.
 */
export function pairRatio(
  tokens: Tokens,
  foreground: string,
  background: string,
  layer?: string,
): number {
  const base = layer === undefined ? undefined : colourOf(tokens, layer);
  const bg = colourOf(tokens, background);
  const bgOpaque = bg.a < 1 ? over(bg, base ?? { r: 1, g: 1, b: 1, a: 1 }) : bg;
  const fg = colourOf(tokens, foreground);
  const fgOpaque = fg.a < 1 ? over(fg, bgOpaque) : fg;
  return ratio(fgOpaque, bgOpaque);
}
