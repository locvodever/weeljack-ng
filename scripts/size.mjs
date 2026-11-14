// @ts-check
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { transformSync } from 'esbuild';
import { ROOT, libraryEntries } from './entries.mjs';

/**
 * `size` (FR-31, 21 Q1-Q2). One row per entry in `size-budgets.json`: the entry's FESM, minified
 * with esbuild and gzipped at level 6, against a limit. Angular, Optimus and the other entries stay
 * external because the FESM is a module that only imports them; nothing is bundled. A wrapper's
 * limit is the larger of a floor and a share of the Optimus entry it wraps, measured the same way
 * from the pinned `node_modules`. `/testing` entries are not shipped to apps and are excluded. No
 * PR raises a limit.
 *
 * @typedef {{ entry: string, optimus: string, note: string }} Row
 * @typedef {{ kb: number, ownKb: number, wrapperFloorKb: number, wrapperShareOfOptimus: number }} Limits
 */

/** @param {string} file @returns {number} gzip-6 bytes of the esbuild-minified module */
function measure(file) {
  if (!existsSync(file)) {
    throw new Error(`size: ${file} does not exist. Run \`npm run build\` first.`);
  }
  const { code } = transformSync(readFileSync(file, 'utf8'), {
    format: 'esm',
    minify: true,
    legalComments: 'none',
    target: 'es2022',
  });
  return gzipSync(code.replace(/\n?\/\/# sourceMappingURL=.*\s*$/, ''), { level: 6 }).length;
}

/** @param {string} entry `weeljack-ng/button` -> its FESM path in `dist` */
function libraryFesm(entry) {
  return join(ROOT, 'dist', 'weeljack-ng', 'fesm2022', `${entry.replaceAll('/', '-')}.mjs`);
}

/** @param {string} name entry folder under `@openng/optimus-ui` -> its FESM path */
function optimusFesm(name) {
  return join(
    ROOT,
    'node_modules',
    '@openng',
    'optimus-ui',
    'fesm2022',
    `openng-optimus-ui-${name}.mjs`,
  );
}

/** @type {{ limits: Limits, entries: Row[] }} */
const budgets = JSON.parse(readFileSync(join(ROOT, 'size-budgets.json'), 'utf8'));
const { limits, entries: rows } = budgets;

// Every shipped entry has a row, and every row has an entry: a new entry cannot skip the gate.
const shipped = libraryEntries().filter((entry) => !entry.endsWith('/testing'));
const covered = rows.map((row) => row.entry);
const unbudgeted = shipped.filter((entry) => !covered.includes(entry));
const stale = covered.filter((entry) => !shipped.includes(entry));
if (unbudgeted.length > 0 || stale.length > 0) {
  console.error(
    `size: size-budgets.json and the entry folders disagree. No row for: ${unbudgeted.join(', ') || '-'}. Row without an entry: ${stale.join(', ') || '-'}.`,
  );
  process.exit(1);
}

const kb = (/** @type {number} */ bytes) => (bytes / limits.kb).toFixed(2);
const results = rows.map((row) => {
  const bytes = measure(libraryFesm(row.entry));
  if (row.optimus === 'own') {
    return { row, bytes, optimusBytes: undefined, limit: limits.ownKb * limits.kb };
  }
  const optimusBytes = measure(optimusFesm(row.optimus));
  const limit = Math.max(
    limits.wrapperFloorKb * limits.kb,
    limits.wrapperShareOfOptimus * optimusBytes,
  );
  return { row, bytes, optimusBytes, limit };
});

const lines = [
  '| Entry | Optimus entry | Optimus gzip | Limit | gzip | Result |',
  '| --- | --- | ---: | ---: | ---: | --- |',
  ...results.map(({ row, bytes, optimusBytes, limit }) => {
    const ok = bytes <= limit;
    return `| \`${row.entry}\` | ${row.optimus} | ${optimusBytes === undefined ? '-' : `${kb(optimusBytes)} KB`} | ${kb(limit)} KB | ${kb(bytes)} KB | ${ok ? 'ok' : 'OVER'} |`;
  }),
];
console.log(lines.join('\n'));

const summary = process.env['GITHUB_STEP_SUMMARY'];
if (summary !== undefined && summary !== '') {
  appendFileSync(summary, `### Bundle size (esbuild minify + gzip-6)\n\n${lines.join('\n')}\n`);
}

const over = results.filter(({ bytes, limit }) => bytes > limit);
if (over.length > 0) {
  console.error(
    `size: over the limit: ${over.map(({ row }) => row.entry).join(', ')}. No PR raises a limit.`,
  );
  process.exit(1);
}
