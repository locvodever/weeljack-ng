// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerenderedPagePaths, startDocsServer } from './serve-docs.mjs';
import { missingProbes, probesFor } from './ssr-probes.mjs';

/** @typedef {import('./ssr-probes.mjs').ApiFile} ApiFile
 * @typedef {import('./ssr-probes.mjs').FileProbes} FileProbes */

/**
 * `check:ssr` (FR-30, 16 Q5). Serves the built docs under `/weeljack-ng/` and fails if any
 * exported `wj-*` selector is missing from every prerendered page: a wrapper that does not render
 * on the server shows up here. Exported selectors come from the generated API JSON, which is built
 * from each entry's public API. A slot selector on `ng-template` is covered when a component
 * selector of the same API file is (`ssr-probes.mjs`).
 */
const apiDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'projects',
  'docs',
  'src',
  'generated',
  'api',
);

/** @returns {FileProbes[]} one probe set per generated API file */
function exportedSelectors() {
  return readdirSync(apiDir)
    .filter((file) => file.endsWith('.json') && file !== 'index.json')
    .map((file) =>
      probesFor(/** @type {ApiFile} */ (JSON.parse(readFileSync(join(apiDir, file), 'utf8')))),
    );
}

const files = exportedSelectors();
const probes = files.flatMap((file) => file.own);
const paths = prerenderedPagePaths();
if (probes.length === 0 || paths.length === 0) {
  console.error(
    `check:ssr: nothing to check (${String(probes.length)} selector(s), ${String(paths.length)} page(s)). Run \`npm run build:docs\` first.`,
  );
  process.exit(1);
}

const server = await startDocsServer();
try {
  /** @type {string[]} */
  const html = [];
  for (const path of paths) {
    const response = await fetch(`${server.origin}${path}`);
    if (!response.ok) {
      throw new Error(`check:ssr: ${path} answered HTTP ${String(response.status)}.`);
    }
    html.push(await response.text());
  }

  const missing = missingProbes(files, html);
  if (missing.length > 0) {
    console.error(
      `check:ssr: ${String(missing.length)} exported selector(s) are on no prerendered page:\n  ${missing.map((probe) => probe.selector).join('\n  ')}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `check:ssr: ${String(probes.length)} exported selector(s) found across ${String(paths.length)} prerendered page(s): ${probes.map((probe) => probe.selector).join(', ')}`,
    );
  }
} finally {
  await server.close();
}
