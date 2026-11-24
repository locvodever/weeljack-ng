// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import linker from '@angular/compiler-cli/linker/babel';
import { build } from 'esbuild';
import { ROOT } from './entries.mjs';

/**
 * The tree-shake check (ADR 0008, PRD FR-17): what an app pays for `WjIcon` plus one icon, measured
 * the way an app build produces it. The built `weeljack-ng/icon` FESM is partial-compiled, so it is
 * first run through Angular's linker (`@babel/core` is a dependency of `@angular/compiler-cli`, which
 * the workspace already installs), the step every app build applies to library code. esbuild then
 * bundles a virtual app entry against the linked code with `ngDevMode` false and Angular and `tslib`
 * external, and the same minify + gzip-6 method as `size.mjs` measures it. The count of generated icon
 * objects proves the other 79 were dropped.
 */

/**
 * The `@babel/core` the linker was built against: a dependency of `@angular/compiler-cli`, resolved
 * from it, so the plugin and the transform agree (the workspace root may hoist another version).
 * @type {typeof import('../node_modules/@angular/compiler-cli/node_modules/@babel/core')}
 */
const babel = createRequire(
  createRequire(import.meta.url).resolve('@angular/compiler-cli/package.json'),
)('@babel/core');

/** What an app that draws one icon imports. */
const APP = `import { WjIcon, wjIconPlus } from './icon-linked.mjs';
console.log(WjIcon, wjIconPlus);
`;

/** A property literal only a generated icon constant carries, not the component. */
const ICON_MARKER = 'viewBox:"0 0 24 24"';

/**
 * The limit, in bytes: 1.15 KB. An app pays the linked code with the dev-only metadata stripped, not
 * the partial FESM. The PRD goal was about 1 KB, but the seven tags measure about 1.1 KB here, and
 * two tags would be needed to get under 1 KB (probe, 2026-11-22: 7 tags 1127 B, 4 tags 1058 B, 2 tags
 * 962 B, path only 920 B). Set to the measured bytes plus at most 51 B (the raise rule's 0.05 KB).
 */
export const ICON_IMPORT_LIMIT = 1178;

/** @returns {Promise<{ bytes: number, icons: number }>} gzip-6 bytes of the bundle and how many icon objects it holds */
export async function measureIconImport() {
  const fesm = join(ROOT, 'dist', 'weeljack-ng', 'fesm2022', 'weeljack-ng-icon.mjs');
  if (!existsSync(fesm)) {
    throw new Error(`size: ${fesm} does not exist. Run \`npm run build\` first.`);
  }
  const result = await babel.transformAsync(readFileSync(fesm, 'utf8'), {
    filename: fesm,
    plugins: [linker],
    sourceMaps: false,
    babelrc: false,
    configFile: false,
  });
  if (result?.code === null || result?.code === undefined) {
    throw new Error('size: the Angular linker produced no code for weeljack-ng-icon.mjs.');
  }
  const { outputFiles } = await build({
    stdin: { contents: APP, resolveDir: ROOT, sourcefile: 'app.mjs', loader: 'js' },
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    target: 'es2022',
    legalComments: 'none',
    write: false,
    logLevel: 'silent',
    define: { ngDevMode: 'false' },
    external: ['@angular/*', 'tslib'],
    plugins: [
      {
        name: 'linked-icon',
        setup(pluginBuild) {
          pluginBuild.onResolve({ filter: /^\.\/icon-linked\.mjs$/ }, () => ({
            path: 'icon-linked.mjs',
            namespace: 'linked',
          }));
          pluginBuild.onLoad({ filter: /.*/, namespace: 'linked' }, () => ({
            contents: result.code ?? '',
            loader: 'js',
            resolveDir: ROOT,
          }));
        },
      },
    ],
  });
  const code = outputFiles.map((file) => file.text).join('');
  return { bytes: gzipSync(code, { level: 6 }).length, icons: code.split(ICON_MARKER).length - 1 };
}
