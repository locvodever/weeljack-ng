// @ts-check
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { AXE_RUN_OPTIONS } from '../projects/weeljack-ng/spec-support/axe.ts';
import { checkThemePanel } from './a11y-theme-panel.mjs';
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
 * States beyond the pages (FR-27, FR-33), each light and dark: a sidebar group collapsed, the
 * drawer open at 390 x 844 (its Escape-returns-focus-to-Menu behaviour is asserted too), and the
 * remaining three: the "Couldn't load this page" banner
 * (one lazy chunk request is aborted during one navigation to another component page, and routing
 * is restored afterwards), the first not-wrapped slug and the first planned slug of
 * `catalog.json`, each while one exists (a line says so when it is skipped).
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

/**
 * The first planned row and the first not-wrapped row of `catalog.json`, each `undefined` once none
 * is left (every target shipped; no not-wrapped entry), so no slug is hard-coded here.
 */
const catalog =
  /** @type {{ groups: { rows: { entry: string, status: string }[] }[],
   *   notWrapped: { entries: string[] }[] }} */ (
    JSON.parse(
      readFileSync(new URL('../projects/docs/src/generated/catalog.json', import.meta.url), 'utf8'),
    )
  );
const planned = catalog.groups
  .flatMap((group) => group.rows)
  .find((row) => row.status === 'planned');
if (planned === undefined) {
  console.log('check:a11y: no planned entry; planned state skipped');
} else {
  pages.push({
    label: `not-found (planned: ${planned.entry})`,
    path: `${BASE}components/${planned.entry}`,
    heading: 'No page here',
  });
}
// The not-found page matches `components/<slug>` against a row's `entries` (`notWrappedFor`).
const notWrappedSlug = catalog.notWrapped.flatMap((row) => row.entries)[0];
if (notWrappedSlug === undefined) {
  console.log('check:a11y: no not-wrapped entry; not-wrapped state skipped');
} else {
  pages.push({
    label: `not-found (not wrapped: ${notWrappedSlug})`,
    path: `${BASE}components/${notWrappedSlug}`,
    heading: 'No page here',
  });
}

/** The component pages, for the banner state: it starts on one and navigates to another. */
const componentPaths = prerenderedPagePaths().filter((path) =>
  /^\/weeljack-ng\/components\/[^/]+\/?$/.test(path),
);

/**
 * Waits until the app has rendered its `h1` and Optimus has emitted the theme variables.
 * @param {import('playwright').Page} page
 * @param {string | null} heading
 */
async function settle(page, heading) {
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  await page.addScriptTag({ path: axeSource });
  await page.waitForFunction(
    (expected) =>
      getComputedStyle(document.documentElement).getPropertyValue('--wj-primary-color') !== '' &&
      (expected === null || document.querySelector('h1')?.textContent === expected) &&
      document.querySelector('h1') !== null,
    heading,
  );
  // The "On this page" list (`docs-toc`) is built after hydration: axe must read it on every page that has one.
  // (Some pages carry an inline nav of the same name, so the wait names the list's own element.)
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('main h2, main h3')).filter(
        (h) => h.closest('.docs-live, docs-example-frame') === null,
      ).length < 2 || document.querySelector('docs-toc nav[aria-label="On this page"]') !== null,
  );
}

/**
 * Runs axe on the page as it is now; logs the result and returns the violation count.
 * @param {import('playwright').Page} page
 * @param {string} label
 * @param {'light' | 'dark'} scheme
 */
async function axeReport(page, label, scheme) {
  // The page-side `axe` global is untyped from here; the result is axe's own `Result[]`.
  const violations = /** @type {import('axe-core').Result[]} */ (
    await page.evaluate(
      `axe.run(document, ${JSON.stringify(AXE_RUN_OPTIONS)}).then((results) => results.violations)`,
    )
  );
  if (violations.length === 0) {
    console.log(`check:a11y: ${label} (${scheme}): no violations`);
    return 0;
  }
  console.error(`check:a11y: ${label} (${scheme}): ${String(violations.length)} violation(s)`);
  for (const violation of violations) {
    const targets = violation.nodes.map((node) => node.target.join(' ')).join('; ');
    console.error(
      `  ${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}
    ${targets}`,
    );
  }
  return violations.length;
}

/**
 * The header's own dark-mode toggle (its name is exactly "Dark mode" at every width).
 * @param {import('playwright').Page} page
 */
async function switchToDark(page) {
  await page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.waitForSelector('html.wj-dark');
}

/**
 * Runs axe light, then dark (the header's own toggle is clicked); returns the violation count.
 * @param {import('playwright').Page} page
 * @param {string} label
 */
async function axeBothSchemes(page, label) {
  let count = await axeReport(page, label, 'light');
  await switchToDark(page);
  count += await axeReport(page, label, 'dark');
  return count;
}

const server = await startDocsServer();
const browser = await chromium.launch({
  headless: true,
  ...(process.env['CHROME_BIN'] === undefined ? {} : { executablePath: process.env['CHROME_BIN'] }),
});

let failed = 0;
let states = pages.length;
try {
  // Reduced motion is on, and transitions are off: axe must read settled colours, not a fade.
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  for (const { label, path, heading } of pages) {
    const page = await context.newPage();
    await page.goto(`${server.origin}${path}`, { waitUntil: 'load' });
    await settle(page, heading);
    failed += await axeBothSchemes(page, label);
    await page.close();
  }

  // The banner: abort one lazy chunk request while navigating from one component page to another.
  const [from, to] = componentPaths;
  if (from === undefined || to === undefined) {
    throw new Error('check:a11y: the banner state needs two prerendered component pages.');
  }
  const page = await context.newPage();
  await page.goto(`${server.origin}${from}`, { waitUntil: 'load' });
  await settle(page, null);
  let aborted = 0;
  await page.route('**/*.js', async (route) => {
    if (aborted === 0) {
      aborted += 1;
      await route.abort();
    } else {
      await route.continue();
    }
  });
  const nav = page.locator('nav[aria-label="Documentation"]');
  const href = to.replace(/\/$/, '');
  // The target sits in a sub-group that is collapsed unless it is the current one: open it first.
  const collapsed = nav.locator(`ul[hidden]:has(> li > a[href="${href}"])`);
  if ((await collapsed.count()) > 0) {
    const id = await collapsed.first().getAttribute('id');
    await nav.locator(`button[aria-controls="${id}"]`).click();
  }
  await nav.locator(`a[href="${href}"]`).click();
  await page.locator('[role="alert"]').getByText("Couldn't load this page.").waitFor();
  await page.unroute('**/*.js');
  if (aborted === 0) {
    throw new Error('check:a11y: the banner appeared without an aborted request.');
  }
  states += 1;
  failed += await axeBothSchemes(page, 'banner (aborted chunk)');
  await page.close();

  // The icon gallery (FR-22): the search with no match, then the status line after a copy. The
  // copy runs in a context granted the clipboard, so the success text is the one checked.
  const iconPath = prerenderedPagePaths().find((path) => path.endsWith('/components/icon/'));
  if (iconPath === undefined) {
    throw new Error(
      'check:a11y: the icon gallery states need the prerendered components/icon page.',
    );
  }
  const gallery = '#icon-gallery-search';
  const status = 'docs-icon-gallery-example [role="status"]';
  const emptyPage = await context.newPage();
  await emptyPage.goto(`${server.origin}${iconPath}`, { waitUntil: 'load' });
  await settle(emptyPage, null);
  await emptyPage.locator(gallery).fill('zzzz');
  await emptyPage.getByText('No icon matches “zzzz”.').waitFor();
  // The fill scrolled a code block's Copy under the sticky header, where axe reads it as obscured.
  await emptyPage.evaluate(() => {
    window.scrollTo(0, 0);
  });
  states += 1;
  failed += await axeBothSchemes(emptyPage, 'icon gallery (no match)');
  await emptyPage.close();

  const copyContext = await browser.newContext({
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const copyPage = await copyContext.newPage();
  await copyPage.goto(`${server.origin}${iconPath}`, { waitUntil: 'load' });
  await settle(copyPage, null);
  await copyPage.locator('docs-icon-gallery-example .grid button').first().click();
  await copyPage.locator(status).getByText('Copied:').waitFor();
  states += 1;
  failed += await axeBothSchemes(copyPage, 'icon gallery (after a copy)');
  await copyPage.close();
  await copyContext.close();

  // The sidebar with its open component group collapsed: the header's disclosure button toggles it.
  {
    const first = componentPaths[0];
    if (first === undefined) {
      throw new Error('check:a11y: the collapsed-group state needs a prerendered component page.');
    }
    const label = 'sidebar (group collapsed)';
    const sidebarPage = await context.newPage();
    await sidebarPage.goto(`${server.origin}${first}`, { waitUntil: 'load' });
    await settle(sidebarPage, null);
    const open = sidebarPage
      .locator('nav[aria-label="Documentation"] button.head.sub[aria-expanded="true"]')
      .first();
    const id = await open.getAttribute('aria-controls');
    if (id === null) {
      throw new Error(`check:a11y: ${label}: no open component group to collapse.`);
    }
    await open.click();
    // Pinned to the button by id: once it collapses it no longer matches the "open" filter above.
    await sidebarPage
      .locator(
        `nav[aria-label="Documentation"] button[aria-controls="${id}"][aria-expanded="false"]`,
      )
      .waitFor({ timeout: 5000 });
    if (!(await sidebarPage.locator(`[id="${id}"]`).isHidden())) {
      throw new Error(`check:a11y: ${label}: the group's list is still shown.`);
    }
    states += 1;
    failed += await axeBothSchemes(sidebarPage, label);
    await sidebarPage.close();
  }

  // The drawer open at 390 x 844. Its backdrop covers the header toggle, so the scheme is switched
  // with the drawer closed, and the drawer is opened again.
  {
    const label = 'drawer (390 x 844)';
    const narrow = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 844 },
    });
    const drawerPage = await narrow.newPage();
    await drawerPage.goto(`${server.origin}${BASE}`, { waitUntil: 'load' });
    await settle(drawerPage, null);
    const menu = drawerPage.getByRole('button', { name: 'Menu', exact: true });
    const dialog = drawerPage.getByRole('dialog');
    const open = async () => {
      await menu.click();
      await dialog.waitFor();
      if (
        !(await drawerPage.evaluate(
          () =>
            document.querySelector('[role="dialog"]')?.contains(document.activeElement) ?? false,
        ))
      ) {
        throw new Error(`check:a11y: ${label}: focus did not move into the drawer.`);
      }
    };
    await open();
    states += 1;
    failed += await axeReport(drawerPage, label, 'light');
    await drawerPage.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    if (!(await menu.evaluate((button) => button === document.activeElement))) {
      throw new Error(`check:a11y: ${label}: Escape did not return focus to Menu.`);
    }
    // The mask's leave motion can still cover the header toggle: wait for it to go.
    await drawerPage.locator('.p-drawer-mask').waitFor({ state: 'detached' });
    await switchToDark(drawerPage);
    await open();
    failed += await axeReport(drawerPage, label, 'dark');
    await narrow.close();
  }

  // The theme panel (PRD FR-25): three states and the behaviour and per-row snippet checks.
  const themePanel = await checkThemePanel({
    browser,
    server,
    settle,
    axeReport,
    axeBothSchemes,
    switchToDark,
  });
  states += themePanel.states;
  failed += themePanel.failed;
} finally {
  await browser.close();
  await server.close();
}

const seconds = ((performance.now() - started) / 1000).toFixed(1);
if (failed > 0) {
  console.error(`check:a11y: ${String(failed)} violation(s) in ${seconds}s`);
  process.exit(1);
}
console.log(`check:a11y: ${String(states)} state(s) x 2 schemes clean in ${seconds}s`);
