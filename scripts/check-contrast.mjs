// @ts-check
/**
 * `npm run check:contrast` (FR-29, 22 Q5 (1); ADR 0010, PRD FR-19): resolves every WeeljackNg
 * preset in both schemes and fails any pair under 4.5:1 (text) or 3:1 (non-text), and any ring that
 * is not the one 2 px focus ring.
 *
 * Made permanent from the default-look prototype's `22-contrast-check.mjs` (variant B pair list).
 * Where the prototype listed hand-copied hex values, every pair here names the preset token that
 * paints it, so a change to the preset is what gets checked, not a copy of it.
 *
 * The pair list and its evaluation live in `contrast-rows.mjs`, which the docs page's generator
 * (`extract-theme.mjs`) reads too, so the page shows exactly what this gate checks.
 *
 * PRESETS are found by discovery, so a new preset entry needs no edit here. Noir, the default,
 * resolves with no `preset` argument and takes Aura's primitives from `loadBrand()`;
 * `weeljack-ng/preset-noir` maps to it. Every other `weeljack-ng/preset-*` entry from
 * `libraryEntries()` is read from its data module (`preset-<x>/preset-<x>.ts`) by a computed file
 * URL under Node's type stripping, as its one `wj`-prefixed export. It is never imported
 * statically, which would make `tsc -p tsconfig.scripts.json` resolve `weeljack-ng`. A preset that
 * cannot be read (no module, a module that throws, no single `wj` export, no `_base`) fails the
 * gate with a line naming its entry.
 *
 * Each preset resolves through `brandPreset(primary, surface, preset)`, the builder
 * `provideWeeljack` uses, and runs four sections in light and dark:
 *  (a) alone: the full pair list plus the 4 brand pairs;
 *  (b) its own primary or ink on each of the five surfaces: the same checks;
 *  (c) named palettes: every palette of the preset's base primitives (those with a `500` step) as a
 *      `'{name}'` primary on each of the five surfaces: the same checks, so a future Optimus
 *      palette change fails here, not in an app's console;
 *  (d) ring tokens: every component ring's width and style is the semantic or form-field ring's,
 *      every component ring shadow is `none`, and the semantic ring is 2 px solid with no shadow.
 *      Offsets are placement, not checked.
 * Each failing row, palette or surface counts in `FAIL rows`.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadBrand } from './brand-reader.mjs';
import { contrastRows } from './contrast-rows.mjs';
import { ROOT, libraryEntries } from './entries.mjs';

/** @typedef {import('../projects/weeljack-ng/src/preset.ts').WjPreset} WjPreset */
/** @typedef {'light' | 'dark'} Scheme */
/**
 * `preset` is `undefined` for Noir, the builder's default.
 * @typedef {{ entry: string, name: string, preset: WjPreset | undefined, base: unknown }} Subject
 */

const started = performance.now();
const SCHEMES = /** @type {const} */ (['light', 'dark']);
const SURFACES = ['zinc', 'slate', 'gray', 'neutral', 'stone'];
const NOIR_ENTRY = 'weeljack-ng/preset-noir';

const { brandPreset, brandContrastIssues, tokensFor, tokenValue, pairRatio, aura } =
  await loadBrand();

let failures = 0;
/** One failure counted and its line printed. @param {string} line */
function fail(line) {
  failures += 1;
  console.log(`FAIL  ${line}`);
}

/** @param {unknown} value @returns {value is WjPreset} */
const isPreset = (value) =>
  typeof value === 'object' &&
  value !== null &&
  '_base' in value &&
  typeof value._base === 'object' &&
  value._base !== null;

/**
 * Reads a preset entry's data module and its one `wj` export.
 * @param {string} entry `weeljack-ng/preset-<x>`
 * @returns {Promise<Subject | string>} the preset, or why it is unreadable
 */
async function readPreset(entry) {
  const folder = entry.slice('weeljack-ng/'.length);
  const file = join(ROOT, 'projects', 'weeljack-ng', folder, `${folder}.ts`);
  /** @type {Record<string, unknown>} */
  let exports;
  try {
    exports = await import(pathToFileURL(file).href);
  } catch (error) {
    return `cannot read ${folder}/${folder}.ts: ${error instanceof Error ? error.message : String(error)}`;
  }
  const names = Object.keys(exports).filter((key) => key.startsWith('wj'));
  const [name] = names;
  if (name === undefined || names.length !== 1) {
    return `${folder}/${folder}.ts must export exactly one 'wj' preset, found ${String(names.length)}`;
  }
  const preset = exports[name];
  if (!isPreset(preset)) {
    return `${name} in ${folder}/${folder}.ts is not a preset: it has no _base`;
  }
  return { entry, name, preset, base: preset._base };
}

/**
 * The names of a base's named palettes: its primitives that are objects with a `500` step.
 * @param {unknown} base
 * @returns {string[]}
 */
function paletteNames(base) {
  const primitive =
    typeof base === 'object' && base !== null && 'primitive' in base ? base.primitive : undefined;
  if (typeof primitive !== 'object' || primitive === null) {
    return [];
  }
  return Object.entries(primitive)
    .filter(([, scale]) => typeof scale === 'object' && scale !== null && '500' in scale)
    .map(([name]) => name);
}

/**
 * The failing checks of one resolved look in one scheme: the full pair list and the brand pairs.
 * @param {unknown} resolved
 * @param {Scheme} scheme
 * @param {string} where prefix for each problem, empty for none
 * @returns {{ list: ReturnType<typeof contrastRows>, brand: string[], problems: string[],
 *   tokens: ReturnType<typeof tokensFor> }}
 */
function evaluate(resolved, scheme, where) {
  const prefix = where === '' ? '' : `${where}: `;
  const brand = brandContrastIssues(resolved, [scheme]);
  const problems = brand.map((issue) => `${prefix}${issue}`);
  const list = contrastRows(scheme, resolved);
  for (const row of list) {
    if (!row.pass) {
      problems.push(
        `${prefix}${row.name} is ${row.ratio.toFixed(2)}:1, needs ${String(row.need)}:1`,
      );
    }
  }
  return { list, brand, problems, tokens: tokensFor(resolved, scheme) };
}

/** @param {string} value */
const noInset = (value) => value.replace(/^inset\s+none$/, 'none');

/**
 * A token's resolved value, or `undefined` when the preset has none.
 * @param {ReturnType<typeof tokensFor>} tokens
 * @param {string} path
 */
function valueOf(tokens, path) {
  try {
    return noInset(tokenValue(tokens, path));
  } catch {
    return undefined;
  }
}

/**
 * Section (d): how the preset's rings break the one 2 px focus ring (`ringBreaks`, w14).
 * @param {ReturnType<typeof tokensFor>} tokens
 * @returns {{ checked: number, breaks: string[] }}
 */
function ringBreaks(tokens) {
  const ring = Object.fromEntries(
    ['width', 'style', 'shadow'].map((key) => [key, valueOf(tokens, `focus.ring.${key}`)]),
  );
  const field = Object.fromEntries(
    ['width', 'style', 'shadow'].map((key) => [
      key,
      valueOf(tokens, `form.field.focus.ring.${key}`),
    ]),
  );
  /** @type {string[]} */
  const breaks = [];
  let checked = 0;
  for (const path of tokens.keys()) {
    const match = /^([a-z]+)\.(.*\.)?focus\.ring\.(width|style|shadow)$/.exec(path);
    if (!match || path.startsWith('focus.') || path.startsWith('form.field.')) {
      continue;
    }
    checked += 1;
    const part = match[3] ?? '';
    const value = valueOf(tokens, path);
    const holds =
      part === 'shadow' ? value === 'none' : value === ring[part] || value === field[part];
    if (!holds) {
      breaks.push(`${path}=${String(value)}`);
    }
  }
  if (ring['width'] !== '2px' || ring['style'] !== 'solid' || ring['shadow'] !== 'none') {
    breaks.push(
      `semantic ring is ${String(ring['width'])} ${String(ring['style'])} ${String(ring['shadow'])}, needs 2px solid none`,
    );
  }
  return { checked, breaks };
}

/** @param {Subject} subject */
function checkPreset({ name, preset, base }) {
  const alone = brandPreset(undefined, undefined, preset);

  for (const scheme of SCHEMES) {
    // (a) alone: every pair, row by row.
    const { list, brand } = evaluate(alone, scheme, '');
    console.log(
      `\n## ${name} (a) alone, ${scheme}: ${String(list.length)} pairs and the brand pairs`,
    );
    for (const row of list) {
      if (!row.pass) {
        failures += 1;
      }
      console.log(
        `${row.pass ? 'PASS' : 'FAIL'}  ${row.ratio.toFixed(2).padStart(5)}:1  (need ${String(row.need)})  ${row.name}`,
      );
    }
    for (const issue of brand) {
      fail(`brand pairs: ${issue}`);
    }
  }

  for (const scheme of SCHEMES) {
    // (b) its own primary or ink on each surface.
    console.log(`\n## ${name} (b) own colour on ${SURFACES.join(', ')}, ${scheme}`);
    for (const surface of SURFACES) {
      const { list, problems } = evaluate(
        brandPreset(undefined, `{${surface}}`, preset),
        scheme,
        '',
      );
      if (problems.length > 0) {
        fail(`${surface}  ${problems.join('; ')}`);
      } else {
        console.log(`PASS  ${surface}  ${String(list.length)} pairs and the brand pairs`);
      }
    }
  }

  const palettes = paletteNames(base);
  for (const scheme of SCHEMES) {
    // (c) every named palette on each surface.
    console.log(
      `\n## ${name} (c) named palettes, ${scheme}, on ${SURFACES.join(', ')}: ${String(palettes.length)} palettes`,
    );
    if (palettes.length === 0) {
      fail(`${name}: _base.primitive has no palette with a 500 step`);
    }
    for (const palette of palettes) {
      /** @type {string[]} */
      const problems = [];
      let worst = Infinity;
      for (const surface of SURFACES) {
        const resolved = brandPreset(`{${palette}}`, `{${surface}}`, preset);
        const result = evaluate(resolved, scheme, surface);
        problems.push(...result.problems);
        worst = Math.min(
          worst,
          pairRatio(result.tokens, 'button.primary.color', 'button.primary.background'),
        );
      }
      const hex = tokenValue(
        tokensFor(brandPreset(`{${palette}}`, undefined, preset), scheme),
        'primary.color',
      );
      if (problems.length > 0) {
        fail(
          `${worst.toFixed(2).padStart(5)}:1  {${palette}}  ${scheme} primary.color ${hex}  ${problems.join('; ')}`,
        );
      } else {
        console.log(
          `PASS  ${worst.toFixed(2).padStart(5)}:1  {${palette}}  ${scheme} primary.color ${hex}`,
        );
      }
    }
  }

  for (const scheme of SCHEMES) {
    // (d) ring tokens.
    const { checked, breaks } = ringBreaks(tokensFor(alone, scheme));
    console.log(`\n## ${name} (d) ring tokens, ${scheme}: ${String(checked)} component rings`);
    if (breaks.length > 0) {
      fail(`${breaks.join('; ')}`);
    } else {
      console.log('PASS  one 2px solid ring, no ring shadow');
    }
  }
}

/** The presets: Noir always, then every other `weeljack-ng/preset-*` entry. */
/** @type {Subject[]} */
const subjects = [{ entry: NOIR_ENTRY, name: 'wjNoir', preset: undefined, base: aura }];
const others = libraryEntries().filter(
  (entry) => /^weeljack-ng\/preset-[^/]+$/.test(entry) && entry !== NOIR_ENTRY,
);
for (const entry of others) {
  const read = await readPreset(entry);
  if (typeof read === 'string') {
    console.log(`\n## ${entry}`);
    fail(`${entry}: ${read}`);
  } else {
    subjects.push(read);
  }
}

console.log(`Presets: ${subjects.map(({ name, entry }) => `${name} (${entry})`).join(', ')}`);
for (const subject of subjects) {
  try {
    checkPreset(subject);
  } catch (error) {
    fail(`${subject.entry}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`
FAIL rows: ${String(failures)}
Run time: ${((performance.now() - started) / 1000).toFixed(2)} s`);
if (failures > 0) {
  process.exit(1);
}
