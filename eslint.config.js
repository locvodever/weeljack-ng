// @ts-check
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';

/**
 * ESLint 10 flat config (CLAUDE.md § 7, FR-5).
 *
 * HOW THE RESTRICTIONS WORK
 * -------------------------
 * Flat config keeps only the LAST matching object's options for a rule, so a restriction written
 * as its own config object silently switches off every earlier one that matches the same file.
 * Restrictions are therefore DATA (`IMPORT_RESTRICTIONS`), and `restrictedImportsFor(region)`
 * composes every restriction that applies to a region into ONE `no-restricted-imports` entry.
 * Regions are mutually exclusive file sets (no inheritance), so each file matches one region.
 *
 * The same holds for `no-restricted-syntax`: the rendering-sink ban (CLAUDE.md § 5, 19) is data
 * (`TS_SINKS`, `TEMPLATE_SINKS`) composed into one entry per file kind.
 */

/**
 * @typedef {{ files: string[], ignores: string[] }} Region
 * @typedef {{
 *   in: string[],
 *   paths?: Array<{ name: string, importNames?: string[], message: string }>,
 *   patterns?: Array<{ group: string[], message: string }>,
 * }} ImportRestriction
 */

const LIB = 'projects/weeljack-ng';
const LIB_SPEC_FILES = [`${LIB}/**/*.spec.ts`, `${LIB}/spec-support/**/*.ts`];

/** @type {Record<string, Region>} */
const REGIONS = {
  lib: { files: [`${LIB}/**/*.ts`], ignores: LIB_SPEC_FILES },
  libSpec: { files: LIB_SPEC_FILES, ignores: [] },
  docs: { files: ['projects/docs/**/*.ts'], ignores: ['projects/docs/**/*.spec.ts'] },
  docsSpec: { files: ['projects/docs/**/*.spec.ts'], ignores: [] },
  tooling: { files: ['**/*.js', '**/*.mjs'], ignores: [] },
};

const ALL = Object.keys(REGIONS);
const SPECS = ['libSpec', 'docsSpec'];

/** @type {ImportRestriction[]} */
const IMPORT_RESTRICTIONS = [
  // 09: `@openng/*` lives only inside projects/weeljack-ng (the docs app and its examples included).
  {
    in: ['docs', 'docsSpec', 'tooling'],
    patterns: [
      {
        group: ['@openng', '@openng/**'],
        message:
          'Optimus is an internal adapter: import `@openng/*` only inside projects/weeljack-ng (ADR 0001).',
      },
    ],
  },
  // 21 Q5: zoneless. No zone.js anywhere.
  {
    in: ALL,
    patterns: [
      {
        group: ['zone.js', 'zone.js/**'],
        message: 'WeeljackNg is zoneless: do not import zone.js.',
      },
    ],
  },
  // 16 Q2: specs settle with `await fixture.whenStable()` or the harness, and render real Optimus.
  {
    in: SPECS,
    paths: [
      {
        name: '@angular/core/testing',
        importNames: ['fakeAsync', 'waitForAsync', 'tick', 'flush'],
        message:
          'Specs are zoneless: settle with `await fixture.whenStable()` or the harness; fake time only through `vi.useFakeTimers()` with the `// spec-timing:` marker.',
      },
      {
        name: '@angular/core',
        importNames: ['NO_ERRORS_SCHEMA', 'CUSTOM_ELEMENTS_SCHEMA'],
        message: 'Specs render the real component through a host template: no schemas, no stubs.',
      },
    ],
  },
];

/**
 * Composes every restriction that applies to `region` into one `no-restricted-imports` value.
 * @param {string} region
 * @returns {import('eslint').Linter.RuleEntry}
 */
function restrictedImportsFor(region) {
  const applicable = IMPORT_RESTRICTIONS.filter((restriction) => restriction.in.includes(region));
  if (applicable.length === 0) {
    return 'off';
  }
  const paths = applicable.flatMap((restriction) => restriction.paths ?? []);
  const patterns = applicable.flatMap((restriction) => restriction.patterns ?? []);
  return ['error', { paths, patterns }];
}

// Load-time validation: a typo in a region name would silently drop a restriction.
for (const restriction of IMPORT_RESTRICTIONS) {
  for (const name of restriction.in) {
    if (!(name in REGIONS)) {
      throw new Error(`eslint.config.js: unknown region '${name}' in an import restriction`);
    }
  }
}

/**
 * Rendering sinks in library TypeScript (CLAUDE.md § 5, 19).
 * `escape` may be set only to `true` (menu wrappers force it); any other value is a sink.
 */
const TS_SINKS = [
  {
    selector: 'MemberExpression[property.name=/^bypassSecurityTrust/]',
    message: 'Never bypass the sanitizer: no `DomSanitizer.bypassSecurityTrust*` (19).',
  },
  {
    selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
    message:
      'Never write HTML: no `.innerHTML =` / `.outerHTML =`. Render text through `{{ }}` (19).',
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message: 'Never write HTML: no `insertAdjacentHTML` (19).',
  },
  {
    selector:
      "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
    message: 'Never write HTML: no `document.write` (19).',
  },
  {
    selector: "Property[key.name='escape']:not([value.value=true])",
    message:
      'Never turn Optimus `escape` off or bind it: it is forced to `true` or not exposed (19).',
  },
];

/** Rendering sinks in templates (inline and `.html`), the same ban as TS_SINKS. */
const TEMPLATE_SINKS = [
  {
    selector: 'BoundAttribute[name=/^(attr\\.)?(inner|outer)html$/i]',
    message: 'Never bind HTML: no `[innerHTML]` / `[outerHTML]`. Render text through `{{ }}` (19).',
  },
  {
    selector: 'BoundAttribute[name=/^(attr\\.)?escape$/i]',
    message: 'Never bind `escape`: it is forced to `true` or not exposed (19).',
  },
  {
    selector: "TextAttribute[name='escape']",
    message: 'Never set `escape` from a template (19).',
  },
];

const TS_PROJECTS = [
  `${LIB}/tsconfig.lib.json`,
  `${LIB}/tsconfig.spec.json`,
  'projects/docs/tsconfig.app.json',
];

// Lints inline `template:` strings with the template rules. Typed optional upstream; fail loudly.
const inlineTemplates = angular.processInlineTemplates;
if (inlineTemplates === undefined) {
  throw new Error('eslint.config.js: angular-eslint exposes no processInlineTemplates');
}

export default defineConfig([
  { ignores: ['dist', '.angular', 'coverage', '.worktrees/**', 'out-tsc', 'node_modules'] },

  // TypeScript: strict type-checked + stylistic + angular-eslint.
  {
    files: ['**/*.ts'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    processor: inlineTemplates,
    languageOptions: {
      parserOptions: { project: TS_PROJECTS, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': [
        'error',
        { allowExplicitOnPush: false },
      ],
      // A decorated class is an Angular unit (component, directive, pipe), not a static bag.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      // 21 Q5: zoneless-correct, no zone stability APIs.
      'no-restricted-properties': [
        'error',
        { property: 'onStable', message: 'Zoneless: do not use NgZone.onStable.' },
        { property: 'onMicrotaskEmpty', message: 'Zoneless: do not use NgZone.onMicrotaskEmpty.' },
        { property: 'isStable', message: 'Zoneless: do not use ApplicationRef.isStable.' },
      ],
    },
  },

  // Per-region `no-restricted-imports`: every region sets it exactly once.
  ...Object.entries(REGIONS).map(([name, region]) => ({
    name: `weeljack/imports-${name}`,
    files: region.files,
    ignores: region.ignores,
    rules: { 'no-restricted-imports': restrictedImportsFor(name) },
  })),

  // Library source: selectors, `Wj` naming, rendering sinks, no eval.
  {
    name: 'weeljack/lib',
    files: [`${LIB}/**/*.ts`],
    ignores: LIB_SPEC_FILES,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'wj', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'wj', style: 'camelCase' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['class', 'interface', 'typeAlias', 'enum'],
          modifiers: ['exported'],
          format: ['PascalCase'],
          prefix: ['Wj'],
        },
      ],
      'no-restricted-syntax': ['error', ...TS_SINKS],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  // `weeljack-ng/private` exports start with `_` (01 Q4). Same rule key, so it replaces the
  // naming entry above for these files and states the full rule itself.
  {
    name: 'weeljack/lib-private',
    files: [`${LIB}/private/**/*.ts`],
    ignores: LIB_SPEC_FILES,
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variable', 'function', 'class', 'interface', 'typeAlias', 'enum'],
          modifiers: ['exported'],
          format: null,
          custom: { regex: '^_', match: true },
        },
      ],
    },
  },

  // Docs app: `docs` prefix.
  {
    name: 'weeljack/docs',
    files: ['projects/docs/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'docs', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'docs', style: 'camelCase' },
      ],
    },
  },

  // Templates.
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  {
    // Also matches the virtual `*.html` files the processor extracts from inline templates.
    name: 'weeljack/lib-templates',
    files: [`${LIB}/**/*.html`],
    rules: { 'no-restricted-syntax': ['error', ...TEMPLATE_SINKS] },
  },

  // Plain JS / MJS tooling: no type information.
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.recommended, tseslint.configs.disableTypeChecked],
  },

  // Last: turn off every rule Prettier owns.
  prettierConfig,
]);
