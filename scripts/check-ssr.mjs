// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerenderedPagePaths, startDocsServer } from './serve-docs.mjs';

/**
 * `check:ssr` (FR-30, 16 Q5). Serves the built docs under `/weeljack-ng/` and fails if any
 * exported `wj-*` selector is missing from every prerendered page: a wrapper that does not render
 * on the server shows up here. Exported selectors come from the generated API JSON, which is built
 * from each entry's public API.
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

/**
 * @typedef {{ selector: string }} ApiClassSelector
 * @typedef {{ classes: ApiClassSelector[] }} ApiFile
 */

/** @returns {{ selector: string, search: RegExp }[]} one probe per exported selector */
function exportedSelectors() {
  /** @type {{ selector: string, search: RegExp }[]} */
  const probes = [];
  for (const file of readdirSync(apiDir)) {
    if (!file.endsWith('.json') || file === 'index.json') continue;
    /** @type {ApiFile} */
    const api = JSON.parse(readFileSync(join(apiDir, file), 'utf8'));
    for (const { selector } of api.classes) {
      for (const single of selector.split(',').map((part) => part.trim())) {
        const element = /^([a-z][\w-]*)/.exec(single)?.[1];
        const attribute = /\[([\w-]+)/.exec(single)?.[1];
        if (element?.startsWith('wj-') === true) {
          probes.push({ selector: single, search: new RegExp(`<${element}[\\s>]`, 'i') });
        } else if (attribute?.startsWith('wj') === true) {
          probes.push({ selector: single, search: new RegExp(`\\s${attribute}[\\s=>]`, 'i') });
        }
      }
    }
  }
  return probes;
}

const probes = exportedSelectors();
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

  const missing = probes.filter((probe) => !html.some((page) => probe.search.test(page)));
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
