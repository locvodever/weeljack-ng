// @ts-check
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { loadBrand } from './brand-reader.mjs';
import { BASE } from './serve-docs.mjs';

/**
 * The docs theme panel's part of `check:a11y` (PRD FR-25), kept out of `check-a11y.mjs` so that
 * file only calls it. Three states, each light and dark: the panel open at 1440 x 900, the
 * `components/button` page in blue + slate, and the Menu drawer at 375 x 812. Around them, the
 * behaviour assertions (focus, arrow keys, snippet text, reload, Dark mode both ways, Reset,
 * Escape) and the per-row snippet check: for every Primary and Surface row, the snippet the panel
 * shows is parsed as TypeScript, and the tokens a bootstrap with those options produces
 * (`brand-reader.mjs`, the library's own code) must equal the `--wj-*` variables the page has.
 *
 * A failed behaviour assertion throws, naming the step. Axe findings and snippet mismatches are
 * counted in `failed`.
 */

/**
 * @typedef {import('playwright').Page} Page
 * @typedef {object} ThemePanelChecks
 * @property {import('playwright').Browser} browser
 * @property {{ origin: string }} server
 * @property {(page: Page, heading: string | null) => Promise<void>} settle
 * @property {(page: Page, label: string, scheme: 'light' | 'dark') => Promise<number>} axeReport
 * @property {(page: Page, label: string) => Promise<number>} axeBothSchemes
 * @property {(page: Page) => Promise<void>} switchToDark
 */

/** The `localStorage` key the docs keep the palette names under. */
const KEY = 'weeljack-docs-theme';
const THEME_BUTTON = 'header button.theme';
const DIALOG = '[role="dialog"]';

/** The tokens the snippet check compares (PRD FR-25), as the library's dotted paths. */
const TOKENS = [
  'primary.color',
  'primary.contrast.color',
  'primary.hover.color',
  'primary.active.color',
  'focus.ring.color',
  'text.color',
  'content.background',
  'form.field.border.color',
  'surface.0',
  'surface.50',
  'surface.100',
  'surface.500',
  'surface.700',
  'surface.900',
  'surface.950',
];

/**
 * @typedef {{ name: string, label: string, value: string, step?: number }} Row
 * @typedef {{ primaries: Row[], surfaces: Row[] }} Palettes
 */

/** @type {Palettes} */
const palettes = JSON.parse(
  readFileSync(
    new URL('../projects/docs/src/generated/theme-palettes.json', import.meta.url),
    'utf8',
  ),
);

/** @param {string} step @param {string} message @returns {never} */
function fail(step, message) {
  throw new Error(`check:a11y: theme panel: ${step}: ${message}`);
}

/**
 * The `provideWeeljack` call the panel shows for these rows (PRD D9), the expected text: one key
 * per line, a `// <name> <step>` comment above `primary`, two-space indent, trailing commas.
 * @param {Row | undefined} primary
 * @param {Row | undefined} surface
 */
function expectedSnippet(primary, surface) {
  const lines = [
    ...(primary === undefined
      ? []
      : [`  // ${primary.name} ${String(primary.step)}`, `  primary: '${primary.value}',`]),
    ...(surface === undefined ? [] : [`  surface: '${surface.value}',`]),
  ];
  return lines.length === 0 ? 'provideWeeljack()' : `provideWeeljack({\n${lines.join('\n')}\n})`;
}

/**
 * Parses the snippet: no syntax errors, one `provideWeeljack(...)` call whose only argument, if
 * any, is an object literal of string-literal `primary` / `surface` properties.
 * @param {string} text
 * @returns {{ primary?: string, surface?: string }}
 */
function parseSnippet(text) {
  const syntax = ts.transpileModule(text, { reportDiagnostics: true }).diagnostics ?? [];
  if (syntax.length > 0) {
    fail(
      'snippet',
      `'${text}' does not parse: ${syntax.map((d) => String(d.messageText)).join('; ')}`,
    );
  }
  const file = ts.createSourceFile('snippet.ts', text, ts.ScriptTarget.Latest, true);
  const [statement, ...rest] = file.statements;
  if (
    rest.length > 0 ||
    statement === undefined ||
    !ts.isExpressionStatement(statement) ||
    !ts.isCallExpression(statement.expression) ||
    !ts.isIdentifier(statement.expression.expression) ||
    statement.expression.expression.text !== 'provideWeeljack'
  ) {
    return fail('snippet', `'${text}' is not one provideWeeljack(...) call.`);
  }
  const [argument, ...extra] = statement.expression.arguments;
  /** @type {{ primary?: string, surface?: string }} */
  const options = {};
  if (argument === undefined) {
    return options;
  }
  if (extra.length > 0 || !ts.isObjectLiteralExpression(argument)) {
    return fail('snippet', `'${text}': the argument is not one object literal.`);
  }
  for (const property of argument.properties) {
    const name = ts.isPropertyAssignment(property) ? property.name.getText(file) : '';
    if (
      !ts.isPropertyAssignment(property) ||
      (name !== 'primary' && name !== 'surface') ||
      !ts.isStringLiteral(property.initializer) ||
      name in options
    ) {
      return fail(
        'snippet',
        `'${text}': '${property.getText(file)}' is not a string-literal primary or surface.`,
      );
    }
    options[name] = property.initializer.text;
  }
  if (Object.keys(options).length === 0) {
    return fail('snippet', `'${text}': an empty options object where the default is omitted.`);
  }
  return options;
}

/** `--wj-primary-color` of `<html>`, trimmed and lower-cased. @param {Page} page */
const primaryColour = (page) =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--wj-primary-color')
      .trim()
      .toLowerCase(),
  );

/** @param {Page} page @param {string} expected @param {string} step */
async function waitForPrimary(page, expected, step) {
  try {
    await page.waitForFunction(
      (value) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--wj-primary-color')
          .trim()
          .toLowerCase() === value,
      expected,
      { timeout: 5000 },
    );
  } catch {
    fail(step, `--wj-primary-color is ${await primaryColour(page)}, expected ${expected}.`);
  }
}

/** @param {Page} page @param {string} selector @param {string} step @param {string} what */
async function waitForFocus(page, selector, step, what) {
  try {
    await page.waitForFunction((css) => document.activeElement?.matches(css) ?? false, selector, {
      timeout: 5000,
    });
  } catch {
    fail(
      step,
      `focus is not on ${what} (it is on ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80) ?? 'nothing')}).`,
    );
  }
}

/** Opens the popover with Theme and waits for focus on the checked Primary swatch. @param {Page} page @param {string} step */
async function openPanel(page, step) {
  await page.locator(THEME_BUTTON).click();
  await page.locator(DIALOG).waitFor();
  await waitForFocus(
    page,
    'input[name="popover-primary"]:checked',
    step,
    'the checked Primary swatch',
  );
}

/** Closes it with Escape; focus must come back to Theme. @param {Page} page @param {string} step */
async function closePanel(page, step) {
  await page.keyboard.press('Escape');
  await page.locator(DIALOG).waitFor({ state: 'hidden' });
  await waitForFocus(page, THEME_BUTTON, step, 'Theme');
}

/** Dark mode back to light, the header's own toggle. @param {Page} page */
async function switchToLight(page) {
  await page.getByRole('banner').getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.waitForSelector('html:not(.wj-dark)');
}

/**
 * What a bootstrap with these options gives for one token, in `scheme`.
 * @param {Awaited<ReturnType<typeof loadBrand>>} brand
 * @param {{ primary?: string, surface?: string }} options
 * @param {'light' | 'dark'} scheme
 */
function bootstrapTokens(brand, options, scheme) {
  const tokens = brand.tokensFor(brand.brandPreset(options.primary, options.surface), scheme);
  return TOKENS.map((token) => ({
    token,
    value: brand.tokenValue(tokens, token).trim().toLowerCase(),
  }));
}

/**
 * Runs the theme panel's states and assertions.
 * @param {ThemePanelChecks} checks
 * @returns {Promise<{ states: number, failed: number }>}
 */
export async function checkThemePanel({
  browser,
  server,
  settle,
  axeReport,
  axeBothSchemes,
  switchToDark,
}) {
  const brand = await loadBrand();
  const first = palettes.primaries[0];
  const second = palettes.primaries[1];
  const blue = palettes.primaries.find((row) => row.name === 'blue');
  const slate = palettes.surfaces.find((row) => row.name === 'slate');
  if (first === undefined || second === undefined) {
    return fail('palettes', 'the generated primary list holds fewer than two palettes.');
  }
  if (blue === undefined || slate === undefined) {
    return fail(
      'palettes',
      'blue or slate is not in the generated list, and the components/button state needs blue + slate (PRD D9, condition 4). Report it; do not pick another.',
    );
  }
  /** The dark `primary.color` of a bootstrap with `row` as its primary. @param {Row} row */
  const darkPrimary = (row) =>
    bootstrapTokens(brand, { primary: row.value }, 'dark')[0]?.value ?? '';
  const lightPrimary = (/** @type {Row} */ row) =>
    bootstrapTokens(brand, { primary: row.value }, 'light')[0]?.value ?? '';

  let failed = 0;
  let states = 0;

  // State 1: the panel open at 1440 x 900, with the behaviour assertions around it.
  {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const url = `${server.origin}${BASE}guides/theming`;
    await page.goto(url, { waitUntil: 'load' });
    await settle(page, null);
    const dialog = page.locator(DIALOG);

    await openPanel(page, 'open: Noir checked');
    // Noir is first, so ArrowRight lands on the first generated primary.
    await page.keyboard.press('ArrowRight');
    await waitForPrimary(page, first.value, 'ArrowRight');
    if (!(await dialog.getByRole('radio', { name: first.label, exact: true }).isChecked())) {
      fail('ArrowRight', `${first.label} is not checked.`);
    }
    const snippet = (await dialog.locator('docs-code-block code').textContent()) ?? '';
    if (snippet !== expectedSnippet(first, undefined)) {
      fail('snippet text', `'${snippet}', expected '${expectedSnippet(first, undefined)}'.`);
    }
    states += 1;
    failed += await axeReport(page, 'theme panel open (1440 x 900)', 'light');

    // Escape lands on Theme; second Theme click closes too.
    await closePanel(page, 'Escape');
    await openPanel(page, 'second open');
    await page.locator(THEME_BUTTON).click();
    await dialog.waitFor({ state: 'hidden' });
    await waitForFocus(page, THEME_BUTTON, 'second Theme click', 'Theme');

    // Reload keeps the choice, and the panel shows it checked.
    await page.reload({ waitUntil: 'load' });
    await settle(page, null);
    await waitForPrimary(page, first.value, 'reload');
    await page.locator(THEME_BUTTON).click();
    await dialog.waitFor();
    await waitForFocus(
      page,
      'input[name="popover-primary"]:checked',
      'reload',
      'the checked Primary swatch',
    );
    if (!(await dialog.getByRole('radio', { name: first.label, exact: true }).isChecked())) {
      fail('reload', `${first.label} is not checked after a reload.`);
    }
    await closePanel(page, 'reload Escape');

    // Dark after the pick gives that palette's dark value; the panel in dark is axe-checked.
    await switchToDark(page);
    await waitForPrimary(page, darkPrimary(first), 'dark after a pick');
    if ((await primaryColour(page)) === '#fafafa') {
      fail('dark after a pick', "the primary is Noir's dark value.");
    }
    await openPanel(page, 'open in dark');
    failed += await axeReport(page, 'theme panel open (1440 x 900)', 'dark');
    // Picking while dark applies the dark value.
    await page.keyboard.press('ArrowRight');
    await waitForPrimary(page, darkPrimary(second), 'pick while dark');
    await closePanel(page, 'Escape in dark');
    await switchToLight(page);
    await waitForPrimary(page, lightPrimary(second), 'back to light');

    // Reset: Noir on zinc, the key removed, focus stays on Reset.
    await page.locator(THEME_BUTTON).click();
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
    await waitForPrimary(page, '#09090b', 'Reset');
    if ((await page.evaluate((key) => localStorage.getItem(key), KEY)) !== null) {
      fail('Reset', 'the stored choice was not removed.');
    }
    await waitForFocus(page, `${DIALOG} wj-button button`, 'Reset', 'the Reset button');
    await closePanel(page, 'Escape after Reset');
    await context.close();
  }

  // State 2: components/button in blue + slate, stored before the page loads.
  {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: KEY, value: JSON.stringify({ primary: blue.name, surface: slate.name }) },
    );
    const page = await context.newPage();
    await page.goto(`${server.origin}${BASE}components/button`, { waitUntil: 'load' });
    await settle(page, null);
    await waitForPrimary(page, blue.value, 'blue + slate');
    states += 1;
    failed += await axeBothSchemes(page, 'components/button (blue + slate)');
    await context.close();
  }

  // State 3: 375 x 812, Theme in the Menu drawer.
  {
    const label = 'drawer (375 x 812)';
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto(`${server.origin}${BASE}guides/theming`, { waitUntil: 'load' });
    await settle(page, null);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    if (width > 375) {
      fail(label, `the page scrolls sideways: scrollWidth ${String(width)} > 375.`);
    }
    if (
      (await page.locator(THEME_BUTTON).evaluate((el) => getComputedStyle(el).display)) !== 'none'
    ) {
      fail(label, 'the bar still shows Theme below 720 px.');
    }
    const dialog = page.getByRole('dialog');
    const open = async () => {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await dialog.waitFor();
      await dialog.getByRole('heading', { name: 'Theme', exact: true }).waitFor();
      for (const group of ['Primary', 'Surface']) {
        if ((await dialog.getByRole('group', { name: group, exact: true }).count()) !== 1) {
          fail(label, `the drawer does not hold the ${group} radio group.`);
        }
      }
      const right = await page.evaluate(
        () => document.querySelector('docs-theme-panel')?.getBoundingClientRect().right ?? 0,
      );
      if (right > 375) {
        fail(label, `the theme panel ends at ${String(right)} px, past the 375 px viewport.`);
      }
    };
    await open();
    states += 1;
    failed += await axeReport(page, label, 'light');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.locator('.p-drawer-mask').waitFor({ state: 'detached' });
    await switchToDark(page);
    await open();
    failed += await axeReport(page, label, 'dark');
    await context.close();
  }

  failed += await checkRows({ browser, server, settle, switchToDark, brand });
  return { states, failed };
}

/**
 * The per-row snippet check (PRD FR-25, D9 condition 2). Returns the mismatch count.
 * @param {Pick<ThemePanelChecks, 'browser' | 'server' | 'settle' | 'switchToDark'> & {
 *   brand: Awaited<ReturnType<typeof loadBrand>> }} checks
 */
async function checkRows({ browser, server, settle, switchToDark, brand }) {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${server.origin}${BASE}guides/theming`, { waitUntil: 'load' });
  await settle(page, null);
  const dialog = page.locator(DIALOG);
  let mismatches = 0;
  let compared = 0;
  let normalised = 0;

  /** Picks one swatch by its name, inside the open panel. @param {'Primary' | 'Surface'} group @param {string} name */
  const pick = (group, name) =>
    dialog
      .getByRole('group', { name: group, exact: true })
      .getByRole('radio', { name, exact: true })
      .check();

  /** Both sides through a probe element's colour, for a formatting-only difference. @param {string} a @param {string} b */
  const sameColour = (a, b) =>
    page.evaluate(
      ([x, y]) => {
        const probe = document.body.appendChild(document.createElement('div'));
        const resolve = (/** @type {string | undefined} */ value) => {
          probe.style.color = '';
          probe.style.color = value ?? '';
          return probe.style.color === '' ? value : getComputedStyle(probe).color;
        };
        const same = resolve(x) === resolve(y);
        probe.remove();
        return same;
      },
      [a, b],
    );

  /** @param {'light' | 'dark'} scheme */
  const pass = async (scheme) => {
    /** @type {{ group: 'Primary' | 'Surface', other: 'Primary' | 'Surface', row: string, label: string, primary?: typeof palettes.primaries[number], surface?: typeof palettes.surfaces[number] }[]} */
    const rows = [
      { group: 'Primary', other: 'Surface', row: 'Noir', label: 'Noir' },
      ...palettes.primaries.map((primary) => ({
        group: /** @type {const} */ ('Primary'),
        other: /** @type {const} */ ('Surface'),
        row: primary.label,
        label: primary.label,
        primary,
      })),
      { group: 'Surface', other: 'Primary', row: 'Zinc', label: 'Zinc' },
      ...palettes.surfaces.map((surface) => ({
        group: /** @type {const} */ ('Surface'),
        other: /** @type {const} */ ('Primary'),
        row: surface.label,
        label: surface.label,
        surface,
      })),
    ];
    await page.locator(THEME_BUTTON).click();
    await dialog.waitFor();
    for (const entry of rows) {
      // The row under test, with the other row at its default.
      await pick(entry.other, entry.other === 'Primary' ? 'Noir' : 'Zinc');
      await pick(entry.group, entry.row);
      const expected = expectedSnippet(entry.primary, entry.surface);
      try {
        await page.waitForFunction(
          ({ css, text }) => document.querySelector(css)?.textContent === text,
          { css: `${DIALOG} docs-code-block code`, text: expected },
          { timeout: 5000 },
        );
      } catch {
        fail(
          `${entry.group} ${entry.row} (${scheme})`,
          `the snippet is '${(await dialog.locator('docs-code-block code').textContent()) ?? ''}', expected '${expected}'.`,
        );
      }
      const parsed = parseSnippet(expected);
      const shown = parseSnippet(
        (await dialog.locator('docs-code-block code').textContent()) ?? '',
      );
      if (parsed.primary !== shown.primary || parsed.surface !== shown.surface) {
        fail(
          `${entry.group} ${entry.row} (${scheme})`,
          'the parsed snippet differs from the expected one.',
        );
      }
      for (const { token, value } of bootstrapTokens(brand, shown, scheme)) {
        const variable = `--wj-${token.replaceAll('.', '-')}`;
        const actual = await page.evaluate(
          (name) =>
            getComputedStyle(document.documentElement).getPropertyValue(name).trim().toLowerCase(),
          variable,
        );
        compared += 1;
        if (actual === value) {
          continue;
        }
        if (await sameColour(actual, value)) {
          normalised += 1;
          continue;
        }
        mismatches += 1;
        console.error(
          `check:a11y: theme panel: snippet check: ${entry.group} ${entry.row} (${scheme}): ${variable} is '${actual}' on the page, '${value}' from a bootstrap with ${JSON.stringify(shown)}`,
        );
      }
    }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
  };

  await pass('light');
  await switchToDark(page);
  await pass('dark');
  await context.close();
  console.log(
    `check:a11y: theme panel snippets: ${String(compared)} comparison(s), ${String(mismatches)} mismatch(es), ${String(normalised)} equal only after colour normalisation`,
  );
  return mismatches;
}
