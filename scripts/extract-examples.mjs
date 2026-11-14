// @ts-check
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Example-source extraction (FR-25, 07 Q7). Every `projects/docs/src/app/examples/<entry>/*.ts`
 * is a real file the docs build type-checks; its text is copied, at build time and never pasted,
 * into `projects/docs/src/generated/examples.json` under the key `<entry>/<file stem>`, which the
 * example's code panel shows.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'projects', 'docs', 'src', 'app', 'examples');
const outFile = join(root, 'projects', 'docs', 'src', 'generated', 'examples.json');

/** @type {Record<string, string>} */
const sources = {};
for (const folder of readdirSync(examplesDir, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  for (const file of readdirSync(join(examplesDir, folder.name)).sort()) {
    if (!file.endsWith('.ts') || file.endsWith('.spec.ts')) continue;
    const text = readFileSync(join(examplesDir, folder.name, file), 'utf8');
    sources[`${folder.name}/${parse(file).name}`] = text.replace(/\r\n/g, '\n');
  }
}

if (Object.keys(sources).length === 0) {
  throw new Error(`extract-examples: no example files under ${examplesDir}.`);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(sources, null, 2)}\n`);
console.log(
  `extract-examples: ${String(Object.keys(sources).length)} file(s) -> ${Object.keys(sources).join(', ')}`,
);
