// @ts-check
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * The catalog (FR-7 ... FR-9, 07 Q2, Q6). Merges `projects/docs/coverage.json` (03's decisions,
 * hand-kept) with the API index (what ships), the pages' `DOC` files (title, purpose) and the
 * generated API (selectors, services), and writes `generated/catalog.json` and `generated/site.json`.
 * The Components index, Coming from Optimus, the not-found variants and the component-page sidebar
 * read only these. Run after `extract-api.mjs`.
 *
 * Shipped status is never listed by hand: an entry is shipped when `generated/api/index.json` lists
 * it. A 03 target that is not shipped yet is **planned**, which is a state, not a failure: the
 * guards below classify against Optimus's entry points and 03's counts, never against shipped status.
 *
 * Guards (each failure is collected, then the script exits 1):
 * - 03 Q4's counts per wave group, and 95 targets in all;
 * - every top-level Optimus entry point is in exactly one of `targets`, `notWrapped`, `foundation`,
 *   and nothing in those lists is missing from Optimus (a 03-vs-Optimus name mismatch);
 * - every shipped entry is a target or `own`;
 * - `planned` is exactly the targets minus the shipped entries, and every planned row is a target;
 * - every shipped entry has a `DOC` whose `title` and `purpose` read as string literals;
 * - README's compatibility table (FR-18, 14 Q3) gives the manifest's Angular and Optimus peer ranges.
 *
 * @typedef {{ id: string, label: string, wave: number }} CoverageGroup
 * @typedef {{ entries: string[], label: string, why: string, useInstead: string }} NotWrapped
 * @typedef {{ groups: CoverageGroup[], targets: Record<string, string>, own: Record<string, string>,
 *   notWrapped: NotWrapped[], foundation: string[] }} Coverage
 * @typedef {{ name: string, kind: 'component' | 'directive', selector: string }} ApiClassLite
 * @typedef {{ name: string, description: string }} ApiServiceLite
 * @typedef {{ classes: ApiClassLite[], services: ApiServiceLite[] }} ApiLite
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = join(root, 'projects', 'docs');
const generatedDir = join(docsRoot, 'src', 'generated');
const docsDir = join(docsRoot, 'src', 'app', 'pages', 'component', 'docs');
const libraryRoot = join(root, 'projects', 'weeljack-ng');

/** 03 Q4: how many targets each wave holds, W5's four groups together. */
const WAVE_COUNTS = { W1: 12, W2: 25, W3: 10, W4: 29, W5: 19 };
const TARGET_TOTAL = 95;

/**
 * @param {string} path
 * @returns {unknown}
 */
function readJson(path) {
  if (!existsSync(path)) {
    throw new Error(`extract-catalog: ${path} does not exist. Run npm run generate.`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** @param {string} id @returns {string} the wave group's wave key for 03's count (`W5a` -> `W5`) */
function waveKey(id) {
  return id.startsWith('W5') ? 'W5' : id;
}

/**
 * The string a node is, when it is a literal or an identifier that names a same-file `const` literal.
 * @param {ts.Expression} node
 * @param {Map<string, ts.Expression>} constants
 * @returns {string | undefined}
 */
function stringOf(node, constants) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) {
    const value = constants.get(node.text);
    return value === undefined ? undefined : stringOf(value, new Map());
  }
  return undefined;
}

/**
 * `title`, `purpose` and `optimusSelector` of `pages/component/docs/<entry>.ts`, read through the
 * TypeScript AST (FR-9). A same-file `const` string resolves; anything else is a failure naming the
 * entry. The family DOC file is never edited to satisfy this.
 * @param {string} entry
 * @returns {{ title: string, purpose: string, optimusSelector: string | null }}
 */
function readDoc(entry) {
  const path = join(docsDir, `${entry}.ts`);
  if (!existsSync(path)) {
    throw new Error(`extract-catalog: ${entry} is shipped but ${path} does not exist.`);
  }
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  /** @type {Map<string, ts.Expression>} */
  const constants = new Map();
  /** @type {ts.ObjectLiteralExpression | undefined} */
  let doc;
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) continue;
      let initializer = declaration.initializer;
      while (
        ts.isParenthesizedExpression(initializer) ||
        ts.isAsExpression(initializer) ||
        ts.isSatisfiesExpression(initializer)
      ) {
        initializer = initializer.expression;
      }
      if (declaration.name.text === 'DOC' && ts.isObjectLiteralExpression(initializer)) {
        doc = initializer;
      } else {
        constants.set(declaration.name.text, initializer);
      }
    }
  }
  if (doc === undefined) {
    throw new Error(`extract-catalog: ${entry}: ${path} has no \`DOC = { ... }\` object literal.`);
  }
  /** @param {string} key */
  const read = (key) => {
    const property = doc.properties.find(
      (item) => ts.isPropertyAssignment(item) && item.name.getText(source) === key,
    );
    if (property === undefined || !ts.isPropertyAssignment(property)) return undefined;
    const value = stringOf(property.initializer, constants);
    if (value === undefined) {
      throw new Error(
        `extract-catalog: ${entry}: DOC.${key} is not a string literal or a same-file const string. Write it as one.`,
      );
    }
    return value;
  };
  const title = read('title');
  const purpose = read('purpose');
  if (title === undefined || purpose === undefined || title === '' || purpose === '') {
    throw new Error(`extract-catalog: ${entry}: DOC needs a non-empty \`title\` and \`purpose\`.`);
  }
  return { title, purpose, optimusSelector: read('optimusSelector') ?? null };
}

/** The `ng-template[...]` directives are content slots, not the page's own selector. */
const isSlot = (/** @type {ApiClassLite} */ item) =>
  item.kind === 'directive' && item.selector.startsWith('ng-template[');

/**
 * What a shipped entry's page and API say, read from disk by `main` and stubbed by the self-check.
 * @typedef {{ doc: { title: string, purpose: string, optimusSelector: string | null }, api: ApiLite }} ShippedFacts
 * @typedef {{ cov: Coverage, apiIndex: { version: string, entries: string[] },
 *   optimusEntries: string[], readShipped: (entry: string) => ShippedFacts,
 *   peerDependencies: Record<string, string>, readme: string }} CatalogInputs
 */

/**
 * The pure builder: every guard, then the two documents. No file is read or written here, so the
 * "no planned entries" case can be fed an API index that ships every target (see `main` below).
 * @param {CatalogInputs} inputs
 */
export function buildCatalog({
  cov,
  apiIndex,
  optimusEntries,
  readShipped,
  peerDependencies,
  readme,
}) {
  /** @type {string[]} */
  const failures = [];
  const shipped = new Set(apiIndex.entries);

  // --- Guard: 03's counts -----------------------------------------------------------------------
  const groupIds = new Set(cov.groups.map((group) => group.id));
  /** @type {Record<string, number>} */
  const perWave = {};
  for (const [entry, group] of Object.entries(cov.targets)) {
    if (!groupIds.has(group)) {
      failures.push(`targets: "${entry}" is in unknown group "${group}".`);
      continue;
    }
    perWave[waveKey(group)] = (perWave[waveKey(group)] ?? 0) + 1;
  }
  for (const [wave, expected] of Object.entries(WAVE_COUNTS)) {
    const actual = perWave[wave] ?? 0;
    if (actual !== expected) {
      failures.push(
        `03 Q4 counts: ${wave} has ${String(actual)} target(s), expected ${String(expected)}.`,
      );
    }
  }
  const targetCount = Object.keys(cov.targets).length;
  if (targetCount !== TARGET_TOTAL) {
    failures.push(
      `03 Q4 counts: ${String(targetCount)} targets in all, expected ${String(TARGET_TOTAL)}.`,
    );
  }

  // --- Guard: every Optimus entry point is classified exactly once ------------------------------
  /** @type {Map<string, string[]>} where each name is classified */
  const classified = new Map();
  /** @param {string} name @param {string} list */
  const classify = (name, list) => {
    classified.set(name, [...(classified.get(name) ?? []), list]);
  };
  for (const entry of Object.keys(cov.targets)) classify(entry, 'targets');
  for (const row of cov.notWrapped) for (const entry of row.entries) classify(entry, 'notWrapped');
  for (const entry of cov.foundation) classify(entry, 'foundation');

  for (const entry of optimusEntries) {
    const lists = classified.get(entry) ?? [];
    if (lists.length === 0) {
      failures.push(
        `Optimus entry "${entry}" is in none of targets, notWrapped or foundation. Classify it in projects/docs/coverage.json (an Optimus minor that adds an entry needs a decision).`,
      );
    } else if (lists.length > 1) {
      failures.push(`Optimus entry "${entry}" is in more than one list: ${lists.join(', ')}.`);
    }
  }
  for (const [name, lists] of classified) {
    if (!optimusEntries.includes(name)) {
      failures.push(
        `coverage.json ${lists.join(', ')} names "${name}", which is not an Optimus entry point. Fix the name in coverage.json (03's name vs Optimus's export).`,
      );
    }
  }

  // --- Guard: every shipped entry is a target or own --------------------------------------------
  for (const entry of shipped) {
    if (!(entry in cov.targets) && !(entry in cov.own)) {
      failures.push(
        `shipped entry "${entry}" is neither a target nor own. Add it to projects/docs/coverage.json.`,
      );
    }
  }
  for (const [entry, group] of Object.entries(cov.own)) {
    if (!shipped.has(entry)) failures.push(`own entry "${entry}" is not shipped.`);
    if (!groupIds.has(group)) failures.push(`own: "${entry}" is in unknown group "${group}".`);
  }

  // --- Rows -------------------------------------------------------------------------------------
  /**
   * @param {string} entry
   * @param {boolean} own
   */
  function shippedRow(entry, own) {
    const {
      doc,
      api: { classes, services },
    } = readShipped(entry);
    const first = classes.find((item) => !isSlot(item));
    /** @type {string | null} a service-only entry has no class, hence no selector */
    let wjSelector = null;
    /** @type {'component' | 'directive' | 'service'} */
    let kind = 'service';
    if (first !== undefined) {
      wjSelector = first.selector;
      kind = first.kind;
    } else if (classes.length > 0) {
      wjSelector = `wj-${entry}`;
      kind = 'directive';
    }
    return {
      entry,
      status: /** @type {const} */ ('shipped'),
      own,
      title: doc.title,
      purpose: doc.purpose,
      wjSelector,
      optimusSelector: doc.optimusSelector ?? `p-${entry}`,
      kind,
      services: services.map((service) => ({
        name: service.name,
        description: service.description,
      })),
    };
  }

  /** @param {string} entry */
  function plannedRow(entry) {
    return {
      entry,
      status: /** @type {const} */ ('planned'),
      own: false,
      title: null,
      purpose: null,
      // FR-9's fallbacks: a planned entry has no class and no DOC yet.
      wjSelector: `wj-${entry}`,
      optimusSelector: `p-${entry}`,
      kind: null,
      services: [],
    };
  }

  let shippedTargets = 0;
  let shippedOwn = 0;
  let plannedCount = 0;
  /** @type {string[]} */
  const plannedEntries = [];
  /** @type {Record<string, { shipped: number, planned: number }>} */
  const perGroup = {};

  const groups = cov.groups.map((group) => {
    /** @type {(ReturnType<typeof shippedRow> | ReturnType<typeof plannedRow>)[]} */
    const rows = [];
    perGroup[group.id] = { shipped: 0, planned: 0 };
    for (const [entry, id] of Object.entries(cov.targets)) {
      if (id !== group.id) continue;
      if (shipped.has(entry)) {
        rows.push(shippedRow(entry, false));
        shippedTargets += 1;
        /** @type {{ shipped: number, planned: number }} */ (perGroup[group.id]).shipped += 1;
      } else {
        rows.push(plannedRow(entry));
        plannedEntries.push(entry);
        plannedCount += 1;
        /** @type {{ shipped: number, planned: number }} */ (perGroup[group.id]).planned += 1;
      }
    }
    for (const [entry, id] of Object.entries(cov.own)) {
      if (id !== group.id || !shipped.has(entry)) continue;
      rows.push(shippedRow(entry, true));
      shippedOwn += 1;
    }
    // Rows read in one alphabet, planned among shipped (ui-spec C3, E2).
    rows.sort((a, b) => a.entry.localeCompare(b.entry, 'en', { sensitivity: 'base' }));
    return { id: group.id, label: group.label, wave: group.wave, rows };
  });

  // --- Guard: planned = targets - shipped -------------------------------------------------------
  const expectedPlanned = Object.keys(cov.targets).filter((entry) => !shipped.has(entry));
  if (
    plannedCount !== expectedPlanned.length ||
    plannedEntries.some((entry) => !(entry in cov.targets)) ||
    expectedPlanned.some((entry) => !plannedEntries.includes(entry))
  ) {
    failures.push(
      `planned (${String(plannedCount)}) is not the 03 targets minus the shipped entries (${String(expectedPlanned.length)}).`,
    );
  }
  if (shippedTargets + plannedCount !== targetCount) {
    failures.push(
      `shipped targets (${String(shippedTargets)}) + planned (${String(plannedCount)}) is not ${String(targetCount)}.`,
    );
  }
  if (shippedTargets + shippedOwn !== shipped.size) {
    failures.push(
      `the catalog shows ${String(shippedTargets + shippedOwn)} shipped entries, the API index lists ${String(shipped.size)}.`,
    );
  }

  // --- Site facts -------------------------------------------------------------------------------
  // Every peer the manifest lists, so Get started's Install section names what npm will install.
  const peers = { ...peerDependencies };
  for (const name of ['@angular/core', '@openng/optimus-ui', '@openng/optimus-ui-themes']) {
    const range = peers[name];
    if (range === undefined || range === '') {
      failures.push(`projects/weeljack-ng/package.json has no peer range for ${name}.`);
    }
  }
  const major = /^(\d+)\./.exec(apiIndex.version)?.[1];
  if (major === undefined) {
    failures.push(`the API index version "${apiIndex.version}" is not a semver version.`);
  }

  // --- Guard: README's compatibility table matches the manifest's peers (FR-18, 14 Q3) ----------
  /** The line above README's table, which is also the docs' address (20 owed). */
  const PAGES_URL = 'https://locvodever.github.io/weeljack-ng/';
  const releaseLine = major === '0' ? '0.x' : `${String(major)}.x`;

  /** @param {string} line @returns {string[]} the cells of a Markdown table row, backticks removed */
  function cellsOf(line) {
    return line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll('`', ''));
  }

  const readmeLines = readme.replace(/\r\n/g, '\n').split('\n');
  const urlLine = readmeLines.findIndex((line) => line.includes(PAGES_URL));
  const headerLine =
    urlLine === -1
      ? -1
      : readmeLines.findIndex(
          (line, index) =>
            index > urlLine && /^\|\s*WeeljackNg\s*\|\s*Angular\s*\|\s*Optimus UI\s*\|/.test(line),
        );
  if (headerLine === -1) {
    failures.push(
      `README.md has no compatibility table (WeeljackNg | Angular | Optimus UI) under the ${PAGES_URL} line.`,
    );
  } else {
    const rows = [];
    // The row after the header is the `| --- |` rule; the table ends at the first non-row line.
    for (let index = headerLine + 2; (readmeLines[index] ?? '').startsWith('|'); index += 1) {
      rows.push(cellsOf(readmeLines[index] ?? ''));
    }
    const row = rows.find((cells) => cells[0] === releaseLine);
    const angular = peers['@angular/core'];
    const optimus = peers['@openng/optimus-ui'];
    if (row === undefined) {
      failures.push(`README.md's compatibility table has no row for the ${releaseLine} line.`);
    } else if (row[1] !== angular || row[2] !== optimus) {
      failures.push(
        `README.md's compatibility table says Angular ${String(row[1])} and Optimus UI ${String(row[2])}, but the manifest's peers are ${String(angular)} and ${String(optimus)}. Fix the README row to the manifest.`,
      );
    }
  }

  if (groups.every((group) => group.rows.length === 0) || cov.notWrapped.length === 0) {
    failures.push('the catalog is empty.');
  }

  const byGroup = Object.entries(perGroup)
    .map(([id, count]) => `${id} ${String(count.shipped)}/${String(count.shipped + count.planned)}`)
    .join(', ');
  return {
    failures,
    catalog: {
      groups,
      notWrapped: cov.notWrapped,
      counts: {
        shipped: shippedTargets,
        own: shippedOwn,
        planned: plannedCount,
        notWrapped: cov.notWrapped.length,
        targets: targetCount,
      },
    },
    site: { version: apiIndex.version, releaseLine, peers },
    log: [
      `extract-catalog: shipped ${String(shippedTargets)} (+ ${String(shippedOwn)} own) / planned ${String(plannedCount)} / not wrapped ${String(cov.notWrapped.length)} (${byGroup})`,
      `extract-catalog: planned = ${String(targetCount)} targets - ${String(shippedTargets)} shipped = ${String(plannedCount)}${plannedEntries.length > 0 ? `: ${plannedEntries.join(', ')}` : ''}`,
    ],
  };
}

/**
 * The "no planned entries" case (every target shipped, as when w2-forms-choice lands): the builder
 * must still emit its groups, plan nothing and pass every guard. Returns the reasons it did not.
 * @param {CatalogInputs} inputs the real inputs, whose API index is replaced by one shipping every target
 * @returns {string[]}
 */
export function checkNoPlanned(inputs) {
  const entries = [...Object.keys(inputs.cov.targets), ...Object.keys(inputs.cov.own)];
  const { failures, catalog } = buildCatalog({
    ...inputs,
    apiIndex: { ...inputs.apiIndex, entries },
    readShipped: () => ({
      doc: { title: 'Stub', purpose: 'Stub.', optimusSelector: null },
      api: { classes: [], services: [] },
    }),
  });
  const rows = catalog.groups.flatMap((group) => group.rows);
  const problems = failures.map((failure) => `guard: ${failure}`);
  if (catalog.counts.planned !== 0) problems.push('counts.planned is not 0.');
  if (rows.some((row) => row.status === 'planned')) problems.push('a planned row was emitted.');
  if (catalog.groups.length !== inputs.cov.groups.length) problems.push('a group was dropped.');
  if (rows.length !== entries.length) problems.push('a shipped entry has no row.');
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cov = /** @type {Coverage} */ (readJson(join(docsRoot, 'coverage.json')));
  const optimusManifest = /** @type {{ exports: Record<string, unknown> }} */ (
    readJson(join(root, 'node_modules', '@openng', 'optimus-ui', 'package.json'))
  );
  /** @type {CatalogInputs} */
  const inputs = {
    cov,
    apiIndex: /** @type {{ version: string, entries: string[] }} */ (
      readJson(join(generatedDir, 'api', 'index.json'))
    ),
    optimusEntries: Object.keys(optimusManifest.exports)
      .filter((key) => key !== '.' && key !== './package.json')
      .filter((key) => !key.startsWith('./types/') && !key.startsWith('./icons/'))
      .map((key) => key.replace(/^\.\//, ''))
      .sort(),
    readShipped: (entry) => ({
      doc: readDoc(entry),
      api: /** @type {ApiLite} */ (readJson(join(generatedDir, 'api', `${entry}.json`))),
    }),
    peerDependencies: /** @type {{ peerDependencies: Record<string, string> }} */ (
      readJson(join(libraryRoot, 'package.json'))
    ).peerDependencies,
    readme: readFileSync(join(root, 'README.md'), 'utf8'),
  };

  const noPlanned = checkNoPlanned(inputs);
  if (noPlanned.length > 0) {
    console.error(
      `extract-catalog: the no-planned-entries case failed:\n  ${noPlanned.join('\n  ')}`,
    );
    process.exit(1);
  }

  const { failures, catalog, site, log } = buildCatalog(inputs);
  if (failures.length > 0) {
    console.error(`extract-catalog: guard failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(
    join(generatedDir, 'catalog.json'),
    `${JSON.stringify(catalog, null, 2)}
`,
  );
  writeFileSync(
    join(generatedDir, 'site.json'),
    `${JSON.stringify(site, null, 2)}
`,
  );
  for (const line of log) console.log(line);
}
