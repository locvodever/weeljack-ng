// @ts-check
import {
  EntryType,
  MemberTags,
  NgtscProgram,
  isDocEntryWithSourceInfo,
  createCompilerHost,
  readConfiguration,
} from '@angular/compiler-cli';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * API extraction (FR-24, 07 Q6). Runs `NgtscProgram#getApiDocumentation` over every shipped
 * component entry and writes `projects/docs/src/generated/api/<entry>.json` plus `index.json`,
 * which the docs app renders and prerenders its component routes from.
 *
 * The extractor is exported but undocumented (no semver promise). The fallback is Compodoc 2.0's
 * JSON export (07 Q6). Its empty-entry guard runs here, so `build:docs` fails on it.
 *
 * What the extractor lacks is read from the source instead: `PropertyEntry` has no default value,
 * so the default is the first argument of the `input()` / `model()` initialiser.
 *
 * @typedef {import('@angular/compiler-cli').DocEntry} DocEntry
 * @typedef {import('@angular/compiler-cli').DirectiveEntry} DirectiveEntry
 * @typedef {import('@angular/compiler-cli').PropertyEntry} PropertyEntry
 * @typedef {import('@angular/compiler-cli').ConstantEntry} ConstantEntry
 *
 * @typedef {{ name: string, alias: string, type: string, description: string,
 *   defaultValue: string | null, required: boolean }} ApiMember
 * @typedef {{ name: string, kind: 'component' | 'directive', selector: string,
 *   description: string, inputs: ApiMember[], outputs: ApiMember[], models: ApiMember[] }} ApiClass
 * @typedef {{ name: string, type: string, description: string }} ApiType
 * @typedef {{ entry: string, importPath: string, classes: ApiClass[], types: ApiType[] }} ApiDocument
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libraryRoot = join(root, 'projects', 'weeljack-ng');
const outDir = join(root, 'projects', 'docs', 'src', 'generated', 'api');

/** Secondary entries that are not component entries: they get no page and no guard. */
const NON_COMPONENT_ENTRIES = new Set(['private', 'locale']);

/** @param {string} path */
function toPosix(path) {
  return path.split(sep).join('/');
}

/** Every `weeljack-ng/<entry>` folder (one level deep) that carries an `ng-package.json`. */
function discoverEntries() {
  return readdirSync(libraryRoot, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => existsSync(join(libraryRoot, name, 'ng-package.json')))
    .filter((name) => !NON_COMPONENT_ENTRIES.has(name))
    .sort();
}

/** Collapses JSDoc line wrapping so a description is one line of text. */
function oneLine(/** @type {string} */ text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Splits `text` at the first top-level comma (outside `<>`, `()`, `[]`, `{}` and quotes).
 * @param {string} text
 */
function firstTypeArgument(text) {
  let depth = 0;
  let quote = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (quote !== '') {
      if (char === quote) quote = '';
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if ('<([{'.includes(char)) {
      depth += 1;
    } else if ('>)]}'.includes(char)) {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      return text.slice(0, index).trim();
    }
  }
  return text.trim();
}

/**
 * `InputSignal<T>`, `InputSignalWithTransform<T, U>`, `ModelSignal<T>` and `OutputEmitterRef<T>`
 * become `T`: the docs show the value type, not the signal wrapper.
 * @param {string} type
 */
function valueType(type) {
  const match =
    /^(?:InputSignal|InputSignalWithTransform|ModelSignal|OutputEmitterRef)<(.*)>$/s.exec(type);
  return match?.[1] === undefined ? type : firstTypeArgument(match[1]);
}

/**
 * Reads `input(...)` / `input.required(...)` / `model(...)` initialisers of one class.
 * @param {ts.SourceFile} source
 * @param {string} className
 * @returns {Map<string, { required: boolean, defaultValue: string | null }>}
 */
function readInitialisers(source, className) {
  /** @type {Map<string, { required: boolean, defaultValue: string | null }>} */
  const found = new Map();
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      for (const member of node.members) {
        if (
          !ts.isPropertyDeclaration(member) ||
          !ts.isIdentifier(member.name) ||
          member.initializer === undefined ||
          !ts.isCallExpression(member.initializer)
        ) {
          continue;
        }
        const callee = member.initializer.expression;
        const required =
          ts.isPropertyAccessExpression(callee) &&
          callee.name.text === 'required' &&
          ts.isIdentifier(callee.expression) &&
          ['input', 'model'].includes(callee.expression.text);
        const plain = ts.isIdentifier(callee) && ['input', 'model'].includes(callee.text);
        if (!required && !plain) continue;
        const first = member.initializer.arguments[0];
        found.set(member.name.text, {
          required,
          defaultValue: required
            ? null
            : first === undefined
              ? 'undefined'
              : oneLine(first.getText(source)),
        });
      }
    } else {
      ts.forEachChild(node, visit);
    }
  };
  visit(source);
  return found;
}

/**
 * @param {DirectiveEntry} entry
 * @param {ts.Program} tsProgram
 * @returns {ApiClass}
 */
function toApiClass(entry, tsProgram) {
  if (!isDocEntryWithSourceInfo(entry)) {
    throw new Error(`extract-api: ${entry.name} has no source location.`);
  }
  const filePath = entry.source.filePath;
  // The extractor strips the program's current directory from the path with a plain string
  // replace. On Linux that leaves `/projects/...`, so join it back; on Windows the separators
  // differ, nothing is stripped, and the path is already absolute.
  const source =
    tsProgram.getSourceFile(filePath) ??
    tsProgram.getSourceFile(toPosix(join(tsProgram.getCurrentDirectory(), filePath)));
  if (source === undefined) {
    throw new Error(`extract-api: ${filePath} is not in the program.`);
  }
  const initialisers = readInitialisers(source, entry.name);

  /** @type {ApiClass} */
  const result = {
    name: entry.name,
    kind: entry.entryType === EntryType.Component ? 'component' : 'directive',
    selector: entry.selector,
    description: oneLine(entry.description),
    inputs: [],
    outputs: [],
    models: [],
  };

  for (const member of /** @type {PropertyEntry[]} */ (entry.members)) {
    const isInput = member.memberTags.includes(MemberTags.Input);
    const isOutput = member.memberTags.includes(MemberTags.Output);
    if (!isInput && !isOutput) continue;
    if (member.memberTags.includes(MemberTags.Protected)) continue;
    const initialiser = initialisers.get(member.name);
    /** @type {ApiMember} */
    const api = {
      name: member.name,
      alias: (isInput ? member.inputAlias : member.outputAlias) ?? member.name,
      type: valueType(member.type),
      description: oneLine(member.description),
      defaultValue: initialiser?.defaultValue ?? null,
      required: member.isRequiredInput ?? false,
    };
    if (isInput && isOutput) {
      result.models.push(api);
    } else if (isInput) {
      result.inputs.push(api);
    } else {
      result.outputs.push(api);
    }
  }
  return result;
}

const config = readConfiguration(join(libraryRoot, 'tsconfig.lib.json'));
if (config.errors.length > 0) {
  throw new Error(
    `extract-api: tsconfig.lib.json has errors:\n${config.errors.map((error) => String(error.messageText)).join('\n')}`,
  );
}
const program = new NgtscProgram(
  config.rootNames,
  config.options,
  createCompilerHost({ options: config.options }),
);
const tsProgram = program.getTsProgram();

mkdirSync(outDir, { recursive: true });
const entries = discoverEntries();
/** @type {string[]} */
const failures = [];

for (const entry of entries) {
  const entryPoint = toPosix(resolve(libraryRoot, entry, 'public-api.ts'));
  const { entries: docEntries } = program.getApiDocumentation(entryPoint, new Set());

  /** @type {ApiDocument} */
  const document = { entry, importPath: `weeljack-ng/${entry}`, classes: [], types: [] };
  for (const docEntry of docEntries) {
    if (docEntry.entryType === EntryType.Component || docEntry.entryType === EntryType.Directive) {
      document.classes.push(toApiClass(/** @type {DirectiveEntry} */ (docEntry), tsProgram));
    } else if (docEntry.entryType === EntryType.TypeAlias) {
      const alias = /** @type {ConstantEntry} */ (docEntry);
      document.types.push({
        name: alias.name,
        type: oneLine(alias.type),
        description: oneLine(alias.description),
      });
    }
  }
  document.classes.sort((a, b) => a.name.localeCompare(b.name));
  document.types.sort((a, b) => a.name.localeCompare(b.name));

  // Empty-entry guard (07 Q6): a shipped component entry must yield an input or an output.
  const memberCount = document.classes.reduce(
    (total, item) => total + item.inputs.length + item.outputs.length + item.models.length,
    0,
  );
  if (document.classes.length === 0 || memberCount === 0) {
    failures.push(
      `weeljack-ng/${entry}: the extractor found ${String(document.classes.length)} component(s) and ${String(memberCount)} input/output member(s). A shipped component entry must yield at least one. Check ${relative(root, join(libraryRoot, entry, 'public-api.ts'))}, or the extractor itself (undocumented API; fallback: Compodoc 2.0 JSON, 07 Q6).`,
    );
    continue;
  }
  writeFileSync(join(outDir, `${entry}.json`), `${JSON.stringify(document, null, 2)}\n`);
  console.log(
    `extract-api: ${entry} -> ${String(document.classes.length)} class(es), ${String(memberCount)} member(s)`,
  );
}

if (failures.length > 0) {
  console.error(`extract-api: empty-entry guard failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

/** @type {{ version: string }} */
const libraryManifest = JSON.parse(readFileSync(join(libraryRoot, 'package.json'), 'utf8'));
writeFileSync(
  join(outDir, 'index.json'),
  `${JSON.stringify({ version: libraryManifest.version, entries }, null, 2)}\n`,
);
console.log(
  `extract-api: index.json -> ${entries.join(', ')} (version ${libraryManifest.version})`,
);
