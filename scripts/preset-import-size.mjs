// @ts-check
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { ROOT, libraryEntries } from './entries.mjs';

/**
 * The preset-import check (ADR 0010, PRD FR-18): which Optimus bases an app pays for through each
 * built entry that carries a preset. For the root and every `weeljack-ng/preset-*` entry, esbuild
 * bundles the entry's FESM from `dist` with `@openng/optimus-ui-themes` bundled and everything else
 * external, so the metafile shows exactly the base folders (`aura`, `lara`, ...) the entry pulls.
 * The gzip of each bundle is printed with no limit (no app-level budget). Packages are reached only
 * through esbuild's resolution, because lint bans `@openng/*` imports in `scripts/`.
 *
 * @typedef {{ entry: string, bases: string[], bytes: number, problems: string[] }} PresetImport
 */

/** The base folders each known bundle may pull; a preset not listed here is only measured. */
const EXPECTED_BASES = new Map([
  ['weeljack-ng', ['aura']],
  ['weeljack-ng/preset-noir', []],
  ['weeljack-ng/preset-aura', ['aura']],
  ['weeljack-ng/preset-lara', ['lara']],
  ['weeljack-ng/preset-material', ['material']],
]);

const THEMES_INPUT = /@openng\/optimus-ui-themes\/dist\/([^/]+)\//;

/** @param {string} entry `weeljack-ng/preset-aura` -> its FESM path in `dist` */
function fesmFor(entry) {
  return join(ROOT, 'dist', 'weeljack-ng', 'fesm2022', `${entry.replaceAll('/', '-')}.mjs`);
}

/** @param {string} entry @returns {Promise<PresetImport>} */
async function measureEntry(entry) {
  const fesm = fesmFor(entry);
  if (!existsSync(fesm)) {
    throw new Error(`size: ${fesm} does not exist. Run \`npm run build\` first.`);
  }
  const { outputFiles, metafile } = await build({
    entryPoints: [fesm],
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    target: 'es2022',
    legalComments: 'none',
    write: false,
    metafile: true,
    logLevel: 'silent',
    outfile: 'out.mjs',
    plugins: [
      {
        name: 'externalise-all-but-themes',
        setup(pluginBuild) {
          pluginBuild.onResolve({ filter: /^[^./]/ }, (args) =>
            args.kind === 'entry-point' || args.path.startsWith('@openng/optimus-ui-themes')
              ? undefined
              : { external: true },
          );
        },
      },
    ],
  });

  const bases = [
    ...new Set(
      Object.keys(metafile.inputs).flatMap((input) => {
        const base = THEMES_INPUT.exec(input.replaceAll('\\', '/'))?.[1];
        return base === undefined ? [] : [base];
      }),
    ),
  ].sort();

  const imported = Object.values(metafile.outputs).flatMap((output) =>
    output.imports.map((item) => item.path),
  );
  const presetImports = imported.filter((path) => /^weeljack-ng\/preset-/.test(path));

  /** @type {string[]} */
  const problems = [];
  const expected = EXPECTED_BASES.get(entry);
  if (expected !== undefined && bases.join(',') !== expected.join(',')) {
    problems.push(`pulls base folder(s) {${bases.join(', ')}}, expected {${expected.join(', ')}}`);
  }
  if (presetImports.length > 0) {
    problems.push(`imports another preset entry: ${presetImports.join(', ')}`);
  }

  const code = outputFiles.map((file) => file.text).join('');
  return { entry, bases, bytes: gzipSync(code, { level: 6 }).length, problems };
}

/** @returns {Promise<PresetImport[]>} the root, then every built `preset-*` entry */
export async function measurePresetImports() {
  const presets = libraryEntries().filter((entry) => entry.startsWith('weeljack-ng/preset-'));
  const results = [];
  for (const entry of ['weeljack-ng', ...presets]) results.push(await measureEntry(entry));
  return results;
}
