// @ts-check
import { readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIBRARY = join(ROOT, 'projects', 'weeljack-ng');

/**
 * Every entry point of the library, found by its `ng-package.json`: `weeljack-ng` for the root and
 * `weeljack-ng/<folder>` for a secondary entry (`weeljack-ng/button/testing` included). Shared by
 * `size` and `check:pack`, so both judge the same set.
 * @returns {string[]} sorted entry names
 */
export function libraryEntries() {
  /** @type {string[]} */
  const entries = [];
  /** @param {string} dir */
  const walk = (dir) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.name === 'node_modules') continue;
      if (item.isDirectory()) {
        walk(join(dir, item.name));
      } else if (item.name === 'ng-package.json') {
        const folder = relative(LIBRARY, dir).split(sep).join('/');
        entries.push(folder === '' ? 'weeljack-ng' : `weeljack-ng/${folder}`);
      }
    }
  };
  walk(LIBRARY);
  return entries.sort();
}
