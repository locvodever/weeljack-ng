// @ts-check
import { execSync } from 'node:child_process';
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `npm run setup` (FR-34, 17 Q2): the one-time install, for the main checkout only. It refuses when
 * `node_modules` is a link, which is how a `/repo-*` worktree shares the main checkout's install,
 * so a worktree can never run `npm ci` into the main checkout's folder. Otherwise it runs a frozen
 * `npm ci`, then `npx playwright install chromium`. With no download (offline, or a locked-down
 * machine), set `CHROME_BIN` to a system Chrome and every spec runs on that instead. No
 * `postinstall` hook runs any of this.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modules = join(root, 'node_modules');

/** Whether `node_modules` is a symlink or a Windows junction (a `/repo-*` worktree's shared install). */
function isLink() {
  if (!existsSync(modules)) return false;
  return lstatSync(modules).isSymbolicLink() || realpathSync(modules) !== resolve(modules);
}

if (isLink()) {
  console.error(
    `setup: ${modules} is a link: this is a worktree sharing another checkout's install. ` +
      'Run `npm run setup` once in the main checkout, never in a worktree (it would `npm ci` into the main checkout).',
  );
  process.exit(1);
}

/** @param {string} command */
function run(command) {
  console.log(`setup: ${command}`);
  execSync(command, { cwd: root, stdio: 'inherit' });
}

run('npm ci');

try {
  run('npx playwright install chromium');
} catch {
  const chrome = process.env['CHROME_BIN'];
  if (chrome !== undefined && existsSync(chrome)) {
    console.warn(
      `setup: the Chromium download failed. CHROME_BIN (${chrome}) runs the specs instead.`,
    );
  } else {
    console.error(
      'setup: the Chromium download failed. Set CHROME_BIN to a system Chrome (a full path to chrome or chromium) and the specs run on that.',
    );
    process.exit(1);
  }
}

console.log('setup: done. `npm start` serves the docs, `npm run check` is the gate.');
