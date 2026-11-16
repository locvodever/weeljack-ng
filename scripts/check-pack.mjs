// @ts-check
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, libraryEntries } from './entries.mjs';

/**
 * `check:pack` (FR-32, D3). What `npm pack` would put in the tarball must carry the three package
 * files, one `exports` key per entry folder (`./button/testing` and `./private` included), no
 * `@openng/*` in `dependencies`, and `@openng/optimus-ui-locale` (a devDependency the generator
 * reads) in neither `dependencies` nor `peerDependencies`. ng-packagr also writes a
 * `./package.json` key, which is allowed.
 * Run after `npm run build`. Never publishes anything: `--dry-run` only.
 *
 * @typedef {{ files: { path: string }[] }} PackResult
 */
const DIST = join(ROOT, 'dist', 'weeljack-ng');
const LOCALE_PACKAGE = '@openng/optimus-ui-locale';
const REQUIRED_FILES = ['LICENSE', 'THIRD-PARTY-NOTICES.md', 'README.md'];
/** @type {string[]} */
const problems = [];

// A command string (the path is ours), so Windows resolves `npm.cmd` without a deprecated `shell` flag.
const stdout = execSync(`npm pack --dry-run --json "${DIST}"`, {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
/** @type {PackResult[]} */
const [pack] = JSON.parse(stdout);
const packed = new Set((pack?.files ?? []).map((file) => file.path));
for (const file of REQUIRED_FILES) {
  if (!packed.has(file)) problems.push(`the tarball does not list ${file}`);
}

/** @type {{ exports?: Record<string, unknown>, dependencies?: Record<string, string>, peerDependencies?: Record<string, string> }} */
const manifest = JSON.parse(readFileSync(join(DIST, 'package.json'), 'utf8'));
const expectedKeys = new Set([
  './package.json',
  // `weeljack-ng` -> `.`, `weeljack-ng/button` -> `./button`
  ...libraryEntries().map((entry) => entry.replace('weeljack-ng', '.')),
]);
const actualKeys = new Set(Object.keys(manifest.exports ?? {}));
for (const key of expectedKeys) {
  if (!actualKeys.has(key)) problems.push(`exports has no key ${key}`);
}
for (const key of actualKeys) {
  if (!expectedKeys.has(key)) problems.push(`exports has a key with no entry folder: ${key}`);
}
for (const name of Object.keys(manifest.dependencies ?? {})) {
  if (name.startsWith('@openng/')) problems.push(`dependencies holds ${name}`);
}

if (!actualKeys.has('./locale')) problems.push('exports has no ./locale key');
if (LOCALE_PACKAGE in (manifest.dependencies ?? {})) {
  problems.push(`dependencies holds ${LOCALE_PACKAGE}`);
}
if (LOCALE_PACKAGE in (manifest.peerDependencies ?? {})) {
  problems.push(`peerDependencies holds ${LOCALE_PACKAGE}`);
}

if (problems.length > 0) {
  console.error(
    `check:pack: ${problems.length} problem(s):\n${problems.map((p) => `  ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(`check:pack: OK (${String(packed.size)} files; exports ${[...actualKeys].join(', ')})`);
