import axe from 'axe-core';

/**
 * The axe helper (FR-21). It lives in `spec-support/`, which has no `ng-package.json`, is
 * excluded from `tsconfig.lib.json` and is imported only by `*.spec.ts` and `scripts/check-a11y.mjs`,
 * so ng-packagr never sees it and it can never be part of a published entry.
 *
 * One tag constant: WCAG 2.0 A through 2.2 AA. `target-size` (WCAG 2.2 AA, off by default in
 * axe-core) is switched on explicitly in {@link runAxe}.
 */
export const AXE_TAGS: string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Rules skipped by name, each with a written reason. Empty: nothing is skipped.
 * To skip a rule add `{ 'rule-id': 'why this rule cannot apply to a spec fixture' }`.
 */
const SKIPPED_RULES: Readonly<Record<string, string>> = {};

/**
 * The one axe configuration: {@link AXE_TAGS} plus `target-size`, minus {@link SKIPPED_RULES}.
 * Specs run it through {@link runAxe}; `scripts/check-a11y.mjs` runs the same object over the
 * prerendered docs pages. Only erasable TypeScript lives in this file, because that script loads
 * it under Node's type stripping.
 */
export const AXE_RUN_OPTIONS: axe.RunOptions = {
  runOnly: { type: 'tag', values: AXE_TAGS },
  rules: {
    'target-size': { enabled: true },
    ...Object.fromEntries(Object.keys(SKIPPED_RULES).map((id) => [id, { enabled: false }])),
  },
};

/** Runs axe over `context` (default: the whole document) and returns every violation. */
export async function runAxe(context: axe.ElementContext = document): Promise<axe.Result[]> {
  const results = await axe.run(context, AXE_RUN_OPTIONS);
  return results.violations;
}

function describeViolations(violations: axe.Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join('; ');
      return `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} — ${targets}`;
    })
    .join('\n');
}

/** Fails (throws) when axe finds any violation in `context`. */
export async function expectNoAxeViolations(context: axe.ElementContext = document): Promise<void> {
  const violations = await runAxe(context);
  if (violations.length > 0) {
    throw new Error(
      `Expected no axe violations, found ${String(violations.length)}:\n${describeViolations(violations)}`,
    );
  }
}
