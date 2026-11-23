// @ts-check
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { THEME_STORAGE_KEY } from '../projects/docs/src/app/theme-panel/theme-storage-key.ts';
import { loadBrand, loadPreset } from './brand-reader.mjs';
import { libraryEntries } from './entries.mjs';
import { prerenderedPagePaths } from './serve-docs.mjs';

/**
 * The per-preset part of `check:a11y` (PRD FR-14), kept out of `check-a11y.mjs` so that file only
 * calls it. For every `weeljack-ng/preset-*` entry but Noir (which the main pass already covers),
 * in the theme panel's order, one browser context stores that preset under the docs' storage key
 * before load, then every prerendered component page is opened, waited on until the preset's own
 * light `--wj-primary-color` is in effect, and axe-checked light and dark with the same
 * `AXE_RUN_OPTIONS` the main pass uses. Docs-only pages and the extra states stay Noir-only.
 *
 * The presets are the entries `libraryEntries()` finds, read in the order of the generated
 * `preset-loaders.ts` (written from the same entries, in M1's order). An entry the generated list
 * lacks, or a preset module that cannot be loaded, fails the run.
 */

/**
 * @typedef {import('playwright').Page} Page
 * @typedef {object} PresetRow One row of the generated `PRESET_LOADERS`.
 * @property {string} name
 * @property {string} label
 * @property {string} exportName
 * @property {string} entry
 * @typedef {object} PresetChecks
 * @property {import('playwright').Browser} browser
 * @property {{ origin: string }} server
 * @property {(page: Page, heading: string | null) => Promise<void>} settle
 * @property {(page: Page, label: string) => Promise<number>} axeBothSchemes
 */

const PRESET_ENTRY = /^weeljack-ng\/preset-[^/]+$/;

/**
 * How long no `<style>` may change before axe runs on a page with a stored preset. Measured on
 * the table page: the root variables flip about 400 ms before the last component style lands.
 */
const STYLE_QUIET_MS = 300;

/**
 * The generated preset rows (name, label, export name, entry), in the panel's order, checked
 * against the `weeljack-ng/preset-*` entries of the library: each side must have the other.
 * @returns {PresetRow[]}
 */
export function presetRows() {
  const file = new URL('../projects/docs/src/generated/preset-loaders.ts', import.meta.url);
  const source = ts.createSourceFile(
    'preset-loaders.ts',
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  /** @type {PresetRow[]} */
  const rows = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const list = declaration.initializer;
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== 'PRESET_LOADERS' ||
        list === undefined ||
        !ts.isArrayLiteralExpression(list)
      ) {
        continue;
      }
      for (const element of list.elements) {
        /** @type {Record<string, string>} */
        const fields = {};
        if (ts.isObjectLiteralExpression(element)) {
          for (const property of element.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              ts.isStringLiteral(property.initializer)
            ) {
              fields[property.name.text] = property.initializer.text;
            }
          }
        }
        const { name, label, exportName, entry } = fields;
        if (
          name === undefined ||
          label === undefined ||
          exportName === undefined ||
          entry === undefined
        ) {
          throw new Error(
            `a11y-presets: a PRESET_LOADERS row lacks name, label, exportName or entry: ${element.getText(source)}`,
          );
        }
        rows.push({ name, label, exportName, entry });
      }
    }
  }
  const entries = libraryEntries().filter((entry) => PRESET_ENTRY.test(entry));
  for (const entry of entries) {
    if (!rows.some((row) => row.entry === entry)) {
      throw new Error(
        `a11y-presets: ${entry} has no row in the generated preset-loaders.ts. Run \`npm run generate\`.`,
      );
    }
  }
  for (const row of rows) {
    if (!entries.includes(row.entry)) {
      throw new Error(
        `a11y-presets: the generated list names ${row.entry}, which is not an entry.`,
      );
    }
  }
  return rows;
}

/**
 * Runs the axe pass once per preset but Noir.
 * @param {PresetChecks} checks
 * @returns {Promise<{ states: number, failed: number }>}
 */
export async function checkPresets({ browser, server, settle, axeBothSchemes }) {
  const brand = await loadBrand();
  // The component pages, as `check-a11y.mjs` filters them for its banner state.
  const paths = prerenderedPagePaths().filter((path) =>
    /^\/weeljack-ng\/components\/[^/]+\/?$/.test(path),
  );
  let states = 0;
  let failed = 0;
  for (const row of presetRows().filter((item) => item.name !== 'noir')) {
    const started = performance.now();
    const preset = await loadPreset(row.entry);
    const light = brand
      .tokenValue(
        brand.tokensFor(brand.brandPreset(undefined, undefined, preset), 'light'),
        'primary.color',
      )
      .trim()
      .toLowerCase();
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    try {
      await context.addInitScript(
        ({ key, value }) => {
          localStorage.setItem(key, value);
          // Optimus writes each component's styles into its own <style> after the root
          // variables change, so the pass also waits for those writes to stop (`STYLE_QUIET_MS`).
          Reflect.set(document, 'wjStyleChange', performance.now());
          new MutationObserver((records) => {
            const touchesStyle = records.some(
              (record) =>
                record.target.nodeName === 'STYLE' ||
                record.target.parentNode?.nodeName === 'STYLE' ||
                [...record.addedNodes, ...record.removedNodes].some(
                  (node) => node.nodeName === 'STYLE',
                ),
            );
            if (touchesStyle) {
              Reflect.set(document, 'wjStyleChange', performance.now());
            }
          }).observe(document, { subtree: true, childList: true, characterData: true });
        },
        { key: THEME_STORAGE_KEY, value: JSON.stringify({ preset: row.name }) },
      );
      for (const path of paths) {
        const page = await context.newPage();
        await page.goto(`${server.origin}${path}`, { waitUntil: 'load' });
        await settle(page, null);
        try {
          // The stored preset applies once its lazy chunk has resolved: wait for its colour.
          await page.waitForFunction(
            (expected) =>
              getComputedStyle(document.documentElement)
                .getPropertyValue('--wj-primary-color')
                .trim()
                .toLowerCase() === expected,
            light,
            { timeout: 10_000 },
          );
        } catch {
          failed += 1;
          const actual = await page.evaluate(() =>
            getComputedStyle(document.documentElement)
              .getPropertyValue('--wj-primary-color')
              .trim(),
          );
          console.error(
            `check:a11y: preset ${row.name}: ${path}: --wj-primary-color is '${actual}', expected '${light}' (light)`,
          );
          await page.close();
          continue;
        }
        // The root variables land first; the component styles follow within a few frames.
        await page.waitForFunction(
          (quiet) => performance.now() - Number(Reflect.get(document, 'wjStyleChange')) >= quiet,
          STYLE_QUIET_MS,
          { timeout: 10_000 },
        );
        failed += await axeBothSchemes(page, `${path} (preset ${row.name})`);
        await page.close();
      }
    } finally {
      await context.close();
    }
    states += paths.length;
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(
      `check:a11y: preset ${row.name}: ${String(paths.length)} page(s) x 2 schemes in ${seconds}s`,
    );
  }
  return { states, failed };
}
