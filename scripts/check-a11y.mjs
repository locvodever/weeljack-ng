// @ts-check
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { AXE_RUN_OPTIONS } from '../projects/weeljack-ng/spec-support/axe.ts';
import { BASE, prerenderedPagePaths, startDocsServer } from './serve-docs.mjs';

/**
 * `check:a11y` (FR-30, 16 Q5, 22 Q5). Serves the built docs under `/weeljack-ng/` and runs axe over
 * every prerendered page in the light scheme, then again in the dark one (the header's own toggle
 * is clicked). The axe configuration is the one the component specs use: `AXE_RUN_OPTIONS`
 * (`wcag2a` through `wcag22aa` plus `target-size`) from `spec-support/axe.ts`, not a copy.
 *
 * The not-found page is checked too, through an unknown URL: the server answers it with the
 * client-rendered `404.html` shell and the router draws the page.
 *
 * Needs Playwright's Chromium (`npx playwright install chromium`) or `CHROME_BIN`.
 */
const started = performance.now();
const axeSource = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

/** @type {{ label: string, path: string, heading: string | null }[]} */
const pages = [
  ...prerenderedPagePaths().map((path) => ({ label: path, path, heading: null })),
  { label: 'not-found (unknown URL)', path: `${BASE}no-such-page`, heading: 'No page here' },
];

const server = await startDocsServer();
const browser = await chromium.launch({
  headless: true,
  ...(process.env['CHROME_BIN'] === undefined ? {} : { executablePath: process.env['CHROME_BIN'] }),
});

let failed = 0;
try {
  // Reduced motion is on, and transitions are off: axe must read settled colours, not a fade.
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  for (const { label, path, heading } of pages) {
    const page = await context.newPage();
    await page.goto(`${server.origin}${path}`, { waitUntil: 'load' });
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
    await page.addScriptTag({ path: axeSource });
    // Settled: the app has rendered its `h1` and Optimus has emitted the theme variables.
    await page.waitForFunction(
      (expected) =>
        getComputedStyle(document.documentElement).getPropertyValue('--wj-primary-color') !== '' &&
        (expected === null || document.querySelector('h1')?.textContent === expected) &&
        document.querySelector('h1') !== null,
      heading,
    );

    for (const scheme of /** @type {const} */ (['light', 'dark'])) {
      if (scheme === 'dark') {
        await page.getByRole('button', { name: 'Dark mode' }).click();
        await page.waitForSelector('html.wj-dark');
      }
      // The page-side `axe` global is untyped from here; the result is axe's own `Result[]`.
      const violations = /** @type {import('axe-core').Result[]} */ (
        await page.evaluate(
          `axe.run(document, ${JSON.stringify(AXE_RUN_OPTIONS)}).then((results) => results.violations)`,
        )
      );
      if (violations.length === 0) {
        console.log(`check:a11y: ${label} (${scheme}): no violations`);
        continue;
      }
      failed += violations.length;
      console.error(`check:a11y: ${label} (${scheme}): ${String(violations.length)} violation(s)`);
      for (const violation of violations) {
        const targets = violation.nodes.map((node) => node.target.join(' ')).join('; ');
        console.error(
          `  ${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n    ${targets}`,
        );
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}

const seconds = ((performance.now() - started) / 1000).toFixed(1);
if (failed > 0) {
  console.error(`check:a11y: ${String(failed)} violation(s) in ${seconds}s`);
  process.exit(1);
}
console.log(`check:a11y: ${String(pages.length)} page(s) x 2 schemes clean in ${seconds}s`);
