/*
 * What a page's theme is, as a spec reads it: every `--wj-*` variable the Optimus sheets declare
 * (as `<html>` resolves it, light then dark) and the text of every component `-style` sheet.
 * `theme.spec.ts` and the shared preset contract compare a switched bootstrap against a fresh one
 * with it. It lives in `spec-support/`, which has no `ng-package.json` and is excluded from the
 * library build, so it is never part of a published entry.
 */

const ROOT = document.documentElement;

/** Every sheet Optimus writes into `<head>`. */
export const SHEETS = 'style[data-optimus-style-id]';
const STYLE_SHEETS = 'style[data-optimus-style-id$="-style"]';

export interface Snapshot {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** Every `--wj-*` name declared in a rule, walking `@layer` and `@media`. */
function declaredNames(list: CSSRuleList, names: Set<string>): void {
  for (const rule of Array.from(list)) {
    if (rule instanceof CSSStyleRule) {
      for (const name of Array.from(rule.style)) {
        if (name.startsWith('--wj-')) {
          names.add(name);
        }
      }
    }
    if (rule instanceof CSSGroupingRule) {
      declaredNames(rule.cssRules, names);
    }
  }
}

function resolved(names: readonly string[]): Record<string, string> {
  const style = getComputedStyle(ROOT);
  return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
}

/** Every `--wj-*` variable the Optimus sheets declare, as `<html>` resolves it, light and dark. */
export function snapshot(): Snapshot {
  const names = new Set<string>();
  document.head.querySelectorAll<HTMLStyleElement>(SHEETS).forEach((style) => {
    if (style.sheet) {
      declaredNames(style.sheet.cssRules, names);
    }
  });
  const sorted = Array.from(names).sort();
  const light = resolved(sorted);
  ROOT.classList.add('wj-dark');
  const dark = resolved(sorted);
  ROOT.classList.remove('wj-dark');
  return { light, dark };
}

/** The text of every `-style` sheet (`global-style` included), keyed by its Optimus id. */
export function styleSheets(): Record<string, string> {
  return Object.fromEntries(
    Array.from(document.head.querySelectorAll(STYLE_SHEETS)).map((style) => [
      style.getAttribute('data-optimus-style-id') ?? '',
      style.textContent,
    ]),
  );
}

/** The names whose value differs, or that only one side declares. */
function differences(a: Record<string, string>, b: Record<string, string>): string[] {
  return Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    .filter((name) => a[name] !== b[name])
    .map((name) => `${name}: ${a[name] ?? '(absent)'} vs ${b[name] ?? '(absent)'}`);
}

export function expectEqual(actual: Snapshot, expected: Snapshot): void {
  expect(Object.keys(actual.light).length).toBeGreaterThan(100);
  expect(differences(actual.light, expected.light)).toEqual([]);
  expect(differences(actual.dark, expected.dark)).toEqual([]);
}

/** A sheet on one side only fails, as does any difference in its text. */
export function expectSheetsEqual(
  actual: Record<string, string>,
  expected: Record<string, string>,
): void {
  expect(Object.keys(expected)).toContain('global-style');
  expect(differences(actual, expected)).toEqual([]);
}

/** What a page's theme is: the variables and the component `-style` sheets. */
export interface Page {
  vars: Snapshot;
  sheets: Record<string, string>;
}

export function capture(): Page {
  return { vars: snapshot(), sheets: styleSheets() };
}

export function expectPage(actual: Page, expected: Page): void {
  expectEqual(actual.vars, expected.vars);
  expectSheetsEqual(actual.sheets, expected.sheets);
}
