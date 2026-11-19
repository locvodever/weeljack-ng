// @ts-check
import { defineConfig } from 'vitest/config';

/**
 * Runner config merged by `@angular/build:unit-test` (angular.json `runnerConfig`).
 * Browsers and the Playwright provider come from the builder's `browsers` option; this file
 * carries only what the builder has no option for (FR-20).
 */
export default defineConfig({
  test: {
    restoreMocks: true,
  },
  plugins: [
    {
      /*
       * Vite keeps the browser project's pre-bundled dependencies under `cacheDir`, by default
       * `node_modules/.vite`. Every worktree reaches one `node_modules` through a junction, so they
       * all shared one deps folder, and a run whose dependency set differed (another branch, or a
       * focused run) rebuilt it under the others: their next import failed with "Failed to fetch
       * dynamically imported module". The builder drops a top-level `cacheDir` from this file for
       * the browser project but passes plugins through, so a plugin sets it, per worktree, inside
       * the gitignored Angular cache. The path keeps a `node_modules` segment because Vite treats
       * only such paths as third-party code and would otherwise warn about the deps' own imports.
       */
      name: 'weeljack:worktree-vite-cache',
      config: () => ({ cacheDir: '.angular/cache/node_modules/.vite' }),
    },
  ],
});
