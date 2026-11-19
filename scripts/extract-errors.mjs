// @ts-check
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * The errors registry (FR-19, 21 Q8). Scans the library's non-spec source for every dev warning,
 * `_warnOnce(code, selector, what, fix)` and the `warn(optimus, code, selector, what, fix)` that
 * `private/dev-warnings.ts` keeps behind `_checkWeeljackSetup` and `_checkAriaOnHost`, and writes
 * `generated/errors.json`, which the `/errors` index and one `/errors/WJ<NNNN>` page per code
 * prerender from. The library is read, never edited.
 *
 * A string is read as the compiler sees it: a literal, a `const` initialiser (local, or exported
 * from another file, such as `_WJ0010`), a `+` concatenation, or a template literal whose `${...}`
 * becomes "…". An argument that is a parameter of the enclosing helper (`selector` in
 * `_checkNotInField`, `instead` in `_checkAriaOnHost`) is resolved from every call site of that
 * helper, one result per call site.
 *
 * - `WJ0001` / `WJ0002` come from `_checkWeeljackSetup`, so they are raised by every WeeljackNg
 *   component; the registry keeps the call-site count.
 * - `WJ0003` comes from `_checkAriaOnHost`, whose `instead` sentence differs per component: the
 *   registry keeps the default sentence plus a row per component.
 * - A code's variants are its distinct "what is wrong" sentences (and fixes), each with the
 *   selectors that raise it (`WJ0160` has three call sites and two wordings).
 *
 * Guards (each failure is collected, then the script exits 1): a code that does not resolve to a
 * string, a code that is not `WJ` + four digits, a selector, sentence or fix that does not resolve,
 * a `WJ<NNNN>` string literal in the source that no warning call passes (a warning shape this scan
 * does not read), a missing `dev-warnings.ts` helper, and no codes at all.
 *
 * @typedef {{ code: string, selector: string, what: string, fix: string, fixIsParam: boolean,
 *   helper: string | null, where: string }} Raised
 * @typedef {{ selector: string, selectors: string[], what: string, fix: string, message: string }} ErrorVariant
 * @typedef {{ code: string, everyComponent: boolean, callSites: number | null, selectors: string[],
 *   variants: ErrorVariant[], defaultFix: string | null,
 *   components: { selector: string, fix: string }[] | null }} ErrorCode
 * @typedef {{ docs: string, codes: ErrorCode[] }} ErrorsDocument
 * @typedef {Map<string, string>} Env parameter values of one helper call site
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libraryRoot = join(root, 'projects', 'weeljack-ng');
const outFile = join(root, 'projects', 'docs', 'src', 'generated', 'errors.json');

const WARNINGS_FILE = 'private/dev-warnings.ts';
const SETUP_HELPER = '_checkWeeljackSetup';
const ARIA_HELPER = '_checkAriaOnHost';
const CODE_FORMAT = /^WJ\d{4}$/;
const HOLE = '…';

/** @param {string} path */
function toPosix(path) {
  return path.split(sep).join('/');
}

/** Non-spec library sources: no `*.spec.ts`, no `spec-support/`, no `testing/`. */
function readLibrarySources() {
  /** @type {Map<string, string>} */
  const sources = new Map();
  /** @param {string} dir */
  const walk = (dir) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) {
        if (
          item.name !== 'node_modules' &&
          item.name !== 'spec-support' &&
          item.name !== 'testing'
        ) {
          walk(path);
        }
      } else if (item.name.endsWith('.ts') && !item.name.endsWith('.spec.ts')) {
        sources.set(toPosix(relative(libraryRoot, path)), readFileSync(path, 'utf8'));
      }
    }
  };
  walk(libraryRoot);
  return sources;
}

/** @param {ts.Node} node @param {(node: ts.Node) => void} visit */
function walkTree(node, visit) {
  visit(node);
  ts.forEachChild(node, (child) => {
    walkTree(child, visit);
  });
}

/** @param {ts.Node} node */
function enclosingFunction(node) {
  /** @type {ts.Node | undefined} */
  let current = node.parent;
  while (current !== undefined) {
    if (ts.isFunctionDeclaration(current)) return current;
    current = current.parent;
  }
  return undefined;
}

/** @param {ts.Node} node */
function where(node) {
  const file = node.getSourceFile();
  const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
  return `${file.fileName}:${String(line + 1)}`;
}

/**
 * Scans library sources and returns the registry, or the guard failures.
 * @param {ReadonlyMap<string, string>} sources path (relative to the library) to source text
 * @returns {{ document: ErrorsDocument | null, failures: string[] }}
 */
export function scanErrors(sources) {
  /** @type {string[]} */
  const failures = [];
  /** @type {ts.SourceFile[]} */
  const files = [];
  for (const [path, text] of sources) {
    files.push(ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true));
  }

  // Top-level `const NAME = <expression>`, per file and exported across files.
  /** @type {Map<string, Map<string, ts.Expression>>} */
  const fileConsts = new Map();
  /** @type {Map<string, ts.Expression>} */
  const exportedConsts = new Map();
  /** @type {Map<string, ts.CallExpression[]>} */
  const callsByName = new Map();
  /** @type {Map<string, ts.FunctionDeclaration>} */
  const functions = new Map();
  /** @type {ts.CallExpression[]} */
  const warnCalls = [];
  /** @type {ts.StringLiteralLike[]} */
  const codeLiterals = [];

  for (const file of files) {
    /** @type {Map<string, ts.Expression>} */
    const consts = new Map();
    fileConsts.set(file.fileName, consts);
    for (const statement of file.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      const exported =
        ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true;
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer !== undefined) {
          consts.set(declaration.name.text, declaration.initializer);
          if (exported) exportedConsts.set(declaration.name.text, declaration.initializer);
        }
      }
    }
    walkTree(file, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
        functions.set(`${file.fileName}#${node.name.text}`, node);
        if (!functions.has(node.name.text)) functions.set(node.name.text, node);
      }
      if (ts.isStringLiteral(node) && CODE_FORMAT.test(node.text)) codeLiterals.push(node);
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        callsByName.set(name, [...(callsByName.get(name) ?? []), node]);
        if (name === '_warnOnce') warnCalls.push(node);
        // `warn` is private to dev-warnings.ts; the call inside `_warnOnce` only passes arguments on.
        if (name === 'warn' && file.fileName === WARNINGS_FILE) {
          if (enclosingFunction(node)?.name?.text !== '_warnOnce') warnCalls.push(node);
        }
      }
    });
  }

  const warningsFile = files.find((file) => file.fileName === WARNINGS_FILE);
  if (warningsFile === undefined) {
    failures.push(`${WARNINGS_FILE} is not in the library source: the warning helpers moved.`);
    return { document: null, failures };
  }
  for (const helper of ['_warnOnce', SETUP_HELPER, ARIA_HELPER]) {
    if (!functions.has(`${WARNINGS_FILE}#${helper}`)) {
      failures.push(`${WARNINGS_FILE} no longer declares ${helper}().`);
    }
  }

  const docsInit = fileConsts.get(WARNINGS_FILE)?.get('DOCS');
  const docs = docsInit !== undefined && ts.isStringLiteralLike(docsInit) ? docsInit.text : null;
  if (docs === null || !/^https:\/\/\S+[^/]$/.test(docs)) {
    failures.push(`${WARNINGS_FILE} has no string \`const DOCS\` without a trailing slash.`);
  }

  /**
   * @param {ts.Expression} node
   * @param {Env} env parameter values of the enclosing helper for this call site
   * @param {number} [depth]
   * @returns {string | null}
   */
  function evalString(node, env, depth = 0) {
    if (depth > 8) return null;
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {
      return evalString(node.expression, env, depth + 1);
    }
    if (ts.isTemplateExpression(node)) {
      let text = node.head.text;
      for (const span of node.templateSpans) text += HOLE + span.literal.text;
      return text;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = evalString(node.left, env, depth + 1);
      const right = evalString(node.right, env, depth + 1);
      return left === null || right === null ? null : left + right;
    }
    if (ts.isIdentifier(node)) {
      const bound = env.get(node.text);
      if (bound !== undefined) return bound;
      const init =
        fileConsts.get(node.getSourceFile().fileName)?.get(node.text) ??
        exportedConsts.get(node.text);
      return init === undefined ? null : evalString(init, new Map(), depth + 1);
    }
    return null;
  }

  /** @type {Map<ts.FunctionDeclaration, Env[]>} */
  const bindingCache = new Map();

  /**
   * One parameter map per call site of `fn` (resolving through callers that are helpers too).
   * @param {ts.FunctionDeclaration} fn
   * @returns {Env[]}
   */
  function bindingsFor(fn) {
    const cached = bindingCache.get(fn);
    if (cached !== undefined) return cached;
    bindingCache.set(fn, []);
    /** @type {Env[]} */
    const result = [];
    const name = fn.name?.text ?? '';
    for (const call of callsByName.get(name) ?? []) {
      const outer = enclosingFunction(call);
      const outerEnvs = outer !== undefined && outer !== fn ? bindingsFor(outer) : [];
      for (const outerEnv of outerEnvs.length > 0 ? outerEnvs : [new Map()]) {
        /** @type {Env} */
        const env = new Map();
        fn.parameters.forEach((parameter, index) => {
          if (!ts.isIdentifier(parameter.name)) return;
          const argument = call.arguments[index];
          const source = argument ?? parameter.initializer;
          const value =
            source === undefined
              ? null
              : evalString(source, argument === undefined ? new Map() : outerEnv);
          if (value !== null && ts.isIdentifier(parameter.name))
            env.set(parameter.name.text, value);
        });
        result.push(env);
      }
    }
    bindingCache.set(fn, result);
    return result;
  }

  /** @type {Raised[]} */
  const raised = [];

  for (const call of warnCalls) {
    const isWarn = ts.isIdentifier(call.expression) && call.expression.text === 'warn';
    const offset = isWarn ? 1 : 0;
    const [codeArg, selectorArg, whatArg, fixArg] = call.arguments.slice(offset);
    const at = where(call);
    if (!codeArg || !selectorArg || !whatArg || !fixArg) {
      failures.push(
        `${at}: a warning call needs a code, a selector, what is wrong and what to do.`,
      );
      continue;
    }
    const helperFn = enclosingFunction(call);
    const helper = helperFn?.name?.text ?? null;
    const envs = helperFn === undefined ? [] : bindingsFor(helperFn);
    const fixParam =
      helperFn !== undefined &&
      ts.isIdentifier(fixArg) &&
      helperFn.parameters.some((p) => ts.isIdentifier(p.name) && p.name.text === fixArg.text);
    for (const env of envs.length > 0 ? envs : [new Map()]) {
      const code = evalString(codeArg, env);
      if (code === null) {
        failures.push(
          `${at}: the warning code \`${codeArg.getText()}\` does not resolve to a string.`,
        );
        continue;
      }
      if (!CODE_FORMAT.test(code)) {
        failures.push(`${at}: "${code}" is not a WJ code (WJ + four digits).`);
        continue;
      }
      const selector = evalString(selectorArg, env);
      const what = evalString(whatArg, env);
      const fix = evalString(fixArg, env);
      if (selector === null || what === null || fix === null) {
        const lost = [
          [selector, 'selector', selectorArg],
          [what, 'what is wrong', whatArg],
          [fix, 'what to do', fixArg],
        ].flatMap(([value, label, node]) =>
          value === null && typeof label === 'string' && typeof node === 'object'
            ? [`${label} \`${/** @type {ts.Node} */ (node).getText()}\``]
            : [],
        );
        failures.push(`${at}: ${code} has ${lost.join(', ')} that does not resolve to a string.`);
        continue;
      }
      raised.push({ code, selector, what, fix, fixIsParam: fixParam, helper, where: at });
    }
  }

  // A `WJ<NNNN>` literal that no warning passes means a shape this scan does not read.
  const found = new Set(raised.map((item) => item.code));
  for (const literal of codeLiterals) {
    if (!found.has(literal.text)) {
      failures.push(
        `${where(literal)}: the literal "${literal.text}" is never passed to a warning this scan reads (_warnOnce, or warn in ${WARNINGS_FILE}).`,
      );
    }
  }
  if (raised.length === 0) failures.push('no WJ code was found: the scan reads nothing.');

  /** @type {Map<string, Raised[]>} */
  const byCode = new Map();
  for (const item of raised) byCode.set(item.code, [...(byCode.get(item.code) ?? []), item]);

  /** A `wj-` element selector reads best in a sample message. */
  const sample = (/** @type {string[]} */ selectors) =>
    selectors.find((selector) => selector.startsWith('wj-')) ?? selectors[0] ?? '';

  /** @type {ErrorCode[]} */
  const codes = [];
  for (const code of [...byCode.keys()].sort()) {
    const items = byCode.get(code) ?? [];
    const everyComponent = items.some((item) => item.helper === SETUP_HELPER);
    const perComponent = items.some((item) => item.fixIsParam);
    /** @type {string | null} */
    let defaultFix = null;
    if (perComponent) {
      const parameter = functions
        .get(`${WARNINGS_FILE}#${items.find((item) => item.fixIsParam)?.helper ?? ''}`)
        ?.parameters.find((p) => p.initializer !== undefined);
      defaultFix =
        parameter?.initializer === undefined ? null : evalString(parameter.initializer, new Map());
      if (defaultFix === null) {
        failures.push(`${code}: its fix is a helper parameter with no string default.`);
        continue;
      }
    }
    const selectors = [...new Set(items.map((item) => item.selector))].sort();
    /** @type {Map<string, { what: string, fix: string, selectors: Set<string> }>} */
    const variantMap = new Map();
    for (const item of items) {
      const fix = perComponent ? (defaultFix ?? '') : item.fix;
      const key = `${item.what}\u0000${fix}`;
      const variant = variantMap.get(key) ?? { what: item.what, fix, selectors: new Set() };
      variant.selectors.add(item.selector);
      variantMap.set(key, variant);
    }
    const variants = [...variantMap.values()]
      .map((variant) => {
        const list = [...variant.selectors].sort();
        return {
          selector: sample(list),
          selectors: list,
          what: variant.what,
          fix: variant.fix,
          message: `${code}: ${sample(list)}: ${variant.what}. ${variant.fix}. Find more at ${docs ?? ''}/errors/${code}`,
        };
      })
      .sort((a, b) => (a.selectors[0] ?? '').localeCompare(b.selectors[0] ?? ''));
    const components = perComponent
      ? [...new Map(items.map((item) => [item.selector, item.fix])).entries()]
          .map(([selector, fix]) => ({ selector, fix }))
          .sort((a, b) => a.selector.localeCompare(b.selector))
      : null;
    codes.push({
      code,
      everyComponent,
      callSites: everyComponent ? items.length : null,
      selectors,
      variants,
      defaultFix,
      components,
    });
  }

  if (failures.length > 0 || docs === null) return { document: null, failures };
  return { document: { docs, codes }, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { document, failures } = scanErrors(readLibrarySources());
  if (document === null || failures.length > 0) {
    console.error(`extract-errors: guard failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(document, null, 2)}\n`);
  const summary = document.codes
    .map((item) => {
      const raisedBy = item.everyComponent
        ? `every component, ${String(item.callSites)} call sites`
        : `${String(item.selectors.length)} selector(s)`;
      return `${item.code} (${String(item.variants.length)} variant(s), ${raisedBy})`;
    })
    .join(', ');
  console.log(`extract-errors: ${String(document.codes.length)} codes: ${summary}`);
}
