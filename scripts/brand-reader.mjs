// @ts-check
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Loads the library's own brand code for a script (PRD FR-17), shared by `extract-palettes.mjs`
 * and `a11y-theme-panel.mjs`. `brand.ts` imports `./contrast` and `./noir-on-zinc` without
 * extensions, so Node's type stripping cannot load it. esbuild bundles it in memory, with
 * everything inlined (the `data:` module cannot resolve a bare import), and the result is
 * imported from a `data:` URL. Nothing is written, and no copy of `brandPreset`, the pair list or
 * a palette table exists in any script.
 *
 * `loadPreset(entry)` does the same for one `weeljack-ng/preset-<x>` data module, so a script can
 * hand a preset's value to `brandPreset` (`check-contrast.mjs` reads the same files itself, and
 * its reader is not exported).
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Re-exports only what the scripts read: the brand check, the token reader, `definePreset` (the
 * palette-step generator applies a step explicitly) and Aura's primitives.
 */
const ENTRY = `
export { brandPreset, brandContrastIssues } from './projects/weeljack-ng/src/brand.ts';
export { tokensFor, tokenValue, pairRatio } from './projects/weeljack-ng/src/contrast.ts';
export { definePreset } from '@openng/optimus-ui-themes';
export { default as aura } from '@openng/optimus-ui-themes/aura';
`;

/**
 * @typedef {typeof import('../projects/weeljack-ng/src/brand.ts')} BrandModule
 * @typedef {typeof import('../projects/weeljack-ng/src/contrast.ts')} ContrastModule
 * @typedef {{ definePreset: typeof import('@openng/optimus-ui-themes').definePreset }} PresetModule
 * @typedef {{ aura: { primitive: Record<string, Record<string, string>> } }} AuraModule
 * @typedef {Pick<BrandModule, 'brandPreset' | 'brandContrastIssues'> &
 *   Pick<ContrastModule, 'tokensFor' | 'tokenValue' | 'pairRatio'> & PresetModule & AuraModule} Brand
 */

/** @typedef {import('../projects/weeljack-ng/src/preset.ts').WjPreset} WjPreset */

/** @type {Promise<Brand> | undefined} */
let loaded;

/** @type {Map<string, Promise<WjPreset>>} */
const presets = new Map();

/**
 * The library's brand functions, bundled once per process.
 * @returns {Promise<Brand>}
 */
export function loadBrand() {
  loaded ??= bundle();
  return loaded;
}

/**
 * The one `wj` preset a `weeljack-ng/preset-<x>` entry exports, bundled once per process. Throws,
 * naming the entry, when the module cannot be bundled or is not exactly one preset (an object with
 * a `_base`).
 * @param {string} entry `weeljack-ng/preset-<x>`
 * @returns {Promise<WjPreset>}
 */
export function loadPreset(entry) {
  let preset = presets.get(entry);
  if (preset === undefined) {
    preset = bundlePreset(entry);
    presets.set(entry, preset);
  }
  return preset;
}

/**
 * Bundles a module in memory and imports it from a `data:` URL.
 * @param {Parameters<typeof build>[0]} options
 * @returns {Promise<unknown>}
 */
async function bundleModule(options) {
  const result = await build({
    ...options,
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'error',
  });
  const code = result.outputFiles?.[0]?.text;
  if (code === undefined) {
    throw new Error('esbuild produced no output.');
  }
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

/** @returns {Promise<Brand>} */
async function bundle() {
  return /** @type {Promise<Brand>} */ (
    bundleModule({ stdin: { contents: ENTRY, resolveDir: ROOT, loader: 'ts' } })
  );
}

/** @param {unknown} value @returns {value is WjPreset} */
const isPreset = (value) =>
  typeof value === 'object' &&
  value !== null &&
  '_base' in value &&
  typeof value._base === 'object' &&
  value._base !== null;

/** @param {string} entry @returns {Promise<WjPreset>} */
async function bundlePreset(entry) {
  const folder = /^weeljack-ng\/(preset-[^/]+)$/.exec(entry)?.[1];
  if (folder === undefined) {
    throw new Error(`brand-reader: ${entry} is not a weeljack-ng/preset-<x> entry.`);
  }
  const file = join(ROOT, 'projects', 'weeljack-ng', folder, `${folder}.ts`);
  /** @type {Record<string, unknown>} */
  let exports;
  try {
    exports = /** @type {Record<string, unknown>} */ (await bundleModule({ entryPoints: [file] }));
  } catch (error) {
    throw new Error(
      `brand-reader: cannot load ${entry} (${folder}/${folder}.ts): ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  const names = Object.keys(exports).filter((key) => key.startsWith('wj'));
  const [name] = names;
  const preset = name === undefined ? undefined : exports[name];
  if (names.length !== 1 || !isPreset(preset)) {
    throw new Error(
      `brand-reader: ${entry} must export exactly one 'wj' preset with a _base, found ${String(names.length)} 'wj' export(s).`,
    );
  }
  return preset;
}
