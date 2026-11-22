// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { ROOT } from './entries.mjs';

/**
 * `generate:icons` (ADR 0008). Turns the pinned devDependency `lucide` into the one source file the
 * `weeljack-ng/icon` entry ships its set from: `icon/icon-set.ts`, one `WjIconDef` constant per name
 * in `icon/icon-set.json`. Lucide's ES modules already export each icon as a `[tag, attrs][]` list,
 * so this reads data and never parses SVG text. The file carries 08 Q3's header and is formatted
 * with the repo's Prettier config, so `npm run lint` and the drift check never disagree.
 *
 * `--check` writes nothing and exits 1 when `icon-set.ts` differs from what would be written, or when
 * `THIRD-PARTY-NOTICES.md` lacks a `## lucide <version>` section holding the package `LICENSE`
 * verbatim; `npm run build` runs it first.
 *
 * @typedef {Record<string, unknown>} Dictionary
 * @typedef {{ name: string, nodes: [string, Record<string, string | number>][], feather: boolean }} Icon
 */
const PACKAGE = join(ROOT, 'node_modules', 'lucide');
const ESM = join(PACKAGE, 'dist', 'esm');
const ICON_DIR = join(ROOT, 'projects', 'weeljack-ng', 'icon');
const SET_FILE = join(ICON_DIR, 'icon-set.ts');
const LIST_FILE = join(ICON_DIR, 'icon-set.json');
const NOTICES = join(ROOT, 'THIRD-PARTY-NOTICES.md');

/** The seven tags `WjIcon` draws and, per tag, the attributes its template binds (plus the paint pair). */
/** @type {Record<string, string[]>} */
const TAG_ATTRIBUTES = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
};
const PAINT_ATTRIBUTES = ['fill', 'stroke'];

/** @param {unknown} value @returns {value is Dictionary} */
function isDictionary(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {value is string | number} */
function isScalar(value) {
  return typeof value === 'string' || typeof value === 'number';
}

/** @param {string} file @returns {string} the file's text with LF line endings */
function readLf(file) {
  return readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
}

/** @param {string} name `arrow-left` -> `ArrowLeft` */
function pascal(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Lucide's alias index: every exported name (PascalCase) -> the icon file it comes from, so a
 * renamed icon's old name still resolves.
 * @returns {Map<string, string>}
 */
function readAliases() {
  /** @type {Map<string, string>} */
  const aliases = new Map();
  for (const line of readFileSync(join(ESM, 'iconsAndAliases.mjs'), 'utf8').split(/\r?\n/)) {
    const match = /^export \{ (.+) \} from '\.\/icons\/(.+)\.mjs';$/.exec(line);
    if (match?.[1] === undefined || match[2] === undefined) continue;
    for (const part of match[1].split(',')) {
      const exported = part.trim().split(/\s+as\s+/)[1];
      if (exported !== undefined) aliases.set(exported, match[2]);
    }
  }
  return aliases;
}

/** @returns {{ source: string, groups: [string, string[]][] }} the validated `icon-set.json` */
function readList() {
  /** @type {unknown} */
  const json = JSON.parse(readFileSync(LIST_FILE, 'utf8'));
  if (!isDictionary(json) || json['source'] !== 'lucide' || !isDictionary(json['icons'])) {
    throw new Error(
      'generate-icons: icon-set.json needs `source: "lucide"` and an `icons` object.',
    );
  }
  /** @type {[string, string[]][]} */
  const groups = [];
  for (const [group, names] of Object.entries(json['icons'])) {
    if (!Array.isArray(names) || names.length === 0 || !names.every((n) => typeof n === 'string')) {
      throw new Error(
        `generate-icons: icon-set.json group \`${group}\` is empty or not a list of names.`,
      );
    }
    groups.push([group, /** @type {string[]} */ (names)]);
  }
  const seen = new Set();
  for (const name of groups.flatMap(([, names]) => names)) {
    if (seen.has(name))
      throw new Error(`generate-icons: \`${name}\` is listed twice in icon-set.json.`);
    seen.add(name);
  }
  return { source: 'lucide', groups };
}

/** @returns {string[]} the old names the `LICENSE` lists as derived from Feather */
function featherNames() {
  const text = readLf(join(PACKAGE, 'LICENSE'));
  const marker = 'The following Lucide icons are derived from the Feather project:';
  const start = text.indexOf(marker);
  if (start === -1) throw new Error('generate-icons: the package LICENSE has no Feather list.');
  const list = text.slice(start + marker.length).split('\n\n')[1] ?? '';
  return list
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
}

/**
 * @param {string} name the Lucide name, for messages
 * @param {unknown} nodes the icon module's default export
 * @returns {[string, Record<string, string | number>][]} the validated node list
 */
function readNodes(name, nodes) {
  if (!Array.isArray(nodes))
    throw new Error(`generate-icons: \`${name}\` does not export a node list.`);
  /** @type {[string, Record<string, string | number>][]} */
  const result = [];
  for (const node of /** @type {unknown[]} */ (nodes)) {
    const tag = Array.isArray(node) ? /** @type {unknown} */ (node[0]) : undefined;
    const attributes = Array.isArray(node) ? /** @type {unknown} */ (node[1]) : undefined;
    if (typeof tag !== 'string' || !(tag in TAG_ATTRIBUTES) || !isDictionary(attributes)) {
      throw new Error(
        `generate-icons: \`${name}\` has a node with the tag \`${String(tag)}\`, which wj-icon does not draw.`,
      );
    }
    const allowed = [...(TAG_ATTRIBUTES[tag] ?? []), ...PAINT_ATTRIBUTES];
    /** @type {Record<string, string | number>} */
    const clean = {};
    for (const [attribute, value] of Object.entries(attributes)) {
      if (!allowed.includes(attribute) || !isScalar(value)) {
        throw new Error(
          `generate-icons: \`${name}\` has \`<${tag} ${attribute}>\`, which wj-icon does not bind.`,
        );
      }
      clean[attribute] = value;
    }
    result.push([tag, clean]);
  }
  return result;
}

/** @returns {Promise<{ icons: Icon[], viewBox: string, version: string }>} */
async function readIcons() {
  const { groups } = readList();
  const aliases = readAliases();
  const feather = new Set(
    featherNames().flatMap((old) => {
      const file = existsSync(join(ESM, 'icons', `${old}.mjs`)) ? old : aliases.get(pascal(old));
      return file === undefined ? [] : [file];
    }),
  );
  /** @type {unknown} */
  const defaults = (await import(pathToFileURL(join(ESM, 'defaultAttributes.mjs')).href)).default;
  const viewBox = isDictionary(defaults) ? defaults['viewBox'] : undefined;
  if (typeof viewBox !== 'string') {
    throw new Error('generate-icons: defaultAttributes.mjs has no string viewBox.');
  }
  /** @type {unknown} */
  const manifest = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8'));
  const version = isDictionary(manifest) ? manifest['version'] : undefined;
  if (typeof version !== 'string') throw new Error('generate-icons: lucide has no version.');

  /** @type {Icon[]} */
  const icons = [];
  for (const name of groups.flatMap(([, names]) => names)) {
    const file = join(ESM, 'icons', `${name}.mjs`);
    if (!existsSync(file)) {
      const canonical = aliases.get(pascal(name));
      throw new Error(
        canonical === undefined
          ? `generate-icons: \`${name}\` is not an icon in lucide ${version}.`
          : `generate-icons: \`${name}\` is an alias of \`${canonical}\` in lucide ${version}: use \`${canonical}\`.`,
      );
    }
    /** @type {unknown} */
    const nodes = (await import(pathToFileURL(file).href)).default;
    icons.push({ name, nodes: readNodes(name, nodes), feather: feather.has(name) });
  }
  return { icons, viewBox, version };
}

/** @param {string} version @returns {string} 08 Q3's header */
function header(version) {
  const lines = readLf(join(PACKAGE, 'LICENSE'))
    .split('\n')
    .filter((line) => line.startsWith('Copyright'));
  if (lines.length === 0)
    throw new Error('generate-icons: the package LICENSE has no copyright line.');
  return [
    '/*',
    ' * SPDX-License-Identifier: ISC AND MIT',
    ` * Adapted from lucide ${version}, dist/esm/icons (the icons listed in icon-set.json)`,
    ...lines.map((line) => ` * ${line}`),
    ' * Modifications Copyright (c) 2026 Loc Vo',
    ' *',
    ' * Generated by scripts/generate-icons.mjs (npm run generate:icons). Do not edit.',
    ' */',
    '',
  ].join('\n');
}

/** @param {string} value @returns {string} a single-quoted TypeScript string literal */
function quote(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

/** @param {Icon} icon @param {string} viewBox @returns {string} the constant with its JSDoc */
function constant(icon, viewBox) {
  const nodes = icon.nodes
    .map(([tag, attributes]) => {
      const props = Object.entries(attributes)
        .map(
          ([key, value]) => `${key}: ${typeof value === 'number' ? String(value) : quote(value)}`,
        )
        .join(', ');
      return `[${quote(tag)}, { ${props} }]`;
    })
    .join(', ');
  const doc = `The Lucide \`${icon.name}\` icon.${icon.feather ? ' Derived from Feather (MIT).' : ''}`;
  return `/** ${doc} */\nexport const wjIcon${pascal(icon.name)}: WjIconDef = { name: ${quote(icon.name)}, viewBox: ${quote(viewBox)}, nodes: [${nodes}] };\n`;
}

/** @param {string} file @param {string} source @returns {Promise<string>} Prettier-formatted */
async function pretty(file, source) {
  const options = await resolveConfig(file);
  return format(source, { ...options, filepath: file });
}

/** @param {string} version @returns {string | undefined} what is wrong with the notices, if anything */
function noticesProblem(version) {
  const licence = readLf(join(PACKAGE, 'LICENSE')).trimEnd();
  const notices = readLf(NOTICES);
  const start = notices.indexOf(`## lucide ${version}\n`);
  if (start === -1) return `THIRD-PARTY-NOTICES.md has no \`## lucide ${version}\` section.`;
  const next = notices.indexOf('\n## ', start + 1);
  const section = notices.slice(start, next === -1 ? undefined : next);
  return section.includes(`\`\`\`text\n${licence}\n\`\`\``)
    ? undefined
    : `THIRD-PARTY-NOTICES.md's \`## lucide ${version}\` section does not hold the package LICENSE verbatim.`;
}

const check = process.argv.includes('--check');
const { icons, viewBox, version } = await readIcons();
const body = [
  `import type { WjIconDef } from './icon-types';\n`,
  ...icons.map((icon) => constant(icon, viewBox)),
].join('\n');
const text = await pretty(SET_FILE, `${header(version)}\n${body}`);
const current = existsSync(SET_FILE) ? readFileSync(SET_FILE, 'utf8') : undefined;
const name = relative(ROOT, SET_FILE).split(sep).join('/');
const problems = [];
if (current !== text) {
  if (check) {
    problems.push(
      `${name} differs from the generated output. Run \`npm run generate:icons\` and commit the result.`,
    );
  } else {
    writeFileSync(SET_FILE, text, 'utf8');
    console.log(`generate-icons: wrote ${name} (${String(icons.length)} icons)`);
  }
}
if (check) {
  const problem = noticesProblem(version);
  if (problem !== undefined) problems.push(problem);
}
if (problems.length > 0) {
  console.error(`generate-icons: ${problems.join('\n')}`);
  process.exit(1);
}
