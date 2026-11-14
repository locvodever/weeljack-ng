// @ts-check
/**
 * `npm run check:contrast` (FR-29, 22 Q5 (1)): resolves the default preset, "Noir on zinc", in
 * both schemes and fails any pair under 4.5:1 (text) or 3:1 (non-text).
 *
 * Made permanent from the default-look prototype's `22-contrast-check.mjs` (variant B pair list).
 * Where the prototype listed hand-copied hex values, every pair here names the preset token that
 * paints it, so a change to the preset is what gets checked, not a copy of it.
 *
 * Imports the preset source directly under Node's type stripping, so that file stays
 * erasable-TypeScript with `@openng/*` imports only.
 */
import { wjNoirOnZinc } from '../projects/weeljack-ng/src/noir-on-zinc.ts';

const TEXT = 4.5;
const NON_TEXT = 3;

/** @typedef {{ r: number, g: number, b: number, a: number }} Rgba */
/** @typedef {[name: string, foreground: string, background: string, need: number, layer?: string]} Pair */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `contrastColor` -> `contrast.color`: the dotted path Optimus derives its variables from. */
const dotted = (/** @type {string} */ key) =>
  key.replace(/([a-z0-9])([A-Z])/g, '$1.$2').toLowerCase();

/**
 * Flattens `tree` into `tokens` under `prefix`.
 * @param {Map<string, string>} tokens
 * @param {string} prefix
 * @param {unknown} tree
 */
function flatten(tokens, prefix, tree) {
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
 * Adds a component's tokens: its `root` sits directly under the component name, any other
 * group under `<component>.<group>`.
 * @param {Map<string, string>} tokens
 * @param {string} name
 * @param {unknown} tree
 */
function flattenComponent(tokens, name, tree) {
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
 * Every token the preset defines for one scheme, as dotted path -> raw value.
 * @param {'light' | 'dark'} scheme
 * @returns {Map<string, string>}
 */
function tokensFor(scheme) {
  const preset = /** @type {unknown} */ (wjNoirOnZinc);
  const tokens = new Map();
  if (!isRecord(preset)) {
    throw new Error('check-contrast: the preset is not an object');
  }
  flatten(tokens, '', preset['primitive']);

  const semantic = preset['semantic'];
  if (isRecord(semantic)) {
    const { colorScheme, ...rest } = semantic;
    flatten(tokens, '', rest);
    if (isRecord(colorScheme)) {
      flatten(tokens, '', colorScheme[scheme]);
    }
  }

  const components = preset['components'];
  if (isRecord(components)) {
    for (const [name, component] of Object.entries(components)) {
      flattenComponent(tokens, name, component);
      if (isRecord(component) && isRecord(component['colorScheme'])) {
        flattenComponent(tokens, name, component['colorScheme'][scheme]);
      }
    }
  }
  return tokens;
}

/**
 * Resolves `{a.b}` references to a plain CSS colour string.
 * @param {Map<string, string>} tokens
 * @param {string} value
 * @param {string[]} [trail]
 * @returns {string}
 */
function resolve(tokens, value, trail = []) {
  return value.replace(/\{([^}]+)\}/g, (_match, /** @type {string} */ path) => {
    const next = tokens.get(path);
    if (next === undefined) {
      throw new Error(`check-contrast: unresolved token {${path}} (via ${trail.join(' > ')})`);
    }
    if (trail.includes(path)) {
      throw new Error(`check-contrast: circular token {${path}}`);
    }
    return resolve(tokens, next, [...trail, path]);
  });
}

/**
 * Parses `#rrggbb`, `rgba(r, g, b, a)` and `color-mix(in srgb, <colour>, transparent N%)`.
 * @param {string} css
 * @returns {Rgba}
 */
function parseColour(css) {
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
  throw new Error(`check-contrast: cannot parse the colour '${css}'`);
}

/** sRGB composite of `top` over an opaque `bottom`. */
const over = (/** @type {Rgba} */ top, /** @type {Rgba} */ bottom) => ({
  r: top.r * top.a + bottom.r * (1 - top.a),
  g: top.g * top.a + bottom.g * (1 - top.a),
  b: top.b * top.a + bottom.b * (1 - top.a),
  a: 1,
});

const linear = (/** @type {number} */ c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const luminance = (/** @type {Rgba} */ c) =>
  0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);

function ratio(/** @type {Rgba} */ a, /** @type {Rgba} */ b) {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A pair end is a literal `#rrggbb` or the dotted path of a preset token.
 * @param {Map<string, string>} tokens
 * @param {string} end
 * @returns {Rgba}
 */
function colourOf(tokens, end) {
  if (end.startsWith('#')) {
    return parseColour(end);
  }
  const raw = tokens.get(end);
  if (raw === undefined) {
    throw new Error(`check-contrast: no token '${end}' in the preset`);
  }
  return parseColour(resolve(tokens, raw, [end]));
}

/** @type {Record<'light' | 'dark', Pair[]>} */
const PAIRS = {
  light: [
    ['body text', 'text.color', 'surface.0', TEXT],
    ['muted/hint text on cards', 'text.muted.color', 'surface.0', TEXT],
    ['muted text on the page', 'text.muted.color', 'surface.50', TEXT],
    ['primary button', 'button.primary.color', 'button.primary.background', TEXT],
    ['primary button hover', 'button.primary.hover.color', 'button.primary.hover.background', TEXT],
    [
      'primary button active',
      'button.primary.active.color',
      'button.primary.active.background',
      TEXT,
    ],
    ['focus ring on cards', 'focus.ring.color', 'surface.0', NON_TEXT],
    ['focus ring on the page', 'focus.ring.color', 'surface.50', NON_TEXT],
    ['field border', 'form.field.border.color', 'form.field.background', NON_TEXT],
    ['checkbox border', 'checkbox.border.color', 'checkbox.background', NON_TEXT],
    ['checkbox check', 'checkbox.icon.checked.color', 'checkbox.checked.background', NON_TEXT],
    ['switch off track', 'toggleswitch.background', 'surface.0', NON_TEXT],
    [
      'switch handle on track',
      'toggleswitch.handle.background',
      'toggleswitch.background',
      NON_TEXT,
    ],
    ['placeholder', 'form.field.placeholder.color', 'form.field.background', TEXT],
    ['invalid border', 'form.field.invalid.border.color', 'form.field.background', NON_TEXT],
    ['error text', 'error.color', 'surface.0', TEXT],
    ['success button', 'button.success.color', 'button.success.background', TEXT],
    ['info button', 'button.info.color', 'button.info.background', TEXT],
    ['warn button', 'button.warn.color', 'button.warn.background', TEXT],
    ['danger button', 'button.danger.color', 'button.danger.background', TEXT],
    ['secondary button', 'button.secondary.color', 'button.secondary.background', TEXT],
    ['outlined secondary button text', 'button.outlined.secondary.color', 'surface.0', TEXT],
    ['tag info', 'tag.info.color', 'tag.info.background', TEXT],
    ['tag warn', 'tag.warn.color', 'tag.warn.background', TEXT],
    ['tag secondary', 'tag.secondary.color', 'tag.secondary.background', TEXT],
    ['tag success', 'tag.success.color', 'tag.success.background', TEXT],
    ['tag danger', 'tag.danger.color', 'tag.danger.background', TEXT],
    ['toast success summary', 'toast.success.color', 'toast.success.background', TEXT, 'surface.0'],
    ['toast error summary', 'toast.error.color', 'toast.error.background', TEXT, 'surface.0'],
    ['toast warn summary', 'toast.warn.color', 'toast.warn.background', TEXT, 'surface.0'],
    ['toast info summary', 'toast.info.color', 'toast.info.background', TEXT, 'surface.0'],
    ['selected option', 'list.option.selected.color', 'list.option.selected.background', TEXT],
  ],
  dark: [
    ['body text', 'text.color', 'content.background', TEXT],
    ['muted text on cards', 'text.muted.color', 'content.background', TEXT],
    ['muted text on the page', 'text.muted.color', 'surface.950', TEXT],
    ['primary button', 'button.primary.color', 'button.primary.background', TEXT],
    ['primary button hover', 'button.primary.hover.color', 'button.primary.hover.background', TEXT],
    [
      'primary button active',
      'button.primary.active.color',
      'button.primary.active.background',
      TEXT,
    ],
    ['focus ring on cards', 'focus.ring.color', 'content.background', NON_TEXT],
    ['field border on the field', 'form.field.border.color', 'form.field.background', NON_TEXT],
    ['field border around the field', 'form.field.border.color', 'content.background', NON_TEXT],
    ['checkbox check', 'checkbox.icon.checked.color', 'checkbox.checked.background', NON_TEXT],
    ['switch off track', 'toggleswitch.background', 'content.background', NON_TEXT],
    [
      'switch handle on track',
      'toggleswitch.handle.background',
      'toggleswitch.background',
      NON_TEXT,
    ],
    ['placeholder', 'form.field.placeholder.color', 'form.field.background', TEXT],
    ['invalid border', 'form.field.invalid.border.color', 'form.field.background', NON_TEXT],
    ['error text', 'error.color', 'content.background', TEXT],
    ['success button', 'button.success.color', 'button.success.background', TEXT],
    ['danger button', 'button.danger.color', 'button.danger.background', TEXT],
    ['secondary button', 'button.secondary.color', 'button.secondary.background', TEXT],
    ['tag success', 'tag.success.color', 'tag.success.background', TEXT, 'content.background'],
    [
      'selected option',
      'list.option.selected.color',
      'list.option.selected.background',
      TEXT,
      'content.background',
    ],
  ],
};

let failures = 0;
for (const scheme of /** @type {const} */ (['light', 'dark'])) {
  const tokens = tokensFor(scheme);
  console.log(`\n## Noir on zinc, ${scheme}`);
  for (const [name, foreground, background, need, layer] of PAIRS[scheme]) {
    const base = layer === undefined ? undefined : colourOf(tokens, layer);
    const bg = colourOf(tokens, background);
    const bgOpaque = bg.a < 1 ? over(bg, base ?? { r: 1, g: 1, b: 1, a: 1 }) : bg;
    const fg = colourOf(tokens, foreground);
    const fgOpaque = fg.a < 1 ? over(fg, bgOpaque) : fg;
    const value = ratio(fgOpaque, bgOpaque);
    const ok = value >= need;
    if (!ok) {
      failures += 1;
    }
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${value.toFixed(2).padStart(5)}:1  (need ${String(need)})  ${name}`,
    );
  }
}

console.log(`\nFAIL rows: ${String(failures)}`);
if (failures > 0) {
  process.exit(1);
}
