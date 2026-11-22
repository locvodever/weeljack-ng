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

/** @type {Promise<Brand> | undefined} */
let loaded;

/**
 * The library's brand functions, bundled once per process.
 * @returns {Promise<Brand>}
 */
export function loadBrand() {
  loaded ??= bundle();
  return loaded;
}

/** @returns {Promise<Brand>} */
async function bundle() {
  const result = await build({
    stdin: { contents: ENTRY, resolveDir: ROOT, loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'error',
  });
  const code = result.outputFiles[0]?.text;
  if (code === undefined) {
    throw new Error('brand-reader: esbuild produced no output.');
  }
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return /** @type {Promise<Brand>} */ (import(url));
}
