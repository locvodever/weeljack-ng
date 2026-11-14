// @ts-check
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A tiny static server for `dist/docs/browser` under `/weeljack-ng/` (FR-30), the way GitHub Pages
 * serves it: a folder answers with its `index.html`, anything unknown answers HTTP 404 with
 * `404.html`. Shared by `check:ssr` and `check:a11y`.
 */
export const BASE = '/weeljack-ng/';
export const BROWSER_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
  'docs',
  'browser',
);

/** @type {Record<string, string>} */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolves a URL path under {@link BASE} to a file in the build, or `undefined`. */
function fileFor(/** @type {string} */ pathname) {
  if (!pathname.startsWith(BASE)) return undefined;
  const target = resolve(BROWSER_DIR, decodeURIComponent(pathname.slice(BASE.length)));
  // Containment: the resolved path must stay inside the build folder.
  if (target !== BROWSER_DIR && !target.startsWith(BROWSER_DIR + sep)) return undefined;
  if (!existsSync(target)) return undefined;
  if (statSync(target).isDirectory()) {
    const index = join(target, 'index.html');
    return existsSync(index) ? index : undefined;
  }
  return target;
}

/**
 * Starts the server on a free port.
 * @returns {Promise<{ origin: string, close: () => Promise<void> }>}
 */
export function startDocsServer() {
  if (!existsSync(join(BROWSER_DIR, 'index.html'))) {
    throw new Error(`serve-docs: ${BROWSER_DIR} has no build. Run \`npm run build:docs\` first.`);
  }
  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    const file = fileFor(pathname);
    const notFound = join(BROWSER_DIR, '404.html');
    const served = file ?? (existsSync(notFound) ? notFound : undefined);
    if (served === undefined) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    response
      .writeHead(file === undefined ? 404 : 200, {
        'content-type': TYPES[extname(served)] ?? 'application/octet-stream',
      })
      .end(readFileSync(served));
  });

  return new Promise((resolveStart, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('serve-docs: the server has no TCP address.'));
        return;
      }
      resolveStart({
        origin: `http://127.0.0.1:${String(address.port)}`,
        close: () =>
          new Promise((resolveClose) => {
            server.close(() => {
              resolveClose(undefined);
            });
            server.closeAllConnections();
          }),
      });
    });
  });
}

/** URL paths (under {@link BASE}) of every prerendered page: each `index.html` except the CSR shell. */
export function prerenderedPagePaths() {
  /** @type {string[]} */
  const paths = [];
  /** @param {string} dir */
  const walk = (dir) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, item.name);
      if (item.isDirectory()) {
        walk(full);
      } else if (item.name === 'index.html') {
        const folder = relative(BROWSER_DIR, dirname(full)).split(sep).join('/');
        paths.push(folder === '' ? BASE : `${BASE}${folder}/`);
      }
    }
  };
  walk(BROWSER_DIR);
  return paths.sort();
}
