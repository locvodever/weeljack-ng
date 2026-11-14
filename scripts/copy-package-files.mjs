// @ts-check
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Copies the three package files that live once, at the repo root, into the built package
 * (FR-4). Run by `npm run build` after `ng build weeljack-ng`.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'weeljack-ng');
const files = ['LICENSE', 'THIRD-PARTY-NOTICES.md', 'README.md'];

if (!existsSync(dist)) {
  throw new Error(
    `copy-package-files: ${dist} does not exist. Run \`ng build weeljack-ng\` first.`,
  );
}

for (const file of files) {
  const source = join(root, file);
  if (!existsSync(source)) {
    throw new Error(`copy-package-files: ${file} is missing from the repo root.`);
  }
  copyFileSync(source, join(dist, file));
  console.log(`copied ${file} -> dist/weeljack-ng/${file}`);
}
