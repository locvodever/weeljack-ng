import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATALOG, chipOf, type CatalogRow } from '../../catalog/catalog';
import { DocsText } from '../../text/text';

/** One row of the selectors table: a shipped entry, or a planned one with its wave. */
interface SelectorRow {
  row: CatalogRow;
  /** The wave a planned row is planned for; `null` for a shipped row. */
  plannedWave: number | null;
}

/** Sorts by the Optimus selector with `[`, `]` and `-` ignored, case-insensitive (ui-spec D2). */
function sortKey(row: CatalogRow): string {
  return (row.optimusSelector ?? row.entry).replace(/[[\]-]/g, '').toLowerCase();
}

/** A plain code-unit comparison, so the server and the browser order rows the same way. */
const byKey = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const ROWS: SelectorRow[] = CATALOG.groups.flatMap((group) =>
  group.rows.map((row) => ({ row, plannedWave: row.status === 'planned' ? group.wave : null })),
);

/**
 * `/guides/from-optimus` (FR-11, ui-spec D): one sorted table of selectors (planned rows
 * interleaved), the WeeljackNg-only entries, the not-wrapped rows and the services. Reads
 * `catalog.json` only.
 */
@Component({
  selector: 'docs-from-optimus-page',
  imports: [RouterLink, DocsText],
  templateUrl: './from-optimus.html',
  styleUrl: './from-optimus.css',
})
export class FromOptimusPage {
  private readonly document = inject(DOCUMENT);

  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  /** The in-page list, in the order of the sections below. */
  protected readonly sections = [
    { id: 'selectors', title: 'Selectors' },
    { id: 'own', title: 'WeeljackNg only' },
    { id: 'not-wrapped', title: 'Not wrapped' },
    { id: 'services', title: 'Services' },
    { id: 'inputs-and-setup', title: 'Inputs and setup' },
  ] as const;

  protected readonly selectors = ROWS.filter((item) => !item.row.own).sort(
    (a, b) => byKey(sortKey(a.row), sortKey(b.row)) || byKey(a.row.entry, b.row.entry),
  );

  protected readonly own = ROWS.filter((item) => item.row.own);

  protected readonly notWrapped = CATALOG.notWrapped;

  /** Entries that ship a service, a service-only entry among them. */
  protected readonly services = ROWS.filter(
    (item) => item.plannedWave === null && item.row.services.length > 0,
  );

  protected readonly chipOf = chipOf;

  /**
   * A bare `#id` would resolve against `<base href>`, and a same-document jump reaches the router
   * as a popstate that moves focus to the `h1`. So each link keeps a real relative `href` (it works
   * without script) and, on click, focuses the heading itself (the theming page's pattern).
   */
  protected jump(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.focus();
  }
}
