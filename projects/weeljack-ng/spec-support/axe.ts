import axe from 'axe-core';

/**
 * Spec-only axe helper (FR-21). It lives in `spec-support/`, which has no `ng-package.json`,
 * is excluded from `tsconfig.lib.json` and is imported only by `*.spec.ts`, so ng-packagr never
 * sees it and it can never be part of a published entry.
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

/** Runs axe over `context` (default: the whole document) and returns every violation. */
export async function runAxe(context: axe.ElementContext = document): Promise<axe.Result[]> {
  const rules: axe.RuleObject = { 'target-size': { enabled: true } };
  for (const id of Object.keys(SKIPPED_RULES)) {
    rules[id] = { enabled: false };
  }
  const results = await axe.run(context, { runOnly: { type: 'tag', values: AXE_TAGS }, rules });
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
