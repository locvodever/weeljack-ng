// @ts-check
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT } from './entries.mjs';
import { evaluate, licenceOf } from './licence-gate.mjs';

/**
 * `check:licences` (FR-33, 18 Q3). Judges the licence of every package that ships: the library's
 * runtime dependency and peer closure, plus every package the docs app's production bundle names
 * (`dist/docs/3rdpartylicenses.txt`, written by `build:docs`). Dev tooling is not gated. Every
 * package here is a root devDependency, so the closure is walked from the library manifest through
 * `node_modules`, the way Node resolves it, instead of reading the lockfile's production set.
 *
 * @typedef {{
 *   name?: string,
 *   version?: string,
 *   license?: unknown,
 *   licenses?: unknown,
 *   dependencies?: Record<string, string>,
 *   peerDependencies?: Record<string, string>,
 *   peerDependenciesMeta?: Record<string, { optional?: boolean }>,
 *   optionalDependencies?: Record<string, string>,
 * }} Manifest
 */

/** @param {string} dir @returns {Manifest} */
function readManifest(dir) {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
}

/**
 * The folder `name` resolves to from `fromDir`: the nearest `node_modules/<name>` upward.
 * @param {string} name
 * @param {string} fromDir
 * @returns {string | undefined}
 */
function resolvePackage(name, fromDir) {
  for (let dir = fromDir; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate);
    if (dirname(dir) === dir) return undefined;
  }
}

/** @type {Map<string, string | undefined>} `name@version` -> licence */
const closure = new Map();
/** @type {Set<string>} package folders already walked */
const seen = new Set();
/** @type {string[]} */
const unresolved = [];

/**
 * @param {string} name
 * @param {string} fromDir
 * @param {boolean} required a missing optional package is skipped, a missing required one reported
 * @param {string} via who asked for it, for the message
 */
function visit(name, fromDir, required, via) {
  const dir = resolvePackage(name, fromDir);
  if (dir === undefined) {
    if (required) unresolved.push(`${name} (required by ${via})`);
    return;
  }
  if (seen.has(dir)) return;
  seen.add(dir);
  const manifest = readManifest(dir);
  const label = `${manifest.name ?? name}@${manifest.version ?? '?'}`;
  closure.set(label, licenceOf(manifest));
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    visit(dependency, dir, true, label);
  }
  for (const dependency of Object.keys(manifest.optionalDependencies ?? {})) {
    visit(dependency, dir, false, label);
  }
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    visit(peer, dir, manifest.peerDependenciesMeta?.[peer]?.optional !== true, label);
  }
}

// 1. The library: what it declares for its consumers.
const library = readManifest(join(ROOT, 'projects', 'weeljack-ng'));
const libraryRoots = [
  ...Object.keys(library.dependencies ?? {}),
  ...Object.keys(library.peerDependencies ?? {}),
];
for (const name of libraryRoots) visit(name, ROOT, true, 'projects/weeljack-ng');
const libraryCount = closure.size;

// 2. The docs app's runtime bundle: every package the production build names.
const bundleList = join(ROOT, 'dist', 'docs', '3rdpartylicenses.txt');
if (!existsSync(bundleList)) {
  console.error(`check:licences: ${bundleList} is missing. Run \`npm run build:docs\` first.`);
  process.exit(1);
}
const bundled = [...readFileSync(bundleList, 'utf8').matchAll(/^Package: (\S+)\s*$/gm)].map(
  (match) => match[1] ?? '',
);
for (const name of bundled) visit(name, ROOT, true, 'dist/docs/3rdpartylicenses.txt');

const { ok, offenders } = evaluate(closure);
if (unresolved.length > 0 || !ok) {
  if (unresolved.length > 0) {
    console.error(
      `check:licences: not installed, so not judged:\n${unresolved.map((p) => `  ${p}`).join('\n')}`,
    );
  }
  if (offenders.length > 0) {
    console.error(
      `check:licences: licence outside MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD:\n${offenders.map((p) => `  ${p}`).join('\n')}`,
    );
  }
  process.exit(1);
}
console.log(
  `check:licences: OK (${String(closure.size)} shipped packages: ${String(libraryCount)} from the library closure, ${String(bundled.length)} named by the docs bundle)`,
);
for (const [nameVersion, licence] of [...closure].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${nameVersion}  ${licence ?? ''}`);
}
