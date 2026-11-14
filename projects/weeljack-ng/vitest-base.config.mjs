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
});
