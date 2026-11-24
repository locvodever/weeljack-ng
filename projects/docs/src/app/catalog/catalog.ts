import catalogJson from '../../generated/catalog.json';

/** A WeeljackNg service an entry ships (from the entry's generated API). */
export interface CatalogService {
  name: string;
  description: string;
}

/**
 * One entry of the catalog, as `scripts/extract-catalog.mjs` writes it. A planned row has no page
 * yet, so its content fields are `null`; a service-only entry (no class) has a `null` `wjSelector`.
 */
export interface CatalogRow {
  entry: string;
  /** `shipped` (it is in the API index) or `planned` (a 03 target that is not shipped yet). */
  status: string;
  /** WeeljackNg's own component (`field`, `sheet`), not a wrapper. */
  own: boolean;
  title: string | null;
  purpose: string | null;
  wjSelector: string | null;
  optimusSelector: string | null;
  kind: string | null;
  services: CatalogService[];
}

/** One of 03's wave groups, with its rows in 03's order. */
export interface CatalogGroup {
  id: string;
  label: string;
  /** The wave number; W5a to W5d all read 5. */
  wave: number;
  rows: CatalogRow[];
}

/** An Optimus entry WeeljackNg does not wrap, and what to use instead (03 Q1, Q2, Q6). */
export interface NotWrappedRow {
  /** The Optimus entries the row stands for; a `components/<slug>` URL matches one of these. */
  entries: string[];
  label: string;
  why: string;
  useInstead: string;
}

export interface Catalog {
  groups: CatalogGroup[];
  notWrapped: NotWrappedRow[];
}

/** `generated/catalog.json`, checked against the generator's shape by this assignment. */
export const CATALOG: Catalog = catalogJson;

/**
 * What a row's selector chip shows: its `wj` selector, or the first service name for a service-only
 * entry (no class, so no selector).
 */
export function chipOf(row: CatalogRow): string | null {
  return row.wjSelector ?? row.services[0]?.name ?? null;
}

/** The planned row for a `components/<slug>` URL, with the wave it is planned for. */
export function plannedFor(slug: string): { wave: number } | undefined {
  for (const group of CATALOG.groups) {
    if (group.rows.some((row) => row.entry === slug && row.status === 'planned')) {
      return { wave: group.wave };
    }
  }
  return undefined;
}

/** The not-wrapped row for a `components/<slug>` URL. */
export function notWrappedFor(slug: string): NotWrappedRow | undefined {
  return CATALOG.notWrapped.find((row) => row.entries.includes(slug));
}
