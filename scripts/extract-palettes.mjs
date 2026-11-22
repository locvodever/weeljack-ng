// @ts-check
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBrand } from './brand-reader.mjs';

/**
 * The docs theme panel's palette lists (PRD FR-17, D9). Writes
 * `projects/docs/src/generated/theme-palettes.json` (gitignored), so no contrast code ships to
 * the browser. The library's own AA brand check decides, through `brand-reader.mjs`; the colour
 * values are Aura's primitives. Nothing is typed by hand but the names and their order.
 *
 * - A surface is kept when Noir on it passes both schemes. Zinc (the default) must pass.
 * - A primary is listed at the lightest step of 500, 600, 700 and 800 whose hex passes both
 *   schemes against every kept surface, else it is left out, with each step's first failing pair.
 *
 * Exits 1 when zinc fails, the surface list is empty, or a `check` colour would be under 3:1.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'projects', 'docs', 'src', 'generated', 'theme-palettes.json');

const SURFACES = ['zinc', 'slate', 'gray', 'neutral', 'stone'];
const PRIMARIES = [
  'emerald',
  'green',
  'lime',
  'red',
  'orange',
  'amber',
  'yellow',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
const STEPS = [500, 600, 700, 800];
const SCHEMES = /** @type {const} */ (['light', 'dark']);
const INK = '#09090b';
const WHITE = '#ffffff';

const { brandPreset, brandContrastIssues, pairRatio, aura } = await loadBrand();
const primitive = aura.primitive;

/** @param {string} name */
const label = (name) => name.charAt(0).toUpperCase() + name.slice(1);

/**
 * One palette step's hex, from Aura.
 * @param {string} name
 * @param {number} step
 */
function hexOf(name, step) {
  const hex = primitive[name]?.[String(step)];
  if (hex === undefined) {
    throw new Error(`extract-palettes: Aura has no ${name} ${String(step)}.`);
  }
  return hex;
}

/** The text colour that reads on `swatch`, and that it is at least 3:1. @param {string} swatch */
function checkColour(swatch) {
  const tokens = new Map();
  const onWhite = pairRatio(tokens, WHITE, swatch);
  const onInk = pairRatio(tokens, INK, swatch);
  const [check, ratio] = onWhite >= onInk ? [WHITE, onWhite] : [INK, onInk];
  if (ratio < 3) {
    throw new Error(`extract-palettes: no check colour reaches 3:1 on ${swatch}.`);
  }
  return check;
}

/** @type {{ name: string, label: string, value: string, swatch: string, check: string }[]} */
const surfaces = [];
/** @type {{ kind: string, name: string, reason: string }[]} */
const leftOut = [];
/** @type {string[]} */
const keptSurfaces = [];

for (const name of SURFACES) {
  const issues = brandContrastIssues(brandPreset(undefined, `{${name}}`), SCHEMES);
  if (issues.length === 0) {
    keptSurfaces.push(name);
    if (name !== 'zinc') {
      const swatch = hexOf(name, 500);
      surfaces.push({
        name,
        label: label(name),
        value: `{${name}}`,
        swatch,
        check: checkColour(swatch),
      });
    }
  } else if (name === 'zinc') {
    fail(`zinc (the default surface) fails the brand check: ${issues.join('; ')}`);
  } else {
    leftOut.push({ kind: 'surface', name, reason: `Noir on it: ${issues.join('; ')}` });
  }
}
if (surfaces.length === 0) {
  fail('the surface list is empty.');
}

/** What a step fails, in `brandContrastIssues`' words, or `undefined` when it passes. @param {string} hex */
function failure(hex) {
  /** @type {string | undefined} */
  let first;
  const failing = [];
  for (const surface of keptSurfaces) {
    const issues = brandContrastIssues(brandPreset(hex, `{${surface}}`), SCHEMES);
    if (issues.length > 0) {
      first ??= issues[0];
      failing.push(surface);
    }
  }
  if (first === undefined) {
    return undefined;
  }
  const where = failing.length === keptSurfaces.length ? 'all surfaces' : failing.join(', ');
  return `${first} (${where})`;
}

/** @type {{ name: string, label: string, value: string, step: number, swatch: string, check: string }[]} */
const primaries = [];
for (const name of PRIMARIES) {
  /** @type {string[]} */
  const tried = [];
  let kept = false;
  for (const step of STEPS) {
    const hex = hexOf(name, step);
    const why = failure(hex);
    if (why === undefined) {
      primaries.push({
        name,
        label: label(name),
        value: hex,
        step,
        swatch: hex,
        check: checkColour(hex),
      });
      kept = true;
      break;
    }
    tried.push(`${String(step)} ${hex}: ${why}`);
  }
  if (!kept) {
    leftOut.push({ kind: 'primary', name, reason: tried.join('; ') });
  }
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify({ primaries, surfaces, leftOut }, null, 2)}\n`);

console.log(
  `extract-palettes: primaries kept (${String(primaries.length)}): Noir (default), ${primaries
    .map((row) => `${row.name} ${String(row.step)} ${row.value}`)
    .join(', ')}`,
);
console.log(
  `extract-palettes: surfaces kept (${String(surfaces.length + 1)}): zinc (default), ${surfaces
    .map((row) => row.name)
    .join(', ')}`,
);
for (const row of leftOut) {
  console.log(`extract-palettes: left out ${row.kind} ${row.name}: ${row.reason}`);
}
console.log(`extract-palettes: wrote ${outFile}`);

/** @param {string} message @returns {never} */
function fail(message) {
  console.error(`extract-palettes: ${message}`);
  process.exit(1);
}
