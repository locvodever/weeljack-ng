// @ts-check
import { execFileSync, spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `npm start` (FR-35, 17 Q3): the library in watch mode, then the docs app on `PORT` (default
 * 4200). The docs app resolves `weeljack-ng` from `dist/weeljack-ng` (the same as the production
 * build), so a library edit rebuilds the entry into `dist/`, the dev server sees `dist/` change and
 * the page fully reloads. The docs server only starts after the library's first `Compilation
 * complete`, because the docs app cannot compile without `dist/`. Ctrl-C stops both trees.
 * Stop it before `npm run build` or `npm run check` in the same checkout: they write the same
 * `dist/`.
 *
 * Pattern ported from quanoi's `scripts/dev.mjs` (spawn through the shell, prefixed output, tree
 * kill on Ctrl-C); nothing else of it applies.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env['PORT'] ?? '4200';
const isWindows = process.platform === 'win32';

/** @type {{ name: string, proc: import('node:child_process').ChildProcess }[]} */
const procs = [];
let stopping = false;

function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const { name, proc } of procs) {
    if (proc.pid === undefined || proc.exitCode !== null) continue;
    try {
      if (isWindows) {
        execFileSync('taskkill', ['/F', '/T', '/PID', String(proc.pid)], { stdio: 'pipe' });
      } else {
        // detached: the child leads its own process group, so -pid reaches the whole tree.
        process.kill(-proc.pid, 'SIGTERM');
      }
      console.log(`[dev] stopped ${name}`);
    } catch {
      // Already gone.
    }
  }
}

/**
 * Starts `command` through the system shell (so `npx` resolves on Windows) and prefixes each of
 * its output lines with `[name]`.
 * @param {string} name
 * @param {string} command
 * @param {(line: string) => void} [onLine]
 */
function start(name, command, onLine) {
  const proc = spawn(command, [], {
    cwd: root,
    shell: true,
    detached: !isWindows,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  procs.push({ name, proc });
  for (const [stream, out] of /** @type {const} */ ([
    [proc.stdout, process.stdout],
    [proc.stderr, process.stderr],
  ])) {
    let pending = '';
    stream.setEncoding('utf8');
    stream.on('data', (/** @type {string} */ chunk) => {
      const lines = (pending + chunk).split(/\r?\n/);
      pending = lines.pop() ?? '';
      for (const line of lines) {
        out.write(`[${name}] ${line}\n`);
        onLine?.(line);
      }
    });
  }
  proc.on('error', (error) => {
    console.error(`[${name}] spawn error: ${String(error)}`);
    stopAll();
    process.exitCode = 1;
  });
  proc.on('exit', (code) => {
    if (!stopping) {
      console.error(`[dev] ${name} exited${code === null ? '' : ` with code ${String(code)}`}`);
      stopAll();
      process.exitCode = code ?? 1;
    }
  });
}

for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.on(signal, () => {
    console.log('\n[dev] stopping…');
    stopAll();
    process.exit(0);
  });
}

let docsStarted = false;
console.log('[dev] building the library, then serving the docs once it is ready…');
start('lib', 'npx ng build weeljack-ng --watch --configuration development', (line) => {
  if (!docsStarted && line.includes('Compilation complete')) {
    docsStarted = true;
    console.log(`[dev] library built. Docs: http://localhost:${port}/ (Ctrl-C stops both)`);
    start('docs', `npx ng serve docs --port ${port}`);
  }
});
