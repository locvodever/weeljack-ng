// @ts-check

/**
 * The selector probes behind `check:ssr`, kept pure so they can be exercised without a build.
 *
 * @typedef {{ selector: string }} ApiClassSelector
 * @typedef {{ classes: ApiClassSelector[] }} ApiFile
 * @typedef {{ selector: string, search: RegExp, viaComponent: boolean }} Probe
 *   `viaComponent`: an `ng-template` selector (a slot directive). A template serializes as a
 *   comment, so it is covered when a component probe from the same API file is covered.
 * @typedef {{ own: Probe[], components: Probe[] }} FileProbes
 */

/**
 * One probe per exported `wj` selector of one generated API file.
 * @param {ApiFile} api
 * @returns {FileProbes}
 */
export function probesFor(api) {
  /** @type {Probe[]} */
  const own = [];
  /** @type {Probe[]} */
  const components = [];
  for (const { selector } of api.classes) {
    for (const single of selector.split(',').map((part) => part.trim())) {
      const element = /^([a-z][\w-]*)/.exec(single)?.[1];
      const attribute = /\[([\w-]+)/.exec(single)?.[1];
      if (element?.startsWith('wj-') === true) {
        const probe = {
          selector: single,
          search: new RegExp(`<${element}[\\s>]`, 'i'),
          viaComponent: false,
        };
        own.push(probe);
        components.push(probe);
      } else if (attribute?.startsWith('wj') === true) {
        own.push({
          selector: single,
          search: new RegExp(`\\s${attribute}[\\s=>]`, 'i'),
          viaComponent: element === 'ng-template',
        });
      }
    }
  }
  return { own, components };
}

/**
 * The probes that no page satisfies. An `ng-template` probe is satisfied when one of its own
 * file's component probes is; everything else must appear on a page itself.
 * @param {FileProbes[]} files
 * @param {string[]} pages prerendered HTML
 * @returns {Probe[]}
 */
export function missingProbes(files, pages) {
  /** @param {Probe} probe */
  const found = (probe) => pages.some((page) => probe.search.test(page));
  return files.flatMap(({ own, components }) =>
    own.filter((probe) => (probe.viaComponent ? !components.some(found) : !found(probe))),
  );
}

/**
 * Whether some `wj-icon` element in prerendered HTML holds, before its closing tag, an `svg` with a
 * `viewBox` and at least one shape element (FR-21). An icon that only reached the server as an
 * empty `<wj-icon>` fails.
 * @param {string} html prerendered HTML
 * @returns {boolean}
 */
export function hasRenderedIconSvg(html) {
  return [...html.matchAll(/<wj-icon[\s>][\s\S]*?<\/wj-icon>/gi)].some(
    ([icon]) =>
      /<svg\b[^>]*\sviewBox=/i.test(icon) &&
      /<(?:path|circle|rect|line|polyline|polygon|ellipse)[\s/>]/i.test(icon),
  );
}
