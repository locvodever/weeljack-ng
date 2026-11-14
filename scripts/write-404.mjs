// @ts-check
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes `404.html` from the client-rendered shell (FR-27, 20 Q6), so a static host answers an
 * unknown URL with HTTP 404 plus the app shell, and the router draws the not-found page.
 */
const browserDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'docs', 'browser');
const shell = join(browserDir, 'index.csr.html');

if (!existsSync(shell)) {
  throw new Error(`write-404: ${shell} does not exist. Run the production docs build first.`);
}

copyFileSync(shell, join(browserDir, '404.html'));
console.log('write-404: index.csr.html -> 404.html');
