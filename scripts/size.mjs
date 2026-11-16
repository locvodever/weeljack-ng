// @ts-check
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { transformSync } from 'esbuild';
import { ROOT, libraryEntries } from './entries.mjs';

/**
 * `size` (FR-31, 21 Q1-Q2). One budget per shipped entry: the entry's FESM, minified with esbuild
 * and gzipped at level 6, against a limit. An entry named like an Optimus entry needs no row (it
 * wraps that entry); `size-budgets.json` rows cover the root, `private` and other own entries. Angular, Optimus and the other entries stay
 * external because the FESM is a module that only imports them; nothing is bundled. A wrapper's
 * limit is the larger of a floor and a share of the Optimus entry it wraps, measured the same way
 * from the pinned `node_modules`. `/testing` entries are not shipped to apps and are excluded. The
 * limits change only by Loc's call (21; on 2026-11-16 the floor went 1.5 -> 2.5 KB and own entries
 * 3.2 -> 5 KB); no family PR raises one.
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

// A shipped entry without a row wraps the same-named Optimus entry (`weeljack-ng/<x>` ->
// `@openng/optimus-ui/<x>`), so a new wrapper adds no row. An own entry (no such Optimus entry)
// must have one. A row without an entry is stale.
const shipped = libraryEntries().filter((entry) => !entry.endsWith('/testing'));
const stale = rows.map((row) => row.entry).filter((entry) => !shipped.includes(entry));
if (stale.length > 0) {
  console.error(`size: size-budgets.json has a row without an entry: ${stale.join(', ')}.`);
  process.exit(1);
}

/** @param {string} entry @returns {Row} the row, or the default for a same-named wrapper */
function rowFor(entry) {
  const explicit = rows.find((row) => row.entry === entry);
  if (explicit !== undefined) return explicit;
  const name = entry.replace(/^weeljack-ng\//, '');
  if (name === entry || name.includes('/') || !existsSync(optimusFesm(name))) {
    throw new Error(
      `size: own entry \`${name}\` needs a row in size-budgets.json (no \`@openng/optimus-ui/${name}\` to default to).`,
    );
  }
  return { entry, optimus: name, note: `Default: wraps @openng/optimus-ui/${name}.` };
}

const budgeted = [];
const missing = [];
for (const entry of shipped) {
  try {
    budgeted.push(rowFor(entry));
  } catch (error) {
    missing.push(error instanceof Error ? error.message : String(error));
  }
}
if (missing.length > 0) {
  console.error(missing.join('\n'));
  process.exit(1);
}

const kb = (/** @type {number} */ bytes) => (bytes / limits.kb).toFixed(2);
const results = budgeted.map((row) => {
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
