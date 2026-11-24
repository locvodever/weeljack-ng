// @ts-check
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The changelog tokens (FR-22). Turns release-please's root `CHANGELOG.md` into
 * `generated/changelog.json`, which the `/changelog` page renders through its template: no Markdown
 * library and no HTML, so a changelog line can never inject markup. `CHANGELOG.md` is read, never
 * edited (release-please owns it).
 *
 * Release headings are `## x.y.z (date)` or `## [x.y.z](url) (date)`, sections are `### Title`,
 * and a bullet is `* **scope:** text ([#n](url)) ([sha](url))`. Releases keep the file's order
 * (newest first).
 *
 * Inline tokens, all of one shape `{ type, text, href, entry }` (unused fields are `null`):
 * - `text`: plain text (a backslash escape is resolved);
 * - `code`: a backtick span;
 * - `strong`: a `**bold**` span (its text is not parsed further);
 * - `link`: `[text](url)`, only when the URL is `http(s)`; any other scheme (`javascript:`, `data:`,
 *   a relative path) stays plain text, the link's own text;
 * - `component`: `wj-<entry>` or `` `wj-<entry>` `` when `<entry>` is shipped in `catalog.json`
 *   (`text` is `wj-<entry>`, `entry` the slug); an unshipped name stays text or code.
 *
 * A line that is none of those shapes (a prose line, or a bullet outside any section) becomes a
 * plain-text paragraph in its release's `notes`, never a failure. Lines before the first release
 * (the `# Changelog` title) belong to no release and are dropped.
 *
 * Guards (each failure is collected, then the script exits 1): a missing `CHANGELOG.md`, a missing
 * `catalog.json`, and no releases at all.
 *
 * @typedef {{ type: 'text' | 'code' | 'strong' | 'link' | 'component', text: string,
 *   href: string | null, entry: string | null }} Token
 * @typedef {{ title: string, items: Token[][] }} Section
 * @typedef {{ version: string, date: string | null, url: string | null, sections: Section[],
 *   notes: string[] }} Release
 * @typedef {{ releases: Release[] }} ChangelogDocument
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelogFile = join(root, 'CHANGELOG.md');
const catalogFile = join(root, 'projects', 'docs', 'src', 'generated', 'catalog.json');
const outFile = join(root, 'projects', 'docs', 'src', 'generated', 'changelog.json');

const DATE = String.raw`(?:\s+\((\d{4}-\d{2}-\d{2})\))?\s*$`;
const LINKED_RELEASE = new RegExp(
  String.raw`^##\s+\[(v?\d+\.\d+\.\d+[^\]\s]*)\]\(([^)\s]*)\)` + DATE,
);
const PLAIN_RELEASE = new RegExp(String.raw`^##\s+(v?\d+\.\d+\.\d+\S*)` + DATE);
const SECTION = /^###\s+(\S.*?)\s*$/;
const BULLET = /^\s*[*-]\s+(\S.*)$/;
const HTTP_URL = /^https?:\/\/\S+$/i;

/** One alternative per inline shape; the first group that matched says which. */
const INLINE =
  /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]*)\]\(([^)\s]*)\)|(?<![\w-])wj-([a-z0-9]+)(?![\w-])/g;

/** @param {string} text a Markdown backslash escape, resolved */
function unescape(text) {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1');
}

/**
 * Splits one line of changelog text into tokens.
 * @param {string} line
 * @param {ReadonlySet<string>} shipped entries that have a page (`wj-<entry>` links only to these)
 * @returns {Token[]}
 */
export function parseInline(line, shipped) {
  /** @type {Token[]} */
  const tokens = [];
  /** @param {Token['type']} type @param {string} text @param {string | null} [href] @param {string | null} [entry] */
  const push = (type, text, href = null, entry = null) => {
    const last = tokens[tokens.length - 1];
    if (type === 'text' && last?.type === 'text') {
      last.text += text;
    } else if (text !== '' || type === 'component') {
      tokens.push({ type, text, href, entry });
    }
  };
  let cursor = 0;
  for (const match of line.matchAll(INLINE)) {
    push('text', unescape(line.slice(cursor, match.index)));
    cursor = match.index + match[0].length;
    const [whole, strong, code, linkText, linkUrl, bare] = match;
    if (strong !== undefined) {
      push('strong', unescape(strong));
    } else if (code !== undefined) {
      const entry = /^wj-([a-z0-9]+)$/.exec(code)?.[1];
      if (entry !== undefined && shipped.has(entry)) push('component', code, null, entry);
      else push('code', code);
    } else if (linkText !== undefined && linkUrl !== undefined) {
      if (HTTP_URL.test(linkUrl)) push('link', unescape(linkText), linkUrl);
      else push('text', unescape(linkText));
    } else if (bare !== undefined) {
      if (shipped.has(bare)) push('component', whole, null, bare);
      else push('text', whole);
    }
  }
  push('text', unescape(line.slice(cursor)));
  return tokens;
}

/**
 * Parses `CHANGELOG.md` into releases, or reports why it cannot.
 * @param {string} markdown
 * @param {ReadonlySet<string>} shipped entries that have a page
 * @returns {{ document: ChangelogDocument | null, failures: string[] }}
 */
export function parseChangelog(markdown, shipped) {
  /** @type {Release[]} */
  const releases = [];
  /** @type {Release | null} */
  let release = null;
  /** @type {Section | null} */
  let section = null;

  for (const line of markdown.split(/\r?\n/)) {
    const linked = LINKED_RELEASE.exec(line);
    const heading = linked ?? PLAIN_RELEASE.exec(line);
    if (heading !== null) {
      const url = linked !== null && HTTP_URL.test(heading[2] ?? '') ? (heading[2] ?? null) : null;
      const date = (linked === null ? heading[2] : heading[3]) ?? null;
      release = { version: heading[1] ?? '', date, url, sections: [], notes: [] };
      releases.push(release);
      section = null;
      continue;
    }
    if (release === null || line.trim() === '') continue;
    const title = SECTION.exec(line)?.[1];
    if (title !== undefined) {
      section = { title, items: [] };
      release.sections.push(section);
      continue;
    }
    const bullet = BULLET.exec(line)?.[1];
    if (bullet !== undefined && section !== null) {
      section.items.push(parseInline(bullet, shipped));
    } else {
      release.notes.push(line.trim());
    }
  }

  if (releases.length === 0) {
    return {
      document: null,
      failures: [
        'CHANGELOG.md has no release heading (## x.y.z (date) or ## [x.y.z](url) (date)).',
      ],
    };
  }
  return { document: { releases }, failures: [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  /** @type {string[]} */
  const failures = [];
  /** @type {Set<string>} */
  const shipped = new Set();
  if (existsSync(catalogFile)) {
    /** @type {{ groups: { rows: { entry: string, status: string }[] }[] }} */
    const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'));
    for (const group of catalog.groups) {
      for (const row of group.rows) if (row.status === 'shipped') shipped.add(row.entry);
    }
  } else {
    failures.push(`${catalogFile} does not exist. Run extract-catalog first (npm run generate).`);
  }
  /** @type {ChangelogDocument | null} */
  let document = null;
  if (existsSync(changelogFile)) {
    const parsed = parseChangelog(readFileSync(changelogFile, 'utf8'), shipped);
    document = parsed.document;
    failures.push(...parsed.failures);
  } else {
    failures.push(`${changelogFile} does not exist.`);
  }
  if (document === null || failures.length > 0) {
    console.error(`extract-changelog: guard failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(document, null, 2)}\n`);
  const summary = document.releases
    .map((item) => {
      const count = item.sections.reduce((sum, part) => sum + part.items.length, 0);
      return `${item.version} (${String(item.sections.length)} section(s), ${String(count)} item(s))`;
    })
    .join(', ');
  console.log(`extract-changelog: ${String(document.releases.length)} release(s): ${summary}`);
}
